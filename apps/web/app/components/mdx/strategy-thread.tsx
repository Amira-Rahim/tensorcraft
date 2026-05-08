import Link from "next/link";

interface ThreadEntry {
  id: string;
  href: string;
  title: string;
  gist: string;
  primitive: string;
}

const THREAD: Record<string, ThreadEntry> = {
  "gan-game": {
    id: "gan-game",
    href: "/themes/nova-canvas/generative-adversarial-networks/the-gan-game",
    title: "The GAN Game",
    gist: "Generator vs discriminator — minimax saddle point.",
    primitive: "Minimax · non-cooperative",
  },
  bandit: {
    id: "bandit",
    href: "/themes/terra-grid/ab-testing/multi-armed-bandits",
    title: "Multi-armed bandits",
    gist: "Explore vs exploit — regret minimization under uncertainty.",
    primitive: "Regret · sequential",
  },
};

interface StrategyThreadProps {
  /**
   * IDs of related lessons in the game-theory curriculum spine.
   * Currently: "gan-game" | "bandit".
   */
  links: string[];
}

/**
 * Cross-theme callout for the game-theory curriculum spine. Marks lessons
 * that build on a shared GT primitive (minimax, regret, etc.) so a learner
 * can follow the thread across themes.
 */
export function StrategyThread({ links }: StrategyThreadProps) {
  const entries = links
    .map((id) => THREAD[id])
    .filter((e): e is ThreadEntry => Boolean(e));

  if (entries.length === 0) return null;

  return (
    <aside
      className="my-8 p-5 brutalist-shadow bg-surface-raised border border-border"
      data-testid="strategy-thread"
    >
      <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary mb-3">
        Strategy thread · game-theory spine
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
