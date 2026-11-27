import "server-only";
// Where business brains live.
// - With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set: the real database.
// - Without them (local dev, first deploy): an in-memory copy seeded with the
//   sample salon and clinic, so the demo still works. Memory resets on restart.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { demoBrains } from "@/lib/brain/demo";
import { type Brain, type StoredBrain, slugify } from "@/lib/brain/schema";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { cache } from "react";

let client: SupabaseClient | null = null;
export function db(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  client ??= createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
  return client;
}

export const storageMode = () => (db() ? "database" : "memory");

// ───────── memory fallback ─────────
type Mem = { brains: Map<string, StoredBrain>; usage: Map<string, number> };
const g = globalThis as unknown as { __reppyMem?: Mem };
function mem(): Mem {
  if (!g.__reppyMem) {
    g.__reppyMem = { brains: new Map(demoBrains.map((b) => [b.slug, structuredClone(b)])), usage: new Map() };
  }
  return g.__reppyMem;
}

// ───────── mapping between Brain and tables ─────────
type Row = Record<string, unknown>;

/** Everything about a business in one database request (one round trip). */
const FULL_SELECT = "*, staff(*), services(*), opening_hours(*), policies(*), faqs(*)";
const byPosition = (rows: unknown) => ((rows as Row[]) ?? []).sort((a, b) => (a.position as number) - (b.position as number));

function loadFull(biz: Row): StoredBrain {
  const staff = { data: byPosition(biz.staff) };
  const services = { data: byPosition(biz.services) };
  const hours = { data: (biz.opening_hours as Row[]) ?? [] };
  const policies = { data: byPosition(biz.policies) };
  const faqs = { data: byPosition(biz.faqs) };
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const brain: Brain = {
    name: biz.name as string,
    type: biz.type as Brain["type"],
    description: biz.description as string,
    address: biz.address as string,
    city: biz.city as string,
    phone: biz.phone as string,
    website: biz.website as string,
    languages: (biz.languages as string[]) ?? [],
    upiId: biz.upi_id as string,
    bookingRules: {
      bufferMin: (biz.buffer_min as number | null) ?? null,
      depositINR: (biz.deposit_inr as number | null) ?? null,
      notes: biz.booking_notes as string,
    },
    customFields: ((biz.custom_fields as string[]) ?? []).map((label) => ({ label })),
    staff: (staff.data ?? []).map((s: Row) => ({ name: s.name as string, role: s.role as string, offDays: (s.off_days as Brain["staff"][number]["offDays"]) ?? [] })),
    services: (services.data ?? []).map((s: Row) => ({
      name: s.name as string,
      category: s.category as string,
      priceINR: (s.price_inr as number | null) ?? null,
      priceNote: s.price_note as string,
      durationMin: (s.duration_min as number | null) ?? null,
      staff: (s.staff_names as string[]) ?? [],
    })),
    hours: (hours.data ?? [])
      .map((h: Row) => ({ day: h.day as Brain["hours"][number]["day"], open: h.open_time as string, close: h.close_time as string, closed: h.closed as boolean }))
      .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)),
    policies: (policies.data ?? []).map((p: Row) => p.text as string),
    faqs: (faqs.data ?? []).map((f: Row) => ({ q: f.question as string, a: f.answer as string })),
  };
  return { slug: biz.slug as string, brain, isDemo: biz.is_demo as boolean, updatedAt: biz.updated_at as string };
}

async function writeChildren(supa: SupabaseClient, id: string, b: Brain) {
  const tables = ["staff", "services", "opening_hours", "policies", "faqs"] as const;
  for (const t of tables) {
    const { error } = await supa.from(t).delete().eq("business_id", id);
    if (error) throw error;
  }
  const inserts: [string, Row[]][] = [
    ["staff", b.staff.map((s, i) => ({ business_id: id, name: s.name, role: s.role, off_days: s.offDays, position: i }))],
    [
      "services",
      b.services.map((s, i) => ({
        business_id: id,
        name: s.name,
        category: s.category,
        price_inr: s.priceINR,
        price_note: s.priceNote,
        duration_min: s.durationMin,
        staff_names: s.staff,
        position: i,
      })),
    ],
    ["opening_hours", b.hours.map((h) => ({ business_id: id, day: h.day, open_time: h.open, close_time: h.close, closed: h.closed }))],
    ["policies", b.policies.map((p, i) => ({ business_id: id, text: p, position: i }))],
    ["faqs", b.faqs.map((f, i) => ({ business_id: id, question: f.q, answer: f.a, position: i }))],
  ];
  for (const [t, rows] of inserts) {
    if (rows.length === 0) continue;
    const { error } = await supa.from(t).insert(rows);
    if (error) throw error;
  }
}

function bizRow(b: Brain) {
  return {
    name: b.name,
    type: b.type,
    description: b.description,
    address: b.address,
    city: b.city,
    phone: b.phone,
    website: b.website,
    upi_id: b.upiId,
    languages: b.languages,
    buffer_min: b.bookingRules.bufferMin,
    deposit_inr: b.bookingRules.depositINR,
    booking_notes: b.bookingRules.notes,
    custom_fields: b.customFields.map((c) => c.label),
    updated_at: new Date().toISOString(),
  };
}

// ───────── public API ─────────
/** Sample businesses only. Businesses people set up stay private: they open only by their link. */
export async function listDemoBrains(): Promise<StoredBrain[]> {
  const supa = db();
  if (!supa) return [...mem().brains.values()].filter((b) => b.isDemo);
  const { data, error } = await supa.from("businesses").select("slug, name, type, is_demo, updated_at").eq("is_demo", true).order("name").limit(20);
  if (error) throw error;
  // Lightweight list: only what the picker needs.
  return (data ?? []).map((r: Row) => ({
    slug: r.slug as string,
    isDemo: r.is_demo as boolean,
    updatedAt: r.updated_at as string,
    brain: { ...emptyListBrain(), name: r.name as string, type: r.type as Brain["type"] },
  }));
}

function emptyListBrain(): Brain {
  return { name: "", type: "Other", description: "", address: "", city: "", phone: "", website: "", languages: [], hours: [], services: [], staff: [], policies: [], faqs: [], bookingRules: { bufferMin: null, depositINR: null, notes: "" }, customFields: [], upiId: "" };
}

// cache(): the chat page and its title both ask for the same business in one
// page view; this makes it a single database request.
export const getBrain = cache(async (slug: string): Promise<StoredBrain | null> => {
  const supa = db();
  if (!supa) return mem().brains.get(slug) ?? null;
  const { data, error } = await supa.from("businesses").select(FULL_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? loadFull(data) : null;
});

async function uniqueSlug(name: string, exists: (s: string) => Promise<boolean>) {
  // A random tail makes private links hard to guess.
  const tail = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");
  const base = `${slugify(name)}-${tail}`;
  let slug = base;
  for (let i = 2; await exists(slug); i++) slug = `${base}-${i}`;
  return slug;
}

/** Create a new business brain. Demo businesses can't be overwritten from the web. */
export async function createBrain(
  brain: Brain,
  sources: { kind: "website" | "image" | "pdf" | "text"; label: string }[],
  ownerId?: string,
): Promise<string> {
  const supa = db();
  if (!supa) {
    const m = mem();
    const slug = await uniqueSlug(brain.name, async (s) => m.brains.has(s));
    m.brains.set(slug, { slug, brain, isDemo: false, updatedAt: new Date().toISOString() });
    return slug;
  }
  const slug = await uniqueSlug(brain.name, async (s) => {
    const { data } = await supa.from("businesses").select("id").eq("slug", s).maybeSingle();
    return Boolean(data);
  });
  const { data, error } = await supa.from("businesses").insert({ slug, ...bizRow(brain), ...(ownerId ? { owner_id: ownerId } : {}) }).select("id").single();
  if (error) throw error;
  await writeChildren(supa, data.id, brain);
  if (sources.length) await supa.from("sources").insert(sources.map((s) => ({ business_id: data.id, kind: s.kind, label: s.label.slice(0, 200) })));
  return slug;
}

/** Used by the seed script only. */
export async function upsertDemo(stored: StoredBrain) {
  const supa = db();
  if (!supa) throw new Error("Database not configured");
  const { data, error } = await supa.from("businesses").upsert({ slug: stored.slug, is_demo: true, ...bizRow(stored.brain) }, { onConflict: "slug" }).select("id").single();
  if (error) throw error;
  await writeChildren(supa, data.id, stored.brain);
}

/** Learns from gaps: save the owner's answer as an FAQ. */
export async function addLearnedFaq(slug: string, q: string, a: string) {
  const supa = db();
  if (!supa) {
    const b = mem().brains.get(slug);
    if (b) b.brain.faqs.push({ q, a });
    return;
  }
  const { data } = await supa.from("businesses").select("id").eq("slug", slug).single();
  if (!data) return;
  await supa.from("faqs").insert({ business_id: data.id, question: q, answer: a, learned: true, position: 999 });
  await supa.from("knowledge_gaps").update({ status: "answered", answer: a }).eq("business_id", data.id).eq("question", q).eq("status", "waiting");
}

export async function recordGap(slug: string, question: string) {
  const supa = db();
  if (!supa) return;
  const { data } = await supa.from("businesses").select("id").eq("slug", slug).single();
  if (data) await supa.from("knowledge_gaps").insert({ business_id: data.id, question });
}

/** Increments today's counter and returns the new value. */
export async function bumpUsage(slug: string, kind: "message" | "extraction"): Promise<number> {
  const supa = db();
  if (!supa) {
    const key = `${slug}:${kind}:${new Date().toISOString().slice(0, 10)}`;
    const n = (mem().usage.get(key) ?? 0) + 1;
    mem().usage.set(key, n);
    return n;
  }
  const { data: biz } = await supa.from("businesses").select("id").eq("slug", slug).single();
  if (!biz) return 0;
  const { data, error } = await supa.rpc("bump_usage", { p_business: biz.id, p_kind: kind });
  if (error) throw error;
  return data as number;
}

export const REDACTED = "[not stored: clinic conversation]";

/**
 * Saves a chat exchange. For clinics only intent and language are kept, never
 * the words, so no health details end up in the database.
 */
export async function logExchange(
  slug: string,
  sessionId: string | null,
  rows: { role: "customer" | "reppy" | "owner"; text: string; intent?: string; language?: string }[],
  opts: { redact?: boolean } = {},
): Promise<string | null> {
  const supa = db();
  if (!supa) return sessionId;
  if (opts.redact) rows = rows.map((r) => ({ ...r, text: REDACTED }));
  const { data: biz } = await supa.from("businesses").select("id").eq("slug", slug).single();
  if (!biz) return sessionId;
  let sid = sessionId;
  if (!sid) {
    const { data } = await supa.from("chat_sessions").insert({ business_id: biz.id }).select("id").single();
    sid = data?.id ?? null;
  }
  if (sid) await supa.from("chat_messages").insert(rows.map((r) => ({ session_id: sid, business_id: biz.id, role: r.role, text: r.text, intent: r.intent ?? null, language: r.language ?? null })));
  return sid;
}

/** App-wide count of setups today (all visitors together). */
export async function bumpAppExtractions(): Promise<number> {
  const supa = db();
  if (!supa) {
    const key = `app:extractions:${new Date().toISOString().slice(0, 10)}`;
    const n = (mem().usage.get(key) ?? 0) + 1;
    mem().usage.set(key, n);
    return n;
  }
  const { data, error } = await supa.rpc("bump_app_extractions");
  if (error) throw error;
  return data as number;
}
