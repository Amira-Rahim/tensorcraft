"use client";

import { SceneCanvas, drawOrbit } from "@tensorcraft/ui/effects";
// Subpath, not the barrel: @tensorcraft/ui's index pulls in the MDX lesson
// components and with them sandpack, which this page must not ship.
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { worlds } from "@tensorcraft/worlds";
import { heroPlateSrc } from "@/lib/location-art";
import { hexToRgb } from "@/lib/scene-by-slug";

const DEEP_ORBIT = worlds["deep-orbit"];
const RGB = hexToRgb(DEEP_ORBIT.palette.primary);
const RGB_LIGHT = hexToRgb(DEEP_ORBIT.paletteLight.primary);
const PLATE_SRC = heroPlateSrc("deep-orbit");

/**
 * Decoration stack for the /learn hero: the bridge location plate as the
 * ground, the orbit scene as the reflection on the glass, and the
 * reading-column scrim banking ink behind the copy. Layering is the
 * five-worlds flagship band's (five-worlds-section.tsx); the copy itself
 * stays server JSX in page.tsx, this island is decoration only.
 *
 * SceneCanvas instead of OrbitCanvas because a page hero has no hover to
 * ignite it: `intensity` sets the resting brightness (coming-soon-scene.tsx
 * precedent). Every layer is decorative and hidden from the tree.
 */
export function LearnHeroScene() {
  return (
    <>
      {PLATE_SRC && (
        <ArtPlate src={PLATE_SRC} bleed className="absolute inset-0 z-0" />
      )}
      <SceneCanvas
        draw={drawOrbit}
        rgb={RGB}
        // Over a plate the band is a dark viewport in both schemes, so the
        // canvas keeps its dark hue; the light hue was minted for paper and
        // all but vanishes on the near-black art (five-worlds precedent).
        rgbLight={PLATE_SRC ? RGB : RGB_LIGHT}
        intensity={0.85}
        className={`absolute inset-0 z-1 pointer-events-none${
          PLATE_SRC ? " opacity-50" : ""
        }`}
      />
      {PLATE_SRC && (
        <div
          aria-hidden="true"
          className="tc-art-scrim tc-art-scrim-read z-2"
        />
      )}
    </>
  );
}
