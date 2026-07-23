import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { Ticker } from "./ticker";

/* TickerCanvas runs a continuous rAF loop (no reduced-motion gate, unlike
   ambient-background.tsx/scene-canvas.tsx), so these tests rely on jsdom's
   real requestAnimationFrame (a ~16ms setTimeout) firing during `waitFor`'s
   poll window rather than a single deterministic static frame. */

const FAKE_RECT = {
  width: 300,
  height: 8,
  top: 0,
  left: 0,
  right: 300,
  bottom: 8,
  x: 0,
  y: 0,
  toJSON() {
    return {};
  },
} as DOMRect;

function makeFakeCtx() {
  const strokeStyles: string[] = [];
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    strokeStyle: "",
    lineWidth: 0,
    stroke: vi.fn(function (this: { strokeStyle: string }) {
      strokeStyles.push(this.strokeStyle);
    }),
  };
  return { ctx, strokeStyles };
}

function alphaOf(rgba: string): number {
  const m = /rgba\([^,]+,[^,]+,[^,]+,([\d.]+)\)/.exec(rgba);
  return m ? Number.parseFloat(m[1]) : NaN;
}

// jsdom's getComputedStyle does not compute custom-property *inheritance*
// across elements (verified directly: setting --tc-primary-rgb via inline
// style on document.documentElement and reading it back via
// getComputedStyle() on a descendant returns "", even though real browsers
// inherit it down to the canvas exactly as ticker.tsx's readPrimaryRgb()
// relies on). Stubbing getComputedStyle directly gives precise, real-DOM-
// independent control over what "the CSS says" for this test.
function stubComputedPrimaryRgb(getRgb: () => string) {
  return vi.spyOn(window, "getComputedStyle").mockImplementation(
    () =>
      ({
        getPropertyValue: (prop: string) =>
          prop === "--tc-primary-rgb" ? getRgb() : "",
      }) as CSSStyleDeclaration,
  );
}

describe("Ticker / TickerCanvas", () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
      FAKE_RECT,
    );
    Object.defineProperty(window, "devicePixelRatio", {
      value: 1,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.scheme;
    delete document.documentElement.dataset.theme;
    vi.restoreAllMocks();
  });

  it("re-reads --tc-primary-rgb on a data-scheme-only mutation (no data-theme change)", async () => {
    // Regression lock for the audit finding: the old bespoke MutationObserver
    // only watched data-theme, so a scheme flip with no narrative-theme
    // change left the cached RGB stale. The shared useAttributeObserver hook
    // now watches both.
    let rgb = "1,2,3";
    stubComputedPrimaryRgb(() => rgb);
    const { ctx, strokeStyles } = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx as any,
    );

    render(<Ticker />);
    await waitFor(() =>
      expect(strokeStyles.some((s) => s.includes("1,2,3"))).toBe(true),
    );

    rgb = "9,9,9";
    document.documentElement.dataset.scheme = "light";

    await waitFor(() =>
      expect(strokeStyles.some((s) => s.includes("9,9,9"))).toBe(true),
    );
  });

  it("boosts streak alpha ×2.5 in light scheme and leaves dark untouched", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deterministic alpha: 0.06 + 0*0.12

    const dark = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dark.ctx as any,
    );
    const darkRender = render(<Ticker />);
    await waitFor(() => expect(dark.strokeStyles.length).toBeGreaterThan(0));
    const darkAlpha = alphaOf(dark.strokeStyles[0]);
    darkRender.unmount();

    document.documentElement.dataset.scheme = "light";
    const light = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      light.ctx as any,
    );
    render(<Ticker />);
    await waitFor(() => expect(light.strokeStyles.length).toBeGreaterThan(0));
    const lightAlpha = alphaOf(light.strokeStyles[0]);

    expect(darkAlpha).toBeCloseTo(0.06, 5);
    expect(lightAlpha).toBeCloseTo(0.06 * 2.5, 5);
  });
});
