"use client";

import { useContext } from "react";
import { useScheme } from "../use-scheme";
import { InstructionText } from "./instruction-text";
import { HintPanel } from "./hint-panel";
import {
  ExerciseDataContext,
  ExerciseNotFound,
  difficultyConfig,
  mlContentConfig,
} from "./exercise-data";

interface ExerciseBriefProps {
  slug: string;
  /** The exercise's own ladder reports here, like the lesson-level one. */
  onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
}

/* The exercise's chips, title, instructions and its own hint ladder, for
   the Challenge step's reading column (spec 2026-09-24, section 3). The
   pane (exercise.tsx with brief="external") keeps the editor. Rendered
   inside .lesson-prose, so the title pins every property the prose h3
   rule sets, as LearningObjectives does for its heading. The challenge
   workspace's brief is TaskStopsBrief, inside the pane (spec 2026-10-10). */
export function ExerciseBrief({ slug, onHintRevealed }: ExerciseBriefProps) {
  const exercise = useContext(ExerciseDataContext).get(slug);
  const scheme = useScheme();
  if (!exercise) return <ExerciseNotFound slug={slug} />;
  const diff = difficultyConfig[exercise.difficulty];
  const diffColor = scheme === "light" ? diff.light : diff.color;
  const ml = exercise.mlContent ? mlContentConfig[exercise.mlContent] : null;
  const mlTone = ml ? (scheme === "light" ? ml.light : ml.tone) : null;
  return (
    <div data-testid="exercise-brief" className="my-6">
      {/* Wraps between whole items only (the phone fix, section 3). */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="whitespace-nowrap text-xs font-mono font-semibold uppercase tracking-widest text-primary">
          <span className="text-base" aria-hidden="true">
            ⚡
          </span>{" "}
          Exercise
        </span>
        <span
          className="whitespace-nowrap text-xs font-mono font-medium px-2 py-0.5"
          style={{ background: `${diffColor}15`, color: diffColor }}
          title="Cognitive difficulty"
        >
          {diff.label}
        </span>
        {ml && mlTone && (
          <span
            className="whitespace-nowrap text-xs font-mono font-medium px-2 py-0.5"
            style={{ background: `${mlTone}15`, color: mlTone }}
            title="ML content axis: what skill the exercise actually builds"
            data-testid="mlcontent-badge"
          >
            {ml.label}
          </span>
        )}
        <span className="whitespace-nowrap text-xs text-text-muted">
          ~{exercise.estimatedMinutes} min
        </span>
      </div>
      <h3
        className="text-lg font-semibold mb-2 text-text-primary"
        style={{
          marginTop: 0,
          marginBottom: "0.5rem",
          fontSize: "var(--lesson-task-title-size, 1.125rem)",
          fontWeight: 600,
          color: "var(--tc-text)",
        }}
      >
        {exercise.title}
      </h3>
      <InstructionText
        text={exercise.instructions}
        className="text-sm leading-relaxed mb-4 text-text-primary/65"
      />
      {exercise.hints && exercise.hints.length > 0 && (
        <div data-testid="exercise-hints">
          <HintPanel hints={exercise.hints} onHintRevealed={onHintRevealed} />
        </div>
      )}
    </div>
  );
}
