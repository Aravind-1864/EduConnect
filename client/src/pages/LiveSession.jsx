import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Clock, Copy, PhoneOff, Users, Video } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { Avatar, Badge, Button, SectionCard, Spinner } from '../components/ui';
import { SESSION_STATUS } from '../components/shared';
import { fmtDateTime } from '../utils/format';
import ChatTab from './class/ChatTab';

/**
 * Class meet page (/live/:classId/:sessionId). Opening it as the tutor starts the meet;
 * students arrive here after entering the meet code. Attendance is recorded on entry.
 * (Video calling is paused for now; the classroom chat is the live channel.)
 */
export default function LiveSession({ oneOnOne }) {
  const { classId, sessionId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [info, setInfo] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const backTo = oneOnOne ? '/bookings' : `/classes/${classId}?tab=sessions`;

  const load = useCallback(async () => {
    if (oneOnOne) {
      toast('Video calls for 1-on-1 sessions are coming soon');
      navigate('/bookings', { replace: true });
      return;
    }
    try {
      const [s, c] = await Promise.all([api.post(`/classes/${classId}/sessions/${sessionId}/join`), api.get(`/classes/${classId}`)]);
      setInfo({ ...s.data.session, isTutor: s.data.isTutor });
      setClassroom(c.data);
    } catch (err) {
      toast.error(errorMessage(err));
      navigate(backTo, { replace: true });
    }
  }, [oneOnOne, classId, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  // Live attendee list / status changes.
  useEffect(() => {
    if (!socket) return undefined;
    socket.emit('class:join', classId);
    const onUpdate = (s) => s._id === sessionId && setInfo((prev) => (prev ? { ...prev, ...s } : prev));
    socket.on('session:updated', onUpdate);
    return () => socket.off('session:updated', onUpdate);
  }, [socket, classId, sessionId]);

  const endMeet = async () => {
    if (!window.confirm('End this class meet for everyone?')) return;
    try {
      await api.patch(`/classes/${classId}/sessions/${sessionId}`, { status: 'ended' });
      toast.success('Class meet ended');
      navigate(backTo);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (!info) return <Spinner className="min-h-screen" />;

  const [color, label] = SESSION_STATUS[info.status];
  const attendees = (info.attendees ?? []).filter((a) => typeof a === 'object');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-surface px-4 py-3 sm:px-8">
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="size-4" /> {classroom?.title ?? 'Back'}
        </Link>
        <h1 className="truncate text-base font-semibold">{info.title}</h1>
        <Badge color={color}>
          {info.status === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-red-500" />}
          {label}
        </Badge>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="card overflow-hidden">
            <div className="flex flex-col items-center gap-3 border-b-2 border-slate-900 bg-brand-500 px-6 py-10 text-center text-white dark:border-slate-300">
              <span className="rounded-2xl bg-white/20 p-4 backdrop-blur"><Video className="size-9" /></span>
              <h2 className="text-2xl font-bold text-white">{info.title}</h2>
              <p className="flex items-center gap-1.5 text-white/85">
                <Clock className="size-4" /> {fmtDateTime(info.startsAt)} · {info.durationMinutes} min
              </p>
              <div className="mt-2 rounded-xl bg-white/15 px-5 py-2 backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-white/75">Meet code</p>
                <button
                  className="flex items-center gap-2 font-mono text-3xl font-bold tracking-[0.3em]"
                  onClick={() => {
                    navigator.clipboard.writeText(info.code);
                    toast.success('Meet code copied');
                  }}
                  title="Copy code"
                >
                  {info.code} <Copy className="size-5 opacity-80" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {info.isTutor ? (
                info.status === 'live' ? (
                  <>
                    <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="size-5" /> Your class meet is live. Students join with the code shared in the classroom chat.
                    </p>
                    <Button variant="danger" icon={PhoneOff} className="w-full" onClick={endMeet}>End class meet</Button>
                  </>
                ) : (
                  <p className="text-slate-600">This class meet has ended.</p>
                )
              ) : (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-5" /> You've joined this class meet. Your attendance is recorded.
                </p>
              )}
              <p className="text-sm text-slate-500">Video calling will be added here soon. For now, use the classroom chat to talk with everyone.</p>
            </div>
          </section>

          <SectionCard title={`Joined (${attendees.length})`} action={<Users className="size-5 text-slate-400" />}>
            {attendees.length ? (
              <ul className="flex flex-wrap gap-3">
                {attendees.map((a) => (
                  <li key={a._id} className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm">
                    <Avatar user={a} size="sm" /> {a.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No one has joined yet.</p>
            )}
          </SectionCard>
        </div>

        {classroom && (
          <div className="lg:col-span-2">
            <h2 className="mb-3 font-semibold">Classroom chat</h2>
            <ChatTab classroom={classroom} />
          </div>
        )}
      </main>
    </div>
  );
}
