/**
 * Drift guard for scripts/deploy-preflight.mjs.
 *
 * The preflight script regex-parses env.ts source (so bare node can run it
 * in the deploy workflow) instead of importing the module. These tests pin
 * that parse against the REAL exported arrays: rename or restructure the
 * lists in env.ts and this fails before a deploy ever trusts a stale parse.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  missingSecrets,
  parseDockerfileEnvKeys,
  parseFlyTomlEnvKeys,
  parseRequiredVars,
} from "../../../../scripts/deploy-preflight.mjs";
import { ALWAYS_REQUIRED, PROD_REQUIRED } from "../env";

const API_DIR = join(__dirname, "..", "..");

describe("deploy-preflight parser", () => {
  const parsed = parseRequiredVars(
    readFileSync(join(API_DIR, "src/env.ts"), "utf8"),
  );

  it("parses ALWAYS_REQUIRED exactly as env.ts exports it", () => {
    expect(parsed.ALWAYS_REQUIRED).toEqual([...ALWAYS_REQUIRED]);
  });

  it("parses PROD_REQUIRED exactly as env.ts exports it", () => {
    expect(parsed.PROD_REQUIRED).toEqual([...PROD_REQUIRED]);
  });

  it("throws when a list is missing (renamed lists must break loudly)", () => {
    expect(() => parseRequiredVars("const OTHER = []")).toThrow(
      /Could not find ALWAYS_REQUIRED/,
    );
  });

  it("does not pick up comment text inside the array blocks", () => {
    for (const name of [...parsed.ALWAYS_REQUIRED, ...parsed.PROD_REQUIRED]) {
      expect(name).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });
});

describe("deploy-preflight available-env sources", () => {
  it("reads Dockerfile ENV keys (NODE_ENV is baked into the image)", () => {
    const keys = parseDockerfileEnvKeys(
      readFileSync(join(API_DIR, "Dockerfile"), "utf8"),
    );
    expect(keys).toContain("NODE_ENV");
  });

  it("returns [] for a fly.toml without an [env] section (current state)", () => {
    const keys = parseFlyTomlEnvKeys(
      readFileSync(join(API_DIR, "fly.toml"), "utf8"),
    );
    expect(keys).toEqual([]);
  });

  it("parses [env] keys when the section exists", () => {
    const toml = `app = "x"\n[env]\n  FOO_BAR = "1"\n  BAZ = "2"\n\n[http_service]\n  internal_port = 3001\n`;
    expect(parseFlyTomlEnvKeys(toml)).toEqual(["FOO_BAR", "BAZ"]);
  });
});

describe("deploy-preflight diff", () => {
  it("reports required names absent from every source", () => {
    expect(missingSecrets(["A", "B", "C"], ["A", "EXTRA"])).toEqual(["B", "C"]);
  });

  it("passes when extras exist beyond the required set", () => {
    expect(missingSecrets(["A"], ["A", "B", "C"])).toEqual([]);
  });

  it("would have caught the 2026-07-25 outage", () => {
    const secretsBeforeIncident = [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "APP_URL",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ];
    expect(
      missingSecrets(
        [...ALWAYS_REQUIRED, ...PROD_REQUIRED],
        secretsBeforeIncident,
      ),
    ).toEqual(["CERT_SIGNING_SECRET", "KIT_WEBHOOK_SECRET"]);
  });
});
