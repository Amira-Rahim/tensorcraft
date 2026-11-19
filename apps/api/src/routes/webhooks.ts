import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";
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
 *     durable record (see docs/observability.md).
 *   - Suppression events disable waitlist subscription and profile email
 *     preferences. An explicit invalid-email state and re-validation UX
 *     remain deferred in ROADMAP.md.
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

/**
 * Whether a Kit event means "stop emailing this address".
 *
 * Kit is the system of record for bounces and complaints, but the weekly
 * digest is sent from OUR side off `waitlist.subscribed`. Until 2026-08-23
 * this handler only logged, so someone who unsubscribed from a Kit email
 * kept receiving the digest. That is how a complaint turns into a
 * deliverability problem on a domain that has never bulk-sent.
 *
 * Matched loosely on purpose: Kit's event naming has varied across their v3
 * and v4 docs, and the cost of over-matching (someone stops receiving a
 * newsletter they can resubscribe to) is far lower than under-matching
 * (mailing someone who reported us as spam).
 */
function isSuppressionEvent(eventName: string, state: string | null): boolean {
  const haystack = `${eventName} ${state ?? ""}`.toLowerCase();
  return (
    haystack.includes("unsubscribe") ||
    haystack.includes("complain") ||
    haystack.includes("bounce") ||
    haystack.includes("cancelled")
  );
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

  // Suppress locally. Best effort by design: a failed write must NOT 500,
  // or Kit retries forever against a database that is not answering, and the
  // retries carry no new information.
  const address = payload.subscriber?.email_address;
  if (address && isSuppressionEvent(eventName, state)) {
    try {
      const supabase = getSupabaseAdminClient();
      // `ilike` rather than `eq`: Kit echoes whatever casing the subscriber
      // typed, and the same cross-stream casing bug was already found once
      // between waitlist rows and profile opt-outs.
      const { error: waitlistError } = await supabase
        .from("waitlist")
        .update({ subscribed: false })
        .ilike("email", address);
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ weekly_digest: false, email_alerts: false })
        .ilike("email", address);
      if (waitlistError || profileError) {
        logger.warn(
          {
            route: "webhooks.kit-bounce",
            event: eventName,
            subscriberId: payload.subscriber?.id ?? null,
            waitlistError: waitlistError?.message ?? null,
            profileError: profileError?.message ?? null,
          },
          "Kit suppression received but local write failed; address may still be mailed",
        );
      }
    } catch (err) {
      logger.warn(
        { err, route: "webhooks.kit-bounce", event: eventName },
        "Kit suppression write threw; address may still be mailed",
      );
    }
  }

  // We acknowledge receipt regardless, Kit retries on non-2xx and we
  // don't want to double-log.
  return c.json({ received: true });
});

export { webhooks };
