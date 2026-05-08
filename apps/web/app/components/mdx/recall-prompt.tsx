"use client";

import { useState, type ReactNode } from "react";

interface RecallPromptProps {
  question: string;
  /** App-level API: arbitrary React children as the answer */
  children?: ReactNode;
  /** Package-level API: plain string answer */
  answer?: string;
  /**
   * Bandit-recall callback. When provided, the component renders
   * "Got it" / "Review again" buttons that update the user's review
   * queue via record_recall_attempt. When absent (e.g. lesson preview
   * with no auth), only "Hide answer" is shown.
   */
  onRecall?: (success: boolean) => void;
}

export function RecallPrompt({
  question,
  children,
  answer,
  onRecall,
}: RecallPromptProps) {
  const [revealed, setRevealed] = useState(false);
  const [submitted, setSubmitted] = useState<"got-it" | "review" | null>(null);

  const answerContent = children ?? (
    <p className="text-sm leading-relaxed text-text-primary/80">{answer}</p>
  );

  function handleGotIt() {
    setSubmitted("got-it");
    onRecall?.(true);
  }

  function handleReview() {
    setSubmitted("review");
    onRecall?.(false);
  }

  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-3 text-primary">
        Recall Prompt
      </h4>

      <p className="text-[15px] mb-4 text-text-primary/80 font-mono">
        {question}
      </p>

      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="px-4 py-2 text-sm font-mono font-medium bg-primary text-page border-2 border-primary hover:bg-transparent hover:text-primary transition-colors duration-100 brutalist-hover"
        >
          Reveal Answer
        </button>
      )}

      {revealed && (
        <div
          className="transition-colors duration-75"
          style={{ opacity: revealed ? 1 : 0 }}
        >
          <div className="p-4 bg-surface border-l-[3px] border-l-primary text-sm leading-relaxed text-text-primary/80">
            {answerContent}
          </div>

          {onRecall && submitted === null && (
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={handleGotIt}
                className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-primary/10 text-primary border border-primary/20"
              >
                Got it
              </button>
              <button
                type="button"
                onClick={handleReview}
                className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
              >
                Review again
              </button>
            </div>
          )}

          {onRecall && submitted === "got-it" && (
            <p className="text-xs mt-3 font-mono text-primary">
              ✓ Marked as recalled — next review scheduled
            </p>
          )}

          {onRecall && submitted === "review" && (
            <p className="text-xs mt-3 font-mono text-yellow-400">
              ↻ Will resurface tomorrow
            </p>
          )}

          {!onRecall && (
            <button
              type="button"
              onClick={() => setRevealed(false)}
              className="mt-3 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-primary/10 text-primary border border-primary/20"
            >
              Hide Answer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
