#!/usr/bin/env node
/**
 * Migration status / drift check.
 *
 * Diffs the migration FILES on disk against the `schema_migrations` LEDGER in
 * the database. Answers the question that was previously unanswerable: "what
 * is the production schema state?" (see
 * docs/audits/scalability-architecture-2026-07-21.md, Tier 0).
 *
 *   node scripts/migration-status.mjs
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the environment (same as
 * the admin client). Without them it runs in OFFLINE mode and only lists the
 * files on disk, which is still useful for authoring.
 *
 * Exit codes: 0 = in sync (or offline), 1 = drift detected (pending or unknown
 * migrations), 2 = usage/connection error. CI can gate on this.
 */
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "packages", "supabase", "migrations");

/** Parse `NNN_name.sql` (ignoring `.down.sql`, templates, and non-SQL). */
function readMigrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.*\.sql$/.test(f) && !f.endsWith(".down.sql"))
    .map((f) => {
      const version = parseInt(f.slice(0, 3), 10);
      const name = f.slice(4).replace(/\.sql$/, "");
      return { version, name, file: f };
    })
    .sort((a, b) => a.version - b.version);
}

async function fetchLedger() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // offline mode

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("schema_migrations")
    .select("version, name, applied_at")
    .order("version");
  if (error) {
    // The ledger itself may not exist yet (migration 042 unapplied).
    throw new Error(
      `Could not read schema_migrations: ${error.message}. ` +
        `If migration 042 has not been applied, apply it first.`,
    );
  }
  return data ?? [];
}

function pad(v) {
  return String(v).padStart(3, "0");
}

async function main() {
  const files = readMigrationFiles();

  let ledger;
  try {
    ledger = await fetchLedger();
  } catch (err) {
    console.error(`\n  ERROR  ${err.message}\n`);
    process.exit(2);
  }

  if (ledger === null) {
    console.log(
      `\n  OFFLINE (no SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY set).\n` +
        `  ${files.length} migration files on disk (001..${pad(files.at(-1)?.version ?? 0)}).\n` +
        `  Set the env vars to diff against the live ledger.\n`,
    );
    process.exit(0);
  }

  const appliedVersions = new Set(ledger.map((r) => r.version));
  const fileVersions = new Set(files.map((m) => m.version));

  const pending = files.filter((m) => !appliedVersions.has(m.version));
  const unknown = ledger.filter((r) => !fileVersions.has(r.version));

  console.log(`\n  Migration status`);
  console.log(`  ----------------`);
  console.log(`  files on disk : ${files.length}`);
  console.log(`  applied (ledger): ${ledger.length}`);

  if (pending.length === 0 && unknown.length === 0) {
    console.log(`\n  IN SYNC — every file is applied, no orphan ledger rows.\n`);
    process.exit(0);
  }

  if (pending.length > 0) {
    console.log(`\n  PENDING (on disk, not applied) — apply these in order:`);
    for (const m of pending) console.log(`    ${pad(m.version)}  ${m.file}`);
  }
  if (unknown.length > 0) {
    console.log(
      `\n  UNKNOWN (in ledger, no file) — investigate; someone edited history:`,
    );
    for (const r of unknown) console.log(`    ${pad(r.version)}  ${r.name}`);
  }
  console.log("");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
