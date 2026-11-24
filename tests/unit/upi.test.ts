import { describe, expect, it } from "vitest";
import { UpiError, buildUpiLink, isValidUpiId, upiQrDataUrl, upiQrSvg } from "@/lib/upi";

const base = { upiId: "glowstudio@okhdfcbank", payeeName: "Glow Studio", amountINR: 200 };

describe("UPI payment links", () => {
  it("builds a standard upi://pay link", () => {
    expect(buildUpiLink(base)).toBe("upi://pay?pa=glowstudio@okhdfcbank&pn=Glow%20Studio&am=200.00&cu=INR");
  });
  it("adds the note and a cleaned-up reference", () => {
    const link = buildUpiLink({ ...base, note: "Deposit: Keratin, Sun 29 Nov", ref: "ap_12/xyz!" });
    expect(link).toContain("tn=Deposit%3A%20Keratin%2C%20Sun%2029%20Nov");
    expect(link).toContain("tr=ap_12xyz");
  });
  it("always uses two decimals and rupees", () => {
    expect(buildUpiLink({ ...base, amountINR: 99.5 })).toContain("am=99.50&cu=INR");
  });
  it("rejects bad UPI IDs, zero and huge amounts", () => {
    expect(() => buildUpiLink({ ...base, upiId: "not-an-id" })).toThrow(UpiError);
    expect(() => buildUpiLink({ ...base, upiId: "a@1bank" })).toThrow(UpiError);
    expect(() => buildUpiLink({ ...base, amountINR: 0 })).toThrow(/more than ₹0/);
    expect(() => buildUpiLink({ ...base, amountINR: 250000 })).toThrow(/1,00,000/);
  });
  it("recognises real-looking UPI IDs", () => {
    for (const ok of ["glowstudio@okhdfcbank", "9820041177@ybl", "priya.sharma@oksbi", "mehta-clinic@okicici"]) expect(isValidUpiId(ok)).toBe(true);
    for (const bad of ["", "glowstudio", "@okhdfc", "glow studio@ok", "glow@"]) expect(isValidUpiId(bad)).toBe(false);
  });
  it("draws a QR code as SVG and PNG", async () => {
    const svg = await upiQrSvg(base);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(await upiQrDataUrl(base)).toMatch(/^data:image\/png;base64,/);
  });
});
