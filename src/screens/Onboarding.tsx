import { useState } from 'react';
import { db } from '../db/db.ts';
import { proteinRange } from '../lib/fasting.ts';
import { todayKey } from '../lib/weekly.ts';
import { Btn, Card, Field, inputCls } from '../components/ui.tsx';
import { MEDICAL_DISCLAIMER } from '../data/guides.ts';

export function Onboarding() {
  const [weight, setWeight] = useState('');
  const [target, setTarget] = useState('');
  const [height, setHeight] = useState('');
  const [start, setStart] = useState(todayKey());
  const w = Number(weight);
  const t = Number(target);
  const valid = w > 30 && w < 300 && t > 30 && t < 300 && !!start;
  const pr = valid ? proteinRange(w) : null;

  async function save() {
    if (!valid) return;
    await db.settings.put({
      id: 'me',
      startDate: start,
      currentWeight: w,
      targetWeight: t,
      height: Number(height) > 0 ? Number(height) : undefined,
      notifications: false,
    });
    await db.reviews.put({ weekIndex: 0, weightStart: w, answers: ['', '', ''] });
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4 pt-8">
      <h1 className="text-2xl font-bold text-teal">أهلاً بيك 👋</h1>
      <p className="text-muted">
        هنمشي بالراحة: أول أسبوع <span className="ltr">12:12</span>، تاني أسبوع <span className="ltr">14:10</span>، ومن الأسبوع
        التالت <span className="ltr">16:8</span>. الصيام بيتحسب بالساعات من آخر وجبة، مش بمواعيد ثابتة.
      </p>
      <Card>
        <div className="space-y-4">
          <Field label="وزنك دلوقتي (كجم)">
            <input className={inputCls} inputMode="decimal" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
          <Field label="الوزن اللي عايز توصله (كجم)">
            <input className={inputCls} inputMode="decimal" type="number" step="0.1" value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
          <Field label="تاريخ البداية">
            <input className={inputCls} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="الطول (سم) — اختياري">
            <input className={inputCls} inputMode="numeric" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
          </Field>
        </div>
      </Card>
      {pr && (
        <Card tone="teal" title="البروتين بتاعك">
          <p>
            محتاج <b>{pr.min}–{pr.max} جم</b> بروتين في اليوم (<span className="ltr">1.2–1.6</span> جم لكل كيلو)، يعني حوالي 25–40 جم
            في كل وجبة. ده بيساعدك تحافظ على عضلاتك وانت بتخس.
          </p>
        </Card>
      )}
      <Btn variant="primary" className="w-full" disabled={!valid} onClick={save}>
        يلا نبدأ
      </Btn>
      <p className="text-xs text-muted">{MEDICAL_DISCLAIMER}</p>
    </main>
  );
}
