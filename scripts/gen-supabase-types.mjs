#!/usr/bin/env node
/**
 * Regenerate packages/supabase/src/types.ts from the live database schema.
 *
 *   DATABASE_URL=postgres://... pnpm gen:types
 *
 * Reads DATABASE_URL from the environment (same convention as
 * scripts/migration-status.mjs; the value lives in apps/api/.env). Requires
 * direct Postgres access, not the REST URL.
 *
 * Why not `supabase gen types typescript --db-url`? Current CLI versions run
 * the introspection inside a Docker container and fail on machines without a
 * container runtime. The CLI's container just runs @supabase/postgres-meta,
 * so this script calls that library directly: same introspection, same
 * TypeScript template, no Docker.
 *
 * PGRST_VERSION overrides the PostgrestVersion stamped into the generated
 * `__InternalSupabase` block (default "14.1", the project's PostgREST version;
 * supabase-js reads it to pick protocol-dependent typings). Check the current
 * value at $SUPABASE_URL/rest/v1/ (info.version) after platform upgrades.
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { PostgresMeta } from "@supabase/postgres-meta";
import { getGeneratorMetadata } from "@supabase/postgres-meta/dist/lib/generators.js";
import { generateTypes } from "./supabase-typegen.mjs";

const OUT_FILE = "packages/supabase/src/types.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. It lives in apps/api/.env; run:\n" +
      "  DATABASE_URL=\"$(grep -m1 '^DATABASE_URL=' apps/api/.env | cut -d= -f2-)\" pnpm gen:types",
  );
  process.exit(2);
}
const postgrestVersion = process.env.PGRST_VERSION || "14.1";

const pgMeta = new PostgresMeta({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  application_name: "tensorcraft-typegen",
});

const { data, error } = await getGeneratorMetadata(pgMeta, {
  includedSchemas: ["public"],
  excludedSchemas: [],
});
if (error) {
  console.error("introspection failed:", error.message ?? error);
  process.exit(1);
}

const generated = await generateTypes(data, postgrestVersion);

const header = `/**
 * Tensorcraft Database Types (GENERATED FILE, do not edit by hand)
 *
 * Regenerate after applying migrations:
 *   DATABASE_URL=... pnpm gen:types
 * See scripts/gen-supabase-types.mjs for details.
 */

`;

// Manual compatibility export: consumers (admin.ts, index.ts) import UserRole
// by name; the generator only emits it as a Database enum.
const footer = `
export type UserRole = Database["public"]["Enums"]["user_role"];
`;

writeFileSync(OUT_FILE, header + generated + footer);
execSync(`pnpm prettier --write ${OUT_FILE}`, { stdio: "inherit" });
console.log(`wrote ${OUT_FILE} (PostgrestVersion ${postgrestVersion})`);
process.exit(0);
