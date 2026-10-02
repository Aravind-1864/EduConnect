import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Megaphone, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { useSocket } from '../../context/SocketContext';
import { Avatar, Button, EmptyState, SectionCard, Spinner } from '../../components/ui';
import { fromNow } from '../../utils/format';

export default function StreamTab({ classroom }) {
  const socket = useSocket();
  const { data: items, setData, loading } = useFetch(`/classes/${classroom._id}/announcements`);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (a) => setData((prev) => (prev?.some((x) => x._id === a._id) ? prev : [a, ...(prev ?? [])]));
    socket.on('announcement:new', onNew);
    return () => socket.off('announcement:new', onNew);
  }, [socket, setData]);

  const post = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/classes/${classroom._id}/announcements`, { text });
      setData((prev) => (prev.some((x) => x._id === data._id) ? prev : [data, ...prev]));
      setText('');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await api.delete(`/classes/${classroom._id}/announcements/${id}`);
    setData((prev) => prev.filter((a) => a._id !== id));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {classroom.isTutor && (
          <form onSubmit={post} className="card p-4">
            <textarea className="input min-h-20 resize-none border-0 p-0 focus:ring-0" placeholder="Announce something to your class..." value={text} onChange={(e) => setText(e.target.value)} />
            <div className="mt-3 flex justify-end">
              <Button type="submit" size="sm" loading={busy} disabled={!text.trim()}>Post</Button>
            </div>
          </form>
        )}

        {loading && !items ? (
          <Spinner />
        ) : items.length ? (
          items.map((a) => (
            <article key={a._id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar user={a.author} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.author.name}</p>
                  <p className="text-xs text-slate-500">{fromNow(a.createdAt)}</p>
                </div>
                {classroom.isTutor && (
                  <button onClick={() => remove(a._id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-slate-700">{a.text}</p>
            </article>
          ))
        ) : (
          <EmptyState icon={Megaphone} title="No announcements yet" text="Updates from the tutor will appear here." />
        )}
      </div>

      <SectionCard title="About this class">
        <p className="whitespace-pre-wrap text-sm text-slate-600">{classroom.description || 'No description yet.'}</p>
        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
          <Avatar user={classroom.tutor} />
          <div>
            <p className="text-sm font-medium">{classroom.tutor.name}</p>
            <p className="text-xs text-slate-500">Tutor</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
