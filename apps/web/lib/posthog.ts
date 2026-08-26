/**
 * PostHog client initialization. This module is called from the consent-gated
 * AnalyticsProvider, so the browser singleton is initialized only after the
 * visitor grants analytics consent.
 */

import posthog, { type PostHog } from "posthog-js";

let initialized = false;
let pendingIdentity:
  | { distinctId: string; personProperties?: Record<string, unknown> }
  | undefined;

function requirePostHogEnv(
  name: string,
  value: string | undefined,
): value is string {
  if (value) return true;

  if (process.env.NODE_ENV !== "production") {
    throw new Error(
      `${name} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${name} is configured`,
    );
  }

  return false;
}

export function initPostHog(): PostHog | null {
  if (typeof window === "undefined") return null;
  if (initialized) return posthog;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (
    !requirePostHogEnv("NEXT_PUBLIC_POSTHOG_KEY", key) ||
    !requirePostHogEnv("NEXT_PUBLIC_POSTHOG_HOST", host)
  ) {
    return null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const tracingHeaders = apiUrl ? [new URL(apiUrl).hostname] : undefined;

  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    persistence: "localStorage+cookie",
    tracing_headers: tracingHeaders,
    capture_performance: { web_vitals: true },
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  });

  initialized = true;
  if (pendingIdentity) {
    posthog.identify(
      pendingIdentity.distinctId,
      pendingIdentity.personProperties,
    );
    pendingIdentity = undefined;
  }
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

export function identify(
  distinctId: string,
  personProperties?: Record<string, unknown>,
): void {
  if (!initialized) {
    pendingIdentity = { distinctId, personProperties };
    return;
  }
  posthog.identify(distinctId, personProperties);
}

/** Clear the persisted identity when a user signs out. */
export function reset(): void {
  pendingIdentity = undefined;
  if (!initialized) return;
  posthog.reset();
}

export function isInitialized(): boolean {
  return initialized;
}

/** Test-only: reset module state between tests. */
export function __resetForTests(): void {
  initialized = false;
  pendingIdentity = undefined;
}
