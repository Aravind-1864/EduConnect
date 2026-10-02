import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { ApiError } from './ApiError.js';

/*
 * Google Meet integration (OAuth 2.0 + Meet REST API v2).
 * Creating a meeting needs a signed-in Google account, not an API key, so each tutor
 * connects their account once; we keep only the refresh token, server-side.
 */

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const MEET_SPACES_URL = 'https://meet.googleapis.com/v2/spaces';
const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/meetings.space.created'];

export const MEET_URL_RE = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/i;

/** Accepts a pasted Meet link (with or without https://) and returns it normalised, or throws. */
export function normaliseMeetUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  const url = /^https?:\/\//i.test(raw) ? raw.replace(/^http:/i, 'https:') : `https://${raw}`;
  if (!MEET_URL_RE.test(url)) throw ApiError.badRequest('Enter a valid Google Meet link, like https://meet.google.com/abc-defg-hij');
  return url;
}

export const redirectUri = (req) => env.google.redirectUri || `${req.protocol}://${req.get('host')}/api/google/callback`;

export function buildAuthUrl(req) {
  if (!env.google.enabled) throw ApiError.badRequest('Google integration is not configured on this server');
  // The state ties the callback to this user and expires quickly (CSRF protection).
  const state = jwt.sign({ sub: String(req.user._id), purpose: 'google-oauth' }, env.jwtSecret, { expiresIn: '10m' });
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // always return a refresh token
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_URL}?${params}`;
}

async function tokenRequest(body) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.google.clientId, client_secret: env.google.clientSecret, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(502, `Google sign-in failed: ${data.error_description || data.error || res.status}`);
  return data;
}

/** Handles the OAuth callback: verifies state, exchanges the code and stores the refresh token. */
export async function completeConnection(req) {
  const { code, state, error } = req.query;
  if (error) throw ApiError.badRequest(`Google sign-in was cancelled (${error})`);
  let payload;
  try {
    payload = jwt.verify(String(state), env.jwtSecret);
  } catch {
    throw ApiError.badRequest('Google sign-in link expired, please try again');
  }
  if (payload.purpose !== 'google-oauth') throw ApiError.badRequest('Invalid sign-in state');

  const tokens = await tokenRequest({ code: String(code), grant_type: 'authorization_code', redirect_uri: redirectUri(req) });
  if (!tokens.refresh_token) throw ApiError.badRequest('Google did not return offline access; please try connecting again');
  if (!String(tokens.scope || '').includes('meetings.space.created')) {
    throw ApiError.badRequest('Please allow "Create Google Meet conferences" when connecting your Google account');
  }

  const email = tokens.id_token ? JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString()).email : undefined;
  await User.updateOne(
    { _id: payload.sub },
    { $set: { 'google.email': email, 'google.refreshToken': tokens.refresh_token, 'google.connectedAt': new Date() } }
  );
}

export async function disconnect(userId) {
  const user = await User.findById(userId).select('+google.refreshToken');
  const token = user?.google?.refreshToken;
  await User.updateOne({ _id: userId }, { $unset: { google: 1 } });
  if (token) {
    // Best effort: revoke access at Google too.
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => {});
  }
}

/** Creates a new Meet space as the given tutor and returns its join link. */
export async function createMeetLink(userId) {
  if (!env.google.enabled) throw ApiError.badRequest('Automatic Meet links are not configured on this server; paste a Meet link instead');
  const user = await User.findById(userId).select('+google.refreshToken');
  if (!user?.google?.refreshToken) throw ApiError.badRequest('Connect your Google account in Profile first, or paste a Meet link');

  let access;
  try {
    access = await tokenRequest({ refresh_token: user.google.refreshToken, grant_type: 'refresh_token' });
  } catch {
    // Refresh token revoked or expired: forget it so the UI asks to reconnect.
    await User.updateOne({ _id: userId }, { $unset: { google: 1 } });
    throw ApiError.badRequest('Your Google connection expired. Reconnect Google in Profile, or paste a Meet link');
  }

  const res = await fetch(MEET_SPACES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access.access_token}`, 'Content-Type': 'application/json' },
    // OPEN: anyone with the link (students without a Google Workspace account) joins without knocking.
    body: JSON.stringify({ config: { accessType: 'OPEN' } }),
  });
  const space = await res.json().catch(() => ({}));
  if (!res.ok || !space.meetingUri) {
    throw new ApiError(502, `Google Meet could not create a meeting: ${space.error?.message || res.status}`);
  }
  return space.meetingUri;
}

/**
 * Resolves the Meet link for a session/booking from the request body:
 * an explicit `meetUrl` wins; otherwise `autoMeet: true` creates one with the tutor's Google account.
 */
export async function resolveMeetUrl(body, tutorId) {
  if (body.meetUrl) return { meetUrl: normaliseMeetUrl(body.meetUrl), byApi: false };
  if (body.autoMeet === true || body.autoMeet === 'true') return { meetUrl: await createMeetLink(tutorId), byApi: true };
  return { meetUrl: '', byApi: false };
}
