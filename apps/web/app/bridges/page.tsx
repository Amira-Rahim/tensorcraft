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
  return (
    <main className="min-h-screen bg-surface px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs text-primary tracking-wider uppercase mb-3">
          // {BRIDGES.length} bridges
        </p>
        <h1 className="text-4xl font-bold text-text-primary mb-4 font-mono tracking-tight">
          Frontend-to-ML Bridges
        </h1>
        <p className="text-lg text-text-muted font-sans leading-relaxed mb-12 max-w-2xl">
          Every ML concept has a frontend equivalent you already know. Browse
          our bridge collection mapping JavaScript patterns to machine learning.
        </p>

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
              <span
                className="text-xs font-mono uppercase tracking-wider"
                style={{ color: tierColors[bridge.tier] || "var(--tc-muted)" }}
              >
                {tierLabels[bridge.tier] || bridge.tier} bridge
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
