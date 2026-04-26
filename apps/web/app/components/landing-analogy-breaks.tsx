import { BRIDGES, BRIDGE_TIER_LABELS } from "@tensorcraft/shared";

/**
 * Landing-page differentiator section: "Where every analogy ends."
 *
 * Pulls a canonical bridge that has a `breaks:` field and renders the
 * fe/ml pair plus the failure-mode statement. The bridge displayed is
 * deterministic (first registry entry with `breaks` set) so this stays
 * stable across deploys.
 *
 * Pedagogical claim being marketed here: every structural and intuition
 * bridge in the course has an explicit "where this breaks" statement so
 * learners never internalize an analogy beyond its honest limit.
 */

const FALLBACK = {
  feConcept: "Component composition",
  mlConcept: "CNN layer stack",
  tier: "structural" as const,
  breaks:
    "Components are stateless pure functions of props; CNN layers carry mutable learned weights. Reorder React children → layout shifts predictably. Reorder CNN layers → the model loses its learned feature hierarchy and must retrain from scratch.",
};

function pickShowcaseBridge() {
  const candidate = BRIDGES.find(
    (b) => b.breaks && (b.tier === "structural" || b.tier === "intuition"),
  );
  if (!candidate || !candidate.breaks) return FALLBACK;
  return {
    feConcept: candidate.feConcept,
    mlConcept: candidate.mlConcept,
    tier: candidate.tier,
    breaks: candidate.breaks,
  };
}

export function LandingAnalogyBreaks() {
  const bridge = pickShowcaseBridge();
  const totalWithBreaks = BRIDGES.filter((b) => b.breaks).length;

  return (
    <section
      id="analogy-breaks"
      data-testid="landing-analogy-breaks"
      className="border-b border-border"
    >
      <div className="px-10 md:px-20 pt-20 pb-10">
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-3">
          // HONEST ANALOGIES
        </div>
        <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-4 uppercase max-w-[760px]">
          Every analogy tells you{" "}
          <span className="text-primary">where it lies.</span>
        </h2>
        <p className="text-[15px] text-text-muted leading-relaxed max-w-[640px] font-sans">
          Most ML courses use analogies and let you find the gaps in production.
          Tensorcraft labels the failure mode of every structural and intuition
          bridge inline. You stop carrying the wrong mental model past its
          honest limit.
        </p>
      </div>

      <div className="border-t border-border grid grid-cols-1 md:grid-cols-[1fr_1fr]">
        <div className="px-10 md:px-14 py-12 border-b md:border-b-0 md:border-r border-border min-w-0">
          <div className="font-mono text-[11px] text-text-muted uppercase tracking-[0.2em] mb-5">
            // EXAMPLE BRIDGE — {BRIDGE_TIER_LABELS[bridge.tier]}
          </div>
          <div className="border border-border rounded-none bg-surface">
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="p-5">
                <div className="font-mono text-[11px] text-text-muted uppercase tracking-wider mb-2">
                  FE
                </div>
                <div className="font-mono text-sm text-text-primary">
                  {bridge.feConcept}
                </div>
              </div>
              <div className="p-5">
                <div className="font-mono text-[11px] text-text-muted uppercase tracking-wider mb-2">
                  ML
                </div>
                <div
                  className="font-mono text-sm"
                  style={{ color: "var(--tc-primary)" }}
                >
                  {bridge.mlConcept}
                </div>
              </div>
            </div>
            <div
              className="border-t border-border bg-code-bg px-5 py-4"
              style={{ borderTop: "1px dashed var(--tc-tier-intuition)" }}
            >
              <div
                className="font-mono text-xs uppercase tracking-widest mb-1.5"
                style={{ color: "var(--tc-tier-intuition)" }}
              >
                ⚠ Where this breaks
              </div>
              <p className="font-mono text-xs leading-relaxed text-text-muted">
                {bridge.breaks}
              </p>
            </div>
          </div>
        </div>

        <div className="px-10 md:px-14 py-12 flex flex-col justify-center gap-6 min-w-0">
          <div>
            <div className="font-mono text-xs text-primary font-bold tracking-wider uppercase mb-2">
              Shipped, not aspirational
            </div>
            <p className="text-sm text-text-muted leading-relaxed font-sans">
              <span className="font-mono text-text-primary">
                {totalWithBreaks}
              </span>{" "}
              canonical bridges and{" "}
              <span className="font-mono text-text-primary">245</span> lessons
              now ship with explicit failure-mode statements.{" "}
              <span className="text-text-primary">
                100% coverage of structural and intuition bridges.
              </span>
            </p>
          </div>

          <div>
            <div className="font-mono text-xs text-primary font-bold tracking-wider uppercase mb-2">
              No competitor does this
            </div>
            <p className="text-sm text-text-muted leading-relaxed font-sans">
              fast.ai, Karpathy, 3Blue1Brown, deeplearning.ai — none label where
              their analogies stop being literal. The gap is yours to discover.
              Here it is named on every lesson.
            </p>
          </div>

          <div>
            <div className="font-mono text-xs text-primary font-bold tracking-wider uppercase mb-2">
              Why it matters
            </div>
            <p className="text-sm text-text-muted leading-relaxed font-sans">
              Internalize an analogy past its limit and you ship code that
              breaks in production for reasons the analogy hides. The course
              that taught you the trick should also tell you when to drop it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
