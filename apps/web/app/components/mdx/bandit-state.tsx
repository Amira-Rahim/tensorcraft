"use client";

import { useEffect, useState } from "react";
import {
  getBanditStateSummary,
  type BanditStateSummary,
} from "@/lib/review-client";

interface BanditStateProps {
  /** Theme to summarize. Defaults to "terra-grid" (where bandit lesson lives). */
  themeId?: string;
}

/**
 * Renders the user's live ε-greedy bandit state for their review queue.
 *
 * Lives inside the bandit lesson's "You're Inside a Bandit Right Now"
 * section, making the lesson self-referential — the algorithm being taught
 * is the algorithm scheduling the user's own recall.
 *
 * Anonymous / first-time users see a fallback explainer.
 */
export function BanditState({ themeId = "terra-grid" }: BanditStateProps) {
  const [state, setState] = useState<BanditStateSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getBanditStateSummary(themeId).then((s) => {
      if (active) {
        setState(s);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [themeId]);

  if (loading) {
    return (
      <div
        className="my-6 p-5 brutalist-shadow bg-surface-raised border border-border"
        aria-busy="true"
      >
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted mb-3">
          Your bandit state · loading…
        </p>
        <div className="h-20 opacity-30 bg-surface" />
      </div>
    );
  }

  if (!state || state.totalArms === 0) {
    return (
      <div
        className="my-6 p-5 brutalist-shadow bg-surface-raised border border-border"
        data-testid="bandit-state-empty"
      >
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary mb-3">
          Your bandit state · empty
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          You haven&apos;t completed any lessons yet, so the bandit has no arms
          to choose between. Once you finish a lesson, it joins your review
          queue 24h later — and the ε = 0.15 selector starts deciding which
          lesson to resurface.
        </p>
      </div>
    );
  }

  const successRate =
    state.totalPulls === 0
      ? 0
      : Math.round((state.totalSuccesses / state.totalPulls) * 100);

  return (
    <div
      className="my-6 p-5 brutalist-shadow bg-surface-raised border border-border"
      data-testid="bandit-state"
    >
      <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary mb-3">
        Your bandit state · live
      </p>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
        <Stat label="ε" value={state.epsilon.toFixed(2)} />
        <Stat label="Arms" value={String(state.totalArms)} />
        <Stat label="Pulls" value={String(state.totalPulls)} />
        <Stat label="Recall" value={`${successRate}%`} />
      </dl>
      <p className="text-xs font-mono text-text-muted">
        {state.dueCount > 0
          ? `${state.dueCount} due now — same algorithm above is selecting which lesson to resurface.`
          : "No lessons due right now. The selector will fire again once next_review_at elapses."}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-mono uppercase tracking-[2px] text-text-muted">
        {label}
      </dt>
      <dd className="text-xl font-mono font-bold text-text-primary mt-0.5">
        {value}
      </dd>
    </div>
  );
}
