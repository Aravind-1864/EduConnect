/** Mirrors the server's rules for which meeting links a teacher may paste. */
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

/** Empty string when the text is empty or a valid Meet/Zoom/Teams meeting link, otherwise a message to show. */
export function meetingLinkError(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    url = null;
  }
  const provider = url && providerFor(url.href);
  if (!provider) return 'Paste a Google Meet, Zoom or Teams link, like https://meet.google.com/abc-defg-hij';
  if (url.pathname === '/' || (provider === 'Google Meet' && !MEET_PATH.test(url.pathname))) {
    return `That is not a meeting link yet. Create a ${provider} meeting first, then paste its link.`;
  }
  return '';
}
