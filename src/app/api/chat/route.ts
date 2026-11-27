import { z } from "zod";
import { AiNotConfigured, aiIntro, chatProvider, chatTurnStream } from "@/lib/server/ai";
import { LIMITS, clientIp, rateLimited } from "@/lib/server/limits";
import { bookFromChat, bookingGate, fmtTime, say } from "@/lib/server/chat-booking";
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
  if (rateLimited(`chat:${clientIp(req)}`, 20, 60_000)) return fail(429, "You're sending messages very fast. Wait a moment.");

  const stored = await getBrain(slug);
  if (!stored) return fail(404, "This business doesn't exist.");
  // Claude for everyone once its key is set; until then the free Gemini
  // stand-in answers the sample businesses only (never real customers).
  const provider = chatProvider(stored.isDemo);
  if (!provider) return fail(503, new AiNotConfigured().message);

  const used = await bumpUsage(slug, "message");
  if (used > LIMITS.messagesPerBusinessPerDay) {
    return fail(429, `This business reached today's limit of ${LIMITS.messagesPerBusinessPerDay} AI replies. It resets tomorrow.`);
  }

  const brain = { ...stored.brain, faqs: [...stored.brain.faqs, ...sessionFaqs] };
  const isFirstReply = !history.some((h) => h.role === "reppy");
  const intro = isFirstReply ? `${aiIntro(brain, text || ownerAnswer || "", stored.receptionist?.name)} ` : "";
  const redact = brain.type === "Clinic";

  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(`${JSON.stringify(obj)}\n`));
      try {
        if (intro) send({ type: "delta", text: intro });
        const turn = await chatTurnStream(brain, history, text, ownerAnswer, (soFar) => send({ type: "delta", text: intro + soFar }), provider, stored.receptionist);
        let reply = intro + turn.reply.trim();

        // Customer confirmed a booking: check the live calendar and book it
        // (or, for sample businesses, only check). The result is written by
        // our code, never by the AI.
        let booking: { ok: boolean; demo: boolean } | null = null;
        const gate = turn.booking?.ready ? bookingGate(history) : null;
        if (gate === "already-done" || gate === "confirm-first") {
          // The AI jumped ahead; our code asks for the yes (or says it's done).
          const b = turn.booking;
          const day = /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? new Date(`${b.date}T12:00:00+05:30`).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" }) : b.date;
          const line = gate === "already-done" ? say.alreadyDone(turn.language) : say.confirmFirst(turn.language, b.service, day, /^\d{2}:\d{2}$/.test(b.time) ? fmtTime(b.time) : b.time);
          reply = `${intro}${/checking/i.test(turn.reply) ? "" : `${turn.reply.trim()}\n\n`}${line}`;
          send({ type: "delta", text: reply });
        } else if (gate === "ok") {
          const r = await bookFromChat(slug, stored.isDemo, turn.booking, turn.language).catch((e) => {
            console.error("chat booking failed", e);
            return null;
          });
          if (r) {
            reply = `${reply}\n\n${r.text}`;
            booking = { ok: r.ok, demo: r.demo };
            send({ type: "delta", text: reply });
          }
        }

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

        send({ type: "done", ...turn, reply, sessionId, provider, booked: booking });
      } catch (e) {
        console.error("chat failed", e);
        const busy = e instanceof Error && e.message.startsWith("The free demo AI is busy");
        send({ type: "error", error: e instanceof AiNotConfigured || busy ? (e as Error).message : "Reppy couldn't reply just now. Try sending that again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
