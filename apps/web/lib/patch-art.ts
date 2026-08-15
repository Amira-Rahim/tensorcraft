/* Mission-patch and seal resolution (docs/patch-bible.md). Lives app-side
   for the same reason character-art.ts and location-art.ts do: packages/ui
   is deliberately manifest-blind, components take srcs, and the asset-path
   convention stays here in one place.

   Assets ship via `node scripts/art/ingest.mjs patches` / `... seals`; the
   all-or-none coverage gate in packages/content keeps a partial set from
   shipping silently. */

/** Worlds with shipped patch art. An unknown world resolves to undefined
 *  and every consumer keeps its art-less render, the same typo defence the
 *  other resolvers apply. Callers pass module slugs they already validated
 *  against the content tree (getModules / the dashboard's module list). */
const PATCH_WORLDS = new Set(["deep-orbit"]);

export function patchSrc(
  worldSlug: string,
  moduleSlug: string,
): string | undefined {
  return PATCH_WORLDS.has(worldSlug)
    ? `/patches/${worldSlug}/${moduleSlug}.webp`
    : undefined;
}

export function sealSrc(worldSlug: string): string | undefined {
  return PATCH_WORLDS.has(worldSlug) ? `/seals/${worldSlug}.webp` : undefined;
}
