import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, ClipboardList, Copy, GraduationCap, Search, Users, Video } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Avatar, Badge, Button, ErrorState, Modal, PageHeader, SectionCard, Spinner, StatCard } from '../components/ui';
import { fmtDate } from '../utils/format';

function UsersTable() {
  const { user: me } = useAuth();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams({ ...(role && { role }), ...(debounced && { q: debounced }) }).toString();
  const { data: users, setData, loading } = useFetch(`/admin/users${params ? `?${params}` : ''}`);

  const [reset, setReset] = useState(null); // { user, temporaryPassword }

  const resetPassword = async (u) => {
    if (!window.confirm(`Reset the password for ${u.name}? Their current password will stop working.`)) return;
    try {
      const { data } = await api.post(`/admin/users/${u._id}/reset-password`);
      setReset({ user: u, temporaryPassword: data.temporaryPassword });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const toggle = async (u) => {
    try {
      const { data } = await api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive });
      setData((prev) => prev.map((x) => (x._id === data._id ? data : x)));
      toast.success(`${data.name} ${data.isActive ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <SectionCard title="Users">
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-40" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="tutor">Tutors</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      {loading && !users ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Joined</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} size="sm" />
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 capitalize">{u.role}</td>
                  <td className="py-3 pr-4 text-slate-500">{fmtDate(u.createdAt)}</td>
                  <td className="py-3 pr-4"><Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Disabled'}</Badge></td>
                  <td className="py-3 text-right">
                    {u._id !== me._id && !u.isDemo && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => resetPassword(u)}>Reset password</Button>
                        <Button size="sm" variant={u.isActive ? 'secondary' : 'success'} onClick={() => toggle(u)}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={Boolean(reset)} onClose={() => setReset(null)} title="Temporary password" footer={<Button onClick={() => setReset(null)}>Done</Button>}>
        {reset && (
          <>
            <p className="text-slate-600">Share this temporary password with <b>{reset.user.name}</b> privately. Ask them to change it in their Profile after logging in.</p>
            <div className="flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-paper px-4 py-3 dark:border-slate-300">
              <code className="flex-1 font-mono text-xl font-bold tracking-wider text-slate-900">{reset.temporaryPassword}</code>
              <Button size="sm" variant="secondary" icon={Copy} onClick={() => { navigator.clipboard.writeText(reset.temporaryPassword); toast.success('Copied'); }}>Copy</Button>
            </div>
            <p className="text-sm text-slate-500">It won’t be shown again.</p>
          </>
        )}
      </Modal>
    </SectionCard>
  );
}

export default function Admin() {
  const { data, loading, error, reload } = useFetch('/admin/stats');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { counts } = data;

  return (
    <>
      <PageHeader title="Admin overview" subtitle="Platform health at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={counts.students} icon={Users} />
        <StatCard label="Tutors" value={counts.tutors} icon={GraduationCap} tone="green" />
        <StatCard label="Classes" value={counts.classes} icon={BookOpen} tone="amber" />
        <StatCard label="Live sessions" value={counts.sessions} icon={Video} tone="pink" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Assignments" value={counts.assignments} icon={ClipboardList} />
        <StatCard label="Submissions" value={counts.submissions} icon={ClipboardList} tone="green" />
        <StatCard label="1-on-1 bookings" value={counts.bookings} icon={Users} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><UsersTable /></div>
        <SectionCard title="Recent classes">
          <ul className="divide-y divide-slate-100">
            {data.recentClasses.map((c) => (
              <li key={c._id}>
                <Link to={`/classes/${c._id}`} className="flex items-center gap-3 py-3 hover:text-brand-600">
                  <span className="size-3 rounded-full" style={{ background: c.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.tutor?.name} · {c.studentCount} students</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
