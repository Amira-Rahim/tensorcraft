import { SCENE_CLIPS, type SceneClipEntry } from "./scene-clips.manifest";

export type { SceneClipEntry };

/**
 * Look up the approved clip for a lesson's Briefing (or its epilogue).
 * Null means "no clip shipped": the Briefing renders the text reveal and
 * still art exactly as before the video program existed.
 */
export function sceneClipFor(
  worldSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  epilogue = false,
): SceneClipEntry | null {
  const key = `${worldSlug}/${moduleSlug}/${lessonSlug}${
    epilogue ? "-epilogue" : ""
  }`;
  return SCENE_CLIPS[key] ?? null;
}
