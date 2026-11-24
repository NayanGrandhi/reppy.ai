import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Replace the real AI call with a scripted one; everything else is real.
vi.mock("@/lib/server/ai", async (orig) => {
  const real = await orig<typeof import("@/lib/server/ai")>();
  return {
    ...real,
    aiConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),
    chatTurnStream: vi.fn(async (_b, _h, _m, _o, onReply: (s: string) => void) => {
      onReply("Men's haircut");
      onReply("Men's haircut ₹400 hai.");
      return { reply: "Men's haircut ₹400 hai.", language: "Hinglish", intent: "Price enquiry", needsOwner: false, ownerQuestion: "", handoff: false, handoffReason: "" };
    }),
  };
});

const logExchange = vi.fn(async (..._args: unknown[]) => "session-1");
vi.mock("@/lib/server/store", async (orig) => {
  const real = await orig<typeof import("@/lib/server/store")>();
  return { ...real, logExchange: (...a: unknown[]) => logExchange(...a) };
});

const { POST } = await import("@/app/api/chat/route");

let ip = 0;
const call = (body: unknown) =>
  POST(new Request("http://x/api/chat", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.9.${ip++}.1` }, body: JSON.stringify(body) }));

async function events(res: Response) {
  const text = await res.text();
  return text.trim().split("\n").map((l) => JSON.parse(l));
}

beforeEach(() => vi.stubEnv("ANTHROPIC_API_KEY", "test"));
afterEach(() => {
  vi.unstubAllEnvs();
  logExchange.mockClear();
});

describe("POST /api/chat", () => {
  it("explains when the AI key is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await call({ slug: "glow-studio", message: "hi", history: [] });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/ANTHROPIC_API_KEY/);
  });
  it("rejects over-long messages", async () => {
    const res = await call({ slug: "glow-studio", message: "x".repeat(801), history: [] });
    expect(res.status).toBe(400);
  });
  it("rejects empty messages", async () => {
    const res = await call({ slug: "glow-studio", message: "   ", history: [] });
    expect(res.status).toBe(400);
  });
  it("404s for an unknown business", async () => {
    const res = await call({ slug: "no-such-place", message: "hi", history: [] });
    expect(res.status).toBe(404);
  });
  it("streams the reply and starts the first reply with the AI intro", async () => {
    const res = await call({ slug: "glow-studio", message: "Haircut kitne ka hai?", history: [] });
    expect(res.headers.get("content-type")).toContain("ndjson");
    const ev = await events(res);
    expect(ev[0]).toEqual({ type: "delta", text: "Namaste! Main Reppy hoon, Glow Studio ki AI assistant. " });
    const done = ev.at(-1);
    expect(done.type).toBe("done");
    expect(done.reply).toBe("Namaste! Main Reppy hoon, Glow Studio ki AI assistant. Men's haircut ₹400 hai.");
    expect(ev.filter((e) => e.type === "delta").length).toBeGreaterThan(1);
  });
  it("doesn't repeat the intro later in the conversation", async () => {
    const res = await call({ slug: "glow-studio", message: "aur colour?", history: [{ role: "customer", text: "hi" }, { role: "reppy", text: "Hi! I'm Reppy…" }] });
    const done = (await events(res)).at(-1);
    expect(done.reply).toBe("Men's haircut ₹400 hai.");
  });
  it("never stores the words of clinic chats", async () => {
    await events(await call({ slug: "mehta-family-clinic", message: "Mere bete ko bukhar hai", history: [] }));
    expect(logExchange).toHaveBeenCalledWith("mehta-family-clinic", null, expect.any(Array), { redact: true });
    await events(await call({ slug: "glow-studio", message: "hi", history: [] }));
    expect(logExchange).toHaveBeenLastCalledWith("glow-studio", null, expect.any(Array), { redact: false });
  });
  it("stops at the daily reply cap for a business", async () => {
    vi.stubEnv("DAILY_MESSAGE_CAP", "0");
    vi.resetModules();
    const fresh = await import("@/app/api/chat/route");
    const res = await fresh.POST(new Request("http://x/api/chat", { method: "POST", headers: { "x-forwarded-for": "10.99.0.1" }, body: JSON.stringify({ slug: "glow-studio", message: "hi", history: [] }) }));
    expect(res.status).toBe(429);
  });
});
