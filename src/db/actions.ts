import { db, patchDayLog } from './db.ts';
import { logDateForFast, validateFast } from '../lib/fasting.ts';
import type { ResolvedBy } from '../types.ts';

export async function startFast(startIso: string) {
  await db.settings.update('me', { activeFastStart: startIso });
}

/** Ends the running fast and stores it on the day it was broken. Returns an error message or null. */
export async function breakFast(endIso: string): Promise<string | null> {
  const s = await db.settings.get('me');
  if (!s?.activeFastStart) return 'مفيش صيام شغال';
  if (new Date(endIso).getTime() > Date.now() + 60_000) return 'الوقت ده لسه ماجاش';
  const v = validateFast(s.activeFastStart, endIso);
  if (!v.ok) return v.reason;
  await db.transaction('rw', db.settings, db.dayLogs, async () => {
    await patchDayLog(logDateForFast(endIso), { fastStart: s.activeFastStart, fastEnd: endIso, hours: v.hours });
    await db.settings.update('me', { activeFastStart: undefined });
  });
  return null;
}

/** Edit a day's fast after the fact. The fast stays on the day you're editing. */
export async function setDayFast(date: string, startIso: string, endIso: string): Promise<string | null> {
  const v = validateFast(startIso, endIso);
  if (!v.ok) return v.reason;
  await patchDayLog(date, { fastStart: startIso, fastEnd: endIso, hours: v.hours });
  return null;
}

export async function clearDayFast(date: string) {
  await patchDayLog(date, { fastStart: undefined, fastEnd: undefined, hours: undefined });
}

export async function logEmergency(resolvedBy: ResolvedBy) {
  await db.emergencies.add({ datetime: new Date().toISOString(), resolvedBy });
}
