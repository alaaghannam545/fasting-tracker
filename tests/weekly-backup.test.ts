import { test } from 'node:test';
import assert from 'node:assert/strict';
import { needsGentleCard, weekDates, weekIndexFor, weekStats, weeksSoFar, weightTrend } from '../src/lib/weekly.ts';
import { dayLogsToCsv, makeBackup, parseBackup, type BackupData } from '../src/lib/backup.ts';
import type { DayLog } from '../src/types.ts';

const log = (date: string, extra: Partial<DayLog> = {}): DayLog => ({
  date,
  dayType: 'normal',
  water: 0,
  mealIds: [],
  mealsFree: [],
  notes: '',
  ...extra,
});

test('week indexing', () => {
  assert.equal(weekIndexFor('2026-11-01', '2026-11-07'), 0);
  assert.equal(weekIndexFor('2026-11-01', '2026-11-08'), 1);
  assert.deepEqual(weekDates('2026-11-01', 1)[0], '2026-11-08');
  assert.equal(weekDates('2026-11-01', 1).length, 7);
  assert.deepEqual(weeksSoFar('2026-11-01', '2026-11-15'), [0, 1, 2]);
});

test('week stats averages only logged values', () => {
  const s = weekStats([
    log('2026-11-01', { sleepHours: 6, hours: 12, adherence: 'full' }),
    log('2026-11-02', { sleepHours: 7, hours: 13, adherence: 'partial' }),
    log('2026-11-03', { adherence: 'flexible' }),
  ]);
  assert.equal(s.avgSleep, 6.5);
  assert.equal(s.avgFastHours, 12.5);
  assert.deepEqual(s.adherence, { full: 1, partial: 1, flexible: 1 });
});

test('weight trend uses end weight, falls back to start', () => {
  const t = weightTrend([
    { weekIndex: 1, weightStart: 94, answers: ['', '', ''] },
    { weekIndex: 0, weightStart: 95, weightEnd: 94.2, answers: ['', '', ''] },
    { weekIndex: 2, answers: ['', '', ''] },
  ]);
  assert.deepEqual(t, [
    { week: 1, weight: 94.2 },
    { week: 2, weight: 94 },
  ]);
});

test('gentle card after 3 events in 7 days', () => {
  const now = new Date(2026, 10, 21, 12);
  const ev = (daysAgo: number) => ({ datetime: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(), resolvedBy: 'waterSalt' as const });
  assert.equal(needsGentleCard([ev(1), ev(2)], now), false);
  assert.equal(needsGentleCard([ev(1), ev(2), ev(8)], now), false);
  assert.equal(needsGentleCard([ev(1), ev(2), ev(6.5)], now), true);
});

test('backup round trip keeps everything', () => {
  const data: BackupData = {
    settings: [{ id: 'me', startDate: '2026-11-01', currentWeight: 95, targetWeight: 85, notifications: false }],
    dayLogs: [log('2026-11-02', { notes: 'ملاحظة, فيها "علامات"', mealIds: ['m1'], mealsFree: ['شوربة'] })],
    emergencies: [{ id: 1, datetime: '2026-11-02T10:00:00.000Z', resolvedBy: 'brokeFast' }],
    meals: [{ id: 'm1', name: 'بيض وفول', description: '', tags: ['breakFast'], isSeed: true }],
    shopping: [{ id: 's1', category: 'protein', name: 'بيض', checked: true }],
    reviews: [{ weekIndex: 0, weightStart: 95, answers: ['أ', 'ب', 'ج'] }],
  };
  const text = JSON.stringify(makeBackup(data));
  const parsed = parseBackup(text);
  assert.ok(parsed.ok);
  if (parsed.ok) assert.deepEqual(parsed.data, data);
});

test('backup rejects foreign files', () => {
  assert.equal(parseBackup('not json').ok, false);
  assert.equal(parseBackup('{"app":"other"}').ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: 'fasting-tracker', version: 1 })).ok, false);
});

test('csv escapes commas and quotes and has BOM', () => {
  const csv = dayLogsToCsv([log('2026-11-02', { notes: 'a, "b"', mealIds: ['m1'], adherence: 'flexible' })], () => 'بيض وفول');
  assert.ok(csv.startsWith('﻿'));
  assert.ok(csv.includes('"a, ""b"""'));
  assert.ok(csv.includes('يوم مرن'));
  assert.ok(csv.includes('بيض وفول'));
});
