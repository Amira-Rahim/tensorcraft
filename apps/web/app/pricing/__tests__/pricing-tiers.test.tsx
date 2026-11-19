import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PricingTiers } from "../pricing-tiers";

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Minimal router stub, CheckoutButton pulls in next/navigation. There is
// deliberately no useSearchParams stub: PricingTiers reads the auth
// roundtrip's ?plan=&worlds= from window.location, because the hook forced
// the whole grid out of the server HTML (CLS 0.359 on /pricing, 2026-10-25).
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Supabase client, no session so we don't hit owned-world lookups.
const getSessionMock = vi.fn().mockResolvedValue({ data: { session: null } });
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getSession: getSessionMock },
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackCheckoutStarted: vi.fn(),
}));

vi.mock("@tensorcraft/worlds", () => {
  const slugs = [
    "deep-orbit",
    "neon-protocol",
    "signal-ward",
    "nova-canvas",
    "terra-grid",
  ] as const;
  return {
    worldSlugs: slugs,
    worlds: {
      "deep-orbit": {
        displayName: "Deep Orbit",
        palette: { primary: "#00f0ff" },
      },
      "neon-protocol": {
        displayName: "Neon Protocol",
        palette: { primary: "#ff00aa" },
      },
      "signal-ward": {
        displayName: "Signal Ward",
        palette: { primary: "#ffd400" },
      },
      "nova-canvas": {
        displayName: "Nova Canvas",
        palette: { primary: "#ff7a00" },
      },
      "terra-grid": {
        displayName: "Terra Grid",
        palette: { primary: "#00c27a" },
      },
    },
  };
});

// Stub fetch so CheckoutButton's POST can be asserted.
const fetchMock = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ url: "https://checkout.stripe.com/abc" }),
});

describe("PricingTiers (brutalist grid, buyable tiers only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: "test-token",
          user: { id: "test-user-id" },
        },
      },
    });
    global.fetch = fetchMock;
    // @ts-expect-error, jsdom location is read-only; we replace it.
    delete window.location;
    // @ts-expect-error, minimal Location polyfill for CheckoutButton.
    window.location = { href: "" };
  });

  it("renders exactly the buyable tiers", () => {
    // The three bundle tiers left the grid: with one world launched they
    // could only ever render as dead CTAs, which anchored $59 as a stripped
    // entry tier and implied a delivery schedule the world-2 gate does not
    // promise. Since 2026-08-14 (owner directive) the bundle prices render
    // nowhere on the page at all.
    render(<PricingTiers />);
    expect(screen.getByTestId("tier-card-free")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-single")).toBeInTheDocument();
    expect(screen.queryByTestId("tier-card-two")).toBeNull();
    expect(screen.queryByTestId("tier-card-three")).toBeNull();
    expect(screen.queryByTestId("tier-card-all-five")).toBeNull();
  });

  it("shows the introductory charge and regular price on the paid tier", () => {
    render(<PricingTiers />);
    expect(screen.getByTestId("tier-card-free")).toHaveTextContent("$0");
    const paid = screen.getByTestId("tier-card-single");
    expect(paid).toHaveTextContent("Introductory price");
    expect(paid).toHaveTextContent("$79");
    expect(paid).toHaveTextContent("Regular price $99");
  });

  it("maps plan ids to tier cards", () => {
    render(<PricingTiers />);
    expect(screen.getByTestId("tier-card-free")).toHaveAttribute(
      "data-plan-id",
      "free",
    );
    expect(screen.getByTestId("tier-card-single")).toHaveAttribute(
      "data-plan-id",
      "single",
    );
  });

  it("recommends the buyable Single tier while only one world is launched (2026-07-14 UX audit: never ribbon an unbuyable tier)", () => {
    render(<PricingTiers />);
    const single = screen.getByTestId("tier-card-single");
    expect(single).toHaveAttribute("data-recommended", "true");
    expect(single).toHaveTextContent(/Available Now/i);
  });

  it("uses rounded-none (brutalist) on every tier card", () => {
    render(<PricingTiers />);
    for (const slug of ["free", "single"]) {
      const card = screen.getByTestId(`tier-card-${slug}`);
      expect(card.className).toMatch(/rounded-none/);
    }
  });

  it("Single tier CTA sends planId=single with the preselected world (no extra click while one world is launched)", async () => {
    render(<PricingTiers />);
    const card = screen.getByTestId("tier-card-single");
    // 2026-07-14 UX audit: with exactly one launched world, the picker
    // preselects it - the CTA must be enabled immediately.
    const cta = Array.from(card.querySelectorAll("button")).find((b) =>
      /Buy Now/i.test(b.textContent ?? ""),
    ) as HTMLButtonElement | undefined;
    expect(cta).toBeTruthy();
    expect(cta!.disabled).toBe(false);
    fireEvent.click(cta!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.planId).toBe("single");
    expect(body.worldIds).toEqual(["deep-orbit"]);
  });

  // Owner directive 2026-08-23: with one world launched, the one-option
  // picker's only possible action was deselecting the preselected world and
  // disabling the CTA. It returns via the launchedWorldCount > 1 guard when
  // a second world launches.
  it("hides the world picker while exactly one world is launched", () => {
    render(<PricingTiers />);
    expect(screen.queryByText(/pick 1 world/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /^Deep Orbit$/ })).toBeNull();
  });

  // /extras was removed 2026-08-15 (owner decision). The free tier must not
  // advertise content that no longer exists.
  it("free tier advertises no bonus deep-dive lessons and never links to /extras", () => {
    render(<PricingTiers />);
    expect(screen.getByTestId("tier-card-free")).not.toHaveTextContent(
      /bonus deep-dive/i,
    );
    const links = screen.queryAllByRole("link");
    for (const link of links) {
      expect(link.getAttribute("href")).not.toMatch(/^\/extras/);
    }
  });

  // 63 scene plates shipped 2026-08-09 and no buying surface mentioned them.
  // The claim is phrased as coverage, not a count: every briefing has a plate,
  // so "illustrated lessons" stays true as lessons are added, whereas "63"
  // would go stale the way the "21 bonus lessons" literal did. Licensed by
  // packages/content/__tests__/scene-art-coverage.test.ts, which fails if any
  // built lesson is missing its plate.
  it("tells the buyer the course is illustrated", () => {
    render(<PricingTiers />);
    expect(screen.getByTestId("tier-card-single")).toHaveTextContent(
      /illustrated lessons/i,
    );
    expect(screen.getByTestId("tier-card-free")).toHaveTextContent(
      /illustrated/i,
    );
  });

  it("never prints a raw scene-plate count that could drift", () => {
    render(<PricingTiers />);
    expect(screen.getByTestId("tier-card-single")).not.toHaveTextContent(
      /\b63\b/,
    );
  });
});
