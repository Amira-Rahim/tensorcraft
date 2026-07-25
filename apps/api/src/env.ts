/**
 * Startup env assertion (Tier 1-OPS, fresh-eyes T-item "env.ts").
 *
 * There was NO env validation anywhere — every var was read ad-hoc at point
 * of use, so misconfiguration surfaced as a silently disabled feature
 * discovered by a user not receiving something (full-audit §4). This module
 * fails LOUD at boot instead. Plain TypeScript on purpose: the env surface
 * is flat strings; zod would add a dependency for no expressive gain.
 *
 * Three tiers:
 *  - ALWAYS_REQUIRED  → throw at boot in every environment. The API cannot
 *    serve a single meaningful request without them.
 *  - PROD_REQUIRED    → throw at boot when NODE_ENV=production. Locally
 *    their absence is a legitimate dev mode.
 *  - WARN_IF_UNSET    → log one loud warning per var naming the EXACT
 *    feature that is silently off. Never throws: these degrade, and
 *    degrading beats an outage — but degrading silently is how the R2-era
 *    misconfigurations shipped.
 */

import { logger } from "./lib/logger";

// Exported for scripts/deploy-preflight.mjs's drift-guard test: the deploy
// workflow diffs these names against `flyctl secrets list` before deploying.
export const ALWAYS_REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

export const PROD_REQUIRED = [
  // payments.checkout throws per-request without it; fail at boot instead.
  "APP_URL",
  // Certificate issuance 500s fail-closed without it — the capstone payoff.
  "CERT_SIGNING_SECRET",
  // Kit bounce webhook 503s fail-closed without it.
  "KIT_WEBHOOK_SECRET",
  // Unset, rate limiting + JWT cache + issue-flood control are SILENTLY
  // DISABLED (every call site catches) — a security degradation no
  // production deploy should start in.
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

const WARN_IF_UNSET: ReadonlyArray<{ name: string; consequence: string }> = [
  { name: "RESEND_API_KEY", consequence: "digest + issue emails are OFF" },
  { name: "KIT_API_KEY", consequence: "Kit lifecycle tagging is OFF" },
  { name: "KIT_API_SECRET", consequence: "Kit unsubscribe sync is OFF" },
  {
    name: "STRIPE_TAX_ENABLED",
    consequence:
      "checkout collects NO TAX (legal exposure R2-4/R3-3; set 'true' only after Stripe dashboard Tax setup + migration 047)",
  },
  { name: "SENTRY_DSN", consequence: "API error reporting is OFF" },
  {
    name: "KIT_TAG_PAYWALL_HIT",
    consequence: "paywall-hit tagging skips (recoverable, R2-7)",
  },
  {
    name: "KIT_TAG_MODULE_1_COMPLETE",
    consequence: "module-1-complete tagging skips (recoverable, R2-7)",
  },
];

/** Throws on missing required vars; call once at boot, before serving. */
export function assertEnv(): void {
  const missing: string[] = [];

  for (const name of ALWAYS_REQUIRED) {
    if (!process.env[name]) missing.push(name);
  }
  if (process.env.NODE_ENV === "production") {
    for (const name of PROD_REQUIRED) {
      if (!process.env[name]) missing.push(name);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "See apps/api/.env.example and docs/deployment-guide.md.",
    );
  }

  for (const { name, consequence } of WARN_IF_UNSET) {
    if (!process.env[name]) {
      logger.warn({ envVar: name }, `ENV: ${name} is unset — ${consequence}`);
    }
  }
}
