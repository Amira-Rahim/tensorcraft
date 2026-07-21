"use client";

import {
  SceneCanvas,
  drawNeonProtocol,
  drawSignalWard,
  drawNovaCanvas,
  drawTerraGrid,
  type SceneDraw,
} from "@tensorcraft/ui/effects";
import type { ThemePalette } from "@tensorcraft/themes";

// Signature scene per world, shared with the homepage five-worlds strip and
// the /themes cards, so a theme's motion identity follows it onto its own
// coming-soon page. Deep Orbit is live and never renders this stub.
const SCENE_BY_SLUG: Record<string, SceneDraw> = {
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
  palette: ThemePalette;
}

/**
 * Ambient hero backdrop for the coming-soon page: the theme's signature
 * scene runs full-bleed behind the status-board copy, exactly how the
 * renderers sit behind the /themes card content. A left scrim keeps the
 * copy column legible and a bottom fade seats the scene into the page.
 * Decorative only; SceneCanvas renders a static frame under reduced motion.
 */
export function ComingSoonScene({ slug, palette }: Props) {
  const draw = SCENE_BY_SLUG[slug];
  if (!draw) return null;

  return (
    <div
      data-testid={`coming-soon-scene-${slug}`}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
    >
      {/* Full intensity: a page backdrop has no hover to ignite the scene,
          so it runs at its hover-bright ceiling; the scrims below carry
          legibility instead of the scene's own rest-fade. */}
      <SceneCanvas
        draw={draw}
        rgb={hexToRgb(palette.primary)}
        intensity={0.85}
        className="absolute inset-0"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${palette.bg} 18%, color-mix(in srgb, ${palette.bg} 45%, transparent) 52%, transparent 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${palette.bg} 30%, transparent) 0%, transparent 30%, transparent 72%, ${palette.bg} 100%)`,
        }}
      />
    </div>
  );
}
