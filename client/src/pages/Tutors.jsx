import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Search, Star, Users } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Avatar, Badge, Button, EmptyState, ErrorState, PageHeader, SectionCard, Spinner, cx } from '../components/ui';
import EducationFields, { educationComplete } from '../components/EducationFields';

export function Rating({ rating, count }) {
  if (!rating) return <span className="text-xs text-slate-400">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="size-4 fill-amber-400 text-amber-400" />
      <span className="font-semibold">{rating}</span>
      <span className="text-slate-400">({count})</span>
    </span>
  );
}

export const DemoBadge = () => (
  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-600/20 dark:text-amber-300" title="A sample tutor profile to try booking">
    Demo tutor
  </span>
);

function TutorCard({ t }) {
  return (
    <Link to={`/tutors/${t._id}`} className="card flex flex-col p-6">
      <div className="flex items-center gap-4">
        <Avatar user={t} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{t.name}</p>
          {t.isDemo ? <DemoBadge /> : <Rating rating={t.rating} count={t.reviewCount} />}
        </div>
      </div>
      <p className="mt-4 line-clamp-3 flex-1 text-sm text-slate-600">{t.bio || 'No bio yet.'}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {t.subjects.map((s) => <Badge key={s} color="blue">{s}</Badge>)}
      </div>
      {t.hourlyRate > 0 && <p className="mt-4 text-sm font-semibold text-slate-900">₹{t.hourlyRate}<span className="font-normal text-slate-500"> / hour</span></p>}
    </Link>
  );
}

/** Asks a student (who signed up before this existed) for their class or branch. */
function AskEducation({ onSaved }) {
  const { setUser } = useAuth();
  const [education, setEducation] = useState({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch('/auth/me', { education });
      setUser(data.user);
      toast.success('Saved! Here are tutors for you');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard className="mb-6 max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-xl bg-brand-50 p-3 text-brand-600"><GraduationCap className="size-6" /></span>
        <div>
          <h2 className="font-semibold">Tell us your class to see the right tutors</h2>
          <p className="text-sm text-slate-500">You can change this anytime in your Profile.</p>
        </div>
      </div>
      <EducationFields value={education} onChange={setEducation} />
      <Button className="mt-4" disabled={!educationComplete(education)} loading={busy} onClick={save}>Show my tutors</Button>
    </SectionCard>
  );
}

function SuggestedTutors() {
  const { data, loading, error, reload } = useFetch('/tutors/for-me');
  const [subject, setSubject] = useState('');

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (data.needsEducation) return <AskEducation onSaved={reload} />;

  const shown = subject ? data.tutors.filter((t) => t.subjects.some((s) => s.toLowerCase() === subject.toLowerCase())) : data.tutors;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold">Tutors for {data.label}</h2>
        <Link to="/profile" className="text-sm text-brand-600 hover:underline">Change class</Link>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {['', ...data.subjects].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setSubject(s)}
            className={cx(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
              subject === s ? 'bg-brand-600 text-white' : 'bg-surface text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'
            )}
          >
            {s || 'All subjects'}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shown.map((t) => <TutorCard key={t._id} t={t} />)}</div>
      ) : (
        <EmptyState icon={Users} title="No tutors for this subject yet" text="Try another subject or search above." />
      )}
    </>
  );
}

function SearchResults({ query }) {
  const { data: tutors, loading, error, reload } = useFetch(`/tutors${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  if (loading && !tutors) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return tutors.length ? (
    <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{tutors.map((t) => <TutorCard key={t._id} t={t} />)}</div>
  ) : (
    <EmptyState icon={Users} title="No tutors found" text="Try a different subject or name." />
  );
}

export default function Tutors() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const suggest = user.role === 'student' && !debounced;

  return (
    <>
      <PageHeader title="Find a tutor" subtitle="Book a private 1-on-1 session with an expert." />
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search any tutor by name or subject..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {suggest ? <SuggestedTutors key={user.education?.grade ?? user.education?.branch ?? 'none'} /> : <SearchResults query={debounced} />}
    </>
  );
}
