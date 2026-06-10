"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BRIDGES, BRIDGE_TIER_LABELS } from "@tensorcraft/shared";
import type { BridgeTier } from "@tensorcraft/shared";

const TIER_COLORS: Record<BridgeTier, string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function slugify(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const ALL_TERMS = BRIDGES.flatMap((b) => [
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

export function GlossaryList() {
  const [query, setQuery] = useState("");

  const filteredTerms = useMemo(() => {
    if (!query.trim()) return ALL_TERMS;
    const q = query.toLowerCase();
    return ALL_TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.counterpart.toLowerCase().includes(q),
    );
  }, [query]);

  // Build set of letters that have terms
  const activeLetters = new Set(
    filteredTerms.map((t) => t.term.charAt(0).toUpperCase()),
  );

  // Group terms by first letter
  const termsByLetter = new Map<string, typeof filteredTerms>();
  for (const t of filteredTerms) {
    const letter = t.term.charAt(0).toUpperCase();
    const group = termsByLetter.get(letter) ?? [];
    group.push(t);
    termsByLetter.set(letter, group);
  }

  return (
    <>
      {/* Search input */}
      <div className="relative mb-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-text-muted tracking-wider pointer-events-none">
          //
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms or concepts..."
          className="w-full bg-surface border border-border px-10 py-3.5 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus:border-primary/40 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-text-muted hover:text-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Alphabet navigation */}
      <div className="flex flex-wrap gap-1 mb-12 border border-border bg-surface p-4">
        <div className="font-mono text-xs text-text-muted tracking-wider uppercase mr-3 flex items-center">
          jump to
        </div>
        {ALPHABET.map((letter) => {
          const isActive = activeLetters.has(letter);
          return isActive ? (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-8 h-8 flex items-center justify-center font-mono text-xs font-bold text-text-primary border border-border hover:text-primary hover:border-primary/30 transition-all"
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              className="w-8 h-8 flex items-center justify-center font-mono text-xs text-text-muted/30 border border-transparent"
            >
              {letter}
            </span>
          );
        })}
      </div>

      <p className="font-mono text-xs text-text-muted tracking-wider uppercase mb-6">
        {filteredTerms.length} terms from {BRIDGES.length} bridges
        {query && ` matching "${query}"`}
      </p>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_1fr_120px] border-t border-b border-border bg-surface">
        {["Term", "Domain", "Bridge to", "Tier"].map((h, i) => (
          <div
            key={h}
            className="px-5 py-3 font-mono text-xs font-bold text-text-muted tracking-wider uppercase"
            style={{
              borderRight: i < 3 ? "1px solid var(--tc-border)" : "none",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredTerms.length === 0 && (
        <div className="border-b border-border px-5 py-10 text-center">
          <p className="font-mono text-sm text-text-muted">
            No terms match &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {/* Term rows grouped by letter */}
      {ALPHABET.filter((letter) => termsByLetter.has(letter)).map((letter) => (
        <div key={letter} id={`letter-${letter}`}>
          <div className="px-5 py-2 bg-surface border-b border-border">
            <span className="font-mono text-xs font-bold text-primary tracking-wider">
              {letter}
            </span>
          </div>
          {termsByLetter.get(letter)!.map((t) => (
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
                className="px-5 py-4 font-mono text-xs font-bold tracking-wider uppercase"
                style={{
                  borderRight: "1px solid var(--tc-border)",
                  color:
                    t.type === "ml"
                      ? "var(--tc-tier-structural)"
                      : "var(--tc-tier-identity)",
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
                  className="font-mono text-xs font-bold tracking-wider"
                  style={{ color: TIER_COLORS[t.tier] }}
                >
                  {BRIDGE_TIER_LABELS[t.tier]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}
