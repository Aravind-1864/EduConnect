import { useEffect, useId, useState } from 'react';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { initials } from '../../utils/format';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

const VARIANTS = {
  primary: 'bg-brand-500 text-white shadow-[0_3px_0_var(--color-brand-700)] hover:bg-brand-600',
  secondary: 'bg-surface text-slate-900 border-2 border-slate-900 shadow-[0_3px_0_var(--color-slate-900)] hover:bg-slate-50 dark:border-slate-300 dark:shadow-[0_3px_0_#0a0f19]',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-600 text-white shadow-[0_3px_0_#991b1b] hover:bg-red-700',
  success: 'bg-emerald-600 text-white shadow-[0_3px_0_#065f46] hover:bg-emerald-700',
};
const SIZES = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-base' };

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, className, children, disabled, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition hover:-translate-y-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, errorId, children }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {error ? (
        <span id={errorId} role="alert" className="mt-1 block text-sm font-semibold text-red-600 dark:text-red-400">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      )}
    </label>
  );
}

export function Input({ label, hint, error, className, ...props }) {
  const errorId = useId();
  return (
    <Field label={label} hint={hint} error={error} errorId={errorId}>
      <input
        className={cx('input', error && '!border-red-500 focus:!ring-red-100', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
    </Field>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordInput({ label = 'Password', hint, error, className, ...props }) {
  const [visible, setVisible] = useState(false);
  const errorId = useId();
  return (
    <Field label={label} hint={hint} error={error} errorId={errorId}>
      <span className="relative block">
        <input
          type={visible ? 'text' : 'password'}
          className={cx('input pr-11', error && '!border-red-500 focus:!ring-red-100', className)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-900"
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </span>
    </Field>
  );
}

export const Textarea = ({ label, hint, className, ...props }) => (
  <Field label={label} hint={hint}>
    <textarea className={cx('input min-h-24 resize-y', className)} {...props} />
  </Field>
);

export const Select = ({ label, children, className, ...props }) => (
  <Field label={label}>
    <select className={cx('input', className)} {...props}>
      {children}
    </select>
  </Field>
);

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={cx('card max-h-[90vh] w-full overflow-y-auto', size === 'lg' ? 'max-w-2xl' : 'max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Avatar({ user, size = 'md' }) {
  const s = { sm: 'size-7 text-xs', md: 'size-9 text-sm', lg: 'size-14 text-lg', xl: 'size-20 text-2xl' }[size];
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', s)}
      style={{ background: user?.avatarColor ?? '#6366f1' }}
      title={user?.name}
    >
      {initials(user?.name)}
    </span>
  );
}

const BADGE = {
  gray: 'bg-slate-100 text-slate-600',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:text-amber-300',
  red: 'bg-red-50 text-red-700 ring-red-600/20 dark:text-red-300',
  blue: 'bg-brand-50 text-brand-700 ring-brand-600/20 dark:text-brand-300',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:text-purple-300',
};
export const Badge = ({ color = 'gray', children, className }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent', BADGE[color], className)}>
    {children}
  </span>
);

export const Spinner = ({ className }) => (
  <div className={cx('flex items-center justify-center py-16', className)}>
    <Loader2 className="size-8 animate-spin text-brand-500" />
  </div>
);

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
    {Icon && (
      <div className="mb-3 rounded-full bg-brand-50 p-3">
        <Icon className="size-6 text-brand-600" />
      </div>
    )}
    <p className="font-semibold text-slate-800">{title}</p>
    {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="card p-8 text-center">
    <p className="font-medium text-red-600">{message}</p>
    {onRetry && (
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export function StatCard({ label, value, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    pink: 'bg-pink-50 text-pink-600',
  };
  return (
    <div className="card card-hover flex items-center gap-4 p-5">
      <div className={cx('rounded-xl p-3', tones[tone])}>
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const SectionCard = ({ title, action, children, className }) => (
  <section className={cx('card p-5', className)}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </section>
);
