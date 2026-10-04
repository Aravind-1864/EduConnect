import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Award, BookOpen, CalendarCheck, CalendarClock, CalendarDays, Flame, GraduationCap, LayoutDashboard, LogOut, Menu, Shield,
  Timer, UserRound, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStats, quoteOfTheDay } from '../utils/studyStats';
import { NotificationBell, ThemeToggle } from './HeaderWidgets';
import { Avatar, cx } from './ui';

const NAV = {
  student: [
    ['Learn', [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/classes', label: 'My Classrooms', icon: BookOpen },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
      { to: '/grades', label: 'My Grades', icon: Award },
    ]],
    ['Study tools', [
      { to: '/focus', label: 'Focus Timer', icon: Timer, badge: 'New' },
    ]],
    ['Tutoring', [
      { to: '/tutors', label: 'Find Tutors', icon: Users },
      { to: '/bookings', label: 'My Bookings', icon: CalendarCheck },
    ]],
  ],
  tutor: [
    ['Teach', [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/classes', label: 'My Classrooms', icon: BookOpen },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    ]],
    ['Tutoring', [
      { to: '/bookings', label: '1-on-1 Requests', icon: CalendarCheck },
      { to: '/availability', label: 'My Availability', icon: CalendarClock },
    ]],
    ['Tools', [
      { to: '/focus', label: 'Focus Timer', icon: Timer },
    ]],
  ],
  admin: [
    ['Manage', [
      { to: '/admin', label: 'Admin Overview', icon: Shield },
      { to: '/classes', label: 'All Classrooms', icon: BookOpen },
      { to: '/tutors', label: 'Tutors', icon: Users },
    ]],
  ],
};

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/classes': 'Classrooms',
  '/calendar': 'Calendar',
  '/grades': 'My Grades',
  '/focus': 'Focus Timer',
  '/tutors': 'Tutors',
  '/bookings': 'Bookings',
  '/availability': 'My Availability',
  '/profile': 'Profile',
  '/admin': 'Admin',
};

export function Logo({ light }) {
  return (
    <span className={cx('flex items-center gap-2 text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
      <span className="rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 p-1.5 shadow-lg shadow-brand-600/30">
        <GraduationCap className="size-5 text-white" />
      </span>
      EduConnect
    </span>
  );
}

function useStudyStats(userId) {
  const [stats, setStats] = useState(() => getStats(userId));
  useEffect(() => {
    const update = () => setStats(getStats(userId));
    window.addEventListener('study:updated', update);
    return () => window.removeEventListener('study:updated', update);
  }, [userId]);
  return stats;
}

function StreakCard({ userId }) {
  const navigate = useNavigate();
  const { today, goal, streak } = useStudyStats(userId);
  const pct = Math.min(100, Math.round((today / goal) * 100));
  return (
    <button onClick={() => navigate('/focus')} className="mb-3 w-full rounded-2xl bg-gradient-to-br from-brand-600/60 to-purple-600/40 p-4 text-left ring-1 ring-white/10 transition hover:ring-white/25">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <Flame className={cx('size-4', streak ? 'text-orange-400' : 'text-brand-200')} /> {streak} day streak
        </span>
        <span className="text-xs text-brand-200">{Math.round(today)}/{goal} min</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-brand-200">{pct >= 100 ? 'Daily goal reached - amazing! 🎉' : 'Start a focus session →'}</p>
    </button>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [quote, author] = quoteOfTheDay();
  const title = PAGE_TITLES[`/${pathname.split('/')[1]}`] ?? 'EduConnect';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const sidebar = (
    <nav className="relative flex h-full flex-col overflow-hidden bg-brand-950 px-4 py-6">
      <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 size-64 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="relative mb-6 flex items-center justify-between px-2">
        <Logo light />
        <button className="text-brand-200 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex-1 space-y-6 overflow-y-auto pr-1">
        {NAV[user.role].map(([group, items]) => (
          <div key={group}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-brand-300/60">{group}</p>
            <ul className="space-y-1">
              {items.map(({ to, label, icon: Icon, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cx(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                        isActive
                          ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-900/50'
                          : 'text-brand-200 hover:bg-white/5 hover:text-white'
                      )
                    }
                  >
                    <Icon className="size-5 transition group-hover:scale-110" />
                    {label}
                    {badge && <span className="ml-auto rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {user.role !== 'admin' && (
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300/70">Thought of the day</p>
            <p className="mt-2 text-sm italic leading-relaxed text-white/85">“{quote}”</p>
            <p className="mt-1 text-xs text-brand-300/70">— {author}</p>
          </div>
        )}
      </div>

      <div className="relative mt-4 border-t border-white/10 pt-4">
        {user.role !== 'admin' && <StreakCard userId={user._id} />}
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <NavLink to="/profile" onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:opacity-90">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs capitalize text-brand-300">{user.role} · View profile</p>
            </div>
          </NavLink>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="rounded-lg p-2 text-brand-200 hover:bg-white/10 hover:text-white"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 animate-fade-up">{sidebar}</div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-surface/80 px-4 backdrop-blur-xl sm:px-8">
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            {greeting}, {user.name.split(' ')[0]} · {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
          <NavLink to="/profile" className="ml-2 hidden sm:block" aria-label="Profile">
            <Avatar user={user} />
          </NavLink>
        </div>
      </header>

      <main key={pathname} className="mx-auto max-w-7xl animate-fade-up px-4 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
