import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Paperclip, Trash2 } from 'lucide-react';
import { api, errorMessage, fileUrl } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { Avatar, Badge, Button, ErrorState, Input, Modal, SectionCard, Spinner, Textarea } from '../../components/ui';
import { fmtDateTime, fromNow, isOverdue } from '../../utils/format';

const Attachment = ({ url, name }) =>
  url ? (
    <a href={fileUrl(url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-brand-600 hover:bg-brand-50">
      <Paperclip className="size-4" /> {name ?? 'Attachment'}
    </a>
  ) : null;

function StudentView({ classId, assignment, submission, onSubmitted }) {
  const graded = submission?.grade !== undefined && submission?.grade !== null;
  const [text, setText] = useState(submission?.text ?? '');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const body = new FormData();
    body.append('text', text);
    if (file) body.append('file', file);
    setBusy(true);
    try {
      const { data } = await api.post(`/classes/${classId}/assignments/${assignment._id}/submit`, body);
      toast.success(submission ? 'Submission updated' : 'Assignment submitted');
      onSubmitted(data);
      setFile(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (graded) {
    return (
      <SectionCard title="Your grade">
        <p className="text-4xl font-bold text-emerald-600">
          {submission.grade}
          <span className="text-xl text-slate-400">/{assignment.maxMarks}</span>
        </p>
        {submission.feedback && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tutor feedback</p>
            <p className="mt-1 text-slate-700">{submission.feedback}</p>
          </div>
        )}
        <div className="mt-4 space-y-2 text-sm text-slate-500">
          <p>Submitted {fmtDateTime(submission.submittedAt)}</p>
          <Attachment url={submission.fileUrl} name={submission.fileName} />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Your work"
      action={submission ? <Badge color="blue">Submitted {fromNow(submission.submittedAt)}</Badge> : isOverdue(assignment.dueDate) ? <Badge color="red">Overdue</Badge> : null}
    >
      <form onSubmit={submit} className="space-y-4">
        <Textarea label="Answer" rows={6} placeholder="Type your answer here..." value={text} onChange={(e) => setText(e.target.value)} />
        {submission?.fileUrl && (
          <div>
            <p className="label">Current file</p>
            <Attachment url={submission.fileUrl} name={submission.fileName} />
          </div>
        )}
        <Input label={submission?.fileUrl ? 'Replace file' : 'Attach file'} type="file" onChange={(e) => setFile(e.target.files[0])} />
        <Button type="submit" loading={busy} className="w-full">
          {submission ? 'Resubmit' : 'Turn in'}
        </Button>
        {isOverdue(assignment.dueDate) && <p className="text-center text-xs text-amber-600">The due date has passed - this will be marked late.</p>}
      </form>
    </SectionCard>
  );
}

function GradeModal({ classId, assignment, row, onClose, onGraded }) {
  const [grade, setGrade] = useState(row.submission.grade ?? '');
  const [feedback, setFeedback] = useState(row.submission.feedback ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/classes/${classId}/assignments/${assignment._id}/submissions/${row.submission._id}`, { grade, feedback });
      toast.success(`Graded ${row.student.name}`);
      onGraded(data);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const s = row.submission;
  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={`Grade: ${row.student.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="success" loading={busy} onClick={save}>Save grade</Button>
        </>
      }
    >
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          Submitted {fmtDateTime(s.submittedAt)} {s.isLate && <Badge color="red">Late</Badge>}
        </p>
        {s.text && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{s.text}</p>}
        <div className="mt-3">
          <Attachment url={s.fileUrl} name={s.fileName} />
        </div>
      </div>
      <Input label={`Marks (out of ${assignment.maxMarks})`} type="number" min={0} max={assignment.maxMarks} required value={grade} onChange={(e) => setGrade(e.target.value)} />
      <Textarea label="Feedback" placeholder="What went well? What to improve?" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
    </Modal>
  );
}

function TutorView({ classId, assignment, roster, setRoster }) {
  const [grading, setGrading] = useState(null);
  const submitted = roster.filter((r) => r.submission);
  const graded = submitted.filter((r) => r.submission.grade !== undefined && r.submission.grade !== null);

  const status = (r) => {
    if (!r.submission) return <Badge>{isOverdue(assignment.dueDate) ? 'Missing' : 'Not submitted'}</Badge>;
    if (r.submission.grade !== undefined && r.submission.grade !== null) return <Badge color="green">Graded</Badge>;
    return r.submission.isLate ? <Badge color="red">Late</Badge> : <Badge color="yellow">Needs grading</Badge>;
  };

  return (
    <SectionCard title="Submissions" action={<span className="text-sm text-slate-500">{submitted.length}/{roster.length} submitted · {graded.length} graded</span>}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-4 font-medium">Student</th>
              <th className="py-2 pr-4 font-medium">Submitted</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Grade</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roster.map((r) => (
              <tr key={r.student._id}>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Avatar user={r.student} size="sm" />
                    {r.student.name}
                  </div>
                </td>
                <td className="py-3 pr-4 text-slate-500">{r.submission ? fmtDateTime(r.submission.submittedAt) : '—'}</td>
                <td className="py-3 pr-4">{status(r)}</td>
                <td className="py-3 pr-4 font-medium">{r.submission?.grade ?? '—'}{r.submission?.grade != null && `/${assignment.maxMarks}`}</td>
                <td className="py-3 text-right">
                  {r.submission && (
                    <Button size="sm" variant={r.submission.grade != null ? 'secondary' : 'primary'} onClick={() => setGrading(r)}>
                      {r.submission.grade != null ? 'Edit' : 'Grade'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {grading && (
        <GradeModal
          classId={classId}
          assignment={assignment}
          row={grading}
          onClose={() => setGrading(null)}
          onGraded={(sub) => setRoster((prev) => prev.map((r) => (r.student._id === sub.student._id ? { ...r, submission: sub } : r)))}
        />
      )}
    </SectionCard>
  );
}

export default function AssignmentDetail() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { data, setData, loading, error, reload } = useFetch(`/classes/${classId}/assignments/${assignmentId}`);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { assignment } = data;
  const back = `/classes/${classId}?tab=assignments`;

  const remove = async () => {
    if (!window.confirm('Delete this assignment and all its submissions?')) return;
    await api.delete(`/classes/${classId}/assignments/${assignmentId}`);
    toast.success('Assignment deleted');
    navigate(back);
  };

  return (
    <>
      <Link to={back} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> Back to assignments
      </Link>
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{assignment.title}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Due {fmtDateTime(assignment.dueDate)} · {assignment.maxMarks} marks
              </p>
            </div>
            {data.isTutor && (
              <Button variant="ghost" size="sm" icon={Trash2} onClick={remove}>Delete</Button>
            )}
          </div>
          <p className="mt-6 whitespace-pre-wrap text-slate-700">{assignment.description || 'No instructions provided.'}</p>
          <div className="mt-6">
            <Attachment url={assignment.attachmentUrl} name="Assignment file" />
          </div>
        </section>

        <div className="lg:col-span-2">
          {data.isTutor ? null : (
            <StudentView classId={classId} assignment={assignment} submission={data.mySubmission} onSubmitted={(s) => setData({ ...data, mySubmission: s })} />
          )}
        </div>
      </div>
      {data.isTutor && (
        <div className="mt-6">
          <TutorView
            classId={classId}
            assignment={assignment}
            roster={data.roster}
            setRoster={(fn) => setData((d) => ({ ...d, roster: fn(d.roster) }))}
          />
        </div>
      )}
    </>
  );
}
