import { useState } from 'react';
import type { ShoppingCategory } from '../types.ts';
import { db, useLive } from '../db/db.ts';
import { SHOPPING_CATEGORIES, SHOPPING_CATEGORY_LABEL } from '../data/seed.ts';
import { Btn, Card, inputCls } from '../components/ui.tsx';

export function Shopping() {
  const items = useLive(() => db.shopping.toArray(), []) ?? [];
  const [name, setName] = useState('');
  const [cat, setCat] = useState<ShoppingCategory>('protein');
  const [msg, setMsg] = useState<string | null>(null);
  const remaining = items.filter((i) => !i.checked).length;

  async function add() {
    const n = name.trim();
    if (!n) return;
    await db.shopping.add({ id: `u-${Date.now().toString(36)}`, category: cat, name: n, checked: false });
    setName('');
  }

  async function resetWeek() {
    await db.shopping.toCollection().modify({ checked: false });
    setMsg('بدأنا أسبوع جديد — كل الحاجات رجعت من غير علامة.');
  }

  async function share() {
    const lines = ['قايمة المشتريات'];
    for (const c of SHOPPING_CATEGORIES) {
      const list = items.filter((i) => i.category === c && !i.checked);
      if (!list.length) continue;
      lines.push('', `${SHOPPING_CATEGORY_LABEL[c]}:`, ...list.map((i) => `- ${i.name}`));
    }
    const text = lines.join('\n');
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setMsg('القايمة اتنسخت — الزقها في أي شات.');
      }
    } catch {
      /* user cancelled share */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Btn variant="primary" className="flex-1" onClick={share}>
          شارك القايمة ({remaining})
        </Btn>
        <Btn className="flex-1" onClick={resetWeek}>
          أسبوع جديد
        </Btn>
      </div>
      {msg && <p className="rounded-xl bg-teal-50 p-3 text-sm">{msg}</p>}
      <Card title="ضيف حاجة">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value as ShoppingCategory)}>
            {SHOPPING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SHOPPING_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الحاجة" />
            <Btn type="submit" variant="primary">
              ضيف
            </Btn>
          </div>
        </form>
      </Card>
      {SHOPPING_CATEGORIES.map((c) => {
        const list = items.filter((i) => i.category === c);
        if (!list.length) return null;
        return (
          <Card key={c} title={SHOPPING_CATEGORY_LABEL[c]}>
            <ul className="divide-y divide-line">
              {list.map((i) => (
                <li key={i.id} className="flex items-center gap-2">
                  <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-teal"
                      checked={i.checked}
                      onChange={() => db.shopping.update(i.id, { checked: !i.checked })}
                    />
                    <span className={i.checked ? 'text-muted line-through' : ''}>{i.name}</span>
                  </label>
                  <button
                    type="button"
                    aria-label={`امسح ${i.name}`}
                    onClick={() => db.shopping.delete(i.id)}
                    className="min-h-11 min-w-11 rounded-full text-xl text-muted active:bg-teal-50"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
