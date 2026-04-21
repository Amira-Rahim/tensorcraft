import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { ParticleField } from "./particle-field";

type MediaQueryListener = (ev: { matches: boolean }) => void;

function mockMatchMedia(matches: boolean) {
  const listeners: MediaQueryListener[] = [];
  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: (_: string, cb: MediaQueryListener) => {
      listeners.push(cb);
    },
    removeEventListener: (_: string, cb: MediaQueryListener) => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    addListener: (cb: MediaQueryListener) => listeners.push(cb),
    removeListener: (cb: MediaQueryListener) => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(() => mql),
  });
  return mql;
}

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  static instances: MockIntersectionObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "";
  thresholds = [];
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
}

class MockResizeObserver {
  callback: ResizeObserverCallback;
  static instances: MockResizeObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    MockResizeObserver.instances.push(this);
  }
}

describe("ParticleField", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    MockResizeObserver.instances = [];
    // @ts-expect-error jsdom shim
    globalThis.IntersectionObserver = MockIntersectionObserver;
    // @ts-expect-error jsdom shim
    globalThis.ResizeObserver = MockResizeObserver;
    mockMatchMedia(false);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 42);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a decorative canvas with aria-hidden and role=presentation", () => {
    const { container } = render(<ParticleField />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    expect(canvas?.getAttribute("role")).toBe("presentation");
  });

  it("does not start animation when prefers-reduced-motion is set", () => {
    mockMatchMedia(true);
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    render(<ParticleField />);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("uses var(--tc-primary) as the default color token", () => {
    const { container } = render(<ParticleField />);
    const canvas = container.querySelector("canvas");
    // Default token is exposed via data-* attr for testability.
    expect(canvas?.getAttribute("data-color-token")).toBe("var(--tc-primary)");
  });

  it("accepts a custom colorToken prop", () => {
    const { container } = render(
      <ParticleField colorToken="var(--tc-accent)" />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas?.getAttribute("data-color-token")).toBe("var(--tc-accent)");
  });

  it("cleans up rAF + observers on unmount", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(<ParticleField />);
    const ioInstance = MockIntersectionObserver.instances[0];
    const roInstance = MockResizeObserver.instances[0];
    unmount();
    expect(ioInstance.disconnect).toHaveBeenCalled();
    expect(roInstance.disconnect).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
