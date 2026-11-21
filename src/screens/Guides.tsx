import { ANTI_HUNGER_TIPS, DRINKS, EATING_OUT } from '../data/guides.ts';
import { Card } from '../components/ui.tsx';
import { PlateCard } from './Meals.tsx';

export function Guides() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">المشروبات</h2>
      <Card tone="teal" title={`✓ ${DRINKS.allowed.title}`}>
        <List items={DRINKS.allowed.items} />
      </Card>
      <Card tone="amber" title={`~ ${DRINKS.grey.title}`}>
        <List items={DRINKS.grey.items} />
      </Card>
      <Card title={`○ ${DRINKS.breaks.title}`}>
        <List items={DRINKS.breaks.items} />
      </Card>

      <h2 className="pt-2 text-lg font-semibold">لو هتاكل برّه</h2>
      <Card>
        <List items={EATING_OUT} />
      </Card>

      <h2 className="pt-2 text-lg font-semibold">ضد الجوع</h2>
      <Card tone="teal">
        <List items={ANTI_HUNGER_TIPS} />
      </Card>

      <PlateCard />
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 ps-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}
