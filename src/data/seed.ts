import type { Meal, MealTag, ShoppingCategory, ShoppingItem } from '../types.ts';

// NOTE: wording rule — "حليب" for milk, "لبن رايب" for fermented laban. Never bare "لبن".
// Excluded foods: no Greek yogurt, no lentils.

const m = (id: string, name: string, description: string, tags: MealTag[]): Meal => ({ id, name, description, tags, isSeed: true });

export const SEED_MEALS: Meal[] = [
  m('bf-eggs-foul', 'بيض وفول', '2–3 بيضات + فول بزيت زيتون وكمون + سلطة + نص رغيف بلدي', ['breakFast']),
  m('bf-oats', 'شوفان بالحليب', '3 معالق شوفان في كوباية حليب + 2 بيض مسلوق + توت أو نص موزة', ['breakFast']),
  m('bf-omelette', 'أومليت خضار بالجبنة القريش', 'أومليت خضار بالجبنة القريش + عيش أسمر', ['breakFast']),
  m('bf-beans-eggs', 'فاصوليا بالبيض', 'فاصوليا معلبة مصفاة ومغسولة + 2 بيض بصلصة الطماطم + سلطة', ['breakFast']),
  m('bf-laban-dates', 'لبن رايب وتمر', 'لبن رايب سادة + 2 تمر، وبعدها الوجبة بعد ربع ساعة', ['breakFast']),

  m('main-chicken', 'صدر فراخ بالأرز', 'صدر فراخ + نص كوباية أرز بسمتي أو بني + خضار سوتيه', ['main']),
  m('main-fish', 'سمك مشوي أو سالمون', 'سمك مشوي أو سالمون + بطاطا + سلطة بالطحينة', ['main']),
  m('main-kofta', 'كفتة أو لحمة قليلة الدهن', 'كفتة أو لحمة قليلة الدهن + برغل + سلطة زبادي بالخيار', ['main']),
  m('main-veg', 'طبق نباتي', 'فاصوليا حمرا معلبة أو حمص + كينوا + خضار مشوية', ['main']),

  m('sn-nuts', 'حفنة مكسرات', 'حفنة لوز أو عين جمل (30 جم)', ['snack']),
  m('sn-apple-pb', 'تفاحة بزبدة الفول', 'تفاحة + معلقة زبدة فول سوداني', ['snack']),
  m('sn-cottage', 'جبنة قريش بالخيار', 'جبنة قريش بالخيار', ['snack']),
  m('sn-hummus', 'حمص بالطحينة أو بابا غنوج', 'حمص بالطحينة أو بابا غنوج مع جزر وخيار', ['snack']),
  m('sn-dates-milk', 'تمر وحليب', '2 تمر + حليب أو لبن رايب', ['snack']),

  m('em-nuts', 'كيس مكسرات', 'كيس مكسرات 30 جم — مش محتاج تلاجة', ['emergency']),
  m('em-tuna', 'تونة بفتاحة سهلة', 'علبة تونة بفتاحة سهلة — مش محتاجة تلاجة', ['emergency']),
  m('em-milk', 'علبة حليب طويلة الأجل', 'علبة حليب طويلة الأجل — مش محتاجة تلاجة', ['emergency']),
  m('em-chickpeas', 'حمص محمّص', 'حمص محمّص — مش محتاج تلاجة', ['emergency']),
  m('em-dates', 'تمر', '3–4 تمرات — مش محتاجة تلاجة', ['emergency']),
];

export const MEAL_TAG_LABEL: Record<MealTag, string> = {
  breakFast: 'كسر صيام',
  main: 'رئيسية',
  snack: 'سناك',
  emergency: 'طوارئ',
};

export const SHOPPING_CATEGORY_LABEL: Record<ShoppingCategory, string> = {
  protein: 'بروتين',
  cannedLegumes: 'بقوليات معلبة',
  vegetables: 'خضار',
  fruit: 'فاكهة',
  carbs: 'نشويات',
  fats: 'دهون صحية',
  pantry: 'تتبيل وأساسيات',
  drinks: 'مشروبات',
};

export const SHOPPING_CATEGORIES = Object.keys(SHOPPING_CATEGORY_LABEL) as ShoppingCategory[];

const SEED_SHOPPING_RAW: Record<ShoppingCategory, string[]> = {
  protein: ['بيض', 'صدور فراخ', 'سمك أو سالمون', 'كفتة أو لحمة قليلة الدهن', 'جبنة قريش', 'تونة بفتاحة سهلة', 'لبن رايب سادة', 'زبادي'],
  cannedLegumes: ['فول معلب', 'فاصوليا بيضا معلبة', 'فاصوليا حمرا معلبة', 'حمص معلب', 'حمص محمّص'],
  vegetables: ['خيار', 'طماطم', 'خس', 'جزر', 'فلفل ألوان', 'كوسة', 'باذنجان', 'بصل وتوم'],
  fruit: ['تفاح', 'موز', 'توت', 'تمر', 'ليمون'],
  carbs: ['شوفان', 'عيش بلدي أو أسمر', 'أرز بسمتي أو بني', 'بطاطا', 'برغل', 'كينوا'],
  fats: ['زيت زيتون', 'لوز', 'عين جمل', 'زبدة فول سوداني', 'طحينة'],
  pantry: ['كمون', 'ملح', 'فلفل أسود', 'صلصة طماطم', 'بهارات مشكلة'],
  drinks: ['حليب', 'علبة حليب طويلة الأجل', 'قهوة', 'شاي', 'أعشاب (نعناع، بابونج، جنزبيل، قرفة، ينسون)', 'مية فوارة'],
};

export const SEED_SHOPPING: ShoppingItem[] = SHOPPING_CATEGORIES.flatMap((category) =>
  SEED_SHOPPING_RAW[category].map((name, i) => ({ id: `seed-${category}-${i}`, category, name, checked: false })),
);
