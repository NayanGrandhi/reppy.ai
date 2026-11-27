import { describe, expect, it } from "vitest";
import { freeSlots } from "@/lib/dashboard/slots";
import * as mock from "@/lib/mock/data";
import { toIst } from "@/lib/server/dashboard";

describe("real dashboard data", () => {
  it("shows database times in India time", () => {
    expect(toIst("2026-11-30T06:30:00Z")).toBe("2026-11-30T12:00:00");
    expect(toIst("2026-11-30T20:00:00+00:00")).toBe("2026-12-01T01:30:00"); // next day in India
  });

  it("hides slots that have already passed today", () => {
    const ctx = { business: mock.business, staff: mock.staff, services: mock.services };
    const haircut = mock.services.find((s) => s.id === "sv_haircut_m")!;
    const mon = "2026-11-30";
    const all = freeSlots(ctx, mon, haircut, "st_rahul", []);
    const later = freeSlots(ctx, mon, haircut, "st_rahul", [], 30, `${mon}T15:10`);
    expect(all[0]).toBe("10:00");
    expect(later[0]).toBe("15:30");
    // A different day isn't affected.
    expect(freeSlots(ctx, mon, haircut, "st_rahul", [], 30, "2026-11-29T23:00")[0]).toBe("10:00");
  });
});
