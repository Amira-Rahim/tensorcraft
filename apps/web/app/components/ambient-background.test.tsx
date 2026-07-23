import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { AmbientBackground, readPalettes } from "./ambient-background";
import { mockMatchMedia } from "./test-utils/mock-match-media";

/* AmbientBackground's rAF/static-frame loop reads
   `document.documentElement.dataset.scheme` every frame (cheap attribute
   read — never getComputedStyle, which would force a style recalc per
   frame). The CSS-var *palette* itself is only read via getComputedStyle at
   mount and on data-theme/data-scheme mutation (via the shared
   useAttributeObserver hook), never per frame. These tests cover: the
   parsing helper itself, the mount+mutation re-read wiring, the light-mode
   glow-halo skip, and the reduced-motion static-frame refresh. */

const FAKE_RECT = {
  width: 300,
  height: 150,
  top: 0,
  left: 0,
  right: 300,
  bottom: 150,
  x: 0,
  y: 0,
  toJSON() {
    return {};
  },
} as DOMRect;

interface RecordedArc {
  radius: number;
}

function makeFakeCtx() {
  const arcs: RecordedArc[] = [];
  const fillStyles: string[] = [];
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn((_x: number, _y: number, radius: number) => {
      arcs.push({ radius });
    }),
    fillStyle: "",
    fill: vi.fn(function (this: { fillStyle: string }) {
      fillStyles.push(this.fillStyle);
    }),
  };
  return { ctx, arcs, fillStyles };
}

describe("readPalettes", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--tc-primary-rgb");
    document.documentElement.style.removeProperty("--tc-tier-structural");
    document.documentElement.style.removeProperty("--tc-tier-intuition");
  });

  it("parses --tc-primary-rgb (triplet) and the two hex tier vars", () => {
    document.documentElement.style.setProperty(
      "--tc-primary-rgb",
      "10, 20, 30",
    );
    document.documentElement.style.setProperty(
      "--tc-tier-structural",
      "#4b7a99",
    );
    document.documentElement.style.setProperty(
      "--tc-tier-intuition",
      "#87724a",
    );

    expect(readPalettes()).toEqual([
      [10, 20, 30],
      [75, 122, 153],
      [135, 114, 74],
    ]);
  });

  it("falls back to the dark deep-orbit defaults when the CSS vars are missing", () => {
    expect(readPalettes()).toEqual([
      [107, 170, 138],
      [112, 150, 176],
      [168, 144, 96],
    ]);
  });
});

describe("AmbientBackground", () => {
  beforeEach(() => {
    mockMatchMedia(true); // prefers-reduced-motion: reduce → static-frame path,
    // deterministic (no ongoing rAF loop to race against in assertions)
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
      FAKE_RECT,
    );
    Object.defineProperty(window, "devicePixelRatio", {
      value: 1,
      configurable: true,
    });
  });

  afterEach(() => {
    // See scene-canvas.test.tsx's afterEach comment: cleanup() first,
    // disconnecting each component's attribute observer, before touching
    // the shared data-scheme/data-theme attrs.
    cleanup();
    delete document.documentElement.dataset.scheme;
    delete document.documentElement.dataset.theme;
    vi.restoreAllMocks();
  });

  it("re-reads the CSS palette on mount and again on each data-theme/data-scheme mutation", async () => {
    const { ctx } = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx as any,
    );
    const computedStyleSpy = vi.spyOn(window, "getComputedStyle");

    render(<AmbientBackground count={1} />);
    const afterMount = computedStyleSpy.mock.calls.length;
    expect(afterMount).toBeGreaterThan(0);

    document.documentElement.dataset.theme = "neon-protocol";
    await waitFor(() =>
      expect(computedStyleSpy.mock.calls.length).toBeGreaterThan(afterMount),
    );

    const afterTheme = computedStyleSpy.mock.calls.length;
    document.documentElement.dataset.scheme = "light";
    await waitFor(() =>
      expect(computedStyleSpy.mock.calls.length).toBeGreaterThan(afterTheme),
    );
  });

  it("repaints the reduced-motion static frame when data-scheme mutates", async () => {
    const { ctx } = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx as any,
    );

    render(<AmbientBackground count={1} />);
    const afterMount = ctx.clearRect.mock.calls.length;
    expect(afterMount).toBeGreaterThan(0);

    document.documentElement.dataset.scheme = "light";
    await waitFor(() =>
      expect(ctx.clearRect.mock.calls.length).toBeGreaterThan(afterMount),
    );
  });

  describe("glow-halo scheme behavior", () => {
    beforeEach(() => {
      // Forces every particle's radius roll (`Math.random() < 0.18`) to the
      // "large" branch (r = 2.0, halo-eligible), so both schemes draw a
      // deterministic, comparable arc set.
      vi.spyOn(Math, "random").mockReturnValue(0.1);
    });

    it("draws the glow-halo arc (radius = 4× particle radius) in dark scheme", () => {
      const { ctx, arcs } = makeFakeCtx();
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctx as any,
      );

      render(<AmbientBackground count={1} />);

      const radii = arcs.map((a) => a.radius);
      expect(radii).toContain(2.0); // main dot
      expect(radii).toContain(8.0); // halo: p.r * 4
    });

    it("skips the glow-halo arc in light scheme (clean ink motes only)", () => {
      document.documentElement.dataset.scheme = "light";
      const { ctx, arcs } = makeFakeCtx();
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctx as any,
      );

      render(<AmbientBackground count={1} />);

      const radii = arcs.map((a) => a.radius);
      expect(radii).toContain(2.0); // main dot still drawn
      expect(radii).not.toContain(8.0); // halo skipped
    });
  });
});
