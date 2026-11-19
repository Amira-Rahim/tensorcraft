import type { WorldManifest } from "@tensorcraft/worlds";
import type { WorldTrailer } from "@/lib/world-trailer";

const SITE = "https://tensorcraft.app";

/**
 * VideoObject for a world's own trailer, a standalone block beside the
 * Course JSON-LD (extracted for the same testability reason as
 * course-jsonld.ts). This is a different film from /learn's trailer, with
 * its own contentUrl. The course page describes this secondary trailer,
 * while the video sitemap lists /learn as the primary watch destination.
 *
 * Plain-language description: search snippets reach strangers with no
 * story framing, so the story hook stays off structured data (owner bar
 * 2026-08-16).
 */
export function buildWorldVideoJsonLd(
  world: WorldManifest,
  trailer: WorldTrailer,
) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject" as const,
    name: `${world.displayName} course trailer`,
    description: `The ${trailer.durationSeconds}-second trailer for ${world.displayName}, a story-driven machine learning course in JavaScript taught in the browser with TensorFlow.js. Module 1 is free.`,
    thumbnailUrl: [`${SITE}${trailer.poster}`],
    contentUrl: `${SITE}${trailer.full}`,
    uploadDate: trailer.uploadDate,
    duration: trailer.durationIso,
  };
}
