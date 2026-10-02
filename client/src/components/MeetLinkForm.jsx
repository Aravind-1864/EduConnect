import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Sparkles, Video } from 'lucide-react';
import { api } from '../api/client';
import { Button } from './ui';

export const MEET_URL_RE = /^(https:\/\/)?meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/i;

/** Cached Google connection status: { configured, connected, email }. */
let cached = null;
export function useGoogleStatus() {
  const [status, setStatus] = useState(cached);
  useEffect(() => {
    if (cached) return;
    api
      .get('/google/status')
      .then(({ data }) => {
        cached = data;
        setStatus(data);
      })
      .catch(() => setStatus({ configured: false, connected: false }));
  }, []);
  return status;
}
export const resetGoogleStatus = () => {
  cached = null;
};

/**
 * Controlled field for a session/booking's Google Meet link.
 * value = { meetUrl, autoMeet }. Tutors with Google connected can let EduConnect create the link.
 */
export default function MeetLinkFields({ value, onChange, optional = true, hint }) {
  const google = useGoogleStatus();
  const canAuto = google?.configured && google?.connected;
  const invalid = value.meetUrl && !MEET_URL_RE.test(value.meetUrl.trim());

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <Video className="size-5 text-emerald-600" />
        <p className="text-sm font-semibold text-slate-800">Google Meet link {optional && <span className="font-normal text-slate-500">(you can add it later)</span>}</p>
      </div>
      {hint && <p className="-mt-1 text-xs text-slate-500">{hint}</p>}

      {canAuto && (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-surface p-3 ring-1 ring-slate-200">
          <input type="checkbox" className="mt-0.5 size-4 accent-brand-600" checked={value.autoMeet} onChange={(e) => onChange({ meetUrl: '', autoMeet: e.target.checked })} />
          <span className="text-sm text-slate-700">
            <span className="flex items-center gap-1 font-medium"><Sparkles className="size-4 text-brand-600" /> Create the Meet link automatically</span>
            <span className="text-xs text-slate-500">Using your Google account {google.email}</span>
          </span>
        </label>
      )}

      {!value.autoMeet && (
        <>
          <input
            className="input"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={value.meetUrl}
            onChange={(e) => onChange({ meetUrl: e.target.value, autoMeet: false })}
          />
          {invalid && <p className="text-xs text-red-600">That doesn't look like a Google Meet link (meet.google.com/xxx-xxxx-xxx).</p>}
          <p className="text-xs text-slate-500">
            <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
              Create a new meeting <ExternalLink className="size-3" />
            </a>{' '}
            in Google Meet, copy its link and paste it here.
            {google?.configured && !google?.connected && (
              <>
                {' '}Or <Link to="/profile" className="font-medium text-brand-600 hover:underline">connect Google</Link> to create links automatically.
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}

/** Small inline form to save a link on an existing session/booking. */
export function AddMeetLink({ onSave, saving }) {
  const [value, setValue] = useState({ meetUrl: '', autoMeet: false });
  const ready = value.autoMeet || MEET_URL_RE.test(value.meetUrl.trim());
  return (
    <div className="space-y-3">
      <MeetLinkFields value={value} onChange={setValue} optional={false} />
      <Button className="w-full" disabled={!ready} loading={saving} onClick={() => onSave(value)}>
        Save meeting link
      </Button>
    </div>
  );
}
