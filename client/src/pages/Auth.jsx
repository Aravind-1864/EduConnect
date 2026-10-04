import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import { Logo } from '../components/AppLayout';
import { Button, Input, cx } from '../components/ui';
import { homeFor } from '../utils/routes';
import EducationFields, { educationComplete } from '../components/EducationFields';

const DEMO = [
  ['Student', 'student@educonnect.dev'],
  ['Tutor', 'tutor@educonnect.dev'],
  ['Admin', 'admin@educonnect.dev'],
];

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16">
        <Link to="/" className="mb-10"><Logo /></Link>
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="hidden flex-col justify-center bg-gradient-to-br from-brand-600 to-purple-700 p-16 text-white lg:flex">
        <GraduationCap className="size-14 opacity-90" />
        <p className="mt-6 text-3xl font-bold leading-snug text-white">“The best classroom is the one where every student can be heard.”</p>
        <p className="mt-4 text-white/80">Live sessions, assignments and tutoring - in one place.</p>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from?.pathname ?? homeFor(user), { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue to your classes.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Password" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" loading={busy} className="w-full" size="lg">Log in</Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        New here? <Link to="/register" className="font-medium text-brand-600 hover:underline">Create an account</Link>
      </p>

      {import.meta.env.DEV && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts (password: password123)</p>
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
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.role === 'student' && !educationComplete(education)) {
      return toast.error(education.level === 'btech' ? 'Choose your BTech branch' : education.level ? 'Choose your class' : 'Tell us what you are studying');
    }
    setBusy(true);
    try {
      const subjects = form.subjects.split(',').map((s) => s.trim()).filter(Boolean);
      const user = await register({ ...form, subjects, ...(form.role === 'student' && { education }) });
      toast.success('Account created!');
      navigate(homeFor(user), { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start teaching or learning in minutes.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            ['student', 'I am a Student', BookOpen],
            ['tutor', 'I am a Tutor', GraduationCap],
          ].map(([role, label, Icon]) => (
            <button
              type="button"
              key={role}
              onClick={() => setForm({ ...form, role })}
              className={cx(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition',
                form.role === role ? 'border-brand-600 bg-brand-50 text-brand-700 dark:text-brand-300' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              <Icon className="size-6" />
              {label}
            </button>
          ))}
        </div>
        <Input label="Full name" required value={form.name} onChange={set('name')} />
        <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        <Input label="Password" type="password" required minLength={6} autoComplete="new-password" hint="At least 6 characters" value={form.password} onChange={set('password')} />
        {form.role === 'student' && <EducationFields value={education} onChange={setEducation} />}
        {form.role === 'tutor' && (
          <Input label="Subjects you teach" placeholder="e.g. Mathematics, Physics" hint="Comma separated" value={form.subjects} onChange={set('subjects')} />
        )}
        <Button type="submit" loading={busy} className="w-full" size="lg">Create account</Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        Already have an account? <Link to="/login" className="font-medium text-brand-600 hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
