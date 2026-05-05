import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PricingPage from "../page";

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({
    get: () => null,
    toString: () => "",
  }),
  usePathname: () => "/pricing",
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackCheckoutStarted: vi.fn(),
  trackPricingPageViewed: vi.fn(),
}));

vi.mock("@/app/components/ambient-background", () => ({
  AmbientBackground: () => <div data-testid="ambient-bg" />,
}));

vi.mock("@tensorcraft/themes", () => {
  const slugs = [
    "deep-orbit",
    "neon-protocol",
    "signal-ward",
    "nova-canvas",
    "terra-grid",
  ] as const;
  return {
    themeSlugs: slugs,
    themes: {
      "deep-orbit": { displayName: "Deep Orbit", palette: { primary: "#0" } },
      "neon-protocol": {
        displayName: "Neon Protocol",
        palette: { primary: "#0" },
      },
      "signal-ward": {
        displayName: "Signal Ward",
        palette: { primary: "#0" },
      },
      "nova-canvas": {
        displayName: "Nova Canvas",
        palette: { primary: "#0" },
      },
      "terra-grid": { displayName: "Terra Grid", palette: { primary: "#0" } },
    },
  };
});

describe("PricingPage (brutalist Phase 11 §11d)", () => {
  it('renders the "Simple, Fair Pricing" H1', () => {
    render(<PricingPage />);
    const h1 = screen.getByTestId("pricing-heading");
    expect(h1.tagName).toBe("H1");
    expect(h1).toHaveTextContent(/Simple, Fair Pricing/i);
  });

  it("renders the 5-tier grid (embedded PricingTiers)", () => {
    render(<PricingPage />);
    expect(screen.getByTestId("pricing-tiers")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-free")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-all-five")).toBeInTheDocument();
  });

  it("renders the comparison table with all 5 tier columns", () => {
    render(<PricingPage />);
    const table = screen.getByTestId("comparison-table");
    expect(table).toBeInTheDocument();
    for (const key of [
      "free",
      "single",
      "twoBundle",
      "threeBundle",
      "allFive",
    ]) {
      expect(screen.getByTestId(`comparison-col-${key}`)).toBeInTheDocument();
    }
  });

  it("comparison table header row shows each tier price", () => {
    render(<PricingPage />);
    const table = screen.getByTestId("comparison-table");
    expect(table).toHaveTextContent("$0");
    expect(table).toHaveTextContent("$49");
    expect(table).toHaveTextContent("$79");
    expect(table).toHaveTextContent("$99");
    expect(table).toHaveTextContent("$129");
  });

  it("comparison table includes core feature rows", () => {
    render(<PricingPage />);
    const table = screen.getByTestId("comparison-table");
    for (const feature of [
      "Module 1 access",
      "All 11 modules",
      "GitHub push",
      "Certificate",
      "Bridge explorer",
    ]) {
      expect(table).toHaveTextContent(feature);
    }
  });
});
