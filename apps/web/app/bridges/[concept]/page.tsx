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

const TIER_DESCRIPTIONS: Record<BridgeTier, string> = {
  identity:
    "Identity bridges are the same concept in both domains. The code is identical or nearly identical.",
  structural:
    "Structural bridges share the same architecture or pattern, even though the domains differ.",
  intuition:
    "Intuition bridges share a useful mental model, but the underlying mechanisms differ. Use with care.",
};

function slugify(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findBridgeBySlug(slug: string) {
  return BRIDGES.find((b) => slugify(b.mlConcept) === slug);
}

export function generateStaticParams() {
  return BRIDGES.map((b) => ({
    concept: slugify(b.mlConcept),
  }));
}

interface BridgeConceptPageProps {
  params: Promise<{ concept: string }>;
}

export async function generateMetadata({
  params,
}: BridgeConceptPageProps): Promise<Metadata> {
  const { concept } = await params;
  const bridge = findBridgeBySlug(concept);

  if (!bridge) {
    return { title: "Bridge Not Found — Tensorcraft" };
  }

  const title = `${bridge.feConcept} = ${bridge.mlConcept} — Tensorcraft Bridge`;
  const description = `How ${bridge.feConcept} maps to ${bridge.mlConcept} in machine learning. ${bridge.connection.slice(0, 140)}...`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://tensorcraft.app/bridges/${concept}`,
    },
    keywords: [
      bridge.feConcept,
      bridge.mlConcept,
      "frontend to ML",
      "machine learning",
      "javascript",
      BRIDGE_TIER_LABELS[bridge.tier],
    ],
  };
}

export default async function BridgeConceptPage({
  params,
}: BridgeConceptPageProps) {
  const { concept } = await params;
  const bridge = findBridgeBySlug(concept);

  if (!bridge) {
    notFound();
  }

  // Find related bridges in the same category
  const related = BRIDGES.filter(
    (b) => b.category === bridge.category && b.id !== bridge.id,
  ).slice(0, 4);

  return (
    <main className="min-h-screen px-8 md:px-20 pt-24 pb-28">
      <div className="max-w-3xl">
        {/* Breadcrumb */}
        <div className="font-mono text-[11px] text-text-muted tracking-wider mb-10 flex items-center gap-2">
          <Link
            href="/bridges"
            className="hover:text-primary transition-colors"
          >
            Bridges
          </Link>
          <span>/</span>
          <span className="text-text-primary">{bridge.mlConcept}</span>
        </div>

        {/* Tier badge */}
        <div
          className="inline-block font-mono text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 border mb-6"
          style={{
            color: TIER_COLORS[bridge.tier],
            borderColor: `${TIER_COLORS[bridge.tier]}55`,
          }}
        >
          {BRIDGE_TIER_LABELS[bridge.tier]} Bridge
        </div>

        {/* Title: FE = ML */}
        <h1 className="text-3xl md:text-[44px] font-mono font-black leading-[0.95] tracking-[-0.04em] mb-4 uppercase">
          <span className="text-primary">{bridge.feConcept}</span>
          <br />
          <span className="text-text-muted text-2xl md:text-3xl">=</span>
          <br />
          {bridge.mlConcept}
        </h1>

        <div className="font-mono text-[11px] text-text-muted tracking-wider mb-12">
          {BRIDGE_CATEGORY_LABELS[bridge.category]} // Bridge #{bridge.id}
        </div>

        {/* Connection — the core content */}
        <div className="border border-border mb-10">
          <div className="px-6 py-4 border-b border-border bg-surface-raised">
            <span className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase">
              The connection
            </span>
          </div>
          <div className="px-6 py-6">
            <p className="text-[15px] text-text-muted leading-[1.75]">
              {bridge.connection}
            </p>
          </div>
        </div>

        {/* Tier explanation */}
        <div className="border border-border mb-10">
          <div className="px-6 py-4 border-b border-border bg-surface-raised">
            <span className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase">
              Why &quot;{BRIDGE_TIER_LABELS[bridge.tier]}&quot;?
            </span>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-text-muted leading-relaxed">
              {TIER_DESCRIPTIONS[bridge.tier]}
            </p>
          </div>
        </div>

        {/* Side-by-side */}
        <div className="grid grid-cols-2 border border-border mb-10">
          <div
            className="px-6 py-6"
            style={{ borderRight: "1px solid var(--tc-border)" }}
          >
            <div className="font-mono text-[10px] text-text-muted tracking-wider uppercase mb-3">
              Frontend concept
            </div>
            <div className="text-base font-mono font-bold text-text-primary mb-3">
              {bridge.feConcept}
            </div>
            <Link
              href={`/glossary/${slugify(bridge.feConcept)}`}
              className="font-mono text-[11px] text-primary hover:underline"
            >
              View in glossary
            </Link>
          </div>
          <div className="px-6 py-6">
            <div className="font-mono text-[10px] text-text-muted tracking-wider uppercase mb-3">
              ML concept
            </div>
            <div className="text-base font-mono font-bold text-text-primary mb-3">
              {bridge.mlConcept}
            </div>
            <Link
              href={`/glossary/${slugify(bridge.mlConcept)}`}
              className="font-mono text-[11px] text-primary hover:underline"
            >
              View in glossary
            </Link>
          </div>
        </div>

        {/* Related bridges */}
        {related.length > 0 && (
          <div className="border border-border">
            <div className="px-6 py-4 border-b border-border bg-surface-raised">
              <span className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase">
                Related bridges in {BRIDGE_CATEGORY_LABELS[bridge.category]}
              </span>
            </div>
            {related.map((r, i) => (
              <Link
                key={r.id}
                href={`/bridges/${slugify(r.mlConcept)}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-primary/[0.04] transition-colors"
                style={{
                  borderBottom:
                    i < related.length - 1
                      ? "1px solid var(--tc-border)"
                      : "none",
                }}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-text-primary">
                    {r.feConcept}
                  </span>
                  <span className="text-text-muted text-xs">=</span>
                  <span className="font-mono text-sm text-text-muted">
                    {r.mlConcept}
                  </span>
                </div>
                <span
                  className="font-mono text-[10px] font-bold tracking-wider"
                  style={{ color: TIER_COLORS[r.tier] }}
                >
                  {BRIDGE_TIER_LABELS[r.tier]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
