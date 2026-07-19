"use client";

import { useState } from "react";
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
  /** In-world status line for the feed's caption bar. */
  status: string;
}

/**
 * In-world "monitor" frame for the coming-soon hero: the theme's signature
 * scene behind a caption bar carrying the status-board line. Hover ignites
 * the scene via SceneCanvas's eased hot amount, matching the theme cards.
 */
export function ComingSoonScene({ slug, palette, status }: Props) {
  const [hovered, setHovered] = useState(false);
  const draw = SCENE_BY_SLUG[slug];
  if (!draw) return null;

  return (
    <figure
      data-testid={`coming-soon-scene-${slug}`}
      className="flex flex-col border-2 rounded-none h-64 lg:h-auto lg:self-stretch"
      style={{ borderColor: palette.border, background: palette.surface }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <figcaption
        className="flex items-center justify-between gap-3 px-4 py-2 border-b font-mono text-[11px] uppercase tracking-[0.15em]"
        style={{ borderColor: palette.border, color: palette.accent }}
      >
        <span>{status}</span>
        <span
          aria-hidden="true"
          className="animate-pulse"
          style={{ color: palette.primary }}
        >
          ●
        </span>
      </figcaption>
      <div className="relative flex-1">
        <SceneCanvas
          draw={draw}
          rgb={hexToRgb(palette.primary)}
          hovered={hovered}
          className="absolute inset-0"
        />
      </div>
    </figure>
  );
}
