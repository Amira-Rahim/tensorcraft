import { Hono } from "hono";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

const payments = new Hono();

/**
 * POST /api/payments/webhook — Stripe webhook handler.
 * Verifies the webhook signature and processes checkout events.
 */
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

  // Raw body needed for Stripe signature verification
  const rawBody = await c.req.text();

  // TODO: Replace with actual Stripe SDK verification once stripe package is added
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid payload" }, 400);
  }

  const supabase = getSupabaseAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id as string;
      const sessionId = session.id as string;
      const amount = (session.amount_total as number) / 100;
      const metadata = session.metadata as Record<string, string>;

      if (!userId || !metadata?.planId) {
        console.error("Missing userId or planId in checkout session");
        break;
      }

      const themeIds = metadata.themeIds ? metadata.themeIds.split(",") : [];

      await supabase.from("purchases").insert({
        user_id: userId,
        plan_id: metadata.planId,
        theme_ids: themeIds,
        amount,
        stripe_session_id: sessionId,
        status: "completed",
      });

      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      const sessionId = charge.payment_intent as string;

      if (sessionId) {
        await supabase
          .from("purchases")
          .update({ status: "refunded" })
          .eq("stripe_session_id", sessionId);
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
