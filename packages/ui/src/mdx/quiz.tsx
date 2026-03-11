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
    <div
      className="rounded-[14px] p-6 my-6"
      style={{
        background: "var(--tc-surface, #0F1320)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <h3
        className="text-base font-semibold mb-2"
        style={{ color: "var(--tc-text, #fff)" }}
      >
        Quick Check
      </h3>
      <p
        className="text-[15px] mb-4"
        style={{ color: "rgba(255,255,255,0.8)" }}
      >
        {question}
      </p>

      <div className="flex flex-col gap-2">
        {options.map((option, i) => {
          let borderColor = "rgba(255,255,255,0.06)";
          let bg = "transparent";

          if (submitted && i === selected) {
            borderColor = isCorrect ? "#00D4FF" : "#FF4466";
            bg = isCorrect ? "rgba(0,212,255,0.08)" : "rgba(255,68,102,0.08)";
          } else if (i === selected) {
            borderColor = "var(--tc-accent, #00D4FF)";
          }

          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setSelected(i)}
              className="flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
              style={{
                border: `1px solid ${borderColor}`,
                background: bg,
              }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                style={{
                  borderColor:
                    i === selected
                      ? "var(--tc-accent, #00D4FF)"
                      : "rgba(255,255,255,0.15)",
                }}
              >
                {i === selected && (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: "var(--tc-accent, #00D4FF)" }}
                  />
                )}
              </div>
              <span
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
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
            className="px-4 py-2 rounded-full text-sm font-medium transition-opacity"
            style={{
              background: "var(--tc-accent, #00D4FF)",
              color: "#000",
              opacity: selected === null ? 0.4 : 1,
            }}
          >
            Check Answer
          </button>
        ) : (
          <>
            <span
              className="text-sm font-medium"
              style={{ color: isCorrect ? "#00D4FF" : "#FF4466" }}
            >
              {isCorrect ? "Correct!" : "Not quite — try again"}
            </span>
            {!isCorrect && (
              <button
                onClick={handleReset}
                className="text-sm underline"
                style={{ color: "var(--tc-muted, #8B92A5)" }}
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
