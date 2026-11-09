import { describe, expect, it } from "vitest";
import {
  LESSON_SCENE_ART,
  LESSON_SCENE_PHASES,
  resolveLessonSceneArt,
  type LessonSceneArtManifest,
} from "./lesson-scene-art";
import { scenePhaseCoverage } from "../../../scripts/art/scene-phase-coverage.mjs";

const route = {
  worldSlug: "deep-orbit",
  moduleSlug: "foundations",
  lessonSlug: "tensor-operations",
};
const key = "deep-orbit/foundations/tensor-operations";

describe("phase-specific lesson artwork", () => {
  it("publishes only existing, distinct files with descriptive alternatives", () => {
    const coverage = scenePhaseCoverage();
    expect(coverage.errors).toEqual([]);
    expect(coverage.lessonCount).toBeGreaterThan(0);
    expect(coverage.phaseCount).toBe(
      coverage.lessonCount * LESSON_SCENE_PHASES.length,
    );
    expect(coverage.published + coverage.pending).toBe(coverage.phaseCount);
    expect(coverage.pending).toBe(0);
    expect(coverage.completeLessons).toBe(coverage.lessonCount);
    expect(coverage.identityApproved).toBe(coverage.phaseCount);
  });

  it("resolves every published phase without substituting another phase's image", () => {
    for (const [lesson, entries] of Object.entries(LESSON_SCENE_ART)) {
      const [worldSlug, moduleSlug, lessonSlug] = lesson.split("/") as [
        string,
        string,
        string,
      ];
      for (const phase of LESSON_SCENE_PHASES) {
        const art = entries[phase];
        if (!art) continue;
        expect(
          resolveLessonSceneArt({ worldSlug, moduleSlug, lessonSlug, phase }),
        ).toMatchObject({
          ...art,
          requestedPhase: phase,
          sourcePhase: phase,
        });
      }
    }
  });

  it("uses a distinct ending in the same room without epilogueLocation", () => {
    const manifest: LessonSceneArtManifest = {
      [key]: {
        epilogue: {
          src: `/scenes/${key}-epilogue.webp`,
          alt: "Farah and Demir share a relieved smile beside the stable sensor traces.",
        },
      },
    };
    expect(
      resolveLessonSceneArt({
        ...route,
        phase: "epilogue",
        scene: {
          location: "Archimedes, Lab",
          portraitAlt: "The stalled display.",
        },
        manifest,
      }),
    ).toMatchObject({
      ...manifest[key]!.epilogue,
      location: "Archimedes, Lab",
      sourcePhase: "epilogue",
    });
  });

  it("gives all five phases their own composition when a bundle is complete", () => {
    const entries = Object.fromEntries(
      LESSON_SCENE_PHASES.map((phase) => [
        phase,
        {
          src: `/scenes/${key}-${phase}.webp`,
          alt: `The crew during the ${phase} scene.`,
        },
      ]),
    );
    const images = LESSON_SCENE_PHASES.map((phase) =>
      resolveLessonSceneArt({
        ...route,
        phase,
        manifest: { [key]: entries },
      }),
    );
    expect(new Set(images.map((image) => image!.src)).size).toBe(
      LESSON_SCENE_PHASES.length,
    );
    expect(
      images.every((image) => image!.sourcePhase === image!.requestedPhase),
    ).toBe(true);
  });

  it("reports legacy reuse honestly and never invents an unapproved phase path", () => {
    const manifest: LessonSceneArtManifest = {
      [key]: {
        briefing: { src: `/scenes/${key}.webp`, alt: "The stalled display." },
      },
    };
    expect(
      resolveLessonSceneArt({ ...route, phase: "challenge", manifest }),
    ).toMatchObject({
      src: `/scenes/${key}.webp`,
      requestedPhase: "challenge",
      sourcePhase: "briefing",
    });
    expect(
      resolveLessonSceneArt({ ...route, phase: "takeaways", manifest }),
    ).toBeUndefined();
  });
});
