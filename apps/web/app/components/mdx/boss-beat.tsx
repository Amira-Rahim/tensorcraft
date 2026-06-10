"use client";

import { useEffect, useRef, useState } from "react";
import {
  getBossBeatChoice,
  recordBossBeatChoice,
  type BossBeatChoice,
  type BossBeatChoiceLabel,
} from "@/lib/boss-beat-client";

interface BossBeatOption {
  /** Game-theoretic stance label, exactly one of the 4 enum values. */
  label: BossBeatChoiceLabel;
  /** Display label shown to the user. Free text. */
  display: string;
  /** Consequence beat shown after this option is chosen. */
  consequence: string;
}

interface BossBeatProps {
  /** Globally unique identifier for this beat (e.g. 'deep-orbit-launch-1'). */
  beatId: string;
  themeId: string;
  lessonId: string;
  /** Question/setup posed to the player. */
  prompt: string;
  /**
   * Exactly 4 options, in fixed order: index 0=cooperate, 1=defect,
   * 2=random, 3=dominant. The MDX author chooses the wording but the
   * stance enum is canonical so the operator log can categorize.
   */
  options: [BossBeatOption, BossBeatOption, BossBeatOption, BossBeatOption];
  /** Seconds the player has before timeout. Defaults to 30. */
  timeoutSeconds?: number;
}

const TIMEOUT_LABEL: BossBeatChoiceLabel = "random";

export function BossBeat({
  beatId,
  themeId,
  lessonId,
  prompt,
  options,
  timeoutSeconds = 30,
}: BossBeatProps) {
  const [priorChoice, setPriorChoice] = useState<BossBeatChoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
  const [submittedIndex, setSubmittedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  // Load prior choice once on mount; if found, render the consequence inline
  // and skip the timer.
  useEffect(() => {
    let active = true;
    getBossBeatChoice(beatId).then((c) => {
      if (active) {
        setPriorChoice(c);
        setLoading(false);
        if (!c) {
          startedAtRef.current = Date.now();
        }
      }
    });
    return () => {
      active = false;
    };
  }, [beatId]);

  // Countdown, only ticks when no prior choice and not already submitted.
  useEffect(() => {
    if (loading || priorChoice || submittedIndex !== null) return;
    if (secondsLeft <= 0) {
      handleTimeout();
      return;
    }
    const t = window.setTimeout(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => window.clearTimeout(t);
  }, [loading, priorChoice, submittedIndex, secondsLeft]);

  function reactionMs(): number | null {
    if (!startedAtRef.current) return null;
    return Date.now() - startedAtRef.current;
  }

  async function handleChoice(idx: number) {
    if (submitting || submittedIndex !== null || priorChoice) return;
    setSubmitting(true);
    setSubmittedIndex(idx);
    const opt = options[idx];
    await recordBossBeatChoice({
      themeId,
      lessonId,
      beatId,
      choiceIndex: idx,
      choiceLabel: opt.label,
      reactionMs: reactionMs(),
    });
    setSubmitting(false);
  }

  async function handleTimeout() {
    if (submittedIndex !== null || priorChoice) return;
    // Treat timeout as "random" stance, the explicit non-choice IS a
    // strategy in game-theoretic terms.
    const idx = options.findIndex((o) => o.label === TIMEOUT_LABEL);
    const fallback = idx >= 0 ? idx : 2;
    await handleChoice(fallback);
  }

  if (loading) {
    return (
      <div
        className="my-8 p-6 brutalist-shadow bg-surface-raised border border-border"
        aria-busy="true"
        data-testid="boss-beat-loading"
      >
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted">
          Loading beat…
        </p>
      </div>
    );
  }

  // Prior choice: render the consequence inline, no timer.
  const resolvedChoice =
    priorChoice ??
    (submittedIndex !== null
      ? {
          beatId,
          choiceIndex: submittedIndex,
          choiceLabel: options[submittedIndex].label,
          reactionMs: reactionMs(),
          chosenAt: new Date().toISOString(),
        }
      : null);

  if (resolvedChoice) {
    const opt = options[resolvedChoice.choiceIndex];
    return (
      <aside
        className="my-8 p-6 brutalist-shadow bg-surface-raised border border-border"
        data-testid="boss-beat-resolved"
        data-beat-id={beatId}
        data-choice-label={resolvedChoice.choiceLabel}
        style={{ borderLeft: "4px solid var(--tc-primary)" }}
      >
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary mb-2">
          Boss beat · resolved
        </p>
        <p className="text-sm font-mono text-text-muted mb-3">
          Your call:{" "}
          <strong className="text-text-primary">{opt.display}</strong> (
          {resolvedChoice.choiceLabel})
        </p>
        <p className="text-base text-text-primary leading-relaxed">
          {opt.consequence}
        </p>
      </aside>
    );
  }

  // Active timer + 4-choice modal-style prompt.
  return (
    <aside
      className="my-8 p-6 brutalist-shadow bg-surface-raised border border-border"
      data-testid="boss-beat-active"
      data-beat-id={beatId}
      style={{ borderLeft: "4px solid var(--tc-primary)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary">
          Boss beat · {secondsLeft}s
        </p>
        <div
          className="h-1 w-32 bg-border"
          role="progressbar"
          aria-valuenow={secondsLeft}
          aria-valuemin={0}
          aria-valuemax={timeoutSeconds}
        >
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${Math.max(0, (secondsLeft / timeoutSeconds) * 100)}%`,
            }}
          />
        </div>
      </div>
      <p className="text-base text-text-primary leading-relaxed mb-5">
        {prompt}
      </p>
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <li key={opt.label}>
            <button
              type="button"
              onClick={() => handleChoice(i)}
              disabled={submitting}
              className="w-full text-left p-4 border border-border bg-surface hover:bg-primary/10 hover:border-primary/40 transition-colors disabled:opacity-50"
              data-testid={`boss-beat-option-${opt.label}`}
            >
              <span className="block text-[9px] font-mono uppercase tracking-[2px] text-text-muted mb-1">
                Option {i + 1} · {opt.label}
              </span>
              <span className="block text-sm font-semibold text-text-primary">
                {opt.display}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
