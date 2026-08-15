"use client";

import { useRef, useState } from "react";

interface Hint {
  level: "nudge" | "guidance" | "solution";
  content: string;
}

interface HintPanelProps {
  hints: Hint[] | undefined;
  /**
   * Called when the user reveals a hint tier. The consumer wires this up
   * to analytics, kept here as a pure callback so the UI package has no
   * PostHog dependency (Session 8b rule).
   */
  onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
}

const HINT_LEVEL_TO_INDEX: Record<Hint["level"], 1 | 2 | 3> = {
  nudge: 1,
  guidance: 2,
  solution: 3,
};

const levelConfig = {
  nudge: { label: "Nudge", color: "var(--tc-tier-identity)" },
  guidance: { label: "Guidance", color: "var(--tc-tier-structural)" },
  solution: { label: "Solution", color: "var(--tc-tier-intuition)" },
};

export function HintPanel({ hints, onHintRevealed }: HintPanelProps) {
  const [revealedLevel, setRevealedLevel] = useState(-1);
  // Focus target for the hint that was just revealed.
  const revealedRef = useRef<HTMLDivElement | null>(null);
  if (!hints || hints.length === 0) return null;

  const justRevealed = revealedLevel >= 0 ? hints[revealedLevel] : undefined;

  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      {/*
        Revealing a hint replaced the button with its own result in the same
        commit. Focus fell to <body>, and nothing announced - so a screen
        reader user pressed "Reveal Nudge", heard silence, and had no way to
        find the text they had just asked for. Across all 56 lessons.

        Two fixes, matching the model in exercise.tsx: an ALWAYS-MOUNTED live
        region (a region created in the same commit as its content is not
        reliably announced), plus focus moved onto the revealed panel.
        WCAG 4.1.3 and 2.4.3.

        The region announces the EVENT only, never the hint text. Focus lands
        on the hint itself, so repeating the content here would make a screen
        reader read it twice - once from the announcement, again on arrival.
      */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {justRevealed
          ? `${levelConfig[justRevealed.level].label} revealed.`
          : ""}
      </div>

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
                  // tabIndex -1 keeps this out of the tab sequence while
                  // still being programmatically focusable, so the reader
                  // lands on the hint it just asked for rather than <body>.
                  ref={index === revealedLevel ? revealedRef : undefined}
                  tabIndex={index === revealedLevel ? -1 : undefined}
                  className="p-3 bg-surface outline-none"
                  style={{
                    borderLeft: `3px solid ${config.color}`,
                  }}
                >
                  <span
                    className="text-xs font-mono font-semibold uppercase tracking-widest block mb-1"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </span>
                  {hint.level === "solution" ? (
                    // Solution hints are code excerpts by convention (Gate B:
                    // hint ⊆ solutionCode). Rendering them as a wrapped
                    // sans-serif paragraph made the longest one a 1,031-char
                    // unbroken line of prose-styled code (fresh-eyes rerun
                    // T1-15). Monospace + preserved whitespace + scroll.
                    <pre className="text-[13px] leading-relaxed text-text-primary/90 font-mono whitespace-pre-wrap break-words overflow-x-auto m-0">
                      <code>{hint.content}</code>
                    </pre>
                  ) : (
                    <p className="text-sm leading-relaxed text-text-primary/80">
                      {hint.content}
                    </p>
                  )}
                </div>
              ) : isNext ? (
                <button
                  onClick={() => {
                    setRevealedLevel(index);
                    onHintRevealed?.(HINT_LEVEL_TO_INDEX[hint.level]);
                    // After paint, move focus onto the revealed hint. The
                    // button that was just pressed no longer exists, so
                    // without this focus resets to <body> and a keyboard user
                    // has to tab from the top of the document again.
                    requestAnimationFrame(() => revealedRef.current?.focus());
                  }}
                  className="w-full text-left p-3 transition-colors duration-100 hover:bg-surface border border-dashed border-border brutalist-hover"
                  style={{
                    color: config.color,
                  }}
                >
                  <span className="text-xs font-medium">
                    Reveal {config.label} →
                  </span>
                </button>
              ) : (
                // opacity-40 rendered the locked label at 2.31:1, and the
                // opacity-75 that replaced it still failed in the light
                // scheme (#555555 at 75% over white computes to #808080,
                // 3.94:1 - axe, 2026-07-23). WCAG 1.4.3 arguably exempts an
                // inactive component, but the label is what tells you which
                // hint is locked, so it has to be readable. No opacity: the
                // muted token alone is AA in both schemes, and the dashed
                // border carries the locked affordance.
                <div className="p-3 border border-dashed border-border text-text-muted">
                  <span className="text-xs">{config.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
