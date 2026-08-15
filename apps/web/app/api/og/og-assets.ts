/* OG derivatives of the hero plates and world seal, emitted by
   `node scripts/art/ingest.mjs og` from the SHIPPED assets under
   apps/web/public. JPEG/PNG rather than WebP: the route renders through
   satori, whose raster decoding does not dependably include WebP.

   Mirrors HERO_PLATE in apps/web/lib/location-art.ts — same one-world map,
   same typo defence (unknown world resolves to undefined, the card stays
   text-only). Kept separate because this file must stay edge-safe and
   dependency-free. */

const OG_PLATE: Record<string, string> = { "deep-orbit": "bridge" };

export function ogPlatePath(worldSlug: string): string | undefined {
  const location = OG_PLATE[worldSlug];
  return location ? `/og/${worldSlug}/${location}.jpg` : undefined;
}

export function ogSealPath(worldSlug: string): string | undefined {
  return OG_PLATE[worldSlug] ? `/og/${worldSlug}/seal.jpg` : undefined;
}
