import fs from "node:fs";
import path from "node:path";

/* Trailer asset resolution for world pages. Same contract as
   location-art.ts: only worlds listed here can resolve, an unknown slug
   returns undefined, and an fs gate keeps every page unchanged until the
   final cut actually ships to public/media/. */

const WORLD_TRAILERS: Record<
  string,
  { durationSeconds: number; uploadDate: string }
> = {
  // Deep Orbit's 88-second film. uploadDate feeds the VideoObject; bump it
  // whenever the mp4 is replaced.
  "deep-orbit": { durationSeconds: 88, uploadDate: "2026-08-29" },
};

export interface WorldTrailer {
  poster: string;
  full: string;
  durationSeconds: number;
  /** ISO-8601 for schema.org, e.g. PT1M28S. */
  durationIso: string;
  /** mm:ss for on-surface labels, e.g. 1:28. */
  durationLabel: string;
  uploadDate: string;
}

// The world page is dynamic (per-request auth), so existence is memoized
// per process instead of re-stat'ing every request. A deploy replaces the
// process, which is also when a newly shipped mp4 could appear.
const existsCache = new Map<string, boolean>();

function mediaExists(publicPath: string): boolean {
  const hit = existsCache.get(publicPath);
  if (hit !== undefined) return hit;
  const found = fs.existsSync(path.join(process.cwd(), "public", publicPath));
  existsCache.set(publicPath, found);
  return found;
}

export function worldTrailer(worldSlug: string): WorldTrailer | undefined {
  const meta = WORLD_TRAILERS[worldSlug];
  if (!meta) return undefined;
  const full = `media/${worldSlug}-trailer.mp4`;
  const poster = `media/${worldSlug}-trailer-poster.webp`;
  if (!mediaExists(full) || !mediaExists(poster)) return undefined;
  const minutes = Math.floor(meta.durationSeconds / 60);
  const seconds = meta.durationSeconds % 60;
  return {
    poster: `/${poster}`,
    full: `/${full}`,
    durationSeconds: meta.durationSeconds,
    durationIso: `PT${minutes}M${seconds}S`,
    durationLabel: `${minutes}:${String(seconds).padStart(2, "0")}`,
    uploadDate: meta.uploadDate,
  };
}
