# صيامي — Fasting & Diet Tracker

Personal intermittent-fasting PWA. React + Vite + TypeScript, Tailwind, Dexie (IndexedDB), Recharts, vite-plugin-pwa.
No backend: all data stays on the device. Back up from ⚙︎ → نسخة احتياطية.

```bash
npm install
npm test          # unit tests (node:test, no extra test library)
npm run dev       # dev server
npm run build && npm run preview   # production build with service worker
```

## Install on iPhone
Host `dist/` on any HTTPS static host (or open the preview URL from the phone on the same Wi-Fi —
note iOS only registers service workers over HTTPS or localhost). In Safari: Share → Add to Home Screen.

## Layout
- `src/lib/fasting.ts` — plan weeks, targets per day type, midnight-safe hour math (tested)
- `src/lib/weekly.ts`, `src/lib/backup.ts` — weekly stats, JSON backup, CSV (tested)
- `src/db/` — Dexie schema, seed on first run, actions (start/break fast, emergencies)
- `src/data/` — seed meals, shopping list, guides copy
- `src/screens/` — Today, Meals, Guides, Shopping, Weekly, Settings, PrintWeek (`#print/<week>`)

## Rules baked in
- Plan: week 1 12:12 → week 2 14:10 → 16:8 after. Nothing longer.
- ط long operating day: max 12h. ن after on-call: 12h, flexible.
- A finished fast is logged on the day it was broken.
- Wording: "حليب" / "لبن رايب", never bare "لبن". No Greek yogurt, no lentils.
