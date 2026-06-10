export type {
  ThemeManifest,
  ThemePalette,
  ThemeTerminology,
  ThemeCharacter,
} from "./types";

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
import type { ThemeManifest } from "./types";

/** All available themes indexed by slug */
export const themes: Record<string, ThemeManifest> = {
  "deep-orbit": deepOrbit,
  "neon-protocol": neonProtocol,
  "signal-ward": signalWard,
  "nova-canvas": novaCanvas,
  "terra-grid": terraGrid,
};

/** Theme slug literals, derived from the themes record (single source of truth) */
export const themeSlugs = Object.keys(themes) as (keyof typeof themes)[];

export type ThemeSlug = keyof typeof themes;
