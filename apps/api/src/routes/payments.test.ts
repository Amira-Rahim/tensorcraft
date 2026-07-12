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

// Controls what the server-client purchases query resolves to for upgrade tests
let mockExistingPurchases: { theme_ids: string[]; amount: number }[] | null =
  null;
// Controls insert result for the auto-grant path
const mockServerInsert = vi.fn();

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
          update: (data: unknown) => {
            mockUpdate(data);
            return { eq: mockEq };
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
      return {};
    },
  }),
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
