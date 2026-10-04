import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarPlus, Star } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Avatar, Badge, Button, ErrorState, Input, Modal, SectionCard, Select, Spinner, Textarea, cx } from '../components/ui';
import { fromNow, toLocalInput } from '../utils/format';
import { DemoBadge, Rating } from './Tutors';

function BookModal({ tutor, open, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: tutor.subjects[0] ?? '',
    startsAt: toLocalInput(Date.now() + 864e5),
    durationMinutes: 60,
    note: '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/bookings', { ...form, tutorId: tutor._id, startsAt: new Date(form.startsAt).toISOString() });
      toast.success(tutor.isDemo ? `Booking confirmed with ${tutor.name} (demo)` : `Request sent to ${tutor.name}`);
      navigate('/bookings');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Book a session with ${tutor.name}`}>
      <form onSubmit={submit} className="space-y-4">
        {tutor.subjects.length ? (
          <Select label="Subject" value={form.subject} onChange={set('subject')}>
            {tutor.subjects.map((s) => <option key={s}>{s}</option>)}
          </Select>
        ) : (
          <Input label="Subject" required value={form.subject} onChange={set('subject')} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date & time" type="datetime-local" required value={form.startsAt} onChange={set('startsAt')} />
          <Select label="Duration" value={form.durationMinutes} onChange={set('durationMinutes')}>
            {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </Select>
        </div>
        <Textarea label="What do you need help with?" value={form.note} onChange={set('note')} />
        {tutor.hourlyRate > 0 && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Estimated fee: <b>₹{Math.round((tutor.hourlyRate * form.durationMinutes) / 60)}</b> (paid directly to the tutor)
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Send request</Button>
        </div>
      </form>
    </Modal>
  );
}

function ReviewForm({ tutorId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/tutors/${tutorId}/reviews`, { rating, comment });
      toast.success('Thanks for your review!');
      setComment('');
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-slate-50 p-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star className={cx('size-6', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
          </button>
        ))}
      </div>
      <Textarea placeholder="Share your experience (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <Button type="submit" size="sm" loading={busy}>Submit review</Button>
    </form>
  );
}

export default function TutorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(`/tutors/${id}`);
  const [booking, setBooking] = useState(false);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { tutor, reviews, rating, reviewCount } = data;

  return (
    <>
      <Link to="/tutors" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> All tutors
      </Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 text-center lg:self-start">
          <div className="flex justify-center"><Avatar user={tutor} size="xl" /></div>
          <h1 className="mt-4 text-xl font-bold">{tutor.name}</h1>
          <div className="mt-1">{tutor.isDemo ? <DemoBadge /> : <Rating rating={rating} count={reviewCount} />}</div>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {tutor.subjects.map((s) => <Badge key={s} color="blue">{s}</Badge>)}
          </div>
          {tutor.hourlyRate > 0 && <p className="mt-4 text-2xl font-bold">₹{tutor.hourlyRate}<span className="text-sm font-normal text-slate-500"> / hour</span></p>}
          {user.role === 'student' && (
            <Button className="mt-6 w-full" icon={CalendarPlus} onClick={() => setBooking(true)}>Book a session</Button>
          )}
          {tutor.isDemo && (
            <p className="mt-3 text-xs text-slate-500">This is a sample tutor profile so you can try booking. Bookings with demo tutors are confirmed instantly.</p>
          )}
        </section>

        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="About">
            <p className="whitespace-pre-wrap text-slate-600">{tutor.bio || 'This tutor has not written a bio yet.'}</p>
          </SectionCard>
          <SectionCard title={`Reviews (${reviewCount})`}>
            {user.role === 'student' && !tutor.isDemo && <div className="mb-4"><ReviewForm tutorId={tutor._id} onDone={reload} /></div>}
            {reviews.length ? (
              <ul className="divide-y divide-slate-100">
                {reviews.map((r) => (
                  <li key={r._id} className="flex gap-3 py-4">
                    <Avatar user={r.student} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{r.student.name}</p>
                        <span className="flex">
                          {Array.from({ length: r.rating }, (_, i) => <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />)}
                        </span>
                        <span className="text-xs text-slate-400">{fromNow(r.createdAt)}</span>
                      </div>
                      {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No reviews yet.</p>
            )}
          </SectionCard>
        </div>
      </div>
      {booking && <BookModal tutor={tutor} open onClose={() => setBooking(false)} />}
    </>
  );
}
