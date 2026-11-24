// Runs the Phase 2 AI conversation tests against the real Claude API.
//   npm run test:ai                 all scenarios
//   npm run test:ai -- trick        only one category (or a scenario id)
// Needs ANTHROPIC_API_KEY (in .env.local or the environment). Uses the sample
// businesses from code, not the database. Costs roughly ₹2–4 per full run.
import fs from "node:fs";
import path from "node:path";
import { demoBrains } from "@/lib/brain/demo";
import type { Brain } from "@/lib/brain/schema";
import { aiConfigured, aiIntro, type ChatHistoryItem, chatTurnStream, MODELS } from "@/lib/server/ai";
import { type Scenario, scenarios } from "./scenarios";

const garage: Brain = {
  name: "Sharma Motors",
  type: "Repair shop",
  description: "Car servicing and repairs in Kothrud, Pune.",
  address: "22 Paud Road, Kothrud, Pune 411038",
  city: "Pune",
  phone: "+91 98230 11122",
  website: "",
  languages: ["English", "Hindi", "Hinglish", "Marathi"],
  hours: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => ({ day: day as Brain["hours"][number]["day"], open: "09:00", close: "19:00", closed: false })).concat([{ day: "Sunday", open: "", close: "", closed: true }]),
  services: [
    { name: "General service", category: "Service", priceINR: 3800, priceNote: "Hatchbacks; sedans from ₹4,500", durationMin: 300, staff: [] },
    { name: "Wheel alignment", category: "Tyres", priceINR: 600, priceNote: "", durationMin: 45, staff: [] },
  ],
  staff: [],
  policies: ["Free pick-up and drop within 5 km"],
  faqs: [],
  bookingRules: { bufferMin: null, depositINR: null, notes: "" },
  customFields: [{ label: "Car model and year" }],
  upiId: "",
};

const brains: Record<Scenario["business"], Brain> = {
  "glow-studio": demoBrains[0].brain,
  "mehta-family-clinic": demoBrains[1].brain,
  "sharma-motors": garage,
};

type Result = { scenario: Scenario; reply: string; passed: string[]; failed: string[]; error?: string; ms: number };

async function runOne(s: Scenario): Promise<Result> {
  const brain = brains[s.business];
  const history: ChatHistoryItem[] = [];
  const t0 = Date.now();
  try {
    let reply = "";
    let last;
    for (const msg of s.messages) {
      const first = !history.some((h) => h.role === "reppy");
      last = await chatTurnStream(brain, history, msg, undefined, () => {});
      reply = (first ? `${aiIntro(brain, msg)} ` : "") + last.reply.trim();
      history.push({ role: "customer", text: msg }, { role: "reppy", text: reply });
    }
    // Grade only the model's own words for the final turn (not our fixed intro line).
    const own = last!.reply.trim();
    const passed: string[] = [];
    const failed: string[] = [];
    for (const c of s.checks) (c.test(last!, own) ? passed : failed).push(c.label);
    return { scenario: s, reply, passed, failed, ms: Date.now() - t0 };
  } catch (e) {
    return { scenario: s, reply: "", passed: [], failed: [], error: e instanceof Error ? e.message : String(e), ms: Date.now() - t0 };
  }
}

async function main() {
  if (!aiConfigured()) {
    console.error("ANTHROPIC_API_KEY is not set. Add it to .env.local, then run: npm run test:ai");
    process.exit(2);
  }
  const filter = process.argv[2];
  const list = filter ? scenarios.filter((s) => s.category === filter || s.id === filter) : scenarios;
  console.log(`Running ${list.length} conversations on ${MODELS.chat}…\n`);

  const results: Result[] = [];
  const queue = [...list];
  const workers = Array.from({ length: 3 }, async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const r = await runOne(s);
      results.push(r);
      const ok = !r.error && r.failed.length === 0;
      console.log(`${ok ? "PASS" : "FAIL"}  ${s.id.padEnd(28)} ${(r.ms / 1000).toFixed(1)}s`);
      if (!ok) {
        if (r.error) console.log(`      error: ${r.error}`);
        for (const f of r.failed) console.log(`      ✗ ${f}`);
        console.log(`      reply: ${r.reply.replace(/\n/g, " ").slice(0, 240)}`);
      }
    }
  });
  await Promise.all(workers);

  const failed = results.filter((r) => r.error || r.failed.length);
  const byCat = new Map<string, { pass: number; total: number }>();
  for (const r of results) {
    const c = byCat.get(r.scenario.category) ?? { pass: 0, total: 0 };
    c.total++;
    if (!r.error && !r.failed.length) c.pass++;
    byCat.set(r.scenario.category, c);
  }
  console.log("\nBy category:");
  for (const [cat, c] of byCat) console.log(`  ${cat.padEnd(10)} ${c.pass}/${c.total}`);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);

  const out = path.join(__dirname, "report.json");
  fs.writeFileSync(
    out,
    JSON.stringify(
      { model: MODELS.chat, ranAt: new Date().toISOString(), passed: results.length - failed.length, total: results.length, results: results.map((r) => ({ id: r.scenario.id, category: r.scenario.category, ok: !r.error && !r.failed.length, failed: r.failed, error: r.error, reply: r.reply })) },
      null,
      2,
    ),
  );
  console.log(`Full report: ${path.relative(process.cwd(), out)}`);
  process.exit(failed.length ? 1 : 0);
}

main();
