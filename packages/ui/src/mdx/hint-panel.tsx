"use client";

import { useState } from "react";

interface Hint {
  level: "nudge" | "guidance" | "solution";
  content: string;
}

interface HintPanelProps {
  hints: Hint[] | undefined;
}

const levelConfig = {
  nudge: { label: "Nudge", color: "#00D4FF", icon: "💡" },
  guidance: { label: "Guidance", color: "#7B68EE", icon: "🧭" },
  solution: { label: "Solution", color: "#F0C75E", icon: "✅" },
};

export function HintPanel({ hints }: HintPanelProps) {
  const [revealedLevel, setRevealedLevel] = useState(-1);

  if (!hints || hints.length === 0) return null;

  return (
    <div
      className="rounded-[14px] p-5 my-6"
      style={{
        background: "var(--tc-surface, #0F1320)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <h4
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: "var(--tc-muted, #8B92A5)" }}
      >
        Need a hint?
      </h4>

      <div className="flex flex-col gap-3">
        {hints.map((hint, index) => {
          const config = levelConfig[hint.level];
          const isRevealed = index <= revealedLevel;
          const isNext = index === revealedLevel + 1;

          return (
            <div key={hint.level}>
              {isRevealed ? (
                <div
                  className="rounded-lg p-3"
                  style={{
                    borderLeft: `3px solid ${config.color}`,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-widest block mb-1"
                    style={{ color: config.color }}
                  >
                    {config.icon} {config.label}
                  </span>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    {hint.content}
                  </p>
                </div>
              ) : isNext ? (
                <button
                  onClick={() => setRevealedLevel(index)}
                  className="w-full text-left rounded-lg p-3 transition-colors hover:bg-white/5"
                  style={{
                    border: `1px dashed rgba(255,255,255,0.1)`,
                    color: config.color,
                  }}
                >
                  <span className="text-xs font-medium">
                    {config.icon} Reveal {config.label}
                  </span>
                </button>
              ) : (
                <div
                  className="rounded-lg p-3 opacity-40"
                  style={{
                    border: "1px dashed rgba(255,255,255,0.06)",
                    color: "var(--tc-muted, #8B92A5)",
                  }}
                >
                  <span className="text-xs">
                    {config.icon} {config.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
