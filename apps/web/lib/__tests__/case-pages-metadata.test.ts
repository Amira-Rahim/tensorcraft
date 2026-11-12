import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The static case pages in apps/web/public/cases are also deployed to the
// tensorcraft-cases host, where newsletters and link previews read their
// metadata. Each page must name its own public URL. None may name an X
// account until the owner confirms the brand account.
const casesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public/cases",
);
const PUBLIC_URL: Record<string, string> = {
  "pattern-learning.html": "https://tensorcraft-cases.vercel.app/",
  "sensor-grouping.html":
    "https://tensorcraft-cases.vercel.app/sensor-grouping.html",
};
const pages = readdirSync(casesDir).filter((name) => name.endsWith(".html"));

function parse(name: string) {
  const html = readFileSync(path.join(casesDir, name), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

describe("static case pages", () => {
  it("finds the case pages", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages)("%s names its own public URL", (name) => {
    const doc = parse(name);
    const canonical = doc
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href");
    const ogUrl = doc
      .querySelector('meta[property="og:url"]')
      ?.getAttribute("content");
    expect(canonical).toBe(PUBLIC_URL[name]);
    expect(ogUrl).toBe(canonical);
  });

  it.each(pages)("%s names no X account", (name) => {
    const doc = parse(name);
    expect(
      doc.querySelector(
        'meta[name="twitter:site"], meta[name="twitter:creator"]',
      ),
    ).toBeNull();
  });
});
