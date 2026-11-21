import { useEffect, useState } from 'react';
import type { Settings } from './types.ts';
import { db, useLive } from './db/db.ts';
import { weeksSoFar, todayKey } from './lib/weekly.ts';
import { eatingWindowCloses, targetHours } from './lib/fasting.ts';
import { Onboarding } from './screens/Onboarding.tsx';
import { Today } from './screens/Today.tsx';
import { Meals } from './screens/Meals.tsx';
import { Guides } from './screens/Guides.tsx';
import { Shopping } from './screens/Shopping.tsx';
import { Weekly } from './screens/Weekly.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { PrintWeek } from './screens/PrintWeek.tsx';
import { EmergencyFlow } from './components/EmergencyFlow.tsx';

type Tab = 'today' | 'meals' | 'guides' | 'shopping' | 'week' | 'settings';
const TABS: { id: Exclude<Tab, 'settings'>; label: string; icon: string }[] = [
  { id: 'today', label: 'النهارده', icon: '⏱' },
  { id: 'meals', label: 'الوجبات', icon: '🍽' },
  { id: 'guides', label: 'الدليل', icon: '📖' },
  { id: 'shopping', label: 'المشتريات', icon: '🛒' },
  { id: 'week', label: 'الأسبوع', icon: '📈' },
];
const TITLES: Record<Tab, string> = {
  today: 'صيامي',
  meals: 'مكتبة الوجبات',
  guides: 'المشروبات والأكل برّه',
  shopping: 'قايمة المشتريات',
  week: 'مراجعة الأسبوع',
  settings: 'الإعدادات',
};

function useHash() {
  const [h, setH] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setH(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return h;
}

/** Make sure a review record exists for every week that has started (auto-created every 7 days). */
async function ensureReviews(s: Settings) {
  const weeks = weeksSoFar(s.startDate, todayKey());
  const existing = new Map((await db.reviews.toArray()).map((r) => [r.weekIndex, r]));
  for (const w of weeks) {
    if (existing.has(w)) continue;
    const prev = existing.get(w - 1);
    const rec = { weekIndex: w, weightStart: prev?.weightEnd ?? (w === 0 ? s.currentWeight : undefined), answers: ['', '', ''] as [string, string, string] };
    await db.reviews.put(rec);
    existing.set(w, rec);
  }
}

async function notify(title: string, body: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: 'icon-192.png', lang: 'ar', dir: 'rtl' });
    else new Notification(title, { body });
  } catch {
    /* notifications unavailable */
  }
}

function useReminders(s: Settings | null | undefined) {
  useEffect(() => {
    if (!s?.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
    const tick = async () => {
      const now = Date.now();
      const get = (k: string) => {
        try {
          return localStorage.getItem(k);
        } catch {
          return null;
        }
      };
      const set = (k: string, v: string) => {
        try {
          localStorage.setItem(k, v);
        } catch {
          /* ignore */
        }
      };
      const cur = await db.settings.get('me');
      if (cur?.activeFastStart) {
        const last = Number(get('lastWaterReminder') ?? 0);
        const since = Math.max(last, new Date(cur.activeFastStart).getTime());
        if (now - since >= 2 * 3_600_000) {
          set('lastWaterReminder', String(now));
          notify('اشرب مية 💧', 'كوباية مية دلوقتي بتفرق مع الجوع والصداع.');
        }
        return;
      }
      const today = todayKey();
      const log = await db.dayLogs.get(today);
      if (!cur || !log?.fastEnd) return;
      const closes = eatingWindowCloses(log.fastEnd, targetHours(cur.startDate, today, log.dayType)).getTime();
      const key = `windowReminder-${today}`;
      if (!get(key) && now >= closes - 3_600_000 && now < closes) {
        set(key, '1');
        notify('نافذة الأكل بتقفل بعد ساعة', 'لو هتاكل، خلي الوجبة فيها بروتين ودهون صحية.');
      }
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [s?.notifications]);
}

export default function App() {
  const settings = useLive(async () => (await db.settings.get('me')) ?? null, []);
  const [tab, setTab] = useState<Tab>('today');
  const [sos, setSos] = useState(false);
  const hash = useHash();
  useReminders(settings);

  useEffect(() => {
    if (settings) ensureReviews(settings);
  }, [settings?.startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo(0, 0); // may return a Promise in newer browsers — never return it from the effect
  }, [tab]);

  if (settings === undefined) return null;
  if (settings === null) return <Onboarding />;

  const print = hash.match(/^#print\/(\d+)$/);
  if (print) return <PrintWeek settings={settings} weekIndex={Number(print[1])} />;

  const fasting = !!settings.activeFastStart;

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/95 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur">
        <h1 className="text-xl font-bold text-teal">{TITLES[tab]}</h1>
        <button
          type="button"
          aria-label="الإعدادات"
          onClick={() => setTab(tab === 'settings' ? 'today' : 'settings')}
          className={`min-h-11 min-w-11 rounded-full text-xl ${tab === 'settings' ? 'bg-teal-50' : ''}`}
        >
          ⚙︎
        </button>
      </header>

      <main className={`p-4 ${fasting ? 'pb-44' : 'pb-28'}`}>
        {tab === 'today' && <Today settings={settings} />}
        {tab === 'meals' && <Meals />}
        {tab === 'guides' && <Guides />}
        {tab === 'shopping' && <Shopping />}
        {tab === 'week' && <Weekly settings={settings} />}
        {tab === 'settings' && <SettingsScreen settings={settings} key={settings.currentWeight} />}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto max-w-lg">
          {fasting && (
            <div className="px-4 pb-2">
              <button
                type="button"
                onClick={() => setSos(true)}
                className="min-h-12 w-full rounded-2xl border-2 border-amber bg-amber-50 font-semibold text-amber shadow-sm active:bg-amber-100"
              >
                دايخ أو مصدع؟
              </button>
            </div>
          )}
          <nav className="safe-bottom flex border-t border-line bg-white">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center text-xs ${tab === t.id ? 'font-semibold text-teal' : 'text-muted'}`}
              >
                <span className="text-lg" aria-hidden="true">
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <EmergencyFlow open={sos} onClose={() => setSos(false)} />
    </div>
  );
}
