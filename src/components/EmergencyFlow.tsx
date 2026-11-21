import { useEffect, useState } from 'react';
import { Btn, Modal } from './ui.tsx';
import { db, useLive } from '../db/db.ts';
import { breakFast, logEmergency } from '../db/actions.ts';

const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const STEPS = [
  'اقعد ووقّف اللي بتعمله',
  'اشرب كوبايتين مية برشة ملح (إلا لو ضغطك عالي)',
  'شغّل تايمر 15–20 دقيقة واستنى',
];

export function EmergencyFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [phase, setPhase] = useState<'steps' | 'better' | 'broke'>('steps');
  const snacks = useLive(() => db.meals.where('tags').equals('emergency').toArray(), []);

  useEffect(() => {
    if (!open) {
      setTimerEnd(null);
      setPhase('steps');
    }
  }, [open]);

  useEffect(() => {
    if (!timerEnd) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [timerEnd]);

  const remaining = timerEnd ? timerEnd - now : 0;
  const timerDone = timerEnd !== null && remaining <= 0;

  async function better() {
    await logEmergency('waterSalt');
    setPhase('better');
  }
  async function broke() {
    await logEmergency('brokeFast');
    await breakFast(new Date().toISOString());
    setPhase('broke');
  }

  return (
    <Modal open={open} onClose={onClose} title="دايخ أو مصدع؟ خد نفسك">
      {phase === 'steps' && (
        <div className="space-y-4">
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl bg-teal-50 p-4 text-center">
            {timerEnd === null ? (
              <div className="flex gap-2">
                <Btn variant="primary" className="flex-1" onClick={() => setTimerEnd(Date.now() + 15 * 60_000)}>
                  تايمر 15 دقيقة
                </Btn>
                <Btn className="flex-1" onClick={() => setTimerEnd(Date.now() + 20 * 60_000)}>
                  20 دقيقة
                </Btn>
              </div>
            ) : (
              <div>
                <div className="ltr text-4xl font-bold text-teal" aria-live="polite">
                  {timerDone ? '0:00' : mmss(remaining)}
                </div>
                <div className="text-sm text-muted">{timerDone ? 'الوقت خلص — حاسس بإيه؟' : 'دقايق متبقية — خليك قاعد واشرب مية'}</div>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Btn variant="primary" onClick={better}>
              اتحسنت ✓
            </Btn>
            <Btn variant="warn" onClick={broke}>
              ما اتحسنتش — هكسر الصيام بسناك فيه بروتين
            </Btn>
          </div>
          <ExtraAdvice />
        </div>
      )}
      {phase === 'better' && (
        <div className="space-y-4">
          <p>كويس إنك اتحسنت. كمّل على مية، ولو حسيت بأي حاجة تاني ارجع هنا على طول.</p>
          <ExtraAdvice />
          <Btn variant="primary" className="w-full" onClick={onClose}>
            تمام
          </Btn>
        </div>
      )}
      {phase === 'broke' && (
        <div className="space-y-4">
          <p>قرار صح — صحتك أهم من عدد الساعات. اتسجل إنك كسرت الصيام دلوقتي. كُل حاجة من دول:</p>
          <ul className="space-y-2">
            {(snacks ?? []).map((m) => (
              <li key={m.id} className="rounded-xl border border-line p-3">
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-muted">{m.description}</div>
              </li>
            ))}
          </ul>
          <ExtraAdvice />
          <Btn variant="primary" className="w-full" onClick={onClose}>
            تمام
          </Btn>
        </div>
      )}
    </Modal>
  );
}

function ExtraAdvice() {
  return (
    <ul className="space-y-2 rounded-2xl bg-amber-50 p-3 text-sm">
      <li>
        <b>بتتكرر؟</b> قيس السكر والضغط، وقصّر ساعات الصيام شوية.
      </li>
      <li>
        <b>يوم عمليات طويلة؟</b> افطر قبلها بوجبة فيها بروتين.
      </li>
    </ul>
  );
}
