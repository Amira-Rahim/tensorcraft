import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingHero } from "./components/landing-hero";
import { LandingBridgeTicker } from "./components/landing-bridge-ticker";
import { BridgePreviewSection } from "./components/bridge-preview-section";

// jsdom ships without ResizeObserver / IntersectionObserver, shim so the
// ParticleField canvas effect doesn't throw when it mounts.
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  class MockIntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  }
  if (typeof globalThis.ResizeObserver === "undefined") {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
      MockResizeObserver;
  }
  if (typeof globalThis.IntersectionObserver === "undefined") {
    (
      globalThis as unknown as { IntersectionObserver: unknown }
    ).IntersectionObserver = MockIntersectionObserver;
  }
});

// Stub next/link so render works without the Next router.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// next/dynamic would lazy-load the tfjs demo in jsdom; stub it out, the
// demo has its own tests, here we only care that the hero mounts a panel.
vi.mock("next/dynamic", () => ({
  default: () => {
    const DynamicStub = () => <div data-testid="deep-scan-demo-stub" />;
    return DynamicStub;
  },
}));

// framer-motion's motion.div just needs to pass children through for tests.
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }: { children?: React.ReactNode }) => (
          <div {...props}>{children}</div>
        ),
    },
  ),
}));

describe("Landing page brutalist redesign (§11d Wave 1)", () => {
  describe("LandingHero", () => {
    it("renders the curiosity-hook landing headline", () => {
      render(<LandingHero />);
      // The headline is split across spans; match by combined text.
      expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
        /ml speaks javascript/i,
      );
      expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
        /turns out you'?re fluent/i,
      );
    });

    it("renders a ParticleField canvas that is aria-hidden", () => {
      const { container } = render(<LandingHero />);
      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
      expect(canvas!.getAttribute("aria-hidden")).toBe("true");
    });

    it("CTA buttons are square-edged (rounded-none), brutalist marker", () => {
      render(<LandingHero />);
      const primary = screen.getByTestId("landing-cta-primary");
      const secondary = screen.getByTestId("landing-cta-secondary");
      expect(primary.className).toMatch(/rounded-none/);
      expect(secondary.className).toMatch(/rounded-none/);
    });

    it("primary CTA has focus-visible ring utilities", () => {
      render(<LandingHero />);
      const primary = screen.getByTestId("landing-cta-primary");
      expect(primary.className).toMatch(/focus-visible:ring-/);
    });

    // Conversion pass (2026-06-10), spec:
    // docs/superpowers/specs/2026-06-10-hero-conversion-pass.md
    it("primary CTA uses outcome copy and keeps the free-lesson href", () => {
      render(<LandingHero />);
      const primary = screen.getByTestId("landing-cta-primary");
      expect(primary.textContent).toMatch(/run your first tensor/i);
      expect(primary.getAttribute("href")).toBe(
        "/themes/deep-orbit/foundations/introduction-to-tensors",
      );
    });

    it("eyebrow carries the No Python differentiator instead of pipeline talk", () => {
      const { container } = render(<LandingHero />);
      expect(container.textContent).toMatch(/no python required/i);
      expect(container.textContent).not.toMatch(/pipeline/i);
    });

    it("renders the stat line (modules / lessons / deployable model)", () => {
      render(<LandingHero />);
      const stats = screen.getByTestId("hero-stat-line");
      expect(stats.textContent).toMatch(/11 modules/i);
      expect(stats.textContent).toMatch(/55 lessons/i);
      expect(stats.textContent).toMatch(/1 deployable model/i);
    });

    it("renders the trust line under the CTAs", () => {
      render(<LandingHero />);
      const trust = screen.getByTestId("hero-trust-line");
      expect(trust.textContent).toMatch(/no credit card/i);
      expect(trust.textContent).toMatch(/no account for module 1/i);
    });

    it("mounts the live-demo proof panel", () => {
      render(<LandingHero />);
      expect(screen.getByTestId("hero-demo-panel")).toBeInTheDocument();
      expect(screen.getByTestId("deep-scan-demo-stub")).toBeInTheDocument();
    });
  });

  // Bridge section UX/a11y audit fixes (2026-06-10), spec:
  // docs/superpowers/specs/2026-06-10-bridge-section-audit-fixes.md
  describe("BridgePreviewSection", () => {
    it("shows React only, with no framework selector (V1 is React-only)", () => {
      render(<BridgePreviewSection />);
      expect(
        screen.queryByRole("button", { name: /show bridges in/i }),
      ).toBeNull();
      expect(screen.getByText(/your react code/i)).toBeInTheDocument();
    });

    it("exposes exactly one bridge, no cycler (catalog is paid content)", () => {
      render(<BridgePreviewSection />);
      expect(screen.queryByTestId("bridge-prev")).toBeNull();
      expect(screen.queryByTestId("bridge-next")).toBeNull();
      expect(screen.queryByTestId("bridge-counter")).toBeNull();
    });

    it("has a section exit CTA pointing at the free lesson", () => {
      render(<BridgePreviewSection />);
      const cta = screen.getByTestId("bridge-section-cta");
      expect(cta.getAttribute("href")).toBe(
        "/themes/deep-orbit/foundations/introduction-to-tensors",
      );
    });

    it("does not render the removed bridge-explanation footer", () => {
      const { container } = render(<BridgePreviewSection />);
      expect(container.textContent).not.toMatch(/all shown in/i);
      expect(container.textContent).not.toMatch(/personalized/i);
    });

    it("h2 avoids the 'You already' template (used by hero + onboarding)", () => {
      render(<BridgePreviewSection />);
      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h2.textContent).not.toMatch(/you already/i);
    });
  });

  describe("FAQ data (single source for visible FAQ + JSON-LD)", () => {
    it("covers the core objections incl. math level and refunds", async () => {
      const { FAQ_ITEMS } = await import("./faq-data");
      expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(6);
      const all = FAQ_ITEMS.map((i) => `${i.q} ${i.a}`).join(" ");
      expect(all).toMatch(/math/i);
      expect(all).toMatch(/14-day money-back/i);
      expect(all).toMatch(/no python required/i);
    });
  });

  describe("LandingBridgeTicker", () => {
    it("renders a BridgeTicker track with at least 8 source items", async () => {
      render(<LandingBridgeTicker />);
      const track = screen.getByTestId("ticker-track");
      expect(track).toBeInTheDocument();
      // BridgeTicker renders cards (doubled when motion enabled, single when
      // reduced motion). At least the source count should be present.
      const cards = screen.getAllByTestId("bridge-card");
      expect(cards.length).toBeGreaterThanOrEqual(8);
    });

    it("exports LANDING_BRIDGE_ITEMS with tier metadata", async () => {
      const mod = await import("./components/landing-bridge-ticker");
      expect(Array.isArray(mod.LANDING_BRIDGE_ITEMS)).toBe(true);
      expect(mod.LANDING_BRIDGE_ITEMS.length).toBeGreaterThanOrEqual(8);
      // Every item should have fe + ml + tier.
      for (const item of mod.LANDING_BRIDGE_ITEMS) {
        expect(typeof item.fe).toBe("string");
        expect(typeof item.ml).toBe("string");
        expect(["identity", "structural", "intuition"]).toContain(item.tier);
      }
    });
  });
});
