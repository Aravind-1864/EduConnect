import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquare, Send } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Badge, Button, EmptyState, Spinner, cx } from '../../components/ui';
import { fmtTime } from '../../utils/format';

const URL_RE = /(https?:\/\/[^\s]+)/g;

/** Path of a link to a class meet on this site (any host, so dev/prod links both work), else null. */
const meetPath = (url) => {
  try {
    const { pathname } = new URL(url);
    return /^\/live\/[a-f0-9]{24}\/[a-f0-9]{24}$/.test(pathname) ? pathname : null;
  } catch {
    return null;
  }
};

/** Renders message text with links clickable; class meet links show as a short "Open class meet". */
function Linkified({ text }) {
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    const path = meetPath(part);
    return path ? (
      <Link key={i} to={path} className="font-semibold underline underline-offset-2">
        Open class meet
      </Link>
    ) : (
      <a key={i} href={part} target="_blank" rel="noreferrer" className="break-all font-medium underline underline-offset-2">
        {part}
      </a>
    );
  });
}

/** Real-time class chat. Also used inside the live session sidebar (compact). */
export default function ChatTab({ classroom, compact }) {
  const { user } = useAuth();
  const socket = useSocket();
  const { data: messages, setData, loading } = useFetch(`/classes/${classroom._id}/messages`);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!socket) return undefined;
    socket.emit('class:join', classroom._id);
    const onMessage = (m) => setData((prev) => [...(prev ?? []), m]);
    const onTyping = ({ name }) => {
      setTyping(name);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 2000);
    };
    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
    };
  }, [socket, classroom._id, setData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages?.length]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('chat:send', { classId: classroom._id, text });
    setText('');
  };

  const tutorId = classroom.tutor._id;

  return (
    <div className={cx('flex flex-col', compact ? 'h-full' : 'card h-[65vh]')}>
      <div className={cx('flex-1 space-y-4 overflow-y-auto', compact ? 'p-3' : 'p-5')}>
        {loading && !messages ? (
          <Spinner />
        ) : messages.length ? (
          messages.map((m) => {
            const mine = m.sender._id === user._id;
            return (
              <div key={m._id} className={cx('flex gap-2', mine && 'flex-row-reverse')}>
                {!compact && <Avatar user={m.sender} size="sm" />}
                <div className={cx('max-w-[75%]', mine && 'text-right')}>
                  <p className={cx('mb-1 flex items-center gap-1.5 text-xs', compact ? 'text-slate-400' : 'text-slate-500', mine && 'justify-end')}>
                    <span className="font-medium">{mine ? 'You' : m.sender.name}</span>
                    {m.sender._id === tutorId && <Badge color="blue" className="!px-1.5 !py-0 text-[10px]">Tutor</Badge>}
                    <span>{fmtTime(m.createdAt)}</span>
                  </p>
                  <p className={cx('inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left text-sm', mine ? 'bg-brand-600 text-white' : compact ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-800')}>
                    <Linkified text={m.text} />
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          !compact && <EmptyState icon={MessagesSquare} title="No messages yet" text="Start the conversation!" />
        )}
        <div ref={bottomRef} />
      </div>
      <p className={cx('h-5 px-5 text-xs italic', compact ? 'text-slate-400' : 'text-slate-500')}>{typing && `${typing} is typing...`}</p>
      <form onSubmit={send} className={cx('flex gap-2 border-t p-3', compact ? 'border-slate-700' : 'border-slate-100')}>
        <input
          className={cx('input', compact && 'border-slate-600 bg-slate-800 text-white')}
          placeholder="Type a message..."
          value={text}
          maxLength={2000}
          onChange={(e) => {
            setText(e.target.value);
            socket?.emit('chat:typing', { classId: classroom._id });
          }}
        />
        <Button type="submit" disabled={!text.trim()} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
