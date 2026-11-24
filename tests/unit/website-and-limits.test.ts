import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimited, setupCodeOk } from "@/lib/server/limits";
import { WebsiteError, readWebsite } from "@/lib/server/website";

function mockFetch(routes: Record<string, { status?: number; body: string; type?: string }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      const hit = Object.entries(routes).find(([k]) => url.startsWith(k));
      if (!hit) return new Response("not found", { status: 404 });
      const [, r] = hit;
      return new Response(r.body, { status: r.status ?? 200, headers: { "content-type": r.type ?? "text/html" } });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const PAGE = `<html><body><h1>Sharma Motors</h1><p>General service from &#8377;3800. Open Mon–Sat 9am to 7pm.</p>${"<p>We repair all makes and models, with pick-up and drop across Pune.</p>".repeat(10)}</body></html>`;

describe("website reader", () => {
  it("never reads Instagram, Google Maps or listing sites", async () => {
    for (const url of ["instagram.com/glow", "https://maps.app.goo.gl/x", "www.justdial.com/x", "https://m.facebook.com/x"]) {
      await expect(readWebsite(url)).rejects.toThrow(/screenshots/);
    }
  });
  it("refuses private network addresses", async () => {
    for (const url of ["http://localhost:3000", "http://192.168.1.1", "http://10.0.0.5", "http://169.254.169.254/latest"]) {
      await expect(readWebsite(url)).rejects.toBeInstanceOf(WebsiteError);
    }
  });
  it("respects robots.txt", async () => {
    mockFetch({ "https://shop.example/robots.txt": { body: "User-agent: *\nDisallow: /", type: "text/plain" }, "https://shop.example/": { body: PAGE } });
    await expect(readWebsite("shop.example")).rejects.toThrow(/asks bots not to read/);
  });
  it("reads allowed pages as clean text with ₹ prices", async () => {
    mockFetch({ "https://shop.example/robots.txt": { body: "User-agent: *\nDisallow: /admin", type: "text/plain" }, "https://shop.example/": { body: PAGE } });
    const site = await readWebsite("shop.example");
    expect(site.text).toContain("General service from ₹3800");
    expect(site.text).not.toContain("<p>");
    expect(site.warning).toBeUndefined();
  });
  it("warns when a site builder hides most of the text", async () => {
    mockFetch({ "https://wix.example/": { body: '<html><script src="https://static.wixstatic.com/x.js"></script><body><p>Welcome to Glow Studio in Bandra West. Book your next haircut online.</p></body></html>' } });
    const site = await readWebsite("wix.example");
    expect(site.warning).toMatch(/Wix/);
  });
  it("explains clearly when there's no readable text", async () => {
    mockFetch({ "https://empty.example/": { body: '<html><body><div id="root"></div></body></html>' } });
    await expect(readWebsite("empty.example")).rejects.toThrow(/screenshots/);
  });
});

describe("cost guards", () => {
  it("setup works without a code when none is set", () => {
    vi.stubEnv("SETUP_ACCESS_CODE", "");
    expect(setupCodeOk(undefined)).toBe(true);
  });
  it("setup needs the right code when one is set", () => {
    vi.stubEnv("SETUP_ACCESS_CODE", "mango");
    expect(setupCodeOk("mango")).toBe(true);
    expect(setupCodeOk("apple")).toBe(false);
    expect(setupCodeOk(undefined)).toBe(false);
  });
  it("rate limit trips after the allowed number of requests", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimited(key, 3, 60_000)).toBe(false);
    expect(rateLimited(key, 3, 60_000)).toBe(true);
  });
});
