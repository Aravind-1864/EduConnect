import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarPlus, KeyRound, Video } from 'lucide-react';
import { api, errorMessage } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { useSocket } from '../../context/SocketContext';
import { Button, EmptyState, Input, Modal, Spinner, Textarea } from '../../components/ui';
import { SessionRow } from '../../components/shared';
import JoinMeetModal from '../../components/JoinMeetModal';
import { toLocalInput } from '../../utils/format';

function CreateMeetModal({ classId, open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', startsAt: toLocalInput(Date.now() + 600e3), durationMinutes: 45 });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/classes/${classId}/sessions`, { ...form, startsAt: new Date(form.startsAt).toISOString() });
      onCreated(data);
      toast.success(`Class meet created - code ${data.code} was shared in the classroom chat`, { duration: 6000 });
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a class meet">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Topic" required autoFocus placeholder="e.g. Motion in a plane" value={form.title} onChange={set('title')} />
        <Textarea label="Agenda (optional)" value={form.description} onChange={set('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Starts at" type="datetime-local" required value={form.startsAt} onChange={set('startsAt')} />
          <Input label="Duration (min)" type="number" min={5} max={600} value={form.durationMinutes} onChange={set('durationMinutes')} />
        </div>
        <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700 dark:text-brand-300">
          A meet code (letters and numbers) is created and posted in this classroom's chat, so every student can join.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Create meet</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function SessionsTab({ classroom }) {
  const navigate = useNavigate();
  const socket = useSocket();
  const { data: sessions, setData, loading } = useFetch(`/classes/${classroom._id}/sessions`);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!socket) return undefined;
    const upsert = (s) =>
      setData((prev) => {
        if (!prev) return prev;
        const exists = prev.some((x) => x._id === s._id);
        return exists ? prev.map((x) => (x._id === s._id ? s : x)) : [...prev, s];
      });
    socket.on('session:new', upsert);
    socket.on('session:updated', upsert);
    return () => {
      socket.off('session:new', upsert);
      socket.off('session:updated', upsert);
    };
  }, [socket, setData]);

  const setStatus = async (s, status) => {
    try {
      const { data } = await api.patch(`/classes/${classroom._id}/sessions/${s._id}`, { status });
      setData((prev) => prev.map((x) => (x._id === data._id ? data : x)));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading && !sessions) return <Spinner />;

  const upcoming = sessions.filter((s) => ['scheduled', 'live'].includes(s.status));
  const past = sessions.filter((s) => !['scheduled', 'live'].includes(s.status)).reverse();
  const open = (s) => navigate(`/live/${classroom._id}/${s._id}`);

  const actions = (s) => {
    if (classroom.isTutor) {
      return (
        <div className="flex gap-2">
          <Button size="sm" variant={s.status === 'live' ? 'success' : 'primary'} onClick={() => open(s)}>{s.status === 'live' ? 'Open' : 'Start'}</Button>
          {s.status === 'live' ? (
            <Button size="sm" variant="secondary" onClick={() => setStatus(s, 'ended')}>End</Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setStatus(s, 'cancelled')}>Cancel</Button>
          )}
        </div>
      );
    }
    return s.status === 'live' ? (
      <Button size="sm" variant="success" onClick={() => setModal('join')}>Join with code</Button>
    ) : (
      <span className="text-sm text-slate-500">Not started</span>
    );
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Upcoming class meets</h2>
        {classroom.isTutor ? (
          <Button icon={CalendarPlus} onClick={() => setModal('create')}>Create class meet</Button>
        ) : (
          <Button icon={KeyRound} onClick={() => setModal('join')}>Enter meet code</Button>
        )}
      </div>
      {upcoming.length ? (
        <div className="space-y-3">{upcoming.map((s) => <SessionRow key={s._id} session={s} classroom={classroom} action={actions(s)} />)}</div>
      ) : (
        <EmptyState icon={Video} title="No class meets yet" text={classroom.isTutor ? 'Create a class meet; its code is shared in the classroom chat.' : 'When your tutor creates a class meet, its code appears in the classroom chat.'} />
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-4 mt-8 font-semibold">Past class meets</h2>
          <div className="space-y-3 opacity-80">
            {past.map((s) => (
              <SessionRow key={s._id} session={s} classroom={classroom} action={<span className="text-sm text-slate-500">{s.attendees.length} attended</span>} />
            ))}
          </div>
        </>
      )}

      <CreateMeetModal
        classId={classroom._id}
        open={modal === 'create'}
        onClose={() => setModal(null)}
        onCreated={(s) => setData((prev) => (prev.some((x) => x._id === s._id) ? prev : [...prev, s]))}
      />
      {modal === 'join' && <JoinMeetModal open onClose={() => setModal(null)} />}
    </>
  );
}
