import type { Settings } from '../types.ts';
import { db, useLive } from '../db/db.ts';
import { weekDates, weekStats } from '../lib/weekly.ts';
import { dayName, formatTime, shortDate } from '../lib/dates.ts';
import { targetHours } from '../lib/fasting.ts';
import { DAY_TYPES } from './Today.tsx';

const ACT = { walk: 'مشي', resistance: 'مقاومة', rest: 'راحة' } as const;
const ADH = { full: 'كامل', partial: 'جزئي', flexible: 'مرن' } as const;
const PROMPTS = ['أكتر حاجة نجحت معايا', 'أصعب وقت حسيت فيه بالجوع وليه', 'هعدّل إيه الأسبوع الجاي'];

export function PrintWeek({ settings, weekIndex }: { settings: Settings; weekIndex: number }) {
  const dates = weekDates(settings.startDate, weekIndex);
  const logs = useLive(() => db.dayLogs.where('date').between(dates[0], dates[6], true, true).toArray(), [weekIndex]) ?? [];
  const meals = useLive(() => db.meals.toArray(), []) ?? [];
  const review = useLive(() => db.reviews.get(weekIndex), [weekIndex]);
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const names = new Map(meals.map((m) => [m.id, m.name]));
  const stats = weekStats(logs);

  const th = 'border border-gray-400 bg-teal-50 px-1 py-1 text-[11px] font-semibold';
  const td = 'border border-gray-400 px-1 py-1 text-[11px] align-top h-14';

  return (
    <div className="mx-auto max-w-[297mm] bg-white p-4 text-ink">
      <div className="no-print mb-4 flex gap-2">
        <button type="button" className="min-h-11 rounded-xl bg-teal px-4 text-white" onClick={() => window.print()}>
          اطبع
        </button>
        <button type="button" className="min-h-11 rounded-xl border border-teal px-4 text-teal" onClick={() => (window.location.hash = '')}>
          رجوع
        </button>
      </div>
      <header className="mb-2 flex items-end justify-between">
        <h1 className="text-lg font-bold">متابعة الصيام والأكل — الأسبوع {weekIndex + 1}</h1>
        <span className="text-sm">
          <span className="ltr">{shortDate(dates[0])}</span> – <span className="ltr">{shortDate(dates[6])}</span> · ع عادي · ط عمليات طويلة · ن بعد نبطشية
        </span>
      </header>
      <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full min-w-[260mm] border-collapse text-center print:min-w-0">
        <thead>
          <tr>
            {['اليوم', 'النوع', 'بدأت', 'كسرت', 'ساعات (الهدف)', 'مية', 'جوع', 'طاقة', 'نوم', 'نشاط', 'الالتزام', 'الأكل', 'ملاحظات'].map((h) => (
              <th key={h} className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((d) => {
            const l = byDate.get(d);
            return (
              <tr key={d}>
                <td className={td}>
                  {dayName(d)}
                  <br />
                  <span className="ltr">{shortDate(d)}</span>
                </td>
                <td className={td}>{l ? DAY_TYPES.find((t) => t.value === l.dayType)?.letter : 'ع / ط / ن'}</td>
                <td className={td}>{l?.fastStart && <span className="ltr">{formatTime(l.fastStart)}</span>}</td>
                <td className={td}>{l?.fastEnd && <span className="ltr">{formatTime(l.fastEnd)}</span>}</td>
                <td className={td}>
                  <b>{l?.hours ?? ''}</b> ({targetHours(settings.startDate, d, l?.dayType ?? 'normal')})
                </td>
                <td className={td}>{l ? `${l.water}/8` : '○○○○○○○○'}</td>
                <td className={td}>{l?.hunger ?? ''}</td>
                <td className={td}>{l?.energy ?? ''}</td>
                <td className={td}>{l?.sleepHours ?? ''}</td>
                <td className={td}>{l?.activity ? ACT[l.activity] : ''}</td>
                <td className={td}>{l?.adherence ? ADH[l.adherence] : 'كامل / جزئي / مرن'}</td>
                <td className={`${td} text-start`}>{l && [...l.mealIds.map((id) => names.get(id) ?? ''), ...l.mealsFree].filter(Boolean).join('، ')}</td>
                <td className={`${td} text-start`}>{l?.notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <section className="mt-3 grid grid-cols-4 gap-2 text-sm">
        <div className="rounded border border-gray-400 p-2">
          الوزن: {review?.weightStart ?? '___'} ← {review?.weightEnd ?? '___'}
        </div>
        <div className="rounded border border-gray-400 p-2">
          الوسط: {review?.waistStart ?? '___'} ← {review?.waistEnd ?? '___'}
        </div>
        <div className="rounded border border-gray-400 p-2">
          متوسط الصيام: {stats.avgFastHours ?? '—'} · النوم: {stats.avgSleep ?? '—'}
        </div>
        <div className="rounded border border-gray-400 p-2">
          كامل {stats.adherence.full} · جزئي {stats.adherence.partial} · مرن {stats.adherence.flexible}
        </div>
      </section>
      <section className="mt-2 grid grid-cols-3 gap-2 text-sm">
        {PROMPTS.map((p, i) => (
          <div key={p} className="min-h-20 rounded border border-gray-400 p-2">
            <div className="font-semibold">{p}</div>
            <div>{review?.answers[i]}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
