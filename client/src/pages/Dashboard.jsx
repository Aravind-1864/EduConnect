import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, CalendarCheck, CalendarDays, ClipboardList, Flame, GraduationCap, Inbox, Timer, Trophy, Users, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Avatar, Badge, Button, EmptyState, ErrorState, SectionCard, Spinner, StatCard, cx } from '../components/ui';
import { ClassCard, SessionRow } from '../components/shared';
import { fmtDateTime, fromNow, isOverdue } from '../utils/format';
import { getStats, quoteOfTheDay } from '../utils/studyStats';
import JoinMeetModal from '../components/JoinMeetModal';

function Sessions({ sessions }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  if (!sessions.length) return <EmptyState icon={Video} title="No upcoming class meets" text="Class meets created in your classrooms will show up here." />;
  const isTutor = user.role === 'tutor';
  return (
    <div className="space-y-3">
      {joining && <JoinMeetModal open onClose={() => setJoining(false)} />}
      {sessions.map((s) => {
        const canJoin = s.status === 'live' || user.role === 'tutor';
        return (
          <SessionRow
            key={s._id}
            session={s}
            classroom={s.classroom}
            action={
              <Button
                size="sm"
                variant={s.status === 'live' ? 'success' : 'secondary'}
                disabled={!canJoin}
                onClick={() => (isTutor ? navigate(`/live/${s.classroom._id}/${s._id}`) : setJoining(true))}
              >
                {isTutor ? (s.status === 'scheduled' ? 'Start' : 'Open') : 'Join with code'}
              </Button>
            }
          />
        );
      })}
    </div>
  );
}

function Bookings({ bookings, role }) {
  if (!bookings.length) return <p className="text-sm text-slate-500">No upcoming 1-on-1 sessions.</p>;
  return (
    <ul className="space-y-3">
      {bookings.map((b) => {
        const other = role === 'tutor' ? b.student : b.tutor;
        return (
          <li key={b._id} className="flex items-center gap-3">
            <Avatar user={other} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{b.subject} with {other.name}</p>
              <p className="text-xs text-slate-500">{fmtDateTime(b.startsAt)}</p>
            </div>
            <Badge color={b.status === 'confirmed' ? 'green' : 'yellow'}>{b.status}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

/** Minutes studied per day this week, from the Focus timer. */
function WeeklyStudy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { week, goal } = getStats(user._id);
  const max = Math.max(goal, ...week.map((d) => d.minutes), 1);
  const total = Math.round(week.reduce((sum, d) => sum + d.minutes, 0));
  const daysMet = week.filter((d) => d.minutes >= goal).length;

  return (
    <SectionCard title="This week's study" action={<button onClick={() => navigate('/focus')} className="text-sm font-bold text-brand-600 hover:underline">Focus timer</button>}>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-slate-900">{total}</p>
        <p className="text-sm text-slate-500">minutes · goal met on {daysMet}/7 days</p>
      </div>
      <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label={`Study minutes this week: ${week.map((d) => Math.round(d.minutes)).join(', ')}`}>
        {week.map(({ date, minutes }) => {
          const today = date.toDateString() === new Date().toDateString();
          return (
            <div key={date.toISOString()} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cx('w-full rounded-md border-2 border-slate-900 dark:border-slate-300', minutes >= goal ? 'bg-emerald-500' : today ? 'bg-brand-500' : 'bg-highlight')}
                  style={{ height: `${Math.max(6, (minutes / max) * 100)}%`, opacity: minutes ? 1 : 0.35 }}
                  title={`${Math.round(minutes)} min`}
                />
              </div>
              <span className={cx('text-xs', today ? 'font-extrabold text-brand-600' : 'text-slate-500')}>{date.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function StudentDashboard({ data }) {
  const { stats } = data;
  return (
    <>
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled classes" value={stats.classes} icon={BookOpen} />
        <StatCard label="Pending assignments" value={stats.pendingAssignments} icon={ClipboardList} tone="amber" />
        <StatCard label="Upcoming sessions" value={stats.upcomingSessions} icon={Video} tone="green" />
        <StatCard label="Average grade" value={stats.averageGrade === null ? '—' : `${stats.averageGrade}%`} icon={Trophy} tone="pink" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard title="Upcoming class meets" className="lg:col-span-2">
          <Sessions sessions={data.upcomingSessions} />
        </SectionCard>
        <SectionCard title="Assignments due">
          {data.pendingAssignments.length ? (
            <ul className="divide-y divide-slate-100">
              {data.pendingAssignments.map((a) => (
                <li key={a._id}>
                  <Link to={`/classes/${a.classroom._id}/assignments/${a._id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brand-600">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.classroom.title}</p>
                    </div>
                    <Badge color={isOverdue(a.dueDate) ? 'red' : 'yellow'}>{isOverdue(a.dueDate) ? 'Overdue' : `Due ${fromNow(a.dueDate)}`}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">You're all caught up 🎉</p>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <WeeklyStudy />
        <SectionCard title="Recent grades">
          {data.recentGrades.length ? (
            <ul className="space-y-3">
              {data.recentGrades.map((s) => (
                <li key={s._id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{s.assignment.title}</span>
                  <span className="font-semibold text-emerald-600">{s.grade}/{s.assignment.maxMarks}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No graded work yet.</p>
          )}
        </SectionCard>
        <SectionCard title="1-on-1 sessions" className="md:col-span-2 xl:col-span-1" action={<Link to="/tutors" className="text-sm font-medium text-brand-600">Find a tutor</Link>}>
          <Bookings bookings={data.bookings} role="student" />
        </SectionCard>
      </div>
    </>
  );
}

function TutorDashboard({ data }) {
  const { stats } = data;
  return (
    <>
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active classes" value={stats.classes} icon={BookOpen} />
        <StatCard label="Total students" value={stats.students} icon={Users} tone="green" />
        <StatCard label="Waiting to grade" value={stats.toGrade} icon={ClipboardList} tone="amber" />
        <StatCard label="Booking requests" value={stats.pendingBookings} icon={CalendarCheck} tone="pink" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard title="Upcoming class meets" className="lg:col-span-2">
          <Sessions sessions={data.upcomingSessions} />
        </SectionCard>
        <SectionCard title="Needs grading">
          {data.toGrade.length ? (
            <ul className="divide-y divide-slate-100">
              {data.toGrade.map((s) => (
                <li key={s._id}>
                  <Link to={`/classes/${s.assignment.classroom._id}/assignments/${s.assignment._id}`} className="flex items-center gap-3 py-3 hover:text-brand-600">
                    <Avatar user={s.student} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.student.name}</p>
                      <p className="truncate text-xs text-slate-500">{s.assignment.title} · {fromNow(s.submittedAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Inbox} title="Inbox zero" text="No submissions waiting." />
          )}
        </SectionCard>
      </div>
      <SectionCard title="1-on-1 requests" className="mt-6" action={<Link to="/bookings" className="text-sm font-medium text-brand-600">Manage</Link>}>
        <Bookings bookings={data.bookings} role="tutor" />
      </SectionCard>
    </>
  );
}

function WelcomeBanner({ user, data }) {
  const navigate = useNavigate();
  const { today, goal, streak } = getStats(user._id);
  const [quote, author] = quoteOfTheDay();
  const pct = Math.min(100, Math.round((today / goal) * 100));
  const live = data.upcomingSessions.find((s) => s.status === 'live');
  const isTutor = user.role === 'tutor';

  return (
    <section className="card relative mb-6 overflow-hidden p-6 sm:p-8">
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <span className="hand text-2xl">{isTutor ? 'your classes today' : 'keep going'}</span>
          <h1 className="text-3xl font-black sm:text-4xl">
            Welcome back, <span className="highlight">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="mt-2 text-slate-600">
            {isTutor ? "Here's what's happening in your classes today." : `“${quote}” — ${author}`}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {live && (
              <Button variant="danger" size="sm" onClick={() => navigate(`/live/${live.classroom._id}/${live._id}`)}>
                <span className="size-2 animate-pulse rounded-full bg-white" /> Live now: {live.title}
              </Button>
            )}
            <Button variant="secondary" size="sm" icon={Timer} onClick={() => navigate('/focus')}>Start a focus session</Button>
            <Button variant="secondary" size="sm" icon={CalendarDays} onClick={() => navigate('/calendar')}>View calendar</Button>
          </div>
        </div>

        {!isTutor && (
          <div className="flex items-center gap-5 rounded-2xl bg-paper p-4 dark:bg-slate-100">
            <div className="relative size-20">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-slate-200)" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-brand-500)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${pct * 0.974} 100`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-slate-900">{pct}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Today's study goal</p>
              <p className="text-lg font-extrabold text-slate-900">{Math.round(today)} / {goal} min</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                <Flame className="size-4 text-brand-500" /> {streak} day streak
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/dashboard');

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <WelcomeBanner user={user} data={data} />
      {user.role === 'tutor' ? <TutorDashboard data={data} /> : <StudentDashboard data={data} />}

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My classes</h2>
          <Link to="/classes" className="text-sm font-medium text-brand-600">View all</Link>
        </div>
        {data.classes.length ? (
          <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.classes.slice(0, 6).map((c) => <ClassCard key={c._id} c={c} />)}
          </div>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="No classes yet"
            text={user.role === 'tutor' ? 'Create your first class to get started.' : 'Ask your tutor for a class code and join.'}
            action={<Link to="/classes"><Button>{user.role === 'tutor' ? 'Create class' : 'Join a class'}</Button></Link>}
          />
        )}
      </div>
    </>
  );
}
