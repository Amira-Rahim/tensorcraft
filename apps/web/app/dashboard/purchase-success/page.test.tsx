import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render, cleanup } from "@testing-library/react";
import type { ReactElement } from "react";

// ──────────────────────────────────────────────
// Mocks, mirror the approach in `app/dashboard/__tests__/page.test.tsx`
// so these tests never touch the real Supabase, Next cookies, or Velite
// runtime.
// ──────────────────────────────────────────────

class RedirectError extends Error {
  constructor(public target: string) {
    super(`NEXT_REDIRECT:${target}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    throw new RedirectError(target);
  },
}));

const getUserMock = vi.fn();

type PurchaseRow = {
  plan_id: string;
  world_ids: string[];
  amount: number;
  created_at: string;
  stripe_session_id: string | null;
  status: string;
  user_id: string;
};

// Backing store for the `purchases` table. Tests push rows here and the
// mocked query-builder filters them the same way Supabase would.
let purchaseRows: PurchaseRow[] = [];

/**
 * Chainable query-builder that applies `.eq(col, val)` filters to the
 * in-memory `purchaseRows` store and respects `.order()` + `.limit()`
 * + `.maybeSingle()`. The page only uses a small subset of the real
 * PostgREST surface, so this stays tiny.
 */
function buildPurchasesQuery(): Record<string, unknown> {
  let rows = [...purchaseRows];
  let ascending = false;
  let orderKey: keyof PurchaseRow | null = null;
  let limit: number | null = null;

  const api: Record<string, unknown> = {};
  api.select = () => api;
  api.eq = (col: keyof PurchaseRow, val: unknown) => {
    rows = rows.filter((r) => r[col] === val);
    return api;
  };
  api.order = (col: keyof PurchaseRow, opts?: { ascending?: boolean }) => {
    orderKey = col;
    ascending = Boolean(opts?.ascending);
    return api;
  };
  api.limit = (n: number) => {
    limit = n;
    return api;
  };
  api.maybeSingle = async () => {
    let out = rows;
    if (orderKey) {
      const key = orderKey;
      out = [...out].sort((a, b) => {
        const av = String(a[key]);
        const bv = String(b[key]);
        return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    if (limit !== null) out = out.slice(0, limit);
    return { data: out[0] ?? null, error: null };
  };
  return api;
}

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === "purchases") return buildPurchasesQuery();
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

// The page calls `getModules(slug)` for per-world module counts. Keep
// this deterministic and independent of Velite output.
vi.mock("@tensorcraft/content", () => ({
  getModules: (slug: string) =>
    Array.from({ length: 3 }, (_, i) => ({
      slug: `${slug}-m${i + 1}`,
      order: i + 1,
      title: `Module ${i + 1}`,
    })),
}));

// Ambient background is a canvas-heavy component; stub it so SSR stays
// in pure-React land.
vi.mock("@/app/components/ambient-background", () => ({
  AmbientBackground: () => null,
}));

// A receipt visit must never count as a new payment conversion.
const trackCheckoutCompletedMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  trackCheckoutCompleted: (...args: unknown[]) =>
    trackCheckoutCompletedMock(...args),
}));

// The poller polls through useRouter, which the next/navigation mock above
// deliberately omits; its own behavior is covered in pending-poller.test.tsx.
vi.mock("./pending-poller", () => ({
  PendingPoller: ({ sessionId }: { sessionId?: string }) => (
    <div data-testid="pending-poller-stub" data-session-id={sessionId} />
  ),
}));

function resetState(): void {
  purchaseRows = [];
  getUserMock.mockReset();
  trackCheckoutCompletedMock.mockClear();
}

function completedPurchase(overrides: Partial<PurchaseRow> = {}): PurchaseRow {
  return {
    user_id: "u-1",
    plan_id: "single",
    world_ids: ["deep-orbit"],
    amount: 79,
    created_at: "2026-04-21T10:30:00.000Z",
    stripe_session_id: "cs_test_abcdefgh12345678",
    status: "completed",
    ...overrides,
  };
}

async function renderPage(
  searchParams?: Record<string, string | string[]>,
): Promise<{ html: string; document: Document }> {
  const { default: PurchaseSuccessPage } = await import("./page");
  const element = (await PurchaseSuccessPage({
    searchParams: searchParams ? Promise.resolve(searchParams) : undefined,
  })) as ReactElement;
  const html = renderToStaticMarkup(element);
  return {
    html,
    document: new DOMParser().parseFromString(html, "text/html"),
  };
}

function expectNoConfirmedPurchase(document: Document, html: string) {
  expect(document.querySelector('[data-testid="purchase-receipt"]')).toBeNull();
  expect(document.querySelector('[data-testid="cta-first-lesson"]')).toBeNull();
  expect(document.querySelector('[data-testid^="access-start-"]')).toBeNull();
  expect(document.querySelector('a[href="/worlds/deep-orbit"]')).toBeNull();
  expect(html).not.toContain("engineering.webp");
}

describe("dashboard/purchase-success/page", () => {
  beforeEach(() => {
    resetState();
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: "x@example.com" } },
      error: null,
    });
  });

  it("redirects unauthenticated users to /auth", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const { default: PurchaseSuccessPage } = await import("./page");
    await expect(PurchaseSuccessPage({})).rejects.toMatchObject({
      target: "/auth",
    });
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it("confirms purchased access with one mission-map action", async () => {
    purchaseRows.push(completedPurchase());
    const { document } = await renderPage();

    expect(
      document.querySelector("main")?.getAttribute("data-purchase-state"),
    ).toBe("confirmed");
    expect(document.querySelector("h1")?.textContent).toBe(
      "Deep Orbit is yours.",
    );
    expect(
      document.querySelector('[data-state="confirmed"]')?.textContent,
    ).toContain("Purchase confirmed");
    expect(
      document.querySelector(".purchase-introduction")?.textContent,
    ).toContain("All 3 modules are open.");
    const primary = document.querySelector('[data-testid="cta-first-lesson"]');
    expect(primary?.getAttribute("href")).toBe("/worlds/deep-orbit");
    expect(primary?.textContent).toContain("Open mission map");
    expect(
      document.querySelectorAll('a[href="/worlds/deep-orbit"]'),
    ).toHaveLength(1);
    expect(
      document.querySelector('[data-testid="pending-poller-stub"]'),
    ).toBeNull();
  });

  it("renders the engineering plate after confirmation", async () => {
    purchaseRows.push(completedPurchase());
    const { html } = await renderPage();
    expect(html).toContain("/locations/deep-orbit/engineering.webp");
  });

  it("does not count a receipt mount or revisit as another payment", async () => {
    purchaseRows.push(completedPurchase());
    const { default: PurchaseSuccessPage } = await import("./page");
    try {
      for (let visit = 0; visit < 2; visit += 1) {
        const element = (await PurchaseSuccessPage({})) as ReactElement;
        const view = render(element);
        expect(view.getByTestId("purchase-receipt")).toBeTruthy();
        view.unmount();
      }
      expect(trackCheckoutCompletedMock).not.toHaveBeenCalled();
    } finally {
      cleanup();
    }
  });

  it("keeps an unknown checkout pending without showing purchased access", async () => {
    const sessionId = "cs_test_NOTLANDEDYET0000";
    const { document, html } = await renderPage({ session_id: sessionId });

    expect(
      document.querySelector("main")?.getAttribute("data-purchase-state"),
    ).toBe("pending");
    expect(document.querySelector("h1")?.textContent).toBe(
      "Confirming your payment.",
    );
    expect(
      document
        .querySelector('[data-testid="pending-poller-stub"]')
        ?.getAttribute("data-session-id"),
    ).toBe(sessionId);
    expectNoConfirmedPurchase(document, html);
  });

  it("does not substitute an older completed receipt for a pending session", async () => {
    purchaseRows.push(
      completedPurchase({
        amount: 49,
        stripe_session_id: "cs_test_OLDPURCHASE0000",
      }),
      completedPurchase({
        amount: 50,
        stripe_session_id: "cs_test_CURRENT_PENDING",
        status: "pending",
      }),
    );
    const { document, html } = await renderPage({
      session_id: "cs_test_CURRENT_PENDING",
    });

    expect(
      document.querySelector("main")?.getAttribute("data-purchase-state"),
    ).toBe("pending");
    expect(
      document.querySelector('[data-testid="pending-poller-stub"]'),
    ).not.toBeNull();
    expectNoConfirmedPurchase(document, html);
    expect(html).not.toContain("$49.00");
    expect(html).not.toContain("OLDPURCHASE0000");
  });

  it("does not confirm another user's matching checkout session", async () => {
    purchaseRows.push(
      completedPurchase({ stripe_session_id: "cs_test_OWNOLDERRECEIPT" }),
      completedPurchase({
        user_id: "u-2",
        stripe_session_id: "cs_test_SOMEONEELSE",
        amount: 225,
      }),
    );
    const { document, html } = await renderPage({
      session_id: "cs_test_SOMEONEELSE",
    });

    expect(
      document.querySelector("main")?.getAttribute("data-purchase-state"),
    ).toBe("pending");
    expect(
      document.querySelector('[data-testid="pending-poller-stub"]'),
    ).not.toBeNull();
    expectNoConfirmedPurchase(document, html);
    expect(html).not.toContain("$225.00");
    expect(html).not.toContain("$79.00");
  });

  it("shows a failed-payment recovery path without polling or granting access", async () => {
    purchaseRows.push(
      completedPurchase({ stripe_session_id: "cs_test_OLDER_COMPLETED" }),
      completedPurchase({
        stripe_session_id: "cs_test_FAILED_PAYMENT",
        status: "failed",
      }),
    );
    const { document, html } = await renderPage({
      session_id: "cs_test_FAILED_PAYMENT",
    });

    expect(
      document.querySelector("main")?.getAttribute("data-purchase-state"),
    ).toBe("failed");
    expect(document.querySelector("h1")?.textContent).toBe(
      "Payment wasn’t completed.",
    );
    expect(
      document
        .querySelector('[data-testid="payment-failed-retry"]')
        ?.getAttribute("href"),
    ).toBe("/pricing");
    expect(
      document.querySelector('[data-testid="pending-poller-stub"]'),
    ).toBeNull();
    expectNoConfirmedPurchase(document, html);
    expect(html).not.toContain("nothing was billed");
  });

  it("selects the supplied checkout rather than a newer completed purchase", async () => {
    purchaseRows.push(
      completedPurchase({
        amount: 49,
        created_at: "2026-05-01T00:00:00.000Z",
        stripe_session_id: "cs_test_NEWER_PURCHASE",
      }),
      completedPurchase({
        plan_id: "twoBundle",
        world_ids: ["deep-orbit", "signal-ward"],
        amount: 79,
        stripe_session_id: "cs_test_TARGETXYZ9999999",
      }),
    );
    const { document, html } = await renderPage({
      session_id: "cs_test_TARGETXYZ9999999",
    });

    expect(
      document.querySelector('[data-testid="receipt-amount"]')?.textContent,
    ).toContain("$79.00");
    expect(
      document.querySelector('dd[data-plan="twoBundle"]')?.textContent,
    ).toBe("Two Worlds");
    expect(
      document
        .querySelector('[data-testid="receipt-worlds"]')
        ?.getAttribute("data-world-ids"),
    ).toBe("deep-orbit, signal-ward");
    expect(
      document.querySelector('[data-testid="receipt-session"]')?.textContent,
    ).toBe("TC-Z9999999");
    expect(html).not.toContain("cs_test_TARGETXYZ9999999");
    expect(html).not.toContain("$49.00");
  });

  it("accepts a repeated session query by selecting its first value", async () => {
    purchaseRows.push(completedPurchase());
    const { document } = await renderPage({
      session_id: ["cs_test_abcdefgh12345678", "cs_test_OTHER"],
    });
    expect(
      document.querySelector("main")?.getAttribute("data-purchase-state"),
    ).toBe("confirmed");
    expect(
      document.querySelector('[data-testid="receipt-session"]')?.textContent,
    ).toBe("TC-12345678");
  });

  it("without a session, selects the user's newest completed purchase only", async () => {
    purchaseRows.push(
      completedPurchase({
        amount: 49,
        created_at: "2026-01-01T00:00:00.000Z",
      }),
      completedPurchase({
        amount: 79,
        stripe_session_id: "cs_test_NEW9876543210ZZ",
      }),
      completedPurchase({
        amount: 90,
        status: "pending",
        created_at: "2026-05-01T00:00:00.000Z",
      }),
      completedPurchase({
        amount: 135,
        status: "failed",
        created_at: "2026-06-01T00:00:00.000Z",
      }),
      completedPurchase({
        user_id: "u-2",
        amount: 225,
        created_at: "2026-07-01T00:00:00.000Z",
      }),
    );
    const { document, html } = await renderPage();

    expect(
      document.querySelector('[data-testid="receipt-amount"]')?.textContent,
    ).toContain("$79.00");
    expect(
      document.querySelector('[data-testid="receipt-session"]')?.textContent,
    ).toBe("TC-543210ZZ");
    for (const amount of ["$49.00", "$90.00", "$135.00", "$225.00"]) {
      expect(html).not.toContain(amount);
    }
  });

  it("offers access only for launched purchased worlds while retaining the receipt", async () => {
    purchaseRows.push(
      completedPurchase({
        plan_id: "twoBundle",
        world_ids: ["deep-orbit", "signal-ward"],
      }),
    );
    const { document } = await renderPage();

    expect(
      document.querySelector('[data-testid="access-start-deep-orbit"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="access-start-signal-ward"]'),
    ).toBeNull();
    expect(document.querySelector('a[href="/worlds/signal-ward"]')).toBeNull();
    expect(
      document
        .querySelector('[data-testid="receipt-worlds"]')
        ?.getAttribute("data-world-ids"),
    ).toBe("deep-orbit, signal-ward");
    expect(
      document.querySelector('[data-testid="receipt-worlds"]')?.textContent,
    ).toBe("Deep Orbit, Signal Ward");
  });

  it("does not claim default-world access for a purchase with no launched worlds", async () => {
    purchaseRows.push(completedPurchase({ world_ids: ["signal-ward"] }));
    const { document, html } = await renderPage();

    expect(document.querySelector("h1")?.textContent).toBe(
      "Your purchase is confirmed.",
    );
    expect(
      document.querySelector('[data-testid="purchase-receipt"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="cta-first-lesson"]'),
    ).toBeNull();
    expect(document.querySelector('[data-testid^="access-start-"]')).toBeNull();
    expect(document.querySelector('a[href="/worlds/deep-orbit"]')).toBeNull();
    const dashboardActions = [
      ...document.querySelectorAll('a[href="/dashboard"]'),
    ];
    expect(
      dashboardActions.some(
        (action) => action.textContent === "Go to dashboard",
      ),
    ).toBe(true);
    expect(html).not.toContain("Deep Orbit is yours");
    expect(html).not.toContain("engineering.webp");
  });

  it("renders stored receipt values with friendly names and a shortened reference", async () => {
    purchaseRows.push(
      completedPurchase({
        plan_id: "allFive",
        world_ids: [
          "deep-orbit",
          "neon-protocol",
          "signal-ward",
          "nova-canvas",
          "terra-grid",
        ],
        amount: 129,
        stripe_session_id: "cs_test_RECEIPTIDLAST8CH",
      }),
    );
    const { document, html } = await renderPage();

    expect(
      document.querySelector('[data-testid="receipt-amount"]')?.textContent,
    ).toBe("$129.00 USD");
    expect(document.querySelector('dd[data-plan="allFive"]')?.textContent).toBe(
      "All 5 Worlds",
    );
    expect(
      document
        .querySelector('[data-testid="receipt-worlds"]')
        ?.getAttribute("data-world-ids"),
    ).toBe("deep-orbit, neon-protocol, signal-ward, nova-canvas, terra-grid");
    expect(
      document.querySelector('[data-testid="receipt-worlds"]')?.textContent,
    ).toBe("Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid");
    expect(
      document.querySelector('[data-testid="receipt-date"]')?.textContent,
    ).toBe("April 21, 2026 at 10:30 UTC");
    expect(document.querySelector("time")?.getAttribute("datetime")).toBe(
      "2026-04-21T10:30:00.000Z",
    );
    expect(
      document.querySelector('[data-testid="receipt-session"]')?.textContent,
    ).toBe("TC-DLAST8CH");
    expect(html).not.toContain("cs_test_RECEIPTIDLAST8CH");
  });

  it("keeps unknown receipt values readable rather than inventing plan or world names", async () => {
    purchaseRows.push(
      completedPurchase({
        plan_id: "legacy-plan",
        world_ids: ["legacy-world"],
        created_at: "unknown-date",
        stripe_session_id: null,
      }),
    );
    const { document } = await renderPage();

    expect(
      document.querySelector('dd[data-plan="legacy-plan"]')?.textContent,
    ).toBe("legacy-plan");
    expect(
      document.querySelector('[data-testid="receipt-worlds"]')?.textContent,
    ).toBe("legacy-world");
    expect(
      document.querySelector('[data-testid="receipt-date"]')?.textContent,
    ).toBe("unknown-date");
    expect(
      document.querySelector('[data-testid="receipt-session"]')?.textContent,
    ).toBe("Not available");
  });
});
