"use client";

import { useRef, useEffect, useCallback } from "react";

/* ── SceneCanvas: shared chrome for theme scene renderers ──────────
   All the plumbing OrbitCanvas pioneered, generalized over a draw
   function so every themed scene (orbit, neon, ward, nova, terra)
   inherits the same guarantees from one place:

   - Own animation clock (tRef) advanced per frame with a clamped dt,
     so a background-tab pause never fast-forwards the scene.
   - Hover eases a continuous 0..1 `hot` amount (~160ms tau) and speeds
     the clock's *future* time only. Positions inside a SceneDraw must
     be pure functions of t; `hot` may only affect styling. Feeding hot
     into position math would rescale elapsed time and teleport the
     scene when hover flips (see orbit-canvas hover-continuity test).
   - rAF gated on IntersectionObserver + prefers-reduced-motion, per
     the effects performance contract (see effects/index.ts). Reduced
     motion renders one static frame at the current t.
   - DPR capped at 2; canvas sizes to its positioned parent. */

/** Pure scene renderer: positions derive from t only; hot styles only. */
export type SceneDraw = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rgb: [number, number, number],
  hot: number,
  t: number,
) => void;

export interface SceneCanvasProps {
  /** Time-parameterized renderer for one frame of the scene. */
  draw: SceneDraw;
  /** Theme colour as an [r,g,b] triple (0–255). */
  rgb: [number, number, number];
  /** Speeds/brightens the scene (hover state on the homepage cards). */
  hovered?: boolean;
  /**
   * Resting floor (0..1) for the eased hover amount. Scenes are designed
   * rest-faint + hover-ignited for cards; a page backdrop has no hover, so
   * without a floor it idles at its faintest forever. The effective target
   * is max(intensity, hovered ? 1 : 0) — hover can still push past the floor.
   */
  intensity?: number;
  className?: string;
}

/**
 * Self-contained scene canvas. Sizes to its positioned parent, gates the
 * rAF loop on visibility + reduced-motion (static frame when reduced), and
 * cleans up on unmount. Decorative only — always `aria-hidden`.
 */
export function SceneCanvas({
  draw,
  rgb,
  hovered = false,
  intensity = 0,
  className,
}: SceneCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  const hovRef = useRef(hovered);
  hovRef.current = hovered;
  const floorRef = useRef(intensity);
  floorRef.current = intensity;
  const runningRef = useRef(false);
  const tRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const hotAmtRef = useRef(0);

  const render = useCallback(
    (now?: number) => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      // Clamp dt so a background-tab pause doesn't fast-forward the scene.
      const dt =
        now == null || lastRef.current == null
          ? 0
          : Math.min(now - lastRef.current, 100);
      if (now != null) lastRef.current = now;
      const target = Math.max(floorRef.current, hovRef.current ? 1 : 0);
      // Frame-rate-independent easing toward the hover state (~160ms tau).
      hotAmtRef.current +=
        (target - hotAmtRef.current) * (1 - Math.exp(-dt / 160));
      tRef.current += (dt / 1000) * (1 + 0.6 * hotAmtRef.current);
      ctx.clearRect(0, 0, c.width, c.height);
      draw(ctx, c.width, c.height, rgb, hotAmtRef.current, tRef.current);
      if (runningRef.current) frame.current = requestAnimationFrame(render);
    },
    [draw, rgb],
  );

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const resize = () => {
      const rect = c.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      c.style.width = rect.width + "px";
      c.style.height = rect.height + "px";
    };

    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let inView = true;

    const stop = () => {
      runningRef.current = false;
      cancelAnimationFrame(frame.current);
      // Drop the clock anchor so time doesn't leap on resume after a pause.
      lastRef.current = null;
    };
    const sync = () => {
      const reduced = !!mql?.matches;
      if (reduced || !inView) {
        stop();
        // Reduced motion still deserves the atmosphere, one static frame.
        if (reduced && inView) render();
        return;
      }
      if (!runningRef.current) {
        runningRef.current = true;
        frame.current = requestAnimationFrame(render);
      }
    };

    const onResize = () => {
      resize();
      // Keep the static frame correct after a resize when not animating.
      if (mql?.matches && inView) render();
    };

    resize();
    sync();
    window.addEventListener("resize", onResize);
    mql?.addEventListener?.("change", sync);

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              inView = entry.isIntersecting;
              sync();
            },
            { rootMargin: "120px" },
          )
        : null;
    io?.observe(c);

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      mql?.removeEventListener?.("change", sync);
      io?.disconnect();
    };
  }, [render]);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
