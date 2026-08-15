"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
// Subpath, not the barrel: same sandpack/jsdom rationale as
// world-scene-backdrop.tsx.
import {
  SceneCanvas,
  drawOrbit,
  drawSignalLock,
} from "@tensorcraft/ui/effects";

const SEEN_KEY = "tc_curriculum_boot_seen";

// Any storage read failure counts as seen: when in doubt this section
// shows the list instantly, because it exists to convert (spec, gating).
const seenBoot = (): boolean => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
};

const markSeen = (): void => {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // A failed write only means a replay on the next visit.
  }
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const EDGE_MASK: CSSProperties = {
  maskImage:
    "linear-gradient(180deg, transparent 0%, black 12%, black 88%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(180deg, transparent 0%, black 12%, black 88%, transparent 100%)",
};

interface Props {
  /** World primary as hex (world.palette.primary). */
  primary: string;
  /**
   * World primary for light scheme (world.paletteLight.primary).
   * Optional with fallback to `primary`, mirroring WorldSceneBackdrop's
   * `primaryLight?`: SceneCanvas keeps drawing the dark hue when absent,
   * and callers (including test mocks of @tensorcraft/worlds that predate
   * paletteLight) stay valid.
   */
  primaryLight?: string;
  children: ReactNode;
}

/**
 * Signal-lock scene around the curriculum module list. Mode resolves
 * client-side after mount (settled for return visits, reduced motion, or
 * unreadable storage; boot otherwise), so server HTML and the hydration
 * frame are identical and rows are never hidden without JavaScript. The
 * wrapper's own IntersectionObserver is the single boot-start moment: it
 * arms [data-boot] (the CSS row flicker in globals.css) and writes the
 * once-ever flag. Its rootMargin matches SceneCanvas's 120px so both
 * observers release on the same scroll position.
 */
export function CurriculumScene({ primary, primaryLight, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"boot" | "settled" | null>(null);
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    const reduced = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")
      ?.matches;
    if (reduced || seenBoot()) {
      setMode("settled");
      return;
    }
    setMode("boot");
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // No observer means no entry moment: arm now rather than never play.
      setBooting(true);
      markSeen();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setBooting(true);
        markSeen();
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      data-boot={booting ? "" : undefined}
      // Resolved mode for tests and e2e debugging: the draw-function choice
      // is otherwise unobservable to automation.
      data-mode={mode ?? undefined}
      data-testid="curriculum-scene"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none"
        style={EDGE_MASK}
      >
        {mode && (
          <SceneCanvas
            draw={mode === "boot" ? drawSignalLock : drawOrbit}
            rgb={hexToRgb(primary)}
            rgbLight={primaryLight ? hexToRgb(primaryLight) : undefined}
            intensity={0.45}
            className="absolute inset-0"
          />
        )}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
