import Link from "next/link";
import { BRIDGES } from "@tensorcraft/shared";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frontend-to-ML Bridges | Tensorcraft",
  description:
    "50+ concept bridges mapping frontend JavaScript patterns to their machine learning equivalents. See how useState maps to model weights, Array.map to tensor ops, and more.",
  alternates: { canonical: "https://tensorcraft.app/bridges" },
  openGraph: {
    images: [
      "/api/og?title=Frontend-to-ML%20Bridges&theme=deep-orbit&subtitle=50%2B%20concept%20bridges",
    ],
  },
};

export const revalidate = 3600;

function slugify(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const tierColors: Record<string, string> = {
  identity: "var(--tc-tier-identity, #6BAA8A)",
  structural: "var(--tc-tier-structural, #7096B0)",
  intuition: "var(--tc-tier-intuition, #A89060)",
};

const tierLabels: Record<string, string> = {
  identity: "Identity",
  structural: "Structural",
  intuition: "Intuition",
};

export default function BridgesPage() {
  // Coverage stats: how many of each tier ship a `breaks` field.
  const counts = BRIDGES.reduce(
    (acc, b) => {
      acc.byTier[b.tier] = (acc.byTier[b.tier] || 0) + 1;
      if (b.breaks) {
        acc.breaksByTier[b.tier] = (acc.breaksByTier[b.tier] || 0) + 1;
      }
      return acc;
    },
    {
      byTier: {} as Record<string, number>,
      breaksByTier: {} as Record<string, number>,
    },
  );
  const totalRequired =
    (counts.byTier.structural || 0) + (counts.byTier.intuition || 0);
  const totalCovered =
    (counts.breaksByTier.structural || 0) +
    (counts.breaksByTier.intuition || 0);
  const coveragePct =
    totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 0;

  return (
    <main className="min-h-screen bg-page px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs text-primary tracking-wider uppercase mb-3">
          // {BRIDGES.length} canonical bridges
        </p>
        <h1 className="text-4xl font-bold text-text-primary mb-4 font-mono tracking-tight">
          Frontend-to-ML Bridges
        </h1>
        <p className="text-lg text-text-muted font-sans leading-relaxed mb-8 max-w-2xl">
          Every ML concept has a frontend equivalent you already know. Each
          bridge is labeled by tier, and structural and intuition bridges ship
          with a &ldquo;where this breaks&rdquo; statement.
        </p>

        {/* Coverage badge — auto-computed from BRIDGES registry */}
        <section
          data-testid="bridges-coverage-badge"
          className="border border-border bg-surface-raised mb-12 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div>
            <div className="font-mono text-3xl font-black text-text-primary leading-none mb-1">
              {coveragePct}%
            </div>
            <div className="text-xs text-text-muted font-mono uppercase tracking-wider">
              Breaks coverage
            </div>
          </div>
          {(["identity", "structural", "intuition"] as const).map((t) => {
            const total = counts.byTier[t] || 0;
            const withBreaks = counts.breaksByTier[t] || 0;
            return (
              <div key={t}>
                <div
                  className="font-mono text-2xl font-bold leading-none mb-1"
                  style={{ color: tierColors[t] }}
                >
                  {total}
                </div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider">
                  {tierLabels[t]}
                  {t !== "identity" && (
                    <span className="block opacity-70 normal-case mt-0.5">
                      {withBreaks}/{total} with breaks
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {BRIDGES.map((bridge) => (
            <Link
              key={bridge.id}
              href={`/bridges/${slugify(bridge.mlConcept)}`}
              className="block p-5 border border-border bg-surface-raised hover:border-primary/50 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--tc-primary)] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-text-primary font-mono">
                  {bridge.feConcept}
                </span>
                <span className="text-xs text-text-muted font-mono">→</span>
                <span className="text-sm font-semibold text-primary font-mono">
                  {bridge.mlConcept}
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed line-clamp-2 font-sans mb-3">
                {bridge.connection}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-mono uppercase tracking-wider"
                  style={{
                    color: tierColors[bridge.tier] || "var(--tc-muted)",
                  }}
                >
                  {tierLabels[bridge.tier] || bridge.tier} bridge
                </span>
                {bridge.breaks && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest text-text-muted/70"
                    title="This bridge ships an explicit failure-mode statement"
                  >
                    ⚠ breaks
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
