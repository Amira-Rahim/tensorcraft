import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { logger } from "../lib/logger";

/**
 * Third-party webhook endpoints that aren't Stripe.
 *
 * POST /api/webhooks/kit-bounce, receives bounce / complaint / unsubscribe
 * notifications from Kit (ConvertKit) Automations → Webhook action. See
 * docs/email-setup.md for the Kit-side wiring.
 *
 * Security:
 *   - Kit does not sign webhooks, so we require a shared secret in
 *     the `x-kit-webhook-secret` header (configured via
 *     `KIT_WEBHOOK_SECRET`). If the env var is unset we refuse every
 *     request with 503, failing closed, since "everyone can poison
 *     our logs" is worse than "Kit can't reach us."
 *   - We compare via `timingSafeEqual` to avoid timing oracles.
 *
 * Side-effects:
 *   - Logs the bounce via Pino so Fly log aggregation / Sentry gets a
 *     durable record (see §6h, deliverability monitoring).
 *   - Does NOT mutate the `profiles` row. Marking an email invalid is
 *     tracked as deferred work in docs/dev-plan.md §4e, requires a
 *     migration + UX for re-validating a bounced email.
 */
const webhooks = new Hono();

type KitBouncePayload = {
  subscriber?: {
    id?: number;
    email_address?: string;
    state?: string;
  };
  event?: {
    name?: string;
    created_at?: string;
  };
  reason?: string;
};

function constantTimeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

webhooks.post("/kit-bounce", async (c) => {
  const configured = process.env.KIT_WEBHOOK_SECRET;
  if (!configured) {
    logger.warn(
      { route: "webhooks.kit-bounce" },
      "KIT_WEBHOOK_SECRET not configured, rejecting",
    );
    return c.json({ error: "Webhook not configured" }, 503);
  }

  const header = c.req.header("x-kit-webhook-secret");
  if (!header || !constantTimeEquals(header, configured)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let payload: KitBouncePayload;
  try {
    payload = (await c.req.json()) as KitBouncePayload;
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const eventName = payload.event?.name ?? "bounce";
  const state = payload.subscriber?.state ?? null;
  const reason = payload.reason ?? null;

  // The raw address stays out of Fly logs (their retention is not ours
  // to control, and the logger redacts `email` keys anyway). Kit's
  // subscriber id is a stable correlator; the address itself lives in
  // the Kit dashboard, which is the system of record for bounces.
  logger.warn(
    {
      route: "webhooks.kit-bounce",
      event: eventName,
      subscriberId: payload.subscriber?.id ?? null,
      state,
      reason,
      requestId: c.res.headers.get("X-Request-Id"),
    },
    "Kit email bounce / complaint received",
  );

  // We acknowledge receipt regardless, Kit retries on non-2xx and we
  // don't want to double-log.
  return c.json({ received: true });
});

export { webhooks };
