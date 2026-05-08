"use client";

import Link from "next/link";
import type {
  OperatorLogSummary,
  ThemeOperatorStats,
  StrategyClass,
} from "@/lib/operator-log";

interface ThemeMeta {
  id: string;
  displayName: string;
  primary: string;
  owned: boolean;
  totalLessons: number;
}

interface LogViewProps {
  summary: OperatorLogSummary;
  themes: ThemeMeta[];
}

const STRATEGY_LABEL: Record<StrategyClass, string> = {
  explorer: "Explorer",
  exploiter: "Exploiter",
  balanced: "Balanced",
};

const STRATEGY_GIST: Record<StrategyClass, string> = {
  explorer:
    "You sample widely. Higher short-term regret, faster discovery of better arms.",
  exploiter:
    "You commit fast to known winners. Lower noise, risk of locking into a local optimum.",
  balanced:
    "You hold the explore/exploit tension. Standard regret-minimizing posture.",
};

/**
 * Mentor retrospective blurbs. One per theme × strategy class. 30–50 words
 * each, in the canon mentor's voice. Static templates — narrative tone is
 * the artifact, no per-user templating needed.
 */
const MENTOR_BLURB: Record<string, Record<StrategyClass, string>> = {
  "deep-orbit": {
    explorer:
      "Okafor: 'You poked the spectrum. Most operators settle on the first strong signal. You kept sampling. The anomaly map you built is wider than mine was at this stage.'",
    exploiter:
      "Okafor: 'You found a working detector and rode it. Time-series rewards confidence. Just remember the spectrum drifts — what scored last quarter may not score next.'",
    balanced:
      "Okafor: 'You moved between modes — explore, commit, recheck. The signal you ended on is steadier for it. That's the discipline this work asks of you.'",
  },
  "neon-protocol": {
    explorer:
      "Lin: 'Your gradient sampling kept finding edge cases the rest of the cell missed. We need that here. The convolutional eye gets lazy fast.'",
    exploiter:
      "Lin: 'You committed to a detector chain and held it through three escalations. That's how operators ship. Just don't sleep on retraining when the input shifts.'",
    balanced:
      "Lin: 'You read the room — explored when adversarial inputs spiked, exploited when the signal stabilized. Field-grade pacing.'",
  },
  "signal-ward": {
    explorer:
      "Dr. Amara: 'You kept asking the model to surface its uncertainty. Most operators stop at the top-1 answer. Your patient charts will be safer because you didn't.'",
    exploiter:
      "Dr. Amara: 'You found a routing policy and stuck with it. Throughput matters in triage. Just keep an audit trail — the policy you trust today is the one regulators will question tomorrow.'",
    balanced:
      "Dr. Amara: 'Your calibration matched the case mix. Rare presentations got investigation, common ones got dispatch. That's the bedside posture.'",
  },
  "nova-canvas": {
    explorer:
      "Yara: 'You let the generator wander. Most students clamp it after the third bad sample. Your latents found pockets the safe runs never reach.'",
    exploiter:
      "Yara: 'You found a style and pinned it down. There's a craft to that — the discipline of saying no. Just don't forget the wider grammar exists.'",
    balanced:
      "Yara: 'You explored the latent and harvested it. The sequence matters — most who reverse it never converge.'",
  },
  "terra-grid": {
    explorer:
      "Hassan: 'You shipped variants. Aggressive. Drift detection caught you twice. That's fine — it means the gates worked. Most operators ship one model and hope.'",
    exploiter:
      "Hassan: 'You picked a model and rolled it out. Fast, clean, monitored. That's the post-mortem we like. Now do it again with a stricter SLO.'",
    balanced:
      "Hassan: 'Edge deployment is a regret minimization problem in disguise. You played it as such. The dashboard reflects that.'",
  },
};

const DISPATCH_CROSS_THEME: Record<StrategyClass, string> = {
  explorer:
    "DISPATCH: Operator. Field assessment: you sample wide. Cumulative regret is higher in the short run, but your strategy floor is lower than peers when arms shift. Keep the posture; harden the logging.",
  exploiter:
    "DISPATCH: Operator. Field assessment: you commit. Throughput is excellent. Watch the non-stationary cases — every theme has a drift mode where exploit-only locks you out. Schedule periodic exploration windows.",
  balanced:
    "DISPATCH: Operator. Field assessment: balanced. You read the situation and respond. Sustain it. The log shows the discipline; trust it.",
};

export function LogView({ summary, themes }: LogViewProps) {
  const { perTheme, crossTheme } = summary;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12" data-testid="log-page">
      <header className="mb-12">
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted mb-2">
          Operator log · cross-theme retrospective
        </p>
        <h1 className="text-3xl font-bold mb-3 text-text-primary">
          Your strategic record
        </h1>
        <p
          className="text-sm text-text-muted leading-relaxed max-w-[680px]"
          data-testid="log-cross-strategy-summary"
        >
          {DISPATCH_CROSS_THEME[crossTheme.strategyClass]}
        </p>
        <dl
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8"
          data-testid="log-cross-stats"
        >
          <Stat label="Recalls" value={String(crossTheme.totalRecalls)} />
          <Stat
            label="Recall accuracy"
            value={
              crossTheme.totalRecalls === 0
                ? "—"
                : `${Math.round(crossTheme.overallRecallSuccessRate * 100)}%`
            }
          />
          <Stat
            label="ε-explore ratio"
            value={
              crossTheme.totalRecalls === 0
                ? "—"
                : `${Math.round(crossTheme.overallExplorationRatio * 100)}%`
            }
          />
          <Stat
            label="Strategy"
            value={STRATEGY_LABEL[crossTheme.strategyClass]}
          />
        </dl>
      </header>

      {perTheme.length === 0 && (
        <EmptyState
          title="No telemetry yet"
          body="Complete a lesson and the log will start filling in. DISPATCH will check in once there's a signal."
          ctaHref="/themes"
          ctaLabel="Browse themes"
        />
      )}

      <ol className="space-y-12">
        {perTheme.map((stats) => {
          const meta = themes.find((t) => t.id === stats.themeId);
          if (!meta) return null;
          return (
            <li key={stats.themeId} data-testid={`log-theme-${stats.themeId}`}>
              <ThemeSection stats={stats} meta={meta} />
            </li>
          );
        })}
      </ol>

      <footer className="mt-16 pt-8 border-t border-border text-center">
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted">
          {STRATEGY_GIST[crossTheme.strategyClass]}
        </p>
      </footer>
    </main>
  );
}

function ThemeSection({
  stats,
  meta,
}: {
  stats: ThemeOperatorStats;
  meta: ThemeMeta;
}) {
  const blurb =
    MENTOR_BLURB[stats.themeId]?.[stats.strategyClass] ??
    "Mentor record pending.";
  const completionPercent =
    meta.totalLessons === 0
      ? 0
      : Math.round((stats.lessonsCompleted / meta.totalLessons) * 100);

  return (
    <section
      className="p-6 brutalist-shadow bg-surface-raised border border-border"
      style={{ borderLeft: `4px solid ${meta.primary}` }}
    >
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[2px] text-text-muted">
            Theme record
          </p>
          <h2
            className="text-xl font-semibold text-text-primary"
            style={{ color: meta.primary }}
          >
            {meta.displayName}
          </h2>
        </div>
        {!meta.owned && (
          <Link
            href={`/pricing?locked=${meta.id}`}
            className="text-[10px] font-mono uppercase tracking-[2px] text-primary hover:underline"
          >
            Free tier · view full →
          </Link>
        )}
      </header>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat
          label="Lessons"
          value={`${stats.lessonsCompleted} / ${meta.totalLessons}`}
          sub={`${completionPercent}%`}
        />
        <Stat
          label="Recalls"
          value={String(stats.totalRecalls)}
          sub={
            stats.totalRecalls === 0
              ? "—"
              : `${Math.round(stats.recallSuccessRate * 100)}% accurate`
          }
        />
        <Stat
          label="ε-explore"
          value={
            stats.totalRecalls === 0
              ? "—"
              : `${Math.round(stats.explorationRatio * 100)}%`
          }
          sub={STRATEGY_LABEL[stats.strategyClass]}
        />
        <Stat
          label="Best streak"
          value={`${stats.bestStreak}d`}
          sub={
            stats.capstonePassed
              ? `Capstone ${stats.capstoneBestScore ?? "✓"}`
              : "Capstone pending"
          }
        />
      </dl>

      <p
        className="text-sm leading-relaxed text-text-muted italic mt-4"
        data-testid={`log-mentor-blurb-${stats.themeId}`}
      >
        {blurb}
      </p>

      {meta.owned && (
        <Link
          href={`/log/rewind?theme=${stats.themeId}`}
          className="inline-block mt-5 text-[10px] font-mono uppercase tracking-[2px] text-primary hover:underline"
          data-testid={`log-rewind-link-${stats.themeId}`}
        >
          Rewind one decision in this theme →
        </Link>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <dt className="text-[10px] font-mono uppercase tracking-[2px] text-text-muted">
        {label}
      </dt>
      <dd className="text-lg font-mono font-bold text-text-primary mt-0.5">
        {value}
      </dd>
      {sub && (
        <span className="block text-[10px] font-mono text-text-muted mt-0.5">
          {sub}
        </span>
      )}
    </div>
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
