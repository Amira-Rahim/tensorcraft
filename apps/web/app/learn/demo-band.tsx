"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// ssr:false for the same reason as landing-hero.tsx: tfjs is browser-only
// and the panel is an enhancement, not critical path.
const DeepScanDemo = dynamic(
  () =>
    import("@/app/components/mdx/deep-scan-demo").then((m) => m.DeepScanDemo),
  { ssr: false },
);

const HEADER_LABEL = "LIVE DEMO · running in your tab";

/**
 * IntersectionObserver-gated mount of the live Deep Scan demo on /learn.
 *
 * The gate is the page's script budget: /learn is Lighthouse-audited on
 * every PR, and the tfjs chunks (~300-400 KB) would eat most of the 800 KB
 * budget if they loaded with the page. Lighthouse never scrolls, so nothing
 * TFJS-shaped enters the measured load; a real visitor pays for it only when
 * the band approaches the viewport (rootMargin 200px, curriculum-scene
 * precedent).
 *
 * Without IntersectionObserver (jsdom) the placeholder stays put and the
 * demo never mounts: here the deferred payload is tfjs, not a canvas, so
 * the arm-now fallback curriculum-scene uses would defeat the gate.
 *
 * The wrapper reserves the demo's settled height so the placeholder -> demo
 * swap and the staggered row reveal never shift the layout below the band.
 */
export function DemoBand() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      data-testid="learn-demo-band"
      className="max-w-[560px] min-h-[352px] brutalist-shadow [&_[data-testid=deep-scan-demo]]:my-0"
    >
      {mounted ? (
        <DeepScanDemo framing headerLabel={HEADER_LABEL} />
      ) : (
        // Static stand-in wearing the demo's own terminal chrome, so the
        // mount swaps content inside an already-reserved, identical frame.
        <div
          data-testid="learn-demo-placeholder"
          className="border border-border bg-code-bg font-mono text-[13px] min-h-[352px]"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface">
            <span className="w-2 h-2 inline-block bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              {HEADER_LABEL}
            </span>
          </div>
          <div className="p-4">
            <p className="text-text-muted">
              loading model (4 KB) into your browser…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
