"use client";
import { ProseText } from "@tensorcraft/ui/prose-text";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CheckedRecallCard } from "./checked-recall-card";
import type { RecallCheck, ReviewOutcome } from "@tensorcraft/shared";

export type RecallAction = "attempted" | ReviewOutcome;

interface ReviewPromptCardProps {
  question: string;
  example?: string;
  variant?: "default" | "deep-orbit";
  answer: ReactNode;
  checks?: RecallCheck[];
  onAction?: (action: RecallAction) => void;
  onContinue?: () => void;
}

export function ReviewPromptCard(props: ReviewPromptCardProps) {
  return props.checks?.length ? (
    <CheckedRecallCard {...props} checks={props.checks} />
  ) : (
    <SelfAssessmentCard {...props} />
  );
}

function SelfAssessmentCard({
  variant,
  question,
  answer,
  onAction,
  onContinue,
}: ReviewPromptCardProps) {
  const questionId = useId();
  const [attempt, setAttempt] = useState("");
  const [state, setState] = useState<"prompt" | "revealed" | "rated">("prompt");
  const answerRef = useRef<HTMLDivElement>(null);
  const attemptRef = useRef<HTMLTextAreaElement>(null);
  const retrying = useRef(false);
  const reveal = (bailed: boolean) => {
    setState(bailed ? "rated" : "revealed");
    onAction?.(bailed ? "bailed" : "attempted");
  };
  useEffect(() => {
    if (state !== "prompt") answerRef.current?.focus();
    else if (retrying.current) attemptRef.current?.focus();
  }, [state]);
  const buttonClass =
    "min-h-11 px-4 py-2 text-sm font-mono border border-interactive bg-surface-raised text-text-primary hover:bg-surface disabled:opacity-50";
  return (
    <div
      className={
        variant === "deep-orbit"
          ? "orbit-self-assessment"
          : "p-5 my-6 brutalist-shadow bg-surface-raised border border-border"
      }
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state !== "prompt" ? "Answer revealed." : ""}
      </div>
      <h4 className="text-sm font-mono font-semibold mb-3 text-primary">
        Self-assessment
      </h4>
      <p
        id={questionId}
        className="review-prompt-question text-[15px] mb-4 text-text-primary font-mono"
      >
        <ProseText>{question}</ProseText>
      </p>
      {state === "prompt" ? (
        <>
          <textarea
            ref={attemptRef}
            aria-labelledby={questionId}
            value={attempt}
            onChange={(event) => setAttempt(event.target.value)}
            rows={3}
            className="w-full p-3 mb-3 border border-interactive bg-surface text-text-primary"
          />
          <p className="review-prompt-note text-xs text-text-muted mb-3">
            Your response is not automatically graded. Compare it with the
            answer, then rate your recall. Your text stays on this page and is
            never saved.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              disabled={!attempt.trim()}
              onClick={() => reveal(false)}
            >
              Show answer
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
          {attempt.trim() && (
            <div className="mb-3 max-w-[75ch] text-sm text-text-primary">
              <strong>Your answer</strong>
              <div className="whitespace-pre-wrap break-words">{attempt}</div>
            </div>
          )}
          <div
            ref={answerRef}
            tabIndex={-1}
            className="review-prompt-answer p-4 bg-surface text-sm leading-relaxed text-text-primary"
          >
            <ProseText>{answer}</ProseText>
          </div>
          {state === "revealed" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  retrying.current = true;
                  setState("prompt");
                }}
              >
                Try again
              </button>
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
              className={`${buttonClass} mt-[var(--l-nav-inner,24px)]`}
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
