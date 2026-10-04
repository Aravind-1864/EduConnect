import { Link } from 'react-router-dom';
import { Users, Video } from 'lucide-react';
import { Badge } from './ui';
import { fmtDateTime } from '../utils/format';

export function ClassCard({ c }) {
  return (
    <Link to={`/classes/${c._id}`} className="card group overflow-hidden">
      <div className="relative h-24 p-5" style={{ background: c.color }}>
        <p className="text-lg font-bold text-white drop-shadow-sm">{c.title}</p>
        <p className="text-sm text-white/85">{c.subject}</p>
      </div>
      <div className="flex items-center justify-between p-5 text-sm">
        <span className="text-slate-700">{c.tutor?.name}</span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Users className="size-4" /> {c.studentCount ?? 0}
        </span>
      </div>
    </Link>
  );
}

export const SESSION_STATUS = {
  scheduled: ['blue', 'Scheduled'],
  live: ['red', 'Live now'],
  ended: ['gray', 'Ended'],
  cancelled: ['gray', 'Cancelled'],
};

export function SessionRow({ session, classroom, action }) {
  const [color, label] = SESSION_STATUS[session.status];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border-2 border-slate-200 bg-surface p-4 transition hover:border-brand-300">
      <div className="rounded-xl p-3" style={{ background: `${classroom?.color ?? '#6366f1'}1a` }}>
        <Video className="size-5" style={{ color: classroom?.color ?? '#6366f1' }} />
      </div>
      <div className="min-w-[12rem] flex-1">
        <p className="line-clamp-2 font-bold text-slate-900" title={session.title}>{session.title}</p>
        <p className="text-sm text-slate-500">
          {classroom?.title && `${classroom.title} · `}
          {fmtDateTime(session.startsAt)} · {session.durationMinutes} min
        </p>
      </div>
      {session.code && (
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-sm font-semibold tracking-widest text-slate-700" title="Meet code">
          {session.code}
        </span>
      )}
      <Badge color={color}>
        {session.status === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-red-500" />}
        {label}
      </Badge>
      {action}
    </div>
  );
}
