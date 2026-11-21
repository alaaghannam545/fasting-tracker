import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  eatingWindowCloses,
  fastHours,
  logDateForFast,
  planLabel,
  planTargetHours,
  planWeek,
  proteinRange,
  resolveEndTime,
  resolveStartTime,
  targetHours,
  validateFast,
} from '../src/lib/fasting.ts';
import { addDays, daysBetween, toDateKey } from '../src/lib/dates.ts';

const START = '2026-11-01';

test('plan week counts from the start date', () => {
  assert.equal(planWeek(START, '2026-10-30'), 1); // before start
  assert.equal(planWeek(START, START), 1);
  assert.equal(planWeek(START, '2026-11-07'), 1);
  assert.equal(planWeek(START, '2026-11-08'), 2);
  assert.equal(planWeek(START, '2026-11-15'), 3);
  assert.equal(planWeek(START, '2027-01-01'), 9);
});

test('progressive plan 12 → 14 → 16 and never longer', () => {
  assert.equal(planTargetHours(1), 12);
  assert.equal(planTargetHours(2), 14);
  assert.equal(planTargetHours(3), 16);
  assert.equal(planTargetHours(4), 16);
  for (let w = 1; w < 60; w++) assert.ok(planTargetHours(w) <= 16);
  assert.equal(planLabel(1), '12:12');
  assert.equal(planLabel(2), '14:10');
  assert.equal(planLabel(3), '16:8');
});

test('day type targets', () => {
  // normal follows the plan
  assert.equal(targetHours(START, '2026-11-02', 'normal'), 12);
  assert.equal(targetHours(START, '2026-11-09', 'normal'), 14);
  assert.equal(targetHours(START, '2026-11-20', 'normal'), 16);
  // long operating days are capped at 12h
  assert.equal(targetHours(START, '2026-11-20', 'longOps'), 12);
  assert.equal(targetHours(START, '2026-11-02', 'longOps'), 12);
  // post on-call: flexible 12h
  assert.equal(targetHours(START, '2026-11-20', 'postCall'), 12);
  assert.equal(targetHours(START, '2026-11-09', 'postCall'), 12);
});

test('fast hours across midnight', () => {
  const s = new Date(2026, 10, 20, 21, 0).toISOString();
  const e = new Date(2026, 10, 21, 13, 0).toISOString();
  assert.equal(fastHours(s, e), 16);
  assert.equal(logDateForFast(e), '2026-11-21');
});

test('fast hours over multiple days and partial hours', () => {
  const s = new Date(2026, 10, 20, 22, 15).toISOString();
  const e = new Date(2026, 10, 22, 8, 45).toISOString();
  assert.equal(fastHours(s, e), 34.5);
});

test('validation rejects end before start and absurd lengths', () => {
  const s = new Date(2026, 10, 20, 21, 0).toISOString();
  assert.equal(validateFast(s, s).ok, false);
  assert.equal(validateFast(s, new Date(2026, 10, 20, 20, 0).toISOString()).ok, false);
  assert.equal(validateFast(s, new Date(2026, 10, 23, 21, 0).toISOString()).ok, false);
  const ok = validateFast(s, new Date(2026, 10, 21, 11, 0).toISOString());
  assert.deepEqual(ok, { ok: true, hours: 14 });
});

test('start time picked after midnight resolves to yesterday', () => {
  const now = new Date(2026, 10, 21, 1, 30);
  const r = resolveStartTime('21:00', now);
  assert.equal(toDateKey(r), '2026-11-20');
  assert.equal(r.getHours(), 21);
  // a time earlier today stays today
  const r2 = resolveStartTime('00:45', now);
  assert.equal(toDateKey(r2), '2026-11-21');
});

test('end time resolves to first occurrence after start', () => {
  const start = new Date(2026, 10, 20, 21, 0);
  const e = resolveEndTime('13:00', start);
  assert.equal(toDateKey(e), '2026-11-21');
  assert.equal(fastHours(start.toISOString(), e.toISOString()), 16);
  const same = resolveEndTime('23:30', start);
  assert.equal(toDateKey(same), '2026-11-20');
});

test('protein range 1.2–1.6 g/kg', () => {
  assert.deepEqual(proteinRange(90), { min: 108, max: 144 });
  assert.deepEqual(proteinRange(82.5), { min: 99, max: 132 });
});

test('eating window closes after 24 - target hours', () => {
  const end = new Date(2026, 10, 21, 13, 0);
  assert.equal(eatingWindowCloses(end.toISOString(), 16).getHours(), 21);
});

test('date helpers', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(daysBetween('2026-11-01', '2026-11-08'), 7);
});
