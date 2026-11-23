import "server-only";
// Cost guards. The hard backstop is the spend limit set in the Claude Console;
// these stop a single business or visitor from burning through it.

export const LIMITS = {
  messageChars: 800,
  historyItems: 30,
  messagesPerBusinessPerDay: Number(process.env.DAILY_MESSAGE_CAP ?? 200),
  extractionsPerDay: Number(process.env.DAILY_EXTRACTION_CAP ?? 30),
  maxFiles: 6,
  maxUploadBytes: 4 * 1024 * 1024, // Vercel functions accept ~4.5 MB bodies
  websiteChars: 25_000,
  notesChars: 8_000,
};

/** Optional passcode for /setup so strangers can't spend your Claude credit. */
export function setupCodeOk(code: string | null | undefined) {
  const required = process.env.SETUP_ACCESS_CODE;
  if (!required) return true;
  return code === required;
}
export const setupCodeRequired = () => Boolean(process.env.SETUP_ACCESS_CODE);

// Very small per-instance rate limit (best effort on serverless).
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
