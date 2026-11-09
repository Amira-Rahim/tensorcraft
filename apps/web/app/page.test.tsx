import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  BRIDGES,
  DEFAULT_WORLD,
  WORLD_CONTENT,
  getModuleLessonCount,
} from "@tensorcraft/shared";
import { capture } from "@/lib/posthog";
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

// Mock the posthog transport. A factory mock of the widely imported
// analytics-events module is the vi.mock drift trap from the 2026-08-26
// PostHog wiring incident. This mock is partial, so every other export of
// the module stays real.
vi.mock("@/lib/posthog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/posthog")>()),
  capture: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(capture).mockClear();
});

// jsdom cannot navigate, and following the link would log "Not implemented:
// navigation". Cancel the default action so the click exercises the tracker.
function clickWithoutNavigating(el: HTMLElement) {
  el.addEventListener("click", (e) => e.preventDefault());
  fireEvent.click(el);
}

// The free-lesson events among everything `capture` recorded, so a test can
// assert exactly one per click.
function ctaClicks() {
  return vi
    .mocked(capture)
    .mock.calls.filter(([event]) => event === "free_lesson_cta_clicked");
}

describe("Landing page brutalist redesign (§11d Wave 1)", () => {
  describe("LandingHero", () => {
    it("renders the descriptive course headline", () => {
      render(<LandingHero />);
      // The headline is split across spans; the exact combined text also
      // gates the trailing spaces that keep the accessibility tree legible
      // across the block boundaries.
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
        "Machine learning for JavaScript engineers.",
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
    // dropped the "(free)" tag from the button. On 2026-11-02 the free claim
    // returned as a note under the CTAs (first-1,000 plan §9 item 2). The next
    // test asserts that note. Module 1 is the entire free tier, and the note
    // is the hero's only risk reversal.
    it("primary CTA names the mission and world and keeps the free-lesson href", () => {
      render(<LandingHero />);
      const primary = screen.getByTestId("landing-cta-primary");
      expect(primary.textContent).toMatch(/start mission/i);
      expect(primary.textContent).toMatch(/deep orbit/i);
      expect(primary.getAttribute("href")).toBe(
        "/worlds/deep-orbit/foundations/introduction-to-tensors",
      );
    });

    it("names Deep Orbit's free lessons and account-free access next to the CTAs", () => {
      render(<LandingHero />);
      const note = screen.getByTestId("landing-cta-note");
      const freeLessons = getModuleLessonCount(
        DEFAULT_WORLD,
        WORLD_CONTENT.freeModuleSlug,
      );
      expect(note.textContent).toBe(
        `Deep Orbit’s first ${freeLessons} lessons are free, no account needed.`,
      );
      // The note qualifies the buttons, so it sits right after their row.
      expect(note.previousElementSibling).toContainElement(
        screen.getByTestId("landing-cta-primary"),
      );
    });

    it("reports a primary CTA click as a landing_hero free-lesson click", () => {
      render(<LandingHero />);
      clickWithoutNavigating(screen.getByTestId("landing-cta-primary"));
      expect(ctaClicks()).toEqual([
        ["free_lesson_cta_clicked", { source: "landing_hero" }],
      ]);
    });

    it("links the introduction without recording a free-lesson click", () => {
      render(<LandingHero />);
      const explorerLink = screen.getByTestId("landing-cta-secondary");
      expect(explorerLink).toHaveAccessibleName("Watch introduction");
      expect(explorerLink).toHaveAttribute("href", "#introduction");
      clickWithoutNavigating(explorerLink);
      expect(ctaClicks()).toEqual([]);
    });

    it("positions Deep Orbit as the first world within Tensorcraft", () => {
      const { container } = render(<LandingHero />);
      expect(container.textContent).toMatch(/build and evaluate models/i);
      expect(container.textContent).toMatch(
        /interactive stories and JavaScript exercises/i,
      );
      expect(container.textContent).toMatch(
        /each Tensorcraft world explores a different part of ML/i,
      );
      expect(container.textContent).toMatch(
        /Deep Orbit is the first world available/i,
      );
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

    it("no longer renders the connection band (removed 2026-09-01)", () => {
      // Owner request; the section ends on the code band, and the full
      // bridge grammar (connection + breaks) lives on in lesson callouts.
      const { container } = render(<BridgePreviewSection />);
      const firstSentence = previewBridge.connection.split(". ")[0];
      expect(container.textContent).not.toContain(firstSentence);
      expect(container.textContent).not.toContain("bridge:");
    });

    it("does not show the breaks note (owner decision: connection only)", () => {
      const { container } = render(<BridgePreviewSection />);
      if (previewBridge.breaks) {
        const firstSentence = previewBridge.breaks.split(". ")[0];
        expect(container.textContent).not.toContain(firstSentence);
      }
      expect(container.textContent).not.toMatch(/where it breaks/i);
    });

    it("keeps the comparison free of decorative arrow controls", () => {
      const { container } = render(<BridgePreviewSection />);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
      // The comparison uses two labeled columns without a decorative arrow.
      const glyphs = Array.from(
        container.querySelectorAll('[aria-hidden="true"]'),
      ).filter((el) => el.textContent?.includes("⇄"));
      expect(glyphs).toHaveLength(0);
    });

    it("renders the ML snippet one statement per line", () => {
      render(<BridgePreviewSection />);
      const mlCode = screen.getByTestId("bridge-ml-code");
      // Two statements jammed on one line with "; " was the pre-redesign
      // state; the render-time formatter breaks at statement boundaries.
      expect(mlCode.textContent).not.toMatch(/;[ \t]+\S/);
    });
  });

  describe("Introduction video", () => {
    it("opens the approved introduction from the hero without autoplaying it", async () => {
      const { default: Home } = await import("./page");
      render(<Home />);
      const intro = screen.getByTestId("intro-video-section");
      expect(intro).toHaveAttribute("id", "introduction");
      expect(screen.getByTestId("landing-cta-secondary")).toHaveAttribute(
        "href",
        `#${intro.id}`,
      );
      const player = screen.getByTestId("intro-video-player");
      expect(player).toHaveAttribute("src", "/media/tensorcraft-intro.mp4");
      expect(player).toHaveAttribute("controls");
      expect(player).toHaveAttribute("preload", "none");
      expect(player).not.toHaveAttribute("autoplay");
      expect(player.querySelector("track")).toHaveAttribute(
        "src",
        "/media/tensorcraft-intro.vtt",
      );
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

    it("reports a final CTA click as a landing_footer free-lesson click", async () => {
      const { default: Home } = await import("./page");
      render(<Home />);
      clickWithoutNavigating(screen.getByTestId("landing-cta-final"));
      expect(ctaClicks()).toEqual([
        ["free_lesson_cta_clicked", { source: "landing_footer" }],
      ]);
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
      expect(all).toMatch(/full refund within 5 days/i);
      expect(all).toMatch(/without python/i);
    });

    it("carries the objections absorbed from the removed Who This Is For section", async () => {
      const { FAQ_ITEMS } = await import("./faq-data");
      const all = FAQ_ITEMS.map((i) => `${i.q} ${i.a}`).join(" ");
      // Python-stack mismatch and time commitment (landing section cut
      // 2026-08-16; /paywall keeps the component). The video-track entry,
      // and with it the owner-ruled video-scenes tease (2026-08-24), was
      // removed 2026-09-01 by owner request, superseding that ruling; the
      // FAQ must no longer mention video at all.
      expect(all).toMatch(/pytorch/i);
      expect(all).not.toMatch(/video/i);
      expect(all).toMatch(/per-module estimates/i);
    });
  });
});
