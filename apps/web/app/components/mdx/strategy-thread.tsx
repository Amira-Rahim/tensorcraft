import Link from "next/link";
import { SPINES, getSpineStops } from "@tensorcraft/shared";

interface StrategyThreadProps {
  /**
   * IDs of stops in the game-theory spine to surface (e.g. "gan-game",
   * "bandit"). The stop DATA — href/title/gist/primitive — now lives in the
   * shared journey model (packages/shared/src/journey.ts, SPINES), not inline
   * here. Adding a stop, or a new theme to the spine, is a data edit; this
   * component just renders whatever the spine resolves to. That is the
   * de-siloing: the cross-theme thread is modeled once, referenced everywhere.
   */
  links: string[];
  /** Which spine these links belong to. Defaults to the game-theory spine. */
  spineId?: string;
}

/**
 * Cross-theme callout for a narrative spine. Marks lessons that build on a
 * shared primitive across themes so a learner can follow the thread.
 */
export function StrategyThread({
  links,
  spineId = "game-theory",
}: StrategyThreadProps) {
  const entries = getSpineStops(spineId, links);
  if (entries.length === 0) return null;

  const spineLabel = SPINES[spineId]?.label ?? "Strategy thread";

  return (
    <aside
      className="my-8 p-5 brutalist-shadow bg-surface-raised border border-border"
      data-testid="strategy-thread"
    >
      <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary mb-3">
        {spineLabel}
      </p>
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={entry.href}
              className="block group"
              data-testid={`strategy-thread-link-${entry.id}`}
            >
              <span className="block text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                {entry.title}
              </span>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-text-muted mt-0.5">
                {entry.primitive}
              </span>
              <span className="block text-sm text-text-muted mt-1 leading-relaxed">
                {entry.gist}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
