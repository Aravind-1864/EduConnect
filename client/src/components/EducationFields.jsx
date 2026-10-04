import { BookOpen, GraduationCap } from 'lucide-react';
import { cx } from './ui';

export const BRANCHES = [
  ['CSE', 'Computer Science & Engineering'],
  ['CSM', 'CSE (AI & Machine Learning)'],
  ['CS-DS', 'CSE (Data Science)'],
  ['CS-CS', 'CSE (Cyber Security)'],
  ['Civil', 'Civil Engineering'],
  ['Mech', 'Mechanical Engineering'],
  ['ECE', 'Electronics & Communication'],
  ['EEE', 'Electrical & Electronics'],
];

const ordinal = (n) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

export const educationLabel = (e) => (!e?.level ? '' : e.level === 'school' ? `Class ${e.grade}` : `BTech ${e.branch}`);
export const educationComplete = (e) => (e?.level === 'school' ? Boolean(e.grade) : e?.level === 'btech' ? Boolean(e.branch) : false);

/** value = { level: 'school'|'btech', grade?, branch? } */
export default function EducationFields({ value, onChange }) {
  const level = value?.level;
  return (
    <div className="space-y-3">
      <span className="label">What are you studying?</span>
      <div className="grid grid-cols-2 gap-3">
        {[
          ['school', 'School', BookOpen],
          ['btech', 'BTech', GraduationCap],
        ].map(([key, label, Icon]) => (
          <button
            type="button"
            key={key}
            onClick={() => onChange({ level: key })}
            className={cx(
              'flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition',
              level === key ? 'border-brand-600 bg-brand-50 text-brand-700 dark:text-brand-300' : 'border-slate-200 text-slate-600 hover:border-slate-300'
            )}
          >
            <Icon className="size-5" /> {label}
          </button>
        ))}
      </div>

      {level === 'school' && (
        <div>
          <span className="label">Your class</span>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => onChange({ level: 'school', grade: g })}
                className={cx(
                  'rounded-lg border py-2 text-sm font-semibold transition',
                  value.grade === g ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-700 hover:border-brand-300'
                )}
              >
                {ordinal(g)}
              </button>
            ))}
          </div>
        </div>
      )}

      {level === 'btech' && (
        <label className="block">
          <span className="label">Your branch</span>
          <select className="input" value={value.branch ?? ''} onChange={(e) => onChange({ level: 'btech', branch: e.target.value })}>
            <option value="" disabled>Choose your branch</option>
            {BRANCHES.map(([key, name]) => (
              <option key={key} value={key}>{key} – {name}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
