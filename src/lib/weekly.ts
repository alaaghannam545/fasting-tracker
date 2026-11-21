import type { DayLog, EmergencyEvent, WeeklyReview } from '../types.ts';
import { addDays, daysBetween, toDateKey } from './dates.ts';

/** 0-based week index for a date relative to the plan start. */
export function weekIndexFor(startDate: string, date: string): number {
  return Math.max(0, Math.floor(daysBetween(startDate, date) / 7));
}

export function weekDates(startDate: string, weekIndex: number): string[] {
  const first = addDays(startDate, weekIndex * 7);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/** Weeks that have started so far (always at least one). */
export function weeksSoFar(startDate: string, today: string): number[] {
  const n = weekIndexFor(startDate, today);
  return Array.from({ length: n + 1 }, (_, i) => i);
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : undefined);

export interface WeekStats {
  avgSleep?: number;
  avgFastHours?: number;
  adherence: { full: number; partial: number; flexible: number };
  daysLogged: number;
}

export function weekStats(logs: DayLog[]): WeekStats {
  const adherence = { full: 0, partial: 0, flexible: 0 };
  for (const l of logs) if (l.adherence) adherence[l.adherence]++;
  return {
    avgSleep: avg(logs.map((l) => l.sleepHours).filter((x): x is number => typeof x === 'number')),
    avgFastHours: avg(logs.map((l) => l.hours).filter((x): x is number => typeof x === 'number')),
    adherence,
    daysLogged: logs.length,
  };
}

/** Weekly weight points for the trend chart (end-of-week weight, else start-of-week weight). */
export function weightTrend(reviews: WeeklyReview[]): { week: number; weight: number }[] {
  return [...reviews]
    .sort((a, b) => a.weekIndex - b.weekIndex)
    .map((r) => ({ week: r.weekIndex + 1, weight: r.weightEnd ?? r.weightStart }))
    .filter((p): p is { week: number; weight: number } => typeof p.weight === 'number');
}

/** 3+ dizziness/headache events in the last 7 days → show the gentle suggestion card. */
export function needsGentleCard(events: EmergencyEvent[], now: Date): boolean {
  const since = now.getTime() - 7 * 86_400_000;
  return events.filter((e) => new Date(e.datetime).getTime() >= since).length >= 3;
}

export function todayKey(): string {
  return toDateKey(new Date());
}
