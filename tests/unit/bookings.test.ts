import { describe, expect, it } from "vitest";
import { bookingMessages, toBookingResult } from "@/lib/server/bookings";

describe("booking results from the database", () => {
  it("reads a successful booking", () => {
    expect(toBookingResult({ ok: true, id: "a1", starts_at: "2026-11-30T06:30:00Z", ends_at: "2026-11-30T07:10:00Z" })).toEqual({
      ok: true,
      id: "a1",
      startsAt: "2026-11-30T06:30:00Z",
      endsAt: "2026-11-30T07:10:00Z",
    });
  });
  it("turns each failure into a plain message", () => {
    for (const reason of ["slot_taken", "closed_day", "staff_off", "outside_hours", "in_the_past", "staff_cannot_do_service", "unknown_service"]) {
      const r = toBookingResult({ ok: false, reason });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toBe(bookingMessages[r.reason]);
    }
  });
  it("treats anything unexpected as a generic error", () => {
    expect(toBookingResult(null)).toMatchObject({ ok: false, reason: "error" });
    expect(toBookingResult({ ok: false, reason: "weird" })).toMatchObject({ ok: false, reason: "error" });
  });
});
