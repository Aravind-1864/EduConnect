import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Users } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { Avatar, Badge, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';

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

export default function Tutors() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: tutors, loading, error, reload } = useFetch(`/tutors${debounced ? `?q=${encodeURIComponent(debounced)}` : ''}`);

  return (
    <>
      <PageHeader title="Find a tutor" subtitle="Book a private 1-on-1 session with an expert." />
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search by name or subject..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading && !tutors ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : tutors.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((t) => (
            <Link key={t._id} to={`/tutors/${t._id}`} className="card flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-4">
                <Avatar user={t} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.name}</p>
                  <Rating rating={t.rating} count={t.reviewCount} />
                </div>
              </div>
              <p className="mt-4 line-clamp-3 flex-1 text-sm text-slate-600">{t.bio || 'No bio yet.'}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {t.subjects.map((s) => <Badge key={s} color="blue">{s}</Badge>)}
              </div>
              {t.hourlyRate > 0 && <p className="mt-4 text-sm font-semibold text-slate-900">₹{t.hourlyRate}<span className="font-normal text-slate-500"> / hour</span></p>}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="No tutors found" text="Try a different subject or name." />
      )}
    </>
  );
}
