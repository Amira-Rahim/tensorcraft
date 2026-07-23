import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import { SceneCanvas, type SceneDraw } from "./scene-canvas";

/* SceneCanvas's rAF loop reads `document.documentElement.dataset.scheme`
   every frame (scene-canvas.tsx), so an ANIMATING scene always picks up a
   scheme flip on its very next frame with no extra plumbing. The reduced-
   motion path is the one that needs help: it draws exactly one static frame
   at mount/resize and never loops, so without the MutationObserver added in
   this task, that frame would go stale the instant a visitor toggles scheme
   (or the OS scheme changes) while sitting on a reduced-motion page. */

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

// jsdom has no real canvas backend in this repo (no `canvas` npm package),
// so the real `getContext("2d")` returns null and SceneCanvas's render()
// bails before calling `draw` at all (see the `if (!ctx) return;` guard).
// Stub it so render() proceeds far enough to invoke `draw` with real args.
const fakeCtx = { clearRect: vi.fn() } as unknown as CanvasRenderingContext2D;

const RGB: [number, number, number] = [10, 20, 30];
const RGB_LIGHT: [number, number, number] = [200, 210, 220];

describe("SceneCanvas reduced-motion static frame", () => {
  beforeEach(() => {
    mockMatchMedia(true); // prefers-reduced-motion: reduce → static-frame path
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fakeCtx as any,
    );
  });

  afterEach(() => {
    // Order matters: `cleanup()` unmounts the rendered tree FIRST, which
    // disconnects each SceneCanvas's attribute MutationObserver via its
    // effect cleanup. Only then is it safe to clear the shared
    // data-scheme/data-theme attrs — doing that first (while a describe-
    // scoped afterEach still races RTL's own module-level afterEach, which
    // runs its cleanup() *after* this one) would itself be an observed
    // mutation, queuing one more `render()` microtask against an
    // already-unmounted-but-not-yet-disconnected observer, right as
    // `vi.restoreAllMocks()` below un-mocks getContext — producing a real
    // (if harmless) jsdom "Not implemented" console warning after the test
    // already finished. Caught via a debug repro during this task; not a
    // product bug (the "disconnects on unmount" test below confirms the
    // real observer teardown is correct) — purely this file's hook order.
    cleanup();
    delete document.documentElement.dataset.scheme;
    delete document.documentElement.dataset.theme;
    vi.restoreAllMocks();
  });

  it("renders a decorative, aria-hidden canvas", () => {
    const draw = vi.fn();
    const { container } = render(
      <SceneCanvas draw={draw as unknown as SceneDraw} rgb={RGB} />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws once at mount with the dark rgb + scheme", async () => {
    const draw = vi.fn();
    render(
      <SceneCanvas
        draw={draw as unknown as SceneDraw}
        rgb={RGB}
        rgbLight={RGB_LIGHT}
      />,
    );

    await waitFor(() => expect(draw).toHaveBeenCalled());
    const [, , , rgbArg, , , schemeArg] = draw.mock.calls.at(-1)!;
    expect(schemeArg).toBe("dark");
    expect(rgbArg).toEqual(RGB);
  });

  it('re-renders with rgbLight + "light" when data-scheme mutates, with no stale frame', async () => {
    const draw = vi.fn();
    render(
      <SceneCanvas
        draw={draw as unknown as SceneDraw}
        rgb={RGB}
        rgbLight={RGB_LIGHT}
      />,
    );
    await waitFor(() => expect(draw).toHaveBeenCalled());
    draw.mockClear();

    // MutationObserver callbacks fire as a microtask — how many ticks isn't
    // a contract this test controls. A synchronous `act(() => { mutate })`
    // wrap around this line is decorative (the observer hasn't fired yet
    // when act's callback returns) and a one-shot `await act(async () => {
    // mutate; await Promise.resolve(); })` is a RACE, not a fix — it
    // intermittently threw a real "not wrapped in act" warning under this
    // same pattern for use-scheme.ts's own tests (see that file's history
    // and docs/superpowers/plans/2026-07-22-light-mode.md's Task 8 forward
    // warning). Plain mutation + `waitFor` is correct: its internal
    // asyncWrapper keeps an act() window open across however many ticks the
    // observer actually needs.
    document.documentElement.dataset.scheme = "light";

    await waitFor(() => expect(draw).toHaveBeenCalled());
    const [, , , rgbArg, , , schemeArg] = draw.mock.calls.at(-1)!;
    expect(schemeArg).toBe("light");
    expect(rgbArg).toEqual(RGB_LIGHT);
  });

  it("falls back to rgb (not stale) when data-scheme flips light but rgbLight is absent", async () => {
    const draw = vi.fn();
    render(<SceneCanvas draw={draw as unknown as SceneDraw} rgb={RGB} />);
    await waitFor(() => expect(draw).toHaveBeenCalled());
    draw.mockClear();

    document.documentElement.dataset.scheme = "light";

    await waitFor(() => expect(draw).toHaveBeenCalled());
    const [, , , rgbArg, , , schemeArg] = draw.mock.calls.at(-1)!;
    expect(schemeArg).toBe("light");
    expect(rgbArg).toEqual(RGB);
  });

  it("re-renders when data-theme mutates too (cross-theme card colors change)", async () => {
    const draw = vi.fn();
    render(<SceneCanvas draw={draw as unknown as SceneDraw} rgb={RGB} />);
    await waitFor(() => expect(draw).toHaveBeenCalled());
    draw.mockClear();

    document.documentElement.dataset.theme = "neon-protocol";

    await waitFor(() => expect(draw).toHaveBeenCalled());
  });

  it("disconnects the attribute MutationObserver on unmount", () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
    const draw = vi.fn();
    const { unmount } = render(
      <SceneCanvas draw={draw as unknown as SceneDraw} rgb={RGB} />,
    );
    unmount();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
