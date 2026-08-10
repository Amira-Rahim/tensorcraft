/* Location plate resolution for the marketing surfaces. Lives app-side for
   the same reason character-art.ts does: packages/ui is deliberately
   manifest-blind, so components take srcs and the asset-path convention
   (docs/scene-bible.md) stays here, in one place.

   Plates are ingested by `node scripts/art/ingest.mjs masters` to
   /locations/<theme>/<location>.webp. */

/**
 * The location that stands for each theme on a marketing surface. Only Deep
 * Orbit has art; the other four resolve to undefined and every consumer
 * falls back to its canvas-only render. An unknown slug resolves to
 * undefined too, so a typo can never mint a guaranteed-404 URL (the same
 * defence portraitSources() applies to expression names).
 */
const HERO_PLATE: Record<string, string> = {
  "deep-orbit": "bridge",
};

export function heroPlateSrc(themeSlug: string): string | undefined {
  const location = HERO_PLATE[themeSlug];
  return location ? `/locations/${themeSlug}/${location}.webp` : undefined;
}
