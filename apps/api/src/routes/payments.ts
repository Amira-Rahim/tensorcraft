import { Hono } from "hono";
import Stripe from "stripe";
import {
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@tensorcraft/supabase";
import {
  PRICING,
  isValidWorldSlug,
  isLaunched,
  isVatGatedCountry,
} from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import { createRateLimiter } from "../middleware/rate-limit";
import {
  resolveOrCreateUserByEmail,
  sendPurchaseAccessLink,
} from "../lib/guest-account";
import { addSubscriber, tagSubscriber } from "../lib/kit";
import { sendPurchaseReceipt } from "../lib/email";
import { logger } from "../lib/logger";
import { captureException } from "../lib/error-tracking";
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
 * Stripe Tax + compliant-invoice params for a Checkout Session (re-audit N0).
 *
 * Gated behind STRIPE_TAX_ENABLED and OFF by default, so checkout behaves
 * exactly as today until the operator turns it on. Enabling requires work in
 * the Stripe dashboard FIRST - activate Stripe Tax, set the origin address and
 * a default product tax code/behaviour, and register for OSS/VAT - because
 * turning `automatic_tax` on before Tax is configured makes session creation
 * fail. Once on: Stripe collects the buyer's billing country + VAT id, computes
 * tax, and issues a real (VAT-grade) invoice; the webhook persists the country
 * and tax amount, which cannot be reconstructed from a flat USD row afterward.
 */
/**
 * EU/UK checkout gate (owner decision 2026-08-23, reviewed at the 500-user
 * gate; see the Tier 1-LEGAL decision note in docs/launch-blockers.md).
 *
 * A seller established outside the EU gets no EUR 10,000 threshold, so EU VAT
 * would be due at the buyer's rate from the very first sale, and the UK has no
 * threshold for non-UK-established sellers either. Until the LLC exists,
 * refuse the sale rather than incur a liability that cannot be unwound later
 * (OSS registration cannot be backdated).
 *
 * The country is read from Cloudflare's `CF-IPCountry`, which is set at the
 * edge in front of this API and so cannot be forged by the client. It FAILS
 * OPEN when absent: a direct-to-origin request or an edge config change would
 * otherwise stop every sale worldwide, which is a worse outcome than the
 * exposure it prevents. The billing country is now always collected at
 * checkout, so a webhook-side backstop can be added without further changes.
 *
 * Deliberately NOT applied to signup or lesson access: VAT triggers on a
 * supply for consideration, so free use from the EU costs nothing, and those
 * signups are the validation metric this gate is protecting.
 */
function isRegionBlocked(countryHeader: string | undefined): boolean {
  return isVatGatedCountry(countryHeader);
}

function taxSessionParams(): Partial<Stripe.Checkout.SessionCreateParams> {
  if (process.env.STRIPE_TAX_ENABLED !== "true") return {};
  return {
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
    invoice_creation: { enabled: true },
  };
}

/**
 * Validate that every world ID is launched (purchasable). Coming-soon worlds
 * still pass `isValidWorldSlug` (registry knows them) but must NOT be
 * checkout-able. See packages/shared/src/constants.ts → LAUNCHED_WORLDS.
 * Rejects empty arrays, paid plans must carry at least one world.
 */
function validateWorldIds(ids: string[]): boolean {
  if (!Array.isArray(ids) || ids.length === 0) return false;
  return ids.every((id) => isValidWorldSlug(id) && isLaunched(id));
}

/**
 * Claim this delivery's right to fire ONE-SHOT side effects (revenue event,
 * confirmation email) for a Stripe event, via the payment_events ledger
 * (migration 053). The row-status guards already suppress SEQUENTIAL
 * re-deliveries; this closes the CONCURRENT window where two deliveries of
 * the same event both read a stale row and both fire (run-2 diff review's
 * accepted TOCTOU; fresh-eyes rerun irreversible list #6).
 *
 * Returns true when this delivery won the insert (or when the ledger is
 * unavailable - 053 not yet applied - where blocking payments over a
 * missing observability table would be the worse failure; the sequential
 * guards still hold in that window).
 */
async function claimEventSideEffects(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  eventId: string,
  eventType: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("payment_events")
    .insert({ stripe_event_id: eventId, event_type: eventType });
  if (!error) return true;
  if (error.code === "23505") {
    logger.info(
      { route: "payments.webhook", eventId, eventType },
      "Webhook: duplicate delivery lost the side-effect claim; skipping",
    );
    return false;
  }
  logger.warn(
    { err: error, route: "payments.webhook", eventId, eventType },
    "Webhook: payment_events ledger unavailable (053 applied?); proceeding on row-status guards only",
  );
  return true;
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
 * unpaid session - and the later `async_payment_failed` event only logged,
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
  if (isRegionBlocked(c.req.header("cf-ipcountry"))) {
    return c.json(
      {
        error:
          "Purchases are not available in your region yet. Join the list and we will email you when they are.",
        code: "region_unavailable",
      },
      403,
    );
  }

  const userId = c.get("userId");

  let body: { planId: string; worldIds: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.planId || !body.worldIds || !Array.isArray(body.worldIds)) {
    return c.json({ error: "planId and worldIds[] are required" }, 400);
  }

  // Validate plan
  const plan = PRICING[body.planId as keyof typeof PRICING];
  if (!plan || body.planId === "free") {
    return c.json({ error: "Invalid planId" }, 400);
  }

  // Validate world count matches plan
  if (body.worldIds.length !== plan.worlds) {
    return c.json(
      {
        error: `Plan "${body.planId}" requires exactly ${plan.worlds} world(s)`,
      },
      400,
    );
  }

  // Validate world slugs
  if (!validateWorldIds(body.worldIds)) {
    return c.json({ error: "Invalid world ID(s)" }, 400);
  }

  // Calculate upgrade credit from prior purchases, and read the buyer's email
  // for Stripe's abandoned-cart recovery. Fanned out together so the email
  // lookup costs no extra round-trip on the checkout path.
  const supabase = getSupabaseServerClient(c.get("accessToken"));
  const [{ data: existingPurchases }, { data: buyerProfile }] =
    await Promise.all([
      supabase
        .from("purchases")
        .select("world_ids, amount")
        .eq("user_id", userId)
        .in("status", ["completed", "partially_refunded"]),
      supabase
        .from("profiles")
        .select("email, stripe_customer_id")
        .eq("id", userId)
        .single(),
    ]);
  const buyerEmail = (buyerProfile as { email?: string } | null)?.email;
  // Reuse the Stripe Customer captured by the webhook (migration 043) so a
  // repeat buyer doesn't mint a fresh Customer per purchase - with
  // invoice_creation enabled (STRIPE_TAX_ENABLED) every duplicate Customer
  // fragments billing history exactly where H1 subscriptions will need it.
  const buyerCustomerId =
    (buyerProfile as { stripe_customer_id?: string | null } | null)
      ?.stripe_customer_id ?? null;

  const ownedWorlds = new Set<string>();
  let credit = 0;

  if (existingPurchases && existingPurchases.length > 0) {
    for (const p of existingPurchases as {
      world_ids: string[];
      amount: number;
    }[]) {
      const hasOverlap = p.world_ids.some((id) => body.worldIds.includes(id));
      for (const id of p.world_ids) {
        ownedWorlds.add(id);
      }
      if (hasOverlap) {
        credit += p.amount;
      }
    }

    const allOwned = body.worldIds.every((id) => ownedWorlds.has(id));
    if (allOwned) {
      return c.json({ error: "You already own all these worlds" }, 400);
    }
  }

  credit = Math.min(credit, plan.price);
  const adjustedPrice = Math.max(0, plan.price - credit);
  const isUpgrade = credit > 0;

  // Auto-grant if credit fully covers the price.
  //
  // This MUST use the admin client: purchases has no INSERT policy for
  // authenticated users (001: service-role only), so the user-scoped client
  // is rejected by RLS - and `amount: 0` additionally violated the original
  // `chk_amount_positive CHECK (amount > 0)` until migration 037 relaxed it
  // to `>= 0`. Both failures were silent 500s that made a fully-credited
  // upgrade impossible to redeem (audit run #7; latent until world 2).
  if (adjustedPrice === 0) {
    const admin = getSupabaseAdminClient();
    const grantSessionId = `auto_grant_${crypto.randomUUID()}`;
    const { error: grantError } = await admin.from("purchases").insert({
      user_id: userId,
      plan_id: body.planId,
      world_ids: body.worldIds,
      amount: 0,
      status: "completed",
      stripe_session_id: grantSessionId,
    });
    if (grantError) {
      logger.error(
        { err: grantError, route: "payments.checkout", userId },
        "Auto-grant insert failed",
      );
      return c.json({ error: "Failed to grant worlds" }, 500);
    }
    captureServer(
      SERVER_EVENTS.PAYMENT_COMPLETED,
      {
        planId: body.planId,
        worldIds: body.worldIds,
        amount: 0,
        sessionId: grantSessionId,
        isUpgrade: true,
      },
      userId,
    );
    return c.json({ granted: true, worlds: body.worldIds });
  }

  const stripe = getStripe();
  let appUrl = process.env.APP_URL;
  if (!appUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APP_URL is required in production");
    }
    appUrl = "http://localhost:3000";
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    client_reference_id: userId,
    // Unconditional, and deliberately NOT inside taxSessionParams(): with the
    // tax flag off that helper returns {}, so the buyer's country was never
    // captured. Without it the EU/UK gate has nothing to verify against and
    // the VAT exposure cannot even be measured.
    billing_address_collection: "required",
    ...taxSessionParams(),
    // Abandoned-cart recovery. Stripe can only mail a buyer who drops out of
    // checkout when the session carries their email AND recovery is enabled;
    // with neither set the session just expired in silence. `customer_email`
    // is omitted rather than sent empty when the profile row has none, since
    // Stripe rejects a blank string. `customer` and `customer_email` are
    // mutually exclusive on the API, so the stored Customer wins when we
    // have one.
    ...(buyerCustomerId
      ? { customer: buyerCustomerId }
      : buyerEmail
        ? { customer_email: buyerEmail }
        : {}),
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
            description: `Access to ${body.worldIds.join(", ")}`,
          },
          unit_amount: adjustedPrice * 100, // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      planId: body.planId,
      worldIds: body.worldIds.join(","),
      creditApplied: String(credit),
      originalPrice: String(plan.price),
    },
    success_url: `${appUrl}/dashboard/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?purchase=cancelled`,
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(sessionParams);
  } catch (createErr) {
    if (!buyerCustomerId) throw createErr;
    // The stored Customer can be stale (deleted in the Stripe dashboard, or
    // from a different mode/account). A broken saved id must never block a
    // sale: fall back to a plain email session.
    logger.warn(
      { err: createErr, route: "payments.checkout", userId },
      "Checkout: stored stripe_customer_id rejected; retrying without it",
    );
    delete sessionParams.customer;
    if (buyerEmail) sessionParams.customer_email = buyerEmail;
    session = await stripe.checkout.sessions.create(sessionParams);

    // Clear the stale id so the webhook's `.is("stripe_customer_id", null)`
    // capture can store the fresh Customer this session mints. Without
    // this, "let the webhook re-capture" was a lie (diff review D3): the
    // stale non-null id blocked the capture forever and every future
    // checkout for this user paid the fail→warn→retry path. Admin client:
    // migration 049 clamps this column to service-role writes.
    const { error: clearError } = await getSupabaseAdminClient()
      .from("profiles")
      .update({ stripe_customer_id: null })
      .eq("id", userId);
    if (clearError) {
      logger.warn(
        { err: clearError, route: "payments.checkout", userId },
        "Checkout: failed to clear stale stripe_customer_id (non-fatal)",
      );
    }
  }

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
  if (isRegionBlocked(c.req.header("cf-ipcountry"))) {
    return c.json(
      {
        error:
          "Purchases are not available in your region yet. Join the list and we will email you when they are.",
        code: "region_unavailable",
      },
      403,
    );
  }

  let body: { planId: string; worldIds: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.planId || !body.worldIds || !Array.isArray(body.worldIds)) {
    return c.json({ error: "planId and worldIds[] are required" }, 400);
  }

  const plan = PRICING[body.planId as keyof typeof PRICING];
  if (!plan || body.planId === "free") {
    return c.json({ error: "Invalid planId" }, 400);
  }

  if (body.worldIds.length !== plan.worlds) {
    return c.json(
      {
        error: `Plan "${body.planId}" requires exactly ${plan.worlds} world(s)`,
      },
      400,
    );
  }

  if (!validateWorldIds(body.worldIds)) {
    return c.json({ error: "Invalid world ID(s)" }, 400);
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
    // See the authed path: country capture must not depend on the tax flag.
    billing_address_collection: "required",
    ...taxSessionParams(),
    // No client_reference_id: there is no user yet. The webhook resolves
    // identity from customer_details.email instead, and `guest: "true"`
    // marks which branch a row came from for support and analytics.
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Tensorcraft: ${plan.label}`,
            description: `Access to ${body.worldIds.join(", ")}`,
          },
          unit_amount: plan.price * 100, // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      planId: body.planId,
      worldIds: body.worldIds.join(","),
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
// Supabase client in lib/progress.ts (hasWorldPurchase). This endpoint
// is retained for future admin dashboards, mobile clients, or external
// API consumers that can't use the Supabase client directly.
// ──────────────────────────────────────────────

payments.use("/purchases", authMiddleware);

payments.get("/purchases", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");
  const worldId = c.req.query("worldId");

  const supabase = getSupabaseServerClient(token);

  let query = supabase
    .from("purchases")
    .select("id, plan_id, world_ids, amount, status, created_at")
    .eq("user_id", userId)
    .in("status", ["completed", "partially_refunded"]);

  if (worldId) {
    if (!isValidWorldSlug(worldId)) {
      return c.json({ error: "Invalid worldId" }, 400);
    }
    query = query.contains("world_ids", [worldId]);
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
    hasAccess: worldId ? data.length > 0 : undefined,
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
            // APP_URL falls back to the production domain, NOT "" - every
            // other unset-APP_URL site fails loud, but this one silently
            // mailed a paying guest a relative (= broken) access link
            // (R3-9).
            void sendPurchaseAccessLink(
              getSupabaseServerClient(),
              guestEmail,
              `${process.env.APP_URL ?? "https://tensorcraft.app"}/dashboard/purchase-success`,
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

      const worldIds = metadata.worldIds
        ? metadata.worldIds.split(",").filter(Boolean)
        : [];

      // Validate world IDs from metadata against canonical slug list.
      // Empty array is rejected, every paid purchase must grant at
      // least one world (§6h referential integrity).
      if (!validateWorldIds(worldIds)) {
        logger.error(
          {
            route: "payments.webhook",
            userId,
            stripeSessionId: sessionId,
            worldIds,
          },
          "Webhook: Invalid world IDs in metadata",
        );
        return c.json({ error: "Webhook: Invalid world IDs in metadata" }, 400);
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

      // Tax jurisdiction + amount, captured at the moment of sale (re-audit
      // N0). Unlike seats or subscriptions, this CANNOT be reconstructed from a
      // flat USD row after 100k transactions - EU VAT is owed at the buyer's
      // rate from the first sale. Persist whatever Stripe collected; the fields
      // are null/0 until the operator enables Stripe Tax (STRIPE_TAX_ENABLED),
      // at which point every new sale records its jurisdiction. `amount_tax` is
      // in cents, like `amount_total`.
      const taxAmount = session.total_details?.amount_tax;
      const taxCountry = session.customer_details?.address?.country ?? null;
      const customerTaxId =
        session.customer_details?.tax_ids?.[0]?.value ?? null;

      const { error: upsertError } = await supabase.from("purchases").upsert(
        {
          user_id: userId,
          plan_id: metadata.planId,
          world_ids: worldIds,
          amount: amount ? amount / 100 : expectedAmount,
          tax_amount: typeof taxAmount === "number" ? taxAmount / 100 : null,
          tax_country: taxCountry,
          customer_tax_id: customerTaxId,
          stripe_session_id: sessionId,
          stripe_payment_intent: paymentIntent,
          status: rowStatus,
        },
        // A "pending" write only ever needs to CREATE the row. The pre-check
        // above guards the sequential demotion case, but a concurrently
        // retried unpaid event can still interleave with
        // async_payment_succeeded (pre-check reads pending → async promotes
        // to completed → this upsert lands last). ON CONFLICT DO NOTHING for
        // pending writes closes that window at the DB level; the eventual
        // async settle fills payment_intent and the tax fields anyway.
        // Completed writes keep DO UPDATE so promotion and field backfill
        // still work.
        {
          onConflict: "stripe_session_id",
          ignoreDuplicates: rowStatus === "pending",
        },
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
          // supabase-js reports failures in the result object, it does not
          // throw - the catch below only covers transport-level rejections.
          // Inspect the error explicitly or a failure (e.g. migration 043
          // not applied) is a silent no-op with no operator signal.
          const { error: custError } = await supabase
            .from("profiles")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("id", userId)
            .is("stripe_customer_id", null);
          if (custError) {
            logger.warn(
              { err: custError, route: "payments.webhook", userId },
              "Webhook: failed to persist stripe_customer_id (non-fatal)",
            );
          }
        } catch (custErr) {
          logger.warn(
            { err: custErr, route: "payments.webhook", userId },
            "Webhook: failed to persist stripe_customer_id (non-fatal)",
          );
        }
      }

      // Revenue event + confirmation email fire only once the payment has
      // actually settled. For delayed methods that happens in the
      // async_payment_succeeded handler below, not here. Two layers of
      // dedupe: the row-status guard suppresses sequential re-deliveries,
      // and the payment_events claim (migration 053) closes the concurrent
      // window where two deliveries both read a stale row.
      if (
        rowStatus === "completed" &&
        existingRow?.status !== "completed" &&
        (await claimEventSideEffects(supabase, event.id, event.type))
      ) {
        // Fire authoritative server-side conversion event (§6i).
        // Client may also fire one, but this is the revenue source of truth.
        captureServer(
          SERVER_EVENTS.PAYMENT_COMPLETED,
          {
            planId: metadata.planId,
            worldIds,
            amount: amount ? amount / 100 : expectedAmount,
            sessionId,
            isUpgrade: creditApplied > 0,
          },
          userId,
        );

        // Geo-gate backstop. The gate refuses checkout on Cloudflare's edge
        // geolocation, which a VPN defeats. Stripe collects the BILLING
        // country regardless, so this is the one place that sees ground
        // truth.
        //
        // It flags and does not act: the money has already moved by now, and
        // auto-refunding on a billing address would be a worse failure than a
        // human reviewing a rare event. The purchase is recorded either way,
        // because withholding access from someone who paid is the bigger
        // error.
        const billingCountry = (
          session.customer_details as { address?: { country?: string } } | null
        )?.address?.country;
        if (isVatGatedCountry(billingCountry)) {
          captureException(
            new Error(`Purchase settled from gated region: ${billingCountry}`),
            {
              source: "payments.geo-backstop",
              extra: {
                sessionId,
                billingCountry,
                worldIds,
                note: "Sale completed from an EU/UK billing address while checkout is US-only. Review and refund if required.",
              },
            },
          );
        }

        // The buyer's email feeds two independent sends. Fetched ONCE and
        // outside both, because the receipt must not depend on Kit: Kit's
        // stored credentials currently 401, and a receipt is the legally
        // expected artifact of a payment.
        let buyerEmail: string | null = null;
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .single();
          buyerEmail = profile?.email ?? null;
        } catch (profileErr) {
          logger.warn(
            {
              err: profileErr,
              route: "payments.webhook",
              userId,
              stripeSessionId: sessionId,
            },
            "Buyer profile lookup failed; no receipt or Kit tag will be sent",
          );
        }

        // Receipt first: it is the one the buyer actually needs, and it must
        // not be skipped by a Kit failure. sendPurchaseReceipt never throws
        // and bounds its own wait, so this cannot 500 the webhook.
        if (buyerEmail) {
          // Guarded at the CALL SITE as well as inside the helper. Relying on
          // a callee's promise never to reject is how a successful payment
          // turns into a 500 and a Stripe retry after some later edit.
          try {
            await sendPurchaseReceipt({
              email: buyerEmail,
              worldIds,
              amount: amount ? amount / 100 : expectedAmount,
              sessionId,
              purchasedAt: new Date(),
            });
          } catch (receiptErr) {
            logger.warn(
              {
                err: receiptErr,
                route: "payments.webhook",
                userId,
                stripeSessionId: sessionId,
              },
              "Purchase receipt failed (non-blocking); payment is recorded",
            );
          }
        }

        // Kit lifecycle tagging (fire-and-forget, separate failure domain)
        try {
          if (buyerEmail) {
            await addSubscriber(buyerEmail);
            const purchaseTagId = process.env.KIT_TAG_PURCHASED;
            if (purchaseTagId) {
              await tagSubscriber(buyerEmail, purchaseTagId);
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
      } else if (rowStatus === "completed") {
        logger.info(
          { route: "payments.webhook", userId, stripeSessionId: sessionId },
          "Webhook: duplicate completed delivery; revenue event and email already fired",
        );
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
        const { data: disputedRows, error: disputeError } = await supabase
          .from("purchases")
          .update({ status: "disputed" })
          .eq("stripe_payment_intent", disputePaymentIntent)
          .select("id");

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

        if (!disputedRows || disputedRows.length === 0) {
          // Same failure mode the refund handler fixed in audit run #7:
          // ACKing a dispute that matched no purchase row (missing intent,
          // or the dispute outran fulfilment) permanently loses the access
          // revocation. 500 so Stripe retries once the row exists.
          logger.error(
            {
              route: "payments.webhook",
              eventType: event.type,
              paymentIntent: disputePaymentIntent,
            },
            "Webhook: dispute matched no purchase row; requesting retry",
          );
          return c.json({ error: "No purchase row for dispute yet" }, 500);
        }
      }

      break;
    }

    case "charge.dispute.closed": {
      // A WON dispute must restore access (gap sweep F2, 2026-07-25): the
      // funds come back but the row sat terminally "disputed" forever - no
      // handler existed, and 038's trigger silently blocked any manual
      // repair. Restoration goes through the migration-051 RPC, the single
      // sanctioned path through the trigger's transaction-local escape
      // hatch (a plain UPDATE here would be clamped back to "disputed").
      // A LOST dispute needs nothing: "disputed" stays, access stays
      // revoked.
      const closedDispute = event.data.object as Stripe.Dispute;
      const closedPaymentIntent =
        typeof closedDispute.payment_intent === "string"
          ? closedDispute.payment_intent
          : closedDispute.payment_intent?.id;

      if (closedDispute.status === "won" && closedPaymentIntent) {
        const { data: restoredCount, error: restoreError } = await supabase.rpc(
          "restore_purchase_after_dispute",
          {
            p_payment_intent: closedPaymentIntent,
          },
        );

        if (restoreError) {
          logger.error(
            {
              err: restoreError,
              route: "payments.webhook",
              eventType: event.type,
              paymentIntent: closedPaymentIntent,
            },
            "Webhook: failed to restore purchase after won dispute",
          );
          // 500 so Stripe retries - includes the migration-051-not-applied
          // case (unknown function), which resolves once it is applied.
          return c.json({ error: "Database error" }, 500);
        }

        if (!restoredCount) {
          // No disputed row matched: either the intent is missing on the
          // row or ordering raced. Same retry contract as refund/dispute
          // zero-row handling.
          logger.error(
            {
              route: "payments.webhook",
              eventType: event.type,
              paymentIntent: closedPaymentIntent,
            },
            "Webhook: won dispute matched no disputed purchase row; requesting retry",
          );
          return c.json({ error: "No disputed row to restore yet" }, 500);
        }

        logger.info(
          {
            route: "payments.webhook",
            paymentIntent: closedPaymentIntent,
            restored: restoredCount,
          },
          "Webhook: dispute won; purchase access restored",
        );
      }

      break;
    }

    case "checkout.session.async_payment_succeeded": {
      // Handle delayed payment methods (bank transfers, etc.)
      const asyncSession = event.data.object as Stripe.Checkout.Session;
      const asyncUserId = asyncSession.client_reference_id;
      const asyncMetadata = asyncSession.metadata;

      if (asyncUserId && asyncMetadata?.planId) {
        const asyncWorldIds = asyncMetadata.worldIds
          ? asyncMetadata.worldIds.split(",")
          : [];
        const asyncPlan = PRICING[asyncMetadata.planId as keyof typeof PRICING];

        if (asyncPlan && validateWorldIds(asyncWorldIds)) {
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
            // Same tax capture as the sync path (N0): delayed payment methods
            // (SEPA, bank transfer) incur VAT too, and this is where they
            // settle.
            const asyncTaxAmount = asyncSession.total_details?.amount_tax;
            const { error: asyncUpsertError } = await supabase
              .from("purchases")
              .upsert(
                {
                  user_id: asyncUserId,
                  plan_id: asyncMetadata.planId,
                  world_ids: asyncWorldIds,
                  amount: asyncSession.amount_total
                    ? asyncSession.amount_total / 100
                    : asyncPlan.price,
                  tax_amount:
                    typeof asyncTaxAmount === "number"
                      ? asyncTaxAmount / 100
                      : null,
                  tax_country:
                    asyncSession.customer_details?.address?.country ?? null,
                  customer_tax_id:
                    asyncSession.customer_details?.tax_ids?.[0]?.value ?? null,
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
            if (asyncUpsertError) {
              // A failed settle upsert must be RETRIED, not ACKed: swallowing
              // it locked a delayed-method buyer (SEPA/bank transfer) out
              // permanently and silently - the money moved, the row never
              // promoted, and Stripe was told all was well (fresh-eyes rerun
              // T0-6).
              logger.error(
                {
                  err: asyncUpsertError,
                  route: "payments.webhook",
                  eventType: event.type,
                  userId: asyncUserId,
                  stripeSessionId: asyncSession.id,
                },
                "Webhook: failed to settle delayed payment; requesting retry",
              );
              return c.json({ error: "Database error" }, 500);
            }

            if (
              existingAsyncRow?.status !== "completed" &&
              (await claimEventSideEffects(supabase, event.id, event.type))
            ) {
              captureServer(
                SERVER_EVENTS.PAYMENT_COMPLETED,
                {
                  planId: asyncMetadata.planId,
                  worldIds: asyncWorldIds,
                  amount: asyncSession.amount_total
                    ? asyncSession.amount_total / 100
                    : asyncPlan.price,
                  sessionId: asyncSession.id,
                  isUpgrade: Number(asyncMetadata.creditApplied || "0") > 0,
                },
                asyncUserId,
              );

              // Same split as the sync path: one lookup, receipt first, Kit
              // in its own failure domain. A delayed-method buyer (SEPA,
              // bank debit) settles ONLY here, so skipping the receipt in
              // this branch would mean those buyers never get one.
              let asyncBuyerEmail: string | null = null;
              try {
                const { data: asyncProfile } = await supabase
                  .from("profiles")
                  .select("email")
                  .eq("id", asyncUserId)
                  .single();
                asyncBuyerEmail = asyncProfile?.email ?? null;
              } catch (profileErr) {
                logger.warn(
                  {
                    err: profileErr,
                    route: "payments.webhook",
                    userId: asyncUserId,
                    stripeSessionId: asyncSession.id,
                  },
                  "Buyer profile lookup failed; no receipt or Kit tag will be sent",
                );
              }

              if (asyncBuyerEmail) {
                try {
                  await sendPurchaseReceipt({
                    email: asyncBuyerEmail,
                    worldIds: asyncWorldIds,
                    amount: asyncSession.amount_total
                      ? asyncSession.amount_total / 100
                      : asyncPlan.price,
                    sessionId: asyncSession.id,
                    purchasedAt: new Date(),
                  });
                } catch (receiptErr) {
                  logger.warn(
                    {
                      err: receiptErr,
                      route: "payments.webhook",
                      userId: asyncUserId,
                      stripeSessionId: asyncSession.id,
                    },
                    "Purchase receipt failed (non-blocking); payment is recorded",
                  );
                }
              }

              try {
                if (asyncBuyerEmail) {
                  await addSubscriber(asyncBuyerEmail);
                  const purchaseTagId = process.env.KIT_TAG_PURCHASED;
                  if (purchaseTagId) {
                    await tagSubscriber(asyncBuyerEmail, purchaseTagId);
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
              worldIds: asyncWorldIds,
            },
            "Webhook async: invalid world IDs in metadata",
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
      // which left the purchase in whatever state the sync handler wrote -
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
