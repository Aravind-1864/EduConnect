import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarPlus, Video } from 'lucide-react';
import { api, errorMessage } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { useSocket } from '../../context/SocketContext';
import { Button, EmptyState, Input, Modal, Spinner, Textarea } from '../../components/ui';
import { SessionRow } from '../../components/shared';
import { toLocalInput } from '../../utils/format';

function ScheduleModal({ classId, open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', startsAt: toLocalInput(Date.now() + 3600e3), durationMinutes: 60 });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/classes/${classId}/sessions`, { ...form, startsAt: new Date(form.startsAt).toISOString() });
      onCreated(data);
      toast.success('Session scheduled');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule a live session">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Topic" required value={form.title} onChange={set('title')} />
        <Textarea label="Agenda (optional)" value={form.description} onChange={set('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Starts at" type="datetime-local" required value={form.startsAt} onChange={set('startsAt')} />
          <Input label="Duration (min)" type="number" min={5} max={600} value={form.durationMinutes} onChange={set('durationMinutes')} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Schedule</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function SessionsTab({ classroom }) {
  const navigate = useNavigate();
  const socket = useSocket();
  const { data: sessions, setData, loading } = useFetch(`/classes/${classroom._id}/sessions`);
  const [open, setOpen] = useState(false);

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
  const join = (s) => navigate(`/live/${classroom._id}/${s._id}`);

  const actions = (s) => {
    if (classroom.isTutor) {
      return (
        <div className="flex gap-2">
          <Button size="sm" variant={s.status === 'live' ? 'success' : 'primary'} onClick={() => join(s)}>{s.status === 'live' ? 'Rejoin' : 'Start'}</Button>
          {s.status === 'live' ? (
            <Button size="sm" variant="secondary" onClick={() => setStatus(s, 'ended')}>End</Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setStatus(s, 'cancelled')}>Cancel</Button>
          )}
        </div>
      );
    }
    return (
      <Button size="sm" variant="success" disabled={s.status !== 'live'} onClick={() => join(s)} title={s.status !== 'live' ? 'Available when the tutor starts the session' : ''}>
        Join
      </Button>
    );
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Upcoming</h2>
        {classroom.isTutor && <Button icon={CalendarPlus} onClick={() => setOpen(true)}>Schedule session</Button>}
      </div>
      {upcoming.length ? (
        <div className="space-y-3">{upcoming.map((s) => <SessionRow key={s._id} session={s} classroom={classroom} action={actions(s)} />)}</div>
      ) : (
        <EmptyState icon={Video} title="No upcoming sessions" text={classroom.isTutor ? 'Schedule a live class for your students.' : 'Your tutor has not scheduled anything yet.'} />
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-4 mt-8 font-semibold">Past sessions</h2>
          <div className="space-y-3 opacity-80">
            {past.map((s) => (
              <SessionRow key={s._id} session={s} classroom={classroom} action={<span className="text-sm text-slate-500">{s.attendees.length} attended</span>} />
            ))}
          </div>
        </>
      )}

      <ScheduleModal classId={classroom._id} open={open} onClose={() => setOpen(false)} onCreated={(s) => setData((prev) => (prev.some((x) => x._id === s._id) ? prev : [...prev, s]))} />
    </>
  );
}
