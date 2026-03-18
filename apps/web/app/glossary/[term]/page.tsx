import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BRIDGES,
  BRIDGE_TIER_LABELS,
  BRIDGE_CATEGORY_LABELS,
} from "@tensorcraft/shared";
import type { BridgeTier } from "@tensorcraft/shared";

const TIER_COLORS: Record<BridgeTier, string> = {
  identity: "#6BAA8A",
  structural: "#7096B0",
  intuition: "#A89060",
};

function slugify(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findBridgeByTermSlug(slug: string) {
  return BRIDGES.find(
    (b) => slugify(b.mlConcept) === slug || slugify(b.feConcept) === slug,
  );
}

function findTermSide(slug: string) {
  const bridge = findBridgeByTermSlug(slug);
  if (!bridge) return null;
  const isMl = slugify(bridge.mlConcept) === slug;
  return {
    bridge,
    term: isMl ? bridge.mlConcept : bridge.feConcept,
    counterpart: isMl ? bridge.feConcept : bridge.mlConcept,
    domain: isMl ? ("ml" as const) : ("fe" as const),
  };
}

export function generateStaticParams() {
  const slugs = new Set<string>();
  for (const b of BRIDGES) {
    slugs.add(slugify(b.mlConcept));
    slugs.add(slugify(b.feConcept));
  }
  return Array.from(slugs).map((term) => ({ term }));
}

interface TermPageProps {
  params: Promise<{ term: string }>;
}

export async function generateMetadata({
  params,
}: TermPageProps): Promise<Metadata> {
  const { term } = await params;
  const data = findTermSide(term);

  if (!data) {
    return { title: "Term Not Found — Tensorcraft Glossary" };
  }

  const title =
    data.domain === "ml"
      ? `${data.term} — ML Glossary for Frontend Engineers`
      : `${data.term} — Frontend Concept in ML Context`;

  const description =
    data.domain === "ml"
      ? `${data.term} explained through ${data.counterpart}. A frontend engineer's guide to this ML concept.`
      : `How ${data.term} maps to ${data.counterpart} in machine learning.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://tensorcraft.dev/glossary/${term}`,
    },
  };
}

export default async function GlossaryTermPage({ params }: TermPageProps) {
  const { term } = await params;
  const data = findTermSide(term);

  if (!data) {
    notFound();
  }

  const { bridge, domain } = data;

  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      <div className="max-w-3xl relative z-10">
        {/* Breadcrumb */}
        <div className="font-mono text-[11px] text-text-muted tracking-wider mb-10 flex items-center gap-2">
          <Link
            href="/glossary"
            className="hover:text-primary transition-colors"
          >
            Glossary
          </Link>
          <span>/</span>
          <span className="text-text-primary">{data.term}</span>
        </div>

        {/* Domain badge */}
        <div
          className="inline-block font-mono text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 border mb-6"
          style={{
            color: domain === "ml" ? "#7096B0" : "#6BAA8A",
            borderColor:
              domain === "ml"
                ? "rgba(112,150,176,0.3)"
                : "rgba(107,170,138,0.3)",
          }}
        >
          {domain === "ml" ? "Machine Learning" : "Frontend"}
        </div>

        <h1 className="text-4xl md:text-[48px] font-mono font-black leading-[0.95] tracking-[-0.04em] mb-10 uppercase">
          {data.term}
        </h1>

        {/* Bridge mapping */}
        <div className="border border-border mb-10">
          <div className="px-6 py-4 border-b border-border bg-surface">
            <span className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase">
              Bridge mapping
            </span>
          </div>

          <div className="grid grid-cols-[1fr_40px_1fr]">
            <div className="px-6 py-6">
              <div className="font-mono text-[10px] text-text-muted tracking-wider uppercase mb-2">
                Frontend
              </div>
              <div className="text-base font-mono font-bold text-text-primary">
                {bridge.feConcept}
              </div>
            </div>
            <div className="flex items-center justify-center text-primary font-mono font-bold text-lg">
              =
            </div>
            <div className="px-6 py-6">
              <div className="font-mono text-[10px] text-text-muted tracking-wider uppercase mb-2">
                ML Concept
              </div>
              <div className="text-base font-mono font-bold text-text-primary">
                {bridge.mlConcept}
              </div>
            </div>
          </div>
        </div>

        {/* Tier + Category */}
        <div className="grid grid-cols-2 border border-border mb-10">
          <div
            className="px-6 py-5"
            style={{ borderRight: "1px solid var(--tc-border)" }}
          >
            <div className="font-mono text-[10px] text-text-muted tracking-wider uppercase mb-2">
              Tier
            </div>
            <span
              className="font-mono text-sm font-bold"
              style={{ color: TIER_COLORS[bridge.tier] }}
            >
              {BRIDGE_TIER_LABELS[bridge.tier]}
            </span>
          </div>
          <div className="px-6 py-5">
            <div className="font-mono text-[10px] text-text-muted tracking-wider uppercase mb-2">
              Category
            </div>
            <span className="font-mono text-sm font-bold text-text-primary">
              {BRIDGE_CATEGORY_LABELS[bridge.category]}
            </span>
          </div>
        </div>

        {/* Connection explanation */}
        <div className="border border-border mb-10">
          <div className="px-6 py-4 border-b border-border bg-surface">
            <span className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase">
              How they connect
            </span>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-text-muted leading-relaxed">
              {bridge.connection}
            </p>
          </div>
        </div>

        {/* Back to glossary */}
        <Link
          href="/glossary"
          className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-border text-text-primary font-bold text-sm font-mono tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all"
        >
          &larr; Back to glossary
        </Link>
      </div>
    </main>
  );
}
