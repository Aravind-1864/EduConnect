import { Link } from 'react-router-dom';
import { Award, BookOpen, CheckCircle2, TrendingUp } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { Badge, EmptyState, ErrorState, PageHeader, Spinner, StatCard } from '../components/ui';
import { fmtDate } from '../utils/format';

const STATUS = {
  graded: ['green', 'Graded'],
  submitted: ['blue', 'Submitted'],
  pending: ['yellow', 'To do'],
  missing: ['red', 'Missing'],
};

const letter = (p) => (p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F');

function Meter({ value, color }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full transition-all" style={{ width: `${value ?? 0}%`, background: color }} />
    </div>
  );
}

export default function Grades() {
  const { data, loading, error, reload } = useFetch('/grades');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const all = data.classes.flatMap((c) => c.items);
  const done = all.filter((i) => i.status === 'graded' || i.status === 'submitted').length;
  const best = data.classes.filter((c) => c.average !== null).sort((a, b) => b.average - a.average)[0];

  return (
    <>
      <PageHeader title="My Grades" subtitle="Track your progress across every class." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall average" value={data.overall === null ? '—' : `${data.overall}%`} icon={TrendingUp} />
        <StatCard label="Grade" value={data.overall === null ? '—' : letter(data.overall)} icon={Award} tone="pink" />
        <StatCard label="Work completed" value={`${done}/${all.length}`} icon={CheckCircle2} tone="green" />
        <StatCard label="Strongest subject" value={best ? best.classroom.subject : '—'} icon={BookOpen} tone="amber" />
      </div>

      {data.classes.length ? (
        <div className="mt-6 space-y-6">
          {data.classes.map(({ classroom, items, average }) => (
            <section key={classroom._id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 p-5">
                <span className="size-10 rounded-xl" style={{ background: classroom.color }} />
                <div className="min-w-0 flex-1">
                  <Link to={`/classes/${classroom._id}`} className="font-semibold text-slate-900 hover:text-brand-600">{classroom.title}</Link>
                  <div className="mt-2 flex items-center gap-3">
                    <Meter value={average} color={classroom.color} />
                    <span className="shrink-0 text-sm font-semibold text-slate-700">{average === null ? 'No grades yet' : `${average}% · ${letter(average)}`}</span>
                  </div>
                </div>
              </div>
              {items.length ? (
                <ul className="divide-y divide-slate-100">
                  {items.map((i) => {
                    const [color, label] = STATUS[i.status];
                    return (
                      <li key={i._id}>
                        <Link to={`/classes/${classroom._id}/assignments/${i._id}`} className="flex flex-wrap items-center gap-4 px-5 py-3 hover:bg-slate-50">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{i.title}</p>
                            <p className="text-xs text-slate-500">Due {fmtDate(i.dueDate)}{i.feedback && ` · “${i.feedback}”`}</p>
                          </div>
                          <Badge color={color}>{label}</Badge>
                          <span className="w-20 text-right text-sm font-semibold text-slate-900">{i.grade !== null ? `${i.grade}/${i.maxMarks}` : '—'}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="p-5 text-sm text-slate-500">No assignments in this class yet.</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6"><EmptyState icon={Award} title="No classes yet" text="Join a class to start tracking grades." /></div>
      )}
    </>
  );
}
