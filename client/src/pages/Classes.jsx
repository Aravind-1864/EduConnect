import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, LogIn, Plus } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Button, EmptyState, ErrorState, Input, Modal, PageHeader, Spinner, Textarea } from '../components/ui';
import { ClassCard } from '../components/shared';
import MeetLinkFields, { MEET_URL_RE } from '../components/MeetLinkForm';

function CreateClassModal({ open, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', subject: '', description: '' });
  const [meet, setMeet] = useState({ meetUrl: '', autoMeet: false });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (meet.meetUrl && !MEET_URL_RE.test(meet.meetUrl.trim())) return toast.error('Please enter a valid Google Meet link');
    setBusy(true);
    try {
      const { data } = await api.post('/classes', { ...form, ...meet });
      toast.success(`Class created - share code ${data.code} with students`);
      navigate(`/classes/${data._id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a new class">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Class title" required placeholder="e.g. Mathematics - Grade 10" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Subject" required placeholder="e.g. Mathematics" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <Textarea label="Description" placeholder="What will students learn?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <MeetLinkFields value={meet} onChange={setMeet} hint="Students see this link in the class and it is posted in the class chat." />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Create class</Button>
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
      toast.success(`Joined ${data.title}`);
      navigate(`/classes/${data._id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Join a class">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Class code"
          required
          placeholder="e.g. MATH10"
          className="font-mono uppercase tracking-widest"
          hint="Ask your tutor for the class code."
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Join</Button>
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
      <Button icon={LogIn} onClick={() => setModal('join')}>Join class</Button>
    ) : (
      <Button icon={Plus} onClick={() => setModal('create')}>New class</Button>
    );

  return (
    <>
      <PageHeader title={user.role === 'admin' ? 'All classes' : 'My classes'} subtitle={`${data?.length ?? 0} active classes`} actions={action} />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map((c) => <ClassCard key={c._id} c={c} />)}</div>
      ) : (
        <EmptyState icon={BookOpen} title="No classes yet" text={user.role === 'student' ? 'Join a class using the code from your tutor.' : 'Create your first class.'} action={action} />
      )}
      <CreateClassModal open={modal === 'create'} onClose={() => setModal(null)} />
      <JoinClassModal open={modal === 'join'} onClose={() => setModal(null)} />
    </>
  );
}
