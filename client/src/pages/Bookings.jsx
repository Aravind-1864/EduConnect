import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarCheck, Video } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Avatar, Badge, Button, EmptyState, ErrorState, Modal, PageHeader, Spinner, cx } from '../components/ui';
import MeetLinkFields, { MEET_URL_RE } from '../components/MeetLinkForm';
import { fmtDateTime } from '../utils/format';

const STATUS_COLOR = { pending: 'yellow', confirmed: 'green', declined: 'red', cancelled: 'gray', completed: 'blue' };

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTutor = user.role === 'tutor';
  const { data: bookings, setData, loading, error, reload } = useFetch('/bookings');
  const [filter, setFilter] = useState('upcoming');
  const [busyId, setBusyId] = useState(null);

  const [accepting, setAccepting] = useState(null);
  const [meet, setMeet] = useState({ meetUrl: '', autoMeet: false });

  const update = async (b, status, extra = {}) => {
    setBusyId(b._id);
    try {
      const { data } = await api.patch(`/bookings/${b._id}`, { status, ...extra });
      setData((prev) => prev.map((x) => (x._id === data._id ? data : x)));
      toast.success(`Booking ${status}`);
      setAccepting(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !bookings) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const upcoming = (b) => ['pending', 'confirmed'].includes(b.status);
  const shown = bookings.filter((b) => (filter === 'upcoming' ? upcoming(b) : !upcoming(b)));

  return (
    <>
      <PageHeader
        title={isTutor ? '1-on-1 requests' : 'My bookings'}
        subtitle={isTutor ? 'Accept or decline private session requests from students.' : 'Your private sessions with tutors.'}
        actions={!isTutor && <Link to="/tutors"><Button>Book a tutor</Button></Link>}
      />
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1">
        {['upcoming', 'past'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cx('rounded-md px-4 py-1.5 text-sm font-medium capitalize', filter === f ? 'bg-surface shadow-sm' : 'text-slate-500')}>
            {f}
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="card divide-y divide-slate-100">
          {shown.map((b) => {
            const other = isTutor ? b.student : b.tutor;
            const busy = busyId === b._id;
            return (
              <div key={b._id} className="flex flex-wrap items-center gap-4 p-5">
                <Avatar user={other} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{b.subject} · {other.name}</p>
                  <p className="text-sm text-slate-500">{fmtDateTime(b.startsAt)} · {b.durationMinutes} min</p>
                  {b.note && <p className="mt-1 text-sm italic text-slate-600">“{b.note}”</p>}
                  {b.status === 'confirmed' && (
                    <p className={cx('mt-1 text-xs font-medium', b.meetUrl ? 'text-emerald-600' : 'text-amber-600')}>
                      {b.meetUrl ? 'Google Meet link ready' : isTutor ? 'Add a Google Meet link (Join → add link)' : 'Waiting for the tutor to add a Meet link'}
                    </p>
                  )}
                </div>
                <Badge color={STATUS_COLOR[b.status]}>{b.status}</Badge>
                <div className="flex gap-2">
                  {b.status === 'confirmed' && (
                    <Button size="sm" variant="success" icon={Video} onClick={() => navigate(`/meet/${b._id}`)}>Join</Button>
                  )}
                  {isTutor && b.status === 'pending' && (
                    <>
                      <Button size="sm" loading={busy} onClick={() => { setMeet({ meetUrl: '', autoMeet: false }); setAccepting(b); }}>Accept</Button>
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => update(b, 'declined')}>Decline</Button>
                    </>
                  )}
                  {isTutor && b.status === 'confirmed' && (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => update(b, 'completed')}>Mark done</Button>
                  )}
                  {!isTutor && upcoming(b) && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => window.confirm('Cancel this booking?') && update(b, 'cancelled')}>Cancel</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={CalendarCheck} title={`No ${filter} bookings`} text={isTutor ? 'Requests from students will appear here.' : 'Find a tutor and book your first session.'} />
      )}

      <Modal
        open={Boolean(accepting)}
        onClose={() => setAccepting(null)}
        title="Accept booking"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAccepting(null)}>Cancel</Button>
            <Button
              loading={busyId === accepting?._id}
              onClick={() => {
                if (meet.meetUrl && !MEET_URL_RE.test(meet.meetUrl.trim())) return toast.error('Please enter a valid Google Meet link');
                update(accepting, 'confirmed', meet);
              }}
            >
              Accept
            </Button>
          </>
        }
      >
        {accepting && (
          <p className="text-sm text-slate-600">
            {accepting.subject} with {accepting.student.name} · {fmtDateTime(accepting.startsAt)}
          </p>
        )}
        <MeetLinkFields value={meet} onChange={setMeet} />
      </Modal>
    </>
  );
}
