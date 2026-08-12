import Link from "next/link";
import { worlds } from "@tensorcraft/worlds";
import { isLaunched, type WorldSlug } from "@tensorcraft/shared";
import type { JourneyWorldState } from "@/lib/journey-progress";

interface JourneyRingProps {
  worldStates: JourneyWorldState[];
  recommendedNext: WorldSlug | null;
  /** Show per-world progress bars (only meaningful for a signed-in learner). */
  showProgress: boolean;
}

/**
 * The five worlds rendered as one sequence — the modeled arc, not five silos.
 * Each node shows where it arrives from and leads to (the narrative ring), so
 * the collection reads as a journey. Purely presentational; state comes from
 * getJourneyState.
 */
export function JourneyRing({
  worldStates,
  recommendedNext,
  showProgress,
}: JourneyRingProps) {
  return (
    <ol className="relative space-y-4">
      {worldStates.map((t) => {
        const manifest = worlds[t.slug];
        const live = isLaunched(t.slug);
        const isNext = recommendedNext === t.slug;
        // Clamp: world_progress can carry rows for re-slugged/removed lessons
        // (tl/05 was rebuilt once already), so completedLessons can exceed
        // totalLessons. An unclamped value renders a bar wider than its track
        // and a false "Complete".
        const pct =
          t.totalLessons > 0
            ? Math.min(
                100,
                Math.round((t.completedLessons / t.totalLessons) * 100),
              )
            : 0;

        const statusLabel = t.completed
          ? "Complete"
          : t.owned
            ? "In progress"
            : live
              ? "Available"
              : "Coming soon";

        return (
          <li
            key={t.slug}
            data-testid={`journey-node-${t.slug}`}
            data-recommended={isNext ? "true" : undefined}
            className="brutalist-shadow border bg-surface-raised p-5 tc-world-card"
            style={
              {
                borderColor: isNext ? "var(--tc-primary)" : "var(--tc-border)",
                borderLeftWidth: isNext ? 4 : 1,
                "--card-primary": manifest?.palette.primary,
                "--card-primary-light": manifest?.paletteLight.primary,
              } as React.CSSProperties
            }
          >
            <div className="flex items-start gap-4">
              <span
                className="shrink-0 font-mono text-sm font-bold w-8 h-8 flex items-center justify-center border"
                style={{
                  color: "var(--card-active-primary)",
                  borderColor: "var(--card-active-primary)",
                }}
                aria-hidden="true"
              >
                {String(t.position + 1).padStart(2, "0")}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-mono font-bold text-text-primary">
                    {manifest?.displayName ?? t.slug}
                  </h2>
                  {isNext ? (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-primary text-on-primary">
                      Recommended next
                    </span>
                  ) : null}
                  <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
                    {statusLabel}
                  </span>
                </div>

                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                  {manifest?.tagline}
                </p>

                {showProgress && (t.owned || t.completedLessons > 0) ? (
                  <div className="mt-3">
                    <div
                      className="h-1.5 w-full bg-surface"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${manifest?.displayName} progress`}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: "var(--card-active-primary)",
                        }}
                      />
                    </div>
                    <p className="text-[11px] font-mono text-text-muted mt-1">
                      {t.completedLessons} / {t.totalLessons} lessons
                    </p>
                  </div>
                ) : null}

                <div className="mt-3">
                  <Link
                    href={`/worlds/${t.slug}`}
                    className="text-xs font-mono font-semibold uppercase tracking-wider text-primary hover:underline underline-offset-4"
                  >
                    {t.completed
                      ? "Revisit →"
                      : t.owned
                        ? "Continue →"
                        : live
                          ? "Start →"
                          : "Join waitlist →"}
                  </Link>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
