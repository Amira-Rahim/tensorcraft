"use client";

import { useState, type ReactNode } from "react";

interface RecallPromptProps {
  question: string;
  /** App-level API: arbitrary React children as the answer */
  children?: ReactNode;
  /** Package-level API: plain string answer */
  answer?: string;
}

export function RecallPrompt({
  question,
  children,
  answer,
}: RecallPromptProps) {
  const [revealed, setRevealed] = useState(false);

  const answerContent = children ?? (
    <p className="text-sm leading-relaxed text-text-primary/80">{answer}</p>
  );

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

          <button
            type="button"
            onClick={() => setRevealed(false)}
            className="mt-3 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-primary/10 text-primary border border-primary/20"
          >
            Hide Answer
          </button>
        </div>
      )}
    </div>
  );
}
