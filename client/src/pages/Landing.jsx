import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ClipboardCheck, KeyRound, MessagesSquare, Timer, Users } from 'lucide-react';
import { Logo } from '../components/AppLayout';
import { ThemeToggle } from '../components/HeaderWidgets';
import { useReveal } from '../hooks/useReveal';

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
            <p className="mt-1 text-[17px] leading-relaxed text-slate-600">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Landing() {
  useReveal();
  return (
    <div className="paper relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-6 w-0.5 bg-margin sm:left-12 lg:left-[max(1.5rem,calc(50%-37rem))]" />

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
        <header className="flex items-center justify-between py-6">
          <Logo />
          <nav className="hidden gap-9 text-base font-bold text-slate-700 md:flex">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#teachers" className="hover:text-slate-900">Teachers</a>
            <a href="#students" className="hover:text-slate-900">Students</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="hidden rounded-xl px-4 py-2.5 text-base font-bold text-slate-900 hover:bg-slate-100 sm:block">Log in</Link>
            <Link to="/register" className="rounded-xl bg-brand-500 px-6 py-3 text-base font-extrabold text-white shadow-[0_3px_0_var(--color-brand-700)] hover:bg-brand-600">
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
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-slate-700">
              Teachers make a classroom and share a code. Students join, chat, attend class meets, hand in assignments and book a tutor when
              they’re stuck.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register?role=tutor" className="rounded-xl bg-brand-500 px-8 py-4 text-lg font-extrabold text-white shadow-[0_4px_0_var(--color-brand-700)] hover:bg-brand-600">
                I’m a teacher
              </Link>
              <Link to="/register?role=student" className="rounded-xl border-2 border-slate-900 bg-surface px-8 py-4 text-lg font-extrabold text-slate-900 shadow-[0_4px_0_var(--color-slate-900)] hover:bg-slate-50 dark:border-slate-300">
                I’m a student
              </Link>
            </div>
            <p className="mt-6 text-base text-slate-600">Free to use · Works in any browser, on phone or laptop</p>
          </div>

          <div className="group relative animate-fade-up [animation-delay:150ms]">
            <span className="hand absolute -top-9 right-4 z-10 rotate-3 text-3xl">live class, in your browser</span>
            {/* Light illustration with its own paper texture: framed like a pasted-in photo, left margin cropped. */}
            <div className="card relative overflow-hidden rotate-[1.5deg] transition duration-500 ease-out group-hover:rotate-0 group-hover:-translate-y-1 motion-safe:animate-float">
              <img
                src="/hero-classroom.webp"
                alt="EduConnect live class: the teacher on video, a shared whiteboard with a triangle, students joining, and Chat, Assignments and Live Tutoring panels"
                width="1536"
                height="1024"
                className="block aspect-[1430/1024] w-full origin-[58%_52%] scale-[1.18] object-cover object-right dark:brightness-[0.92]"
                fetchpriority="high"
              />
            </div>
            <span className="absolute -bottom-3 left-10 h-6 w-28 -rotate-3 rounded-sm bg-highlight/70 shadow-sm" aria-hidden="true" />
          </div>
        </section>

        <section id="how" data-reveal className="scroll-mt-10 pb-24">
          <span className="hand text-3xl">how it works</span>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <div key={title} className="card card-hover p-6">
                <p className="hand text-4xl leading-none">{i + 1}.</p>
                <h3 className="mt-2 text-xl font-extrabold">{title}</h3>
                <p className="mt-2 text-[17px] leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section data-reveal className="grid gap-12 pb-24 lg:grid-cols-2">
          <div id="teachers" className="card card-hover scroll-mt-10 p-8">
            <span className="hand text-3xl">for teachers</span>
            <h2 className="mb-6 mt-1 text-3xl font-black">Less admin, more teaching.</h2>
            <FeatureList items={TEACHERS} />
          </div>
          <div id="students" className="card card-hover scroll-mt-10 p-8">
            <span className="hand text-3xl">for students</span>
            <h2 className="mb-6 mt-1 text-3xl font-black">Everything for class, in one tab.</h2>
            <FeatureList items={STUDENTS} />
          </div>
        </section>

        <section data-reveal className="pb-24">
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
