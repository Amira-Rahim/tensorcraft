"use client";

import { useState } from "react";

interface RecallPromptProps {
  question: string;
  answer: string;
}

export function RecallPrompt({ question, answer }: RecallPromptProps) {
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<"got-it" | "review" | null>(null);
  function handleReveal() {
    setRevealed(true);
  }

  function handleGotIt() {
    setResult("got-it");
  }

  function handleReview() {
    setResult("review");
    setRevealed(false);
    setTimeout(() => setResult(null), 300);
  }

  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-3 text-primary">
        Recall Prompt
      </h4>

      <p className="text-[15px] mb-4 text-text-primary/80">{question}</p>

      {!revealed && (
        <button
          type="button"
          onClick={handleReveal}
          className="px-4 py-2 text-sm font-mono font-medium bg-primary text-surface border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
        >
          Reveal Answer
        </button>
      )}

      {revealed && (
        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight: revealed ? "500px" : "0",
            opacity: revealed ? 1 : 0,
          }}
        >
          <div className="p-4 bg-surface border-l-[3px] border-l-primary">
            <p className="text-sm leading-relaxed text-text-primary/80">
              {answer}
            </p>
          </div>

          {result !== "got-it" && (
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
                className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-warning/10 text-warning border border-warning/20"
              >
                Review again
              </button>
            </div>
          )}

          {result === "got-it" && (
            <p className="text-xs mt-3 font-mono text-primary">
              ✓ Marked as recalled
            </p>
          )}
        </div>
      )}
    </div>
  );
}
