// Local-date helpers. Date keys use the device's local calendar (KSA or Egypt — whatever the phone is set to).

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse "YYYY-MM-DD" as local midnight. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

/** Whole calendar days from a to b (b - a). DST-safe because it rounds. */
export function daysBetween(a: string, b: string): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / 86_400_000);
}

export function formatTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${toDateKey(d)}T${formatTime(d)}`;
}

export function fromLocalInput(v: string): string {
  // "YYYY-MM-DDTHH:MM" is interpreted as local time by the Date constructor.
  return new Date(v).toISOString();
}

const DAY_NAMES = ['الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];

export function dayName(key: string): string {
  return DAY_NAMES[fromDateKey(key).getDay()];
}

/** "21/11" style short date with Western digits. */
export function shortDate(key: string): string {
  const d = fromDateKey(key);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  return `${Math.floor(totalMin / 60)}:${pad(totalMin % 60)}`;
}
