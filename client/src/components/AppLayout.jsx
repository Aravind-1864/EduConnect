import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Award, BookOpen, CalendarCheck, CalendarClock, CalendarDays, Flame, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Shield,
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
    <span className={cx('flex items-center gap-2.5 text-xl font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
      <span className="size-3.5 rounded-full bg-brand-500" />
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
    <button onClick={() => navigate('/focus')} className="card mb-3 w-full p-4 text-left transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <Flame className={cx('size-4', streak ? 'text-brand-500' : 'text-slate-400')} /> {streak} day streak
        </span>
        <span className="text-xs font-semibold text-slate-500">{Math.round(today)}/{goal} min</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="hand mt-1.5 text-lg leading-none">{pct >= 100 ? 'goal reached, well done!' : 'start a focus session →'}</p>
    </button>
  );
}

const COLLAPSE_KEY = 'educonnect.sidebar.collapsed';
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [quote, author] = quoteOfTheDay();
  const title = PAGE_TITLES[`/${pathname.split('/')[1]}`] ?? 'EduConnect';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* storage unavailable */
      }
      return !c;
    });

  // `slim` = desktop icon-only sidebar. The mobile drawer is always full width.
  const renderSidebar = (slim) => (
    <nav className={cx('relative flex h-full flex-col overflow-hidden border-r-2 border-slate-900 bg-surface py-6 dark:border-slate-200', slim ? 'items-center px-3' : 'pl-8 pr-4')}>
      {!slim && <div className="pointer-events-none absolute inset-y-0 left-4 w-0.5 bg-margin" />}

      <div className={cx('relative mb-6 flex items-center', slim ? 'justify-center' : 'justify-between px-2')}>
        {slim ? <span className="size-4 rounded-full bg-brand-500" title="EduConnect" /> : <Logo />}
        <button className="text-slate-500 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>

      <div className={cx('relative flex-1 space-y-6 overflow-y-auto', !slim && 'pr-1')}>
        {NAV[user.role].map(([group, items]) => (
          <div key={group}>
            {slim ? <div className="mx-auto mb-2 h-0.5 w-6 rounded bg-slate-200" /> : <p className="hand mb-1 px-3 text-xl leading-none">{group.toLowerCase()}</p>}
            <ul className="space-y-1">
              {items.map(({ to, label, icon: Icon, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => setOpen(false)}
                    title={slim ? label : undefined}
                    aria-label={slim ? label : undefined}
                    className={({ isActive }) =>
                      cx(
                        'group relative flex items-center rounded-xl border-2 py-2 text-sm font-bold transition',
                        slim ? 'justify-center px-2' : 'gap-3 px-3',
                        isActive
                          ? 'border-slate-900 bg-highlight text-ink shadow-[3px_3px_0_var(--color-slate-900)] dark:border-slate-300 dark:text-slate-900 dark:shadow-[3px_3px_0_#0a0f19]'
                          : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )
                    }
                  >
                    <Icon className="size-5 shrink-0" />
                    {!slim && label}
                    {badge && !slim && <span className="ml-auto rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
                    {badge && slim && <span className="absolute right-1 top-1 size-2 rounded-full bg-brand-500" />}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {user.role !== 'admin' && !slim && (
          <div className="rounded-xl bg-paper p-4 dark:bg-slate-100">
            <p className="hand text-xl leading-none">thought of the day</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">“{quote}”</p>
            <p className="mt-1 text-xs text-slate-500">— {author}</p>
          </div>
        )}
      </div>

      <div className={cx('relative mt-4 w-full border-t-2 border-dashed border-slate-200 pt-4', slim && 'flex flex-col items-center gap-2')}>
        {user.role !== 'admin' && !slim && <StreakCard userId={user._id} />}
        {slim ? (
          <>
            <NavLink to="/profile" title="Profile" aria-label="Profile">
              <Avatar user={user} />
            </NavLink>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-5" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <NavLink to="/profile" onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:opacity-90">
              <Avatar user={user} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-xs capitalize text-slate-500">{user.role} · View profile</p>
              </div>
            </NavLink>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );

  return (
    <div className={cx('paper min-h-screen transition-[padding]', collapsed ? 'lg:pl-20' : 'lg:pl-72')}>
      <aside className={cx('fixed inset-y-0 left-0 z-40 hidden transition-[width] lg:block', collapsed ? 'w-20' : 'w-72')}>{renderSidebar(collapsed)}</aside>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 animate-fade-up">{renderSidebar(false)}</div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b-2 border-slate-900 bg-paper/90 px-4 backdrop-blur sm:px-8 dark:border-slate-200">
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <button
          className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:block"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </button>
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-slate-900">{title}</p>
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
