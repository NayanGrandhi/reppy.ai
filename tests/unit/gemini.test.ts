import { afterEach, describe, expect, it } from "vitest";
import { ChatTurnSchema, chatProvider } from "@/lib/server/ai";
import { geminiSchema, geminiStreamJson } from "@/lib/server/gemini";

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

describe("which AI answers", () => {
  it("uses Claude for everyone once its key is set", () => {
    process.env.ANTHROPIC_API_KEY = "x";
    process.env.GEMINI_API_KEY = "y";
    expect(chatProvider(true)).toBe("claude");
    expect(chatProvider(false)).toBe("claude");
  });
  it("uses the free Gemini stand-in for sample businesses only", () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.GEMINI_API_KEY = "y";
    expect(chatProvider(true)).toBe("gemini");
    expect(chatProvider(false)).toBeNull(); // real customers never go to the free tier
  });
  it("is off with no keys", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    expect(chatProvider(true)).toBeNull();
  });
});

describe("Gemini streaming", () => {
  const sse = (chunks: string[]) =>
    new Response(
      new ReadableStream({
        start(c) {
          const enc = new TextEncoder();
          for (const t of chunks) c.enqueue(enc.encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] })}\r\n\r\n`));
          c.close();
        },
      }),
      { status: 200 },
    );

  it("streams text, then validates the JSON", async () => {
    process.env.GEMINI_API_KEY = "test";
    const full = JSON.stringify({ reply: "Haircut ₹400 hai.", language: "Hinglish", intent: "Price enquiry", needsOwner: false, ownerQuestion: "", handoff: false, handoffReason: "" });
    const pieces = [full.slice(0, 20), full.slice(20, 41), full.slice(41)];
    const seen: string[] = [];
    let sentHeaders: Headers | null = null;
    const out = await geminiStreamJson({
      system: "s",
      messages: [{ role: "user", text: "Haircut kitne ka hai?" }],
      schema: ChatTurnSchema,
      onText: (t) => seen.push(t),
      fetchImpl: async (_u, init) => {
        sentHeaders = new Headers(init?.headers);
        return sse(pieces);
      },
    });
    expect(out.reply).toBe("Haircut ₹400 hai.");
    expect(seen).toHaveLength(3);
    // The key goes in a header, never in the URL.
    expect(sentHeaders!.get("x-goog-api-key")).toBe("test");
  });

  it("explains Google's free-tier limit in plain words", async () => {
    process.env.GEMINI_API_KEY = "test";
    await expect(
      geminiStreamJson({ system: "s", messages: [{ role: "user", text: "hi" }], schema: ChatTurnSchema, fetchImpl: async () => new Response("quota", { status: 429 }) }),
    ).rejects.toThrow(/busy/);
  });

  it("falls back to the lighter model when Google is overloaded", async () => {
    process.env.GEMINI_API_KEY = "test";
    const urls: string[] = [];
    const full = JSON.stringify({ reply: "Hi", language: "English", intent: "Other", needsOwner: false, ownerQuestion: "", handoff: false, handoffReason: "" });
    const out = await geminiStreamJson({
      system: "s",
      messages: [{ role: "user", text: "hi" }],
      schema: ChatTurnSchema,
      fetchImpl: async (u) => {
        urls.push(String(u));
        return urls.length === 1 ? new Response("busy", { status: 503 }) : sse([full]);
      },
    });
    expect(out.reply).toBe("Hi");
    expect(urls[1]).toContain("flash-lite");
  });

  it("sends a schema Gemini accepts", () => {
    const s = JSON.stringify(geminiSchema(ChatTurnSchema));
    expect(s).not.toContain("$schema");
    expect(s).not.toContain("additionalProperties");
    expect(s).toContain('"reply"');
  });
});
