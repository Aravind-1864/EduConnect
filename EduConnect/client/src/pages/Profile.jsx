import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar, Button, Input, PageHeader, SectionCard, Textarea, cx } from '../components/ui';

const COLORS = ['#4f46e5', '#16a34a', '#d97706', '#db2777', '#0891b2', '#7c3aed', '#dc2626', '#0f172a'];

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
