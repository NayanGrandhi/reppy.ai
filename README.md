# Reppy AI — website and owner dashboard (frontend)

The marketing site and the owner dashboard for Reppy, an AI receptionist for WhatsApp and phone calls.
Everything runs on **sample data** for now: no WhatsApp messages are sent, no calls are placed and nothing costs money.

## Run it on your computer

You need Node.js 20 or newer (download the "LTS" version from nodejs.org).

```bash
npm install      # one time, downloads the building blocks
npm run dev      # starts the site
```

Then open http://localhost:3000 in your browser.

- `/`: landing page with the interactive demo
- `/dashboard`: owner dashboard (Overview, Conversations, Appointments, Customers, AI Receptionist, Analytics, Knowledge Base, Settings)

To make a static copy you can host anywhere: `STATIC_EXPORT=1 npm run build`. The files end up in `out/`.

## How the code is organised

```
src/
  app/                    pages (one folder per URL)
    page.tsx              landing page
    dashboard/            owner dashboard pages
  components/
    marketing/            hero, voice orb, interactive demo, landing sections
    dashboard/            sidebar + top bar shell, shared status badges
    charts/               small hand-made SVG charts (no chart library)
    ui/                   buttons, inputs, toggles, modal, drawer, toasts
  lib/
    types.ts              shape of every record (Business, Customer, Appointment…)
    services.ts           the ONLY place pages get data from
    mock/data.ts          sample data for "Glow Studio", a Mumbai salon
    demo-scripts.ts       the scripted conversations used by the landing demo
```

**Adding the real backend later:** pages never read `mock/data.ts` directly. They call functions in
`lib/services.ts`. When Supabase is added (Phase 3+), only those function bodies change. Every record
already carries a `businessId`, so row-level security can keep businesses apart.

`freeSlots()` in `services.ts` already handles opening hours, staff days off, service length, buffer
time and existing bookings. The real version has to repeat this check inside a database transaction,
so two customers can't grab the same slot at the same moment.

## Design system

Defined once, in `src/app/globals.css`:

- Colours: deep indigo ink surfaces, violet `#8B7BFF` as the main accent, saffron `#E8934A` used sparingly, teal `#25A08D` for WhatsApp and good news.
- Chart colours (`--color-series-1..4`) are checked to stay readable for colour-blind users on the dark background.
- Type: Instrument Serif for headlines, Hanken Grotesk for everything else, Tiro Devanagari Hindi for Hindi text. All fonts are bundled, nothing loads from Google.
- Motion respects the "reduce motion" setting on the visitor's device.

## Placeholders to decide on

- Pricing (₹999 / ₹2,499 / ₹5,999 a month) and the 14-day trial are placeholders.
- `hello@reppy.ai` and the Glow Studio / Mehta Clinic businesses are made up.
- Voice previews use the browser's built-in speech. Real voices come in Phase 7.
