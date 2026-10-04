import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle2, GraduationCap, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import { Logo } from '../components/AppLayout';
import { Button, Input, PasswordInput, cx } from '../components/ui';
import { homeFor } from '../utils/routes';
import EducationFields, { educationComplete } from '../components/EducationFields';

const DEMO = [
  ['Student', 'student@educonnect.dev'],
  ['Tutor', 'tutor@educonnect.dev'],
  ['Admin', 'admin@educonnect.dev'],
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const BENEFITS = [
  'Join a classroom with a 5-digit code',
  'Class meets with codes and attendance',
  'Assignments, grades and 1-on-1 tutoring',
];

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="paper grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-16">
        <div className="pointer-events-none absolute inset-y-0 left-6 hidden w-0.5 bg-margin sm:block" />
        <Link to="/" className="mb-10 w-fit"><Logo /></Link>
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-black tracking-tight">{title}</h1>
          <p className="mt-2 text-lg text-slate-600">{subtitle}</p>
          <div className="card mt-8 p-6 sm:p-8">{children}</div>
        </div>
      </div>

      <div className="hidden flex-col justify-center p-12 lg:flex xl:p-16" aria-hidden="true">
        <span className="hand -rotate-2 text-4xl">one classroom, one code</span>
        <div className="relative mt-6 h-72">
          <div className="card absolute left-0 top-0 w-[22rem] -rotate-2 p-7">
            <span className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 rounded-sm bg-highlight/70" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Classroom · 6th – A</p>
            <p className="mt-1 font-mono text-6xl font-bold tracking-[0.2em] text-slate-900">48213</p>
            <p className="mt-1 text-base text-slate-600">Share this code with your class.</p>
          </div>
          <div className="card absolute left-28 top-36 w-[22rem] rotate-2 p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Class meet started</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">Motion in a plane</p>
            <p className="mt-1 text-base text-slate-600">
              Meet code <b className="font-mono tracking-widest text-slate-900">K7P3QX</b>
            </p>
          </div>
        </div>
        <ul className="mt-14 space-y-3">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-3 text-lg font-semibold text-slate-700">
              <CheckCircle2 className="size-5 text-brand-500" /> {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErrors({ ...errors, [k]: '' });
    setFormError('');
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Enter your email address';
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'That doesn’t look like a valid email address';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from?.pathname ?? homeFor(user), { replace: true });
    } catch (err) {
      setFormError(err?.response?.status === 401 ? 'Incorrect email or password. Please try again.' : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue to your classes.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:text-red-300">
            {formError}
          </p>
        )}
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <div>
          <PasswordInput autoComplete="current-password" value={form.password} onChange={set('password')} error={errors.password} />
          <Link to="/forgot-password" className="mt-2 inline-block text-sm font-bold text-brand-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" loading={busy} className="w-full" size="lg">{busy ? 'Logging in…' : 'Log in'}</Button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        New here? <Link to="/register" className="font-bold text-brand-600 hover:underline">Create an account</Link>
      </p>

      {/* Demo shortcuts exist only in local development builds, never on the live site. */}
      {import.meta.env.DEV && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Demo accounts · local development only</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO.map(([label, email]) => (
              <Button key={email} type="button" size="sm" variant="secondary" onClick={() => setForm({ email, password: 'password123' })}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: params.get('role') === 'tutor' ? 'tutor' : 'student', subjects: '',
  });
  const [education, setEducation] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErrors({ ...errors, [k]: '' });
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter your full name';
    if (!form.email.trim()) next.email = 'Enter your email address';
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'That doesn’t look like a valid email address';
    if (form.password.length < 6) next.password = 'Use at least 6 characters';
    if (form.role === 'student' && !educationComplete(education)) {
      next.education = education.level === 'btech' ? 'Choose your BTech branch' : education.level ? 'Choose your class' : 'Tell us what you are studying';
    }
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    try {
      const subjects = form.subjects.split(',').map((s) => s.trim()).filter(Boolean);
      const user = await register({ ...form, email: form.email.trim(), subjects, ...(form.role === 'student' && { education }) });
      toast.success('Account created!');
      navigate(homeFor(user), { replace: true });
    } catch (err) {
      const msg = errorMessage(err);
      if (/email/i.test(msg)) setErrors((prev) => ({ ...prev, email: msg }));
      else toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start teaching or learning in minutes.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['student', 'I am a Student', BookOpen],
            ['tutor', 'I am a Tutor', GraduationCap],
          ].map(([role, label, Icon]) => (
            <button
              type="button"
              key={role}
              onClick={() => setForm({ ...form, role })}
              aria-pressed={form.role === role}
              className={cx(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-bold transition',
                form.role === role ? 'border-slate-900 bg-highlight text-ink dark:border-slate-300 dark:text-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              <Icon className="size-6" />
              {label}
            </button>
          ))}
        </div>
        <Input label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <PasswordInput autoComplete="new-password" hint="At least 6 characters" value={form.password} onChange={set('password')} error={errors.password} />
        {form.role === 'student' && (
          <div>
            <EducationFields value={education} onChange={(v) => { setEducation(v); setErrors({ ...errors, education: '' }); }} />
            {errors.education && <p role="alert" className="mt-1 text-sm font-semibold text-red-600 dark:text-red-400">{errors.education}</p>}
          </div>
        )}
        {form.role === 'tutor' && (
          <Input label="Subjects you teach" placeholder="e.g. Mathematics, Physics" hint="Comma separated" value={form.subjects} onChange={set('subjects')} />
        )}
        <Button type="submit" loading={busy} className="w-full" size="lg">{busy ? 'Creating account…' : 'Create account'}</Button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        Already have an account? <Link to="/login" className="font-bold text-brand-600 hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}

/** EduConnect has no email service yet, so passwords are reset by an admin. */
export function ForgotPassword() {
  return (
    <AuthShell title="Forgot your password?" subtitle="No problem, we’ll get you back in.">
      <div className="space-y-5">
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-highlight text-ink dark:border-slate-300">
            <KeyRound className="size-5" />
          </span>
          <div>
            <h2 className="font-extrabold">Ask your school admin or teacher</h2>
            <p className="mt-1 text-slate-600">They can reset your password from the Admin panel and give you a temporary one.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-surface text-slate-900 dark:border-slate-300">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="font-extrabold">Then change it</h2>
            <p className="mt-1 text-slate-600">Log in with the temporary password and set a new one in your Profile.</p>
          </div>
        </div>
        <Link to="/login" className="block">
          <Button className="w-full" size="lg">Back to log in</Button>
        </Link>
      </div>
    </AuthShell>
  );
}
