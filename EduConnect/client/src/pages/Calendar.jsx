import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek,
} from 'date-fns';
import { CalendarCheck, ChevronLeft, ChevronRight, ClipboardList, Video } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { Badge, Button, EmptyState, ErrorState, PageHeader, SectionCard, Spinner, cx } from '../components/ui';

const TYPE = {
  session: { icon: Video, label: 'Live session', color: 'blue' },
  assignment: { icon: ClipboardList, label: 'Due', color: 'yellow' },
  booking: { icon: CalendarCheck, label: '1-on-1', color: 'purple' },
};

function EventItem({ e }) {
  const { icon: Icon, label, color } = TYPE[e.type];
  return (
    <Link to={e.link} className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-slate-50">
      <div className="mt-0.5 rounded-lg p-2" style={{ background: `${e.color}22`, color: e.color }}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{e.title}</p>
        <p className="truncate text-xs text-slate-500">{format(new Date(e.start), 'h:mm a')} · {e.subtitle}</p>
      </div>
      <Badge color={color}>{label}</Badge>
    </Link>
  );
}

export default function Calendar() {
  const { data: events, loading, error, reload } = useFetch('/calendar');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) }),
    [month]
  );

  const byDay = useMemo(() => {
    const map = {};
    for (const e of events ?? []) {
      const k = format(new Date(e.start), 'yyyy-MM-dd');
      (map[k] ??= []).push(e);
    }
    return map;
  }, [events]);

  if (loading && !events) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const selectedEvents = byDay[format(selected, 'yyyy-MM-dd')] ?? [];
  const upcoming = events.filter((e) => new Date(e.start) >= new Date()).slice(0, 6);

  return (
    <>
      <PageHeader title="Calendar" subtitle="Live sessions, assignment deadlines and 1-on-1 tutoring in one view." />
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{format(month, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Previous month"><ChevronLeft className="size-4" /></Button>
              <Button size="sm" variant="secondary" onClick={() => { setMonth(startOfMonth(new Date())); setSelected(new Date()); }}>Today</Button>
              <Button size="sm" variant="ghost" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month"><ChevronRight className="size-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const list = byDay[format(day, 'yyyy-MM-dd')] ?? [];
              const active = isSameDay(day, selected);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(day)}
                  className={cx(
                    'flex min-h-20 flex-col rounded-xl border p-1.5 text-left transition sm:min-h-24',
                    active ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-transparent hover:bg-slate-50',
                    !isSameMonth(day, month) && 'opacity-40'
                  )}
                >
                  <span className={cx('flex size-7 items-center justify-center rounded-full text-sm', isToday(day) ? 'bg-brand-600 font-bold text-white' : 'text-slate-700')}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 hidden space-y-0.5 sm:block">
                    {list.slice(0, 2).map((e) => (
                      <p key={e.id} className="truncate rounded px-1 text-[11px] font-medium" style={{ background: `${e.color}22`, color: e.color }}>
                        {e.title}
                      </p>
                    ))}
                    {list.length > 2 && <p className="px-1 text-[11px] text-slate-500">+{list.length - 2} more</p>}
                  </div>
                  {list.length > 0 && (
                    <div className="mt-auto flex gap-0.5 sm:hidden">
                      {list.slice(0, 3).map((e) => <span key={e.id} className="size-1.5 rounded-full" style={{ background: e.color }} />)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <SectionCard title={isToday(selected) ? 'Today' : format(selected, 'EEEE, d MMMM')}>
            {selectedEvents.length ? (
              <div className="-mx-3 space-y-1">{selectedEvents.map((e) => <EventItem key={e.id} e={e} />)}</div>
            ) : (
              <EmptyState icon={CalendarCheck} title="Nothing scheduled" text="Enjoy the free time - or start a focus session!" />
            )}
          </SectionCard>
          <SectionCard title="Coming up">
            {upcoming.length ? (
              <div className="-mx-3 space-y-1">{upcoming.map((e) => <EventItem key={e.id} e={e} />)}</div>
            ) : (
              <p className="text-sm text-slate-500">No upcoming events.</p>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
