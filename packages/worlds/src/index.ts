export type {
  WorldManifest,
  WorldPalette,
  WorldTerminology,
  WorldCharacter,
  WorldPreview,
  WorldPreviewModule,
} from "./types";

export {
  hexToRgb,
  hexToRgbTriplet,
  srgbChannelToLinear,
  relativeLuminance,
  contrastRatio,
} from "./wcag";

export { deepOrbit } from "./deep-orbit";
export { neonProtocol } from "./neon-protocol";
export { signalWard } from "./signal-ward";
export { novaCanvas } from "./nova-canvas";
export { terraGrid } from "./terra-grid";

import { deepOrbit } from "./deep-orbit";
import { neonProtocol } from "./neon-protocol";
import { signalWard } from "./signal-ward";
import { novaCanvas } from "./nova-canvas";
import { terraGrid } from "./terra-grid";
import type { WorldManifest } from "./types";

/** All available worlds indexed by slug */
export const worlds: Record<string, WorldManifest> = {
  "deep-orbit": deepOrbit,
  "neon-protocol": neonProtocol,
  "signal-ward": signalWard,
  "nova-canvas": novaCanvas,
  "terra-grid": terraGrid,
};

/** World slug literals, derived from the worlds record (single source of truth) */
export const worldSlugs = Object.keys(worlds) as (keyof typeof worlds)[];

export type WorldSlug = keyof typeof worlds;
