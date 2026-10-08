"use client";
import "./lesson-visuals.css";
import { ScenePortrait } from "@tensorcraft/ui";
import { portraitSources, resolveCharacter } from "@/lib/character-art";
import { DEEP_ORBIT_VISUALS } from "./deep-orbit-visuals";
import { LessonInstrument } from "./lesson-instrument";
import { LESSON_HANDOFFS } from "./lesson-handoffs";
import { ChannelLayoutExperiment } from "../mdx/channel-layout-experiment";

interface SceneLesson {
  slug: string;
  context: { narrative: string; speaker?: string };
  scene?: { location: string; time?: string; portraitAlt?: string };
}
interface Props {
  lesson: SceneLesson;
  worldSlug: string;
  moduleSlug: string;
  compact?: boolean;
}
export function LessonMissionScene({
  lesson,
  worldSlug,
  moduleSlug,
  compact = false,
}: Props) {
  const character = resolveCharacter(worldSlug, lesson.context.speaker);
  const portrait = portraitSources(worldSlug, character);
  return (
    <aside
      className={`lesson-mission-scene ${compact ? "lesson-mission-scene-compact" : ""}`}
      aria-label="Mission context"
    >
      <ScenePortrait
        src={`/scenes/${worldSlug}/${moduleSlug}/${lesson.slug}.webp`}
        alt={lesson.scene?.portraitAlt}
        aspectRatio={compact ? "16 / 7" : "4 / 3"}
        className="mission-context-image"
      />
      <div className="mission-context-copy">
        <p className="mission-context-location">
          {lesson.scene?.location ?? "Deep Orbit"}
          {lesson.scene?.time ? ` · ${lesson.scene.time}` : ""}
        </p>
        {!compact && character && (
          <div className="mission-context-crew">
            {portrait.src && (
              <img src={portrait.src} alt="" width={44} height={44} />
            )}
            <span>
              {character.name}
              <small>In this scene</small>
            </span>
          </div>
        )}
        <p className="mission-context-narrative" data-testid="mission-handoff">
          {worldSlug === "deep-orbit"
            ? (LESSON_HANDOFFS[lesson.slug] ?? lesson.context.narrative)
            : lesson.context.narrative}
        </p>
      </div>
    </aside>
  );
}
export function LessonConceptWorkbench({
  lesson,
  worldSlug,
  moduleSlug,
}: Props) {
  if (worldSlug !== "deep-orbit") return null;
  const spec = DEEP_ORBIT_VISUALS[lesson.slug];
  if (!spec) return null;
  return (
    <section
      className={`lesson-workbench${lesson.slug === "tensor-shapes" ? " lesson-workbench-expanded" : ""}`}
      aria-labelledby={`visual-${lesson.slug}`}
      data-testid="lesson-workbench"
    >
      <h2 id={`visual-${lesson.slug}`}>{spec.question}</h2>
      {spec.introduction && (
        <p className="lesson-workbench-introduction">{spec.introduction}</p>
      )}
      {spec.kind === "tensor" && spec.mode === "create" ? (
        <LessonInstrument key={lesson.slug} spec={spec} />
      ) : (
        <div className="lesson-workbench-grid">
          <LessonMissionScene
            lesson={lesson}
            worldSlug={worldSlug}
            moduleSlug={moduleSlug}
          />
          {lesson.slug === "tensor-shapes" ? (
            <div
              className="lesson-instrument lesson-prose lesson-embedded-experiment"
              data-no-swipe
            >
              <ChannelLayoutExperiment />
            </div>
          ) : (
            <LessonInstrument key={lesson.slug} spec={spec} />
          )}
        </div>
      )}
    </section>
  );
}
