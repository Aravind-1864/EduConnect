import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExternalLink, LogOut, MessageSquare, PhoneOff } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { Button, Spinner, cx } from '../components/ui';
import ChatTab from './class/ChatTab';

const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN ?? 'meet.jit.si';

function loadJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://${JITSI_DOMAIN}/external_api.js`;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load the video service'));
    document.body.appendChild(s);
  });
}

/**
 * Live video room. Used for class sessions (/live/:classId/:sessionId)
 * and 1-on-1 bookings (/meet/:bookingId, `oneOnOne`).
 */
export default function LiveSession({ oneOnOne }) {
  const { classId, sessionId, bookingId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [info, setInfo] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const backTo = oneOnOne ? '/bookings' : `/classes/${classId}?tab=sessions`;

  useEffect(() => {
    const load = oneOnOne
      ? api.get(`/bookings/${bookingId}/join`).then(({ data }) => setInfo({ ...data, title: `${data.booking.subject} · 1-on-1` }))
      : Promise.all([api.post(`/classes/${classId}/sessions/${sessionId}/join`), api.get(`/classes/${classId}`)]).then(([s, c]) => {
          setInfo({ ...s.data, roomName: s.data.session.roomName, title: s.data.session.title });
          setClassroom(c.data);
        });
    load.catch((err) => {
      toast.error(errorMessage(err));
      navigate(backTo, { replace: true });
    });
  }, [oneOnOne, bookingId, classId, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!info || !containerRef.current) return undefined;
    let disposed = false;
    loadJitsiScript()
      .then(() => {
        if (disposed) return;
        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: info.roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: info.displayName, email: info.email },
          configOverwrite: { prejoinPageEnabled: false, startWithAudioMuted: !info.isTutor, disableDeepLinking: true },
          interfaceConfigOverwrite: { MOBILE_APP_PROMO: false, SHOW_JITSI_WATERMARK: false },
        });
        apiRef.current.addListener('readyToClose', () => navigate(backTo));
      })
      .catch((err) => toast.error(err.message));
    return () => {
      disposed = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [info]); // eslint-disable-line react-hooks/exhaustive-deps

  const endForEveryone = async () => {
    if (!window.confirm('End this session for everyone?')) return;
    try {
      await api.patch(`/classes/${classId}/sessions/${sessionId}`, { status: 'ended' });
      apiRef.current?.executeCommand('hangup');
      navigate(backTo);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (!info) return <div className="keep-colors min-h-screen bg-slate-900"><Spinner /></div>;

  return (
    <div className="keep-colors flex h-screen flex-col bg-slate-900 text-white">
      <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
        <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400">
          <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
        </span>
        <h1 className="truncate font-semibold text-white">{info.title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <a href={`https://${JITSI_DOMAIN}/${info.roomName}`} target="_blank" rel="noreferrer" className="hidden items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 sm:inline-flex">
            Open in new tab <ExternalLink className="size-3.5" />
          </a>
          {classroom && (
            <button onClick={() => setShowChat((v) => !v)} className={cx('rounded-lg p-2 hover:bg-slate-800', showChat ? 'text-brand-200' : 'text-slate-400')} aria-label="Toggle chat">
              <MessageSquare className="size-5" />
            </button>
          )}
          {info.isTutor && !oneOnOne && (
            <Button size="sm" variant="danger" icon={PhoneOff} onClick={endForEveryone}>End for all</Button>
          )}
          <Button size="sm" variant="secondary" icon={LogOut} onClick={() => navigate(backTo)}>Leave</Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div ref={containerRef} className="min-w-0 flex-1" />
        {classroom && showChat && (
          <aside className="hidden w-80 border-l border-slate-800 bg-slate-900 md:block">
            <ChatTab classroom={classroom} compact />
          </aside>
        )}
      </div>
    </div>
  );
}
