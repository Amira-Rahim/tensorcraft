"use client";

import Link from "next/link";

export interface ReviewCard {
  themeId: string;
  themeName: string;
  themePrimary: string;
  moduleId: string;
  moduleName: string;
  lessonId: string;
  lessonTitle: string;
  armPulls: number;
  armSuccesses: number;
  lastReviewedAt: string | null;
  wasExplored: boolean;
}

interface ReviewQueueViewProps {
  cards: ReviewCard[];
  hasOwnedThemes: boolean;
}

export function ReviewQueueView({
  cards,
  hasOwnedThemes,
}: ReviewQueueViewProps) {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted mb-2">
          ε = 0.15 · ε-greedy bandit
        </p>
        <h1 className="text-3xl font-bold mb-3 text-text-primary">
          Review queue
        </h1>
        <p className="text-sm text-text-muted max-w-[640px] leading-relaxed">
          Lessons selected by the same ε-greedy algorithm taught in{" "}
          <Link
            href="/themes/terra-grid/ab-testing/multi-armed-bandits"
            className="text-primary underline-offset-4 hover:underline"
          >
            Terra Grid · Multi-armed bandits
          </Link>
          . 85% of slots go to the lesson with the highest forgetting score; 15%
          are explored at random. Recall outcomes update the schedule via
          SM-2-lite.
        </p>
      </header>

      {!hasOwnedThemes && (
        <EmptyState
          title="No themes purchased yet"
          body="Purchase a theme to unlock your spaced-recall queue."
          ctaHref="/pricing"
          ctaLabel="View pricing"
        />
      )}

      {hasOwnedThemes && cards.length === 0 && (
        <EmptyState
          title="Nothing due — yet"
          body="Complete a lesson and it will appear here 24h later, scheduled by the bandit."
          ctaHref="/dashboard"
          ctaLabel="Back to dashboard"
        />
      )}

      {cards.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li key={`${card.themeId}/${card.lessonId}`}>
              <ReviewCardItem card={card} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ReviewCardItem({ card }: { card: ReviewCard }) {
  const successRate =
    card.armPulls === 0
      ? null
      : Math.round((card.armSuccesses / card.armPulls) * 100);

  return (
    <Link
      href={`/review/${card.themeId}/${card.moduleId}/${card.lessonId}`}
      className="block p-5 brutalist-shadow bg-surface-raised border border-border hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
      style={{ borderLeft: `3px solid ${card.themePrimary}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-mono uppercase tracking-[2px] text-text-muted">
          {card.themeName} · {card.moduleName}
        </p>
        {card.wasExplored && (
          <span
            className="text-[9px] font-mono uppercase tracking-[2px] text-yellow-400"
            title="Selected by the explore branch (probability ε=0.15)"
          >
            ε-explore
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold mb-3 text-text-primary leading-snug">
        {card.lessonTitle}
      </h3>
      <dl className="grid grid-cols-3 gap-2 text-[11px] font-mono text-text-muted">
        <div>
          <dt className="opacity-60">Pulls</dt>
          <dd className="text-text-primary">{card.armPulls}</dd>
        </div>
        <div>
          <dt className="opacity-60">Recall</dt>
          <dd className="text-text-primary">
            {successRate === null ? "—" : `${successRate}%`}
          </dd>
        </div>
        <div>
          <dt className="opacity-60">Last seen</dt>
          <dd className="text-text-primary">
            {card.lastReviewedAt ? formatTimeAgo(card.lastReviewedAt) : "new"}
          </dd>
        </div>
      </dl>
      <p
        className="mt-4 text-[10px] font-mono uppercase tracking-[2px]"
        style={{ color: card.themePrimary }}
      >
        Recall now &rarr;
      </p>
    </Link>
  );
}

function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="p-8 brutalist-shadow bg-surface-raised border border-border text-center">
      <h2 className="text-lg font-semibold mb-2 text-text-primary">{title}</h2>
      <p className="text-sm text-text-muted mb-5 max-w-[480px] mx-auto">
        {body}
      </p>
      <Link
        href={ctaHref}
        className="inline-block px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 brutalist-hover"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
