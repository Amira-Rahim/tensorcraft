import type { Metadata } from "next";
import Link from "next/link";
import {
  BRIDGES,
  BRIDGE_TIER_LABELS,
  BRIDGE_CATEGORY_LABELS,
} from "@tensorcraft/shared";
import type { BridgeTier } from "@tensorcraft/shared";

export const metadata: Metadata = {
  title: "ML Glossary for Frontend Engineers — Tensorcraft",
  description:
    "Every machine learning term explained through frontend concepts you already know. 50+ terms mapped from JavaScript, React, and CSS to ML equivalents.",
  openGraph: {
    title: "ML Glossary for Frontend Engineers — Tensorcraft",
    description:
      "Every ML term explained through frontend concepts you already know.",
    url: "https://tensorcraft.dev/glossary",
  },
};

function slugify(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const TIER_COLORS: Record<BridgeTier, string> = {
  identity: "#6BAA8A",
  structural: "#7096B0",
  intuition: "#A89060",
};

export default function GlossaryIndexPage() {
  // Collect all unique terms (both FE and ML) from bridges
  const terms = BRIDGES.flatMap((b) => [
    {
      term: b.mlConcept,
      type: "ml" as const,
      counterpart: b.feConcept,
      tier: b.tier,
      category: b.category,
      bridgeId: b.id,
    },
    {
      term: b.feConcept,
      type: "fe" as const,
      counterpart: b.mlConcept,
      tier: b.tier,
      category: b.category,
      bridgeId: b.id,
    },
  ]).sort((a, b) => a.term.localeCompare(b.term));

  return (
    <main className="min-h-screen px-8 md:px-20 pt-24 pb-28">
      <div className="max-w-4xl">
        <div className="font-mono text-[11px] text-primary tracking-[0.14em] uppercase mb-6 flex items-center gap-3">
          <span className="inline-block w-[7px] h-[7px] bg-primary" />
          Glossary
        </div>

        <h1 className="text-4xl md:text-[56px] font-mono font-black leading-[0.93] tracking-[-0.045em] mb-8 uppercase">
          ML Glossary
          <br />
          <span className="text-primary">for Frontend Devs</span>
        </h1>

        <p className="text-base text-text-muted leading-relaxed max-w-[520px] mb-16">
          {BRIDGES.length * 2} terms from both sides of the bridge. Every ML
          concept mapped to something you already use.
        </p>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_100px_1fr_120px] border-t border-b border-border bg-surface-raised">
          {["Term", "Domain", "Bridge to", "Tier"].map((h, i) => (
            <div
              key={h}
              className="px-5 py-3 font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase"
              style={{
                borderRight: i < 3 ? "1px solid var(--tc-border)" : "none",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Term rows */}
        {terms.map((t, i) => (
          <Link
            key={`${t.bridgeId}-${t.type}`}
            href={`/glossary/${slugify(t.term)}`}
            className="grid grid-cols-[1fr_100px_1fr_120px] border-b border-border hover:bg-primary/[0.04] transition-colors"
          >
            <div
              className="px-5 py-4 text-sm font-semibold text-text-primary font-mono truncate"
              style={{ borderRight: "1px solid var(--tc-border)" }}
            >
              {t.term}
            </div>
            <div
              className="px-5 py-4 font-mono text-[10px] font-bold tracking-wider uppercase"
              style={{
                borderRight: "1px solid var(--tc-border)",
                color: t.type === "ml" ? "#7096B0" : "#6BAA8A",
              }}
            >
              {t.type === "ml" ? "ML" : "FE"}
            </div>
            <div
              className="px-5 py-4 text-sm text-text-muted font-mono truncate"
              style={{ borderRight: "1px solid var(--tc-border)" }}
            >
              {t.counterpart}
            </div>
            <div className="px-5 py-4">
              <span
                className="font-mono text-[10px] font-bold tracking-wider"
                style={{ color: TIER_COLORS[t.tier] }}
              >
                {BRIDGE_TIER_LABELS[t.tier]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
