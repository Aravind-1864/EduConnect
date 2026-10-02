/**
 * Local study tracking for the Focus timer: minutes studied per day, a daily goal,
 * and the current streak. Stored per user in localStorage (best-effort).
 */
const key = (userId) => `educonnect.study.${userId}`;
export const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD

function read(userId) {
  try {
    return JSON.parse(localStorage.getItem(key(userId))) ?? { days: {}, goal: 60, sessions: 0 };
  } catch {
    return { days: {}, goal: 60, sessions: 0 };
  }
}

function write(userId, data) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event('study:updated'));
}

export function getStats(userId) {
  const data = read(userId);
  const today = data.days[dayKey()] ?? 0;

  let streak = 0;
  const cursor = new Date();
  if ((data.days[dayKey(cursor)] ?? 0) < 1) cursor.setDate(cursor.getDate() - 1); // today not started yet doesn't break the streak
  while ((data.days[dayKey(cursor)] ?? 0) >= 1) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { date: d, minutes: data.days[dayKey(d)] ?? 0 };
  });

  const total = Object.values(data.days).reduce((a, b) => a + b, 0);
  return { today, goal: data.goal, streak, week, total, sessions: data.sessions };
}

export function addMinutes(userId, minutes, { completedSession = false } = {}) {
  const data = read(userId);
  const k = dayKey();
  data.days[k] = Math.round(((data.days[k] ?? 0) + minutes) * 10) / 10;
  if (completedSession) data.sessions += 1;
  write(userId, data);
}

export function setGoal(userId, goal) {
  const data = read(userId);
  data.goal = goal;
  write(userId, data);
}

export const QUOTES = [
  ['The expert in anything was once a beginner.', 'Helen Hayes'],
  ['Small daily improvements are the key to staggering long-term results.', 'Robin Sharma'],
  ['Success is the sum of small efforts, repeated day in and day out.', 'Robert Collier'],
  ['It always seems impossible until it is done.', 'Nelson Mandela'],
  ['Learning never exhausts the mind.', 'Leonardo da Vinci'],
  ['Focus on progress, not perfection.', 'Unknown'],
  ['The beautiful thing about learning is that no one can take it away from you.', 'B.B. King'],
];

export const quoteOfTheDay = () => QUOTES[new Date().getDate() % QUOTES.length];
