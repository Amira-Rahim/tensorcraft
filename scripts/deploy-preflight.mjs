#!/usr/bin/env node
/**
 * Deploy preflight: required runtime env vs Fly secrets.
 *
 * The migration gate (scripts/migration-status.mjs) cannot see runtime env,
 * so on 2026-07-25 a green deploy-api.yml run shipped an image that
 * crash-looped to Fly's max restart count on two missing secrets
 * (CERT_SIGNING_SECRET, KIT_WEBHOOK_SECRET) - a ~20 minute 502 outage a
 * name-diff would have caught before flyctl ran. This script is that diff:
 *
 *   node scripts/deploy-preflight.mjs
 *
 * Required names come from apps/api/src/env.ts (ALWAYS_REQUIRED +
 * PROD_REQUIRED - the image bakes NODE_ENV=production, so both tiers
 * apply). The lists are regex-parsed from source rather than imported to
 * keep this runnable with bare node in CI; the drift-guard test in
 * apps/api/src/__tests__/deploy-preflight.test.ts pins the parse against
 * the real exports. Available names come from `flyctl secrets list --json`
 * plus any fly.toml [env] keys and Dockerfile ENV keys (names only -
 * secret VALUES are never read).
 *
 * Exit codes match migration-status.mjs: 0 = all present, 1 = missing
 * (blocks deploy), 2 = usage/connection error (fail-closed, R3-9: a gate
 * that cannot check must not pass).
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_TS = join(REPO, "apps/api/src/env.ts");
const FLY_TOML = join(REPO, "apps/api/fly.toml");
const DOCKERFILE = join(REPO, "apps/api/Dockerfile");
const APP = process.env.FLY_APP || "tensorcraft-api";

/** Extract ALWAYS_REQUIRED + PROD_REQUIRED name arrays from env.ts source. */
export function parseRequiredVars(source) {
  const out = {};
  for (const list of ["ALWAYS_REQUIRED", "PROD_REQUIRED"]) {
    const m = source.match(new RegExp(`const ${list}\\s*=\\s*\\[([^\\]]*)\\]`));
    if (!m) throw new Error(`Could not find ${list} in apps/api/src/env.ts`);
    out[list] = [...m[1].matchAll(/"([A-Z][A-Z0-9_]*)"/g)].map((x) => x[1]);
    if (out[list].length === 0)
      throw new Error(`${list} parsed to zero names - parser drift?`);
  }
  return out;
}

/** Keys of a fly.toml [env] section (names set as plain env, not secrets). */
export function parseFlyTomlEnvKeys(toml) {
  const start = toml.search(/^\[env\]\s*$/m);
  if (start === -1) return [];
  const rest = toml.slice(start + "[env]".length);
  const nextSection = rest.search(/^\[/m);
  const body = nextSection === -1 ? rest : rest.slice(0, nextSection);
  return [...body.matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=/gm)].map((x) => x[1]);
}

/** Keys baked into the image via Dockerfile ENV. */
export function parseDockerfileEnvKeys(dockerfile) {
  return [...dockerfile.matchAll(/^ENV\s+([A-Z][A-Z0-9_]*)=/gm)].map(
    (x) => x[1],
  );
}

/** Pure diff: required names not covered by any available source. */
export function missingSecrets(required, available) {
  const have = new Set(available);
  return required.filter((name) => !have.has(name));
}

function main() {
  const { ALWAYS_REQUIRED, PROD_REQUIRED } = parseRequiredVars(
    readFileSync(ENV_TS, "utf8"),
  );
  const required = [...ALWAYS_REQUIRED, ...PROD_REQUIRED];

  let secretNames;
  try {
    const raw = execFileSync(
      "flyctl",
      ["secrets", "list", "--app", APP, "--json"],
      { encoding: "utf8" },
    );
    secretNames = JSON.parse(raw).map((s) => s.Name ?? s.name);
  } catch (err) {
    console.error(
      `\n  ERROR  could not list Fly secrets for '${APP}': ${err.message}\n` +
        `  A gate that cannot check must not pass (R3-9) - failing closed.\n`,
    );
    process.exit(2);
  }

  const available = [
    ...secretNames,
    ...parseFlyTomlEnvKeys(readFileSync(FLY_TOML, "utf8")),
    ...parseDockerfileEnvKeys(readFileSync(DOCKERFILE, "utf8")),
  ];
  const missing = missingSecrets(required, available);

  console.log(`\n  Deploy preflight (${APP})`);
  console.log(`  ------------------------`);
  console.log(`  required (env.ts) : ${required.length}`);
  console.log(
    `  available sources : ${available.length} names (secrets + fly.toml [env] + Dockerfile ENV)`,
  );

  if (missing.length === 0) {
    console.log(`\n  OK - every required runtime var is provided.\n`);
    process.exit(0);
  }

  console.log(`\n  MISSING - the API will crash-loop at boot without these:`);
  for (const name of missing) console.log(`    ${name}`);
  console.log(
    `\n  Set them before deploying:\n` +
      `    grep '^NAME=' apps/api/.env | flyctl secrets import --app ${APP}\n` +
      `  (see apps/api/.env.example for how each value is generated)\n`,
  );
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
