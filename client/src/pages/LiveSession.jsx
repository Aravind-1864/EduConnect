import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Clock, Copy, ExternalLink, PhoneOff, Users, Video } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { Avatar, Badge, Button, Input, SectionCard, Spinner } from '../components/ui';
import { SESSION_STATUS } from '../components/shared';
import { fmtDateTime } from '../utils/format';
import { meetingLinkError, providerFor } from '../utils/meetingLink';
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

  const [linkDraft, setLinkDraft] = useState(null); // null = untouched, otherwise the text being edited
  const [savingLink, setSavingLink] = useState(false);

  const saveLink = async () => {
    setSavingLink(true);
    try {
      const { data } = await api.patch(`/classes/${classId}/sessions/${sessionId}`, { meetUrl: linkDraft.trim() });
      setInfo((prev) => ({ ...prev, meetUrl: data.meetUrl }));
      setLinkDraft(null);
      toast.success(data.meetUrl ? 'Video link saved and shared in the chat' : 'Video link removed');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingLink(false);
    }
  };

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
              {info.meetUrl && info.status === 'live' && (
                <>
                  <a
                    href={info.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-4 text-lg font-extrabold text-white shadow-[0_4px_0_var(--color-brand-700)] transition hover:-translate-y-px hover:bg-brand-600"
                  >
                    <Video className="size-5" /> Join video call on {providerFor(info.meetUrl) ?? 'the link'} <ExternalLink className="size-4" />
                  </a>
                  <p className="text-sm text-slate-500">Opens in a new tab. Keep this page open to follow the classroom chat.</p>
                </>
              )}
              {!info.meetUrl && !info.isTutor && (
                <p className="text-sm text-slate-500">Your tutor hasn't added a video link for this meet. Use the classroom chat to talk with everyone.</p>
              )}
              {info.isTutor && info.status !== 'ended' && (
                <div className="rounded-xl border-2 border-dashed border-slate-300 p-4">
                  <Input
                    label={info.meetUrl ? 'Video call link' : 'Add a video call link'}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={linkDraft ?? info.meetUrl ?? ''}
                    onChange={(e) => setLinkDraft(e.target.value)}
                    error={linkDraft !== null ? meetingLinkError(linkDraft) : ''}
                  />
                  <p className="mt-1.5 text-sm text-slate-600">
                    Create a meeting in{' '}
                    <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" className="font-bold text-brand-600 hover:underline">Google Meet</a>, Zoom or Teams and paste its link. Students see it here and in the chat.
                  </p>
                  {linkDraft !== null && linkDraft.trim() !== (info.meetUrl ?? '') && !meetingLinkError(linkDraft) && (
                    <Button size="sm" className="mt-3" loading={savingLink} onClick={saveLink}>{linkDraft.trim() ? 'Save link' : 'Remove link'}</Button>
                  )}
                </div>
              )}
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
