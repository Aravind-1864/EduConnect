import { Link } from 'react-router-dom';
import { Users, Video } from 'lucide-react';
import { Badge } from './ui';
import { fmtDateTime } from '../utils/format';

export function ClassCard({ c }) {
  return (
    <Link to={`/classes/${c._id}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
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
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4">
      <div className="rounded-xl p-3" style={{ background: `${classroom?.color ?? '#6366f1'}1a` }}>
        <Video className="size-5" style={{ color: classroom?.color ?? '#6366f1' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{session.title}</p>
        <p className="text-sm text-slate-500">
          {classroom?.title && `${classroom.title} · `}
          {fmtDateTime(session.startsAt)} · {session.durationMinutes} min
        </p>
      </div>
      <Badge color={color}>
        {session.status === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-red-500" />}
        {label}
      </Badge>
      {action}
    </div>
  );
}
