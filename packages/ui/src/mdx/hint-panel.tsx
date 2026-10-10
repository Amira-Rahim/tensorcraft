"use client";

import { useRef, useState, type RefObject } from "react";
import { InstructionText } from "./instruction-text";

export interface Hint {
  level: "nudge" | "guidance" | "solution";
  content: string;
}

interface HintPanelProps {
  hints: Hint[] | undefined;
  presentation?: "ladder" | "inline";
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

/** The challenge workspace's words for a revealed rung and for the next. */
const RUNG_TITLE: Record<Hint["level"], string> = {
  nudge: "A nudge",
  guidance: "More guidance",
  solution: "The solution",
};
const NEXT_LABEL: Record<Hint["level"], string> = {
  nudge: "Get a nudge",
  guidance: "Get more guidance",
  solution: "Reveal solution",
};

export interface HintLadder {
  hints: Hint[];
  /** Index of the last revealed rung; -1 before the first reveal. */
  revealedLevel: number;
  /** The rung the next reveal shows, while one is left. */
  next: Hint | undefined;
  reveal: () => void;
  /** Focus target: the rung revealed last. */
  revealedRef: RefObject<HTMLDivElement | null>;
}

/**
 * One ladder's state. HintPanel renders it as one block; the challenge
 * workspace renders its rungs and its button in different places of the
 * editor footer (spec 2026-10-10, section 5 item 5).
 */
export function useHintLadder(
  hints: Hint[] | undefined,
  onHintRevealed?: (hintLevel: 1 | 2 | 3) => void,
): HintLadder {
  const [revealedLevel, setRevealedLevel] = useState(-1);
  const revealedRef = useRef<HTMLDivElement | null>(null);
  const list = hints ?? [];
  const next = list[revealedLevel + 1];
  const reveal = () => {
    if (!next) return;
    setRevealedLevel(revealedLevel + 1);
    onHintRevealed?.(HINT_LEVEL_TO_INDEX[next.level]);
    // After paint, move focus onto the revealed hint. The button that was
    // just pressed may no longer exist, so without this focus resets to
    // <body> and a keyboard user has to tab from the top of the document.
    requestAnimationFrame(() => revealedRef.current?.focus());
  };
  return { hints: list, revealedLevel, next, reveal, revealedRef };
}

/*
  Revealing a hint replaced the button with its own result in the same
  commit. Focus fell to <body>, and nothing announced, so a screen reader
  user pressed "Reveal Nudge", heard silence, and had no way to find the
  text they had just asked for. Across all 56 lessons.

  Two fixes, matching the model in exercise.tsx: an ALWAYS-MOUNTED live
  region (a region created in the same commit as its content is not
  reliably announced), plus focus moved onto the revealed panel. WCAG 4.1.3
  and 2.4.3.

  The region announces the EVENT only, never the hint text. Focus lands on
  the hint itself, so repeating the content here would make a screen reader
  read it twice: once from the announcement, again on arrival.
*/
function RevealAnnouncer({ ladder }: { ladder: HintLadder }) {
  const revealed =
    ladder.revealedLevel >= 0 ? ladder.hints[ladder.revealedLevel] : undefined;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {revealed ? `${levelConfig[revealed.level].label} revealed.` : ""}
    </div>
  );
}

function HintBody({ hint, className }: { hint: Hint; className: string }) {
  return hint.level === "solution" ? (
    // Solution hints are code excerpts by convention (Gate B: the hint is an
    // excerpt of solutionCode). Rendering them as a wrapped sans-serif
    // paragraph made the longest one a 1,031-char unbroken line of
    // prose-styled code (fresh-eyes rerun T1-15). Monospace, preserved
    // whitespace, scroll.
    <pre className="text-[13px] leading-relaxed text-text-primary/90 font-mono whitespace-pre-wrap break-words overflow-x-auto m-0">
      <code>{hint.content}</code>
    </pre>
  ) : (
    // Guidance hints are authored prose with the same backticks, lists and
    // line breaks the instructions use, so they share the instructions'
    // renderer (2026-09-13).
    <InstructionText text={hint.content} className={className} />
  );
}

function QuestionIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 1.5-2.5 3" />
      <path d="M12 16h.01" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function HintPanel({
  hints,
  onHintRevealed,
  presentation = "ladder",
}: HintPanelProps) {
  const inline = presentation === "inline";
  const ladder = useHintLadder(hints, onHintRevealed);
  if (ladder.hints.length === 0) return null;

  return (
    <div
      className={
        inline
          ? "challenge-hints"
          : "p-5 my-6 brutalist-shadow bg-surface-raised border border-border"
      }
    >
      <RevealAnnouncer ladder={ladder} />

      {!inline && (
        <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-4 text-text-muted">
          Need a hint?
        </h4>
      )}

      <div className="flex flex-col gap-3">
        {ladder.hints.map((hint, index) => {
          const config = levelConfig[hint.level];
          const isRevealed = index <= ladder.revealedLevel;
          const isNext = index === ladder.revealedLevel + 1;
          if (inline && !isRevealed && !isNext) return null;

          return (
            <div key={hint.level}>
              {isRevealed ? (
                <div
                  // tabIndex -1 keeps this out of the tab sequence while
                  // still being programmatically focusable, so the reader
                  // lands on the hint it just asked for rather than <body>.
                  ref={
                    index === ladder.revealedLevel
                      ? ladder.revealedRef
                      : undefined
                  }
                  tabIndex={index === ladder.revealedLevel ? -1 : undefined}
                  className={
                    inline
                      ? "challenge-hint-content"
                      : "p-3 bg-surface outline-none"
                  }
                >
                  <span
                    className={
                      inline
                        ? "challenge-hint-title"
                        : "text-xs font-mono font-semibold uppercase tracking-widest block mb-1"
                    }
                    style={inline ? undefined : { color: config.color }}
                  >
                    {inline ? RUNG_TITLE[hint.level] : config.label}
                  </span>
                  <HintBody
                    hint={hint}
                    className="text-sm leading-relaxed text-text-primary/80"
                  />
                </div>
              ) : isNext ? (
                <button
                  onClick={ladder.reveal}
                  className={
                    inline
                      ? "challenge-hint-action"
                      : "w-full text-left p-3 transition-colors duration-100 hover:bg-surface border border-dashed border-border brutalist-hover"
                  }
                  style={inline ? undefined : { color: config.color }}
                >
                  {inline && <QuestionIcon />}
                  <span className={inline ? undefined : "text-xs font-medium"}>
                    {inline
                      ? NEXT_LABEL[hint.level]
                      : `Reveal ${config.label} →`}
                  </span>
                </button>
              ) : (
                // opacity-40 rendered the locked label at 2.31:1, and the
                // opacity-75 that replaced it still failed in the light
                // scheme (#555555 at 75% over white computes to #808080,
                // 3.94:1, axe, 2026-07-23). WCAG 1.4.3 arguably exempts an
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

/**
 * The challenge workspace's revealed rungs, with the ladder's live region.
 * Renders while the ladder has hints, so the region is mounted before the
 * first reveal.
 */
export function HintRungs({ ladder }: { ladder: HintLadder }) {
  if (ladder.hints.length === 0) return null;
  return (
    <div className="challenge-hints">
      <RevealAnnouncer ladder={ladder} />
      {ladder.hints.slice(0, ladder.revealedLevel + 1).map((hint, index) => (
        <div
          key={hint.level}
          ref={index === ladder.revealedLevel ? ladder.revealedRef : undefined}
          tabIndex={index === ladder.revealedLevel ? -1 : undefined}
          className="challenge-hint-content"
        >
          <span className="challenge-hint-title">{RUNG_TITLE[hint.level]}</span>
          <HintBody
            hint={hint}
            className="text-sm leading-relaxed text-text-primary/80"
          />
        </div>
      ))}
    </div>
  );
}

/** The workspace's next-rung button. Renders nothing once the ladder is spent. */
export function HintButton({ ladder }: { ladder: HintLadder }) {
  if (!ladder.next) return null;
  return (
    <button
      type="button"
      onClick={ladder.reveal}
      className="challenge-hint-action"
    >
      <QuestionIcon />
      <span>{NEXT_LABEL[ladder.next.level]}</span>
    </button>
  );
}
