import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { BRIDGES } from "@tensorcraft/shared";
import { LandingHero } from "./components/landing-hero";
import { BridgePreviewSection } from "./components/bridge-preview-section";
import { CommitTrail } from "./components/commit-trail";

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
    it("renders the story-first landing headline (owner baseline 2026-08-31)", () => {
      render(<LandingHero />);
      // The headline is split across spans; the exact combined text also
      // gates the trailing spaces that keep the accessibility tree legible
      // across the block boundaries.
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
        "Stories That Take You From JavaScript to ML.",
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
    // 2026-08-22 (owner): label was "Run Your First Tensor (Free)". "Run"
    // was wrong (lesson 1 has the learner write tf.tensor(...), not run
    // one), and "tensor" was the taught term with no gloss anywhere on the
    // page, logged BORDERLINE in
    // docs/audits/prelesson-copy-audit-2026-08-19.md:170. "Mission" is
    // deep-orbit's own word for a lesson (packages/worlds/src/deep-orbit.ts
    // terminology.lesson) and is what the destination renders via
    // lesson-steps.tsx, so the button names the thing the way the product
    // names it three seconds later. The world name follows the same
    // precedent as onboarding's "Start Deep Orbit" (audit :450). Owner also
    // dropped the "(free)" tag here, so no free assertion: if it comes
    // back, restore one, since module 1 is the entire free tier and the
    // claim is the hero's only risk reversal.
    it("primary CTA names the mission and world and keeps the free-lesson href", () => {
      render(<LandingHero />);
      const primary = screen.getByTestId("landing-cta-primary");
      expect(primary.textContent).toMatch(/start mission/i);
      expect(primary.textContent).toMatch(/deep orbit/i);
      expect(primary.getAttribute("href")).toBe(
        "/worlds/deep-orbit/foundations/introduction-to-tensors",
      );
    });

    it("subhead carries the Skip Python differentiator instead of pipeline talk", () => {
      // 2026-08-19 (owner): the eyebrow, stat line, and trust line were cut
      // from the hero; the differentiator now lives only in the subhead.
      const { container } = render(<LandingHero />);
      expect(container.textContent).toMatch(/skip python/i);
      expect(container.textContent).not.toMatch(/pipeline/i);
    });

    it("no longer mounts the live-demo proof panel (removed 2026-08-31)", () => {
      render(<LandingHero />);
      expect(screen.queryByTestId("hero-demo-panel")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("deep-scan-demo-stub"),
      ).not.toBeInTheDocument();
    });
  });

  // Artifact-proof panel (2026-07-14): the commit trail must render REAL
  // module-1 corpus data in the exact format the push pipeline writes
  // (apps/api/src/lib/github.ts). If either side changes format, this
  // assertion is where the drift surfaces. Renders on /paywall only since
  // 2026-08-16 (cut from the landing build band).
  describe("CommitTrail", () => {
    it("renders real module-1 commits in the pipeline's commit format", () => {
      render(<CommitTrail compact />);
      const trail = screen.getByTestId("commit-trail");
      expect(trail.textContent).toMatch(
        /feat\(foundations\): Complete exercise -- /,
      );
      expect(trail.textContent).toMatch(/foundations\/[a-z-]+\.ts/);
      expect(trail.textContent).toMatch(/\+\d+ more commits/);
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
      // Column label is "JAVASCRIPT" (was "YOUR JAVASCRIPT"): house
      // vocabulary fixes the bridge callout labels as "JavaScript" opposite
      // "Machine Learning", and packages/ui/src/mdx/bridge-callout.tsx uses
      // exactly those. Anchored so the section h2 does not satisfy it.
      expect(screen.getByText(/^javascript$/i)).toBeInTheDocument();
    });

    it("exposes exactly one bridge, no cycler (catalog is paid content)", () => {
      render(<BridgePreviewSection />);
      expect(screen.queryByTestId("bridge-prev")).toBeNull();
      expect(screen.queryByTestId("bridge-next")).toBeNull();
      expect(screen.queryByTestId("bridge-counter")).toBeNull();
    });

    it("no longer renders the section exit CTA (removed 2026-08-31)", () => {
      render(<BridgePreviewSection />);
      expect(
        screen.queryByTestId("bridge-section-cta"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/write your first tensor/i)).toBeNull();
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

    // Anatomy redesign (2026-08-16), spec:
    // docs/superpowers/specs/2026-08-16-bridge-section-anatomy-redesign.md
    // The previewed bridge is whichever catalog entry the component's own
    // filter picks, so derive expectations from data, not hardcoded strings.
    const previewBridge =
      BRIDGES.find((b) => b.mlCode && b.variants?.react?.jsCode) ?? BRIDGES[0];

    it("explains the mapping with the bridge's connection prose", () => {
      const { container } = render(<BridgePreviewSection />);
      const firstSentence = previewBridge.connection.split(". ")[0];
      expect(container.textContent).toContain(firstSentence);
    });

    it("does not show the breaks note (owner decision: connection only)", () => {
      const { container } = render(<BridgePreviewSection />);
      if (previewBridge.breaks) {
        const firstSentence = previewBridge.breaks.split(". ")[0];
        expect(container.textContent).not.toContain(firstSentence);
      }
      expect(container.textContent).not.toMatch(/where it breaks/i);
    });

    it("contains no buttons (the connector is decoration, not a control)", () => {
      const { container } = render(<BridgePreviewSection />);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
      // The pre-redesign connector was a bordered, glowing tile that read
      // as a toggle; pin the de-buttoning, not just the role.
      const glyphs = Array.from(
        container.querySelectorAll('[aria-hidden="true"]'),
      ).filter((el) => el.textContent?.includes("⇄"));
      expect(glyphs.length).toBeGreaterThan(0);
      for (const glyph of glyphs) {
        expect(glyph.className).not.toMatch(/border/);
        expect((glyph as HTMLElement).style.boxShadow).toBe("");
      }
    });

    it("renders the ML snippet one statement per line", () => {
      render(<BridgePreviewSection />);
      const mlCode = screen.getByTestId("bridge-ml-code");
      // Two statements jammed on one line with "; " was the pre-redesign
      // state; the render-time formatter breaks at statement boundaries.
      expect(mlCode.textContent).not.toMatch(/;[ \t]+\S/);
    });
  });

  describe("Final CTA", () => {
    it("carries the brutalist idle-stamp loop alongside shadow + hover", async () => {
      const { default: Home } = await import("./page");
      render(<Home />);
      const cta = screen.getByTestId("landing-cta-final");
      expect(cta.className).toMatch(/brutalist-stamp/);
      expect(cta.className).toMatch(/brutalist-shadow/);
      expect(cta.className).toMatch(/brutalist-hover/);
    });
  });

  describe("FAQ data (single source for visible FAQ + JSON-LD)", () => {
    it("covers the core objections incl. math level and refunds", async () => {
      const { FAQ_ITEMS } = await import("./faq-data");
      // Trimmed 6 -> 4 on 2026-08-13: cut the bridge-mechanism and topics
      // questions (both restate sections rendered directly above the FAQ).
      expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(4);
      const all = FAQ_ITEMS.map((i) => `${i.q} ${i.a}`).join(" ");
      expect(all).toMatch(/math/i);
      expect(all).toMatch(/5-day refund guarantee/i);
      expect(all).toMatch(/no python required/i);
    });

    it("carries the objections absorbed from the removed Who This Is For section", async () => {
      const { FAQ_ITEMS } = await import("./faq-data");
      const all = FAQ_ITEMS.map((i) => `${i.q} ${i.a}`).join(" ");
      // Python-stack mismatch, video expectations, time commitment
      // (landing section cut 2026-08-16; /paywall keeps the component).
      expect(all).toMatch(/pytorch/i);
      expect(all).toMatch(/video/i);
      expect(all).toMatch(/per-module estimates/i);
    });
  });
});
