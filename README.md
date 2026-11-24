# Reppy AI — website and owner dashboard (frontend)

The marketing site, owner dashboard and (Phase 1) the business brain builder + customer chat demo
for Reppy, an AI receptionist for WhatsApp and phone calls.

- `/setup`: upload photos, PDFs, a website link or notes; Reppy builds a business brain you review and save.
- `/chat`: talk to Reppy as a customer of a sample salon, a sample clinic, or any business you set up.
- The dashboard still runs on sample data (it moves to the database in Phase 5).

No WhatsApp messages are sent and no calls are placed yet.

## Run it on your computer

You need Node.js 20 or newer (download the "LTS" version from nodejs.org).

```bash
npm install      # one time, downloads the building blocks
npm run dev      # starts the site
```

Then open http://localhost:3000 in your browser.

- `/`: landing page with the interactive demo
- `/dashboard`: owner dashboard (Overview, Conversations, Appointments, Customers, AI Receptionist, Analytics, Knowledge Base, Settings)

## Phase 1 setup (keys)

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it | What it turns on |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys | Reading uploads and AI chat replies |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API | Saving businesses permanently |
| `SETUP_ACCESS_CODE` (optional) | Make one up | Stops strangers using your AI credit on /setup |

Without the Supabase keys the app still works, but saved businesses live in memory and disappear on restart.

**Database:** the live project is `reppy` (Mumbai, `https://sqggxhfetsqdmjkwgagy.supabase.co`). Its tables come from `supabase/migrations/0001_init.sql` and the sample businesses from `supabase/seed.sql` (or `npm run seed`).

**Privacy:** businesses you set up get an unguessable link and aren't listed publicly. Clinic chats store
only intent and language, never the words. All demo chats are deleted after 30 days (a nightly
Supabase cron job, `purge_old_chats`). Reppy's first reply always starts with an "I'm an AI assistant"
line added by the server (`aiIntro()` in `src/lib/server/ai.ts`).

**Costs:** setup uses Claude Sonnet 5.5, chat uses Claude Haiku 5.5. Set a monthly spend limit in the Claude Console.
Built-in caps: 200 AI replies per business per day, 30 setups per day, 800-character messages, 4 MB uploads.

## Tests

```bash
npm test            # 89 quick checks, no keys needed (also run by GitHub on every push)
npm run test:ai     # 35 real conversations graded against the safety rules (needs ANTHROPIC_API_KEY, costs a few rupees)
npm run test:ai -- trick   # just one category: salon, clinic, generic, hinglish, hindi, trick, safety, gaps
```

Add a conversation test in `tests/ai/scenarios.ts`. Re-run `npm run test:ai` before every release.

## How the code is organised

```
src/
  app/                    pages (one folder per URL)
    page.tsx              landing page
    setup/                business brain builder (upload → review → save)
    chat/                 customer chat demo
    api/                  server routes: brain/extract, brain, brain/answer, chat, status
    dashboard/            owner dashboard pages
  components/
    marketing/            hero, voice orb, interactive demo, landing sections
    dashboard/            sidebar + top bar shell, shared status badges
    charts/               small hand-made SVG charts (no chart library)
    ui/                   buttons, inputs, toggles, modal, drawer, toasts
  lib/
    brain/                business brain schema, industry templates, sample salon + clinic
    server/               Claude API calls, database store, bookings, website reader, cost limits
    upi.ts                UPI payment links and QR codes (deposits, no gateway)
    whatsapp/templates.ts WhatsApp message templates, checked against Meta's rules
    types.ts              shape of every record (Business, Customer, Appointment…)
    services.ts           the ONLY place pages get data from
    mock/data.ts          sample data for "Glow Studio", a Mumbai salon
    demo-scripts.ts       the scripted conversations used by the landing demo
supabase/migrations/      database tables + row-level security (0003 = bookings with a no-double-booking guard)
tests/unit/               quick checks (Vitest)
tests/ai/                 AI conversation tests and runner
scripts/seed.ts           loads the sample businesses into Supabase
```

**Safety rules** for the AI live in `buildChatSystem()` in `src/lib/server/ai.ts`; industry-specific
rules (for example "no medical advice" for clinics) live in `src/lib/brain/templates.ts`.

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
