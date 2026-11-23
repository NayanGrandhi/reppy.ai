import { z } from "zod";
import { AiNotConfigured, aiConfigured, aiIntro, chatTurnStream } from "@/lib/server/ai";
import { LIMITS, clientIp, rateLimited } from "@/lib/server/limits";
import { bumpUsage, getBrain, logExchange, recordGap } from "@/lib/server/store";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const Body = z.object({
  slug: z.string().max(80),
  sessionId: z.string().nullable().optional(),
  message: z.string().max(LIMITS.messageChars),
  history: z.array(z.object({ role: z.enum(["customer", "reppy"]), text: z.string().max(2000) })).max(LIMITS.historyItems),
  // Answers the "owner" gave during this demo session (learns from gaps).
  sessionFaqs: z.array(z.object({ q: z.string().max(300), a: z.string().max(600) })).max(10).default([]),
  ownerAnswer: z.string().max(600).optional(),
});

const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Streams one reply as newline-delimited JSON:
 *   {"type":"delta","text":"<reply so far>"}   (repeated)
 *   {"type":"done", ...turn, "sessionId": "..."}
 *   {"type":"error","error":"..."}            (if something fails mid-way)
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, `Messages can be up to ${LIMITS.messageChars} characters.`);
  const { slug, message, history, sessionFaqs, ownerAnswer } = parsed.data;
  const text = message.trim();
  if (!text && !ownerAnswer) return fail(400, "Type a message first.");
  if (!aiConfigured()) return fail(503, new AiNotConfigured().message);

  if (rateLimited(`chat:${clientIp(req)}`, 20, 60_000)) return fail(429, "You're sending messages very fast. Wait a moment.");

  const stored = await getBrain(slug);
  if (!stored) return fail(404, "This business doesn't exist.");

  const used = await bumpUsage(slug, "message");
  if (used > LIMITS.messagesPerBusinessPerDay) {
    return fail(429, `This business reached today's limit of ${LIMITS.messagesPerBusinessPerDay} AI replies. It resets tomorrow.`);
  }

  const brain = { ...stored.brain, faqs: [...stored.brain.faqs, ...sessionFaqs] };
  const isFirstReply = !history.some((h) => h.role === "reppy");
  const intro = isFirstReply ? `${aiIntro(brain, text || ownerAnswer || "")} ` : "";
  const redact = brain.type === "Clinic";

  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(`${JSON.stringify(obj)}\n`));
      try {
        if (intro) send({ type: "delta", text: intro });
        const turn = await chatTurnStream(brain, history, text, ownerAnswer, (soFar) => send({ type: "delta", text: intro + soFar }));
        const reply = intro + turn.reply.trim();

        if (turn.needsOwner && turn.ownerQuestion && !stored.isDemo) await recordGap(slug, turn.ownerQuestion).catch(() => {});
        const sessionId = await logExchange(
          slug,
          parsed.data.sessionId ?? null,
          [
            ...(text ? [{ role: "customer" as const, text, language: turn.language, intent: turn.intent }] : []),
            ...(ownerAnswer ? [{ role: "owner" as const, text: ownerAnswer }] : []),
            { role: "reppy" as const, text: reply },
          ],
          { redact },
        ).catch(() => parsed.data.sessionId ?? null);

        send({ type: "done", ...turn, reply, sessionId });
      } catch (e) {
        console.error("chat failed", e);
        send({ type: "error", error: e instanceof AiNotConfigured ? e.message : "Reppy couldn't reply just now. Try sending that again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
