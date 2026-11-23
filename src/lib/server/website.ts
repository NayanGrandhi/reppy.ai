import "server-only";
// Reads a business website as plain text — only where robots.txt allows it.
// Instagram, Facebook and Google Maps are never fetched (owners upload
// screenshots of those instead), per the product rules.

const BLOCKED_HOSTS = ["instagram.com", "facebook.com", "fb.com", "google.com", "goo.gl", "maps.app.goo.gl", "g.page", "justdial.com", "zomato.com", "practo.com"];
const UA = "ReppyBot/1.0 (+https://reppy-ai.vercel.app)";
const MAX_CHARS = 25_000;

export class WebsiteError extends Error {}

function isPrivateHost(host: string) {
  return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?|169\.254\.)/.test(host) || host.endsWith(".local") || host.endsWith(".internal");
}

async function robotsAllows(url: URL): Promise<boolean> {
  try {
    const res = await fetch(new URL("/robots.txt", url.origin), { headers: { "user-agent": UA }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return true; // no robots.txt = allowed
    const lines = (await res.text()).split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim());
    let applies = false;
    const disallow: string[] = [];
    const allow: string[] = [];
    for (const line of lines) {
      const [k, ...rest] = line.split(":");
      const v = rest.join(":").trim();
      const key = k?.toLowerCase();
      if (key === "user-agent") applies = v === "*" || v.toLowerCase().includes("reppybot");
      else if (applies && key === "disallow" && v) disallow.push(v);
      else if (applies && key === "allow" && v) allow.push(v);
    }
    const path = url.pathname || "/";
    const longest = (rules: string[]) => Math.max(-1, ...rules.filter((r) => path.startsWith(r.replace(/\*.*$/, ""))).map((r) => r.length));
    return longest(allow) >= longest(disallow);
  } catch {
    return true;
  }
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(br|p|div|li|tr|h[1-6]|section|article)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8377;|&#x20b9;/gi, "₹")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

export async function readWebsite(raw: string): Promise<{ url: string; text: string }> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new WebsiteError("That doesn't look like a website address.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new WebsiteError("Only http and https links work.");
  const host = url.hostname.toLowerCase();
  if (isPrivateHost(host)) throw new WebsiteError("That address isn't a public website.");
  if (BLOCKED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    throw new WebsiteError("Reppy doesn't read Instagram, Google Maps or listing sites. Upload screenshots of them instead.");
  }
  if (!(await robotsAllows(url))) throw new WebsiteError("This website asks bots not to read it, so Reppy skipped it. Paste the details as text instead.");

  const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new WebsiteError(`The website returned an error (${res.status}).`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("text/html") && !type.includes("text/plain")) throw new WebsiteError("That link isn't a web page.");
  const text = htmlToText(await res.text()).slice(0, MAX_CHARS);
  if (text.length < 40) throw new WebsiteError("Couldn't find readable text on that page.");
  return { url: url.toString(), text };
}
