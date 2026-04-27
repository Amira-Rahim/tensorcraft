import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BRIDGES,
  BRIDGE_TIER_LABELS,
  BRIDGE_CATEGORY_LABELS,
} from "@tensorcraft/shared";
import type { BridgeTier } from "@tensorcraft/shared";
import { themeSlugs } from "@tensorcraft/themes";
import { getThemeLessons } from "@tensorcraft/content";

/**
 * Find lessons that mention the term in their feTitle, mlTitle, keywords,
 * or title. This is the bidirectional cross-link from glossary → lessons.
 */
function findRelatedLessons(termText: string, counterpartText: string) {
  const term = termText.toLowerCase();
  const counterpart = counterpartText.toLowerCase();
  const matches: Array<{
    themeSlug: string;
    moduleId: string;
    slug: string;
    title: string;
  }> = [];
  for (const themeSlug of themeSlugs) {
    const lessons = getThemeLessons(themeSlug);
    for (const lesson of lessons) {
      const title = (lesson.title || "").toLowerCase();
      const fe = (lesson.concept?.bridge?.feTitle || "").toLowerCase();
      const ml = (lesson.concept?.bridge?.mlTitle || "").toLowerCase();
      const keywords = (lesson.keywords || []).map((k: string) =>
        k.toLowerCase(),
      );
      const explanation = (lesson.concept?.explanation || "").toLowerCase();
      const haystack = [title, fe, ml, explanation, ...keywords].join(" | ");
      if (haystack.includes(term) || haystack.includes(counterpart)) {
        matches.push({
          themeSlug,
          moduleId: lesson.moduleId,
          slug: lesson.slug,
          title: lesson.title,
        });
      }
    }
  }
  return matches.slice(0, 12);
}

const TIER_COLORS: Record<BridgeTier, string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
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
    alternates: { canonical: `https://tensorcraft.app/glossary/${term}` },
    openGraph: {
      title,
      description,
      url: `https://tensorcraft.app/glossary/${term}`,
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
  const relatedLessons = findRelatedLessons(data.term, data.counterpart);

  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      <div className="max-w-3xl relative z-10">
        {/* Breadcrumb */}
        <div className="font-mono text-xs text-text-muted tracking-wider mb-10 flex items-center gap-2">
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
          className="inline-block font-mono text-xs font-bold tracking-wider uppercase px-3 py-1.5 border mb-6"
          style={{
            color:
              domain === "ml"
                ? "var(--tc-tier-structural)"
                : "var(--tc-tier-identity)",
            borderColor:
              domain === "ml"
                ? "color-mix(in srgb, var(--tc-tier-structural) 30%, transparent)"
                : "color-mix(in srgb, var(--tc-tier-identity) 30%, transparent)",
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
            <span className="font-mono text-xs font-bold text-text-muted tracking-wider uppercase">
              Bridge mapping
            </span>
          </div>

          <div className="grid grid-cols-[1fr_40px_1fr]">
            <div className="px-6 py-6">
              <div className="font-mono text-xs text-text-muted tracking-wider uppercase mb-2">
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
              <div className="font-mono text-xs text-text-muted tracking-wider uppercase mb-2">
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
            <div className="font-mono text-xs text-text-muted tracking-wider uppercase mb-2">
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
            <div className="font-mono text-xs text-text-muted tracking-wider uppercase mb-2">
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
            <span className="font-mono text-xs font-bold text-text-muted tracking-wider uppercase">
              How they connect
            </span>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-text-muted leading-relaxed">
              {bridge.connection}
            </p>
          </div>
        </div>

        {/* Lessons that teach this concept */}
        {relatedLessons.length > 0 && (
          <div className="border border-border mb-10">
            <div className="px-6 py-4 border-b border-border bg-surface">
              <span className="font-mono text-xs font-bold text-text-muted tracking-wider uppercase">
                Lessons that teach this ({relatedLessons.length})
              </span>
            </div>
            <ul className="divide-y divide-border">
              {relatedLessons.map((l) => (
                <li key={`${l.themeSlug}/${l.moduleId}/${l.slug}`}>
                  <Link
                    href={`/themes/${l.themeSlug}/${l.moduleId}/${l.slug}`}
                    className="block px-6 py-3 hover:bg-surface transition-colors"
                  >
                    <div className="font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
                      {l.themeSlug} / {l.moduleId}
                    </div>
                    <div className="text-sm text-text-primary font-sans">
                      {l.title}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

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
