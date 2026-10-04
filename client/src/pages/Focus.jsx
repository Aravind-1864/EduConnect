import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Coffee, Flame, Pause, Play, Plus, RotateCcw, SkipForward, Target, Timer, Trash2, Trophy, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, PageHeader, SectionCard, StatCard, cx } from '../components/ui';
import { addMinutes, getStats, setGoal } from '../utils/studyStats';

const MODES = {
  focus: { label: 'Focus', minutes: 25, color: '#6366f1', icon: Target },
  short: { label: 'Short break', minutes: 5, color: '#10b981', icon: Coffee },
  long: { label: 'Long break', minutes: 15, color: '#0ea5e9', icon: Coffee },
};

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880, 990].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.25;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  } catch {
    /* audio not available */
  }
}

function useStats(userId) {
  const [stats, setStats] = useState(() => getStats(userId));
  useEffect(() => {
    const update = () => setStats(getStats(userId));
    window.addEventListener('study:updated', update);
    return () => window.removeEventListener('study:updated', update);
  }, [userId]);
  return stats;
}

function Ring({ progress, color, children }) {
  const r = 120;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto size-72">
      <svg viewBox="0 0 280 280" className="size-full -rotate-90">
        <circle cx="140" cy="140" r={r} fill="none" stroke="var(--color-slate-200)" strokeWidth="14" />
        <circle
          cx="140" cy="140" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - progress)} style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function WeekChart({ week, goal }) {
  const max = Math.max(goal, ...week.map((d) => d.minutes), 1);
  return (
    <div className="flex h-40 items-end gap-3">
      {week.map(({ date, minutes }) => {
        const isToday = date.toDateString() === new Date().toDateString();
        return (
          <div key={date.toISOString()} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{minutes ? Math.round(minutes) : ''}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className={cx('w-full rounded-t-lg transition-all', minutes >= goal ? 'bg-emerald-500' : isToday ? 'bg-brand-500' : 'bg-brand-300')}
                style={{ height: `${Math.max(4, (minutes / max) * 100)}%`, opacity: minutes ? 1 : 0.3 }}
                title={`${Math.round(minutes)} min`}
              />
            </div>
            <span className={cx('text-xs', isToday ? 'font-bold text-brand-600' : 'text-slate-500')}>
              {date.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const TASKS_KEY = 'educonnect.focus.tasks';
const loadTasks = () => {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY)) ?? [];
  } catch {
    return [];
  }
};

export default function Focus() {
  const { user } = useAuth();
  const stats = useStats(user._id);
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [sound, setSound] = useState(true);
  const [tasks, setTasks] = useState(loadTasks);
  const [newTask, setNewTask] = useState('');
  const pendingSeconds = useRef(0);

  const total = MODES[mode].minutes * 60;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  useEffect(() => {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch {
      /* ignore */
    }
  }, [tasks]);

  useEffect(() => {
    document.title = running ? `${mm}:${ss} · ${MODES[mode].label} - EduConnect` : 'EduConnect - Virtual Classroom';
  }, [mm, ss, running, mode]);
  useEffect(() => () => void (document.title = 'EduConnect - Virtual Classroom'), []);

  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setSecondsLeft(MODES[m].minutes * 60);
  };

  const flush = (completedSession = false) => {
    if (pendingSeconds.current > 0 || completedSession) {
      addMinutes(user._id, pendingSeconds.current / 60, { completedSession });
      pendingSeconds.current = 0;
    }
  };

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      if (mode === 'focus') {
        pendingSeconds.current += 1;
        if (pendingSeconds.current >= 60) flush();
      }
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (secondsLeft > 0) return;
    setRunning(false);
    if (sound) chime();
    if (mode === 'focus') {
      flush(true);
      toast.success('Focus session complete! Take a break 🎉');
      const next = round % 4 === 0 ? 'long' : 'short';
      setRound((r) => r + 1);
      switchMode(next);
    } else {
      toast('Break over - ready to focus?', { icon: '💪' });
      switchMode('focus');
    }
  }, [secondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save partial progress when leaving the page.
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    if (running && mode === 'focus') flush();
    setRunning((r) => !r);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks((t) => [...t, { id: crypto.randomUUID(), text: newTask.trim(), done: false }]);
    setNewTask('');
  };

  const color = MODES[mode].color;
  const goalPct = Math.min(100, Math.round((stats.today / stats.goal) * 100));

  return (
    <>
      <PageHeader title="Focus Timer" subtitle="Study in focused sprints with short breaks - the Pomodoro technique." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Studied today" value={`${Math.round(stats.today)} min`} icon={Timer} />
        <StatCard label="Current streak" value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`} icon={Flame} tone="amber" />
        <StatCard label="Sessions completed" value={stats.sessions} icon={Trophy} tone="green" />
        <StatCard label="Total focus time" value={`${(stats.total / 60).toFixed(1)} h`} icon={Target} tone="pink" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card relative overflow-hidden p-6 sm:p-8 lg:col-span-3">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-20 blur-3xl transition-colors" style={{ background: color }} />
          <div className="relative flex justify-center gap-2">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={cx('rounded-full px-4 py-1.5 text-sm font-medium transition', mode === key ? 'text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                style={mode === key ? { background: m.color } : undefined}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="relative mt-8">
            <Ring progress={1 - secondsLeft / total} color={color}>
              <p className="font-mono text-6xl font-bold tabular-nums text-slate-900">{mm}:{ss}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {mode === 'focus' ? `Round ${round} · stay focused` : 'Relax, stretch, hydrate'}
              </p>
            </Ring>
          </div>

          <div className="relative mt-8 flex items-center justify-center gap-3">
            <button onClick={() => switchMode(mode)} className="rounded-full p-3 text-slate-500 hover:bg-slate-100" aria-label="Reset" title="Reset">
              <RotateCcw className="size-5" />
            </button>
            <button
              onClick={toggle}
              className="flex size-16 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105 active:scale-95"
              style={{ background: color, boxShadow: `0 12px 30px -8px ${color}` }}
              aria-label={running ? 'Pause' : 'Start'}
            >
              {running ? <Pause className="size-7" /> : <Play className="ml-1 size-7" />}
            </button>
            <button onClick={() => setSecondsLeft(0)} className="rounded-full p-3 text-slate-500 hover:bg-slate-100" aria-label="Skip" title="Skip to next">
              <SkipForward className="size-5" />
            </button>
          </div>
          <div className="relative mt-4 flex justify-center">
            <button onClick={() => setSound((s) => !s)} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />} Sound {sound ? 'on' : 'off'}
            </button>
          </div>
        </section>

        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Today's goal">
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(stats.today)}
                <span className="text-base font-normal text-slate-500"> / {stats.goal} min</span>
              </p>
              <select className="input w-auto" value={stats.goal} onChange={(e) => setGoal(user._id, Number(e.target.value))} aria-label="Daily goal">
                {[30, 60, 90, 120, 180, 240].map((g) => <option key={g} value={g}>{g} min goal</option>)}
              </select>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-500">{goalPct >= 100 ? 'Goal smashed! 🎉 Keep the streak alive tomorrow.' : `${goalPct}% done - you've got this!`}</p>
          </SectionCard>

          <SectionCard title="Session tasks">
            <form onSubmit={addTask} className="flex gap-2">
              <input className="input" placeholder="What will you work on?" value={newTask} onChange={(e) => setNewTask(e.target.value)} maxLength={120} />
              <Button type="submit" aria-label="Add task"><Plus className="size-4" /></Button>
            </form>
            <ul className="mt-4 space-y-1">
              {tasks.map((t) => (
                <li key={t.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <button onClick={() => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} aria-label="Toggle task">
                    {t.done ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Circle className="size-5 text-slate-300" />}
                  </button>
                  <span className={cx('flex-1 text-sm', t.done ? 'text-slate-400 line-through' : 'text-slate-700')}>{t.text}</span>
                  <button onClick={() => setTasks((all) => all.filter((x) => x.id !== t.id))} className="opacity-0 transition group-hover:opacity-100" aria-label="Delete task">
                    <Trash2 className="size-4 text-slate-400 hover:text-red-500" />
                  </button>
                </li>
              ))}
              {!tasks.length && <p className="py-4 text-center text-sm text-slate-400">Add a task to stay on track.</p>}
            </ul>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="This week" className="mt-6" action={<span className="text-xs text-slate-500">minutes per day · green = goal met</span>}>
        <WeekChart week={stats.week} goal={stats.goal} />
      </SectionCard>
    </>
  );
}
