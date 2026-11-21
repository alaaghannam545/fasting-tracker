import type { DayType } from '../types.ts';
import { daysBetween, toDateKey } from './dates.ts';

const HOUR = 3_600_000;
/** Longest fast we accept from an edit — protects against typos like picking the wrong day. */
export const MAX_FAST_HOURS = 48;

/** Plan week (1-based) for a given date. Dates before the start count as week 1. */
export function planWeek(startDate: string, date: string): number {
  const d = daysBetween(startDate, date);
  return d < 0 ? 1 : Math.floor(d / 7) + 1;
}

/** Base plan: week 1 → 12:12, week 2 → 14:10, week 3 onwards → 16:8. Never longer in v1. */
export function planTargetHours(week: number): number {
  if (week <= 1) return 12;
  if (week === 2) return 14;
  return 16;
}

export function planLabel(week: number): string {
  const h = planTargetHours(week);
  return `${h}:${24 - h}`;
}

/** Today's target after applying the day type. */
export function targetHours(startDate: string, date: string, dayType: DayType): number {
  const base = planTargetHours(planWeek(startDate, date));
  if (dayType === 'longOps') return Math.min(base, 12);
  if (dayType === 'postCall') return 12;
  return base;
}

/** Hours between two instants, rounded to 0.1. Works across midnight and across days. */
export function fastHours(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.round((ms / HOUR) * 10) / 10;
}

export type FastValidation = { ok: true; hours: number } | { ok: false; reason: string };

export function validateFast(startIso: string, endIso: string): FastValidation {
  const s = new Date(startIso).getTime();
  const e = new Date(endIso).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return { ok: false, reason: 'الوقت مش مظبوط' };
  if (e <= s) return { ok: false, reason: 'وقت كسر الصيام لازم يكون بعد وقت البداية' };
  const hours = fastHours(startIso, endIso);
  if (hours > MAX_FAST_HOURS) return { ok: false, reason: `المدة أكتر من ${MAX_FAST_HOURS} ساعة — راجع التاريخ` };
  return { ok: true, hours };
}

/**
 * The user picks only a clock time ("HH:MM") for "بدأت الصيام".
 * Pick the most recent occurrence of that time that is not in the future:
 * at 01:30 choosing 21:00 means yesterday 21:00.
 */
export function resolveStartTime(hhmm: string, now: Date): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() > now.getTime()) d.setDate(d.getDate() - 1);
  return d;
}

/**
 * For "كسرت الصيام" given as a clock time: the first occurrence of that time after the start.
 * Start 21:00, end "13:00" → next day 13:00.
 */
export function resolveEndTime(hhmm: string, start: Date): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(start);
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= start.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

/** A finished fast is logged on the day it was broken. */
export function logDateForFast(endIso: string): string {
  return toDateKey(new Date(endIso));
}

export function elapsedHours(startIso: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(startIso).getTime()) / HOUR);
}

/** Protein range in g/day for a body weight (1.2–1.6 g/kg). */
export function proteinRange(weightKg: number): { min: number; max: number } {
  return { min: Math.round(weightKg * 1.2), max: Math.round(weightKg * 1.6) };
}

/** When today's eating window closes, given when the last fast ended and the target fast length. */
export function eatingWindowCloses(fastEndIso: string, target: number): Date {
  return new Date(new Date(fastEndIso).getTime() + (24 - target) * HOUR);
}
