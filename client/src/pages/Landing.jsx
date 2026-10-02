import { Link } from 'react-router-dom';
import {
  ArrowRight, Award, CalendarCheck, CheckCircle2, ClipboardCheck, FolderOpen, Hand, MessagesSquare, Mic, MicOff,
  MonitorUp, PhoneOff, Quote, Sparkles, Star, Timer, Video,
} from 'lucide-react';
import { Logo } from '../components/AppLayout';
import { ThemeToggle } from '../components/HeaderWidgets';

const FEATURES = [
  { icon: Video, title: 'Live classes', text: 'HD video with screen share, chat and hand-raise - right in the browser.', color: '#6366f1' },
  { icon: ClipboardCheck, title: 'Assignments & grading', text: 'Post work with deadlines, collect submissions, grade with feedback.', color: '#d97706' },
  { icon: FolderOpen, title: 'Study materials', text: 'Notes, PDFs, slides and links - organised per class.', color: '#16a34a' },
  { icon: MessagesSquare, title: 'Real-time chat', text: 'Ask doubts instantly. See who is typing. Never feel stuck.', color: '#db2777' },
  { icon: Timer, title: 'Focus timer & streaks', text: 'Pomodoro sessions, daily goals and streaks that make studying a habit.', color: '#0891b2' },
  { icon: CalendarCheck, title: '1-on-1 tutoring', text: 'Find expert tutors by subject and book private sessions in seconds.', color: '#7c3aed' },
];

const STATS = [
  ['10k+', 'Students learning'],
  ['500+', 'Expert tutors'],
  ['25k+', 'Live sessions'],
  ['4.9★', 'Average rating'],
];

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'History', 'Economics', 'Accountancy', 'Spoken English'];

const TESTIMONIALS = [
  ['The focus timer and streaks actually got me studying 2 hours a day. My maths grade went from C to A.', 'Anu S.', 'Grade 10 student', '#d97706'],
  ['Grading used to take my whole weekend. Now I see who submitted, grade in one click and students get notified instantly.', 'Ravi K.', 'Mathematics tutor', '#4f46e5'],
  ['Booking a physics tutor the night before my exam was so easy. The live whiteboard explanations were perfect.', 'Rahul V.', 'Grade 12 student', '#0891b2'],
];

const PARTICIPANTS = [
  ['Anu', '#d97706', true],
  ['Rahul', '#0891b2', false],
  ['Priya', '#7c3aed', false],
  ['Sneha', '#16a34a', true],
];

function HeroMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-500/30 via-purple-500/20 to-pink-500/30 blur-2xl" />

      <div className="card overflow-hidden p-3 shadow-2xl shadow-brand-900/20">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="flex items-center gap-2 text-xs font-semibold text-red-500">
            <span className="size-2 animate-pulse rounded-full bg-red-500" /> LIVE · Quadratic Equations
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">32 students · 45:12</span>
        </div>

        <div className="grid grid-cols-4 grid-rows-3 gap-2">
          <div className="relative col-span-3 row-span-3 flex flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-purple-600 to-fuchsia-600 p-6 text-white">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <p className="relative text-xs font-medium uppercase tracking-wider text-white/70">Shared whiteboard</p>
            <p className="relative mt-3 font-mono text-xl sm:text-2xl">x = (-b ± √Δ) / 2a</p>
            <p className="relative mt-2 font-mono text-sm text-white/80">Δ = b² - 4ac</p>
            <svg viewBox="0 0 200 60" className="relative mt-4 h-14 w-full" fill="none">
              <path d="M5 55 Q100 -35 195 55" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
              <circle cx="57" cy="22" r="4" fill="#fde68a" />
              <circle cx="143" cy="22" r="4" fill="#fde68a" />
            </svg>
            <span className="absolute bottom-3 left-3 rounded-md bg-black/30 px-2 py-0.5 text-[11px] backdrop-blur">Mr. Kumar · presenting</span>
          </div>
          {PARTICIPANTS.slice(0, 3).map(([name, color, muted]) => (
            <div key={name} className="relative flex items-center justify-center rounded-2xl" style={{ background: `${color}26` }}>
              <span className="flex size-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: color }}>{name[0]}</span>
              <span className="absolute bottom-1 left-1.5 flex items-center gap-0.5 text-[10px] font-medium text-slate-700">
                {muted ? <MicOff className="size-2.5 text-red-500" /> : <Mic className="size-2.5" />} {name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          {[Mic, Video, MonitorUp, Hand, MessagesSquare].map((Icon, i) => (
            <span key={i} className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Icon className="size-4" />
            </span>
          ))}
          <span className="flex size-9 items-center justify-center rounded-full bg-red-500 text-white"><PhoneOff className="size-4" /></span>
        </div>
      </div>

      <div className="card absolute -left-10 -top-8 hidden w-56 animate-float items-center gap-3 p-3 shadow-xl sm:flex">
        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><Award className="size-5" /></span>
        <div>
          <p className="text-xs text-slate-500">Assignment graded</p>
          <p className="text-sm font-semibold text-slate-900">Algebra · 18/20 🎉</p>
        </div>
      </div>
      <div className="card absolute -bottom-6 -right-4 hidden w-60 animate-float p-3 shadow-xl sm:block" style={{ animationDelay: '1.5s' }}>
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">A</span>
          <p className="text-xs font-semibold text-slate-900">Anu</p>
          <span className="text-[10px] text-slate-400">just now</span>
        </div>
        <p className="mt-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-700">Ohh now I get it! Thank you sir 🙌</p>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#reviews" className="hover:text-slate-900">Reviews</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Log in</Link>
            <Link to="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-brand-600/30 hover:bg-brand-700">Get started</Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="bg-grid absolute inset-0 -z-10" />
        <div className="absolute left-1/2 top-0 -z-10 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 pb-20 pt-12 lg:grid-cols-2 lg:pt-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
              <Sparkles className="size-3.5" /> Virtual classroom + online tutoring
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Learn live.
              <br />
              Anytime. <span className="text-gradient">Anywhere.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Live classes, assignments, study material, focus tools and 1-on-1 tutoring - everything students and teachers need, in one
              beautifully simple platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register?role=student" className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-xl shadow-brand-600/30 transition hover:-translate-y-0.5 hover:bg-brand-700">
                Join as Student <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <Link to="/register?role=tutor" className="rounded-xl border-2 border-slate-200 bg-surface px-6 py-3.5 font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-brand-300">
                Become a Tutor
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['#d97706', '#0891b2', '#7c3aed', '#16a34a', '#db2777'].map((c, i) => (
                  <span key={c} className="flex size-9 items-center justify-center rounded-full border-2 border-surface text-xs font-bold text-white" style={{ background: c }}>
                    {'ARPSK'[i]}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-sm text-slate-500">Loved by <b className="text-slate-800">10,000+</b> learners</p>
              </div>
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <HeroMockup />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-slate-50/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="text-gradient text-3xl font-extrabold sm:text-4xl">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="relative overflow-hidden pb-8">
          <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-3">
            {[...SUBJECTS, ...SUBJECTS].map((s, i) => (
              <span key={i} className="rounded-full border border-slate-200 bg-surface px-4 py-1.5 text-sm text-slate-600">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-brand-600">Features</p>
        <h2 className="mt-2 text-center text-4xl font-bold tracking-tight">Everything a classroom needs</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-slate-500">
          Built for teachers who want to focus on teaching, and students who want to stay motivated.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, color }) => (
            <div key={title} className="card group relative overflow-hidden p-7 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute -right-10 -top-10 size-32 rounded-full opacity-0 blur-2xl transition group-hover:opacity-30" style={{ background: color }} />
              <div className="inline-flex rounded-2xl p-3" style={{ background: `${color}1f`, color }}>
                <Icon className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="relative scroll-mt-20 overflow-hidden bg-brand-950 py-24 text-white">
        <div className="absolute -left-32 top-0 size-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6">
          <h2 className="text-center text-4xl font-bold tracking-tight text-white">Start learning in 3 steps</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              ['Create an account', 'Sign up as a student or a tutor - it takes 30 seconds.'],
              ['Create or join a class', 'Tutors get a class code; students join with it.'],
              ['Learn live, every day', 'Attend sessions, submit work, build your study streak.'],
            ].map(([title, text], i) => (
              <div key={title} className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 text-xl font-bold shadow-lg">{i + 1}</div>
                <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-brand-200">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24">
        <h2 className="text-center text-4xl font-bold tracking-tight">Students and teachers love it</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(([text, name, role, color]) => (
            <figure key={name} className="card flex flex-col p-7">
              <Quote className="size-8 text-brand-200" />
              <blockquote className="mt-4 flex-1 leading-relaxed text-slate-700">{text}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full font-bold text-white" style={{ background: color }}>{name[0]}</span>
                <div>
                  <p className="font-semibold text-slate-900">{name}</p>
                  <p className="text-sm text-slate-500">{role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-purple-600 to-fuchsia-600 px-8 py-16 text-center text-white shadow-2xl shadow-brand-600/30">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <h2 className="relative text-4xl font-bold tracking-tight text-white">Ready to make learning a habit?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/80">Join free today. Create a class in under a minute or find the perfect tutor.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-600 shadow-lg transition hover:-translate-y-0.5">Get started - it's free</Link>
            <Link to="/login" className="rounded-xl border-2 border-white/40 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">I already have an account</Link>
          </div>
          <div className="relative mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/80">
            {['No credit card', 'Unlimited classes', 'Works on any device'].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="size-4" /> {t}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <Logo />
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} EduConnect. Built for students and teachers.</p>
        </div>
      </footer>
    </div>
  );
}
