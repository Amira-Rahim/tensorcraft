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
import { logger } from "./logger";
import { hasServerAnalyticsConsent } from "./analytics-consent";

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
    // Process-wide exceptions cannot establish the affected user's consent.
    // Sentry remains the API's separate operational error monitor.
    enableExceptionAutocapture: false,
    // Low flush delay suits our low-volume server events (webhooks).
    flushAt: 1,
    flushInterval: 1000,
  });
  client.on("error", (error) => {
    // SDK errors can contain request bodies or credentials. Log only the type.
    logger.warn(
      { errorType: error instanceof Error ? error.name : "unknown" },
      "PostHog server event delivery failed",
    );
  });

  return client;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    if (!process.env.POSTHOG_PROJECT_TOKEN || !process.env.POSTHOG_HOST) return;
    // Read at capture time. A checkout-time snapshot would miss a withdrawal
    // before a delayed settlement, refund or dispute webhook arrives.
    if (!(await hasServerAnalyticsConsent(distinctId))) return;
    const ph = getPostHog();
    if (!ph) return;
    ph.capture({ distinctId, event, properties });
  } catch (error) {
    // Payment fulfillment must survive an analytics failure.
    logger.warn(
      { errorType: error instanceof Error ? error.name : "unknown" },
      "PostHog server event capture failed",
    );
  }
}

// ──────────────────────────────────────────────
// Typed server-side event helpers
// ──────────────────────────────────────────────

/**
 * Convenience alias. Equivalent to
 * {@link captureServerEvent}, prefer this in new code.
 */
export function captureServer(
  event: ServerEventName,
  properties: ServerEventProperties[ServerEventName],
  distinctId: string,
): Promise<void> {
  return captureServerEvent(
    distinctId,
    event,
    properties as Record<string, unknown>,
  );
}

/** Server-only events. Client events live in analytics-events.ts. */
export const SERVER_EVENTS = {
  PAYMENT_COMPLETED: "payment_completed",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_REFUNDED: "payment_refunded",
  PAYMENT_DISPUTED: "payment_disputed",
  PURCHASE_ACCESS_GRANTED: "purchase_access_granted",
  CODE_PUSHED: "code_pushed",
} as const;

export type ServerEventName =
  (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];

export interface ServerEventProperties {
  [SERVER_EVENTS.PAYMENT_COMPLETED]: {
    planId: string;
    worldIds: string[];
    /** Legacy USD dollars. Use currency and amountMinor for payment reporting. */
    amount: number | null;
    sessionId: string;
    isUpgrade?: boolean;
    eventSource: "stripe_webhook";
    analyticsVersion: 2;
    stripeEventId: string | null;
    paymentIntentId: string | null;
    amountMinor: number | null;
    currency: string | null;
    livemode: boolean | null;
    paymentKind: "cash" | "no_charge" | "unknown";
  };
  [SERVER_EVENTS.PAYMENT_FAILED]: {
    planId?: string;
    reason?: string;
    sessionId?: string;
  };
  [SERVER_EVENTS.PAYMENT_REFUNDED]: {
    paymentIntentId: string;
    isFullRefund: boolean;
    sessionId: string | null;
    chargeId: string | null;
    stripeEventId: string | null;
    eventSource: "stripe_webhook";
    analyticsVersion: 2;
    currency: string | null;
    livemode: boolean | null;
    /** Cumulative amount refunded on this charge, in its minor units. */
    amountRefundedMinor: number | null;
  };
  [SERVER_EVENTS.PAYMENT_DISPUTED]: {
    paymentIntentId: string;
  };
  [SERVER_EVENTS.PURCHASE_ACCESS_GRANTED]: {
    planId: string;
    worldIds: string[];
    grantId: string;
    reason: "upgrade_credit";
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
  const activeClient = client;
  client = null;
  attempted = false;
  await activeClient.shutdown();
}

/** Test-only: reset module state between tests. */
export function __resetForTests(): void {
  client = null;
  attempted = false;
}
