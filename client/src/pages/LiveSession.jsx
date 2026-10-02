import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Copy, ExternalLink, PhoneOff, Video } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Badge, Button, SectionCard, Spinner } from '../components/ui';
import { AddMeetLink } from '../components/MeetLinkForm';
import { SESSION_STATUS } from '../components/shared';
import { fmtDateTime } from '../utils/format';
import ChatTab from './class/ChatTab';

/**
 * "Class room" page for a live session (/live/:classId/:sessionId) or a 1-on-1 booking (/meet/:bookingId).
 * Video runs in Google Meet (it cannot be embedded), so this page hands off to Meet in a new tab
 * and keeps the EduConnect class chat open alongside.
 */
export default function LiveSession({ oneOnOne }) {
  const { classId, sessionId, bookingId } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [saving, setSaving] = useState(false);
  const backTo = oneOnOne ? '/bookings' : `/classes/${classId}?tab=sessions`;

  const load = useCallback(async () => {
    try {
      if (oneOnOne) {
        const { data } = await api.get(`/bookings/${bookingId}/join`);
        const other = data.isTutor ? data.booking.student : data.booking.tutor;
        setInfo({ isTutor: data.isTutor, title: `${data.booking.subject} · 1-on-1 with ${other.name}`, meetUrl: data.booking.meetUrl, startsAt: data.booking.startsAt, status: 'confirmed' });
      } else {
        const [s, c] = await Promise.all([api.post(`/classes/${classId}/sessions/${sessionId}/join`), api.get(`/classes/${classId}`)]);
        const { session } = s.data;
        setInfo({ isTutor: s.data.isTutor, title: session.title, meetUrl: session.meetUrl, startsAt: session.startsAt, status: session.status, durationMinutes: session.durationMinutes });
        setClassroom(c.data);
      }
    } catch (err) {
      toast.error(errorMessage(err));
      navigate(backTo, { replace: true });
    }
  }, [oneOnOne, bookingId, classId, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const saveLink = async (value) => {
    setSaving(true);
    try {
      if (oneOnOne) await api.patch(`/bookings/${bookingId}/meet`, value);
      else await api.patch(`/classes/${classId}/sessions/${sessionId}`, value);
      toast.success('Meeting link saved');
      await load(); // re-join: a tutor's session goes live once it has a link
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const endForEveryone = async () => {
    if (!window.confirm('End this session for everyone? (Also end the call in Google Meet.)')) return;
    try {
      await api.patch(`/classes/${classId}/sessions/${sessionId}`, { status: 'ended' });
      toast.success('Session ended');
      navigate(backTo);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (!info) return <Spinner className="min-h-screen" />;

  const [color, label] = oneOnOne ? ['green', 'Confirmed'] : SESSION_STATUS[info.status];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-surface px-4 py-3 sm:px-8">
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="size-4" /> Back
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
            <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 px-6 py-12 text-center text-white">
              <span className="rounded-2xl bg-white/20 p-4 backdrop-blur"><Video className="size-10" /></span>
              <h2 className="text-2xl font-bold text-white">{info.title}</h2>
              <p className="flex items-center gap-1.5 text-white/85">
                <Clock className="size-4" /> {fmtDateTime(info.startsAt)}
                {info.durationMinutes ? ` · ${info.durationMinutes} min` : ''}
              </p>
            </div>

            <div className="space-y-4 p-6">
              {info.meetUrl ? (
                <>
                  <a
                    href={info.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
                  >
                    <Video className="size-5" /> Join on Google Meet <ExternalLink className="size-4" />
                  </a>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm">
                    <span className="truncate font-mono text-slate-600">{info.meetUrl}</span>
                    <button
                      className="ml-auto shrink-0 rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                      onClick={() => {
                        navigator.clipboard.writeText(info.meetUrl);
                        toast.success('Link copied');
                      }}
                      aria-label="Copy link"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500">Google Meet opens in a new tab. Keep this tab open for the class chat.</p>
                </>
              ) : info.isTutor ? (
                <>
                  <p className="text-sm text-slate-600">Add a Google Meet link to start this {oneOnOne ? 'session' : 'class'}. Students can join as soon as it's saved.</p>
                  <AddMeetLink onSave={saveLink} saving={saving} />
                </>
              ) : (
                <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 dark:text-amber-300">The tutor hasn't added the Google Meet link yet. You'll get a notification when it's ready.</p>
              )}

              {info.isTutor && !oneOnOne && info.status === 'live' && (
                <Button variant="danger" icon={PhoneOff} className="w-full" onClick={endForEveryone}>End session for everyone</Button>
              )}
            </div>
          </section>

          {info.isTutor && info.meetUrl && (
            <SectionCard title="Change meeting link">
              <AddMeetLink onSave={saveLink} saving={saving} />
            </SectionCard>
          )}
        </div>

        {classroom && (
          <div className="lg:col-span-2">
            <h2 className="mb-3 font-semibold">Class chat</h2>
            <ChatTab classroom={classroom} />
          </div>
        )}
      </main>
    </div>
  );
}
