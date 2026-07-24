// DEPRECATED: replaced by RecallPrompt/LessonRecap in the lesson close; retained for unbuilt coming-soon theme MDX. See docs/superpowers/specs/2026-06-15-end-of-lesson-design.md
"use client";

import { useState } from "react";

/**
 * Per-option config. Authors may mark the correct option via either:
 *   - per-option `correct: true` flag, or
 *   - top-level `correct` index on the Quiz (preferred for MDX authoring).
 */
interface QuizOption {
  text: string;
  correct?: boolean;
}

export type QuizTier = "identity" | "structural" | "intuition";

export interface QuizSubmitResult {
  passed: boolean;
  attempts: number;
  selected: number;
}

interface QuizProps {
  question: string;
  options: QuizOption[];
  /** Index of the correct option. Overrides per-option `correct` if set. */
  correct?: number;
  /** Shown once the learner submits, regardless of correctness. */
  explanation?: string;
  /** Bridge tier hint for themed styling, currently informational. */
  tier?: QuizTier;
  /** Fired on every submit so the host app can wire analytics. */
  onSubmit?: (result: QuizSubmitResult) => void;
}

export function Quiz({
  question,
  options,
  correct,
  explanation,
  tier,
  onSubmit,
}: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const correctIndex =
    typeof correct === "number"
      ? correct
      : options.findIndex((o) => o.correct === true);

  const isCorrect = selected !== null && selected === correctIndex;

  function handleSubmit() {
    if (selected === null) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setSubmitted(true);
    onSubmit?.({
      passed: selected === correctIndex,
      attempts: nextAttempts,
      selected,
    });
  }

  function handleReset() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <div
      className="p-6 my-6 brutalist-shadow bg-surface-raised border border-border"
      data-tier={tier}
    >
      <h3 className="text-base font-semibold mb-2 text-text-primary">
        Quick Check
      </h3>
      <p className="text-[15px] mb-4 text-text-primary/80">{question}</p>

      <div
        className="flex flex-col gap-2"
        role="radiogroup"
        aria-label={question}
      >
        {options.map((option, i) => {
          let borderClass = "border-interactive";
          let bgClass = "bg-transparent";

          if (submitted && i === selected) {
            if (isCorrect) {
              borderClass = "border-primary";
              bgClass = "bg-primary/10";
            } else {
              borderClass = "border-error";
              bgClass = "bg-error/10";
            }
          } else if (i === selected) {
            borderClass = "border-primary";
          }

          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={i === selected ? "true" : "false"}
              disabled={submitted}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-3 p-3 text-left transition-colors border ${borderClass} ${bgClass}`}
            >
              <div
                className={`w-5 h-5 border-2 flex-shrink-0 flex items-center justify-center ${
                  i === selected ? "border-primary" : "border-interactive"
                }`}
              >
                {i === selected && <div className="w-2.5 h-2.5 bg-primary" />}
              </div>
              <span className="text-sm text-text-primary/80">
                {option.text.replace(/\s*[—-]\s*correct\s*$/i, "")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected === null}
            className="px-4 py-2 text-sm font-mono font-medium bg-primary text-on-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover disabled:opacity-40"
          >
            Check Answer
          </button>
        ) : (
          <>
            <span
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={`text-sm font-medium ${isCorrect ? "text-primary" : "text-error"}`}
            >
              {isCorrect
                ? "Correct!"
                : explanation
                  ? "Wrong answer, see why below"
                  : "Wrong answer"}
            </span>
            {!isCorrect && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm underline text-text-muted"
              >
                Retry
              </button>
            )}
          </>
        )}
      </div>

      {submitted && explanation && (
        <div
          data-testid="quiz-explanation"
          className="mt-4 pt-4 border-t border-border text-sm text-text-primary/80 font-sans leading-relaxed"
        >
          {explanation}
        </div>
      )}
    </div>
  );
}
