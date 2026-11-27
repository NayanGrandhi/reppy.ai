import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { sampleDashboard } from "@/lib/dashboard/sample";
import type { DashboardData } from "@/lib/dashboard/types";
import type { DailyVolume } from "@/lib/mock/data";
import type { Appointment, Business, Conversation, Customer, Intent, KnowledgeGap, Language, Service, Staff } from "@/lib/types";

// Loads the signed-in owner's real business for the dashboard.
// Runs with the owner's own session, so row-level security decides what is
// visible: a bug here can't show one business another business's data.

type Row = Record<string, unknown>;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** A timestamp as India-time "YYYY-MM-DDTHH:MM:00" (what the dashboard uses). */
export function toIst(ts: string): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(ts));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:00`;
}
export const istToday = () => toIst(new Date().toISOString()).slice(0, 10);

function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const asLanguage = (v: unknown): Language => (v === "Hindi" || v === "Hinglish" ? v : "English");
const asIntent = (v: unknown): Intent =>
  (["Book appointment", "Reschedule", "Cancel", "Price enquiry", "Timings & location", "Service question", "Complaint", "Emergency"] as const).includes(v as never) ? (v as Intent) : "Other";

export async function ownedBusinessId(supa: SupabaseClient): Promise<string | null> {
  const { data } = await supa.from("businesses").select("id").order("created_at").limit(1).maybeSingle();
  return (data?.id as string) ?? null;
}

export async function loadLiveDashboard(supa: SupabaseClient, user: User): Promise<DashboardData | null> {
  const { data: biz } = await supa.from("businesses").select("*").order("created_at").limit(1).maybeSingle();
  if (!biz) return null;
  const id = biz.id as string;
  const today = istToday();
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [staffQ, servicesQ, hoursQ, policiesQ, faqsQ, customersQ, apptsQ, gapsQ, sessionsQ, usageQ] = await Promise.all([
    supa.from("staff").select("*").eq("business_id", id).order("position"),
    supa.from("services").select("*").eq("business_id", id).order("position"),
    supa.from("opening_hours").select("*").eq("business_id", id),
    supa.from("policies").select("*").eq("business_id", id).order("position"),
    supa.from("faqs").select("*").eq("business_id", id).order("position"),
    supa.from("customers").select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(500),
    supa.from("appointments").select("*").eq("business_id", id).gte("starts_at", new Date(Date.now() - 90 * 86400_000).toISOString()).order("starts_at").limit(1000),
    supa.from("knowledge_gaps").select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(100),
    supa.from("chat_sessions").select("id, channel, created_at, chat_messages(role, text, intent, language, created_at)").eq("business_id", id).gte("created_at", since).order("created_at", { ascending: false }).limit(100),
    supa.from("usage_daily").select("messages").eq("business_id", id).eq("day", today).maybeSingle(),
  ]);

  const staff: Staff[] = (staffQ.data ?? []).map((s: Row) => ({
    id: s.id as string,
    businessId: id,
    name: s.name as string,
    role: (s.role as string) || "",
    offDays: ((s.off_days as string[]) ?? []).map((d) => DAYS.indexOf(d)).filter((n) => n >= 0),
  }));
  const idByName = new Map(staff.map((s) => [s.name, s.id]));
  const services: Service[] = (servicesQ.data ?? []).map((s: Row) => {
    const names = (s.staff_names as string[]) ?? [];
    const ids = names.map((n) => idByName.get(n)).filter((x): x is string => Boolean(x));
    return {
      id: s.id as string,
      businessId: id,
      name: s.name as string,
      category: (s.category as string) || "Other",
      priceINR: (s.price_inr as number | null) ?? 0,
      durationMin: (s.duration_min as number | null) ?? 30,
      staffIds: ids.length ? ids : staff.map((x) => x.id),
    };
  });
  const hoursByDay = new Map((hoursQ.data ?? []).map((h: Row) => [h.day as string, h]));
  const business: Business = {
    id,
    name: biz.name as string,
    type: biz.type as Business["type"],
    owner: (user.user_metadata?.full_name as string) || (user.email ?? "").split("@")[0],
    city: (biz.city as string) || "",
    address: (biz.address as string) || "",
    phone: (biz.phone as string) || "",
    upiId: (biz.upi_id as string) || "",
    languages: ((biz.languages as string[]) ?? []).map(asLanguage),
    bufferMin: (biz.buffer_min as number | null) ?? 0,
    hours: WEEK.map((day) => {
      const h = hoursByDay.get(day);
      return h
        ? { day, open: (h.open_time as string) || "", close: (h.close_time as string) || "", closed: Boolean(h.closed) || !h.open_time }
        : { day, open: "", close: "", closed: true };
    }),
    policies: (policiesQ.data ?? []).map((p: Row) => p.text as string),
  };

  const appointments: Appointment[] = (apptsQ.data ?? []).map((a: Row) => ({
    id: a.id as string,
    businessId: id,
    customerId: a.customer_id as string,
    serviceId: a.service_id as string,
    staffId: a.staff_id as string,
    start: toIst(a.starts_at as string),
    status: a.status as Appointment["status"],
    source: a.source === "call" ? "call" : a.source === "dashboard" ? "dashboard" : "whatsapp",
    depositINR: (a.deposit_inr as number | null) ?? undefined,
    depositPaid: Boolean(a.deposit_paid),
  }));
  const price = new Map(services.map((s) => [s.id, s.priceINR]));
  const customers: Customer[] = (customersQ.data ?? []).map((c: Row) => {
    const done = appointments.filter((a) => a.customerId === c.id && a.status === "completed");
    return {
      id: c.id as string,
      businessId: id,
      name: (c.name as string) || "Customer",
      phone: c.phone as string,
      language: asLanguage(c.language),
      firstSeen: toIst(c.created_at as string),
      visits: done.length,
      spendINR: done.reduce((s, a) => s + (price.get(a.serviceId) ?? 0), 0),
      tags: [],
      notes: (c.notes as string) || "",
      optedIn: Boolean(c.opted_in),
    };
  });

  const knowledgeGaps: KnowledgeGap[] = (gapsQ.data ?? []).map((g: Row) => ({
    id: g.id as string,
    businessId: id,
    question: g.question as string,
    askedBy: "A customer",
    askedAt: toIst(g.created_at as string),
    status: g.status === "answered" ? "answered" : "waiting",
    answer: (g.answer as string) || undefined,
    timesAsked: 1,
  }));

  const conversations: Conversation[] = (sessionsQ.data ?? [])
    .map((s: Row): Conversation | null => {
      const msgs = ((s.chat_messages as Row[]) ?? []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      if (!msgs.length) return null;
      const firstCustomer = msgs.find((m) => m.role === "customer");
      const lastCustomer = [...msgs].reverse().find((m) => m.role === "customer");
      const t0 = new Date(msgs[0].created_at as string).getTime();
      const t1 = new Date(msgs[msgs.length - 1].created_at as string).getTime();
      const intent = asIntent(lastCustomer?.intent);
      return {
        id: s.id as string,
        businessId: id,
        customerId: `visitor_${s.id}`,
        channel: "whatsapp",
        startedAt: toIst(s.created_at as string),
        durationSec: Math.max(0, Math.round((t1 - t0) / 1000)),
        status: intent === "Emergency" || intent === "Complaint" ? "handoff" : "answered",
        intent,
        language: asLanguage(lastCustomer?.language),
        sentiment: intent === "Complaint" ? "negative" : "neutral",
        summary: String(firstCustomer?.text ?? "Chat").slice(0, 140),
        messages: msgs.map((m) => ({ from: m.role as "customer" | "reppy" | "owner", text: m.text as string, at: toIst(m.created_at as string) })),
      };
    })
    .filter((c): c is Conversation => c !== null);

  // Charts: last 30 days, from real chats and bookings.
  const dailyVolume: DailyVolume[] = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(today, i - 29);
    return {
      date,
      whatsapp: conversations.filter((c) => c.startedAt.startsWith(date)).length,
      calls: 0,
      bookings: (apptsQ.data ?? []).filter((a: Row) => toIst(a.created_at as string).startsWith(date)).length,
      missedRecovered: 0,
    };
  });
  const peakHours = WEEK.map(() => Array.from({ length: 13 }, () => 0));
  for (const c of conversations) {
    const d = new Date(`${c.startedAt.slice(0, 10)}T12:00:00Z`).getUTCDay();
    const h = Number(c.startedAt.slice(11, 13));
    if (h >= 9 && h <= 21) peakHours[(d + 6) % 7][h - 9]++;
  }
  const intentCount = new Map<string, number>();
  for (const c of conversations) for (const m of c.messages) if (m.from === "customer") intentCount.set(c.intent, (intentCount.get(c.intent) ?? 0) + 1);
  const topQuestions = [
    ...[...intentCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([q, count]) => ({ q, count })),
    ...knowledgeGaps.filter((g) => g.status === "waiting").slice(0, 2).map((g) => ({ q: g.question, count: g.timesAsked, unanswered: true })),
  ];

  const sample = sampleDashboard();
  return {
    mode: "live",
    today,
    slug: biz.slug as string,
    business,
    staff,
    services,
    customers,
    conversations,
    appointments,
    knowledgeGaps,
    changeLog: [],
    faqs: (faqsQ.data ?? []).map((f: Row) => ({ id: f.id as string, q: f.question as string, a: f.answer as string })),
    receptionist: {
      ...sample.receptionist,
      greeting: `Hi, thanks for reaching ${business.name}! I'm Reppy, the AI assistant. How can I help you today?`,
      languages: business.languages.length ? business.languages : sample.receptionist.languages,
      instructions: (biz.booking_notes as string) || "",
    },
    dailyVolume,
    peakHours,
    topQuestions,
    usage: { repliesToday: (usageQ.data?.messages as number) ?? 0, dailyCap: (biz.daily_message_cap as number) ?? 200 },
  };
}
