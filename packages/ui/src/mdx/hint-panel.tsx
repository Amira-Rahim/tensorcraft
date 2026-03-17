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
  nudge: { label: "Nudge", color: "var(--tc-tier-identity)", icon: "💡" },
  guidance: {
    label: "Guidance",
    color: "var(--tc-tier-structural)",
    icon: "🧭",
  },
  solution: {
    label: "Solution",
    color: "var(--tc-tier-intuition)",
    icon: "✅",
  },
};

export function HintPanel({ hints }: HintPanelProps) {
  const [revealedLevel, setRevealedLevel] = useState(-1);
  if (!hints || hints.length === 0) return null;

  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-4 text-text-muted">
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
                  className="p-3 bg-surface"
                  style={{
                    borderLeft: `3px solid ${config.color}`,
                  }}
                >
                  <span
                    className="text-[11px] font-mono font-semibold uppercase tracking-widest block mb-1"
                    style={{ color: config.color }}
                  >
                    {config.icon} {config.label}
                  </span>
                  <p className="text-sm leading-relaxed text-text-primary/80">
                    {hint.content}
                  </p>
                </div>
              ) : isNext ? (
                <button
                  onClick={() => {
                    setRevealedLevel(index);
                  }}
                  className="w-full text-left p-3 transition-colors hover:bg-surface border border-dashed border-border brutalist-hover"
                  style={{
                    color: config.color,
                  }}
                >
                  <span className="text-xs font-medium">
                    {config.icon} Reveal {config.label}
                  </span>
                </button>
              ) : (
                <div className="p-3 opacity-40 border border-dashed border-border text-text-muted">
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
