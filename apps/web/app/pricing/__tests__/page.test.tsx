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
  it('renders the "Buy once" H1', () => {
    render(<PricingPage />);
    const h1 = screen.getByTestId("pricing-heading");
    expect(h1.tagName).toBe("H1");
    expect(h1).toHaveTextContent(/Buy once\. Keep forever\./i);
  });

  it("renders the 5-tier grid (embedded PricingTiers)", () => {
    render(<PricingPage />);
    expect(screen.getByTestId("pricing-tiers")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-free")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-all-five")).toBeInTheDocument();
  });

  it("does not render the removed comparison table", () => {
    render(<PricingPage />);
    expect(screen.queryByTestId("comparison-table")).not.toBeInTheDocument();
  });

  it("renders a curriculum preview of the launched theme's modules", () => {
    render(<PricingPage />);
    const section = screen.getByTestId("curriculum-preview");
    expect(section).toBeInTheDocument();
    // Module titles from the launched theme are visible pre-purchase.
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
});
