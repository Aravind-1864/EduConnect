import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, Video } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar, Button, Input, PageHeader, SectionCard, Textarea, cx } from '../components/ui';
import { resetGoogleStatus } from '../components/MeetLinkForm';

const COLORS = ['#4f46e5', '#16a34a', '#d97706', '#db2777', '#0891b2', '#7c3aed', '#dc2626', '#0f172a'];

/** Tutors connect Google once so EduConnect can create Meet links for their classes. */
function GoogleMeetCard() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/google/status').then(({ data }) => setStatus(data)).catch(() => setStatus({ configured: false }));

  useEffect(() => {
    const result = params.get('google');
    if (result === 'connected') toast.success('Google account connected');
    if (result === 'error') toast.error(params.get('message') || 'Could not connect Google');
    if (result) setParams({}, { replace: true });
    resetGoogleStatus();
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = async () => {
    setBusy(true);
    try {
      const { data } = await api.get('/google/auth-url');
      window.location.href = data.url;
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect your Google account? You can still paste Meet links by hand.')) return;
    setBusy(true);
    try {
      await api.delete('/google');
      resetGoogleStatus();
      await load();
      toast.success('Google disconnected');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;
  return (
    <SectionCard title="Google Meet">
      <div className="flex flex-wrap items-center gap-4">
        <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><Video className="size-6" /></span>
        <div className="min-w-0 flex-1">
          {!status.configured ? (
            <p className="text-sm text-slate-600">Automatic Meet links are not set up on this server yet. You can still paste a Google Meet link when scheduling a class.</p>
          ) : status.connected ? (
            <p className="flex items-center gap-1.5 text-sm text-slate-700">
              <CheckCircle2 className="size-4 text-emerald-600" /> Connected as <b>{status.email}</b>. Meet links can be created automatically.
            </p>
          ) : (
            <p className="text-sm text-slate-600">Connect your Google account to create Google Meet links automatically for your classes and 1-on-1 sessions.</p>
          )}
        </div>
        {status.configured && (status.connected ? (
          <Button variant="secondary" loading={busy} onClick={disconnect}>Disconnect</Button>
        ) : (
          <Button loading={busy} onClick={connect}>Connect Google</Button>
        ))}
      </div>
    </SectionCard>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio ?? '',
    subjects: (user.subjects ?? []).join(', '),
    hourlyRate: user.hourlyRate ?? 0,
    avatarColor: user.avatarColor,
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy('profile');
    try {
      const payload = { ...form, subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean), hourlyRate: Number(form.hourlyRate) };
      const { data } = await api.patch('/auth/me', payload);
      setUser(data.user);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setBusy('password');
    try {
      await api.patch('/auth/me', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage how others see you." />
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard className="text-center lg:self-start">
          <div className="flex justify-center"><Avatar user={{ ...user, ...form }} size="xl" /></div>
          <p className="mt-3 font-semibold">{form.name}</p>
          <p className="text-sm capitalize text-slate-500">{user.role} · {user.email}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, avatarColor: c })}
                className={cx('size-7 rounded-full ring-offset-2 transition', form.avatarColor === c && 'ring-2 ring-slate-900')}
                style={{ background: c }}
                aria-label={`Avatar colour ${c}`}
              />
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Personal details">
            <form onSubmit={save} className="space-y-4">
              <Input label="Full name" required value={form.name} onChange={set('name')} />
              <Textarea label="Bio" placeholder="Tell others a little about yourself" value={form.bio} onChange={set('bio')} />
              {user.role === 'tutor' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Subjects" hint="Comma separated" value={form.subjects} onChange={set('subjects')} />
                  <Input label="Hourly rate (₹)" type="number" min={0} value={form.hourlyRate} onChange={set('hourlyRate')} />
                </div>
              )}
              <Button type="submit" loading={busy === 'profile'}>Save changes</Button>
            </form>
          </SectionCard>

          {user.role !== 'student' && <GoogleMeetCard />}

          <SectionCard title="Change password">
            <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
              <Input label="Current password" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
              <Input label="New password" type="password" required minLength={6} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary" loading={busy === 'password'}>Update password</Button>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
