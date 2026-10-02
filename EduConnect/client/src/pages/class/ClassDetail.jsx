import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Megaphone, FolderOpen, ClipboardList, Video, MessagesSquare, Users, Settings } from 'lucide-react';
import { api, errorMessage } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { useSocket } from '../../context/SocketContext';
import { Button, ErrorState, Input, Modal, Spinner, Textarea, cx } from '../../components/ui';
import StreamTab from './StreamTab';
import MaterialsTab from './MaterialsTab';
import AssignmentsTab from './AssignmentsTab';
import SessionsTab from './SessionsTab';
import ChatTab from './ChatTab';
import PeopleTab from './PeopleTab';

const TABS = [
  ['stream', 'Stream', Megaphone, StreamTab],
  ['materials', 'Materials', FolderOpen, MaterialsTab],
  ['assignments', 'Assignments', ClipboardList, AssignmentsTab],
  ['sessions', 'Live Sessions', Video, SessionsTab],
  ['chat', 'Chat', MessagesSquare, ChatTab],
  ['people', 'People', Users, PeopleTab],
];

function SettingsModal({ classroom, open, onClose, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: classroom.title, subject: classroom.subject, description: classroom.description });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/classes/${classroom._id}`, form);
      toast.success('Class updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${classroom.title}"? All materials, assignments and submissions will be permanently removed.`)) return;
    try {
      await api.delete(`/classes/${classroom._id}`);
      toast.success('Class deleted');
      navigate('/classes');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Class settings"
      footer={
        <>
          <Button variant="danger" className="mr-auto" onClick={remove}>Delete class</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={save}>Save</Button>
        </>
      }
    >
      <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    </Modal>
  );
}

export default function ClassDetail() {
  const { classId } = useParams();
  const [params, setParams] = useSearchParams();
  const socket = useSocket();
  const { data: classroom, loading, error, reload } = useFetch(`/classes/${classId}`);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const tab = params.get('tab') ?? 'stream';

  useEffect(() => {
    if (!socket) return undefined;
    socket.emit('class:join', classId);
    return () => socket.emit('class:leave', classId);
  }, [socket, classId]);

  if (loading && !classroom) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const Active = TABS.find(([key]) => key === tab)?.[3] ?? StreamTab;

  const copyCode = () => {
    navigator.clipboard.writeText(classroom.code);
    toast.success('Class code copied');
  };

  return (
    <>
      <Link to="/classes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> All classes
      </Link>

      <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm sm:p-8" style={{ background: classroom.color }}>
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">{classroom.subject}</p>
            <h1 className="mt-1 text-3xl font-bold text-white">{classroom.title}</h1>
            <p className="mt-2 text-white/85">
              {classroom.tutor.name} · {classroom.students.length} students
            </p>
          </div>
          {classroom.isTutor && (
            <div className="flex items-center gap-2">
              <button onClick={copyCode} className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 font-mono text-sm font-semibold tracking-widest backdrop-blur hover:bg-white/30">
                {classroom.code} <Copy className="size-4" />
              </button>
              <button onClick={() => setSettingsOpen(true)} className="rounded-lg bg-white/20 p-2 backdrop-blur hover:bg-white/30" aria-label="Class settings">
                <Settings className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setParams({ tab: key }, { replace: true })}
            className={cx(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition',
              tab === key ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        <Active classroom={classroom} reloadClass={reload} />
      </div>

      {classroom.isTutor && settingsOpen && (
        <SettingsModal classroom={classroom} open={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={reload} />
      )}
    </>
  );
}
