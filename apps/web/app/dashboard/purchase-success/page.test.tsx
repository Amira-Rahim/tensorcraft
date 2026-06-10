import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
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
  theme_ids: string[];
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

// The page calls `getModules(slug)` for per-theme module counts. Keep
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

// Analytics hook is client-side and fires a network call in real use;
// rendering it should be a no-op in tests.
vi.mock("./purchase-analytics", () => ({
  PurchaseAnalytics: () => null,
}));

function resetState(): void {
  purchaseRows = [];
  getUserMock.mockReset();
}

async function renderPage(searchParams?: Record<string, string>): Promise<{
  html: string;
  element: ReactElement;
}> {
  const { default: PurchaseSuccessPage } = await import("./page");
  const element = (await PurchaseSuccessPage({
    searchParams: searchParams ? Promise.resolve(searchParams) : undefined,
  })) as ReactElement;
  const html = renderToStaticMarkup(element);
  return { html, element };
}

describe("dashboard/purchase-success/page", () => {
  beforeEach(() => {
    resetState();
  });

  it("redirects unauthenticated users to /auth", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const { default: PurchaseSuccessPage } = await import("./page");

    await expect(PurchaseSuccessPage({})).rejects.toMatchObject({
      target: "/auth",
    });
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it('renders the "You\'re In" brutalist headline for an authed user', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: "x@example.com" } },
      error: null,
    });
    purchaseRows.push({
      user_id: "u-1",
      plan_id: "single",
      theme_ids: ["deep-orbit"],
      amount: 79,
      created_at: "2026-04-21T10:30:00.000Z",
      stripe_session_id: "cs_test_abcdefgh12345678",
      status: "completed",
    });

    const { html } = await renderPage();

    expect(html).toContain("You&#x27;re In");
    // Mono, uppercase, large hero, key brutalist treatment markers.
    expect(html).toMatch(/font-mono[^"]*uppercase/);
  });

  it("looks up the purchase by stripe session_id when provided", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1" } },
      error: null,
    });
    // Older purchase (would win the most-recent fallback)…
    purchaseRows.push({
      user_id: "u-1",
      plan_id: "single",
      theme_ids: ["neon-protocol"],
      amount: 49,
      created_at: "2026-01-01T00:00:00.000Z",
      stripe_session_id: "cs_test_OLDOLDOLDOLDOLD0",
      status: "completed",
    });
    // …and the session-specific purchase we expect to be selected.
    purchaseRows.push({
      user_id: "u-1",
      plan_id: "twoBundle",
      theme_ids: ["deep-orbit", "signal-ward"],
      amount: 79,
      created_at: "2026-04-21T10:30:00.000Z",
      stripe_session_id: "cs_test_TARGETXYZ9999999",
      status: "completed",
    });

    const { html } = await renderPage({
      session_id: "cs_test_TARGETXYZ9999999",
    });

    // Receipt renders the session-specific purchase.
    expect(html).toContain("$79.00");
    expect(html).toContain("twoBundle");
    expect(html).toContain("deep-orbit, signal-ward");
    // Last-8 chars of the session id appear; the full id does not.
    expect(html).toContain("Z9999999");
    expect(html).not.toContain("cs_test_TARGETXYZ9999999");
    // The older purchase did NOT leak through.
    expect(html).not.toContain("$49.00");
    expect(html).not.toContain("OLDOLDOLDOLDOLD0");
  });

  it("falls back to the most recent completed purchase when no session_id is given", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1" } },
      error: null,
    });
    purchaseRows.push({
      user_id: "u-1",
      plan_id: "single",
      theme_ids: ["neon-protocol"],
      amount: 49,
      created_at: "2026-01-01T00:00:00.000Z",
      stripe_session_id: "cs_test_OLD1234567890AB",
      status: "completed",
    });
    purchaseRows.push({
      user_id: "u-1",
      plan_id: "twoBundle",
      theme_ids: ["deep-orbit", "signal-ward"],
      amount: 79,
      created_at: "2026-04-21T10:30:00.000Z",
      stripe_session_id: "cs_test_NEW9876543210ZZ",
      status: "completed",
    });

    const { html } = await renderPage();

    // Most recent purchase wins.
    expect(html).toContain("$79.00");
    expect(html).toContain("3210ZZ");
    expect(html).not.toContain("$49.00");
  });

  it("renders one access-card row per purchased launched theme with a Start Now CTA", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1" } },
      error: null,
    });
    // V1 scope-revert: coming-soon theme ids in `theme_ids` are stripped from
    // the access-card list (they still appear in the raw receipt above).
    purchaseRows.push({
      user_id: "u-1",
      plan_id: "twoBundle",
      theme_ids: ["deep-orbit", "signal-ward"],
      amount: 79,
      created_at: "2026-04-21T10:30:00.000Z",
      stripe_session_id: "cs_test_abcdefgh12345678",
      status: "completed",
    });

    const { html } = await renderPage();

    expect(html).toContain('data-testid="access-start-deep-orbit"');
    expect(html).toContain('href="/themes/deep-orbit"');
    expect(html).toContain("Start Now");
    // Coming-soon theme has no access card at V1.
    expect(html).not.toContain('data-testid="access-start-signal-ward"');
    expect(html).not.toContain('href="/themes/signal-ward"');
  });

  it("primary CTA falls back to default theme when only coming-soon themes are owned", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1" } },
      error: null,
    });
    // V1 scope-revert: only coming-soon themes purchased (e.g. via stale row)
    // → access list is empty → primary CTA falls back to DEFAULT_THEME.
    purchaseRows.push({
      user_id: "u-1",
      plan_id: "single",
      theme_ids: ["signal-ward"],
      amount: 49,
      created_at: "2026-04-21T10:30:00.000Z",
      stripe_session_id: "cs_test_abcdefgh12345678",
      status: "completed",
    });

    const { html } = await renderPage();

    expect(html).toContain('data-testid="cta-first-lesson"');
    expect(html).toContain('href="/themes/deep-orbit"');
    expect(html).toContain("Start your first lesson");

    expect(html).toContain('data-testid="cta-view-all-themes"');
    expect(html).toContain('href="/themes"');
    expect(html).toContain("View all themes");
  });

  it("renders receipt with amount, plan, themes, date, and session-id tail (mono)", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1" } },
      error: null,
    });
    purchaseRows.push({
      user_id: "u-1",
      plan_id: "allFive",
      theme_ids: [
        "deep-orbit",
        "neon-protocol",
        "signal-ward",
        "nova-canvas",
        "terra-grid",
      ],
      amount: 129,
      created_at: "2026-04-21T10:30:00.000Z",
      stripe_session_id: "cs_test_RECEIPTIDLAST8CH",
      status: "completed",
    });

    const { html } = await renderPage();

    expect(html).toContain('data-testid="purchase-receipt"');
    expect(html).toMatch(/data-testid="purchase-receipt"[^>]*font-mono/);
    expect(html).toContain("$129.00");
    expect(html).toContain("allFive");
    expect(html).toContain("LAST8CH");
    // Themes list is rendered in a mono block.
    expect(html).toContain(
      "deep-orbit, neon-protocol, signal-ward, nova-canvas, terra-grid",
    );
    // Date rendered in ISO-ish UTC form (not the raw ISO string).
    expect(html).toContain("2026-04-21 10:30 UTC");
  });
});
