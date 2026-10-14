"use client";
import { ProseText } from "@tensorcraft/ui/prose-text";
import "./lesson-visuals.css";
import type { ReactNode } from "react";
import { ScenePortrait } from "@tensorcraft/ui";
import { portraitSources, resolveCharacter } from "@/lib/character-art";
import { DEEP_ORBIT_VISUALS } from "./deep-orbit-visuals";
import { LessonInstrument } from "./lesson-instrument";
import { LESSON_HANDOFFS } from "./lesson-handoffs";
import { ChannelLayoutExperiment } from "../mdx/channel-layout-experiment";
import { LessonInvestigation } from "./lesson-investigation";
import { LESSON_INVESTIGATIONS } from "./lesson-investigations";

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
  heading?: string;
  learningGoals?: ReactNode;
}
export function LessonMissionScene({
  lesson,
  worldSlug,
  moduleSlug,
  compact = false,
  heading,
  learningGoals,
}: Props) {
  const character = resolveCharacter(worldSlug, lesson.context.speaker);
  const portrait = portraitSources(worldSlug, character);
  return (
    <aside
      className={`lesson-mission-scene ${compact ? "lesson-mission-scene-compact" : ""} ${heading ? "challenge-mission-header" : ""}`}
      aria-label="Mission context"
    >
      <ScenePortrait
        src={`/scenes/${worldSlug}/${moduleSlug}/${lesson.slug}.webp`}
        alt={lesson.scene?.portraitAlt}
        aspectRatio={
          worldSlug === "deep-orbit" ? "3 / 2" : compact ? "16 / 7" : "4 / 3"
        }
        className="mission-context-image"
      />
      <div className="mission-context-copy">
        {heading && <h2>{heading}</h2>}
        <p className="mission-context-location">
          {heading && lesson.scene?.location === "Archimedes, Bridge"
            ? "Control room aboard the Archimedes"
            : (lesson.scene?.location ?? "Deep Orbit")}
          {lesson.scene?.time ? ` · ${lesson.scene.time}` : ""}
        </p>
        {!compact && character && (
          <div className="mission-context-crew">
            {portrait.src && (
              <img src={portrait.src} alt="" width={44} height={44} />
            )}
            <span>
              <ProseText>{character.name}</ProseText>
              <small>In this scene</small>
            </span>
          </div>
        )}
        <p className="mission-context-narrative" data-testid="mission-handoff">
          <ProseText>
            {worldSlug === "deep-orbit"
              ? (LESSON_HANDOFFS[lesson.slug] ?? lesson.context.narrative)
              : lesson.context.narrative}
          </ProseText>
        </p>
        {learningGoals}
      </div>
    </aside>
  );
}
export function LessonConceptWorkbench({
  lesson,
  worldSlug,
  moduleSlug,
  learningGoals,
}: Props & { learningGoals?: ReactNode }) {
  if (worldSlug !== "deep-orbit") return null;
  const spec = DEEP_ORBIT_VISUALS[lesson.slug];
  const investigation = LESSON_INVESTIGATIONS[lesson.slug];
  if (!spec) return null;
  return (
    <section
      className="lesson-workbench lesson-workbench-expanded"
      aria-labelledby={`visual-${lesson.slug}`}
      data-testid="lesson-workbench"
    >
      <h2 id={`visual-${lesson.slug}`}>
        <ProseText>{spec.question}</ProseText>
      </h2>
      {spec.introduction && (
        <p className="lesson-workbench-introduction">
          <ProseText>{spec.introduction}</ProseText>
        </p>
      )}
      {spec.kind === "tensor" && spec.mode === "create" ? (
        <>
          {learningGoals}
          <LessonInstrument key={lesson.slug} spec={spec} />
        </>
      ) : (
        <div className="lesson-workbench-grid">
          <LessonMissionScene
            lesson={lesson}
            worldSlug={worldSlug}
            moduleSlug={moduleSlug}
            learningGoals={learningGoals}
          />
          {lesson.slug === "tensor-shapes" ? (
            <div
              className="lesson-instrument lesson-prose lesson-embedded-experiment"
              data-no-swipe
            >
              <ChannelLayoutExperiment />
            </div>
          ) : (
            <div className="orbit-investigation-workspace">
              {investigation && (
                <LessonInvestigation
                  key={lesson.slug}
                  lessonSlug={lesson.slug}
                  spec={investigation}
                />
              )}
              <details className="orbit-investigation-reference">
                <summary>Inspect the reference example</summary>
                <LessonInstrument key={lesson.slug} spec={spec} />
              </details>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
