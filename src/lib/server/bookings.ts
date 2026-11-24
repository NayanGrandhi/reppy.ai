import "server-only";
// Booking through the database's book_slot() function, which checks opening
// hours, days off and who can do which service, and makes double booking
// impossible (an exclusion constraint rejects overlapping appointments, even
// when two requests arrive at the same moment).
import { db } from "./store";

export type BookingFailure =
  | "unknown_service"
  | "staff_cannot_do_service"
  | "closed_day"
  | "staff_off"
  | "outside_hours"
  | "in_the_past"
  | "slot_taken"
  | "not_configured"
  | "error";

export type BookingResult = { ok: true; id: string; startsAt: string; endsAt: string } | { ok: false; reason: BookingFailure; message: string };

/** What to tell the customer (or owner) for each reason a booking can fail. */
export const bookingMessages: Record<BookingFailure, string> = {
  unknown_service: "That service isn't on the list.",
  staff_cannot_do_service: "That person doesn't do this service. Pick someone else.",
  closed_day: "The business is closed that day.",
  staff_off: "That person is off that day.",
  outside_hours: "That time is outside opening hours, or the service would run past closing.",
  in_the_past: "That time has already passed.",
  slot_taken: "Someone just booked that slot. Pick another time.",
  not_configured: "Bookings need the database to be connected.",
  error: "Couldn't book right now. Try again.",
};

export function toBookingResult(raw: unknown): BookingResult {
  const r = (raw ?? {}) as { ok?: boolean; id?: string; starts_at?: string; ends_at?: string; reason?: string };
  if (r.ok && r.id && r.starts_at && r.ends_at) return { ok: true, id: r.id, startsAt: r.starts_at, endsAt: r.ends_at };
  const reason = (r.reason && r.reason in bookingMessages ? r.reason : "error") as BookingFailure;
  return { ok: false, reason, message: bookingMessages[reason] };
}

export async function bookSlot(input: {
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  /** ISO time with offset, e.g. 2026-11-30T12:00:00+05:30 */
  start: string;
  source?: "whatsapp" | "call" | "dashboard" | "web-demo";
  depositINR?: number | null;
}): Promise<BookingResult> {
  const supa = db();
  if (!supa) return { ok: false, reason: "not_configured", message: bookingMessages.not_configured };
  const { data, error } = await supa.rpc("book_slot", {
    p_business: input.businessId,
    p_customer: input.customerId,
    p_service: input.serviceId,
    p_staff: input.staffId,
    p_start: input.start,
    p_source: input.source ?? "dashboard",
    p_deposit_inr: input.depositINR ?? null,
  });
  if (error) {
    console.error("book_slot failed", error);
    return { ok: false, reason: "error", message: bookingMessages.error };
  }
  return toBookingResult(data);
}
