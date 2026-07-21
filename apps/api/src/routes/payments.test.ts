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
let mockExistingPurchases: { theme_ids: string[]; amount: number }[] | null =
  null;
// Controls insert result for the auto-grant path
const mockServerInsert = vi.fn();
let mockProfileEmail: string | null = "buyer@example.com";

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

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
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
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
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
        // Checkout reads the buyer's email so Stripe can address its
        // abandoned-cart recovery mail. .select("email").eq("id", …).single()
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: mockProfileEmail ? { email: mockProfileEmail } : null,
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

vi.mock("@tensorcraft/shared", () => ({
  PRICING: {
    free: { price: 0, themes: 0, label: "Free Preview" },
    single: { price: 49, themes: 1, label: "Single Theme" },
    twoBundle: { price: 79, themes: 2, label: "Two Themes" },
    threeBundle: { price: 99, themes: 3, label: "Three Themes" },
    allFive: { price: 129, themes: 5, label: "All 5 Themes" },
  },
  isValidThemeSlug: (slug: string) =>
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
          metadata: { planId: "single", themeIds: "deep-orbit" },
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
        theme_ids: ["deep-orbit"],
        amount: 49,
        stripe_session_id: "cs_test_123",
        status: "completed",
      }),
      expect.objectContaining({ onConflict: "stripe_session_id" }),
    );
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
          metadata: { planId: "single", themeIds: "deep-orbit" },
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

  it("rejects webhook with empty theme_ids metadata (§6h)", async () => {
    // An empty themeIds array must be rejected, every paid purchase
    // grants at least one theme. Guards against a future bug in the
    // checkout handler emitting a malformed metadata blob.
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_empty",
          client_reference_id: "user_empty",
          amount_total: 4900,
          metadata: { planId: "single", themeIds: "" },
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

  it("rejects webhook with unknown theme slug in metadata (§6h)", async () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_bad",
          client_reference_id: "user_bad",
          amount_total: 4900,
          metadata: { planId: "single", themeIds: "not-a-real-theme" },
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
          metadata: { planId: "single", themeIds: "deep-orbit" },
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
          metadata: { planId: "single", themeIds: "deep-orbit" },
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
  });

  async function checkout(body: { planId: string; themeIds: string[] }) {
    return app.request("/api/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify(body),
    });
  }

  it("allows upgrade when user owns some themes", async () => {
    // User paid $49 for deep-orbit. Requests twoBundle (deep-orbit + neon-protocol, $79).
    // Not allOwned (neon-protocol not yet owned). credit=$49, adjustedPrice=$30.
    // Should create a Stripe session with the reduced price.
    mockExistingPurchases = [{ theme_ids: ["deep-orbit"], amount: 49 }];

    const res = await checkout({
      planId: "twoBundle",
      themeIds: ["deep-orbit", "neon-protocol"],
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
      themeIds: ["deep-orbit"],
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

  it("still creates a session when the profile has no email", async () => {
    // Defensive: a missing profile row must not block checkout. We lose the
    // recovery mail for that buyer, not the sale.
    mockProfileEmail = null;

    const res = await checkout({
      planId: "single",
      themeIds: ["deep-orbit"],
    });

    expect(res.status).toBe(200);
    const arg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      customer_email?: string;
    };
    expect(arg.customer_email).toBeUndefined();
  });

  it("auto-grants when credit covers full price", async () => {
    // Reachable auto-grant scenario without allOwned:
    // Mock a purchase whose credit (for overlapping themes) is >= plan.price,
    // with at least one requested theme NOT in ownedThemes.
    // Purchase: deep-orbit at $200 (hypothetical inflated amount via mock).
    // Request twoBundle (deep-orbit + neon-protocol) at $79. Not allOwned.
    // credit=$200 → capped at plan.price ($79) → adjustedPrice=0 → auto-grant.
    mockExistingPurchases = [{ theme_ids: ["deep-orbit"], amount: 200 }];
    mockServerInsert.mockResolvedValue({ error: null });

    const res = await checkout({
      planId: "twoBundle",
      themeIds: ["deep-orbit", "neon-protocol"],
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.granted).toBe(true);
    expect(body.themes).toEqual(["deep-orbit", "neon-protocol"]);
    expect(mockServerInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 0,
        status: "completed",
      }),
    );
  });

  it("rejects when user owns all requested themes", async () => {
    // User already owns both themes in the requested bundle.
    mockExistingPurchases = [
      { theme_ids: ["deep-orbit", "neon-protocol"], amount: 79 },
    ];

    const res = await checkout({
      planId: "twoBundle",
      themeIds: ["deep-orbit", "neon-protocol"],
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already own/i);
  });

  it("caps credit at plan price so adjustedPrice is never negative", async () => {
    // Credit ($80) exceeds plan price ($79 for twoBundle) for a partial overlap.
    // credit is capped to $79, adjustedPrice = max(0, 79 - 79) = 0 → auto-grant, not negative.
    mockExistingPurchases = [{ theme_ids: ["deep-orbit"], amount: 80 }];
    mockServerInsert.mockResolvedValue({ error: null });

    const res = await checkout({
      planId: "twoBundle",
      themeIds: ["deep-orbit", "neon-protocol"],
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
      themeIds: ["deep-orbit"],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBeDefined();
  });

  it("omits client_reference_id and marks the session as guest", async () => {
    await guestCheckout({ planId: "single", themeIds: ["deep-orbit"] });

    const arg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      client_reference_id?: string;
      metadata: Record<string, string>;
    };
    // There is no user yet, so there is nothing to reference. The webhook
    // keys off metadata.guest to know it must resolve identity by email.
    expect(arg.client_reference_id).toBeUndefined();
    expect(arg.metadata.guest).toBe("true");
    expect(arg.metadata.themeIds).toBe("deep-orbit");
  });

  it("charges full price with no upgrade credit applied", async () => {
    // A guest has no prior purchases by definition, so the credit machinery
    // is deliberately absent from this route rather than returning 0.
    // 4900 = the `single` price in this file's PRICING mock, which pins the
    // pre-2026-06-20 ladder rather than the live one.
    await guestCheckout({ planId: "single", themeIds: ["deep-orbit"] });
    const arg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      line_items: { price_data: { unit_amount: number } }[];
    };
    expect(arg.line_items[0].price_data.unit_amount).toBe(4900);
  });

  it("enables abandoned-cart recovery like the authed route", async () => {
    await guestCheckout({ planId: "single", themeIds: ["deep-orbit"] });
    const arg = mockSessionCreate.mock.calls.at(-1)?.[0] as {
      after_expiration?: { recovery?: { enabled?: boolean } };
    };
    expect(arg.after_expiration?.recovery?.enabled).toBe(true);
  });

  it("rejects a theme count that does not match the plan", async () => {
    const res = await guestCheckout({
      planId: "single",
      themeIds: ["deep-orbit", "neon-protocol"],
    });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown theme slug", async () => {
    const res = await guestCheckout({
      planId: "single",
      themeIds: ["not-a-real-theme"],
    });
    expect(res.status).toBe(400);
  });

  it("rejects the free plan", async () => {
    const res = await guestCheckout({ planId: "free", themeIds: [] });
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
            themeIds: "deep-orbit",
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
        theme_ids: ["deep-orbit"],
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
        metadata: { planId: "single", themeIds: "deep-orbit" },
      }),
    );
    expect(mockResolveUser).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user_456" }),
      expect.anything(),
    );
  });
});
