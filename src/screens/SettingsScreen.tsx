import { useRef, useState } from 'react';
import type { Settings } from '../types.ts';
import { db, exportAll, importAll, useLive } from '../db/db.ts';
import { dayLogsToCsv, makeBackup, parseBackup } from '../lib/backup.ts';
import { proteinRange } from '../lib/fasting.ts';
import { saveFile } from '../lib/files.ts';
import { formatTime, shortDate, toDateKey } from '../lib/dates.ts';
import { todayKey } from '../lib/weekly.ts';
import { Btn, Card, Field, inputCls } from '../components/ui.tsx';
import { MEDICAL_DISCLAIMER } from '../data/guides.ts';

export function SettingsScreen({ settings }: { settings: Settings }) {
  const [s, setS] = useState(settings);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<Awaited<ReturnType<typeof parseBackup>> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const events = useLive(() => db.emergencies.orderBy('datetime').reverse().limit(10).toArray(), []) ?? [];
  const pr = proteinRange(s.currentWeight || 0);

  async function saveProfile() {
    await db.settings.update('me', {
      currentWeight: s.currentWeight,
      targetWeight: s.targetWeight,
      height: s.height,
      startDate: s.startDate,
    });
    setMsg('اتحفظ ✓');
  }

  async function toggleNotifications() {
    if (settings.notifications) {
      await db.settings.update('me', { notifications: false });
      return;
    }
    if (!('Notification' in window)) {
      setMsg('المتصفح ده مش بيدعم التنبيهات. على الآيفون لازم تضيف التطبيق للشاشة الرئيسية الأول.');
      return;
    }
    const p = await Notification.requestPermission();
    if (p === 'granted') await db.settings.update('me', { notifications: true });
    else setMsg('التنبيهات مقفولة من إعدادات الجهاز.');
  }

  async function exportJson() {
    const data = await exportAll();
    await saveFile(`fasting-backup-${todayKey()}.json`, JSON.stringify(makeBackup(data), null, 2), 'application/json');
  }

  async function exportCsv() {
    const data = await exportAll();
    const names = new Map(data.meals.map((m) => [m.id, m.name]));
    await saveFile(`fasting-days-${todayKey()}.csv`, dayLogsToCsv(data.dayLogs, (id) => names.get(id)), 'text/csv;charset=utf-8');
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setPending(parseBackup(await f.text()));
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-4">
      <Card title="بياناتك">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="الوزن الحالي">
              <input className={inputCls} type="number" step="0.1" inputMode="decimal" value={s.currentWeight} onChange={(e) => setS({ ...s, currentWeight: Number(e.target.value) })} />
            </Field>
            <Field label="الوزن المستهدف">
              <input className={inputCls} type="number" step="0.1" inputMode="decimal" value={s.targetWeight} onChange={(e) => setS({ ...s, targetWeight: Number(e.target.value) })} />
            </Field>
            <Field label="الطول (سم)">
              <input className={inputCls} type="number" inputMode="numeric" value={s.height ?? ''} onChange={(e) => setS({ ...s, height: e.target.value ? Number(e.target.value) : undefined })} />
            </Field>
            <Field label="تاريخ البداية" hint="تغييره بيغير أسابيع الخطة">
              <input className={inputCls} type="date" value={s.startDate} onChange={(e) => setS({ ...s, startDate: e.target.value })} />
            </Field>
          </div>
          <p className="rounded-xl bg-teal-50 p-3 text-sm">
            البروتين: <b>{pr.min}–{pr.max} جم</b> في اليوم · 25–40 جم في الوجبة
          </p>
          <Btn variant="primary" className="w-full" onClick={saveProfile}>
            احفظ
          </Btn>
        </div>
      </Card>

      <Card title="التنبيهات">
        <p className="mb-3 text-sm text-muted">
          تذكير بالمية وانت صايم، و«نافذة الأكل بتقفل بعد ساعة». بتشتغل طول ما التطبيق مفتوح أو لسه في الخلفية — مفيش سيرفر في النسخة دي.
        </p>
        <Btn variant={settings.notifications ? 'secondary' : 'primary'} className="w-full" onClick={toggleNotifications}>
          {settings.notifications ? 'اقفل التنبيهات' : 'شغّل التنبيهات'}
        </Btn>
      </Card>

      <Card title="نسخة احتياطية">
        <div className="grid gap-2">
          <Btn variant="primary" onClick={exportJson}>
            صدّر كل البيانات (JSON)
          </Btn>
          <Btn onClick={exportCsv}>صدّر الأيام (CSV للإكسل)</Btn>
          <Btn onClick={() => fileRef.current?.click()}>استرجع من نسخة احتياطية</Btn>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        {pending && !pending.ok && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber">{pending.reason}</p>}
        {pending?.ok && (
          <div className="mt-3 space-y-2 rounded-xl bg-amber-50 p-3 text-sm">
            <p>
              الملف فيه {pending.data.dayLogs.length} يوم و{pending.data.meals.length} وجبة. الاسترجاع هيستبدل كل البيانات اللي على الجهاز دلوقتي. صدّر نسخة الأول لو
              محتاجها.
            </p>
            <div className="flex gap-2">
              <Btn
                variant="warn"
                className="flex-1"
                onClick={async () => {
                  if (!pending.ok) return;
                  await importAll(pending.data);
                  setPending(null);
                  setMsg('البيانات اترجعت ✓');
                }}
              >
                استرجع
              </Btn>
              <Btn className="flex-1" onClick={() => setPending(null)}>
                إلغاء
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {msg && <p className="rounded-xl bg-teal-50 p-3 text-sm">{msg}</p>}

      <Card title="مرات الدوخة أو الصداع">
        {events.length === 0 ? (
          <p className="text-sm text-muted">مفيش حاجة متسجلة.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between py-2">
                <span>
                  <span className="ltr">{shortDate(toDateKey(new Date(e.datetime)))}</span> · <span className="ltr">{formatTime(e.datetime)}</span>
                </span>
                <span className="text-muted">{e.resolvedBy === 'waterSalt' ? 'اتحسنت بالمية والملح' : 'كسرت الصيام'}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="تثبيت على الآيفون">
        <p className="text-sm">افتح التطبيق من Safari، دوس على زرار المشاركة، واختار «إضافة إلى الشاشة الرئيسية». بعد كده هيشتغل من غير نت.</p>
      </Card>

      <footer className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm">{MEDICAL_DISCLAIMER}</footer>
    </div>
  );
}
