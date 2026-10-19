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
          in: () => Promise.resolve({ data: [] }),
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

vi.mock("@tensorcraft/content", () => ({
  getModules: (slug: string) =>
    slug === "deep-orbit"
      ? [
          {
            slug: "foundations",
            title: "Foundations",
            description: "Tensors from arrays",
            order: 1,
          },
          {
            slug: "signal-processing",
            title: "Signal Processing",
            description: "Windows and filters",
            order: 2,
          },
          {
            slug: "neural-networks",
            title: "Neural Networks",
            description: "Layers as middleware",
            order: 3,
          },
        ]
      : [],
  getModuleLessons: () => [
    { slug: "l1", title: "Lesson 1", order: 1, estimatedMinutes: 18 },
    { slug: "l2", title: "Lesson 2", order: 2, estimatedMinutes: 20 },
  ],
  // Preview minutes include exercise time (JSON-LD basis): each mock
  // lesson carries one 10-minute exercise, matching the old
  // getLessonExercises mock this replaced.
  getLessonTotalMinutes: (l: { estimatedMinutes?: number }) =>
    (l.estimatedMinutes ?? 18) + 10,
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
  it('renders the "Buy once" H1', () => {
    render(<PricingPage />);
    const h1 = screen.getByTestId("pricing-heading");
    expect(h1.tagName).toBe("H1");
    expect(h1).toHaveTextContent(/Course pricing/i);
  });

  it("no longer renders the Common Questions FAQ block (removed 2026-09-01)", () => {
    // Owner request; the landing page keeps the shared FaqSection and the
    // FAQPage JSON-LD it emits. Objection copy here is the refund badge.
    render(<PricingPage />);
    expect(screen.queryByTestId("pricing-faq")).not.toBeInTheDocument();
    expect(screen.queryByText(/common questions/i)).toBeNull();
    // Cut the same day: the footer's "Start with the free module. Buy when
    // you want the other ten." line.
    expect(screen.queryByText(/start with the free module/i)).toBeNull();
  });

  it("renders only the buyable tiers, with no future bundle pricing", () => {
    // 2026-08-09: the three bundle cards left the grid (dead CTAs anchoring
    // $59 as a stripped entry tier). 2026-08-14, owner directive: the
    // "listed, not sold" BundleRoadmap strip left too. Future product plans
    // render nowhere on the page.
    render(<PricingPage />);
    expect(screen.getByTestId("pricing-tiers")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-free")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-single")).toBeInTheDocument();
    expect(screen.queryByTestId("tier-card-all-five")).toBeNull();
    expect(screen.queryByTestId("bundle-roadmap")).toBeNull();
    expect(screen.queryByText(/not for sale/i)).toBeNull();
  });

  it("does not render the removed comparison table", () => {
    render(<PricingPage />);
    expect(screen.queryByTestId("comparison-table")).not.toBeInTheDocument();
  });

  it("renders a curriculum preview of the launched world's modules", () => {
    render(<PricingPage />);
    const section = screen.getByTestId("curriculum-preview");
    expect(section).toBeInTheDocument();
    // Module titles from the launched world are visible pre-purchase.
    expect(section).toHaveTextContent("Foundations");
    expect(section).toHaveTextContent("Signal Processing");
    expect(section).toHaveTextContent("Neural Networks");
    // Each module row exposes its lesson count.
    expect(section).toHaveTextContent(/2 lessons/i);
  });

  it("curriculum preview marks Module 1 as free", () => {
    render(<PricingPage />);
    const section = screen.getByTestId("curriculum-preview");
    expect(section).toHaveTextContent(/free/i);
  });

  it("curriculum rows carry the signal-lock flicker hooks", () => {
    // Locks the contract with globals.css ([data-boot] .tc-curriculum-row
    // + --tc-row-delay): a rename on either side fails nothing at runtime,
    // rows simply appear at full opacity and the boot cinematic silently
    // dies. The e2e battery runs under reduced motion and cannot catch it.
    render(<PricingPage />);
    const first = screen.getByTestId("curriculum-module-foundations");
    const last = screen.getByTestId("curriculum-module-neural-networks");
    expect(first.className).toContain("tc-curriculum-row");
    expect(first.style.getPropertyValue("--tc-row-delay")).toBe("1.60s");
    expect(last.style.getPropertyValue("--tc-row-delay")).toBe("2.60s");
  });
});
