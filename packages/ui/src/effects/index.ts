/**
 * Animated decorative effects (client-side only).
 *
 * Performance contract (Phase 6c §6c):
 *   - Max 3 simultaneous active animations per viewport. Each effect uses
 *     `IntersectionObserver` to pause/stop when its container scrolls out
 *     of view, so even if more than 3 are mounted on a page only the
 *     visible ones run RAF loops.
 *   - All effects check `prefers-reduced-motion: reduce` and render a
 *     static fallback (no RAF, no transform animation) when the user has
 *     opted out.
 *   - Canvas fills derive from CSS variables (`var(--tc-primary)`,
 *     `var(--tc-muted)`) so the world system works without extra props.
 *
 * If you add a new effect here, keep the same contract:
 *   1. Respect `prefers-reduced-motion`.
 *   2. Gate expensive work (RAF, timers) on IntersectionObserver.
 *   3. Export a minimal, themable prop surface.
 */
export { ParticleField } from "./particle-field";
export type { ParticleFieldProps } from "./particle-field";
export { BridgeTicker } from "./bridge-ticker";
export type { BridgeTickerProps, BridgeItem } from "./bridge-ticker";
export { OrbitCanvas, drawOrbit } from "./orbit-canvas";
export type { OrbitCanvasProps } from "./orbit-canvas";
export { SceneCanvas } from "./scene-canvas";
export type { SceneCanvasProps, SceneDraw } from "./scene-canvas";
export {
  drawNeonProtocol,
  drawSignalWard,
  drawNovaCanvas,
  drawTerraGrid,
} from "./world-scenes";
