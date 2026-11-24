import { describe, expect, it } from "vitest";
import { lintTemplate, renderTemplate, templates } from "@/lib/whatsapp/templates";

describe("WhatsApp templates (ready for Meta approval)", () => {
  it.each(templates.map((t) => [t.name, t] as const))("%s passes Meta's rules", (_name, t) => {
    expect(lintTemplate(t)).toEqual([]);
  });

  it("has unique names and both English and Hindi", () => {
    expect(new Set(templates.map((t) => t.name)).size).toBe(templates.length);
    for (const t of templates) {
      expect(t.body.en).toBeTruthy();
      expect(t.body.hi).toMatch(/[ऀ-ॿ]/);
    }
  });

  it("are all utility, so they're billed at the cheaper rate", () => {
    expect(templates.every((t) => t.category === "UTILITY")).toBe(true);
  });

  it("customer templates let people opt out with STOP", () => {
    for (const t of templates.filter((x) => x.audience === "customer")) expect(t.footer?.en).toMatch(/STOP/);
  });

  it("the missed-call message says Reppy is an AI", () => {
    const t = templates.find((x) => x.name === "missed_call_followup")!;
    expect(t.body.en).toMatch(/AI assistant/);
    expect(t.body.hi).toMatch(/AI/);
  });

  it("the daily report labels revenue as an estimate", () => {
    const t = templates.find((x) => x.name === "owner_daily_report")!;
    expect(t.body.en).toMatch(/Estimated/);
  });

  it("fills in variables for previews", () => {
    const t = templates.find((x) => x.name === "appointment_reminder_2h")!;
    expect(renderTemplate(t, "en", t.example)).toBe("See you soon, Neha! Your Global hair colour at Glow Studio is at 11:00 am today.");
  });

  it("the lint catches common mistakes", () => {
    const bad = { ...templates[0], name: "Bad Name", body: { en: "{{1}} get 20% off {{3}}", hi: "{{1}}" }, example: ["x"] };
    const problems = lintTemplate(bad);
    expect(problems.join(" | ")).toMatch(/lowercase/);
    expect(problems.join(" | ")).toMatch(/no gaps/);
    expect(problems.join(" | ")).toMatch(/marketing/);
  });
});
