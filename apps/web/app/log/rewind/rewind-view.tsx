"use client";

import { useState, type ReactNode } from "react";
import { recordCounterfactual } from "@/lib/counterfactual-client";

export interface RewindAlternate {
  choiceIndex: number;
  choiceLabel: string;
  headline: string;
  timeline: string;
}

export interface RewindCandidate {
  themeId: string;
  decisionNode: string;
  lessonId: string;
  originalLabel: string;
  originalChoiceIndex: number;
  originalChoiceLabel: string;
  alternates: RewindAlternate[];
}

interface PriorRewind {
  decisionNode: string;
  alternateChoiceIndex: number;
  rewoundAt: string;
}

interface RewindViewProps {
  themeId: string;
  themeName: string;
  themePrimary: string;
  candidates: RewindCandidate[];
  priorRewind: PriorRewind | null;
  backLink: ReactNode;
}

export function RewindView({
  themeId,
  themeName,
  themePrimary,
  candidates,
  priorRewind,
  backLink,
}: RewindViewProps) {
  const [revealed, setRevealed] = useState<{
    decisionNode: string;
    alt: RewindAlternate;
  } | null>(priorRewind ? findAlternate(candidates, priorRewind) : null);
  const [submitting, setSubmitting] = useState(false);

  async function handleReveal(c: RewindCandidate, alt: RewindAlternate) {
    if (revealed || submitting) return;
    setSubmitting(true);
    const ok = await recordCounterfactual({
      themeId: c.themeId,
      lessonId: c.lessonId,
      decisionNode: c.decisionNode,
      originalChoiceIndex: c.originalChoiceIndex,
      alternateChoiceIndex: alt.choiceIndex,
    });
    setSubmitting(false);
    if (ok || revealed === null) {
      setRevealed({ decisionNode: c.decisionNode, alt });
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12" data-testid="rewind-page">
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted mb-2">
          Rewind · {themeName}
        </p>
        <h1
          className="text-3xl font-bold mb-3 text-text-primary"
          style={{ color: themePrimary }}
        >
          One decision, one alternate timeline
        </h1>
        <p className="text-sm text-text-muted leading-relaxed max-w-[640px]">
          Pick one decision from your run through this theme. Watch it play out
          the other way. The counter to regret is to see what you didn&apos;t
          pick, in narrative form. One rewind per theme — the choice is
          permanent.
        </p>
      </header>

      {candidates.length === 0 && (
        <div className="p-8 brutalist-shadow bg-surface-raised border border-border text-center">
          <h2 className="text-lg font-semibold mb-2 text-text-primary">
            No rewindable decisions yet
          </h2>
          <p className="text-sm text-text-muted">
            Make at least one boss-beat call in this theme. Your choices unlock
            the alternate timelines for those moments.
          </p>
        </div>
      )}

      {candidates.length > 0 && !revealed && (
        <ol className="space-y-6">
          {candidates.map((c) => (
            <li
              key={c.decisionNode}
              data-testid={`rewind-candidate-${c.decisionNode}`}
            >
              <Candidate
                candidate={c}
                onReveal={(alt) => handleReveal(c, alt)}
                disabled={submitting}
              />
            </li>
          ))}
        </ol>
      )}

      {revealed && (
        <article
          className="p-6 brutalist-shadow bg-surface-raised border border-border"
          style={{ borderLeft: `4px solid ${themePrimary}` }}
          data-testid="rewind-revealed"
        >
          <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary mb-2">
            Alternate timeline · {revealed.alt.choiceLabel}
          </p>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {revealed.alt.headline}
          </h2>
          <p className="text-base text-text-primary leading-relaxed whitespace-pre-line">
            {revealed.alt.timeline}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted mt-6">
            Rewind spent · this theme&apos;s counter is set to 0
          </p>
        </article>
      )}

      <footer className="mt-12 flex items-center justify-between gap-4 pt-6 border-t border-border">
        {backLink}
        <span className="text-[10px] font-mono uppercase tracking-[2px] text-text-muted">
          {themeId}
        </span>
      </footer>
    </main>
  );
}

function Candidate({
  candidate,
  onReveal,
  disabled,
}: {
  candidate: RewindCandidate;
  onReveal: (alt: RewindAlternate) => void;
  disabled: boolean;
}) {
  return (
    <section className="p-5 brutalist-shadow bg-surface-raised border border-border">
      <p className="text-[10px] font-mono uppercase tracking-[2px] text-text-muted mb-2">
        Decision node · you chose: {candidate.originalChoiceLabel}
      </p>
      <h3 className="text-base font-semibold text-text-primary mb-4">
        {candidate.originalLabel}
      </h3>
      <ol className="grid grid-cols-1 gap-2">
        {candidate.alternates.map((alt) => (
          <li key={alt.choiceIndex}>
            <button
              type="button"
              onClick={() => onReveal(alt)}
              disabled={disabled}
              className="w-full text-left p-3 border border-border bg-surface hover:bg-primary/10 hover:border-primary/40 transition-colors disabled:opacity-50"
              data-testid={`rewind-alternate-${candidate.decisionNode}-${alt.choiceLabel}`}
            >
              <span className="block text-[9px] font-mono uppercase tracking-[2px] text-text-muted mb-1">
                Rewind to: {alt.choiceLabel}
              </span>
              <span className="block text-sm text-text-primary">
                {alt.headline}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function findAlternate(
  candidates: RewindCandidate[],
  prior: PriorRewind,
): { decisionNode: string; alt: RewindAlternate } | null {
  for (const c of candidates) {
    if (c.decisionNode !== prior.decisionNode) continue;
    const alt = c.alternates.find(
      (a) => a.choiceIndex === prior.alternateChoiceIndex,
    );
    if (alt) return { decisionNode: c.decisionNode, alt };
  }
  return null;
}
