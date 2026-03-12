import { Hono } from "hono";
import Stripe from "stripe";
import {
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@tensorcraft/supabase";
import { PRICING, isValidThemeSlug } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const payments = new Hono<AppEnv>();

/** Lazily initialized Stripe client */
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
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

  const stripe = getStripe();
  const origin =
    c.req.header("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

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
    success_url: `${origin}/dashboard/purchase-success`,
    cancel_url: `${origin}/pricing?purchase=cancelled`,
  });

  return c.json({ url: session.url });
});

// ──────────────────────────────────────────────
// GET /api/payments/purchases — Check user's purchases
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
    return c.json({ error: "Failed to fetch purchases" }, 500);
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
    return c.json({ error: "Webhook not configured" }, 500);
  }

  const rawBody = await c.req.text();
  const stripe = getStripe();

  // CRITICAL #1: Verify webhook signature with Stripe SDK
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
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
        break;
      }

      if (!metadata?.planId) {
        console.error("Webhook: Missing planId in metadata");
        break;
      }

      const themeIds = metadata.themeIds ? metadata.themeIds.split(",") : [];

      // Validate theme IDs from metadata
      if (themeIds.length > 0 && !validateThemeIds(themeIds)) {
        console.error("Webhook: Invalid theme IDs in metadata:", themeIds);
        break;
      }

      // Validate amount matches known price points
      const plan = PRICING[metadata.planId as keyof typeof PRICING];
      if (!plan) {
        console.error("Webhook: Unknown planId:", metadata.planId);
        break;
      }

      // Validate Stripe session ID format
      if (!sessionId.startsWith("cs_test_") && !sessionId.startsWith("cs_")) {
        console.error("Webhook: Invalid stripe_session_id format:", sessionId);
        break;
      }

      // Idempotency: skip if already processed
      const { data: existing } = await supabase
        .from("purchases")
        .select("id")
        .eq("stripe_session_id", sessionId)
        .single();

      if (existing) {
        // Already processed — acknowledge
        break;
      }

      await supabase.from("purchases").insert({
        user_id: userId,
        plan_id: metadata.planId,
        theme_ids: themeIds,
        amount: amount ? amount / 100 : plan.price,
        stripe_session_id: sessionId,
        status: "completed",
      });

      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntent =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (paymentIntent) {
        await supabase
          .from("purchases")
          .update({ status: "refunded" })
          .eq("stripe_session_id", paymentIntent);
      }

      break;
    }

    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return c.json({ received: true });
});

export { payments };
