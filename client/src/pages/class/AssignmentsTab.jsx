import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardList, Plus } from 'lucide-react';
import { api, errorMessage } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { Badge, Button, EmptyState, Input, Modal, Spinner, Textarea } from '../../components/ui';
import { fmtDateTime, isOverdue, toLocalInput } from '../../utils/format';

function CreateAssignmentModal({ classId, open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', dueDate: toLocalInput(Date.now() + 7 * 864e5), maxMarks: 100 });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const body = new FormData();
    Object.entries({ ...form, dueDate: new Date(form.dueDate).toISOString() }).forEach(([k, v]) => body.append(k, v));
    if (file) body.append('file', file);
    setBusy(true);
    try {
      const { data } = await api.post(`/classes/${classId}/assignments`, body);
      onCreated(data);
      toast.success('Assignment posted');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New assignment">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Title" required value={form.title} onChange={set('title')} />
        <Textarea label="Instructions" value={form.description} onChange={set('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Due date" type="datetime-local" required value={form.dueDate} onChange={set('dueDate')} />
          <Input label="Max marks" type="number" min={1} required value={form.maxMarks} onChange={set('maxMarks')} />
        </div>
        <Input label="Attachment (optional)" type="file" onChange={(e) => setFile(e.target.files[0])} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Post assignment</Button>
        </div>
      </form>
    </Modal>
  );
}

function StudentStatus({ a }) {
  const s = a.mySubmission;
  if (s?.grade !== undefined && s?.grade !== null) return <Badge color="green">Graded · {s.grade}/{a.maxMarks}</Badge>;
  if (s) return <Badge color="blue">Submitted{s.isLate ? ' (late)' : ''}</Badge>;
  return isOverdue(a.dueDate) ? <Badge color="red">Missing</Badge> : <Badge color="yellow">To do</Badge>;
}

export default function AssignmentsTab({ classroom }) {
  const { data: items, setData, loading } = useFetch(`/classes/${classroom._id}/assignments`);
  const [open, setOpen] = useState(false);

  if (loading && !items) return <Spinner />;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{items.length} assignment{items.length === 1 ? '' : 's'}</p>
        {classroom.isTutor && <Button icon={Plus} onClick={() => setOpen(true)}>New assignment</Button>}
      </div>

      {items.length ? (
        <div className="card divide-y divide-slate-100">
          {items.map((a) => (
            <Link key={a._id} to={`/classes/${classroom._id}/assignments/${a._id}`} className="flex flex-wrap items-center gap-4 p-4 transition hover:bg-slate-50">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <ClipboardList className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.title}</p>
                <p className="text-sm text-slate-500">Due {fmtDateTime(a.dueDate)} · {a.maxMarks} marks</p>
              </div>
              {classroom.isTutor ? (
                <div className="text-right text-sm">
                  <p className="font-semibold">{a.submittedCount}/{a.studentCount} submitted</p>
                  <p className="text-slate-500">{a.gradedCount} graded</p>
                </div>
              ) : (
                <StudentStatus a={a} />
              )}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title="No assignments yet" text={classroom.isTutor ? 'Create an assignment for your students.' : 'Nothing assigned yet - enjoy!'} />
      )}

      <CreateAssignmentModal
        classId={classroom._id}
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(a) => setData((prev) => [...prev, { ...a, submittedCount: 0, gradedCount: 0, studentCount: classroom.students.length }])}
      />
    </>
  );
}
