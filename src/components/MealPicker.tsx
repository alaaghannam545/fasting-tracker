import { useState } from 'react';
import type { DayLog, MealTag } from '../types.ts';
import { db, useLive } from '../db/db.ts';
import { MEAL_TAG_LABEL } from '../data/seed.ts';
import { Btn, inputCls, Modal } from './ui.tsx';

const TAGS: MealTag[] = ['breakFast', 'main', 'snack', 'emergency'];

export function MealPicker({ log, onChange }: { log: DayLog; onChange: (p: Partial<DayLog>) => void }) {
  const meals = useLive(() => db.meals.toArray(), []) ?? [];
  const [open, setOpen] = useState(false);
  const [free, setFree] = useState('');
  const byId = new Map(meals.map((m) => [m.id, m]));

  const toggle = (id: string) =>
    onChange({ mealIds: log.mealIds.includes(id) ? log.mealIds.filter((x) => x !== id) : [...log.mealIds, id] });

  return (
    <div>
      {log.mealIds.length + log.mealsFree.length === 0 ? (
        <p className="mb-3 text-sm text-muted">لسه ماسجلتش أكل النهارده.</p>
      ) : (
        <ul className="mb-3 flex flex-wrap gap-2">
          {log.mealIds.map((id) => (
            <li key={id}>
              <button type="button" onClick={() => toggle(id)} className="min-h-11 rounded-full bg-teal-50 px-3 text-sm text-teal">
                {byId.get(id)?.name ?? 'وجبة محذوفة'} ×
              </button>
            </li>
          ))}
          {log.mealsFree.map((t, i) => (
            <li key={`f${i}`}>
              <button
                type="button"
                onClick={() => onChange({ mealsFree: log.mealsFree.filter((_, j) => j !== i) })}
                className="min-h-11 rounded-full bg-teal-50 px-3 text-sm text-teal"
              >
                {t} ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <Btn className="w-full" onClick={() => setOpen(true)}>
        + ضيف وجبة
      </Btn>
      <Modal open={open} onClose={() => setOpen(false)} title="أكلت إيه؟">
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = free.trim();
            if (t) onChange({ mealsFree: [...log.mealsFree, t] });
            setFree('');
          }}
        >
          <input className={inputCls} value={free} onChange={(e) => setFree(e.target.value)} placeholder="اكتب أي أكلة" />
          <Btn type="submit" variant="primary">
            ضيف
          </Btn>
        </form>
        {TAGS.map((tag) => (
          <div key={tag} className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-muted">{MEAL_TAG_LABEL[tag]}</h3>
            <div className="grid gap-2">
              {meals
                .filter((m) => m.tags.includes(tag))
                .map((m) => {
                  const on = log.mealIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(m.id)}
                      className={`min-h-11 rounded-xl border p-3 text-start ${on ? 'border-teal bg-teal-50' : 'border-line'}`}
                    >
                      <div className="font-medium">
                        {on && '✓ '}
                        {m.name}
                      </div>
                      <div className="text-sm text-muted">{m.description}</div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
        <Btn variant="primary" className="sticky bottom-0 w-full" onClick={() => setOpen(false)}>
          خلصت
        </Btn>
      </Modal>
    </div>
  );
}
