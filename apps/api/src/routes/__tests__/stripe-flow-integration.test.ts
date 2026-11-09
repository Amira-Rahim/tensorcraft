/**
 * §8j Stripe webhook flow integration test.
 *
 * APPROACH
 * ────────
 * Exercises the full end-to-end webhook path with the REAL Stripe SDK
 * used for signature construction/verification, only outbound API
 * calls are stubbed. We hand-craft a `stripe.webhooks.generateTestHeaderString()`
 * signature so the webhook handler takes the happy branch.
 *
 * Flow asserted:
 *   1. webhook signature verified (constructEvent succeeds)
 *   2. purchases row upserted via service-role client
 *   3. PostHog server event fired (`payment_completed`)
 *   4. Kit purchase tag fired via addSubscriber + tagSubscriber
 *   5. /api/purchases/access subsequently reports access for the world
 *
 * Live-service caveat: we do not hit the real Stripe /events API or Kit.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import Stripe from "stripe";
import type { AppEnv } from "../../types";

const TEST_SECRET = "whsec_test_integration_12345";
const USER_ID = "integration-user-1";
const SESSION_ID = "cs_test_integration_abc123";
const PAYMENT_INTENT_ID = "pi_test_integration_xyz";

// ─────────────────────────────────────────────────────────────
// In-memory Supabase mock (admin client only, webhook path).
// ─────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;
const db: Record<string, Row[]> = {
  profiles: [],
  purchases: [],
  // Webhook idempotency ledger (migration 053).
  payment_events: [],
};

const mockAuthGetUser = vi.fn();

function makeFrom(table: string) {
  const filters: Array<{ field: string; value: unknown }> = [];
  const api: Record<string, unknown> = {};
  let update: Row | undefined;

  function applyFilters(rows: Row[]): Row[] {
    return rows.filter((row) =>
      filters.every((f) =>
        (f as { op?: string }).op === "in"
          ? (f.value as unknown[]).includes(row[f.field])
          : row[f.field] === f.value,
      ),
    );
  }

  api.select = () => api;
  api.eq = (field: string, value: unknown) => {
    filters.push({ field, value });
    return api;
  };
  api.in = (field: string, values: unknown[]) => {
    filters.push({ field, value: values, op: "in" } as never);
    return api;
  };
  api.maybeSingle = () =>
    Promise.resolve({
      data: applyFilters(db[table])[0] ?? null,
      error: null,
    });
  api.single = () =>
    Promise.resolve({
      data: applyFilters(db[table])[0] ?? null,
      error: null,
    });

  api.insert = (payload: Row | Row[]) => {
    const rows = Array.isArray(payload) ? payload : [payload];
    // payment_events has a PRIMARY KEY on stripe_event_id: mimic the
    // unique-violation so the idempotency claim behaves like production
    // (second insert of the same event id loses with 23505).
    if (table === "payment_events") {
      for (const row of rows) {
        if (
          db[table].some(
            (r) => r.stripe_event_id === (row as Row).stripe_event_id,
          )
        ) {
          return Promise.resolve({ error: { code: "23505" } });
        }
      }
    }
    db[table].push(...rows);
    return Promise.resolve({ error: null });
  };

  api.upsert = (payload: Row, opts?: { onConflict?: string }) => {
    const key = opts?.onConflict ?? "id";
    const existingIdx = db[table].findIndex(
      (r) => r[key] === (payload as Row)[key],
    );
    if (existingIdx >= 0) {
      db[table][existingIdx] = { ...db[table][existingIdx], ...payload };
    } else {
      db[table].push(payload);
    }
    return Promise.resolve({ error: null });
  };

  api.update = (patch: Row) => {
    update = patch;
    return api;
  };

  api.then = (onFulfilled: (v: unknown) => unknown) => {
    const rows = applyFilters(db[table]);
    if (update) for (const row of rows) Object.assign(row, update);
    return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
  };

  return api;
}

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: { getUser: mockAuthGetUser },
    from: (table: string) => makeFrom(table),
  }),
  getSupabaseAdminClient: () => ({
    from: (table: string) => makeFrom(table),
    // Mirrors migration 051: restore_purchase_after_dispute moves ONLY rows
    // sitting in "disputed" back to "completed" and returns the row count.
    rpc: (fn: string, args: { p_payment_intent: string }) => {
      if (fn !== "restore_purchase_after_dispute") {
        return Promise.resolve({
          data: null,
          error: { message: `unknown rpc ${fn}` },
        });
      }
      const restored = db.purchases.filter(
        (row) =>
          row.stripe_payment_intent === args.p_payment_intent &&
          row.status === "disputed",
      );
      for (const row of restored) row.status = "completed";
      return Promise.resolve({ data: restored.length, error: null });
    },
  }),
}));

vi.mock("../../lib/redis", () => ({
  getRedis: () => ({
    get: () => Promise.resolve(null),
    set: () => Promise.resolve("OK"),
  }),
}));

// Kit client, assert it fires on checkout.session.completed
const kitAddSubscriber = vi.fn().mockResolvedValue(undefined);
const kitTagSubscriber = vi.fn().mockResolvedValue(undefined);
const kitRemoveTag = vi.fn().mockResolvedValue(undefined);

vi.mock("../../lib/kit", () => ({
  addSubscriber: (...args: unknown[]) => kitAddSubscriber(...args),
  tagSubscriber: (...args: unknown[]) => kitTagSubscriber(...args),
  removeTagFromSubscriber: (...args: unknown[]) => kitRemoveTag(...args),
}));

// PostHog, assert server event fires
const captureServerMock = vi.fn();
const operatorAlertMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../../lib/operator-alert", () => ({
  sendOperatorAlert: (...args: unknown[]) => operatorAlertMock(...args),
}));
vi.mock("../../lib/posthog", () => ({
  captureServer: (...args: unknown[]) => captureServerMock(...args),
  withPostHogUserContext: (_distinctId: string, fn: () => unknown) => fn(),
  SERVER_EVENTS: {
    PAYMENT_COMPLETED: "payment_completed",
    PAYMENT_FAILED: "payment_failed",
    PAYMENT_REFUNDED: "payment_refunded",
    PAYMENT_DISPUTED: "payment_disputed",
    CODE_PUSHED: "code_pushed",
  },
}));

// Import routes after mocks.
const { payments } = await import("../payments");
const { purchases: purchasesRoute } = await import("../purchases");

function createApp() {
  const app = new Hono<AppEnv>();
  app.route("/api/payments", payments);
  app.route("/api/purchases", purchasesRoute);
  return app;
}

beforeEach(() => {
  db.profiles = [];
  db.purchases = [];
  db.payment_events = [];
  mockAuthGetUser.mockReset();
  captureServerMock.mockReset();
  operatorAlertMock.mockClear();
  kitAddSubscriber.mockClear();
  kitTagSubscriber.mockClear();
  kitRemoveTag.mockClear();

  process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_construct_event";
  process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
  process.env.KIT_TAG_PURCHASED = "tag-purchase-123";
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.KIT_TAG_PURCHASED;
});

/** Build a valid Stripe signature for a webhook payload. */
function signPayload(payload: string): string {
  // The Stripe SDK ships a helper to generate a valid header for tests.
  const stripe = new Stripe("sk_test_dummy_for_construct_event");
  return stripe.webhooks.generateTestHeaderString({
    payload,
    secret: TEST_SECRET,
    timestamp: Math.floor(Date.now() / 1000),
  });
}

function buildCheckoutCompletedEvent(): string {
  const event = {
    id: "evt_test_1",
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: SESSION_ID,
        object: "checkout.session",
        client_reference_id: USER_ID,
        amount_total: 4900, // $49 in cents
        // The money moved; unpaid sessions are recorded as pending, never
        // completed (audit run #7 payment_status gate).
        payment_status: "paid",
        payment_intent: PAYMENT_INTENT_ID,
        metadata: {
          planId: "single",
          worldIds: "deep-orbit",
          creditApplied: "0",
          originalPrice: "49",
        },
      },
    },
  };
  return JSON.stringify(event);
}

describe("Stripe webhook → purchase → access integration flow", () => {
  it("rejects invalid signature with 400", async () => {
    const payload = buildCheckoutCompletedEvent();
    const res = await createApp().request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=deadbeef",
      },
      body: payload,
    });
    expect(res.status).toBe(400);
    expect(db.purchases).toHaveLength(0);
  });

  it("rejects missing stripe-signature header with 400", async () => {
    const res = await createApp().request("/api/payments/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: buildCheckoutCompletedEvent(),
    });
    expect(res.status).toBe(400);
  });

  it("fulfills a historical $49 checkout at its original amount after a price change", async () => {
    // Seed a profile so the Kit fire-and-forget branch finds an email.
    db.profiles.push({ id: USER_ID, email: "buyer@example.com" });

    const payload = buildCheckoutCompletedEvent();
    const signature = signPayload(payload);

    const webhookRes = await createApp().request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    });
    expect(webhookRes.status).toBe(200);
    const body = (await webhookRes.json()) as { received: boolean };
    expect(body.received).toBe(true);

    // 1) Purchase row written
    expect(db.purchases).toHaveLength(1);
    const purchase = db.purchases[0];
    expect(purchase.user_id).toBe(USER_ID);
    expect(purchase.status).toBe("completed");
    expect(purchase.amount).toBe(49);
    expect(purchase.world_ids).toEqual(["deep-orbit"]);
    expect(purchase.stripe_session_id).toBe(SESSION_ID);

    // 2) PostHog server event fired
    expect(captureServerMock).toHaveBeenCalledWith(
      "payment_completed",
      expect.objectContaining({
        planId: "single",
        worldIds: ["deep-orbit"],
        sessionId: SESSION_ID,
      }),
      USER_ID,
    );

    // 3) Kit subscriber added + tagged
    expect(kitAddSubscriber).toHaveBeenCalledWith("buyer@example.com");
    expect(kitTagSubscriber).toHaveBeenCalledWith(
      "buyer@example.com",
      "tag-purchase-123",
    );

    // 4) Access check now returns the purchased world.
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    const accessRes = await createApp().request("/api/purchases/access", {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(accessRes.status).toBe(200);
    const access = (await accessRes.json()) as {
      worldIds: string[];
      hasFullBundle: boolean;
    };
    expect(access.worldIds).toContain("deep-orbit");
  });

  it("is idempotent: second delivery of same session does not duplicate", async () => {
    db.profiles.push({ id: USER_ID, email: "buyer@example.com" });
    const payload = buildCheckoutCompletedEvent();

    for (let i = 0; i < 2; i++) {
      const signature = signPayload(payload);
      const res = await createApp().request("/api/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": signature,
        },
        body: payload,
      });
      expect(res.status).toBe(200);
    }

    // Upsert-with-onConflict keeps a single row per stripe_session_id.
    const matching = db.purchases.filter(
      (p) => p.stripe_session_id === SESSION_ID,
    );
    expect(matching).toHaveLength(1);
  });

  it("keeps access revoked when a partial refund arrives after a full refund", async () => {
    db.purchases.push({
      id: "purchase-1",
      user_id: USER_ID,
      stripe_payment_intent: PAYMENT_INTENT_ID,
      status: "completed",
      world_ids: ["deep-orbit"],
    });
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    const app = createApp();
    const refund = async (amount: number) => {
      const payload = JSON.stringify({
        id: `evt_refund_${amount}`,
        type: "charge.refunded",
        data: {
          object: {
            payment_intent: PAYMENT_INTENT_ID,
            amount: 5000,
            amount_refunded: amount,
          },
        },
      });
      return app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": signPayload(payload) },
        body: payload,
      });
    };
    const access = async () =>
      (
        await app.request("/api/purchases/access", {
          headers: { Authorization: "Bearer valid-token" },
        })
      ).json();

    expect((await refund(1000)).status).toBe(200);
    expect((await access()).worldIds).toEqual(["deep-orbit"]);
    expect((await refund(5000)).status).toBe(200);
    expect((await access()).worldIds).toEqual([]);
    expect((await refund(1000)).status).toBe(200);
    expect(db.purchases[0].status).toBe("refunded");
    expect((await access()).worldIds).toEqual([]);
    expect((await refund(5000)).status).toBe(200);
    expect(db.purchases[0].status).toBe("refunded");
    expect((await access()).worldIds).toEqual([]);
    expect(captureServerMock).toHaveBeenCalledTimes(2);
    expect(operatorAlertMock).toHaveBeenCalledTimes(2);
    expect(db.payment_events).toHaveLength(2);
  });

  it.each(["refunded", "disputed", "failed"])(
    "does not restore %s purchases on a delayed partial refund",
    async (status) => {
      db.purchases.push({
        id: "purchase-1",
        user_id: USER_ID,
        stripe_payment_intent: PAYMENT_INTENT_ID,
        status,
        world_ids: ["deep-orbit"],
      });
      const payload = JSON.stringify({
        id: "evt_delayed_partial_refund",
        type: "charge.refunded",
        data: {
          object: {
            payment_intent: PAYMENT_INTENT_ID,
            amount: 5000,
            amount_refunded: 1000,
          },
        },
      });
      const res = await createApp().request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": signPayload(payload) },
        body: payload,
      });
      expect(res.status).toBe(200);
      expect(db.purchases[0].status).toBe(status);
      expect(db.payment_events).toHaveLength(0);
      expect(operatorAlertMock).not.toHaveBeenCalled();
    },
  );

  // Chargeback lifecycle against a seeded purchase row. Migration 038 lets
  // a terminal row move to "disputed", and the migration-051 RPC restores
  // any "disputed" row to "completed" when the dispute is won, so the
  // handler itself must refuse to dispute a row that already lost access
  // (audit 2026-09-20).
  function seedPurchase(status: string) {
    db.purchases.push({
      id: "purchase-1",
      user_id: USER_ID,
      stripe_payment_intent: PAYMENT_INTENT_ID,
      status,
      world_ids: ["deep-orbit"],
    });
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  }
  const postDispute = (
    app: ReturnType<typeof createApp>,
    type: "charge.dispute.created" | "charge.dispute.closed",
    outcome?: "won" | "lost",
  ) => {
    const payload = JSON.stringify({
      id: `evt_${type}_${outcome ?? "open"}`,
      type,
      data: {
        object: {
          id: "dp_1",
          payment_intent: PAYMENT_INTENT_ID,
          ...(outcome ? { status: outcome } : {}),
        },
      },
    });
    return app.request("/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": signPayload(payload) },
      body: payload,
    });
  };
  const accessWorlds = async (app: ReturnType<typeof createApp>) =>
    (
      (await (
        await app.request("/api/purchases/access", {
          headers: { Authorization: "Bearer valid-token" },
        })
      ).json()) as { worldIds: string[] }
    ).worldIds;

  it.each(["refunded", "failed"])(
    "keeps a %s purchase revoked when a chargeback is filed and then won",
    async (status) => {
      seedPurchase(status);
      const app = createApp();

      const opened = await postDispute(app, "charge.dispute.created");
      expect(opened.status).toBe(200);
      expect(db.purchases[0].status).toBe(status);
      expect(operatorAlertMock).not.toHaveBeenCalled();

      const won = await postDispute(app, "charge.dispute.closed", "won");
      expect(won.status).toBe(200);
      expect(db.purchases[0].status).toBe(status);
      expect(await accessWorlds(app)).toEqual([]);
    },
  );

  it("revokes a completed purchase on chargeback and restores it when won", async () => {
    seedPurchase("completed");
    const app = createApp();

    expect((await postDispute(app, "charge.dispute.created")).status).toBe(200);
    expect(db.purchases[0].status).toBe("disputed");
    expect(await accessWorlds(app)).toEqual([]);
    expect(operatorAlertMock).toHaveBeenCalledTimes(1);
    expect(operatorAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: "dispute", severity: "critical" }),
    );

    expect(
      (await postDispute(app, "charge.dispute.closed", "won")).status,
    ).toBe(200);
    expect(db.purchases[0].status).toBe("completed");
    expect(await accessWorlds(app)).toEqual(["deep-orbit"]);
  });

  it("restores a partially refunded purchase to completed when a chargeback is won", async () => {
    // Known limitation: the 051 RPC restores every "disputed" row to
    // "completed" and does not remember that this one was
    // "partially_refunded" before the dispute. Both statuses grant access
    // (apps/web/lib/entitlements.ts), so the buyer gets the right outcome;
    // only the partial-refund marker on the status column is lost. Fixing
    // that needs a migration and is out of scope here.
    seedPurchase("partially_refunded");
    const app = createApp();

    expect((await postDispute(app, "charge.dispute.created")).status).toBe(200);
    expect(db.purchases[0].status).toBe("disputed");
    expect(await accessWorlds(app)).toEqual([]);

    expect(
      (await postDispute(app, "charge.dispute.closed", "won")).status,
    ).toBe(200);
    expect(db.purchases[0].status).toBe("completed");
    expect(await accessWorlds(app)).toEqual(["deep-orbit"]);
  });

  it("acknowledges a replayed chargeback on an already disputed purchase and still alerts", async () => {
    // No ledger claim guards this event, so a retry after a crash between
    // the update and the alert must still reach the operator.
    seedPurchase("disputed");
    const app = createApp();

    expect((await postDispute(app, "charge.dispute.created")).status).toBe(200);
    expect(db.purchases[0].status).toBe("disputed");
    expect(operatorAlertMock).toHaveBeenCalledTimes(1);
  });
});
