import { useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, FileText, FolderOpen, Link2, Trash2, Upload } from 'lucide-react';
import { api, errorMessage, fileUrl } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { Button, EmptyState, Input, Modal, Spinner, Textarea, cx } from '../../components/ui';
import { fmtBytes, fmtDate } from '../../utils/format';

function AddMaterialModal({ classId, open, onClose, onAdded }) {
  const [mode, setMode] = useState('file');
  const [form, setForm] = useState({ title: '', description: '', link: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const body = new FormData();
    body.append('title', form.title);
    body.append('description', form.description);
    if (mode === 'file') body.append('file', file);
    else body.append('link', form.link);

    setBusy(true);
    try {
      const { data } = await api.post(`/classes/${classId}/materials`, body);
      onAdded(data);
      toast.success('Material added');
      setForm({ title: '', description: '', link: '' });
      setFile(null);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add study material">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {[['file', 'Upload file'], ['link', 'Add link']].map(([m, label]) => (
            <button type="button" key={m} onClick={() => setMode(m)} className={cx('rounded-md py-1.5 text-sm font-medium', mode === m ? 'bg-surface shadow-sm' : 'text-slate-500')}>
              {label}
            </button>
          ))}
        </div>
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {mode === 'file' ? (
          <Input label="File" type="file" required hint="PDF, Word, PowerPoint, images, video - max 25 MB" onChange={(e) => setFile(e.target.files[0])} />
        ) : (
          <Input label="URL" type="url" required placeholder="https://" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Add</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function MaterialsTab({ classroom }) {
  const { data: items, setData, loading } = useFetch(`/classes/${classroom._id}/materials`);
  const [open, setOpen] = useState(false);

  const remove = async (m) => {
    if (!window.confirm(`Delete "${m.title}"?`)) return;
    try {
      await api.delete(`/classes/${classroom._id}/materials/${m._id}`);
      setData((prev) => prev.filter((x) => x._id !== m._id));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading && !items) return <Spinner />;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{items.length} item{items.length === 1 ? '' : 's'}</p>
        {classroom.isTutor && <Button icon={Upload} onClick={() => setOpen(true)}>Add material</Button>}
      </div>

      {items.length ? (
        <div className="card divide-y divide-slate-100">
          {items.map((m) => (
            <div key={m._id} className="flex items-center gap-4 p-4">
              <div className={cx('rounded-xl p-3', m.type === 'file' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')}>
                {m.type === 'file' ? <FileText className="size-5" /> : <Link2 className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.title}</p>
                <p className="truncate text-sm text-slate-500">
                  {m.description ? `${m.description} · ` : ''}
                  {fmtDate(m.createdAt)}
                  {m.fileSize ? ` · ${fmtBytes(m.fileSize)}` : ''}
                </p>
              </div>
              <a href={fileUrl(m.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
                {m.type === 'file' ? 'Download' : 'Open'} <ExternalLink className="size-3.5" />
              </a>
              {classroom.isTutor && (
                <button onClick={() => remove(m)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FolderOpen} title="No materials yet" text={classroom.isTutor ? 'Upload notes, slides or links for your students.' : 'Your tutor has not shared any material yet.'} />
      )}

      <AddMaterialModal classId={classroom._id} open={open} onClose={() => setOpen(false)} onAdded={(m) => setData((prev) => [m, ...prev])} />
    </>
  );
}
