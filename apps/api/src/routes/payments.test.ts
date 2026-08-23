import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { payments } from "./payments";

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockConstructEvent = vi.fn();
const mockSessionCreate = vi.fn();

/**
 * Controls the admin-client pre-check query
 *   supabase.from("purchases").select("status").eq(...).maybeSingle()
 * used by the webhook's race-condition no-regression logic (§338).
 * Default null means "row does not exist".
 */
let mockAdminExistingRow: { status: string } | null = null;
// When set, controls what update().eq()[.select()] resolves to.
let mockEqResult: { data: unknown; error: unknown } | null = null;

// Controls what the server-client purchases query resolves to for upgrade tests
let mockExistingPurchases: { world_ids: string[]; amount: number }[] | null =
  null;
// Controls insert result for the auto-grant path
const mockServerInsert = vi.fn();
const mockProfileUpdate = vi.fn();
let mockProfileEmail: string | null = "buyer@example.com";
// Stored Stripe customer id on the buyer's profile (migration 043). When set,
// checkout must pass `customer` instead of `customer_email`.
let mockProfileCustomerId: string | null = null;

vi.mock("stripe", () => ({
  default: class MockStripe {
    webhooks = {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    };
    checkout = {
      sessions: {
        create: (...args: unknown[]) => mockSessionCreate(...args),
      },
    };
  },
}));

// charge.dispute.closed (won) restores access through the migration-051 RPC.
const mockRpc = vi.fn();

// payment_events idempotency ledger (migration 053): default = this
// delivery WINS the claim. Set `data: null, error: {code: "23505"}` to
// simulate losing to a concurrent duplicate.
const mockEventLedgerInsert = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (table: string) => {
      if (table === "payment_events") {
        return {
          insert: (...args: unknown[]) => {
            mockEventLedgerInsert(...args);
            return Promise.resolve({ data: null, error: null });
          },
        };
      }
      if (table === "purchases") {
        return {
          upsert: mockInsert,
          // The credit auto-grant inserts via the ADMIN client (purchases has
          // no INSERT policy for authenticated users; audit run #7).
          insert: (...args: unknown[]) => mockServerInsert(...args),
          update: (data: unknown) => {
            mockUpdate(data);
            return {
              eq: (...eqArgs: unknown[]) => {
                mockEq(...eqArgs);
                // charge.refunded chains .select("id") to detect the
                // zero-rows case; async_payment_failed awaits .eq directly.
                const result = Promise.resolve(
                  mockEqResult ?? { data: null, error: null },
                ) as Promise<unknown> & { select?: unknown };
                result.select = () =>
                  Promise.resolve(
                    mockEqResult ?? { data: [{ id: "p_1" }], error: null },
                  );
                return result;
              },
            };
          },
          select: () => ({
            eq: () => ({
              // pre-check for race-condition no-regression (§338)
              maybeSingle: () =>
                Promise.resolve({ data: mockAdminExistingRow, error: null }),
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              // The webhook looks the buyer's email up through the ADMIN
              // client to send the receipt and the Kit tag. This returned a
              // bare null until 2026-08-23, which silently made both
              // unreachable in tests.
              single: () =>
                Promise.resolve({
                  data: mockProfileEmail ? { email: mockProfileEmail } : null,
                  error: null,
                }),
            }),
          }),
          // The webhook persists stripe_customer_id via
          // .update({...}).eq("id", …).is("stripe_customer_id", null)
          update: (data: unknown) => {
            mockProfileUpdate(data);
            return {
              eq: () => ({
                is: () => Promise.resolve({ data: null, error: null }),
              }),
            };
          },
        };
      }
      return {};
    },
  }),
  getSupabaseServerClient: () => ({
    // authMiddleware calls supabase.auth.getUser()
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: "user-test-123" } },
          error: null,
        }),
    },
    from: (table: string) => {
      if (table === "purchases") {
        return {
          // upgrade-credit query:
          // .select().eq("user_id", …).in("status", ["completed", "partially_refunded"])
          select: () => ({
            eq: () => ({
              in: () =>
                Promise.resolve({ data: mockExistingPurchases, error: null }),
            }),
          }),
          // auto-grant insert path
          insert: (...args: unknown[]) => mockServerInsert(...args),
        };
      }
      if (table === "profiles") {
        // Checkout reads the buyer's email + stored Stripe customer id.
        // .select("email, stripe_customer_id").eq("id", …).single()
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: mockProfileEmail
                    ? {
                        email: mockProfileEmail,
                        stripe_customer_id: mockProfileCustomerId,
                      }
                    : null,
                  error: null,
                }),
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

// Guest identity resolution is exercised on its own; here we only care that
// the webhook calls it when client_reference_id is absent and honours the
// result. Default: the email resolves to a freshly provisioned user.
const mockResolveUser = vi.fn(async () => "user_guest_provisioned");
const mockSendAccessLink = vi.fn(async () => {});
vi.mock("../lib/guest-account", () => ({
  resolveOrCreateUserByEmail: (...args: unknown[]) => mockResolveUser(...args),
  sendPurchaseAccessLink: (...args: unknown[]) => mockSendAccessLink(...args),
}));

// Revenue analytics + Kit email are asserted on directly by the duplicate-
// delivery tests: a re-delivered completed event must not double-fire either.
const mockCaptureServer = vi.fn();
vi.mock("../lib/posthog", () => ({
  captureServer: (...args: unknown[]) => mockCaptureServer(...args),
  SERVER_EVENTS: {
    PAYMENT_COMPLETED: "payment_completed",
    PAYMENT_REFUNDED: "payment_refunded",
  },
}));
const mockAddSubscriber = vi.fn(async () => {});
const mockTagSubscriber = vi.fn(async () => {});
vi.mock("../lib/kit", () => ({
  addSubscriber: (...args: unknown[]) => mockAddSubscriber(...args),
  tagSubscriber: (...args: unknown[]) => mockTagSubscriber(...args),
}));

const mockSendReceipt = vi.fn().mockResolvedValue(undefined);
vi.mock("../lib/email", () => ({
  sendPurchaseReceipt: (...args: unknown[]) => mockSendReceipt(...args),
}));

vi.mock("@tensorcraft/shared", async (importOriginal) => ({
  // Spread the real module so genuinely shared logic (isVatGatedCountry and
  // its country table) is exercised rather than re-implemented in a stub.
  // Only the pricing/slug surfaces below are pinned for test determinism.
  ...(await importOriginal<typeof import("@tensorcraft/shared")>()),
  PRICING: {
    free: { price: 0, worlds: 0, label: "Free Preview" },
    single: { price: 49, worlds: 1, label: "Single World" },
    twoBundle: { price: 79, worlds: 2, label: "Two Worlds" },
    threeBundle: { price: 99, worlds: 3, label: "Three Worlds" },
    allFive: { price: 129, worlds: 5, label: "All 5 Worlds" },
  },
  isValidWorldSlug: (slug: string) =>
    [
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ].includes(slug),
  isLaunched: (slug: string) =>
    [
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ].includes(slug),
}));

const app = new Hono();
app.route("/api/payments", payments);

describe("POST /api/payments/webhook", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockConstructEvent.mockReset();
    mockServerInsert.mockReset();
    mockExistingPurchases = null;
    mockAdminExistingRow = null;
    mockEqResult = null;
  });

  it("returns 400 without stripe-signature header", async () => {
    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      body: "{}",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig_test" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("handles checkout.session.completed event", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          client_reference_id: "user_456",
          amount_total: 4900,
          // The money has actually moved. An unpaid session must NOT be
          // written as completed (see the delayed-payment test below).
          payment_status: "paid",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };

    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    // payments.ts uses upsert(data, options), match both arguments
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_456",
        plan_id: "single",
        world_ids: ["deep-orbit"],
        amount: 49,
        stripe_session_id: "cs_test_123",
        status: "completed",
      }),
      expect.objectContaining({ onConflict: "stripe_session_id" }),
    );
  });

  it("captures tax jurisdiction + amount on the purchase (re-audit N0)", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_tax_1",
          client_reference_id: "user_tax",
          amount_total: 5880,
          payment_status: "paid",
          metadata: { planId: "single", worldIds: "deep-orbit" },
          // What Stripe attaches once Stripe Tax + address collection are on.
          total_details: { amount_tax: 980 },
          customer_details: {
            address: { country: "DE" },
            tax_ids: [{ type: "eu_vat", value: "DE123456789" }],
          },
        },
      },
    };

    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: "cs_tax_1",
        tax_amount: 9.8,
        tax_country: "DE",
        customer_tax_id: "DE123456789",
      }),
      expect.objectContaining({ onConflict: "stripe_session_id" }),
    );
  });

  it("leaves tax fields null when Stripe collected none (tax not yet enabled)", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_notax",
          client_reference_id: "user_notax",
          amount_total: 4900,
          payment_status: "paid",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };

    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: "cs_notax",
        tax_amount: null,
        tax_country: null,
        customer_tax_id: null,
      }),
      expect.objectContaining({ onConflict: "stripe_session_id" }),
    );
  });

  it("persists stripe_customer_id when the session carries a customer (migration 043)", async () => {
    mockInsert.mockResolvedValue({ error: null });
    mockProfileUpdate.mockClear();

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_cust_1",
          client_reference_id: "user_456",
          amount_total: 4900,
          payment_status: "paid",
          customer: "cus_ABC123",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_customer_id: "cus_ABC123" }),
    );
  });

  it("does not touch the profile when the session has no customer", async () => {
    mockInsert.mockResolvedValue({ error: null });
    mockProfileUpdate.mockClear();

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_nocust_1",
          client_reference_id: "user_456",
          amount_total: 4900,
          payment_status: "paid",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("records a delayed-payment (unpaid) session as pending, never completed", async () => {
    // Stripe fires checkout.session.completed with payment_status "unpaid"
    // for delayed-notification methods: the checkout finished, the money
    // has not moved. Writing "completed" here granted lifetime access on an
    // unpaid session (audit run #7).
    mockInsert.mockResolvedValue({ error: null });

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_delayed",
          client_reference_id: "user_456",
          amount_total: 4900,
          payment_status: "unpaid",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
      expect.anything(),
    );
  });

  it("settles the purchase as failed on async_payment_failed", async () => {
    // This handler used to only log, leaving whatever status the sync
    // handler wrote (audit run #7).
    mockAdminExistingRow = { status: "pending" };

    const event = {
      type: "checkout.session.async_payment_failed",
      data: {
        object: {
          id: "cs_test_delayed",
          client_reference_id: "user_456",
          metadata: { planId: "single" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "failed" });
  });

  it("requests a retry (non-2xx) when a refund matches no purchase row", async () => {
    // Returning 200 here made the refund permanently unrecorded when the
    // refund event outran the purchase row (audit run #7). Non-2xx makes
    // Stripe retry until the row exists.
    mockEqResult = { data: [], error: null };

    const event = {
      type: "charge.refunded",
      data: {
        object: {
          payment_intent: "pi_orphan",
          amount: 4900,
          amount_refunded: 4900,
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(500);
  });

  it("handles charge.refunded event", async () => {
    mockEq.mockResolvedValue({ error: null });

    // amount_refunded >= amount → full refund → status "refunded"
    const event = {
      type: "charge.refunded",
      data: {
        object: {
          payment_intent: "pi_789",
          amount: 4900,
          amount_refunded: 4900,
        },
      },
    };

    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "refunded" });
    expect(mockEq).toHaveBeenCalledWith("stripe_payment_intent", "pi_789");
  });

  it("rejects webhook with empty world_ids metadata (§6h)", async () => {
    // An empty worldIds array must be rejected, every paid purchase
    // grants at least one world. Guards against a future bug in the
    // checkout handler emitting a malformed metadata blob.
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_empty",
          client_reference_id: "user_empty",
          amount_total: 4900,
          metadata: { planId: "single", worldIds: "" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects webhook with unknown world slug in metadata (§6h)", async () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_bad",
          client_reference_id: "user_bad",
          amount_total: 4900,
          metadata: { planId: "single", worldIds: "not-a-real-world" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("skips upsert when row is already in a terminal status (§338)", async () => {
    // Simulate a Stripe retry arriving AFTER a refund landed. The
    // webhook must NOT regress status=refunded back to completed.
    mockAdminExistingRow = { status: "refunded" };
    mockInsert.mockResolvedValue({ error: null });

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_retry",
          client_reference_id: "user_retry",
          amount_total: 4900,
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    // Critical: upsert MUST NOT have run, otherwise a concurrent
    // retry-after-refund would flip status back to "completed".
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("upserts with ON CONFLICT DO UPDATE (not DO NOTHING) on retry (§338)", async () => {
    // Non-terminal prior status, the upsert must still run and use
    // ignoreDuplicates: false so the ON CONFLICT branch DOes UPDATE.
    mockAdminExistingRow = { status: "completed" };
    mockInsert.mockResolvedValue({ error: null });

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_update",
          client_reference_id: "user_update",
          amount_total: 4900,
          payment_status: "paid",
          payment_intent: "pi_late_arriving",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: "cs_test_update",
        stripe_payment_intent: "pi_late_arriving",
      }),
      expect.objectContaining({
        onConflict: "stripe_session_id",
        ignoreDuplicates: false,
      }),
    );
  });

  it("does not re-fire revenue event or email on a duplicate completed delivery (R3-4c)", async () => {
    // Row already completed; Stripe re-delivers checkout.session.completed.
    mockAdminExistingRow = { status: "completed" };
    mockInsert.mockResolvedValue({ error: null });
    mockCaptureServer.mockReset();
    mockAddSubscriber.mockReset();

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_dup",
          client_reference_id: "user_456",
          amount_total: 4900,
          payment_status: "paid",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    // The sync path must mirror the async guard: no duplicate revenue
    // source-of-truth event, no duplicate confirmation email.
    expect(mockCaptureServer).not.toHaveBeenCalled();
    expect(mockAddSubscriber).not.toHaveBeenCalled();
  });

  it("writes pending rows with ON CONFLICT DO NOTHING so a retried unpaid event cannot demote a promotion (R3-4b)", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_delayed_race",
          client_reference_id: "user_456",
          amount_total: 4900,
          payment_status: "unpaid",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
      expect.objectContaining({ ignoreDuplicates: true }),
    );
  });

  it("keeps ON CONFLICT DO UPDATE for completed writes so promotion still works (R3-4b)", async () => {
    mockAdminExistingRow = { status: "pending" };
    mockInsert.mockResolvedValue({ error: null });

    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_promote",
          client_reference_id: "user_456",
          amount_total: 4900,
          payment_status: "paid",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" }),
      expect.objectContaining({ ignoreDuplicates: false }),
    );
  });

  it("requests a retry (non-2xx) when a dispute matches no purchase row (R3-4a)", async () => {
    // Same contract as the refund zero-row fix: ACKing a dispute that
    // matched nothing permanently loses the access revocation.
    mockEqResult = { data: [], error: null };

    const event = {
      type: "charge.dispute.created",
      data: {
        object: { id: "dp_1", payment_intent: "pi_orphan_dispute" },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(500);
  });

  it("revokes access when a dispute matches a purchase row (R3-4a)", async () => {
    mockEqResult = { data: [{ id: "p_disputed" }], error: null };

    const event = {
      type: "charge.dispute.created",
      data: {
        object: { id: "dp_2", payment_intent: "pi_disputed_ok" },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "disputed" });
    expect(mockEq).toHaveBeenCalledWith(
      "stripe_payment_intent",
      "pi_disputed_ok",
    );
  });

  it("restores access via the 051 RPC when a dispute is WON (F2)", async () => {
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ data: 1, error: null });

    const event = {
      type: "charge.dispute.closed",
      data: {
        object: { id: "dp_won", status: "won", payment_intent: "pi_won_1" },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    // A plain UPDATE would be clamped back to "disputed" by the 038
    // trigger; the RPC is the only sanctioned restoration path.
    expect(mockRpc).toHaveBeenCalledWith("restore_purchase_after_dispute", {
      p_payment_intent: "pi_won_1",
    });
  });

  it("requests a retry when a WON dispute restores zero rows (F2)", async () => {
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ data: 0, error: null });

    const event = {
      type: "charge.dispute.closed",
      data: {
        object: { id: "dp_won2", status: "won", payment_intent: "pi_won_2" },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(500);
  });

  it("leaves a LOST dispute terminally disputed (F2)", async () => {
    mockRpc.mockReset();

    const event = {
      type: "charge.dispute.closed",
      data: {
        object: { id: "dp_lost", status: "lost", payment_intent: "pi_lost" },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("acknowledges unhandled event types", async () => {
    const event = {
      type: "invoice.paid",
      data: { object: {} },
    };

    mockConstructEvent.mockReturnValue(event);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });
});

describe("Upgrade path", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    mockSessionCreate.mockReset();
    mockSessionCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/c/pay/cs_test_upgrade",
    });
    mockServerInsert.mockReset();
    mockExistingPurchases = null;
    mockProfileEmail = "buyer@example.com";
    mockProfileCustomerId = null;
  });

  async function checkout(body: { planId: string; worldIds: string[] }) {
    return app.request("/api/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify(body),
    });
  }

  it("allows upgrade when user owns some worlds", async () => {
    // User paid $49 for deep-orbit. Requests twoBundle (deep-orbit + neon-protocol, $79).
    // Not allOwned (neon-protocol not yet owned). credit=$49, adjustedPrice=$30.
    // Should create a Stripe session with the reduced price.
    mockExistingPurchases = [{ world_ids: ["deep-orbit"], amount: 49 }];

    const res = await checkout({
      planId: "twoBundle",
      worldIds: ["deep-orbit", "neon-protocol"],
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBeDefined();
    expect(body.granted).toBeUndefined();
    // Stripe session should be created with adjusted unit_amount (30 * 100 = 3000 cents)
    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 3000,
            }),
          }),
        ]),
      }),
    );
  });

  /**
   * Abandoned-cart recovery. Stripe can only mail a buyer who abandons
   * checkout if the session carries their email AND recovery is enabled;
   * without both, the session simply expires silently. This was the second
   * of two dark recovery channels (the other being the missing paywall_hit
   * Kit tag).
   */
  it("sets customer_email and enables abandoned-cart recovery", async () => {
    mockProfileEmail = "buyer@example.com";

    const res = await checkout({
      planId: "single",
      worldIds: ["deep-orbit"],
    });

    expect(res.status).toBe(200);
    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: "buyer@example.com",
        after_expiration: expect.objectContaining({
          recovery: expect.objectContaining({ enabled: true }),
        }),
      }),
    );
  });

  it("reuses the stored Stripe customer instead of customer_email (R3-4f)", async () => {
    mockProfileCustomerId = "cus_stored_123";

    const res = await checkout({ planId: "single", worldIds: ["deep-orbit"] });

    expect(res.status).toBe(200);
    const arg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      customer?: string;
      customer_email?: string;
    };
    // `customer` and `customer_email` are mutually exclusive on the Stripe
    // API; the stored Customer must win so repeat buyers don't mint
    // duplicates once invoice_creation is enabled.
    expect(arg.customer).toBe("cus_stored_123");
    expect(arg.customer_email).toBeUndefined();
  });

  it("falls back to customer_email when the stored customer is rejected (R3-4f)", async () => {
    mockProfileCustomerId = "cus_stale_deleted";
    mockSessionCreate
      .mockRejectedValueOnce(new Error("No such customer: cus_stale_deleted"))
      .mockResolvedValueOnce({ url: "https://stripe.test/retry" });

    const res = await checkout({ planId: "single", worldIds: ["deep-orbit"] });

    // A stale saved id must never block a sale.
    expect(res.status).toBe(200);
    expect(mockSessionCreate).toHaveBeenCalledTimes(2);
    const retryArg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      customer?: string;
      customer_email?: string;
    };
    expect(retryArg.customer).toBeUndefined();
    expect(retryArg.customer_email).toBe("buyer@example.com");
    const body = await res.json();
    expect(body.url).toBe("https://stripe.test/retry");
  });

  it("still creates a session when the profile has no email", async () => {
    // Defensive: a missing profile row must not block checkout. We lose the
    // recovery mail for that buyer, not the sale.
    mockProfileEmail = null;

    const res = await checkout({
      planId: "single",
      worldIds: ["deep-orbit"],
    });

    expect(res.status).toBe(200);
    const arg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      customer_email?: string;
    };
    expect(arg.customer_email).toBeUndefined();
  });

  it("auto-grants when credit covers full price", async () => {
    // Reachable auto-grant scenario without allOwned:
    // Mock a purchase whose credit (for overlapping worlds) is >= plan.price,
    // with at least one requested world NOT in ownedWorlds.
    // Purchase: deep-orbit at $200 (hypothetical inflated amount via mock).
    // Request twoBundle (deep-orbit + neon-protocol) at $79. Not allOwned.
    // credit=$200 → capped at plan.price ($79) → adjustedPrice=0 → auto-grant.
    mockExistingPurchases = [{ world_ids: ["deep-orbit"], amount: 200 }];
    mockServerInsert.mockResolvedValue({ error: null });

    const res = await checkout({
      planId: "twoBundle",
      worldIds: ["deep-orbit", "neon-protocol"],
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.granted).toBe(true);
    expect(body.worlds).toEqual(["deep-orbit", "neon-protocol"]);
    expect(mockServerInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 0,
        status: "completed",
      }),
    );
  });

  it("rejects when user owns all requested worlds", async () => {
    // User already owns both worlds in the requested bundle.
    mockExistingPurchases = [
      { world_ids: ["deep-orbit", "neon-protocol"], amount: 79 },
    ];

    const res = await checkout({
      planId: "twoBundle",
      worldIds: ["deep-orbit", "neon-protocol"],
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already own/i);
  });

  it("caps credit at plan price so adjustedPrice is never negative", async () => {
    // Credit ($80) exceeds plan price ($79 for twoBundle) for a partial overlap.
    // credit is capped to $79, adjustedPrice = max(0, 79 - 79) = 0 → auto-grant, not negative.
    mockExistingPurchases = [{ world_ids: ["deep-orbit"], amount: 80 }];
    mockServerInsert.mockResolvedValue({ error: null });

    const res = await checkout({
      planId: "twoBundle",
      worldIds: ["deep-orbit", "neon-protocol"],
    });

    // credit=$80 capped to $79 (plan.price), adjustedPrice=0 → auto-grant
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.granted).toBe(true);
    // Verify the insert recorded amount 0 (not negative)
    expect(mockServerInsert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 0 }),
    );
  });
});

/**
 * Guest checkout. The authed flow made a cold buyer create an account before
 * paying, which with magic-link auth meant leaving the browser for an inbox
 * mid-purchase. These cover the two halves: a session created without a user,
 * and the webhook resolving identity from the email Stripe collected.
 */
describe("POST /api/payments/guest-checkout", () => {
  beforeEach(() => {
    mockSessionCreate.mockClear();
    mockSessionCreate.mockResolvedValue({ url: "https://stripe.test/guest" });
  });

  async function guestCheckout(body: unknown) {
    return app.request("/api/payments/guest-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("creates a session with no auth header at all", async () => {
    const res = await guestCheckout({
      planId: "single",
      worldIds: ["deep-orbit"],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBeDefined();
  });

  it("omits client_reference_id and marks the session as guest", async () => {
    await guestCheckout({ planId: "single", worldIds: ["deep-orbit"] });

    const arg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      client_reference_id?: string;
      metadata: Record<string, string>;
    };
    // There is no user yet, so there is nothing to reference. The webhook
    // keys off metadata.guest to know it must resolve identity by email.
    expect(arg.client_reference_id).toBeUndefined();
    expect(arg.metadata.guest).toBe("true");
    expect(arg.metadata.worldIds).toBe("deep-orbit");
  });

  it("charges full price with no upgrade credit applied", async () => {
    // A guest has no prior purchases by definition, so the credit machinery
    // is deliberately absent from this route rather than returning 0.
    // 4900 = the `single` price in this file's PRICING mock, which pins the
    // pre-2026-06-20 ladder rather than the live one.
    await guestCheckout({ planId: "single", worldIds: ["deep-orbit"] });
    const arg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      line_items: { price_data: { unit_amount: number } }[];
    };
    expect(arg.line_items[0].price_data.unit_amount).toBe(4900);
  });

  it("enables abandoned-cart recovery like the authed route", async () => {
    await guestCheckout({ planId: "single", worldIds: ["deep-orbit"] });
    const arg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      after_expiration?: { recovery?: { enabled?: boolean } };
    };
    expect(arg.after_expiration?.recovery?.enabled).toBe(true);
  });

  it("rejects a world count that does not match the plan", async () => {
    const res = await guestCheckout({
      planId: "single",
      worldIds: ["deep-orbit", "neon-protocol"],
    });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown world slug", async () => {
    const res = await guestCheckout({
      planId: "single",
      worldIds: ["not-a-real-world"],
    });
    expect(res.status).toBe(400);
  });

  it("rejects the free plan", async () => {
    const res = await guestCheckout({ planId: "free", worldIds: [] });
    expect(res.status).toBe(400);
  });
});

describe("webhook: guest session identity resolution", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    mockConstructEvent.mockReset();
    mockAdminExistingRow = null;
    mockResolveUser.mockClear();
    mockResolveUser.mockResolvedValue("user_guest_provisioned");
    mockSendAccessLink.mockClear();
  });

  function guestEvent(overrides: Record<string, unknown> = {}) {
    return {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_guest_1",
          // The defining trait of a guest session: nobody to reference yet.
          client_reference_id: null,
          amount_total: 4900,
          payment_status: "paid",
          customer_details: { email: "guest@example.com" },
          metadata: {
            planId: "single",
            worldIds: "deep-orbit",
            guest: "true",
          },
          ...overrides,
        },
      },
    };
  }

  async function post(event: unknown) {
    mockConstructEvent.mockReturnValue(event);
    return app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
  }

  it("provisions the buyer from the Stripe email and records the purchase", async () => {
    const res = await post(guestEvent());

    expect(res.status).toBe(200);
    expect(mockResolveUser).toHaveBeenCalledWith(
      expect.anything(),
      "guest@example.com",
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_guest_provisioned",
        world_ids: ["deep-orbit"],
        stripe_session_id: "cs_guest_1",
      }),
      expect.anything(),
    );
  });

  it("emails an access link so the buyer can reach what they paid for", async () => {
    await post(guestEvent());
    expect(mockSendAccessLink).toHaveBeenCalled();
  });

  /**
   * The money has already moved by this point. Returning 500 makes Stripe
   * retry; silently 200-ing would mean a paid purchase that grants nothing
   * and never gets another chance.
   */
  it("fails loudly when the account cannot be resolved", async () => {
    mockResolveUser.mockResolvedValue(null);
    const res = await post(guestEvent());
    expect(res.status).toBe(500);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("fails loudly when Stripe sent no email to resolve", async () => {
    const res = await post(guestEvent({ customer_details: {} }));
    expect(res.status).toBe(500);
    expect(mockResolveUser).not.toHaveBeenCalled();
  });

  it("does not touch guest resolution for an ordinary authed session", async () => {
    await post(
      guestEvent({
        client_reference_id: "user_456",
        metadata: { planId: "single", worldIds: "deep-orbit" },
      }),
    );
    expect(mockResolveUser).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user_456" }),
      expect.anything(),
    );
  });
});

/**
 * Billing country capture.
 *
 * `billing_address_collection` used to live inside `taxSessionParams()`, which
 * returns `{}` while `STRIPE_TAX_ENABLED` is unset. With tax off (the shipped
 * default) Stripe therefore collected no billing country at all, so the EU/UK
 * geo-gate had nothing to verify against after the fact and the VAT exposure
 * could not even be measured. Collection is now unconditional.
 */
describe("checkout collects the billing country with Stripe Tax off", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    vi.stubEnv("STRIPE_TAX_ENABLED", "");
    mockSessionCreate.mockReset();
    mockSessionCreate.mockResolvedValue({ url: "https://stripe.test/billing" });
    mockExistingPurchases = null;
    mockProfileEmail = "buyer@example.com";
    mockProfileCustomerId = null;
  });

  it("requires the billing address on authed checkout", async () => {
    const res = await app.request("/api/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ planId: "single", worldIds: ["deep-orbit"] }),
    });

    expect(res.status).toBe(200);
    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ billing_address_collection: "required" }),
    );
  });

  it("requires the billing address on guest checkout", async () => {
    const res = await app.request("/api/payments/guest-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "single", worldIds: ["deep-orbit"] }),
    });

    expect(res.status).toBe(200);
    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ billing_address_collection: "required" }),
    );
  });
});

/**
 * EU/UK checkout geo-gate (owner decision 2026-08-23).
 *
 * Selling to an EU or UK consumer as a seller established outside both
 * creates a VAT obligation from the first sale, with no threshold. Until the
 * US LLC exists, checkout is refused for those regions. Free signups are
 * deliberately unaffected: VAT triggers on a supply for consideration, so
 * reading the free module from Berlin costs nothing.
 *
 * The country comes from Cloudflare's `CF-IPCountry`, which sits in front of
 * the API, and is therefore server-observed rather than client-supplied.
 */
describe("EU/UK checkout geo-gate", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    mockSessionCreate.mockReset();
    mockSessionCreate.mockResolvedValue({ url: "https://stripe.test/geo" });
    mockExistingPurchases = null;
    mockProfileEmail = "buyer@example.com";
    mockProfileCustomerId = null;
  });

  function checkout(country?: string) {
    return app.request("/api/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
        ...(country ? { "CF-IPCountry": country } : {}),
      },
      body: JSON.stringify({ planId: "single", worldIds: ["deep-orbit"] }),
    });
  }

  function guestCheckout(country?: string) {
    return app.request("/api/payments/guest-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(country ? { "CF-IPCountry": country } : {}),
      },
      body: JSON.stringify({ planId: "single", worldIds: ["deep-orbit"] }),
    });
  }

  it("refuses authed checkout from an EU country", async () => {
    const res = await checkout("DE");

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("region_unavailable");
    // No Stripe session may exist for a blocked region: a created session is
    // a payable link, so creating one and then refusing is not a gate.
    expect(mockSessionCreate).not.toHaveBeenCalled();
  });

  it("refuses guest checkout from the United Kingdom", async () => {
    const res = await guestCheckout("GB");

    expect(res.status).toBe(403);
    expect(mockSessionCreate).not.toHaveBeenCalled();
  });

  it("allows checkout from the United States", async () => {
    const res = await checkout("US");

    expect(res.status).toBe(200);
    expect(mockSessionCreate).toHaveBeenCalled();
  });

  it("allows checkout when the country header is absent, failing open", async () => {
    const res = await checkout();

    expect(res.status).toBe(200);
    expect(mockSessionCreate).toHaveBeenCalled();
  });
});

/**
 * Purchase receipt. Buyers received nothing at all after paying: the only
 * purchase-time email action was a Kit tag, and Kit's credentials 401. The
 * receipt rides the same settle guard as the revenue event, so it inherits
 * the two-layer dedupe rather than inventing a third.
 */
describe("purchase receipt on settle", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    mockConstructEvent.mockReset();
    mockSendReceipt.mockClear();
    mockSendReceipt.mockResolvedValue(undefined);
    mockAdminExistingRow = null;
    mockEqResult = null;
    mockProfileEmail = "buyer@example.com";
  });

  function settleEvent(id = "cs_receipt_1") {
    return {
      id: "evt_receipt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id,
          client_reference_id: "user_456",
          amount_total: 4900,
          payment_status: "paid",
          metadata: { planId: "single", worldIds: "deep-orbit" },
        },
      },
    };
  }

  async function deliver(event: unknown) {
    mockConstructEvent.mockReturnValue(event);
    return app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
  }

  it("emails the buyer a receipt when the payment settles", async () => {
    const res = await deliver(settleEvent());

    expect(res.status).toBe(200);
    expect(mockSendReceipt).toHaveBeenCalledTimes(1);
    expect(mockSendReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "buyer@example.com",
        worldIds: ["deep-orbit"],
        amount: 49,
        sessionId: "cs_receipt_1",
      }),
    );
  });

  it("does not re-send on a webhook re-delivery", async () => {
    // The row is already completed, which is what a sequential re-delivery
    // looks like. Charging once and mailing twice is its own support ticket.
    mockAdminExistingRow = { status: "completed" };

    const res = await deliver(settleEvent());

    expect(res.status).toBe(200);
    expect(mockSendReceipt).not.toHaveBeenCalled();
  });

  it("still records the purchase when the receipt cannot be sent", async () => {
    // A dead mailer must never turn a successful payment into a 500 and a
    // Stripe retry.
    mockSendReceipt.mockRejectedValue(new Error("resend down"));

    const res = await deliver(settleEvent("cs_receipt_2"));

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalled();
  });
});

/**
 * Delayed payment methods (SEPA, bank debit) settle ONLY in
 * async_payment_succeeded, never in the sync branch. Before 2026-08-23 this
 * handler had no test coverage at all, so a receipt wired into the sync path
 * alone would have silently excluded every delayed-method buyer.
 */
describe("purchase receipt on delayed settle", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    mockConstructEvent.mockReset();
    mockSendReceipt.mockClear();
    mockSendReceipt.mockResolvedValue(undefined);
    mockAdminExistingRow = null;
    mockEqResult = null;
    mockProfileEmail = "sepa-buyer@example.com";
  });

  const asyncEvent = {
    id: "evt_async_1",
    type: "checkout.session.async_payment_succeeded",
    data: {
      object: {
        id: "cs_async_1",
        client_reference_id: "user_789",
        amount_total: 4900,
        payment_intent: "pi_async_1",
        metadata: { planId: "single", worldIds: "deep-orbit" },
      },
    },
  };

  it("emails a receipt when a delayed payment finally settles", async () => {
    mockConstructEvent.mockReturnValue(asyncEvent);

    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(asyncEvent),
    });

    expect(res.status).toBe(200);
    expect(mockSendReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "sepa-buyer@example.com",
        worldIds: ["deep-orbit"],
        amount: 49,
        sessionId: "cs_async_1",
      }),
    );
  });
});
