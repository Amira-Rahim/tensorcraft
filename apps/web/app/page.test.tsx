import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingHero } from "./components/landing-hero";
import { LandingBridgeTicker } from "./components/landing-bridge-ticker";
import { LandingFiveCLoop } from "./components/landing-five-c-loop";

// jsdom ships without ResizeObserver / IntersectionObserver — shim so the
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

// framer-motion's motion.div just needs to pass children through for tests.
vi.mock("framer-motion", () => ({
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
    it("renders the iterated landing headline (mental-model frame)", () => {
      render(<LandingHero />);
      // The headline is split across spans; match by combined text.
      expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
        /same mental model/i,
      );
      expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
        /new domain/i,
      );
    });

    it("renders a ParticleField canvas that is aria-hidden", () => {
      const { container } = render(<LandingHero />);
      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
      expect(canvas!.getAttribute("aria-hidden")).toBe("true");
    });

    it("CTA buttons are square-edged (rounded-none) — brutalist marker", () => {
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

  describe("LandingFiveCLoop", () => {
    it("renders exactly 5 stages (Context → Code → Callout → Checkpoint → Conclusion)", () => {
      render(<LandingFiveCLoop />);
      const stages = screen.getAllByTestId("five-c-stage");
      expect(stages).toHaveLength(5);
    });

    it("stages are ordered 01..05", () => {
      render(<LandingFiveCLoop />);
      const stages = screen.getAllByTestId("five-c-stage");
      const nums = stages.map((s) => s.getAttribute("data-stage-num"));
      expect(nums).toEqual(["01", "02", "03", "04", "05"]);
    });

    it("each stage name appears in the rendered output", async () => {
      const { FIVE_C_STAGES } =
        await import("./components/landing-five-c-loop");
      render(<LandingFiveCLoop />);
      for (const stage of FIVE_C_STAGES) {
        // Name is rendered uppercase — match case-insensitively.
        expect(
          screen.getAllByText(new RegExp(stage.name, "i")).length,
        ).toBeGreaterThan(0);
      }
    });
  });
});
