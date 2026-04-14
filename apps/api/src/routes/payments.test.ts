import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { payments } from "./payments";

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockConstructEvent = vi.fn();
const mockSessionCreate = vi.fn();

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
          // upgrade-credit query: .select().eq("user_id", …).eq("status", "completed")
          select: () => ({
            eq: () => ({
              eq: () =>
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
    single: { price: 79, themes: 1, label: "Single Theme" },
    twoBundle: { price: 129, themes: 2, label: "Two Themes" },
    threeBundle: { price: 169, themes: 3, label: "Three Themes" },
    allFive: { price: 219, themes: 5, label: "All 5 Themes" },
  },
  isValidThemeSlug: (slug: string) =>
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
          amount_total: 7900,
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
    // payments.ts uses upsert(data, options) — match both arguments
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_456",
        plan_id: "single",
        theme_ids: ["deep-orbit"],
        amount: 79,
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
          amount: 7900,
          amount_refunded: 7900,
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
    // User paid $79 for deep-orbit. Requests twoBundle (deep-orbit + neon-protocol, $129).
    // Not allOwned (neon-protocol not yet owned). credit=$79, adjustedPrice=$50.
    // Should create a Stripe session with the reduced price.
    mockExistingPurchases = [{ theme_ids: ["deep-orbit"], amount: 79 }];

    const res = await checkout({
      planId: "twoBundle",
      themeIds: ["deep-orbit", "neon-protocol"],
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBeDefined();
    expect(body.granted).toBeUndefined();
    // Stripe session should be created with adjusted unit_amount (50 * 100 = 5000 cents)
    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 5000,
            }),
          }),
        ]),
      }),
    );
  });

  it("auto-grants when credit covers full price", async () => {
    // Two separate $79 purchases (deep-orbit, neon-protocol) overlap with threeBundle request.
    // threeBundle = (deep-orbit, neon-protocol, signal-ward) at $169.
    // Not allOwned (signal-ward not owned). credit = $79 + $79 = $158.
    // $158 < $169 — no auto-grant; Stripe session for remaining $11.
    //
    // True auto-grant path: simulate via mock returning amount >= plan.price.
    // User paid $169 for (deep-orbit, neon-protocol, signal-ward) as one purchase.
    // They re-request single (deep-orbit) at $79. Not allOwned? No — deep-orbit IS owned → 400.
    //
    // Valid auto-grant: user has two purchases totalling $169+, requesting a plan at $129,
    // with only partial overlap (not allOwned).
    // Purchase 1: signal-ward + nova-canvas ($129). Purchase 2: deep-orbit ($79).
    // Request twoBundle (deep-orbit, signal-ward) at $129.
    // Not allOwned (nova-canvas not requested, so only deep-orbit & signal-ward checked — both owned → allOwned → 400).
    //
    // The auto-grant branch IS reachable: use mockServerInsert to confirm it would be called
    // if the logic reached it. We verify the branch exists by testing with a mock that
    // returns adjustedPrice=0 indirectly — by having credit exactly equal plan.price
    // with one unowned theme in the requested set.
    // Purchase: (nova-canvas, terra-grid) for $129. Request twoBundle (deep-orbit, neon-protocol).
    // No overlap → credit=0, normal Stripe session. Not useful.
    //
    // Definitive reachable scenario without allOwned:
    // The mock returns purchases whose combined credit for overlapping themes >= plan.price,
    // while at least one requested theme is NOT in ownedThemes.
    // Purchase 1: deep-orbit for $200 (hypothetical inflated amount via mock).
    // Request twoBundle (deep-orbit, neon-protocol) $129. Not allOwned. credit=$200 → cap $129 → adjusted=0 → auto-grant.
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
      { theme_ids: ["deep-orbit", "neon-protocol"], amount: 129 },
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
    // Credit ($200) exceeds plan price ($129) for a partial overlap (neon-protocol not owned).
    // credit is capped to $129, adjustedPrice = max(0, 129 - 129) = 0 → auto-grant, not negative.
    // Use a slightly-over-cap amount to confirm the cap fires: $130 credit for deep-orbit only.
    mockExistingPurchases = [{ theme_ids: ["deep-orbit"], amount: 130 }];
    mockServerInsert.mockResolvedValue({ error: null });

    const res = await checkout({
      planId: "twoBundle",
      themeIds: ["deep-orbit", "neon-protocol"],
    });

    // credit=$130 capped to $129 (plan.price), adjustedPrice=0 → auto-grant
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.granted).toBe(true);
    // Verify the insert recorded amount 0 (not negative)
    expect(mockServerInsert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 0 }),
    );
  });
});
