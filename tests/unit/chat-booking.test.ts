import { describe, expect, it } from "vitest";
import { normaliseIndianMobile, say } from "@/lib/server/chat-booking";

describe("booking from the chat", () => {
  it("accepts the ways people type Indian mobile numbers", () => {
    expect(normaliseIndianMobile("98200 12345")).toBe("+919820012345");
    expect(normaliseIndianMobile("+91-98200-12345")).toBe("+919820012345");
    expect(normaliseIndianMobile("09820012345")).toBe("+919820012345");
    expect(normaliseIndianMobile("919820012345")).toBe("+919820012345");
  });
  it("rejects numbers that aren't Indian mobiles", () => {
    expect(normaliseIndianMobile("12345")).toBeNull();
    expect(normaliseIndianMobile("2212345678")).toBeNull(); // landline-style start
    expect(normaliseIndianMobile("")).toBeNull();
  });
  it("tells demo customers nothing was saved", () => {
    expect(say.demoBooked("English", "Blow-dry", "Anita", "Mon, 30 Nov", "12:00 pm")).toMatch(/nothing was actually saved/);
  });
  it("offers free times when a slot is taken", () => {
    expect(say.notFree("Hinglish", "already booked", "Mon, 30 Nov", ["12:30 pm", "1:00 pm"])).toBe("Yeh time available nahi hai (already booked). Mon, 30 Nov ko free times: 12:30 pm, 1:00 pm. Kaunsa chalega?");
  });
});
