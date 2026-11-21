import { useState } from 'react';
import type { Meal, MealTag } from '../types.ts';
import { db, useLive } from '../db/db.ts';
import { MEAL_TAG_LABEL } from '../data/seed.ts';
import { PLATE_PRINCIPLE } from '../data/guides.ts';
import { Btn, Card, Field, inputCls, Modal, Segmented } from '../components/ui.tsx';

const TAGS: MealTag[] = ['breakFast', 'main', 'snack', 'emergency'];

export function PlateCard() {
  return (
    <Card tone="teal" title="مبدأ الطبق">
      <div className="grid grid-cols-2 gap-2">
        {PLATE_PRINCIPLE.map((p) => (
          <div key={p.part} className="rounded-xl bg-white p-3">
            <div className="font-semibold text-teal">{p.part}</div>
            <div className="text-sm text-muted">{p.hint}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Meals() {
  const meals = useLive(() => db.meals.toArray(), []) ?? [];
  const [filter, setFilter] = useState<MealTag | 'all'>('all');
  const [editing, setEditing] = useState<Meal | null>(null);
  const shown = filter === 'all' ? meals : meals.filter((m) => m.tags.includes(filter));

  return (
    <div className="space-y-4">
      <PlateCard />
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2">
          {(['all', ...TAGS] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`min-h-11 rounded-full border px-4 text-sm ${filter === t ? 'border-teal bg-teal text-white' : 'border-line'}`}
            >
              {t === 'all' ? 'الكل' : MEAL_TAG_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      <Btn variant="primary" className="w-full" onClick={() => setEditing({ id: '', name: '', description: '', tags: [], isSeed: false })}>
        + وجبة جديدة
      </Btn>
      <ul className="space-y-2">
        {shown.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => setEditing(m)} className="w-full rounded-2xl border border-line p-3 text-start active:bg-teal-50">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{m.name}</span>
                <span className="flex shrink-0 gap-1">
                  {m.tags.map((t) => (
                    <span key={t} className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal">
                      {MEAL_TAG_LABEL[t]}
                    </span>
                  ))}
                </span>
              </div>
              <div className="mt-1 text-sm text-muted">{m.description}</div>
            </button>
          </li>
        ))}
      </ul>
      {editing && <MealEditor meal={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function MealEditor({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const [name, setName] = useState(meal.name);
  const [desc, setDesc] = useState(meal.description);
  const [tags, setTags] = useState<MealTag[]>(meal.tags);
  const [confirmDel, setConfirmDel] = useState(false);
  const isNew = !meal.id;

  async function save() {
    const id = meal.id || `u-${Date.now().toString(36)}`;
    await db.meals.put({ ...meal, id, name: name.trim(), description: desc.trim(), tags });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'وجبة جديدة' : 'تعديل الوجبة'}>
      <div className="space-y-4">
        <Field label="الاسم">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="المكونات أو الوصف">
          <textarea className={`${inputCls} min-h-20`} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>
        <div>
          <span className="mb-1 block font-medium">النوع (ممكن أكتر من واحد)</span>
          <div className="grid grid-cols-2 gap-2">
            {TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                  className={`min-h-11 rounded-xl border ${on ? 'border-teal bg-teal text-white' : 'border-line'}`}
                >
                  {MEAL_TAG_LABEL[t]}
                </button>
              );
            })}
          </div>
        </div>
        <Btn variant="primary" className="w-full" disabled={!name.trim() || tags.length === 0} onClick={save}>
          احفظ
        </Btn>
        {!isNew &&
          (confirmDel ? (
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="mb-2 text-sm">متأكد إنك عايز تمسح «{meal.name}»؟</p>
              <Segmented
                value={undefined}
                onChange={async (v) => {
                  if (v === 'yes') {
                    await db.meals.delete(meal.id);
                    onClose();
                  } else setConfirmDel(false);
                }}
                options={[
                  { value: 'yes', label: 'أيوه امسح' },
                  { value: 'no', label: 'لأ' },
                ]}
              />
            </div>
          ) : (
            <Btn variant="ghost" className="w-full" onClick={() => setConfirmDel(true)}>
              امسح الوجبة
            </Btn>
          ))}
      </div>
    </Modal>
  );
}
