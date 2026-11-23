import { z } from "zod";
import { AiNotConfigured, chatTurn } from "@/lib/server/ai";
import { LIMITS, clientIp, rateLimited } from "@/lib/server/limits";
import { bumpUsage, getBrain, logExchange, recordGap } from "@/lib/server/store";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const Body = z.object({
  slug: z.string().max(60),
  sessionId: z.string().nullable().optional(),
  message: z.string().max(LIMITS.messageChars),
  history: z.array(z.object({ role: z.enum(["customer", "reppy"]), text: z.string().max(2000) })).max(LIMITS.historyItems),
  // Answers the "owner" gave during this demo session (learns from gaps).
  sessionFaqs: z.array(z.object({ q: z.string().max(300), a: z.string().max(600) })).max(10).default([]),
  ownerAnswer: z.string().max(600).optional(),
});

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, `Messages can be up to ${LIMITS.messageChars} characters.`);
  const { slug, message, history, sessionFaqs, ownerAnswer } = parsed.data;
  if (!message.trim() && !ownerAnswer) return fail(400, "Type a message first.");

  if (rateLimited(`chat:${clientIp(req)}`, 20, 60_000)) return fail(429, "You're sending messages very fast. Wait a moment.");

  const stored = await getBrain(slug);
  if (!stored) return fail(404, "This business doesn't exist.");

  const used = await bumpUsage(slug, "message");
  if (used > LIMITS.messagesPerBusinessPerDay) {
    return fail(429, `This business reached today's limit of ${LIMITS.messagesPerBusinessPerDay} AI replies. It resets tomorrow.`);
  }

  const brain = { ...stored.brain, faqs: [...stored.brain.faqs, ...sessionFaqs] };
  try {
    const turn = await chatTurn(brain, history, message.trim(), ownerAnswer);
    if (turn.needsOwner && turn.ownerQuestion && !stored.isDemo) await recordGap(slug, turn.ownerQuestion).catch(() => {});
    const sessionId = await logExchange(slug, parsed.data.sessionId ?? null, [
      ...(message.trim() ? [{ role: "customer" as const, text: message.trim(), language: turn.language, intent: turn.intent }] : []),
      ...(ownerAnswer ? [{ role: "owner" as const, text: ownerAnswer }] : []),
      { role: "reppy" as const, text: turn.reply },
    ]).catch(() => parsed.data.sessionId ?? null);
    return Response.json({ ...turn, sessionId });
  } catch (e) {
    if (e instanceof AiNotConfigured) return fail(503, e.message);
    console.error("chat failed", e);
    return fail(502, "Reppy couldn't reply just now. Try sending that again.");
  }
}
