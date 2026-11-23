import { BUSINESS_TYPES, type Brain } from "@/lib/brain/schema";
import { checkCompleteness } from "@/lib/brain/templates";
import { AiNotConfigured, extractBrain, type SourceInput } from "@/lib/server/ai";
import { LIMITS, clientIp, rateLimited, setupCodeOk } from "@/lib/server/limits";
import { bumpAppExtractions } from "@/lib/server/store";
import { WebsiteError, readWebsite } from "@/lib/server/website";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return fail(400, "Send the setup form as multipart form data.");
  if (!setupCodeOk(form.get("code")?.toString())) return fail(401, "That access code isn't right.");
  if (rateLimited(`extract:${clientIp(req)}`, 6, 10 * 60_000)) return fail(429, "Too many setups in a short time. Wait a few minutes and try again.");


  const sources: SourceInput[] = [];
  const labels: { kind: "website" | "image" | "pdf" | "text"; label: string }[] = [];
  const warnings: string[] = [];

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > LIMITS.maxFiles) return fail(400, `Upload up to ${LIMITS.maxFiles} files at a time.`);
  const total = files.reduce((s, f) => s + f.size, 0);
  if (total > LIMITS.maxUploadBytes) return fail(413, "Files are too large together. Keep the total under 4 MB.");
  for (const f of files) {
    const base64 = Buffer.from(await f.arrayBuffer()).toString("base64");
    if (f.type === "application/pdf") {
      sources.push({ kind: "pdf", name: f.name, base64 });
      labels.push({ kind: "pdf", label: f.name });
    } else if ((IMAGE_TYPES as readonly string[]).includes(f.type)) {
      sources.push({ kind: "image", name: f.name, mediaType: f.type as (typeof IMAGE_TYPES)[number], base64 });
      labels.push({ kind: "image", label: f.name });
    } else {
      warnings.push(`Skipped ${f.name}: only photos (JPG, PNG, WebP) and PDFs can be read.`);
    }
  }

  const url = form.get("url")?.toString().trim();
  if (url) {
    try {
      const site = await readWebsite(url);
      sources.push({ kind: "website", url: site.url, text: site.text });
      labels.push({ kind: "website", label: site.url });
      if (site.warning) warnings.push(site.warning);
    } catch (e) {
      warnings.push(e instanceof WebsiteError ? e.message : "Couldn't open that website.");
    }
  }

  const notes = form.get("notes")?.toString().trim();
  if (notes) {
    sources.push({ kind: "text", text: notes.slice(0, LIMITS.notesChars) });
    labels.push({ kind: "text", label: "Typed notes" });
  }

  if (sources.length === 0) return fail(400, warnings[0] ?? "Add at least one photo, PDF, website link or a few lines of notes.");

  const hint = form.get("type")?.toString();
  const typeHint = (BUSINESS_TYPES as readonly string[]).includes(hint ?? "") ? (hint as Brain["type"]) : undefined;

  // Counted only when we're actually about to call the AI.
  if ((await bumpAppExtractions()) > LIMITS.extractionsPerDay) return fail(429, "Today's setup limit is reached. Try again tomorrow.");

  try {
    const result = await extractBrain(sources, typeHint);
    return Response.json({ ...result, checks: checkCompleteness(result.brain), sources: labels, warnings });
  } catch (e) {
    if (e instanceof AiNotConfigured) return fail(503, e.message);
    console.error("extract failed", e);
    return fail(502, "The AI couldn't read these sources right now. Try again, or use clearer photos.");
  }
}
