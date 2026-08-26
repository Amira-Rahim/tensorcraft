/**
 * PostHog server-side client, EU instance (GDPR data residency).
 *
 * Used for server-emitted conversion events (payment_completed /
 * payment_failed from the Stripe webhook, etc.). Only constructs a
 * client when `POSTHOG_PROJECT_TOKEN` is set so dev/preview without credentials
 * is a complete no-op.
 *
 * Event names here must match the taxonomy in
 * `apps/web/lib/analytics-events.ts` (Appendix B of the dev plan).
 */

import { PostHog } from "posthog-node";

let client: PostHog | null = null;
let attempted = false;

export function getPostHog(): PostHog | null {
  if (attempted) return client;
  attempted = true;

  const key = process.env.POSTHOG_PROJECT_TOKEN;
  const host = process.env.POSTHOG_HOST;

  if (!key || !host) return null;

  client = new PostHog(key, {
    host,
    enableExceptionAutocapture: true,
    // Low flush delay suits our low-volume server events (webhooks).
    flushAt: 1,
    flushInterval: 1000,
  });

  return client;
}

/** Run authenticated request work in an identity context, including errors. */
export function withPostHogUserContext<T>(distinctId: string, fn: () => T): T {
  const ph = getPostHog();
  return ph ? ph.withContext({ distinctId }, fn) : fn();
}

export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): void {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
}

// ──────────────────────────────────────────────
// Typed server-side event helpers
// ──────────────────────────────────────────────

/**
 * Convenience alias matching the dev-plan spec name. Equivalent to
 * {@link captureServerEvent}, prefer this in new code.
 */
export function captureServer(
  event: ServerEventName,
  properties: ServerEventProperties[ServerEventName],
  distinctId: string,
): void {
  captureServerEvent(distinctId, event, properties as Record<string, unknown>);
}

/** Server-only events. Client events live in analytics-events.ts. */
export const SERVER_EVENTS = {
  PAYMENT_COMPLETED: "payment_completed",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_REFUNDED: "payment_refunded",
  PAYMENT_DISPUTED: "payment_disputed",
  CODE_PUSHED: "code_pushed",
} as const;

export type ServerEventName =
  (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];

export interface ServerEventProperties {
  [SERVER_EVENTS.PAYMENT_COMPLETED]: {
    planId: string;
    worldIds: string[];
    amount: number;
    sessionId: string;
    isUpgrade?: boolean;
  };
  [SERVER_EVENTS.PAYMENT_FAILED]: {
    planId?: string;
    reason?: string;
    sessionId?: string;
  };
  [SERVER_EVENTS.PAYMENT_REFUNDED]: {
    paymentIntentId: string;
    isFullRefund: boolean;
  };
  [SERVER_EVENTS.PAYMENT_DISPUTED]: {
    paymentIntentId: string;
  };
  [SERVER_EVENTS.CODE_PUSHED]: {
    worldId: string;
    lessonId: string;
    exerciseSlug: string;
    commitSha: string;
  };
}

/** Flush pending events, call before process exit. */
export async function shutdownPostHog(): Promise<void> {
  if (!client) return;
  await client.shutdown();
  client = null;
  attempted = false;
}

/** Test-only: reset module state between tests. */
export function __resetForTests(): void {
  client = null;
  attempted = false;
}
