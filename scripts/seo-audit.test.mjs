import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
import { auditHtml, auditSite, parseArgs } from "./seo-audit.mjs";

const SITE = "https://tensorcraft.app";
const run = promisify(execFile);
const script = fileURLToPath(new URL("./seo-audit.mjs", import.meta.url));
const page = (url, title = "Tensor shapes") => `<title>${title}</title>
  <meta name="description" content="Tensor shapes in JavaScript.">
  <link rel="canonical" href="${url}"><meta property="og:url" content="${url}">
  <script type="application/ld+json">{"@type":"TechArticle"}</script><h1>${title}</h1>`;

async function serve(t, handler) {
  let origin;
  const server = createServer((req, res) => {
    if (req.url === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      return res.end("User-agent: *\nAllow: /\n");
    }
    handler(req, res, origin);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return origin;
}

function respond(res, content, type = "text/html") {
  res.writeHead(200, { "content-type": type });
  res.end(content);
}
const sitemap = (base, paths) =>
  `<urlset>${paths.map((p) => `<url><loc>${base}${p}</loc></url>`).join("")}</urlset>`;

test("checks actual metadata and ignores apparent tags inside scripts", () => {
  const html =
    page(SITE + "/guide") +
    `<script>const fake = '<meta name="robots" content="noindex"><link rel="canonical" href="/fake">';</script>`;
  assert.deepEqual(auditHtml(html, SITE + "/guide").errors, []);
  const result = auditHtml(
    html.replace(SITE + "/guide", "/wrong") +
      '<meta name="robots" content="noindex"><script type="application/ld+json">broken</script>',
    SITE + "/guide",
    "googlebot: noindex",
  );
  assert.deepEqual(result.errors.map((item) => item.code).sort(), [
    "HEADER_NOINDEX",
    "INVALID_CANONICAL",
    "META_NOINDEX",
  ]);
  assert.ok(result.warnings.some((item) => item.code === "INVALID_JSON_LD"));
  assert.deepEqual(
    auditHtml(html, SITE + "/guide", "gptbot: noindex").errors,
    [],
  );
  assert.equal("bodyWords" in result, false);
});

test("reads namespaced sitemap indexes and escaped URLs with at most three page requests", async (t) => {
  let active = 0,
    maxActive = 0;
  const origin = await serve(t, (req, res, base) => {
    if (req.url === "/sitemap.xml")
      return respond(
        res,
        `<sitemapindex><sitemap><loc>${base}/pages.xml</loc></sitemap></sitemapindex>`,
        "application/xml",
      );
    if (req.url === "/pages.xml")
      return respond(
        res,
        `<sm:urlset xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${Array.from({ length: 7 }, (_, i) => `<sm:url><image:loc>https://cdn.example/art.webp</image:loc><sm:loc>${base}/guide-${i}?a=1&amp;b=2</sm:loc></sm:url>`).join("")}</sm:urlset>`,
        "application/xml",
      );
    active++;
    maxActive = Math.max(active, maxActive);
    setTimeout(() => {
      active--;
      respond(res, page(base + req.url, req.url));
    }, 15);
  });
  const report = await auditSite({ origin });
  assert.equal(report.summary.pages, 7);
  assert.equal(report.summary.errors, 0);
  assert.equal(maxActive, 3);
  assert.equal(report.sitemaps.length, 2);
  assert.equal(report.robots.policy, "User-agent: *\nAllow: /");
  assert.equal("crawlAccess" in report.pages[0], false);
});

test("never fetches off-origin entries, credential URLs, or redirect targets", async (t) => {
  let externalRequests = 0;
  const external = await serve(t, (_req, res) => {
    externalRequests++;
    res.end("unexpected");
  });
  const origin = await serve(t, (req, res, base) => {
    if (req.url === "/sitemap.xml")
      return respond(
        res,
        `<urlset><url><loc>${external}/outside</loc></url><url><loc>${base.replace("://", "://private:password@")}/secret</loc></url><url><loc>${base}/redirect</loc></url></urlset>`,
        "application/xml",
      );
    res.writeHead(302, { location: external + "/target?token=secret" });
    res.end();
  });
  const report = await auditSite({ origin });
  assert.equal(externalRequests, 0);
  assert.equal(report.summary.pages, 1);
  assert.equal(
    report.errors.filter((item) => item.code === "UNSAFE_SITEMAP_URL").length,
    2,
  );
  assert.ok(report.pages[0].errors.some((item) => item.code === "HTTP_STATUS"));
  assert.ok(!JSON.stringify(report).includes("password"));
  assert.ok(!JSON.stringify(report).includes("token=secret"));
  const indexOrigin = await serve(t, (_req, res) =>
    respond(
      res,
      `<sitemapindex><sitemap><loc>${external}/sitemap.xml</loc></sitemap></sitemapindex>`,
      "application/xml",
    ),
  );
  assert.ok(
    (await auditSite({ origin: indexOrigin })).errors.some(
      (item) => item.code === "UNSAFE_SITEMAP_URL",
    ),
  );
  assert.equal(externalRequests, 0);
});

test("reports canonical conflicts, duplicate titles, and indexing directives", async (t) => {
  const origin = await serve(t, (req, res, base) => {
    if (req.url === "/sitemap.xml")
      return respond(
        res,
        sitemap(base, ["/guide", "/other"]),
        "application/xml",
      );
    res.writeHead(200, {
      "content-type": "text/html",
      "x-robots-tag": req.url === "/other" ? "noindex" : "",
    });
    res.end(page(base + "/guide"));
  });
  const report = await auditSite({ origin });
  assert.ok(report.errors.some((item) => item.code === "DUPLICATE_CANONICAL"));
  assert.ok(report.warnings.some((item) => item.code === "DUPLICATE_TITLE"));
  const other = report.pages.find((item) => item.url.endsWith("/other"));
  assert.deepEqual(other.errors.map((item) => item.code).sort(), [
    "CANONICAL_MISMATCH",
    "HEADER_NOINDEX",
  ]);
  assert.equal(report.summary.passed, false);
});

test("rejects malformed sitemap XML and non-HTML page responses", async (t) => {
  let malformed = true;
  const origin = await serve(t, (req, res, base) => {
    if (req.url === "/sitemap.xml")
      return respond(
        res,
        malformed ? "<urlset><url>" : sitemap(base, ["/guide"]),
        "application/xml",
      );
    respond(res, "{}", "application/json");
  });
  assert.ok(
    (await auditSite({ origin })).errors.some(
      (item) => item.code === "INVALID_SITEMAP",
    ),
  );
  malformed = false;
  assert.ok(
    (await auditSite({ origin })).pages[0].errors.some(
      (item) => item.code === "NON_HTML_PAGE",
    ),
  );
});

test("requires a plain HTTP origin without credentials or a path", () => {
  assert.equal(parseArgs([]).origin, SITE);
  for (const value of [
    "https://user:secret@example.com",
    SITE + "/private",
    "file:///tmp/test",
  ])
    assert.throws(() => parseArgs(["--origin", value]));
  assert.throws(() => parseArgs(["--output"]));
});

test("CLI writes JSON, allows warnings, and fails when a hard check fails", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "tensorcraft-http-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let noindex = false;
  const origin = await serve(t, (req, res, base) => {
    if (req.url === "/sitemap.xml")
      return respond(res, sitemap(base, ["/guide"]), "application/xml");
    res.writeHead(200, {
      "content-type": "text/html",
      "x-robots-tag": noindex ? "noindex" : "",
    });
    res.end(
      page(base + "/guide").replace(
        '<meta name="description" content="Tensor shapes in JavaScript.">',
        "",
      ),
    );
  });
  const output = path.join(directory, "report.json");
  const args = [script, "--origin", origin, "--output", output];
  assert.match(
    (await run(process.execPath, args)).stdout,
    /HTTP smoke check: 1 pages, 0 errors, 1 warnings/,
  );
  assert.equal(JSON.parse(await readFile(output, "utf8")).summary.passed, true);
  noindex = true;
  await assert.rejects(
    run(process.execPath, args),
    (error) => error.code === 1 && error.stdout.includes("HEADER_NOINDEX"),
  );
  assert.equal(
    JSON.parse(await readFile(output, "utf8")).summary.passed,
    false,
  );
});
