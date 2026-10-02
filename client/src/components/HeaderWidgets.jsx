import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/SocketContext';
import { fromNow } from '../utils/format';
import { cx } from './ui';

export function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      className={cx('relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800', className)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun className="size-5 text-amber-400" /> : <Moon className="size-5" />}
    </button>
  );
}

export function NotificationBell() {
  const { notifications, unread, markAllRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) markAllRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800" aria-label="Notifications">
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unread}</span>
        )}
      </button>
      {open && (
        <div className="card absolute right-0 z-50 mt-2 w-80 overflow-hidden shadow-xl animate-fade-up">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-900">Notifications</p>
            {notifications.length > 0 && (
              <button onClick={clear} className="text-xs text-slate-500 hover:text-slate-800">Clear all</button>
            )}
          </div>
          {notifications.length ? (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link to={n.link ?? '#'} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-slate-50">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="text-sm text-slate-500">{n.body}</p>
                    <p className="mt-1 text-xs text-slate-400">{fromNow(n.at)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">You're all caught up</p>
              <p className="text-xs text-slate-400">Grades, bookings and updates will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
