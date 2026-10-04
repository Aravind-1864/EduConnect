import { ApiError } from './ApiError.js';

/** Video providers a teacher may paste a link for. Anything else is rejected so links shared in class are trustworthy. */
const PROVIDERS = [
  { name: 'Google Meet', match: (h) => h === 'meet.google.com' },
  { name: 'Zoom', match: (h) => h === 'zoom.us' || h.endsWith('.zoom.us') },
  { name: 'Microsoft Teams', match: (h) => h === 'teams.microsoft.com' || h === 'teams.live.com' },
];

export function providerFor(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PROVIDERS.find((p) => p.match(host))?.name ?? null;
  } catch {
    return null;
  }
}

const MEET_PATH = /^\/(lookup\/.+|[a-z]{3}-[a-z]{4}-[a-z]{3})\/?$/i;

/** Accepts a pasted Google Meet / Zoom / Teams meeting link (https:// optional); returns it normalised, or throws. */
export function normaliseMeetingUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    url = null;
  }
  const provider = url && providerFor(url.href);
  if (!provider || url.username || url.password) {
    throw ApiError.badRequest('Paste a Google Meet, Zoom or Microsoft Teams link, like https://meet.google.com/abc-defg-hij');
  }
  if (url.pathname === '/' || (provider === 'Google Meet' && !MEET_PATH.test(url.pathname))) {
    throw ApiError.badRequest(`That isn't a meeting link yet. Create a ${provider} meeting first, then paste its link.`);
  }
  url.protocol = 'https:';
  if (url.href.length > 500) throw ApiError.badRequest('That link is too long');
  return url.href;
}
