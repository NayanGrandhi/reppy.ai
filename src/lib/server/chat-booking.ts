import "server-only";
// Turns a confirmed booking from the chat into a real appointment.
//
// The AI never decides whether a slot is free: it only hands over what the
// customer asked for. This code checks the live calendar with the database's
// own rules (book_slot / check_slot) and writes the confirmation, or offers
// free times instead. Sample businesses use check_slot, which saves nothing,
// so public demo chats never fill a real calendar.
import { freeSlots } from "@/lib/dashboard/slots";
import type { Business, Service, Staff } from "@/lib/types";
import { buildUpiLink, isValidUpiId } from "@/lib/upi";
import type { BookingRequest } from "./ai";
import { type BookingFailure, bookingMessages, toBookingResult } from "./bookings";
import { toIst } from "./dashboard";
import { db } from "./store";

type Lang = "English" | "Hindi" | "Hinglish" | "Other";
type Row = Record<string, unknown>;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type ChatBookingResult = {
  ok: boolean;
  /** Added after the AI's own line, in the customer's language. */
  text: string;
  appointmentId?: string;
  demo: boolean;
};

/** 98200 12345 / +91 98200 12345 / 919820012345 → +919820012345. Null if not a valid Indian mobile. */
export function normaliseIndianMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

const when = (date: string, time: string) => {
  const d = new Date(`${date}T${time}:00+05:30`);
  const day = d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });
  return { day, time: fmtTime(time) };
};
const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

/** Short system lines in the customer's language. */
export const say = {
  booked: (l: Lang, svc: string, who: string, day: string, time: string) =>
    l === "Hindi"
      ? `✅ बुकिंग पक्की: ${svc}, ${who} के साथ, ${day} को ${time}।`
      : l === "Hinglish"
        ? `✅ Booking pakki: ${svc}, ${who} ke saath, ${day} ko ${time}.`
        : `✅ Booked: ${svc} with ${who}, ${day} at ${time}.`,
  demoBooked: (l: Lang, svc: string, who: string, day: string, time: string) =>
    `${say.booked(l, svc, who, day, time)} ${l === "English" || l === "Other" ? "(Sample business, so nothing was actually saved.)" : "(Sample business hai, isliye kuch save nahi hua.)"}`,
  deposit: (l: Lang, amount: number, link: string) =>
    l === "English" || l === "Other"
      ? `To hold the slot, please pay the ₹${amount} deposit by UPI: ${link}`
      : `Slot hold karne ke liye ₹${amount} deposit UPI se bhejiye: ${link}`,
  notFree: (l: Lang, reason: string, day: string, times: string[]) => {
    const list = times.join(", ");
    if (l === "English" || l === "Other") return times.length ? `That time isn't available (${reason}). Free times on ${day}: ${list}. Which one works?` : `That time isn't available (${reason}), and ${day} is full. Shall I check another day?`;
    return times.length ? `Yeh time available nahi hai (${reason}). ${day} ko free times: ${list}. Kaunsa chalega?` : `Yeh time available nahi hai (${reason}), aur ${day} full hai. Koi aur din dekhein?`;
  },
  needPhone: (l: Lang) =>
    l === "English" || l === "Other" ? "Please share a 10-digit mobile number so we can send the confirmation." : "Confirmation bhejne ke liye apna 10-digit mobile number bhejiye.",
  unknownService: (l: Lang) =>
    l === "English" || l === "Other" ? "I couldn't match that service. Which service from our list would you like?" : "Woh service list mein nahi mili. Hamari list mein se kaunsi service chahiye?",
  failed: (l: Lang) => (l === "English" || l === "Other" ? "I couldn't book that just now. The team will confirm on WhatsApp shortly." : "Abhi booking nahi ho payi. Team jaldi WhatsApp par confirm karegi."),
};

const reasonShort: Record<BookingFailure, string> = {
  ...bookingMessages,
  closed_day: "closed that day",
  staff_off: "they're off that day",
  outside_hours: "outside opening hours",
  in_the_past: "that time has passed",
  slot_taken: "already booked",
  staff_cannot_do_service: "they don't do this service",
};

export async function bookFromChat(slug: string, isDemo: boolean, req: BookingRequest, lang: Lang): Promise<ChatBookingResult | null> {
  const supa = db();
  if (!supa) return null; // no database: the AI's own words stand ("the team will confirm")
  const { data: biz } = await supa
    .from("businesses")
    .select("id, name, upi_id, buffer_min, deposit_inr, receptionist, staff(id, name, off_days, position), services(id, name, duration_min, price_inr, staff_names), opening_hours(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (!biz) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.date) || !/^\d{2}:\d{2}$/.test(req.time)) return { ok: false, demo: isDemo, text: say.failed(lang) };
  const phone = normaliseIndianMobile(req.customerPhone);
  if (!phone) return { ok: false, demo: isDemo, text: say.needPhone(lang) };

  const services = (biz.services as Row[]) ?? [];
  const wanted = req.service.trim().toLowerCase();
  const svc =
    services.find((s) => String(s.name).toLowerCase() === wanted) ??
    services.find((s) => String(s.name).toLowerCase().includes(wanted) || (wanted.length > 3 && wanted.includes(String(s.name).toLowerCase())));
  if (!svc || !wanted) return { ok: false, demo: isDemo, text: say.unknownService(lang) };

  const staffRows = ((biz.staff as Row[]) ?? []).sort((a, b) => (a.position as number) - (b.position as number));
  const allowed = (svc.staff_names as string[]) ?? [];
  const able = staffRows.filter((s) => !allowed.length || allowed.includes(s.name as string));
  const asked = req.staff.trim().toLowerCase();
  const askedRow = asked ? staffRows.find((s) => String(s.name).toLowerCase() === asked || String(s.name).toLowerCase().startsWith(asked)) : undefined;
  const candidates = askedRow ? [askedRow] : able;
  if (!candidates.length) return { ok: false, demo: isDemo, text: say.failed(lang) };

  const start = `${req.date}T${req.time}:00+05:30`;
  const { day, time } = when(req.date, req.time);

  // Deposit: the business's rule says it applies (AI judged from the rule), or
  // "first-time customers pay a deposit" is on and this phone hasn't booked before.
  const depositINR = (biz.deposit_inr as number | null) ?? 0;
  const upi = (biz.upi_id as string) || "";
  let needsDeposit = req.depositApplies && depositINR > 0 && isValidUpiId(upi);
  const settings = (biz.receptionist as Row) ?? {};
  if (!needsDeposit && settings.depositForNewCustomers && depositINR > 0 && isValidUpiId(upi) && !isDemo) {
    const { data: existing } = await supa.from("customers").select("id").eq("business_id", biz.id).eq("phone", phone).maybeSingle();
    needsDeposit = !existing;
  }

  let lastReason: BookingFailure = "slot_taken";
  if (isDemo) {
    for (const st of candidates) {
      const { data } = await supa.rpc("check_slot", { p_business: biz.id, p_service: svc.id, p_staff: st.id, p_start: start });
      const r = data as { ok?: boolean; reason?: BookingFailure } | null;
      if (r?.ok) return { ok: true, demo: true, text: say.demoBooked(lang, svc.name as string, st.name as string, day, time) };
      lastReason = r?.reason ?? "error";
      if (lastReason !== "slot_taken" && lastReason !== "staff_off") break;
    }
  } else {
    const { data: cust, error } = await supa
      .from("customers")
      .upsert({ business_id: biz.id, phone, name: req.customerName.trim().slice(0, 80) || "Customer" }, { onConflict: "business_id,phone" })
      .select("id")
      .single();
    if (error || !cust) return { ok: false, demo: false, text: say.failed(lang) };
    for (const st of candidates) {
      const { data } = await supa.rpc("book_slot", {
        p_business: biz.id,
        p_customer: cust.id,
        p_service: svc.id,
        p_staff: st.id,
        p_start: start,
        p_source: "web-demo",
        p_deposit_inr: needsDeposit ? depositINR : null,
      });
      const r = toBookingResult(data);
      if (r.ok) {
        let text = say.booked(lang, svc.name as string, st.name as string, day, time);
        if (needsDeposit) {
          const link = buildUpiLink({ upiId: upi, payeeName: biz.name as string, amountINR: depositINR, note: `Deposit ${svc.name} ${day}`, ref: r.id.slice(0, 12) });
          text += `\n${say.deposit(lang, depositINR, link)}`;
        }
        return { ok: true, demo: false, appointmentId: r.id, text };
      }
      lastReason = r.reason;
      if (lastReason !== "slot_taken" && lastReason !== "staff_off") break;
    }
  }

  // Not possible: offer free times that day.
  const times = await freeTimes(supa, biz as Row, svc, candidates, req.date);
  return { ok: false, demo: isDemo, text: say.notFree(lang, reasonShort[lastReason] ?? "not available", day, times.slice(0, 4).map(fmtTime)) };
}

async function freeTimes(supa: NonNullable<ReturnType<typeof db>>, biz: Row, svc: Row, candidates: Row[], date: string): Promise<string[]> {
  const hoursByDay = new Map(((biz.opening_hours as Row[]) ?? []).map((h) => [h.day as string, h]));
  const business = {
    hours: WEEK.map((day) => {
      const h = hoursByDay.get(day);
      return { day, open: (h?.open_time as string) || "", close: (h?.close_time as string) || "", closed: !h || Boolean(h.closed) || !h.open_time };
    }),
    bufferMin: (biz.buffer_min as number | null) ?? 0,
  } as Business;
  const staff: Staff[] = candidates.map((s) => ({
    id: s.id as string,
    businessId: "",
    name: s.name as string,
    role: "",
    offDays: ((s.off_days as string[]) ?? []).map((d) => DAYS.indexOf(d)).filter((n) => n >= 0),
  }));
  const service: Service = { id: svc.id as string, businessId: "", name: svc.name as string, category: "", priceINR: 0, durationMin: (svc.duration_min as number) ?? 30, staffIds: staff.map((s) => s.id) };
  const from = new Date(`${date}T00:00:00+05:30`).toISOString();
  const to = new Date(`${date}T23:59:59+05:30`).toISOString();
  const { data } = await supa.from("appointments").select("staff_id, service_id, starts_at, ends_at, status").eq("business_id", biz.id).gte("starts_at", from).lte("starts_at", to);
  // Existing bookings as 'service' blocks of their real length.
  const blocks: Service[] = [];
  const existing = (data ?? []).map((a: Row, i) => {
    const mins = Math.round((new Date(a.ends_at as string).getTime() - new Date(a.starts_at as string).getTime()) / 60000) - business.bufferMin;
    blocks.push({ ...service, id: `blk_${i}`, durationMin: Math.max(mins, 5) });
    return { id: `a${i}`, businessId: "", customerId: "", serviceId: `blk_${i}`, staffId: a.staff_id as string, start: toIst(a.starts_at as string), status: a.status as "confirmed", source: "whatsapp" as const };
  });
  const now = toIst(new Date().toISOString()).slice(0, 16);
  const all = new Set<string>();
  for (const st of staff) for (const t of freeSlots({ business, staff, services: [service, ...blocks] }, date, service, st.id, existing, 30, now)) all.add(t);
  return [...all].sort();
}
