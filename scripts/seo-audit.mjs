#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const SEARCH_AGENTS = ["robots", "googlebot", "bingbot", "oai-searchbot"];
const issue = (code, message, details = {}) => ({ code, message, ...details });
const noindex = (value) => /\b(noindex|none)\b/i.test(value);

function absoluteUrl(value) {
  if (!/^https?:\/\//i.test(value ?? "")) return null;
  try {
    const url = new URL(value);
    return url.username || url.password ? null : url;
  } catch {
    return null;
  }
}

function safeUrl(value, base) {
  try {
    const url = new URL(value, base);
    url.username = "";
    url.password = "";
    for (const key of url.searchParams.keys()) {
      if (/token|key|password|secret|auth|signature|session/i.test(key))
        url.searchParams.set(key, "[redacted]");
    }
    return url.href;
  } catch {
    return "[invalid URL]";
  }
}

function headerNoindex(value) {
  let agent = "robots";
  return value.split(",").some((part) => {
    const scope = part.trim().match(/^([\w-]+):\s*(.*)$/);
    if (scope) agent = scope[1].toLowerCase();
    return SEARCH_AGENTS.includes(agent) && noindex(scope ? scope[2] : part);
  });
}

export function auditHtml(html, pageUrl, xRobotsTag = "") {
  // JSDOM parses initial HTML without executing scripts or loading resources.
  const dom = new JSDOM(html, { url: pageUrl });
  const doc = dom.window.document;
  const errors = [],
    warnings = [];
  const titles = [...doc.querySelectorAll("title")];
  const title = titles[0]?.textContent.trim() ?? "";
  const meta = [...doc.querySelectorAll("meta")];
  const descriptions = meta.filter(
    (tag) => tag.name.toLowerCase() === "description",
  );
  const description = descriptions[0]?.content.trim() ?? "";
  const canonicalTags = [...doc.querySelectorAll("link")].filter((tag) =>
    tag.rel.toLowerCase().split(/\s+/).includes("canonical"),
  );
  const canonical = canonicalTags[0]?.getAttribute("href") ?? "";
  const canonicalUrl = absoluteUrl(canonical);
  const expected = new URL(pageUrl).href;
  const ogTags = meta.filter(
    (tag) => tag.getAttribute("property")?.toLowerCase() === "og:url",
  );
  const ogUrl = ogTags[0]?.content ?? "";
  if (canonicalTags.length !== 1)
    errors.push(
      issue("CANONICAL_COUNT", "Expected one canonical link.", {
        count: canonicalTags.length,
      }),
    );
  if (!canonicalUrl)
    errors.push(
      issue(
        "INVALID_CANONICAL",
        "Expected an absolute canonical URL without credentials.",
      ),
    );
  else if (canonicalUrl.href !== expected)
    errors.push(
      issue("CANONICAL_MISMATCH", "Canonical differs from the sitemap URL."),
    );
  if (titles.length !== 1 || !title)
    warnings.push(issue("TITLE_COUNT", "Expected one nonempty title."));
  if (descriptions.length !== 1 || !description)
    warnings.push(
      issue("DESCRIPTION_COUNT", "Expected one nonempty meta description."),
    );
  if (ogTags.length !== 1 || absoluteUrl(ogUrl)?.href !== expected)
    warnings.push(
      issue(
        "OG_URL_MISMATCH",
        "Expected one absolute og:url matching the sitemap URL.",
      ),
    );
  const robotsMeta = meta
    .filter((tag) => SEARCH_AGENTS.includes(tag.name.toLowerCase()))
    .map((tag) => ({ agent: tag.name, directives: tag.content }));
  if (robotsMeta.some((tag) => noindex(tag.directives)))
    errors.push(issue("META_NOINDEX", "Sitemap page declares noindex."));
  if (headerNoindex(xRobotsTag))
    errors.push(
      issue("HEADER_NOINDEX", "Sitemap page sends noindex in X-Robots-Tag."),
    );
  const jsonLd = [...doc.querySelectorAll("script")].filter(
    (tag) => tag.type.toLowerCase() === "application/ld+json",
  );
  for (const [index, tag] of jsonLd.entries()) {
    try {
      JSON.parse(tag.textContent);
    } catch {
      warnings.push(
        issue("INVALID_JSON_LD", "A JSON-LD block is invalid JSON.", {
          block: index + 1,
        }),
      );
    }
  }
  const result = {
    title,
    description,
    h1: [...doc.querySelectorAll("h1")].map((tag) => tag.textContent.trim()),
    canonical: canonical ? safeUrl(canonical, pageUrl) : null,
    ogUrl: ogUrl ? safeUrl(ogUrl, pageUrl) : null,
    jsonLdBlocks: jsonLd.length,
    robotsMeta,
    xRobotsTag,
    errors,
    warnings,
  };
  dom.window.close();
  return result;
}

export function parseSitemap(xml) {
  const dom = new JSDOM(xml, { contentType: "text/xml" });
  try {
    const root = dom.window.document.documentElement;
    if (!["urlset", "sitemapindex"].includes(root.localName))
      throw new Error("Expected a sitemap.");
    const type = root.localName === "sitemapindex" ? "index" : "urlset";
    const itemName = type === "index" ? "sitemap" : "url";
    const urls = [...root.children]
      .filter(
        (node) =>
          node.localName === itemName &&
          node.namespaceURI === root.namespaceURI,
      )
      .map((node) =>
        [...node.children]
          .find(
            (child) =>
              child.localName === "loc" &&
              child.namespaceURI === root.namespaceURI,
          )
          ?.textContent.trim(),
      )
      .filter(Boolean);
    return { type, urls };
  } finally {
    dom.window.close();
  }
}

function normalizeOrigin(value) {
  const url = absoluteUrl(value);
  if (!url || url.pathname !== "/" || url.search || url.hash)
    throw new Error(
      "Expected an HTTP origin without a path, query, fragment, or credentials.",
    );
  return url.origin;
}

export function parseArgs(args) {
  const options = { origin: "https://tensorcraft.app", output: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help") return { help: true };
    if (
      !["--origin", "--output"].includes(args[i]) ||
      !args[i + 1] ||
      args[i + 1].startsWith("--")
    )
      throw new Error(
        "Use --origin <origin> and optionally --output <report.json>.",
      );
    options[args[i].slice(2)] = args[++i];
  }
  options.origin = normalizeOrigin(options.origin);
  return options;
}

async function request(url) {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "Tensorcraft-HTTP-Check/1.0" },
    });
    return {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      xRobotsTag: response.headers.get("x-robots-tag") ?? "",
      location: response.headers.get("location")
        ? safeUrl(response.headers.get("location"), url)
        : null,
      text: await response.text(),
    };
  } catch {
    return { status: null };
  }
}

export async function auditSite({
  origin: input = "https://tensorcraft.app",
} = {}) {
  const origin = normalizeOrigin(input);
  const report = {
    generatedAt: new Date().toISOString(),
    origin,
    scope:
      "HTTP smoke checks for sitemap URLs and initial HTML only. Canonical checks enforce this site's preferred URL policy. No rendering, schema eligibility, crawler-network access, indexing, ranking, or AI-citation assessment.",
    robots: null,
    sitemaps: [],
    pages: [],
    errors: [],
    warnings: [],
  };
  const robotsUrl = origin + "/robots.txt";
  const robots = await request(robotsUrl);
  report.robots = {
    url: robotsUrl,
    status: robots.status,
    policy:
      robots.status === 200 && robots.contentType.includes("text/plain")
        ? robots.text.trim()
        : null,
  };
  if (robots.status !== 200)
    report.warnings.push(
      issue(
        "ROBOTS_UNAVAILABLE",
        "Could not retrieve robots.txt with HTTP 200.",
        { status: robots.status },
      ),
    );
  const pending = [origin + "/sitemap.xml"],
    visited = new Set(),
    pages = new Set();
  while (pending.length) {
    const url = pending.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    const response = await request(url);
    const entry = { url, status: response.status, type: null, urls: 0 };
    report.sitemaps.push(entry);
    if (response.status !== 200) {
      report.errors.push(
        issue(
          "SITEMAP_UNAVAILABLE",
          "Sitemap did not return HTTP 200. Redirects are not followed.",
          { url, status: response.status },
        ),
      );
      continue;
    }
    let sitemap;
    try {
      sitemap = parseSitemap(response.text);
    } catch {
      report.errors.push(
        issue("INVALID_SITEMAP", "Response is not valid sitemap XML.", { url }),
      );
      continue;
    }
    Object.assign(entry, { type: sitemap.type, urls: sitemap.urls.length });
    for (const value of sitemap.urls) {
      const target = absoluteUrl(value);
      if (!target || target.origin !== origin || target.hash) {
        report.errors.push(
          issue(
            "UNSAFE_SITEMAP_URL",
            "Skipped an entry outside the selected origin or containing credentials or a fragment.",
            { url: safeUrl(value) },
          ),
        );
        continue;
      }
      if (sitemap.type === "index") pending.push(target.href);
      else pages.add(target.href);
    }
  }
  if (!pages.size)
    report.errors.push(
      issue("NO_PUBLIC_URLS", "No auditable page URLs were found."),
    );
  const queue = [...pages];
  let position = 0;
  await Promise.all(
    Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (position < queue.length) {
        const url = queue[position++];
        const response = await request(url);
        const page = {
          url: safeUrl(url),
          status: response.status,
          location: response.location ?? null,
          errors: [],
          warnings: [],
        };
        if (response.status !== 200)
          page.errors.push(
            issue(
              "HTTP_STATUS",
              "Page did not return HTTP 200. Redirects are not followed.",
            ),
          );
        else if (!response.contentType.includes("text/html"))
          page.errors.push(issue("NON_HTML_PAGE", "Expected an HTML page."));
        else
          Object.assign(
            page,
            auditHtml(response.text, url, response.xRobotsTag),
          );
        report.pages.push(page);
      }
    }),
  );
  report.pages.sort((a, b) => a.url.localeCompare(b.url));
  for (const [field, code] of [
    ["title", "DUPLICATE_TITLE"],
    ["canonical", "DUPLICATE_CANONICAL"],
  ]) {
    const seen = new Map();
    for (const page of report.pages) {
      if (!page[field]) continue;
      const urls = seen.get(page[field]) ?? [];
      urls.push(page.url);
      seen.set(page[field], urls);
    }
    for (const urls of seen.values())
      if (urls.length > 1)
        report[field === "canonical" ? "errors" : "warnings"].push(
          issue(code, `Multiple sitemap pages share a ${field}.`, { urls }),
        );
  }
  report.summary = {
    pages: report.pages.length,
    errors:
      report.errors.length +
      report.pages.reduce((sum, page) => sum + page.errors.length, 0),
    warnings:
      report.warnings.length +
      report.pages.reduce((sum, page) => sum + page.warnings.length, 0),
  };
  report.summary.passed = report.summary.errors === 0;
  return report;
}

export async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.help) {
    console.log(
      "Usage: node scripts/seo-audit.mjs [--origin https://tensorcraft.app] [--output report.json]",
    );
    return 0;
  }
  const report = await auditSite(options);
  if (options.output) {
    await mkdir(path.dirname(path.resolve(options.output)), {
      recursive: true,
    });
    await writeFile(options.output, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(
    `HTTP smoke check: ${report.summary.pages} pages, ${report.summary.errors} errors, ${report.summary.warnings} warnings.`,
  );
  for (const entry of [report, ...report.pages])
    for (const error of entry.errors)
      console.log(
        `ERROR ${error.code}${entry.url ? " " + entry.url : ""}: ${error.message}`,
      );
  if (options.output) console.log(`Report saved to ${options.output}`);
  return report.summary.passed ? 0 : 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch(() => {
      console.error(
        "HTTP check failed. Check the origin, arguments, and output path.",
      );
      process.exitCode = 1;
    });
}
