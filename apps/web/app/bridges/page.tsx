import Link from "next/link";
import type { Metadata } from "next";
import {
  BRIDGES,
  BRIDGE_TIER_LABELS,
  BRIDGE_TIER_COLORS,
  BRIDGE_CATEGORY_LABELS,
  type BridgeTier,
} from "@tensorcraft/shared";

// Colorblind-safe glyph prefixes per tier — readable without color cues.
// `≡` evokes literal equality (identity). `≅` evokes structural similarity
// (same shape). `≈` evokes approximation (intuition / mental-model match).
const TIER_GLYPH: Record<BridgeTier, string> = {
  identity: "≡",
  structural: "≅",
  intuition: "≈",
};

export const metadata: Metadata = {
  title: "50 FE↔ML Bridges | Tensorcraft bridge-tier system",
  description:
    "Every analogy used in the Tensorcraft course, classified as identity / structural / intuition with explicit failure-mode statements. 100% breaks coverage on non-identity bridges.",
  alternates: { canonical: "https://tensorcraft.app/bridges" },
};

export const revalidate = 86400;

export default function BridgesPage() {
  const total = BRIDGES.length;
  const identity = BRIDGES.filter((b) => b.tier === "identity").length;
  const structural = BRIDGES.filter((b) => b.tier === "structural").length;
  const intuition = BRIDGES.filter((b) => b.tier === "intuition").length;
  const nonIdentity = structural + intuition;
  const withBreaks = BRIDGES.filter(
    (b) => b.tier !== "identity" && b.breaks,
  ).length;
  const breaksCoverage =
    nonIdentity > 0 ? Math.round((withBreaks / nonIdentity) * 100) : 100;

  const bridgesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tensorcraft FE↔ML Bridge Registry",
    description:
      "50 canonical FE↔ML bridges, classified by tier (identity / structural / intuition) with explicit failure-mode statements ('breaks').",
    url: "https://tensorcraft.app/bridges",
    numberOfItems: BRIDGES.length,
    itemListElement: BRIDGES.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${b.feConcept} ↔ ${b.mlConcept}`,
      description: b.connection,
    })),
  };

  return (
    <main className="min-h-screen bg-page px-6 md:px-10 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bridgesJsonLd) }}
      />
      <article className="max-w-6xl mx-auto">
        <p className="font-mono text-xs text-primary tracking-[0.18em] uppercase mb-3">
          // BRIDGES
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-text-primary mb-6">
          {total} FE↔ML bridges. Honest tiers. Concrete breaks.
        </h1>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <Stat label="Total" value={total} />
          <Stat
            label="Identity"
            value={identity}
            color={BRIDGE_TIER_COLORS.identity}
          />
          <Stat
            label="Structural"
            value={structural}
            color={BRIDGE_TIER_COLORS.structural}
          />
          <Stat
            label="Intuition"
            value={intuition}
            color={BRIDGE_TIER_COLORS.intuition}
          />
        </section>

        <section className="border-2 border-primary/40 p-5 mb-10 bg-primary/5">
          <p className="font-mono text-sm text-text-primary">
            <span className="text-primary font-bold">{breaksCoverage}%</span>{" "}
            breaks coverage on non-identity bridges ({withBreaks}/{nonIdentity}
            ). Every structural and intuition bridge ships with an explicit
            statement of where the analogy stops being literal.
          </p>
        </section>

        <section className="space-y-6 text-base text-text-muted leading-relaxed font-sans mb-12">
          <p>
            A bridge is a mapping from a frontend concept to an ML concept.
            Tensorcraft uses three tiers:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span
                style={{ color: BRIDGE_TIER_COLORS.identity }}
                className="font-mono font-bold"
              >
                <span aria-hidden="true" className="mr-1">
                  {TIER_GLYPH.identity}
                </span>
                Identity
              </span>{" "}
              — literally the same operation. <code>Math.max(0, x)</code> is the
              ReLU activation. No translation needed.
            </li>
            <li>
              <span
                style={{ color: BRIDGE_TIER_COLORS.structural }}
                className="font-mono font-bold"
              >
                <span aria-hidden="true" className="mr-1">
                  {TIER_GLYPH.structural}
                </span>
                Structural
              </span>{" "}
              — same shape, different domain. Component state ↔ model weights:
              both are mutable internal values, but state updates synchronously
              while weights update via gradient descent.
            </li>
            <li>
              <span
                style={{ color: BRIDGE_TIER_COLORS.intuition }}
                className="font-mono font-bold"
              >
                <span aria-hidden="true" className="mr-1">
                  {TIER_GLYPH.intuition}
                </span>
                Intuition
              </span>{" "}
              — same mental model, different math. Loss ↔ test assertion: both
              measure the gap between actual and expected. But you cannot take
              the gradient of <code>expect().toBe()</code>.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-mono font-bold text-text-primary">
            All {total} bridges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BRIDGES.map((b) => (
              <div
                key={b.id}
                className="border border-border p-4 bg-surface-raised"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <span
                    className="font-mono text-[11px] tracking-wider uppercase font-bold"
                    style={{ color: BRIDGE_TIER_COLORS[b.tier] }}
                    aria-label={`${BRIDGE_TIER_LABELS[b.tier]} tier`}
                  >
                    <span aria-hidden="true" className="mr-1">
                      {TIER_GLYPH[b.tier]}
                    </span>
                    {BRIDGE_TIER_LABELS[b.tier]}
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">
                    #{b.id} · {BRIDGE_CATEGORY_LABELS[b.category]}
                  </span>
                </div>
                <p className="font-mono text-sm text-text-primary font-bold mb-2">
                  {b.feConcept} <span className="text-primary">↔</span>{" "}
                  {b.mlConcept}
                </p>
                <p className="text-[13px] text-text-muted leading-relaxed mb-2">
                  {b.connection}
                </p>
                {b.breaks && (
                  <p className="text-[12px] text-text-muted leading-relaxed border-t border-border pt-2 mt-2">
                    <span className="text-primary font-mono font-bold">
                      Where this breaks:
                    </span>{" "}
                    {b.breaks}
                  </p>
                )}
                {b.mlCode && (
                  <pre className="mt-3 p-2 bg-page border border-border overflow-x-auto text-[11px] font-mono text-text-primary whitespace-pre-wrap">
                    {b.mlCode}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-4">
          <Link
            href="/themes"
            className="rounded-none inline-flex items-center px-8 py-4 bg-primary text-page font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
          >
            Start learning →
          </Link>
          <Link
            href="/compare"
            className="rounded-none inline-flex items-center px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all"
          >
            Compare to other courses
          </Link>
          <a
            href="https://www.npmjs.com/package/@tensorcraft/bridges"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-none inline-flex items-center px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all"
          >
            npm @tensorcraft/bridges
          </a>
        </div>
      </article>
    </main>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="border border-border p-3 bg-surface-raised">
      <p className="font-mono text-[11px] tracking-wider uppercase text-text-muted mb-1">
        {label}
      </p>
      <p
        className="font-mono text-2xl font-bold"
        style={{ color: color || undefined }}
      >
        {value}
      </p>
    </div>
  );
}
