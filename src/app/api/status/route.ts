import { aiConfigured } from "@/lib/server/ai";
import { setupCodeRequired } from "@/lib/server/limits";
import { storageMode } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** Tells the UI which parts are switched on, without revealing any keys. */
export async function GET() {
  return Response.json({ ai: aiConfigured(), storage: storageMode(), setupCodeRequired: setupCodeRequired() });
}
