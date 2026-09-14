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
  worldId: string;
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

/**
 * Deterministic per-beat display order. The authored array is canonical
 * (0=cooperate..3=dominant) for the operator log, but rendering it in
 * that fixed order printed an answer key: "dominant" was always option 4,
 * bottom-right (2026-07-13 P3 audit, H1). A stable hash of the beatId
 * permutes the display so the strong option moves per beat but never
 * jumps between visits; choices stay recorded by stance label, so the
 * shuffle changes nothing downstream.
 */
function displayOrder(beatId: string): number[] {
  // FNV-1a + xorshift mixing. The first draft used a plain LCG with
  // low-bit modulo, whose short low-bit cycles parked "dominant" at the
  // same position for every beat - an answer key that had merely moved
  // (caught by the 2026-07-13 P3 round-3 audit). Verified: the four
  // strong option is no longer parked at a single position across the
  // shipped beats (two of four share one; the unit test pins >1 distinct
  // position), and the distribution is ~uniform over 4,000 synthetic ids.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < beatId.length; i++) {
    h = ((h ^ beatId.charCodeAt(i)) * 16777619) >>> 0;
  }
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    h = ((h ^ (h >>> 13)) * 2246822519) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    const j = (h >>> 8) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function BossBeat({
  beatId,
  worldId,
  lessonId,
  prompt,
  options,
  timeoutSeconds = 30,
}: BossBeatProps) {
  const [priorChoice, setPriorChoice] = useState<BossBeatChoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
  // The clock ran out before the learner chose. Nothing is recorded on
  // their behalf: the beat stays playable and names the stance the bridge
  // takes on silence, so a slow reader is never credited with a choice they
  // did not make (2026-09-13, plan item 4: the old timer auto-selected).
  const [timedOut, setTimedOut] = useState(false);
  const [submittedIndex, setSubmittedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  // Load prior choice once on mount; if found, render the consequence inline
  // and skip the timer.
  useEffect(() => {
    let active = true;
    getBossBeatChoice(beatId)
      .then((c) => {
        if (active) {
          setPriorChoice(c);
          if (!c) {
            startedAtRef.current = Date.now();
          }
        }
      })
      // `setLoading(false)` used to live only inside `.then()`, so any
      // rejection left the component stuck on "Loading beat…" permanently.
      // Treat a failed lookup as "no prior choice" and let the learner play
      // the beat - over-offering is recoverable, a dead component is not.
      .catch(() => {
        if (active && !startedAtRef.current) {
          startedAtRef.current = Date.now();
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [beatId]);

  // Countdown, only ticks when no prior choice and not already submitted.
  useEffect(() => {
    if (loading || priorChoice || submittedIndex !== null) return;
    if (secondsLeft <= 0) {
      if (!timedOut) setTimedOut(true);
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
    // `setSubmittedIndex(idx)` used to run HERE, before the await. Combined
    // with the `submittedIndex !== null` guard above, that meant a failed
    // save was indistinguishable from a successful one: the beat rendered
    // its consequence, the guard permanently blocked retry, and the choice
    // was never recorded. It looked saved and never was - the worst failure
    // shape available, because the learner has no reason to suspect it.
    //
    // The state now advances only after the write resolves. A rejection
    // leaves the beat playable so the learner can choose again.
    const opt = options[idx];
    try {
      await recordBossBeatChoice({
        worldId,
        lessonId,
        beatId,
        choiceIndex: idx,
        choiceLabel: opt.label,
        reactionMs: reactionMs(),
      });
      setSubmittedIndex(idx);
    } catch {
      // Leave submittedIndex null: the beat stays interactive and retryable.
    } finally {
      setSubmitting(false);
    }
  }

  // The stance the bridge takes when nobody answers: the explicit non-choice
  // IS a strategy in game-theoretic terms, so the beat names it once the
  // clock is out. It is shown, never submitted for the learner.
  const silenceIndex = (() => {
    const idx = options.findIndex((o) => o.label === TIMEOUT_LABEL);
    return idx >= 0 ? idx : Math.min(2, options.length - 1);
  })();

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
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary">
          Boss beat · {timedOut ? "clock out" : `${secondsLeft}s`}
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
      {timedOut && (
        <p
          className="text-sm font-mono text-text-muted mb-4"
          data-testid="boss-beat-silence"
        >
          Clock out. On silence the bridge goes with{" "}
          {options[silenceIndex].display}. Choose, or let it stand: nothing is
          recorded until you do.
        </p>
      )}
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayOrder(beatId).map((i, displayIdx) => {
          const opt = options[i];
          return (
            <li key={opt.label}>
              <button
                type="button"
                onClick={() => handleChoice(i)}
                disabled={submitting}
                className="w-full text-left p-4 border border-border bg-surface hover:bg-primary/10 hover:border-primary/40 transition-colors disabled:opacity-50"
                data-testid={`boss-beat-option-${opt.label}`}
              >
                <span className="block text-[9px] font-mono uppercase tracking-[2px] text-text-muted mb-1">
                  Option {displayIdx + 1}
                </span>
                <span className="block text-sm font-semibold text-text-primary">
                  {opt.display}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
