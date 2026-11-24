import { describe, expect, it } from "vitest";
import { freeSlots, getServices } from "@/lib/services";
import type { Appointment } from "@/lib/types";

// Sample salon: closed Tuesdays, Rahul off Wednesdays, 10 min buffer.
const haircutMen = getServices().find((s) => s.id === "sv_haircut_m")!; // 30 min
const MON = "2026-11-30";
const TUE = "2026-12-01";
const WED = "2026-12-02";

const appt = (start: string, staffId = "st_rahul", serviceId = "sv_haircut_m", status: Appointment["status"] = "confirmed"): Appointment => ({
  id: start,
  businessId: "biz_glow",
  customerId: "cu_1",
  serviceId,
  staffId,
  start,
  status,
  source: "dashboard",
});

describe("free slots (no double booking)", () => {
  it("offers nothing on a closed day", () => {
    expect(freeSlots(TUE, haircutMen, "st_rahul", [])).toEqual([]);
  });
  it("offers nothing on the staff member's day off", () => {
    expect(freeSlots(WED, haircutMen, "st_rahul", [])).toEqual([]);
    expect(freeSlots(WED, haircutMen, "st_anita", []).length).toBeGreaterThan(0);
  });
  it("stays inside opening hours and leaves room for the full service", () => {
    const slots = freeSlots(MON, haircutMen, "st_rahul", []);
    expect(slots[0]).toBe("10:00");
    expect(slots.at(-1)).toBe("19:30"); // a 30-min cut at 19:30 ends exactly at the 20:00 close
    expect(freeSlots(MON, getServices().find((s) => s.id === "sv_haircut_w")!, "st_rahul", []).at(-1)).toBe("19:00"); // 45 min must end by 20:00
  });
  it("blocks a booked slot and its buffer", () => {
    const slots = freeSlots(MON, haircutMen, "st_rahul", [appt(`${MON}T12:00:00`)]);
    expect(slots).not.toContain("12:00");
    expect(slots).not.toContain("11:30"); // 11:30–12:10 overlaps 12:00
    expect(slots).toContain("11:00");
    expect(slots).not.toContain("12:30"); // existing 12:00 + 30 + 10 = 12:40
    expect(slots).toContain("13:00");
  });
  it("ignores cancelled bookings and other staff", () => {
    const slots = freeSlots(MON, haircutMen, "st_rahul", [appt(`${MON}T12:00:00`, "st_rahul", "sv_haircut_m", "cancelled"), appt(`${MON}T15:00:00`, "st_anita")]);
    expect(slots).toContain("12:00");
    expect(slots).toContain("15:00");
  });
});
