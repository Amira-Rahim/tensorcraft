"use client";

import {
  SceneCanvas,
  drawOrbit,
  drawNeonProtocol,
  drawSignalWard,
  drawNovaCanvas,
  drawTerraGrid,
  type SceneDraw,
} from "@tensorcraft/ui/effects";

// Client boundary for server pages: a draw function can't cross the RSC
// serialization line, so server components pass a slug and this component
// resolves the renderer on the client side.
const SCENE_BY_SLUG: Record<string, SceneDraw> = {
  "deep-orbit": drawOrbit,
  "neon-protocol": drawNeonProtocol,
  "signal-ward": drawSignalWard,
  "nova-canvas": drawNovaCanvas,
  "terra-grid": drawTerraGrid,
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

interface Props {
  slug: string;
  /** Theme primary as hex, e.g. "#6BAA8A". */
  primary: string;
  /**
   * Theme primary for light scheme, e.g. "#4A8064" (theme.paletteLight.primary).
   * Falls back to `primary` when absent (SceneCanvas.rgbLight default).
   */
  primaryLight?: string;
  /** Resting brightness of the scene (see SceneCanvas.intensity). */
  intensity?: number;
}

/**
 * The theme's signature scene as a page backdrop, capped to the first
 * viewport with a bottom fade-out mask. The cap matters on long pages:
 * SceneCanvas sizes to its parent, and an uncapped inset-0 wrapper on a
 * scrolling page would stretch one scene (and its per-frame cost) across
 * thousands of pixels. Decorative only — aria-hidden, static frame under
 * reduced motion.
 */
export function ThemeSceneBackdrop({
  slug,
  primary,
  primaryLight,
  intensity = 0.7,
}: Props) {
  const draw = SCENE_BY_SLUG[slug];
  if (!draw) return null;

  return (
    <div
      data-testid={`theme-scene-backdrop-${slug}`}
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-screen z-0 pointer-events-none"
      style={{
        maskImage: "linear-gradient(180deg, black 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, black 55%, transparent 100%)",
      }}
    >
      <SceneCanvas
        draw={draw}
        rgb={hexToRgb(primary)}
        rgbLight={primaryLight ? hexToRgb(primaryLight) : undefined}
        intensity={intensity}
        className="absolute inset-0"
      />
    </div>
  );
}
