import { useEffect, useRef, useState } from 'react';
import type { Activity, Adherence, DayLog, DayType, Settings } from '../types.ts';
import { db, emptyDayLog, patchDayLog, useLive } from '../db/db.ts';
import { breakFast, clearDayFast, setDayFast, startFast } from '../db/actions.ts';
import { elapsedHours, planLabel, planWeek, proteinRange, resolveEndTime, resolveStartTime, targetHours } from '../lib/fasting.ts';
import { addDays, dayName, formatDuration, formatTime, fromLocalInput, shortDate, toLocalInput } from '../lib/dates.ts';
import { needsGentleCard, todayKey } from '../lib/weekly.ts';
import { Btn, Card, Field, inputCls, Modal, Scale, Segmented } from '../components/ui.tsx';
import { ProgressRing } from '../components/ProgressRing.tsx';
import { MealPicker } from '../components/MealPicker.tsx';
import { ANTI_HUNGER_TIPS } from '../data/guides.ts';

export const DAY_TYPES: { value: DayType; letter: string; label: string }[] = [
  { value: 'normal', letter: 'ع', label: 'عادي' },
  { value: 'longOps', letter: 'ط', label: 'عمليات طويلة' },
  { value: 'postCall', letter: 'ن', label: 'بعد نبطشية' },
];

export function Today({ settings }: { settings: Settings }) {
  const today = todayKey();
  const [date, setDate] = useState(today);
  const stored = useLive(async () => (await db.dayLogs.get(date)) ?? null, [date]);
  const loaded = stored !== undefined;
  const log = stored ?? emptyDayLog(date);
  const events = useLive(() => db.emergencies.toArray(), []) ?? [];
  const isToday = date === today;
  const target = targetHours(settings.startDate, date, log.dayType);
  const week = planWeek(settings.startDate, date);
  const pr = proteinRange(settings.currentWeight);
  const patch = (p: Partial<DayLog>) => patchDayLog(date, p);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Btn variant="ghost" onClick={() => setDate(addDays(date, -1))} ariaLabel="اليوم اللي فات">
          <span className="text-xl">→</span>
        </Btn>
        <button type="button" className="min-h-11 text-center" onClick={() => setDate(today)}>
          <div className="font-semibold">{isToday ? 'النهارده' : dayName(date)}</div>
          <div className="text-sm text-muted">
            <span className="ltr">{shortDate(date)}</span> · الأسبوع {week} · <span className="ltr">{planLabel(week)}</span>
          </div>
        </button>
        <Btn variant="ghost" disabled={isToday} onClick={() => setDate(addDays(date, 1))} ariaLabel="اليوم اللي بعده">
          <span className="text-xl">←</span>
        </Btn>
      </div>

      {isToday && needsGentleCard(events, new Date()) && (
        <Card tone="amber" title="خلي بالك من نفسك">
          <p>
            الدوخة أو الصداع اتكرروا 3 مرات أو أكتر الأسبوع ده. جرّب تقصّر ساعات الصيام شوية، وقيس السكر والضغط. ده عادي في الأول
            وجسمك محتاج وقت.
          </p>
        </Card>
      )}

      {isToday ? <FastTimer settings={settings} log={log} target={target} /> : <PastFast log={log} target={target} />}

      <Card title="نوع اليوم">
        <Segmented
          label="نوع اليوم"
          value={log.dayType}
          onChange={(v) => patch({ dayType: v })}
          options={DAY_TYPES.map((d) => ({ value: d.value, label: <span className="text-lg">{d.letter}</span>, sub: d.label }))}
        />
        {log.dayType === 'longOps' && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">
            يوم عمليات طويلة: الهدف <b>12 ساعة بالكتير</b>. كُل وجبة فيها بروتين قبل العمليات.
          </p>
        )}
        {log.dayType === 'postCall' && (
          <p className="mt-3 rounded-xl bg-teal-50 p-3 text-sm">يوم مرن بعد النبطشية: 12 ساعة كفاية، وأي حاجة تعملها النهارده كويسة.</p>
        )}
      </Card>

      <Card title="المية" action={<span className="text-sm text-muted">{log.water} من 8</span>}>
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 8 }, (_, i) => {
            const on = i < log.water;
            return (
              <button
                key={i}
                type="button"
                aria-label={`كوباية ${i + 1}`}
                aria-pressed={on}
                onClick={() => patch({ water: log.water === i + 1 ? i : i + 1 })}
                className={`flex min-h-12 items-center justify-center rounded-xl border text-xl ${on ? 'border-teal bg-teal-50' : 'border-line'}`}
              >
                <span className={on ? '' : 'opacity-30'}>💧</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="حاسس بإيه؟">
        <div className="space-y-4">
          <Scale label="الجوع" low="مفيش جوع" high="جوع شديد" value={log.hunger} onChange={(v) => patch({ hunger: v })} />
          <Scale label="الطاقة" low="خمول" high="نشاط عالي" value={log.energy} onChange={(v) => patch({ energy: v })} />
        </div>
      </Card>

      <Card title="النوم والحركة">
        <div className="space-y-4">
          <NumberSave label="ساعات النوم" value={log.sleepHours} onSave={(v) => patch({ sleepHours: v })} step={0.5} />
          <Segmented<Activity>
            label="النشاط"
            value={log.activity}
            onChange={(v) => patch({ activity: v })}
            options={[
              { value: 'walk', label: 'مشي' },
              { value: 'resistance', label: 'تمرين مقاومة' },
              { value: 'rest', label: 'راحة' },
            ]}
          />
        </div>
      </Card>

      <Card title="الأكل" action={<span className="text-sm text-muted">بروتين: {pr.min}–{pr.max} جم</span>}>
        <MealPicker log={log} onChange={patch} />
      </Card>

      <Card title="الالتزام النهارده">
        <Segmented<Adherence>
          label="الالتزام"
          value={log.adherence}
          onChange={(v) => patch({ adherence: v })}
          options={[
            { value: 'full', label: 'كامل' },
            { value: 'partial', label: 'جزئي' },
            { value: 'flexible', label: 'يوم مرن' },
          ]}
        />
        {log.adherence && log.adherence !== 'full' && (
          <p className="mt-3 text-sm text-muted">عادي جداً. كل يوم بيعلمك حاجة عن جسمك وجدولك.</p>
        )}
      </Card>

      <Card title="ملاحظات">
        {loaded && <TextSave value={log.notes} onSave={(v) => patch({ notes: v })} key={date} />}
      </Card>

      {isToday && settings.activeFastStart && (
        <Card tone="teal" title="لو جعت">
          <ul className="list-disc space-y-1 ps-5 text-sm">
            {ANTI_HUNGER_TIPS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function useNow(ms = 30_000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function FastTimer({ settings, log, target }: { settings: Settings; log: DayLog; target: number }) {
  const now = useNow();
  const [editStart, setEditStart] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const active = settings.activeFastStart;

  if (!active) {
    return (
      <Card>
        <div className="space-y-3 text-center">
          {log.hours !== undefined ? (
            <LastFastSummary log={log} target={target} />
          ) : (
            <p className="text-muted">
              هدف النهارده: <b className="text-ink">{target} ساعة</b> من آخر وجبة.
            </p>
          )}
          <Btn variant="primary" className="w-full text-lg" onClick={() => setEditStart(true)}>
            بدأت الصيام
          </Btn>
        </div>
        <TimeDialog
          open={editStart}
          title="بدأت الصيام إمتى؟"
          hint="اكتب وقت آخر وجبة. لو الوقت بعد دلوقتي هنعتبره امبارح."
          initial={formatTime(new Date())}
          onClose={() => setEditStart(false)}
          onSave={async (hhmm) => {
            await startFast(resolveStartTime(hhmm, new Date()).toISOString());
            return null;
          }}
        />
      </Card>
    );
  }

  const elapsed = elapsedHours(active, now);
  const reached = elapsed >= target;
  return (
    <Card>
      <ProgressRing value={elapsed / target}>
        <div className="text-sm text-muted">صايم بقالك</div>
        <div className="ltr text-5xl font-bold text-teal">{formatDuration(now.getTime() - new Date(active).getTime())}</div>
        <div className="text-sm text-muted">
          الهدف {target} ساعة
        </div>
      </ProgressRing>
      <p className="mt-3 text-center">
        {reached ? 'وصلت لهدف النهارده 💪 تقدر تفطر براحتك.' : `فاضل حوالي ${Math.ceil(target - elapsed)} ساعة على الهدف.`}
      </p>
      <div className="mt-3 flex gap-2">
        <Btn className="flex-1" onClick={() => setEditStart(true)}>
          بدأت <span className="ltr">{formatTime(active)}</span> ✎
        </Btn>
        <Btn variant="primary" className="flex-1" onClick={() => setBreaking(true)}>
          كسرت الصيام
        </Btn>
      </div>
      <TimeDialog
        open={editStart}
        title="عدّل وقت بداية الصيام"
        hint="لو الوقت بعد دلوقتي هنعتبره امبارح."
        initial={formatTime(active)}
        onClose={() => setEditStart(false)}
        onSave={async (hhmm) => {
          await startFast(resolveStartTime(hhmm, new Date()).toISOString());
          return null;
        }}
      />
      <TimeDialog
        open={breaking}
        title="كسرت الصيام إمتى؟"
        hint="الافتراضي دلوقتي. لو الوقت عدّى نص الليل هيتحسب صح."
        initial={formatTime(new Date())}
        onClose={() => setBreaking(false)}
        onSave={(hhmm) => breakFast(resolveEndTime(hhmm, new Date(active)).toISOString())}
      />
    </Card>
  );
}

function LastFastSummary({ log, target }: { log: DayLog; target: number }) {
  const hours = log.hours ?? 0;
  return (
    <div>
      <div className="text-sm text-muted">صيام النهارده</div>
      <div className="text-3xl font-bold text-teal">{hours} ساعة</div>
      <div className="text-sm text-muted">
        {log.fastStart && log.fastEnd && (
          <>
            من <span className="ltr">{formatTime(log.fastStart)}</span> لـ <span className="ltr">{formatTime(log.fastEnd)}</span> ·{' '}
          </>
        )}
        {hours >= target ? 'وصلت للهدف 💪' : `الهدف كان ${target} — كل ساعة بتفرق`}
      </div>
    </div>
  );
}

function PastFast({ log, target }: { log: DayLog; target: number }) {
  const [editing, setEditing] = useState(false);
  return (
    <Card title="الصيام في اليوم ده">
      {log.hours !== undefined ? (
        <div className="text-center">
          <LastFastSummary log={log} target={target} />
        </div>
      ) : (
        <p className="text-muted">مفيش صيام متسجل. تقدر تضيفه.</p>
      )}
      <Btn className="mt-3 w-full" onClick={() => setEditing(true)}>
        {log.hours !== undefined ? 'عدّل الأوقات' : 'ضيف صيام'}
      </Btn>
      <FastEditDialog open={editing} log={log} onClose={() => setEditing(false)} />
    </Card>
  );
}

/** Full date+time edit for any day (handles multi-day and midnight crossings explicitly). */
function FastEditDialog({ open, log, onClose }: { open: boolean; log: DayLog; onClose: () => void }) {
  const defEnd = `${log.date}T12:00`;
  const defStart = `${addDays(log.date, -1)}T20:00`;
  const [start, setStart] = useState(log.fastStart ? toLocalInput(log.fastStart) : defStart);
  const [end, setEnd] = useState(log.fastEnd ? toLocalInput(log.fastEnd) : defEnd);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setStart(log.fastStart ? toLocalInput(log.fastStart) : defStart);
      setEnd(log.fastEnd ? toLocalInput(log.fastEnd) : defEnd);
      setErr(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="أوقات الصيام">
      <div className="space-y-4">
        <Field label="بدأت الصيام (آخر وجبة)">
          <input className={inputCls} type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="كسرت الصيام">
          <input className={inputCls} type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        {err && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber">{err}</p>}
        <div className="flex gap-2">
          {log.hours !== undefined && (
            <Btn
              className="flex-1"
              onClick={async () => {
                await clearDayFast(log.date);
                onClose();
              }}
            >
              امسح
            </Btn>
          )}
          <Btn
            variant="primary"
            className="flex-1"
            onClick={async () => {
              const e = await setDayFast(log.date, fromLocalInput(start), fromLocalInput(end));
              if (e) setErr(e);
              else onClose();
            }}
          >
            احفظ
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function TimeDialog({
  open,
  title,
  hint,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  hint: string;
  initial: string;
  onClose: () => void;
  onSave: (hhmm: string) => Promise<string | null>;
}) {
  const [v, setV] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setV(initial);
      setErr(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <Field label="الوقت" hint={hint}>
          <input className={`${inputCls} text-center text-2xl`} type="time" value={v} onChange={(e) => setV(e.target.value)} />
        </Field>
        {err && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber">{err}</p>}
        <Btn
          variant="primary"
          className="w-full"
          disabled={!v}
          onClick={async () => {
            const e = await onSave(v);
            if (e) setErr(e);
            else onClose();
          }}
        >
          احفظ
        </Btn>
      </div>
    </Modal>
  );
}

function NumberSave({ label, value, onSave, step }: { label: string; value?: number; onSave: (v?: number) => void; step: number }) {
  const [v, setV] = useState(value?.toString() ?? '');
  useEffect(() => {
    setV(value?.toString() ?? '');
  }, [value]);
  return (
    <Field label={label}>
      <input
        className={inputCls}
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        max={24}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => onSave(v === '' ? undefined : Math.min(24, Math.max(0, Number(v))))}
      />
    </Field>
  );
}

function TextSave({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const timer = useRef<number | undefined>(undefined);
  return (
    <textarea
      className={`${inputCls} min-h-24`}
      value={v}
      placeholder="أي حاجة عايز تفتكرها عن النهارده"
      onChange={(e) => {
        setV(e.target.value);
        window.clearTimeout(timer.current);
        const next = e.target.value;
        timer.current = window.setTimeout(() => onSave(next), 400);
      }}
      onBlur={() => onSave(v)}
    />
  );
}
