import type { DayLog, EmergencyEvent, Meal, Settings, ShoppingItem, WeeklyReview } from '../types.ts';

export const BACKUP_VERSION = 1;

export interface BackupData {
  settings: Settings[];
  dayLogs: DayLog[];
  emergencies: EmergencyEvent[];
  meals: Meal[];
  shopping: ShoppingItem[];
  reviews: WeeklyReview[];
}

export interface Backup extends BackupData {
  app: 'fasting-tracker';
  version: number;
  exportedAt: string;
}

export function makeBackup(data: BackupData, now = new Date()): Backup {
  return { app: 'fasting-tracker', version: BACKUP_VERSION, exportedAt: now.toISOString(), ...data };
}

const TABLES: (keyof BackupData)[] = ['settings', 'dayLogs', 'emergencies', 'meals', 'shopping', 'reviews'];

export function parseBackup(text: string): { ok: true; data: BackupData } | { ok: false; reason: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'الملف مش JSON صالح' };
  }
  const obj = raw as Partial<Backup>;
  if (!obj || obj.app !== 'fasting-tracker') return { ok: false, reason: 'الملف ده مش نسخة احتياطية من التطبيق' };
  if (typeof obj.version !== 'number' || obj.version > BACKUP_VERSION)
    return { ok: false, reason: 'نسخة الملف أحدث من التطبيق' };
  for (const t of TABLES) if (!Array.isArray(obj[t])) return { ok: false, reason: `جزء ناقص في الملف: ${t}` };
  const data = Object.fromEntries(TABLES.map((t) => [t, obj[t]])) as unknown as BackupData;
  return { ok: true, data };
}

const DAY_TYPE_AR = { normal: 'ع', longOps: 'ط', postCall: 'ن' } as const;
const ACTIVITY_AR = { walk: 'مشي', resistance: 'تمرين مقاومة', rest: 'راحة' } as const;
const ADHERENCE_AR = { full: 'كامل', partial: 'جزئي', flexible: 'يوم مرن' } as const;

function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Daily logs as CSV. Starts with a BOM so Excel shows Arabic correctly. */
export function dayLogsToCsv(logs: DayLog[], mealName: (id: string) => string | undefined): string {
  const header = ['التاريخ', 'نوع اليوم', 'بداية الصيام', 'كسر الصيام', 'ساعات', 'مية', 'جوع', 'طاقة', 'نوم', 'نشاط', 'الالتزام', 'الوجبات', 'ملاحظات'];
  const rows = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => [
      l.date,
      DAY_TYPE_AR[l.dayType],
      l.fastStart ?? '',
      l.fastEnd ?? '',
      l.hours ?? '',
      l.water,
      l.hunger ?? '',
      l.energy ?? '',
      l.sleepHours ?? '',
      l.activity ? ACTIVITY_AR[l.activity] : '',
      l.adherence ? ADHERENCE_AR[l.adherence] : '',
      [...l.mealIds.map((id) => mealName(id) ?? ''), ...l.mealsFree].filter(Boolean).join(' + '),
      l.notes,
    ]);
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}
