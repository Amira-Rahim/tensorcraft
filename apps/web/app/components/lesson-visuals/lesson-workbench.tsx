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
import {
  resolveLessonSceneArt,
  type LessonSceneMetadata,
  type LessonScenePhase,
} from "@/lib/lesson-scene-art";

const DEEP_ORBIT_LOCATION_CAPTIONS: Record<string, string> = {
  "Archimedes, Lab": "Inside the science lab on the spaceship Archimedes.",
  "Archimedes, Bridge": "Inside the control room on the spaceship Archimedes.",
  "Archimedes, Engineering":
    "Inside the engineering room on the spaceship Archimedes.",
  "Archimedes, Shared Display":
    "At the crew's shared display on the spaceship Archimedes.",
  "Bridge, Main Displays":
    "At the main displays in the control room on the spaceship Archimedes.",
  "Bridge, Main Display":
    "At the main display in the control room on the spaceship Archimedes.",
  "Bridge, All Displays":
    "Inside the control room on the spaceship Archimedes, with every display in use.",
  "Galley, Spare Monitor":
    "At a spare monitor in the kitchen on the spaceship Archimedes.",
  "Lab, Glass Wall":
    "At the glass wall in the science lab on the spaceship Archimedes.",
  "Bridge, Dashboard Station":
    "At the dashboard station in the control room on the spaceship Archimedes.",
};

/**
 * The line under a mission scene: where it happens, then when. Deep Orbit
 * places are whole sentences ("Inside the control room on the spaceship
 * Archimedes."), other worlds pass short labels ("Deep Orbit"), and
 * authored times are capitalised phrases ("Six hours after first contact",
 * "Relay minus five days"). Joining with a bare comma printed
 * "Archimedes., Six hours after first contact" from 2026-10-15.
 */
function sceneCaption(place: string, time?: string): string {
  if (!time) return place;
  // A short label takes the time after a comma, as before.
  if (!/[.!?]$/.test(place)) return `${place}, ${time}`;
  // A whole-sentence place gets the time as its own sentence, keeping the
  // authored capital ("Relay minus five days" names an event).
  return /[.!?]$/.test(time) ? `${place} ${time}` : `${place} ${time}.`;
}

interface SceneLesson {
  slug: string;
  context: { narrative: string; speaker?: string };
  scene?: LessonSceneMetadata;
}
interface Props {
  lesson: SceneLesson;
  worldSlug: string;
  moduleSlug: string;
  phase?: LessonScenePhase;
  compact?: boolean;
  narrativeFirst?: boolean;
  heading?: string;
  learningGoals?: ReactNode;
}
export function LessonMissionScene({
  lesson,
  worldSlug,
  moduleSlug,
  phase = "concept",
  compact = false,
  narrativeFirst = false,
  heading,
  learningGoals,
}: Props) {
  const character = resolveCharacter(worldSlug, lesson.context.speaker);
  const portrait = portraitSources(worldSlug, character);
  const art = resolveLessonSceneArt({
    worldSlug,
    moduleSlug,
    lessonSlug: lesson.slug,
    phase,
    scene: lesson.scene,
  });
  const location = art?.location ?? lesson.scene?.location;
  const locationCaption =
    worldSlug === "deep-orbit"
      ? location
        ? (DEEP_ORBIT_LOCATION_CAPTIONS[location] ?? location)
        : "Aboard the spaceship Archimedes."
      : (location ?? "Deep Orbit");
  const narrative = (
    <p
      className="mission-context-narrative"
      data-testid="mission-handoff"
      data-story-passage={worldSlug === "deep-orbit" ? "" : undefined}
    >
      <ProseText>
        {worldSlug === "deep-orbit"
          ? (LESSON_HANDOFFS[lesson.slug] ?? lesson.context.narrative)
          : lesson.context.narrative}
      </ProseText>
    </p>
  );
  return (
    <aside
      className={`lesson-mission-scene ${compact ? "lesson-mission-scene-compact" : ""} ${heading ? "challenge-mission-header" : ""}`}
      aria-label="Mission context"
    >
      {narrativeFirst && narrative}
      {art && (
        <ScenePortrait
          src={art.src}
          alt={art.alt}
          aspectRatio={
            worldSlug === "deep-orbit" ? "3 / 2" : compact ? "16 / 7" : "4 / 3"
          }
          className="mission-context-image"
        />
      )}
      <div className="mission-context-copy">
        {heading && worldSlug !== "deep-orbit" && <h2>{heading}</h2>}
        <p className="mission-context-location">
          {sceneCaption(locationCaption, art?.time ?? lesson.scene?.time)}
        </p>
        {heading && worldSlug === "deep-orbit" && <h2>{heading}</h2>}
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
        {!narrativeFirst && narrative}
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
            phase="concept"
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
