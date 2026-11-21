import { useEffect, type ReactNode } from 'react';

export function Card({
  title,
  children,
  tone = 'plain',
  className = '',
  action,
}: {
  title?: ReactNode;
  children: ReactNode;
  tone?: 'plain' | 'teal' | 'amber';
  className?: string;
  action?: ReactNode;
}) {
  const toneCls =
    tone === 'teal' ? 'bg-teal-50 border-teal-100' : tone === 'amber' ? 'bg-amber-50 border-amber-100' : 'bg-white border-line';
  return (
    <section className={`rounded-2xl border p-4 ${toneCls} ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'warn';

export function Btn({
  children,
  onClick,
  variant = 'secondary',
  className = '',
  disabled,
  type = 'button',
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-teal text-white active:bg-teal-dark',
    secondary: 'bg-white text-teal border border-teal active:bg-teal-50',
    ghost: 'text-teal active:bg-teal-50',
    warn: 'bg-amber text-white active:opacity-90',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`min-h-11 rounded-xl px-4 py-2 font-medium transition disabled:opacity-40 ${v[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T | undefined;
  options: { value: T; label: ReactNode; sub?: ReactNode }[];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`min-h-11 flex-1 rounded-xl border px-2 py-2 text-sm font-medium transition ${
              on ? 'border-teal bg-teal text-white' : 'border-line bg-white text-ink active:bg-teal-50'
            }`}
          >
            <div>{o.label}</div>
            {o.sub && <div className={`text-xs font-normal ${on ? 'text-white/90' : 'text-muted'}`}>{o.sub}</div>}
          </button>
        );
      })}
    </div>
  );
}

/** 1–5 scale. Discrete buttons so it's easy to tap and can stay "not logged yet". */
export function Scale({
  value,
  onChange,
  low,
  high,
  label,
}: {
  value?: number;
  onChange: (v: number) => void;
  low: string;
  high: string;
  label: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-muted">{value ? `${value} من 5` : 'لسه ماسجلتش'}</span>
      </div>
      <Segmented value={value} onChange={onChange} label={label} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: n }))} />
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>1 {low}</span>
        <span>5 {high}</span>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="safe-bottom max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="قفل" className="min-h-11 min-w-11 rounded-full text-2xl text-muted active:bg-teal-50">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'min-h-11 w-full rounded-xl border border-line bg-white px-3 py-2 text-base outline-none focus:border-teal focus:ring-2 focus:ring-teal-100';
