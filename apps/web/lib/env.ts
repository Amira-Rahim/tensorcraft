/**
 * Startup env assertion for the web app (Tier 1-OPS "env-var hygiene",
 * docs/post-launch-backlog.md). Mirrors apps/api/src/env.ts: plain TypeScript,
 * three tiers, fail LOUD at server boot instead of degrading silently at
 * the point of use. Called from instrumentation.ts (nodejs runtime only),
 * so a misconfigured deploy refuses to start rather than serving with
 * features silently off.
 *
 * Two deploy-surface notes:
 *  - Vercel sets NODE_ENV=production on preview deploys too, so the prod
 *    tier keys off VERCEL_ENV when present; previews without the full
 *    secret set stay bootable, the production environment does not.
 *  - Next may invoke instrumentation during `next build` (prerender
 *    workers); the assertion skips the build phase so a CI box without
 *    runtime secrets can still produce the artifact. Runtime boot asserts.
 */

export const ALWAYS_REQUIRED = [
  // Client Supabase: auth, progress, purchases. Nothing meaningful renders
  // without them, in any environment.
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export const PROD_REQUIRED = [
  // The RFC 8058 one-click unsubscribe route throws per-request without
  // the admin client. Under Gmail/Yahoo bulk-sender rules that is a
  // deliverability incident, not a cosmetic 500: fail at boot instead.
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  // getApiUrl() already throws per-request in production; move the
  // failure from first user click to deploy time.
  "NEXT_PUBLIC_API_URL",
] as const;

const WARN_IF_UNSET: ReadonlyArray<{ name: string; consequence: string }> = [
  {
    name: "NEXT_PUBLIC_POSTHOG_KEY",
    consequence:
      "product analytics OFF: the signup funnel is unobservable (Tier 1-OPS measurement gate)",
  },
  { name: "NEXT_PUBLIC_SENTRY_DSN", consequence: "error reporting is OFF" },
  {
    name: "SENTRY_AUTH_TOKEN",
    consequence:
      "source maps are not uploaded; production stack traces stay minified (build-time var, set in Vercel)",
  },
];

/** Throws on missing required vars; call once at server boot. */
export function assertWebEnv(): void {
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const isProdDeploy = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === "production"
    : process.env.NODE_ENV === "production";

  const missing: string[] = [];
  for (const name of ALWAYS_REQUIRED) {
    if (!process.env[name]) missing.push(name);
  }
  if (isProdDeploy) {
    for (const name of PROD_REQUIRED) {
      if (!process.env[name]) missing.push(name);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "See apps/web/.env.example and docs/deployment-guide.md.",
    );
  }

  for (const { name, consequence } of WARN_IF_UNSET) {
    if (!process.env[name]) {
      console.warn(`ENV: ${name} is unset; ${consequence}`);
    }
  }
}
