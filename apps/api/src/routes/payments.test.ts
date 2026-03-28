import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { payments } from "./payments";

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockConstructEvent = vi.fn();

vi.mock("stripe", () => ({
  default: class Stripe {
    webhooks = {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    };
  },
}));

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "purchases") {
        return {
          insert: mockInsert,
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
      return {};
    },
  }),
  getSupabaseServerClient: () => ({}),
}));

vi.mock("@tensorcraft/shared", () => ({
  PRICING: {
    free: { price: 0, themes: 0, label: "Free Preview" },
    single: { price: 79, themes: 1, label: "Single Theme" },
    twoBundle: { price: 129, themes: 2, label: "Two Themes" },
    threeBundle: { price: 169, themes: 3, label: "Three Themes" },
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
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_456",
        plan_id: "single",
        theme_ids: ["deep-orbit"],
        amount: 79,
        stripe_session_id: "cs_test_123",
        status: "completed",
      }),
    );
  });

  it("handles charge.refunded event", async () => {
    mockEq.mockResolvedValue({ error: null });

    const event = {
      type: "charge.refunded",
      data: {
        object: { payment_intent: "pi_789" },
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
