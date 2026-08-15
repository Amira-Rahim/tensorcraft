import {
  drawOrbit,
  drawNeonProtocol,
  drawSignalWard,
  drawNovaCanvas,
  drawTerraGrid,
  type SceneDraw,
} from "@tensorcraft/ui/effects";

/**
 * Signature scene renderer per world - the single map for surfaces that
 * give every world (deep-orbit included) its motion identity: the /worlds
 * cards, the per-world backdrop, the journey ring.
 *
 * Two surfaces keep their own deep-orbit-LESS maps on purpose and must not
 * switch to this one: the homepage five-worlds strip (deep-orbit renders
 * the flagship OrbitCanvas band there, keyed off the map returning
 * undefined) and the coming-soon stub (deep-orbit is live and never
 * renders it).
 */
export const SCENE_BY_SLUG: Record<string, SceneDraw> = {
  "deep-orbit": drawOrbit,
  "neon-protocol": drawNeonProtocol,
  "signal-ward": drawSignalWard,
  "nova-canvas": drawNovaCanvas,
  "terra-grid": drawTerraGrid,
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
