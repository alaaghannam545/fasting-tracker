import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Settings, WeeklyReview } from '../types.ts';
import { db, useLive } from '../db/db.ts';
import { weekDates, weekIndexFor, weekStats, weeksSoFar, weightTrend, todayKey } from '../lib/weekly.ts';
import { dayName, shortDate } from '../lib/dates.ts';
import { Btn, Card, Field, inputCls } from '../components/ui.tsx';
import { DAY_TYPES } from './Today.tsx';

const TEAL = '#0F6B63';
const MUTED = '#55615F';
const LINE = '#DFE5E4';
const TEAL_50 = '#E8F3F2';
const PROMPTS = ['أكتر حاجة نجحت معايا', 'أصعب وقت حسيت فيه بالجوع وليه', 'هعدّل إيه الأسبوع الجاي'];
const ADH_LABEL = { full: 'كامل', partial: 'جزئي', flexible: 'مرن' } as const;

export function Weekly({ settings }: { settings: Settings }) {
  const today = todayKey();
  const weeks = weeksSoFar(settings.startDate, today);
  const [wk, setWk] = useState(weekIndexFor(settings.startDate, today));
  const dates = weekDates(settings.startDate, wk);
  const logs = useLive(() => db.dayLogs.where('date').between(dates[0], dates[6], true, true).toArray(), [wk]) ?? [];
  const review = useLive(async () => (await db.reviews.get(wk)) ?? null, [wk]);
  const reviews = useLive(() => db.reviews.toArray(), []) ?? [];
  const stats = weekStats(logs);
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const perDay = dates.map((d) => ({
    name: dayName(d),
    hours: byDate.get(d)?.hours ?? 0,
    water: byDate.get(d)?.water ?? 0,
  }));
  const trend = weightTrend(reviews);

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2">
          {weeks.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWk(w)}
              className={`min-h-11 rounded-full border px-4 text-sm ${w === wk ? 'border-teal bg-teal text-white' : 'border-line'}`}
            >
              الأسبوع {w + 1}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted">
        من <span className="ltr">{shortDate(dates[0])}</span> لـ <span className="ltr">{shortDate(dates[6])}</span>
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="متوسط ساعات الصيام" value={stats.avgFastHours} unit="ساعة" />
        <Stat label="متوسط النوم" value={stats.avgSleep} unit="ساعة" />
      </div>
      <Card title="الالتزام">
        <div className="grid grid-cols-3 gap-2 text-center">
          {(['full', 'partial', 'flexible'] as const).map((k) => (
            <div key={k} className="rounded-xl bg-teal-50 p-2">
              <div className="text-2xl font-bold text-teal">{stats.adherence[k]}</div>
              <div className="text-sm">{ADH_LABEL[k]}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="الأيام">
        <ul className="divide-y divide-line text-sm">
          {dates.map((d) => {
            const l = byDate.get(d);
            return (
              <li key={d} className="flex items-center justify-between py-2">
                <span>
                  {dayName(d)} <span className="ltr text-muted">{shortDate(d)}</span>
                </span>
                <span className="text-muted">
                  {l ? (
                    <>
                      {DAY_TYPES.find((t) => t.value === l.dayType)?.letter} · {l.hours ?? '—'} س · 💧{l.water}
                      {l.adherence && ` · ${ADH_LABEL[l.adherence]}`}
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {review !== undefined && <ReviewForm key={wk} wk={wk} review={review} settings={settings} isLatest={wk === weeks[weeks.length - 1]} />}

      <Card title="ساعات الصيام كل يوم">
        <DayBars data={perDay} dataKey="hours" unit="ساعة" />
      </Card>
      <Card title="المية كل يوم">
        <DayBars data={perDay} dataKey="water" unit="كوباية" max={8} />
      </Card>
      <Card title="الوزن كل أسبوع">
        {trend.length < 2 ? (
          <p className="text-sm text-muted">الرسم هيظهر لما يبقى عندك وزن أسبوعين على الأقل. بنتابع الوزن أسبوعياً عشان التذبذب اليومي طبيعي.</p>
        ) : (
          <div dir="ltr" className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis dataKey="week" reversed padding={{ left: 16, right: 16 }} tickFormatter={(w) => `أ${w}`} tick={{ fontSize: 12, fill: MUTED }} />
                <YAxis orientation="right" domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]} allowDecimals={false} width={40} tick={{ fontSize: 12, fill: MUTED }} />
                <Tooltip formatter={(v) => [`${v} كجم`, 'الوزن']} labelFormatter={(w) => `الأسبوع ${w}`} />
                <Line isAnimationActive={false} type="monotone" dataKey="weight" stroke={TEAL} strokeWidth={2} dot={{ r: 4, fill: TEAL }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Btn className="w-full" onClick={() => (window.location.hash = `#print/${wk}`)}>
        🖨 صفحة الطباعة للأسبوع ده
      </Btn>
    </div>
  );
}

function DayBars({ data, dataKey, unit, max }: { data: { name: string; hours: number; water: number }[]; dataKey: 'hours' | 'water'; unit: string; max?: number }) {
  return (
    <div dir="ltr" className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={LINE} vertical={false} />
          <XAxis dataKey="name" reversed interval={0} tick={{ fontSize: 11, fill: MUTED }} />
          <YAxis orientation="right" width={30} domain={[0, max ?? 'auto']} allowDecimals={false} tick={{ fontSize: 12, fill: MUTED }} />
          <Tooltip cursor={{ fill: TEAL_50 }} formatter={(v) => [`${v} ${unit}`, '']} separator="" />
          <Bar isAnimationActive={false} dataKey={dataKey} fill={TEAL} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value?: number; unit: string }) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-bold text-teal">
        {value ?? '—'} {value !== undefined && <span className="text-base font-normal text-muted">{unit}</span>}
      </div>
    </div>
  );
}

function ReviewForm({ wk, review, settings, isLatest }: { wk: number; review: WeeklyReview | null; settings: Settings; isLatest: boolean }) {
  const base: WeeklyReview = review ?? { weekIndex: wk, answers: ['', '', ''] };
  const [r, setR] = useState<WeeklyReview>(base);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setSaved(false);
  }, [r]);

  async function save() {
    await db.reviews.put(r);
    // The latest end-of-week weight becomes the "current weight" used for the protein target.
    const w = r.weightEnd ?? r.weightStart;
    if (isLatest && w) await db.settings.update('me', { currentWeight: w });
    setSaved(true);
  }
  const num = (k: 'weightStart' | 'weightEnd' | 'waistStart' | 'waistEnd') => (
    <input
      className={inputCls}
      type="number"
      inputMode="decimal"
      step="0.1"
      value={r[k] ?? ''}
      onChange={(e) => setR({ ...r, [k]: e.target.value === '' ? undefined : Number(e.target.value) })}
    />
  );

  return (
    <Card title="مراجعة الأسبوع">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="الوزن أول الأسبوع">{num('weightStart')}</Field>
          <Field label="الوزن آخر الأسبوع">{num('weightEnd')}</Field>
          <Field label="الوسط أول الأسبوع (سم)">{num('waistStart')}</Field>
          <Field label="الوسط آخر الأسبوع (سم)">{num('waistEnd')}</Field>
        </div>
        {PROMPTS.map((p, i) => (
          <Field key={p} label={p}>
            <textarea
              className={`${inputCls} min-h-20`}
              value={r.answers[i]}
              onChange={(e) => {
                const a = [...r.answers] as WeeklyReview['answers'];
                a[i] = e.target.value;
                setR({ ...r, answers: a });
              }}
            />
          </Field>
        ))}
        <Btn variant="primary" className="w-full" onClick={save}>
          {saved ? 'اتحفظت ✓' : 'احفظ المراجعة'}
        </Btn>
        {settings.targetWeight && r.weightEnd && (
          <p className="text-center text-sm text-muted">فاضل حوالي {Math.max(0, Math.round((r.weightEnd - settings.targetWeight) * 10) / 10)} كجم على هدفك — خطوة خطوة.</p>
        )}
      </div>
    </Card>
  );
}
