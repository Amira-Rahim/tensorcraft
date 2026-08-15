#!/usr/bin/env node
/**
 * Wrapper that triggers the weekly digest send via the admin API.
 *
 * Run:
 *   pnpm tsx scripts/news/send-newsletter.mjs --week=2026-W18
 *   pnpm tsx scripts/news/send-newsletter.mjs --week=2026-W18 --dry-run
 *
 * Required env:
 *   API_URL - e.g. https://api.tensorcraft.app  (defaults to http://localhost:8787)
 *   ADMIN_API_KEY - matches api server's ADMIN_API_KEY env
 */
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const week = args.week;
if (!week) {
  console.error("[send] pass --week=YYYY-Www");
  process.exit(1);
}
const dryRun = !!args["dry-run"];
const apiUrl = process.env.API_URL || "http://localhost:8787";
const adminKey = process.env.ADMIN_API_KEY;
if (!adminKey) {
  console.error("[send] ADMIN_API_KEY missing");
  process.exit(1);
}

const res = await fetch(`${apiUrl}/api/admin/newsletter/send`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-admin-key": adminKey,
  },
  body: JSON.stringify({ weekIso: week, dryRun }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`[send] HTTP ${res.status}: ${body}`);
  process.exit(1);
}
console.log(body);
