import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ClipboardCheck, KeyRound, MessagesSquare, Timer, Users } from 'lucide-react';
import { Logo } from '../components/AppLayout';
import { ThemeToggle } from '../components/HeaderWidgets';

const STEPS = [
  ['Create a classroom', 'Name it “6th – A”. A five-digit code is made for you.'],
  ['Students join', 'They enter the code once. The classroom chat opens for everyone.'],
  ['Teach every day', 'Class meets, assignments and tutoring, all in one place.'],
];

const TEACHERS = [
  [KeyRound, 'Classroom codes', 'Share five digits in your WhatsApp group. No email invites, no spreadsheets.'],
  [MessagesSquare, 'One chat for the class', 'Announcements and meet codes land where students already look.'],
  [ClipboardCheck, 'Assignments and grading', 'Collect work online, give marks and feedback, see who hasn’t submitted.'],
  [CalendarClock, 'Your own tutoring hours', 'Open time slots for 1-on-1 sessions. Students book them in one click.'],
];

const STUDENTS = [
  [Users, 'Tutors for your class', 'Class 6 or BTech CSE: see tutors for exactly the subjects you study.'],
  [CheckCircle2, 'Join class meets with a code', 'Type the meet code from the chat and your attendance is recorded.'],
  [Timer, 'Focus timer and streaks', 'Study in short focused sprints and keep a daily streak going.'],
];

function StickyCard({ className, children }) {
  return <div className={`card absolute p-6 ${className}`}>{children}</div>;
}

function FeatureList({ items }) {
  return (
    <ul className="space-y-5">
      {items.map(([Icon, title, text]) => (
        <li key={title} className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-highlight text-ink dark:border-slate-300">
            <Icon className="size-5" />
          </span>
          <div>
            <h3 className="text-lg font-extrabold">{title}</h3>
            <p className="mt-1 leading-relaxed text-slate-600">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Landing() {
  return (
    <div className="paper relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-6 w-0.5 bg-margin sm:left-12 lg:left-[max(1.5rem,calc(50%-37rem))]" />

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
        <header className="flex items-center justify-between py-6">
          <Logo />
          <nav className="hidden gap-8 text-[15px] font-semibold text-slate-600 md:flex">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#teachers" className="hover:text-slate-900">Teachers</a>
            <a href="#students" className="hover:text-slate-900">Students</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="hidden px-2 font-bold text-slate-900 sm:block">Log in</Link>
            <Link to="/register" className="rounded-xl bg-brand-500 px-5 py-2.5 font-bold text-white shadow-[0_3px_0_var(--color-brand-700)] hover:bg-brand-600">
              Sign up
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-14 pb-20 pt-10 lg:grid-cols-2 lg:pt-16">
          <div className="animate-fade-up">
            <span className="hand inline-block -rotate-2 text-3xl sm:text-4xl">no more 5 different apps</span>
            <h1 className="mt-2 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Class, chat and homework, <span className="highlight">all in one notebook</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Teachers make a classroom and share a code. Students join, chat, attend class meets, hand in assignments and book a tutor when
              they’re stuck.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register?role=tutor" className="rounded-xl bg-brand-500 px-6 py-3 font-bold text-white shadow-[0_3px_0_var(--color-brand-700)] hover:bg-brand-600">
                I’m a teacher
              </Link>
              <Link to="/register?role=student" className="rounded-xl border-2 border-slate-900 bg-surface px-6 py-3 font-bold text-slate-900 shadow-[0_3px_0_var(--color-slate-900)] hover:bg-slate-50 dark:border-slate-300">
                I’m a student
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-500">Free to use · Works in any browser, on phone or laptop</p>
          </div>

          <div className="relative hidden h-[460px] sm:block" aria-hidden="true">
            <StickyCard className="left-2 top-2 w-[22rem] -rotate-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Classroom · 6th – A</p>
              <p className="mt-1 font-mono text-5xl font-bold tracking-[0.2em] text-slate-900">48213</p>
              <p className="mt-1 text-[15px] text-slate-600">Share this code with your class.</p>
            </StickyCard>
            <StickyCard className="right-0 top-36 w-80 rotate-[2.5deg]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Class meet started</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">Motion in a plane</p>
              <p className="mt-1 text-[15px] text-slate-600">
                Meet code <b className="font-mono tracking-widest text-slate-900">K7P3QX</b>
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4" /> Attendance recorded
              </p>
            </StickyCard>
            <StickyCard className="bottom-0 left-12 w-[21rem] -rotate-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assignment graded</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">Algebra worksheet · 18/20</p>
              <p className="mt-1 text-[15px] text-slate-600">“Great work. Recheck step 4.”</p>
            </StickyCard>
          </div>
        </section>

        <section id="how" className="scroll-mt-10 pb-24">
          <span className="hand text-3xl">how it works</span>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <div key={title} className="card p-6">
                <p className="hand text-4xl leading-none">{i + 1}.</p>
                <h3 className="mt-2 text-xl font-extrabold">{title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-12 pb-24 lg:grid-cols-2">
          <div id="teachers" className="card scroll-mt-10 p-8">
            <span className="hand text-3xl">for teachers</span>
            <h2 className="mb-6 mt-1 text-3xl font-black">Less admin, more teaching.</h2>
            <FeatureList items={TEACHERS} />
          </div>
          <div id="students" className="card scroll-mt-10 p-8">
            <span className="hand text-3xl">for students</span>
            <h2 className="mb-6 mt-1 text-3xl font-black">Everything for class, in one tab.</h2>
            <FeatureList items={STUDENTS} />
          </div>
        </section>

        <section className="pb-24">
          <div className="card flex flex-col items-start gap-6 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black sm:text-4xl">
                Start your first <span className="highlight">classroom</span> today.
              </h2>
              <p className="mt-2 text-lg text-slate-600">It takes less than a minute. Your students join with a code.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/register?role=tutor" className="rounded-xl bg-brand-500 px-6 py-3 font-bold text-white shadow-[0_3px_0_var(--color-brand-700)] hover:bg-brand-600">
                Create a classroom
              </Link>
              <Link to="/register?role=student" className="rounded-xl border-2 border-slate-900 bg-surface px-6 py-3 font-bold text-slate-900 shadow-[0_3px_0_var(--color-slate-900)] dark:border-slate-300">
                Join with a code
              </Link>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-slate-300 py-8 text-sm text-slate-500">
          <Logo />
          <p>© {new Date().getFullYear()} EduConnect · Built for students and teachers</p>
        </footer>
      </div>
    </div>
  );
}
