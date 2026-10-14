"use client";

import { useId, useRef, useState } from "react";
import { ProseText } from "@tensorcraft/ui/prose-text";
import {
  isRecallCheckCorrect,
  recallCheckAnswer,
  type RecallCheck,
} from "@tensorcraft/shared";
import type { RecallAction } from "./review-prompt-card";

type Result = "correct" | "incorrect" | "revealed" | null;

export function CheckedRecallCard({
  question,
  example,
  variant,
  checks,
  onAction,
  onContinue,
}: {
  question: string;
  example?: string;
  variant?: "default" | "deep-orbit";
  checks: RecallCheck[];
  onAction?: (action: RecallAction) => void;
  onContinue?: () => void;
}) {
  const lessonLayout = variant === "deep-orbit";
  const id = useId();
  const [responses, setResponses] = useState<string[]>(() =>
    checks.map(() => ""),
  );
  const [results, setResults] = useState<Result[]>(() =>
    checks.map(() => null),
  );
  const [summary, setSummary] = useState("");
  const [done, setDone] = useState(false);
  const submitted = useRef(false);
  const missed = useRef(false);
  const settled = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const buttonClass =
    "min-h-11 px-4 py-2 text-sm font-mono border border-interactive bg-surface-raised text-text-primary hover:bg-surface disabled:opacity-50";

  function finish(action: "got-it" | "review" | "bailed") {
    if (settled.current) return;
    settled.current = true;
    setDone(true);
    onAction?.(action);
  }

  function checkAnswers() {
    if (settled.current || responses.some((response) => !response.trim()))
      return;
    if (!submitted.current) onAction?.("attempted");
    submitted.current = true;
    const next = checks.map((check, i): Result =>
      isRecallCheckCorrect(check, responses[i]) ? "correct" : "incorrect",
    );
    setResults(next);
    const correct = next.filter((result) => result === "correct").length;
    if (correct === checks.length) {
      setSummary(
        missed.current
          ? "All answers are correct. You corrected an earlier mistake."
          : "All answers are correct.",
      );
      finish(missed.current ? "review" : "got-it");
    } else {
      missed.current = true;
      setSummary(
        `${correct} of ${checks.length} correct. Review the feedback and try again.`,
      );
    }
    summaryRef.current?.focus();
  }

  function reveal() {
    if (settled.current) return;
    setResults((current) =>
      current.map((result) => (result === "correct" ? result : "revealed")),
    );
    setSummary("Answers revealed. Read each explanation before continuing.");
    finish("bailed");
    summaryRef.current?.focus();
  }

  function change(index: number, value: string) {
    setResponses((current) =>
      current.map((response, i) => (i === index ? value : response)),
    );
    setResults((current) =>
      current.map((result, i) => (i === index ? null : result)),
    );
    if (submitted.current)
      setSummary("Answer changed. Check again when you are ready.");
  }

  return (
    <form
      aria-label="Knowledge check"
      className={
        lessonLayout
          ? "review-check orbit-check"
          : "review-check p-5 my-6 brutalist-shadow bg-surface-raised border border-border"
      }
      onSubmit={(event) => {
        event.preventDefault();
        checkAnswers();
      }}
    >
      {lessonLayout ? (
        <h2 className="orbit-check-heading">Check what you learned</h2>
      ) : (
        <h4 className="font-mono text-sm font-semibold text-primary mb-3">
          Knowledge check
        </h4>
      )}
      {lessonLayout && example ? (
        <div className="orbit-check-example">
          <code>{example}</code>
        </div>
      ) : (
        (checks.length > 1 || checks[0].question !== question) && (
          <p className="review-prompt-question text-text-primary mb-4">
            <ProseText>{question}</ProseText>
          </p>
        )
      )}
      <p className="review-prompt-note text-xs text-text-muted mb-4">
        Each answer is checked separately. You can retry any mistakes.
      </p>
      <div
        className={
          lessonLayout ? "orbit-check-questions" : "grid gap-6 max-w-[75ch]"
        }
      >
        {checks.map((check, index) => {
          const result = results[index];
          const locked = done || result === "correct";
          const questionId = `${id}-question-${index}`;
          const helpId = `${id}-help-${index}`;
          const feedbackId = `${id}-feedback-${index}`;
          const expectedAnswer = recallCheckAnswer(check);
          const feedback =
            result === "incorrect"
              ? check.kind === "choice"
                ? check.options[Number(responses[index])]?.feedback
                : check.hint
              : check.explanation;
          return (
            <fieldset
              key={index}
              className="min-w-0"
              aria-describedby={result ? feedbackId : undefined}
            >
              <legend
                id={questionId}
                className={
                  lessonLayout
                    ? "sr-only"
                    : "mb-3 font-medium text-text-primary"
                }
              >
                {lessonLayout ? (
                  check.question
                ) : (
                  <ProseText>{check.question}</ProseText>
                )}
              </legend>
              <div className={lessonLayout ? "orbit-check-row" : undefined}>
                {lessonLayout && (
                  <div className="orbit-check-prompt" aria-hidden="true">
                    {check.question}
                  </div>
                )}
                <div
                  className={lessonLayout ? "orbit-check-response" : undefined}
                >
                  {check.kind === "choice" ? (
                    <div
                      className={
                        lessonLayout ? "orbit-check-options" : "grid gap-2"
                      }
                      data-binary={
                        (check.options.length === 2 &&
                          check.options.every((option) =>
                            /^(Yes|No)(?:,|$)/.test(option.text),
                          )) ||
                        undefined
                      }
                    >
                      {check.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className={
                            lessonLayout
                              ? "orbit-check-option"
                              : `flex min-h-11 items-start gap-3 border p-3 text-sm text-text-primary ${responses[index] === String(optionIndex) ? "border-primary bg-surface" : "border-interactive"} ${locked ? "" : "cursor-pointer hover:bg-surface"}`
                          }
                        >
                          <input
                            type="radio"
                            name={`${id}-choice-${index}`}
                            value={optionIndex}
                            checked={responses[index] === String(optionIndex)}
                            disabled={locked}
                            onChange={() => change(index, String(optionIndex))}
                            className="mt-1 shrink-0 accent-primary"
                          />
                          <span>
                            {lessonLayout && /^(Yes|No), /.test(option.text) ? (
                              <>
                                <strong>{option.text.split(", ")[0]}</strong>
                                <small>
                                  {option.text.slice(
                                    option.text.indexOf(", ") + 2,
                                  )}
                                </small>
                              </>
                            ) : (
                              <ProseText>{option.text}</ProseText>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        aria-labelledby={questionId}
                        aria-describedby={`${helpId}${result ? ` ${feedbackId}` : ""}`}
                        aria-invalid={result === "incorrect" || undefined}
                        value={responses[index]}
                        disabled={locked}
                        onChange={(event) => change(index, event.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        inputMode={check.kind === "number" ? "decimal" : "text"}
                        className={
                          lessonLayout
                            ? "orbit-check-input"
                            : "w-full max-w-sm min-h-11 p-3 border border-interactive bg-surface text-text-primary font-mono"
                        }
                      />
                      <p
                        id={helpId}
                        className="review-prompt-note mt-2 text-xs text-text-muted"
                      >
                        {check.kind === "shape"
                          ? "Use brackets, for example [2, 4]. Spaces are fine."
                          : "Enter a number without units."}
                      </p>
                    </>
                  )}
                  {result && (
                    <div
                      id={feedbackId}
                      className={`mt-3 border-l-2 pl-3 text-sm text-text-primary ${result === "correct" ? "border-success" : result === "incorrect" ? "border-error" : "border-primary"}`}
                    >
                      <strong
                        className={
                          result === "correct"
                            ? "text-success"
                            : result === "incorrect"
                              ? "text-error"
                              : "text-text-primary"
                        }
                      >
                        {result === "correct"
                          ? "Correct. "
                          : result === "incorrect"
                            ? "Not yet. "
                            : `Expected answer: ${expectedAnswer}${/[.!?]$/.test(expectedAnswer) ? "" : "."} `}
                      </strong>
                      <ProseText>{feedback}</ProseText>
                    </div>
                  )}
                </div>
              </div>
            </fieldset>
          );
        })}
      </div>
      <div
        ref={summaryRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        className={
          summary
            ? "recall-check-summary mt-5 text-sm font-medium text-text-primary max-w-[75ch]"
            : "sr-only"
        }
      >
        {summary}
      </div>
      {!done ? (
        <div
          className={
            lessonLayout ? "orbit-check-actions" : "mt-4 flex flex-wrap gap-2"
          }
        >
          {lessonLayout && (
            <button
              type="button"
              className="orbit-check-explain"
              onClick={reveal}
            >
              Show an explanation
            </button>
          )}
          <button
            type="submit"
            className={lessonLayout ? "orbit-check-submit" : buttonClass}
            disabled={responses.some((response) => !response.trim())}
          >
            {submitted.current
              ? "Check again"
              : checks.length === 1
                ? "Check answer"
                : "Check answers"}
          </button>
          {!lessonLayout && (
            <button type="button" className={buttonClass} onClick={reveal}>
              I couldn&apos;t recall it
            </button>
          )}
        </div>
      ) : onContinue ? (
        <button
          type="button"
          className={`${buttonClass} mt-[var(--l-nav-inner,24px)]`}
          onClick={onContinue}
        >
          Continue to lesson
        </button>
      ) : null}
    </form>
  );
}
