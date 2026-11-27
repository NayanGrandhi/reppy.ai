import { z } from "zod";
import { BrainSchema } from "@/lib/brain/schema";
import { clientIp, rateLimited, setupCodeOk } from "@/lib/server/limits";
import { ownedBusinessId } from "@/lib/server/dashboard";
import { createBrain } from "@/lib/server/store";
import { supabaseAsUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Body = z.object({
  brain: BrainSchema,
  code: z.string().optional(),
  sources: z.array(z.object({ kind: z.enum(["website", "image", "pdf", "text"]), label: z.string() })).max(20).default([]),
});

/** Save a reviewed business brain. Returns its slug for the chat demo. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Some fields are invalid. Check the form and try again." }, { status: 400 });
  if (!setupCodeOk(parsed.data.code)) return Response.json({ error: "That access code isn't right." }, { status: 401 });
  if (rateLimited(`save:${clientIp(req)}`, 10, 10 * 60_000)) return Response.json({ error: "Too many saves. Wait a few minutes." }, { status: 429 });
  const { brain } = parsed.data;
  if (!brain.name.trim()) return Response.json({ error: "Add the business name before saving." }, { status: 400 });
  try {
    // Signed-in owner without a business yet: this becomes their business,
    // so it shows up in their dashboard.
    const supa = await supabaseAsUser();
    const { data } = await supa.auth.getUser();
    const ownerId = data.user && !(await ownedBusinessId(supa)) ? data.user.id : undefined;
    const slug = await createBrain(brain, parsed.data.sources, ownerId);
    return Response.json({ slug, owned: Boolean(ownerId) });
  } catch (e) {
    console.error("save failed", e);
    return Response.json({ error: "Couldn't save right now. Try again." }, { status: 500 });
  }
}
