"use client";

import { SceneCanvas } from "@tensorcraft/ui/effects";
// Subpath, not the barrel: @tensorcraft/ui's index pulls in the MDX lesson
// components and with them sandpack + @stitches, which a decorative backdrop
// has no business loading (and which cannot evaluate under jsdom). Same
// reason ./character-avatar has its own entry.
import { ArtPlate } from "@tensorcraft/ui/art-plate";
// Client boundary for server pages: a draw function can't cross the RSC
// serialization line, so server components pass a slug and this component
// resolves the renderer on the client side (shared map, lib/scene-by-slug).
import { SCENE_BY_SLUG, hexToRgb } from "@/lib/scene-by-slug";

interface Props {
  slug: string;
  /** World primary as hex, e.g. "#6BAA8A". */
  primary: string;
  /**
   * World primary for light scheme, e.g. "#4A8064" (world.paletteLight.primary).
   * Falls back to `primary` when absent (SceneCanvas.rgbLight default).
   */
  primaryLight?: string;
  /** Resting brightness of the scene (see SceneCanvas.intensity). */
  intensity?: number;
  /**
   * Location master plate for a world that has art (see lib/location-art.ts).
   * Absent for the four unlaunched worlds, which then render exactly as they
   * did before the art existed.
   */
  plateSrc?: string;
}

/**
 * The world's signature scene as a page backdrop, capped to the first
 * viewport with a bottom fade-out mask. The cap matters on long pages:
 * SceneCanvas sizes to its parent, and an uncapped inset-0 wrapper on a
 * scrolling page would stretch one scene (and its per-frame cost) across
 * thousands of pixels. Decorative only - aria-hidden, static frame under
 * reduced motion.
 */
export function WorldSceneBackdrop({
  slug,
  primary,
  primaryLight,
  intensity = 0.7,
  plateSrc,
}: Props) {
  const draw = SCENE_BY_SLUG[slug];
  if (!draw && !plateSrc) return null;

  return (
    <div
      data-testid={`world-scene-backdrop-${slug}`}
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-screen z-0 pointer-events-none"
      style={{
        maskImage: "linear-gradient(180deg, black 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, black 55%, transparent 100%)",
      }}
    >
      {plateSrc && (
        <ArtPlate src={plateSrc} bleed className="absolute inset-0" />
      )}
      {draw && (
        <SceneCanvas
          draw={draw}
          rgb={hexToRgb(primary)}
          // Over a plate the backdrop is a dark viewport in both schemes, so
          // the canvas keeps its dark hue: the light hue was minted for a
          // paper background and all but vanishes on near-black art.
          rgbLight={
            plateSrc
              ? hexToRgb(primary)
              : primaryLight
                ? hexToRgb(primaryLight)
                : undefined
          }
          intensity={intensity}
          // Over a plate the canvas is the reflection on the glass, not the
          // scene itself. SceneCanvasProps exposes className but NOT style,
          // so the dimming rides a utility class; do not add a `style` prop
          // to SceneCanvas for this.
          className={`absolute inset-0${plateSrc ? " opacity-50" : ""}`}
        />
      )}
    </div>
  );
}
