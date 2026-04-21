/**
 * PostHog client initialization — EU instance (GDPR compliance).
 *
 * Initialization rules:
 * - Only initializes on the client (no-op on server).
 * - Only initializes when `NEXT_PUBLIC_POSTHOG_KEY` is present — dev/preview
 *   environments without a key get a silent no-op.
 * - Host defaults to `https://eu.posthog.com`; override via
 *   `NEXT_PUBLIC_POSTHOG_HOST`. EU host is mandatory for data residency.
 *
 * The actual capture guard lives in `apps/web/lib/analytics.ts` which is
 * consent-gated; this module only handles init.
 */

import posthog, { type PostHog } from "posthog-js";

const DEFAULT_HOST = "https://eu.posthog.com";

let initialized = false;

export function initPostHog(): PostHog | null {
  if (typeof window === "undefined") return null;
  if (initialized) return posthog;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || DEFAULT_HOST;

  // Skip gracefully when no key is configured (dev/preview).
  if (!key) return null;

  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    persistence: "localStorage+cookie",
    autocapture: false,
    capture_performance: { web_vitals: true },
  });

  initialized = true;
  return posthog;
}

/**
 * Capture a product event. No-ops when PostHog is not initialized
 * (e.g., dev without a key, server-side, or before init runs).
 */
export function capture(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function isInitialized(): boolean {
  return initialized;
}

/** Test-only: reset module state between tests. */
export function __resetForTests(): void {
  initialized = false;
}
