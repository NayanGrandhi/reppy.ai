import { z } from "zod";
import { clientIp, rateLimited, setupCodeOk } from "@/lib/server/limits";
import { addLearnedFaq, getBrain } from "@/lib/server/store";

export const dynamic = "force-dynamic";

const Body = z.object({ slug: z.string().max(60), question: z.string().min(1).max(300), answer: z.string().min(1).max(600), code: z.string().optional() });

/**
 * Learns from gaps: the owner's answer becomes a permanent FAQ.
 * Sample businesses only remember answers for the current chat session,
 * so the public demo can't be changed by visitors.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Answer is missing." }, { status: 400 });
  if (rateLimited(`answer:${clientIp(req)}`, 20, 10 * 60_000)) return Response.json({ error: "Too many answers. Wait a few minutes." }, { status: 429 });
  const stored = await getBrain(parsed.data.slug);
  if (!stored) return Response.json({ error: "Business not found." }, { status: 404 });
  if (stored.isDemo) return Response.json({ saved: "session" });
  if (!setupCodeOk(parsed.data.code)) return Response.json({ saved: "session" });
  await addLearnedFaq(parsed.data.slug, parsed.data.question, parsed.data.answer);
  return Response.json({ saved: "permanent" });
}
