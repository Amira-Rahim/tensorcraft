/**
 * GENERATED FILE - edit via `node scripts/video/ingest-scene-clips.mjs`.
 *
 * The approval gate for lesson scene clips (owner ruling 2026-09-04:
 * launch ships with video). A Briefing renders its clip ONLY when its
 * key is listed here; everything else falls back to the text reveal and
 * the still art, so partial generation stays shippable. Keys are
 * `<world>/<module>/<lesson>` with a `-epilogue` suffix for the seven
 * epilogue clips, mirroring the scene-still convention.
 */

export interface SceneClipEntry {
  /** Absolute or site-relative URL of the normalized, silent 10s mp4. */
  url: string;
  durationMs: number;
  bytes: number;
  ingestedAt: string;
}

export const SCENE_CLIPS: Record<string, SceneClipEntry> = {};
