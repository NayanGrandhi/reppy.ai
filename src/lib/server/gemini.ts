import "server-only";
// Free stand-in for demos only: Google's Gemini API free tier.
//
// Why demos only: on the free tier Google may use what we send to improve its
// products, and people at Google may read it. That is fine for the made-up
// sample businesses and the test conversations, never for real customers.
// The caller (chatProvider in ai.ts) enforces this: real businesses always use
// Claude, and get "AI not switched on" when there is no Claude key.
import { z } from "zod";

export const GEMINI_MODEL = process.env.REPPY_GEMINI_MODEL || "gemini-flash-latest";
// Tried next when the main model is overloaded (Google's free tier often is).
const FALLBACK_MODEL = process.env.REPPY_GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

export type GeminiMessage = { role: "user" | "model"; text: string };

/** JSON Schema for Gemini's structured output, without keys it doesn't accept. */
export function geminiSchema(schema: z.ZodType): Record<string, unknown> {
  const js = z.toJSONSchema(schema) as Record<string, unknown>;
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v)) if (k !== "$schema" && k !== "additionalProperties") out[k] = strip(val);
      return out;
    }
    return v;
  };
  return strip(js) as Record<string, unknown>;
}

/**
 * Streams a JSON answer. `onText` receives the full text so far.
 * Returns the parsed object (validated with `schema`).
 */
export async function geminiStreamJson<T>(opts: {
  system: string;
  messages: GeminiMessage[];
  schema: z.ZodType<T>;
  maxTokens?: number;
  onText?: (snapshot: string) => void;
  fetchImpl?: typeof fetch;
}): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is missing.");
  const call = (model: string) => (opts.fetchImpl ?? fetch)(`${ENDPOINT}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: opts.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: geminiSchema(opts.schema),
        maxOutputTokens: opts.maxTokens ?? 4096,
        temperature: 0.4,
      },
    }),
  });
  let res = await call(GEMINI_MODEL);
  if ([429, 500, 503, 404].includes(res.status)) res = await call(FALLBACK_MODEL);
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429 || res.status === 503) throw new Error("The free demo AI is busy (Google's free limit). Wait a minute and try again.");
    throw new Error(`Gemini error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let chunk: { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }
      const parts = chunk.candidates?.[0]?.content?.parts ?? [];
      const add = parts.filter((p) => !p.thought && typeof p.text === "string").map((p) => p.text).join("");
      if (add) {
        text += add;
        opts.onText?.(text);
      }
    }
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("The demo AI sent an unreadable answer. Try again.");
  }
  return opts.schema.parse(json);
}
