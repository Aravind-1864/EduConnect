import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export const fmtDateTime = (d) => {
  const date = new Date(d);
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
  return format(date, 'EEE, d MMM yyyy · h:mm a');
};

export const fmtDate = (d) => format(new Date(d), 'd MMM yyyy');
export const fmtTime = (d) => format(new Date(d), 'h:mm a');
export const fromNow = (d) => formatDistanceToNow(new Date(d), { addSuffix: true });
export const isOverdue = (d) => isPast(new Date(d));

export const fmtBytes = (n) => {
  if (!n) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
};

/** Value for <input type="datetime-local"> in the user's local time zone. */
export const toLocalInput = (d) => {
  const date = new Date(d);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
