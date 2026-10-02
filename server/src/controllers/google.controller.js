import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { asyncHandler } from '../utils/ApiError.js';
import { buildAuthUrl, completeConnection, disconnect } from '../utils/googleMeet.js';

/** Whether automatic Meet links are available, and whether this user has connected Google. */
export const status = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+google.refreshToken');
  res.json({
    configured: env.google.enabled,
    connected: Boolean(user?.google?.refreshToken),
    email: user?.google?.email ?? null,
  });
});

export const authUrl = asyncHandler(async (req, res) => {
  res.json({ url: buildAuthUrl(req) });
});

/** Google redirects the browser here; we finish the connection and send the user back to Profile. */
export const callback = async (req, res) => {
  const back = new URL('/profile', env.clientUrl);
  try {
    await completeConnection(req);
    back.searchParams.set('google', 'connected');
  } catch (err) {
    back.searchParams.set('google', 'error');
    back.searchParams.set('message', err.message || 'Could not connect Google');
  }
  res.redirect(back.toString());
};

export const disconnectGoogle = asyncHandler(async (req, res) => {
  await disconnect(req.user._id);
  res.json({ connected: false });
});
