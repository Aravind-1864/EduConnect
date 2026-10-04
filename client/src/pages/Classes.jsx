import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, KeyRound, LogIn, Plus } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Button, EmptyState, ErrorState, Input, Modal, PageHeader, Spinner, Textarea } from '../components/ui';
import { ClassCard } from '../components/shared';
import JoinMeetModal from '../components/JoinMeetModal';

function CreateClassModal({ open, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', subject: '', description: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/classes', form);
      toast.success(`Classroom created - share code ${data.code} with your students`, { duration: 6000 });
      navigate(`/classes/${data._id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a classroom">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Classroom name" required autoFocus placeholder="e.g. 6th - A" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Subject (optional)" placeholder="e.g. Mathematics" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <Textarea label="Description (optional)" placeholder="Anything students should know" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700 dark:text-brand-300">A 5-digit code is created for this classroom. Share it with your students so they can join.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Create classroom</Button>
        </div>
      </form>
    </Modal>
  );
}

function JoinClassModal({ open, onClose }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/classes/join', { code });
      toast.success(`You joined ${data.title}`);
      navigate(`/classes/${data._id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Join a classroom">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">Classroom code</span>
          <input
            className="input text-center font-mono text-3xl font-bold tracking-[0.5em]"
            placeholder="48213"
            inputMode="numeric"
            maxLength={5}
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <span className="mt-1 block text-xs text-slate-500">The 5-digit code your tutor shared with you.</span>
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy} disabled={code.length !== 5}>Join classroom</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Classes() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/classes');
  const [modal, setModal] = useState(null);

  const action =
    user.role === 'student' ? (
      <>
        <Button variant="secondary" icon={KeyRound} onClick={() => setModal('meet')}>Join class meet</Button>
        <Button icon={LogIn} onClick={() => setModal('join')}>Join classroom</Button>
      </>
    ) : (
      <Button icon={Plus} onClick={() => setModal('create')}>Create classroom</Button>
    );

  return (
    <>
      <PageHeader title={user.role === 'admin' ? 'All classrooms' : 'My classrooms'} subtitle={`${data?.length ?? 0} classroom${data?.length === 1 ? '' : 's'}`} actions={action} />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data.length ? (
        <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map((c) => <ClassCard key={c._id} c={c} />)}</div>
      ) : (
        <EmptyState icon={BookOpen} title="No classrooms yet" text={user.role === 'student' ? 'Join a classroom with the 5-digit code from your tutor.' : 'Create your first classroom, like 6th - A.'} action={action} />
      )}
      <CreateClassModal open={modal === 'create'} onClose={() => setModal(null)} />
      <JoinClassModal open={modal === 'join'} onClose={() => setModal(null)} />
      {modal === 'meet' && <JoinMeetModal open onClose={() => setModal(null)} />}
    </>
  );
}
