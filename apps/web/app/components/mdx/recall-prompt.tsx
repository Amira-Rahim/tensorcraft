"use client";

import { useRef, useState, type ReactNode } from "react";

interface RecallPromptProps {
  question: string;
  /** App-level API: arbitrary React children as the answer */
  children?: ReactNode;
  /** Package-level API: plain string answer */
  answer?: string;
  /** Called when the learner rates their recall */
  onAnswer?: (result: "got-it" | "review") => void;
}

export function RecallPrompt({
  question,
  children,
  answer,
  onAnswer,
}: RecallPromptProps) {
  const [revealed, setRevealed] = useState(false);
  const answerRef = useRef<HTMLDivElement | null>(null);

  const answerContent = children ?? (
    <p className="text-sm leading-relaxed text-text-primary/80">{answer}</p>
  );

  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      {/*
        "Reveal Answer" replaced the button with its own result in the same
        commit: focus fell to <body> and nothing announced. Always-mounted
        live region (a region created alongside its content is not reliably
        announced) plus a focus move, matching exercise.tsx. WCAG 4.1.3, 2.4.3.

        The region announces the EVENT only, never the answer text. Focus
        lands on the answer itself, so repeating it here would make a screen
        reader read it twice. (It also keeps the two answer APIs - `children`
        JSX and the `answer` string - behaving identically.)
      */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {revealed ? "Answer revealed." : ""}
      </div>

      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-3 text-primary">
        Recall Prompt
      </h4>

      <p className="text-[15px] mb-4 text-text-primary/80 font-mono">
        {question}
      </p>

      {!revealed && (
        <button
          type="button"
          onClick={() => {
            setRevealed(true);
            // After paint: the button that was pressed no longer exists, so
            // without this focus resets to <body>.
            requestAnimationFrame(() => answerRef.current?.focus());
          }}
          className="px-4 py-2 text-sm font-mono font-medium bg-primary text-on-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-colors duration-100 brutalist-hover"
        >
          Reveal Answer
        </button>
      )}

      {revealed && (
        <div
          className="transition-colors duration-75"
          style={{ opacity: revealed ? 1 : 0 }}
        >
          <div
            ref={answerRef}
            tabIndex={-1}
            className="p-4 bg-surface text-sm leading-relaxed text-text-primary/80 outline-none"
          >
            {answerContent}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onAnswer?.("got-it")}
              className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-primary/10 text-primary border border-primary/20"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={() => {
                onAnswer?.("review");
                setRevealed(false);
              }}
              className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-warning/10 text-warning border border-warning/20"
            >
              Review again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
