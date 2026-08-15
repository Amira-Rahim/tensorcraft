/* Location plate resolution for the marketing surfaces. Lives app-side for
   the same reason character-art.ts does: packages/ui is deliberately
   manifest-blind, so components take srcs and the asset-path convention
   (docs/scene-bible.md) stays here, in one place.

   Plates are ingested by `node scripts/art/ingest.mjs masters` to
   /locations/<world>/<location>.webp. */

/**
 * The location that stands for each world on a marketing surface. Only Deep
 * Orbit has art; the other four resolve to undefined and every consumer
 * falls back to its canvas-only render. An unknown slug resolves to
 * undefined too, so a typo can never mint a guaranteed-404 URL (the same
 * defence portraitSources() applies to expression names).
 */
const HERO_PLATE: Record<string, string> = {
  "deep-orbit": "bridge",
};

export function heroPlateSrc(worldSlug: string): string | undefined {
  const location = HERO_PLATE[worldSlug];
  return location ? `/locations/${worldSlug}/${location}.webp` : undefined;
}

export type PlateSurface = "dashboard" | "auth" | "purchase-success";

/**
 * The location that stands for each app surface, matched to what the surface
 * is: the dashboard gets the monitoring alcove it is named for, auth gets the
 * lab, the purchase receipt gets engineering. Same typo defence as
 * HERO_PLATE: an unknown world or surface resolves to undefined and the
 * consumer keeps its art-less render.
 */
const SURFACE_PLATE: Record<string, Partial<Record<PlateSurface, string>>> = {
  "deep-orbit": {
    dashboard: "dashboard-station",
    auth: "lab",
    "purchase-success": "engineering",
  },
};

export function surfacePlateSrc(
  worldSlug: string,
  surface: PlateSurface,
): string | undefined {
  const location = SURFACE_PLATE[worldSlug]?.[surface];
  return location ? `/locations/${worldSlug}/${location}.webp` : undefined;
}
