import { Hono } from "hono";
import Stripe from "stripe";
import {
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@tensorcraft/supabase";
import { PRICING, isValidThemeSlug, isLaunched } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import { createRateLimiter } from "../middleware/rate-limit";
import {
  resolveOrCreateUserByEmail,
  sendPurchaseAccessLink,
} from "../lib/guest-account";
import { addSubscriber, tagSubscriber } from "../lib/kit";
import { logger } from "../lib/logger";
import { captureServer, SERVER_EVENTS } from "../lib/posthog";
import type { AppEnv } from "../types";

const payments = new Hono<AppEnv>();

/** Lazily initialized Stripe client (singleton) */
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  // apiVersion intentionally omitted: stripe-node pins the API version
  // bundled with the installed SDK release (it does NOT float to the
  // account default). Bumping the stripe dependency is the deliberate way
  // to move versions; review webhook payload shapes when doing so.
  stripeInstance = new Stripe(key);
  return stripeInstance;
}

/**
 * Validate that every theme ID is launched (purchasable). Coming-soon themes
 * still pass `isValidThemeSlug` (registry knows them) but must NOT be
 * checkout-able. See packages/shared/src/constants.ts → LAUNCHED_THEMES.
 * Rejects empty arrays, paid plans must carry at least one theme.
 */
function validateThemeIds(ids: string[]): boolean {
  if (!Array.isArray(ids) || ids.length === 0) return false;
  return ids.every((id) => isValidThemeSlug(id) && isLaunched(id));
}

/**
 * Terminal purchase statuses, once set, a retry of the same webhook
 * must NOT regress the row (e.g. back to "completed"). See §338.
 */
const TERMINAL_STATUSES = new Set([
  "refunded",
  "partially_refunded",
  "disputed",
  "failed",
]);

/**
 * Map a checkout session's payment_status onto the purchase row status.
 *
 * Stripe fires `checkout.session.completed` for delayed-notification payment
 * methods (bank debits, some wallets) with `payment_status: "unpaid"`: the
 * CHECKOUT finished but the MONEY has not moved. This handler used to write
 * `status: "completed"` unconditionally, which granted lifetime access on an
 * unpaid session — and the later `async_payment_failed` event only logged,
 * so the access was never revoked (audit run #7, 2026-07-16). Unpaid sessions
 * are recorded as `pending` (grants nothing: every access-granting read
 * filters to completed/partially_refunded); `async_payment_succeeded`
 * promotes them and `async_payment_failed` settles them as `failed`.
 */
export function purchaseStatusForSession(
  paymentStatus: string | null | undefined,
): "completed" | "pending" {
  return paymentStatus === "paid" || paymentStatus === "no_payment_required"
    ? "completed"
    : "pending";
}

// ──────────────────────────────────────────────
// POST /api/payments/checkout, Create a Stripe Checkout session
// ──────────────────────────────────────────────

payments.use("/checkout", authMiddleware);

payments.post("/checkout", async (c) => {
  const userId = c.get("userId");

  let body: { planId: string; themeIds: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.planId || !body.themeIds || !Array.isArray(body.themeIds)) {
    return c.json({ error: "planId and themeIds[] are required" }, 400);
  }

  // Validate plan
  const plan = PRICING[body.planId as keyof typeof PRICING];
  if (!plan || body.planId === "free") {
    return c.json({ error: "Invalid planId" }, 400);
  }

  // Validate theme count matches plan
  if (body.themeIds.length !== plan.themes) {
    return c.json(
      {
        error: `Plan "${body.planId}" requires exactly ${plan.themes} theme(s)`,
      },
      400,
    );
  }

  // Validate theme slugs
  if (!validateThemeIds(body.themeIds)) {
    return c.json({ error: "Invalid theme ID(s)" }, 400);
  }

  // Calculate upgrade credit from prior purchases, and read the buyer's email
  // for Stripe's abandoned-cart recovery. Fanned out together so the email
  // lookup costs no extra round-trip on the checkout path.
  const supabase = getSupabaseServerClient(c.get("accessToken"));
  const [{ data: existingPurchases }, { data: buyerProfile }] =
    await Promise.all([
      supabase
        .from("purchases")
        .select("theme_ids, amount")
        .eq("user_id", userId)
        .in("status", ["completed", "partially_refunded"]),
      supabase.from("profiles").select("email").eq("id", userId).single(),
    ]);
  const buyerEmail = (buyerProfile as { email?: string } | null)?.email;

  const ownedThemes = new Set<string>();
  let credit = 0;

  if (existingPurchases && existingPurchases.length > 0) {
    for (const p of existingPurchases as {
      theme_ids: string[];
      amount: number;
    }[]) {
      const hasOverlap = p.theme_ids.some((id) => body.themeIds.includes(id));
      for (const id of p.theme_ids) {
        ownedThemes.add(id);
      }
      if (hasOverlap) {
        credit += p.amount;
      }
    }

    const allOwned = body.themeIds.every((id) => ownedThemes.has(id));
    if (allOwned) {
      return c.json({ error: "You already own all these themes" }, 400);
    }
  }

  credit = Math.min(credit, plan.price);
  const adjustedPrice = Math.max(0, plan.price - credit);
  const isUpgrade = credit > 0;

  // Auto-grant if credit fully covers the price.
  //
  // This MUST use the admin client: purchases has no INSERT policy for
  // authenticated users (001: service-role only), so the user-scoped client
  // is rejected by RLS — and `amount: 0` additionally violated the original
  // `chk_amount_positive CHECK (amount > 0)` until migration 037 relaxed it
  // to `>= 0`. Both failures were silent 500s that made a fully-credited
  // upgrade impossible to redeem (audit run #7; latent until theme 2).
  if (adjustedPrice === 0) {
    const admin = getSupabaseAdminClient();
    const grantSessionId = `auto_grant_${crypto.randomUUID()}`;
    const { error: grantError } = await admin.from("purchases").insert({
      user_id: userId,
      plan_id: body.planId,
      theme_ids: body.themeIds,
      amount: 0,
      status: "completed",
      stripe_session_id: grantSessionId,
    });
    if (grantError) {
      logger.error(
        { err: grantError, route: "payments.checkout", userId },
        "Auto-grant insert failed",
      );
      return c.json({ error: "Failed to grant themes" }, 500);
    }
    captureServer(
      SERVER_EVENTS.PAYMENT_COMPLETED,
      {
        planId: body.planId,
        themeIds: body.themeIds,
        amount: 0,
        sessionId: grantSessionId,
        isUpgrade: true,
      },
      userId,
    );
    return c.json({ granted: true, themes: body.themeIds });
  }

  const stripe = getStripe();
  let appUrl = process.env.APP_URL;
  if (!appUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APP_URL is required in production");
    }
    appUrl = "http://localhost:3000";
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    // Abandoned-cart recovery. Stripe can only mail a buyer who drops out of
    // checkout when the session carries their email AND recovery is enabled;
    // with neither set the session just expired in silence. `customer_email`
    // is omitted rather than sent empty when the profile row has none, since
    // Stripe rejects a blank string.
    ...(buyerEmail ? { customer_email: buyerEmail } : {}),
    after_expiration: {
      recovery: {
        enabled: true,
        allow_promotion_codes: false,
      },
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: isUpgrade
              ? `Tensorcraft: Upgrade to ${plan.label}`
              : `Tensorcraft: ${plan.label}`,
            description: `Access to ${body.themeIds.join(", ")}`,
          },
          unit_amount: adjustedPrice * 100, // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      planId: body.planId,
      themeIds: body.themeIds.join(","),
      creditApplied: String(credit),
      originalPrice: String(plan.price),
    },
    success_url: `${appUrl}/dashboard/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?purchase=cancelled`,
  });

  return c.json({ url: session.url });
});

// ──────────────────────────────────────────────
// POST /api/payments/guest-checkout, buy without an account
//
// The authenticated flow forces a cold buyer through signup before they can
// pay, and with magic-link auth that means leaving the browser for an inbox
// mid-purchase. This route lets Stripe collect the email instead; the webhook
// provisions (or attaches to) the account afterwards.
//
// Deliberately narrower than the authed route: no upgrade credit, because a
// guest by definition has no prior purchases to credit, and no auto-grant
// path for the same reason.
//
// Unauthenticated, so it carries its own tighter IP budget on top of the
// global 60/min limiter. A separate key prefix gives it an independent
// budget rather than sharing the general one.
// ──────────────────────────────────────────────

payments.use(
  "/guest-checkout",
  createRateLimiter({ max: 10, keyPrefix: "rl:guest-checkout" }),
);

payments.post("/guest-checkout", async (c) => {
  let body: { planId: string; themeIds: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.planId || !body.themeIds || !Array.isArray(body.themeIds)) {
    return c.json({ error: "planId and themeIds[] are required" }, 400);
  }

  const plan = PRICING[body.planId as keyof typeof PRICING];
  if (!plan || body.planId === "free") {
    return c.json({ error: "Invalid planId" }, 400);
  }

  if (body.themeIds.length !== plan.themes) {
    return c.json(
      {
        error: `Plan "${body.planId}" requires exactly ${plan.themes} theme(s)`,
      },
      400,
    );
  }

  if (!validateThemeIds(body.themeIds)) {
    return c.json({ error: "Invalid theme ID(s)" }, 400);
  }

  const stripe = getStripe();
  let appUrl = process.env.APP_URL;
  if (!appUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APP_URL is required in production");
    }
    appUrl = "http://localhost:3000";
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // No client_reference_id: there is no user yet. The webhook resolves
    // identity from customer_details.email instead, and `guest: "true"`
    // marks which branch a row came from for support and analytics.
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Tensorcraft: ${plan.label}`,
            description: `Access to ${body.themeIds.join(", ")}`,
          },
          unit_amount: plan.price * 100, // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      planId: body.planId,
      themeIds: body.themeIds.join(","),
      guest: "true",
    },
    after_expiration: {
      recovery: { enabled: true, allow_promotion_codes: false },
    },
    success_url: `${appUrl}/dashboard/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?purchase=cancelled`,
  });

  return c.json({ url: session.url });
});

// ──────────────────────────────────────────────
// GET /api/payments/purchases, Check user's purchases
//
// NOTE: As of V0.5, the Next.js frontend checks purchases directly via
// Supabase client in lib/progress.ts (hasThemePurchase). This endpoint
// is retained for future admin dashboards, mobile clients, or external
// API consumers that can't use the Supabase client directly.
// ──────────────────────────────────────────────

payments.use("/purchases", authMiddleware);

payments.get("/purchases", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");
  const themeId = c.req.query("themeId");

  const supabase = getSupabaseServerClient(token);

  let query = supabase
    .from("purchases")
    .select("id, plan_id, theme_ids, amount, status, created_at")
    .eq("user_id", userId)
    .in("status", ["completed", "partially_refunded"]);

  if (themeId) {
    if (!isValidThemeSlug(themeId)) {
      return c.json({ error: "Invalid themeId" }, 400);
    }
    query = query.contains("theme_ids", [themeId]);
  }

  const { data, error } = await query;

  if (error) {
    return c.json(
      {
        error: "Failed to fetch purchases",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({
    purchases: data,
    hasAccess: themeId ? data.length > 0 : undefined,
  });
});

// ──────────────────────────────────────────────
// POST /api/payments/webhook, Stripe webhook handler
// CRITICAL #1: Now uses Stripe SDK signature verification
// ──────────────────────────────────────────────

payments.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error(
      { route: "payments.webhook" },
      "STRIPE_WEBHOOK_SECRET not configured",
    );
    return c.json(
      {
        error: "Webhook not configured",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  const rawBody = await c.req.text();
  const stripe = getStripe();

  // CRITICAL #1: Verify webhook signature with Stripe SDK
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(
      {
        err,
        route: "payments.webhook",
        message,
        hasSignature: !!signature,
        bodyLength: rawBody.length,
      },
      "Webhook signature verification failed",
    );
    return c.json({ error: "Invalid signature" }, 400);
  }

  const supabase = getSupabaseAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // CRITICAL #5: Safe field extraction with null checks
      const sessionId = session.id;
      const amount = session.amount_total;
      const metadata = session.metadata;

      // Identity resolution forks here. The authed flow stamps
      // client_reference_id at session creation; a guest session has none, so
      // we fall back to the email Stripe collected (already proven by the
      // payment) and provision or attach an account.
      //
      // Returning 500 on failure is deliberate: Stripe retries, and a dropped
      // guest purchase means money taken with nothing granted.
      let userId = session.client_reference_id;
      if (!userId && metadata?.guest === "true") {
        const guestEmail = session.customer_details?.email;
        if (guestEmail) {
          userId = await resolveOrCreateUserByEmail(supabase, guestEmail);
          if (userId) {
            // Best-effort: the purchase is recorded regardless, and the buyer
            // can always sign in from the site with the same address.
            void sendPurchaseAccessLink(
              getSupabaseServerClient(),
              guestEmail,
              `${process.env.APP_URL ?? ""}/dashboard/purchase-success`,
            );
          }
        }
      }

      if (!userId || !sessionId) {
        logger.error(
          {
            route: "payments.webhook",
            eventType: event.type,
            guest: metadata?.guest === "true",
          },
          "Webhook: could not resolve a user for this session",
        );
        return c.json(
          { error: "Missing client_reference_id or session id" },
          500,
        );
      }

      if (!metadata?.planId) {
        logger.error(
          {
            route: "payments.webhook",
            eventType: event.type,
            userId,
            stripeSessionId: sessionId,
          },
          "Webhook: Missing planId in metadata",
        );
        return c.json({ error: "Missing planId in metadata" }, 500);
      }

      const themeIds = metadata.themeIds
        ? metadata.themeIds.split(",").filter(Boolean)
        : [];

      // Validate theme IDs from metadata against canonical slug list.
      // Empty array is rejected, every paid purchase must grant at
      // least one theme (§6h referential integrity).
      if (!validateThemeIds(themeIds)) {
        logger.error(
          {
            route: "payments.webhook",
            userId,
            stripeSessionId: sessionId,
            themeIds,
          },
          "Webhook: Invalid theme IDs in metadata",
        );
        return c.json({ error: "Webhook: Invalid theme IDs in metadata" }, 400);
      }

      // Validate amount matches known price points
      const plan = PRICING[metadata.planId as keyof typeof PRICING];
      if (!plan || metadata.planId === "free") {
        logger.error(
          {
            route: "payments.webhook",
            userId,
            stripeSessionId: sessionId,
            planId: metadata.planId,
          },
          "Webhook: Invalid planId",
        );
        return c.json({ error: "Webhook: Invalid planId in metadata" }, 400);
      }

      const creditApplied = Number(metadata.creditApplied || "0");
      const expectedAmount = plan.price - creditApplied;

      // Enforce the amount check the comment above promises: the session's
      // amount_total must match the plan price minus applied credit. A
      // mismatch means our price table and the charged amount diverged.
      // The charge already happened, so fulfill (the customer paid), but
      // log loudly for manual review rather than failing the webhook.
      if (amount != null && amount !== expectedAmount * 100) {
        logger.error(
          {
            route: "payments.webhook",
            userId,
            stripeSessionId: sessionId,
            planId: metadata.planId,
            amountTotal: amount,
            expectedCents: expectedAmount * 100,
          },
          "Webhook: amount_total does not match expected plan price",
        );
      }

      // Validate Stripe session ID format
      if (!sessionId.startsWith("cs_test_") && !sessionId.startsWith("cs_")) {
        logger.error(
          { route: "payments.webhook", userId, stripeSessionId: sessionId },
          "Webhook: Invalid stripe_session_id format",
        );
        return c.json({ error: "Webhook: Invalid session ID format" }, 400);
      }

      // ──────────────────────────────────────────────────────────
      // Idempotent upsert, §338 "Fix upsert race condition".
      //
      // Stripe delivers webhooks at-least-once and will retry any
      // non-2xx response. Under concurrent retries we MUST NOT create
      // duplicate rows and MUST NOT regress a terminal status
      // (refunded / partially_refunded / disputed / failed) back to
      // "completed". Resolution policy:
      //
      //   1. Pre-check for an existing row at `stripe_session_id`.
      //   2. If it already has a terminal status, acknowledge and exit.
      //   3. Otherwise UPSERT with `ignoreDuplicates: false` so the
      //      underlying `ON CONFLICT (stripe_session_id) DO UPDATE`
      //      deterministically sets the latest fields (e.g. a
      //      payment_intent that was missing on first delivery).
      //
      // The `stripe_session_id` column is UNIQUE (migration 001 +
      // migration 017 adds the UNIQUE constraint), so concurrent
      // inserts serialize at the DB level.
      // ──────────────────────────────────────────────────────────
      const paymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      // See purchaseStatusForSession: "completed" only when the money has
      // actually moved. Delayed-notification methods land here "unpaid" and
      // are recorded as pending until async_payment_succeeded.
      const rowStatus = purchaseStatusForSession(session.payment_status);

      const { data: existingRow } = await supabase
        .from("purchases")
        .select("status")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (existingRow && TERMINAL_STATUSES.has(existingRow.status)) {
        // Already settled in a terminal state, do not regress.
        logger.info(
          {
            route: "payments.webhook",
            userId,
            stripeSessionId: sessionId,
            status: existingRow.status,
          },
          "Webhook: skipping upsert, row already in terminal status",
        );
        break;
      }

      if (existingRow?.status === "completed" && rowStatus === "pending") {
        // async_payment_succeeded already promoted this session; a delayed
        // retry of the original unpaid `completed` event must not demote it.
        logger.info(
          { route: "payments.webhook", userId, stripeSessionId: sessionId },
          "Webhook: skipping upsert, session already promoted to completed",
        );
        break;
      }

      const { error: upsertError } = await supabase.from("purchases").upsert(
        {
          user_id: userId,
          plan_id: metadata.planId,
          theme_ids: themeIds,
          amount: amount ? amount / 100 : expectedAmount,
          stripe_session_id: sessionId,
          stripe_payment_intent: paymentIntent,
          status: rowStatus,
        },
        { onConflict: "stripe_session_id", ignoreDuplicates: false },
      );

      if (upsertError) {
        logger.error(
          {
            err: upsertError,
            route: "payments.webhook",
            userId,
            stripeSessionId: sessionId,
            planId: metadata.planId,
          },
          "Webhook: Failed to upsert purchase",
        );
        return c.json({ error: "Database error" }, 500);
      }

      // Persist the Stripe customer id (migration 043). One-time `mode:payment`
      // sessions don't always create a customer, but when Stripe does attach
      // one, capturing it now means recurring billing and seat subscriptions
      // (roadmap H1/H3) already have a durable customer to manage instead of a
      // backfill later. Best-effort: never fail a recorded purchase over it,
      // and only write when the value actually changes.
      const stripeCustomerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer?.id ?? null);
      if (stripeCustomerId) {
        try {
          await supabase
            .from("profiles")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("id", userId)
            .is("stripe_customer_id", null);
        } catch (custErr) {
          logger.warn(
            { err: custErr, route: "payments.webhook", userId },
            "Webhook: failed to persist stripe_customer_id (non-fatal)",
          );
        }
      }

      // Revenue event + confirmation email fire only once the payment has
      // actually settled. For delayed methods that happens in the
      // async_payment_succeeded handler below, not here.
      if (rowStatus === "completed") {
        // Fire authoritative server-side conversion event (§6i).
        // Client may also fire one, but this is the revenue source of truth.
        captureServer(
          SERVER_EVENTS.PAYMENT_COMPLETED,
          {
            planId: metadata.planId,
            themeIds,
            amount: amount ? amount / 100 : expectedAmount,
            sessionId,
            isUpgrade: creditApplied > 0,
          },
          userId,
        );

        // Send purchase confirmation email via Kit (fire-and-forget)
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .single();

          if (profile?.email) {
            await addSubscriber(profile.email);
            const purchaseTagId = process.env.KIT_TAG_PURCHASED;
            if (purchaseTagId) {
              await tagSubscriber(profile.email, purchaseTagId);
            }
          }
        } catch (emailErr) {
          logger.warn(
            {
              err: emailErr,
              route: "payments.webhook",
              userId,
              stripeSessionId: sessionId,
            },
            "Kit email failed (non-blocking)",
          );
        }
      } else {
        logger.info(
          { route: "payments.webhook", userId, stripeSessionId: sessionId },
          "Webhook: checkout completed but unpaid; recorded as pending",
        );
      }

      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const refundPaymentIntent =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (refundPaymentIntent) {
        // Only fully revoke access on full refund; partial refunds preserve access
        const isFullRefund = charge.amount_refunded >= charge.amount;
        const newStatus = isFullRefund ? "refunded" : "partially_refunded";

        const { data: refundedRows, error: refundError } = await supabase
          .from("purchases")
          .update({ status: newStatus })
          .eq("stripe_payment_intent", refundPaymentIntent)
          .select("id");

        if (refundError) {
          logger.error(
            {
              err: refundError,
              route: "payments.webhook",
              eventType: event.type,
              paymentIntent: refundPaymentIntent,
            },
            "Webhook: Failed to update refund status",
          );
          return c.json({ error: "Database error" }, 500);
        }

        if (!refundedRows || refundedRows.length === 0) {
          // No purchase row carries this payment_intent yet - the refund
          // event outran the purchase row (webhook ordering) or the row is
          // missing its intent. Returning 200 here made the refund
          // PERMANENTLY unrecorded (audit run #7): acknowledge nothing and
          // let Stripe retry, by which time the purchase row should exist.
          logger.error(
            {
              route: "payments.webhook",
              eventType: event.type,
              paymentIntent: refundPaymentIntent,
            },
            "Webhook: refund matched no purchase row; requesting retry",
          );
          return c.json({ error: "No purchase row for refund yet" }, 500);
        }

        // Look up owning user to correctly attribute the event.
        const { data: refundedRow } = await supabase
          .from("purchases")
          .select("user_id")
          .eq("stripe_payment_intent", refundPaymentIntent)
          .maybeSingle();
        if (refundedRow?.user_id) {
          captureServer(
            SERVER_EVENTS.PAYMENT_REFUNDED,
            {
              paymentIntentId: refundPaymentIntent,
              isFullRefund,
            },
            refundedRow.user_id,
          );
        }
      }

      break;
    }

    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const disputePaymentIntent =
        typeof dispute.payment_intent === "string"
          ? dispute.payment_intent
          : dispute.payment_intent?.id;

      if (disputePaymentIntent) {
        // Immediately revoke access on dispute to protect against fraud
        const { error: disputeError } = await supabase
          .from("purchases")
          .update({ status: "disputed" })
          .eq("stripe_payment_intent", disputePaymentIntent);

        if (disputeError) {
          logger.error(
            {
              err: disputeError,
              route: "payments.webhook",
              eventType: event.type,
              paymentIntent: disputePaymentIntent,
            },
            "Webhook: Failed to update dispute status",
          );
          return c.json({ error: "Database error" }, 500);
        }
      }

      break;
    }

    case "checkout.session.async_payment_succeeded": {
      // Handle delayed payment methods (bank transfers, etc.)
      const asyncSession = event.data.object as Stripe.Checkout.Session;
      const asyncUserId = asyncSession.client_reference_id;
      const asyncMetadata = asyncSession.metadata;

      if (asyncUserId && asyncMetadata?.planId) {
        const asyncThemeIds = asyncMetadata.themeIds
          ? asyncMetadata.themeIds.split(",")
          : [];
        const asyncPlan = PRICING[asyncMetadata.planId as keyof typeof PRICING];

        if (asyncPlan && validateThemeIds(asyncThemeIds)) {
          const asyncPaymentIntent =
            typeof asyncSession.payment_intent === "string"
              ? asyncSession.payment_intent
              : (asyncSession.payment_intent?.id ?? null);

          // Same no-regression guard as the sync path, §338.
          const { data: existingAsyncRow } = await supabase
            .from("purchases")
            .select("status")
            .eq("stripe_session_id", asyncSession.id)
            .maybeSingle();

          if (
            !existingAsyncRow ||
            !TERMINAL_STATUSES.has(existingAsyncRow.status)
          ) {
            const { error: asyncUpsertError } = await supabase
              .from("purchases")
              .upsert(
                {
                  user_id: asyncUserId,
                  plan_id: asyncMetadata.planId,
                  theme_ids: asyncThemeIds,
                  amount: asyncSession.amount_total
                    ? asyncSession.amount_total / 100
                    : asyncPlan.price,
                  stripe_session_id: asyncSession.id,
                  stripe_payment_intent: asyncPaymentIntent,
                  status: "completed",
                },
                { onConflict: "stripe_session_id", ignoreDuplicates: false },
              );

            // This is the moment a delayed payment actually settles: the
            // sync handler recorded the session as pending and deliberately
            // deferred the revenue event and the confirmation email to here.
            // Guard on prior status so a retried async_payment_succeeded
            // does not double-fire.
            if (!asyncUpsertError && existingAsyncRow?.status !== "completed") {
              captureServer(
                SERVER_EVENTS.PAYMENT_COMPLETED,
                {
                  planId: asyncMetadata.planId,
                  themeIds: asyncThemeIds,
                  amount: asyncSession.amount_total
                    ? asyncSession.amount_total / 100
                    : asyncPlan.price,
                  sessionId: asyncSession.id,
                  isUpgrade: Number(asyncMetadata.creditApplied || "0") > 0,
                },
                asyncUserId,
              );

              try {
                const { data: asyncProfile } = await supabase
                  .from("profiles")
                  .select("email")
                  .eq("id", asyncUserId)
                  .single();

                if (asyncProfile?.email) {
                  await addSubscriber(asyncProfile.email);
                  const purchaseTagId = process.env.KIT_TAG_PURCHASED;
                  if (purchaseTagId) {
                    await tagSubscriber(asyncProfile.email, purchaseTagId);
                  }
                }
              } catch (emailErr) {
                logger.warn(
                  {
                    err: emailErr,
                    route: "payments.webhook",
                    userId: asyncUserId,
                    stripeSessionId: asyncSession.id,
                  },
                  "Kit email failed (non-blocking)",
                );
              }
            }
          }
        } else if (asyncPlan) {
          logger.error(
            {
              route: "payments.webhook",
              eventType: event.type,
              userId: asyncUserId,
              stripeSessionId: asyncSession.id,
              themeIds: asyncThemeIds,
            },
            "Webhook async: invalid theme IDs in metadata",
          );
        }
      }

      break;
    }

    case "checkout.session.async_payment_failed": {
      const failedSession = event.data.object as Stripe.Checkout.Session;
      logger.warn(
        {
          route: "payments.webhook",
          eventType: event.type,
          stripeSessionId: failedSession.id,
          userId: failedSession.client_reference_id,
        },
        "Async payment failed",
      );

      // Settle the pending row as failed. This handler used to only log,
      // which left the purchase in whatever state the sync handler wrote —
      // and before the payment_status fix that state was "completed", i.e.
      // lifetime access on a payment that bounced (audit run #7). "failed"
      // is terminal, so the guard below also protects a session that was
      // refunded/disputed between deliveries.
      const { data: failedRow } = await supabase
        .from("purchases")
        .select("status")
        .eq("stripe_session_id", failedSession.id)
        .maybeSingle();

      if (failedRow && !TERMINAL_STATUSES.has(failedRow.status)) {
        const { error: failError } = await supabase
          .from("purchases")
          .update({ status: "failed" })
          .eq("stripe_session_id", failedSession.id);

        if (failError) {
          logger.error(
            {
              err: failError,
              route: "payments.webhook",
              stripeSessionId: failedSession.id,
            },
            "Webhook: failed to mark purchase as failed",
          );
          // Non-2xx so Stripe retries: an unpaid session must not be left
          // holding a non-terminal status.
          return c.json({ error: "Database error" }, 500);
        }
      }

      if (failedSession.client_reference_id) {
        captureServer(
          SERVER_EVENTS.PAYMENT_FAILED,
          {
            planId: failedSession.metadata?.planId,
            sessionId: failedSession.id,
            reason: "async_payment_failed",
          },
          failedSession.client_reference_id,
        );
      }
      break;
    }

    default:
      // Unhandled event type, acknowledge receipt
      break;
  }

  return c.json({ received: true });
});

export { payments };
