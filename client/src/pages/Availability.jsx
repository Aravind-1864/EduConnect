import { useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, Plus, Trash2, X } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Avatar, Badge, Button, EmptyState, ErrorState, Input, PageHeader, SectionCard, Spinner } from '../components/ui';
import { fmtDateTime, toLocalInput } from '../utils/format';

/** Tutors offer time slots; students book them from the tutor's profile. */
function AddSlots({ onAdded }) {
  const { user } = useAuth();
  const subjects = user.subjects ?? [];
  const [form, setForm] = useState({ subject: subjects[0] ?? '', durationMinutes: 60, price: user.hourlyRate ?? 0, note: '' });
  const [times, setTimes] = useState([toLocalInput(Date.now() + 864e5)]);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/slots', {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
        startsAt: times.filter(Boolean).map((t) => new Date(t).toISOString()),
      });
      toast.success(`${data.length} slot${data.length === 1 ? '' : 's'} added - students can book now`);
      setTimes([toLocalInput(Date.now() + 864e5)]);
      onAdded();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title="Add available times">
      <form onSubmit={submit} className="space-y-4">
        {subjects.length ? (
          <label className="block">
            <span className="label">Subject</span>
            <select className="input" value={form.subject} onChange={set('subject')}>
              {subjects.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        ) : (
          <Input label="Subject" required placeholder="e.g. Mathematics" hint="Tip: add your subjects in Profile to pick them here" value={form.subject} onChange={set('subject')} />
        )}

        <div>
          <span className="label">Date &amp; time</span>
          <div className="space-y-2">
            {times.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input className="input" type="datetime-local" required value={t} onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))} />
                {times.length > 1 && (
                  <button type="button" className="rounded-lg px-2 text-slate-400 hover:bg-slate-100 hover:text-red-600" onClick={() => setTimes(times.filter((_, j) => j !== i))} aria-label="Remove time">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {times.length < 20 && (
            <button type="button" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline" onClick={() => setTimes([...times, ''])}>
              <Plus className="size-4" /> Add another time
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Duration</span>
            <select className="input" value={form.durationMinutes} onChange={set('durationMinutes')}>
              {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          <Input label="Price (₹)" type="number" min={0} value={form.price} onChange={set('price')} />
        </div>
        <Input label="Note for students (optional)" placeholder="e.g. Bring your doubts from Chapter 3" value={form.note} onChange={set('note')} />
        <Button type="submit" loading={busy} className="w-full">Publish slots</Button>
      </form>
    </SectionCard>
  );
}

export default function Availability() {
  const { data: slots, setData, loading, error, reload } = useFetch('/slots/mine');

  const remove = async (s) => {
    if (!window.confirm('Remove this slot?')) return;
    try {
      await api.delete(`/slots/${s._id}`);
      setData((prev) => prev.filter((x) => x._id !== s._id));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const open = slots?.filter((s) => !s.booking) ?? [];
  const booked = slots?.filter((s) => s.booking) ?? [];

  return (
    <>
      <PageHeader title="My Availability" subtitle="Offer times for 1-on-1 sessions. Students book them from your profile and the booking is confirmed instantly." />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2"><AddSlots onAdded={reload} /></div>
        <div className="space-y-6 lg:col-span-3">
          {loading && !slots ? (
            <Spinner />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <>
              <SectionCard title={`Open slots (${open.length})`}>
                {open.length ? (
                  <ul className="divide-y divide-slate-100">
                    {open.map((s) => (
                      <li key={s._id} className="flex flex-wrap items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{s.subject}</p>
                          <p className="text-sm text-slate-500">{fmtDateTime(s.startsAt)} · {s.durationMinutes} min{s.price ? ` · ₹${s.price}` : ' · Free'}</p>
                        </div>
                        <Badge color="green">Open</Badge>
                        <button onClick={() => remove(s)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove slot">
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={CalendarClock} title="No open slots" text="Add times on the left so students can book you." />
                )}
              </SectionCard>
              {booked.length > 0 && (
                <SectionCard title={`Booked (${booked.length})`}>
                  <ul className="divide-y divide-slate-100">
                    {booked.map((s) => (
                      <li key={s._id} className="flex flex-wrap items-center gap-3 py-3">
                        {s.booking?.student && <Avatar user={s.booking.student} size="sm" />}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{s.subject} · {s.booking?.student?.name ?? 'Student'}</p>
                          <p className="text-sm text-slate-500">{fmtDateTime(s.startsAt)} · {s.durationMinutes} min</p>
                        </div>
                        <Badge color="blue">Booked</Badge>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
