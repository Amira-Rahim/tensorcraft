import publishedArt from "./lesson-scene-art.manifest.json";

export const LESSON_SCENE_PHASES = [
  "briefing",
  "concept",
  "challenge",
  "takeaways",
  "epilogue",
] as const;

export type LessonScenePhase = (typeof LESSON_SCENE_PHASES)[number];

export interface LessonSceneArt {
  src: string;
  alt: string;
  location?: string;
  time?: string;
}

export type LessonSceneArtManifest = Record<
  string,
  Partial<Record<LessonScenePhase, LessonSceneArt>>
>;

/** Entries publish only after visual review. File discovery never approves art. */
export const LESSON_SCENE_ART: LessonSceneArtManifest = publishedArt;

export interface LessonSceneMetadata {
  location: string;
  time?: string;
  epilogueLocation?: string;
  portraitAlt?: string;
  epiloguePortraitAlt?: string;
}

export interface ResolvedLessonSceneArt extends LessonSceneArt {
  requestedPhase: LessonScenePhase;
  sourcePhase: LessonScenePhase;
}

/**
 * Resolve the approved composition for a phase independently of its location.
 * During rollout, existing phases retain their published art until their new
 * composition passes review. The source phase makes that reuse measurable.
 * Takeaways had no scene, so it starts displaying art only after approval.
 */
export function resolveLessonSceneArt({
  worldSlug,
  moduleSlug,
  lessonSlug,
  phase,
  scene,
  manifest = LESSON_SCENE_ART,
}: {
  worldSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  phase: LessonScenePhase;
  scene?: LessonSceneMetadata;
  manifest?: LessonSceneArtManifest;
}): ResolvedLessonSceneArt | undefined {
  const key = `${worldSlug}/${moduleSlug}/${lessonSlug}`;
  const entries = manifest[key];
  const approved = entries?.[phase];
  if (approved) {
    return {
      location:
        phase === "epilogue"
          ? (scene?.epilogueLocation ?? scene?.location)
          : scene?.location,
      time: scene?.time,
      ...approved,
      requestedPhase: phase,
      sourcePhase: phase,
    };
  }
  if (phase === "takeaways") return undefined;

  const sourcePhase =
    phase === "epilogue" && scene?.epilogueLocation ? "epilogue" : "briefing";
  const existing = entries?.[sourcePhase];
  return {
    src: `/scenes/${key}${sourcePhase === "epilogue" ? "-epilogue" : ""}.webp`,
    alt:
      (sourcePhase === "epilogue"
        ? scene?.epiloguePortraitAlt
        : scene?.portraitAlt) ?? "",
    location:
      sourcePhase === "epilogue" ? scene?.epilogueLocation : scene?.location,
    time: scene?.time,
    ...existing,
    requestedPhase: phase,
    sourcePhase,
  };
}
