"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ReviewOutcome } from "@tensorcraft/shared";

export type RecallAction = "attempted" | ReviewOutcome;

export function ReviewPromptCard({
  question,
  answer,
  onAction,
  onContinue,
}: {
  question: string;
  answer: ReactNode;
  onAction?: (action: RecallAction) => void;
  onContinue?: () => void;
}) {
  const questionId = useId();
  const [attempt, setAttempt] = useState("");
  const [state, setState] = useState<"prompt" | "revealed" | "rated">("prompt");
  const answerRef = useRef<HTMLDivElement>(null);
  const reveal = (bailed: boolean) => {
    setState(bailed ? "rated" : "revealed");
    onAction?.(bailed ? "bailed" : "attempted");
  };
  useEffect(() => {
    if (state !== "prompt") answerRef.current?.focus();
  }, [state]);
  const buttonClass =
    "px-4 py-2 text-sm font-mono border border-border bg-surface-raised text-text-primary hover:bg-surface disabled:opacity-50";
  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state !== "prompt" ? "Answer revealed." : ""}
      </div>
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-3 text-primary">
        Recall Prompt
      </h4>
      <p
        id={questionId}
        className="text-[15px] mb-4 text-text-primary font-mono"
      >
        {question}
      </p>
      {state === "prompt" ? (
        <>
          <textarea
            aria-labelledby={questionId}
            value={attempt}
            onChange={(event) => setAttempt(event.target.value)}
            rows={3}
            className="w-full p-3 mb-3 border border-border bg-surface text-text-primary"
          />
          <p className="text-xs text-text-muted mb-3">
            Your answer stays on this page and is never saved.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              disabled={!attempt.trim()}
              onClick={() => reveal(false)}
            >
              Check
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => reveal(true)}
            >
              I couldn&apos;t recall it
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            ref={answerRef}
            tabIndex={-1}
            className="p-4 bg-surface text-sm leading-relaxed text-text-primary"
          >
            {answer}
          </div>
          {state === "revealed" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["got-it", "Got it"],
                  ["review", "Needs work"],
                ] as const
              ).map(([outcome, label]) => (
                <button
                  key={outcome}
                  type="button"
                  className={buttonClass}
                  onClick={() => {
                    setState("rated");
                    onAction?.(outcome);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : onContinue ? (
            <button
              type="button"
              className={`${buttonClass} mt-3`}
              onClick={onContinue}
            >
              Continue to lesson
            </button>
          ) : (
            <p className="mt-3 text-sm text-text-muted">Recall recorded.</p>
          )}
        </>
      )}
    </div>
  );
}
