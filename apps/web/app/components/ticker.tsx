"use client";

import { useEffect, useRef, useCallback } from "react";

/* ── Ticker canvas, subtle horizontal streaks ──────────── */

function TickerCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  const primaryRgb = useRef("107,170,138");

  interface Streak {
    x: number;
    y: number;
    len: number;
    speed: number;
    alpha: number;
  }

  const streaks = useRef<Streak[]>([]);

  const spawn = useCallback(
    (w: number, h: number): Streak => ({
      x: -20 - Math.random() * 60,
      y: Math.random() * h,
      len: 15 + Math.random() * 40,
      speed: 0.4 + Math.random() * 0.8,
      alpha: 0.06 + Math.random() * 0.12,
    }),
    [],
  );

  const draw = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;

    ctx.clearRect(0, 0, w, h);

    const ss = streaks.current;
    for (let i = ss.length - 1; i >= 0; i--) {
      const s = ss[i];
      s.x += s.speed;

      if (s.x > w + 20) {
        ss[i] = spawn(w, h);
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y);
      ctx.strokeStyle = `rgba(${primaryRgb.current},${s.alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    frame.current = requestAnimationFrame(draw);
  }, [spawn]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const resize = () => {
      const parent = c.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      c.style.width = rect.width + "px";
      c.style.height = rect.height + "px";
      streaks.current = Array.from({ length: 12 }, () =>
        spawn(c.width, c.height),
      );
    };

    resize();

    // Read theme primary RGB from CSS variable
    const readPrimaryRgb = () => {
      const rgb = getComputedStyle(c)
        .getPropertyValue("--tc-primary-rgb")
        .trim();
      if (rgb) primaryRgb.current = rgb;
    };
    readPrimaryRgb();

    // Re-read when theme changes (data-theme attribute on <html>)
    const observer = new MutationObserver(readPrimaryRgb);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    frame.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [draw, spawn]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ── Ticker component ──────────────────────────────────── */

const TICKER_ITEMS = [
  "useState() → Model Weights",
  "Event Propagation → Forward Pass",
  "Array.map() → Tensor Operation",
  "React diff → Loss Function  L = Σ(y−ŷ)²",
  "transition-duration → Learning Rate  η",
  "CSS clamp() → σ(x) Activation",
  "Re-render cycle → Training Epoch",
  "Event bubbling → Backpropagation  ∂L/∂w",
  "useCallback → Gradient Caching",
  "Promise.all() → Batch Inference",
  "Redux store → Weight Matrix",
  "DevTools profiler → Loss Landscape",
];

export function Ticker() {
  return (
    <div className="h-8 bg-surface-raised border-b border-border flex items-center overflow-hidden sticky top-15 z-49">
      <TickerCanvas />
      <div className="shrink-0 px-4 h-full flex items-center border-r border-border bg-surface z-2 relative">
        <span className="font-mono text-xs font-bold text-primary tracking-[0.14em] uppercase whitespace-nowrap">
          bridge system
        </span>
      </div>
      <div className="flex-1 overflow-hidden flex items-center relative z-1">
        <div className="flex items-center whitespace-nowrap ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => {
            const parts = item.split("→");
            return (
              <span key={i} className="inline-flex items-center gap-0">
                <span className="font-mono text-xs text-text-primary pl-8">
                  {parts[0].trim()}
                </span>
                <span className="font-mono text-xs text-primary px-2">→</span>
                <span className="font-mono text-xs text-primary">
                  {parts[1]?.trim()}
                </span>
                <span className="text-border ml-8 text-base opacity-40">·</span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-15 bg-gradient-to-r from-transparent to-surface-raised pointer-events-none z-3" />
    </div>
  );
}
