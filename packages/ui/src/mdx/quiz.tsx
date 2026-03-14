"use client";

import { useState } from "react";

interface QuizOption {
  text: string;
  correct?: boolean;
}

interface QuizProps {
  question: string;
  options: QuizOption[];
}

export function Quiz({ question, options }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected !== null && options[selected]?.correct === true;

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
  }

  function handleReset() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <div className="p-6 my-6 brutalist-shadow bg-surface-raised border border-border">
      <h3 className="text-base font-semibold mb-2 text-text-primary">
        Quick Check
      </h3>
      <p className="text-[15px] mb-4 text-text-primary/80">{question}</p>

      <div className="flex flex-col gap-2">
        {options.map((option, i) => {
          let borderClass = "border-border";
          let bgClass = "bg-transparent";

          if (submitted && i === selected) {
            if (isCorrect) {
              borderClass = "border-primary";
              bgClass = "bg-primary/10";
            } else {
              borderClass = "border-red-400";
              bgClass = "bg-red-400/10";
            }
          } else if (i === selected) {
            borderClass = "border-primary";
          }

          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-3 p-3 text-left transition-colors border ${borderClass} ${bgClass}`}
            >
              <div
                className={`w-5 h-5 border-2 flex-shrink-0 flex items-center justify-center ${
                  i === selected ? "border-primary" : "border-border"
                }`}
              >
                {i === selected && <div className="w-2.5 h-2.5 bg-primary" />}
              </div>
              <span className="text-sm text-text-primary/80">
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className="px-4 py-2 text-sm font-mono font-medium bg-primary text-surface border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover disabled:opacity-40"
          >
            Check Answer
          </button>
        ) : (
          <>
            <span
              className={`text-sm font-medium ${isCorrect ? "text-primary" : "text-red-400"}`}
            >
              {isCorrect ? "Correct!" : "Not quite — try again"}
            </span>
            {!isCorrect && (
              <button
                onClick={handleReset}
                className="text-sm underline text-text-muted"
              >
                Retry
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
