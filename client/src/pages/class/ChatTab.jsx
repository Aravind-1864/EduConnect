import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCheck, FileText, Loader2, MessagesSquare, Paperclip, Send } from 'lucide-react';
import { api, errorMessage, fileUrl } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Badge, Button, EmptyState, Spinner, cx } from '../../components/ui';
import { fmtBytes, fmtTime } from '../../utils/format';

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
  const fileRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    setSending(true);
    socket.emit('chat:send', { classId: classroom._id, text }, (res) => {
      setSending(false);
      if (!res?.ok) toast.error('Message not sent. Check your connection and try again.');
    });
    setText('');
  };

  const sendFile = async (file) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) return toast.error('File is too large (max 25 MB)');
    const body = new FormData();
    body.append('file', file);
    if (text.trim()) body.append('text', text.trim());
    setUploading(true);
    try {
      await api.post(`/classes/${classroom._id}/messages/attachment`, body);
      setText('');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tutorId = classroom.tutor._id;

  return (
    <div className={cx('flex flex-col', compact ? 'h-full' : 'card h-[calc(100vh-24rem)] min-h-[26rem]')}>
      <div className={cx('flex-1 space-y-4 overflow-y-auto', compact ? 'p-3' : 'p-5')}>
        {loading && !messages ? (
          <Spinner />
        ) : messages.length ? (
          messages.map((m) => {
            const mine = m.sender._id === user._id;
            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(m.fileUrl ?? '');
            return (
              <div key={m._id} className={cx('flex gap-2', mine && 'flex-row-reverse')}>
                {!compact && <Avatar user={m.sender} size="sm" />}
                <div className={cx('flex max-w-[75%] flex-col', mine ? 'items-end' : 'items-start')}>
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-bold">{mine ? 'You' : m.sender.name}</span>
                    {m.sender._id === tutorId && <Badge color="blue" className="!px-1.5 !py-0 text-[10px]">Tutor</Badge>}
                    <span>{fmtTime(m.createdAt)}</span>
                  </p>
                  {m.fileUrl && (
                    <a
                      href={fileUrl(m.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-1 block overflow-hidden rounded-2xl border-2 border-slate-200 bg-surface text-left hover:border-brand-300"
                    >
                      {isImage ? (
                        <img src={fileUrl(m.fileUrl)} alt={m.fileName} className="max-h-56 max-w-xs object-cover" />
                      ) : (
                        <span className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                          <span className="rounded-lg bg-brand-50 p-2 text-brand-600"><FileText className="size-4" /></span>
                          <span className="min-w-0">
                            <span className="block max-w-[14rem] truncate font-bold text-slate-900">{m.fileName}</span>
                            <span className="block text-xs text-slate-500">{fmtBytes(m.fileSize)} · Open</span>
                          </span>
                        </span>
                      )}
                    </a>
                  )}
                  {m.text && (
                    <p className={cx('inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left text-[15px]', mine ? 'rounded-br-md bg-brand-500 text-white' : 'rounded-bl-md bg-slate-100 text-slate-800')}>
                      <Linkified text={m.text} />
                    </p>
                  )}
                  {mine && (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400" title="Delivered to the classroom">
                      <CheckCheck className="size-3.5" /> Sent
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          !compact && <EmptyState icon={MessagesSquare} title="No messages yet" text="Say hello to your classroom." />
        )}
        <div ref={bottomRef} />
      </div>
      <p className="h-5 px-5 text-xs italic text-slate-500">{typing && `${typing} is typing...`}</p>
      <form onSubmit={send} className="flex items-center gap-2 border-t-2 border-slate-100 p-3">
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => sendFile(e.target.files[0])} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          aria-label="Attach a file"
          title="Attach a file (max 25 MB)"
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <Paperclip className="size-5" />}
        </button>
        <input
          className="input"
          placeholder="Type a message..."
          value={text}
          maxLength={2000}
          onChange={(e) => {
            setText(e.target.value);
            socket?.emit('chat:typing', { classId: classroom._id });
          }}
        />
        <Button type="submit" disabled={!text.trim() || sending} aria-label="Send message">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
