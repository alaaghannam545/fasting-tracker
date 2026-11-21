import Dexie, { liveQuery, type EntityTable } from 'dexie';
import { useEffect, useState } from 'react';
import type { DayLog, EmergencyEvent, Meal, Settings, ShoppingItem, WeeklyReview } from '../types.ts';
import { SEED_MEALS, SEED_SHOPPING } from '../data/seed.ts';
import type { BackupData } from '../lib/backup.ts';

export class AppDB extends Dexie {
  settings!: EntityTable<Settings, 'id'>;
  dayLogs!: EntityTable<DayLog, 'date'>;
  emergencies!: EntityTable<EmergencyEvent, 'id'>;
  meals!: EntityTable<Meal, 'id'>;
  shopping!: EntityTable<ShoppingItem, 'id'>;
  reviews!: EntityTable<WeeklyReview, 'weekIndex'>;

  constructor() {
    super('fasting-tracker');
    this.version(1).stores({
      settings: 'id',
      dayLogs: 'date',
      emergencies: '++id, datetime',
      meals: 'id, *tags',
      shopping: 'id, category',
      reviews: 'weekIndex',
    });
    this.on('populate', (tx) => {
      tx.table('meals').bulkAdd(SEED_MEALS);
      tx.table('shopping').bulkAdd(SEED_SHOPPING);
    });
  }
}

export const db = new AppDB();

/** Minimal replacement for dexie-react-hooks' useLiveQuery (no extra dependency). */
export function useLive<T>(query: () => Promise<T> | T, deps: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    setValue(undefined); // don't show the previous query's result after deps change
    const sub = liveQuery(query).subscribe({ next: setValue, error: (e) => console.error(e) });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}

export function emptyDayLog(date: string): DayLog {
  return { date, dayType: 'normal', water: 0, mealIds: [], mealsFree: [], notes: '' };
}

export async function getDayLog(date: string): Promise<DayLog> {
  return (await db.dayLogs.get(date)) ?? emptyDayLog(date);
}

export async function patchDayLog(date: string, patch: Partial<DayLog>): Promise<void> {
  const cur = await getDayLog(date);
  await db.dayLogs.put({ ...cur, ...patch, date });
}

export async function exportAll(): Promise<BackupData> {
  const [settings, dayLogs, emergencies, meals, shopping, reviews] = await Promise.all([
    db.settings.toArray(),
    db.dayLogs.toArray(),
    db.emergencies.toArray(),
    db.meals.toArray(),
    db.shopping.toArray(),
    db.reviews.toArray(),
  ]);
  return { settings, dayLogs, emergencies, meals, shopping, reviews };
}

/** Replaces everything on the device with the backup contents. */
export async function importAll(data: BackupData): Promise<void> {
  await db.transaction('rw', [db.settings, db.dayLogs, db.emergencies, db.meals, db.shopping, db.reviews], async () => {
    await Promise.all([
      db.settings.clear(),
      db.dayLogs.clear(),
      db.emergencies.clear(),
      db.meals.clear(),
      db.shopping.clear(),
      db.reviews.clear(),
    ]);
    await db.settings.bulkPut(data.settings);
    await db.dayLogs.bulkPut(data.dayLogs);
    await db.emergencies.bulkPut(data.emergencies);
    await db.meals.bulkPut(data.meals);
    await db.shopping.bulkPut(data.shopping);
    await db.reviews.bulkPut(data.reviews);
  });
}
