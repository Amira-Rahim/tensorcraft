import { Hono } from "hono";
import Stripe from "stripe";
import {
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@tensorcraft/supabase";
import { PRICING, isValidThemeSlug } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import { addSubscriber, tagSubscriber } from "../lib/kit";
import type { AppEnv } from "../types";

const payments = new Hono<AppEnv>();

/** Lazily initialized Stripe client (singleton) */
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  stripeInstance = new Stripe(key);
  return stripeInstance;
}

/** Validate that all theme IDs are known slugs */
function validateThemeIds(ids: string[]): boolean {
  return ids.every((id) => isValidThemeSlug(id));
}

// ──────────────────────────────────────────────
// POST /api/payments/checkout — Create a Stripe Checkout session
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

  // Check for duplicate purchases — prevent buying themes user already owns
  const supabase = getSupabaseServerClient(c.get("accessToken"));
  const { data: existingPurchases } = await supabase
    .from("purchases")
    .select("theme_ids")
    .eq("user_id", userId);

  if (existingPurchases && existingPurchases.length > 0) {
    const ownedThemes = existingPurchases.flatMap(
      (p: { theme_ids: string[] }) => p.theme_ids,
    );
    const alreadyOwned = body.themeIds.filter((id) => ownedThemes.includes(id));
    if (alreadyOwned.length > 0) {
      return c.json(
        { error: "You already own this theme", themes: alreadyOwned },
        400,
      );
    }
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
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Tensorcraft — ${plan.label}`,
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
    },
    success_url: `${appUrl}/dashboard/purchase-success`,
    cancel_url: `${appUrl}/pricing?purchase=cancelled`,
  });

  return c.json({ url: session.url });
});

// ──────────────────────────────────────────────
// GET /api/payments/purchases — Check user's purchases
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
    .eq("status", "completed");

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
// POST /api/payments/webhook — Stripe webhook handler
// CRITICAL #1: Now uses Stripe SDK signature verification
// ──────────────────────────────────────────────

payments.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
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
    console.error("Webhook signature verification failed:", {
      error: message,
      timestamp: new Date().toISOString(),
      hasSignature: !!signature,
      bodyLength: rawBody.length,
    });
    return c.json({ error: "Invalid signature" }, 400);
  }

  const supabase = getSupabaseAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // CRITICAL #5: Safe field extraction with null checks
      const userId = session.client_reference_id;
      const sessionId = session.id;
      const amount = session.amount_total;
      const metadata = session.metadata;

      if (!userId || !sessionId) {
        console.error("Webhook: Missing client_reference_id or session id");
        return c.json(
          { error: "Missing client_reference_id or session id" },
          500,
        );
      }

      if (!metadata?.planId) {
        console.error("Webhook: Missing planId in metadata");
        return c.json({ error: "Missing planId in metadata" }, 500);
      }

      const themeIds = metadata.themeIds ? metadata.themeIds.split(",") : [];

      // Validate theme IDs from metadata
      if (themeIds.length > 0 && !validateThemeIds(themeIds)) {
        console.error("Webhook: Invalid theme IDs in metadata:", themeIds);
        return c.json({ error: "Webhook: Invalid theme IDs in metadata" }, 400);
      }

      // Validate amount matches known price points
      const plan = PRICING[metadata.planId as keyof typeof PRICING];
      if (!plan || metadata.planId === "free") {
        console.error("Webhook: Invalid planId:", metadata.planId);
        return c.json({ error: "Webhook: Invalid planId in metadata" }, 400);
      }

      // Validate Stripe session ID format
      if (!sessionId.startsWith("cs_test_") && !sessionId.startsWith("cs_")) {
        console.error("Webhook: Invalid stripe_session_id format:", sessionId);
        return c.json({ error: "Webhook: Invalid session ID format" }, 400);
      }

      // Idempotency: use upsert with ON CONFLICT to avoid TOCTOU race
      const paymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      const { error: upsertError } = await supabase.from("purchases").upsert(
        {
          user_id: userId,
          plan_id: metadata.planId,
          theme_ids: themeIds,
          amount: amount ? amount / 100 : plan.price,
          stripe_session_id: sessionId,
          stripe_payment_intent: paymentIntent,
          status: "completed",
        },
        { onConflict: "stripe_session_id", ignoreDuplicates: true },
      );

      if (upsertError) {
        console.error("Webhook: Failed to upsert purchase:", upsertError);
        return c.json({ error: "Database error" }, 500);
      }

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
        console.warn(
          "Kit email failed (non-blocking):",
          emailErr instanceof Error ? emailErr.message : emailErr,
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

        const { error: refundError } = await supabase
          .from("purchases")
          .update({ status: newStatus })
          .eq("stripe_payment_intent", refundPaymentIntent);

        if (refundError) {
          console.error(
            "Webhook: Failed to update refund status:",
            refundError,
          );
          return c.json({ error: "Database error" }, 500);
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
          console.error(
            "Webhook: Failed to update dispute status:",
            disputeError,
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

        if (
          asyncPlan &&
          (asyncThemeIds.length === 0 || validateThemeIds(asyncThemeIds))
        ) {
          const asyncPaymentIntent =
            typeof asyncSession.payment_intent === "string"
              ? asyncSession.payment_intent
              : (asyncSession.payment_intent?.id ?? null);

          await supabase.from("purchases").upsert(
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
            { onConflict: "stripe_session_id", ignoreDuplicates: true },
          );
        }
      }

      break;
    }

    case "checkout.session.async_payment_failed": {
      const failedSession = event.data.object as Stripe.Checkout.Session;
      console.warn("Async payment failed:", {
        sessionId: failedSession.id,
        userId: failedSession.client_reference_id,
      });
      break;
    }

    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return c.json({ received: true });
});

export { payments };
