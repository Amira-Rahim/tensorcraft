"use client";

import { useEffect, useRef, useState } from "react";
import { STORY_HISTORY } from "@tensorcraft/shared";
import {
  BOSS_BEAT_CHANGED,
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
  contentVersion?: number;
  /** Reflective decisions can omit the scene clock without changing saving. */
  showTimer?: boolean;
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
  contentVersion = 1,
  showTimer = true,
}: BossBeatProps) {
  const [priorChoice, setPriorChoice] = useState<BossBeatChoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
  // The clock ran out before the learner chose. Nothing is recorded on
  // their behalf: the beat stays playable and names the stance the bridge
  // takes on silence, so a slow reader is never credited with a choice they
  // did not make (2026-09-13, plan item 4: the old timer auto-selected).
  const [timedOut, setTimedOut] = useState(false);
  const [submittedIndex, setSubmittedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const generation = useRef(0);

  // Load prior choice once on mount; if found, render the consequence inline
  // and skip the timer.
  useEffect(() => {
    let active = true;
    generation.current += 1;
    setSubmitting(false);
    setLoading(true);
    setLoadError(false);
    setPriorChoice(null);
    setSubmittedIndex(null);
    setSecondsLeft(timeoutSeconds);
    setTimedOut(false);
    setSaveError(false);
    getBossBeatChoice(beatId)
      .then((c) => {
        if (active) {
          setPriorChoice(c);
          if (!c) {
            startedAtRef.current = Date.now();
          }
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      generation.current += 1;
    };
  }, [beatId, loadAttempt, timeoutSeconds, contentVersion]);

  // Countdown, only ticks when no prior choice and not already submitted.
  useEffect(() => {
    if (
      !showTimer ||
      loading ||
      loadError ||
      priorChoice ||
      submittedIndex !== null
    )
      return;
    if (secondsLeft <= 0) {
      if (!timedOut) setTimedOut(true);
      return;
    }
    const t = window.setTimeout(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => window.clearTimeout(t);
  }, [
    showTimer,
    loading,
    loadError,
    priorChoice,
    submittedIndex,
    secondsLeft,
    timedOut,
  ]);

  function reactionMs(): number | null {
    if (!startedAtRef.current) return null;
    return Date.now() - startedAtRef.current;
  }

  async function handleChoice(idx: number) {
    if (submitting || submittedIndex !== null || priorChoice) return;
    setSubmitting(true);
    setSaveError(false);
    const opt = options[idx];
    const startedGeneration = generation.current;
    try {
      const inserted = await recordBossBeatChoice({
        worldId,
        lessonId,
        beatId,
        choiceIndex: idx,
        choiceLabel: opt.label,
        reactionMs: reactionMs(),
        contentVersion,
      });
      // First write wins, including a choice submitted from another tab.
      const saved = inserted ? null : await getBossBeatChoice(beatId);
      if (!inserted && !saved) throw new Error("Saved choice was not returned");
      window.dispatchEvent(
        new CustomEvent(BOSS_BEAT_CHANGED, { detail: beatId }),
      );
      if (generation.current === startedGeneration) {
        if (inserted) setSubmittedIndex(idx);
        else setPriorChoice(saved);
      }
    } catch {
      if (generation.current === startedGeneration) setSaveError(true);
    } finally {
      if (generation.current === startedGeneration) setSubmitting(false);
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

  if (loadError) {
    return (
      <aside
        className="my-8 p-6 bg-surface-raised border border-border"
        role="alert"
      >
        <p>
          We could not load your saved choice. Retry before making this call.
        </p>
        <button
          type="button"
          className="border border-border px-4 py-2"
          onClick={() => setLoadAttempt((n) => n + 1)}
        >
          Retry loading choice
        </button>
      </aside>
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
          contentVersion,
        }
      : null);

  if (resolvedChoice) {
    const savedVersion = resolvedChoice.contentVersion ?? 1;
    const historical = savedVersion !== contentVersion;
    const opt = historical
      ? STORY_HISTORY[beatId]?.[savedVersion]?.options[
          resolvedChoice.choiceIndex
        ]
      : options[resolvedChoice.choiceIndex];
    if (!opt)
      return (
        <aside role="status" className="my-8 border border-border p-6">
          Your decision is saved with a different version of this scene. Reload
          to get its matching text. The saved call has not changed.
        </aside>
      );
    return (
      <aside
        className="my-8 p-6 brutalist-shadow bg-surface-raised border border-border"
        data-testid="boss-beat-resolved"
        data-beat-id={beatId}
        data-choice-label={resolvedChoice.choiceLabel}
        data-content-version={savedVersion}
      >
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary mb-2">
          Decision saved
        </p>
        {historical && (
          <p className="mb-3 text-sm text-text-muted">
            Your earlier call, from version {savedVersion}. The scene has been
            revised; your original choice is preserved.
          </p>
        )}
        <p className="text-sm font-mono text-text-muted mb-3">
          Your call:{" "}
          <strong className="text-text-primary">{opt.display}</strong>
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
          Decision
          {showTimer
            ? ` · ${timedOut ? "clock out" : `${secondsLeft}s`}`
            : " · take your time"}
        </p>
        {showTimer && (
          <div
            className="h-1 w-32 bg-border"
            role="progressbar"
            aria-label="Scene countdown"
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
        )}
      </div>
      <p className="text-base text-text-primary leading-relaxed mb-5">
        {prompt}
      </p>
      {/* Always mounted so the clock-out note is announced when it lands
          (round 7b, 2026-09-14), the way recall-prompt announces a reveal.
          The sentence is about a default, not about silence acting: on
          three of the four beats the standing option is an affirmative
          action, so "on silence the bridge goes with X" read as if saying
          nothing did something. */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          timedOut ? "text-sm font-mono text-text-muted mb-4" : "sr-only"
        }
        data-testid="boss-beat-silence"
      >
        {timedOut
          ? `Clock out. Nothing is recorded. The standing proposal is: ${options[silenceIndex].display}. Choose when ready.`
          : ""}
      </p>
      {saveError && (
        <p role="alert" className="mb-4 text-sm">
          We could not confirm that your choice was saved. Check your connection
          and sign-in, then choose again.
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
