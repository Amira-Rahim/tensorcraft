"use client";

import { useState, useMemo } from "react";
import {
  BRIDGES,
  BRIDGE_TIER_LABELS,
  BRIDGE_CATEGORY_LABELS,
} from "@tensorcraft/shared";
import type { Bridge, BridgeTier, BridgeCategory } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";

type TierFilter = BridgeTier | "all";
type CategoryFilter = BridgeCategory | "all";

/** Tier colors using CSS custom properties */
const TIER_COLORS: Record<BridgeTier, string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
};

export function BridgeExplorer() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return BRIDGES.filter((b) => {
      if (tierFilter !== "all" && b.tier !== tierFilter) return false;
      if (categoryFilter !== "all" && b.category !== categoryFilter)
        return false;
      if (
        q &&
        !b.mlConcept.toLowerCase().includes(q) &&
        !b.feConcept.toLowerCase().includes(q) &&
        !b.connection.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, tierFilter, categoryFilter]);

  return (
    <div className="font-sans relative">
      <AmbientBackground count={200} />
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs tracking-widest mb-2 text-text-muted font-mono">
          {"// BRIDGE SYSTEM — " + BRIDGES.length + " MAPPINGS"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-text-primary font-mono">
          BRIDGE EXPLORER
        </h1>
        <p className="text-sm max-w-xl text-text-muted">
          Every ML concept mapped to a frontend pattern you already know.
          Search, filter, and expand any bridge to see the connection.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label htmlFor="bridge-search" className="sr-only">
          Search bridges
        </label>
        <div className="relative">
          <input
            id="bridge-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search bridges..."
            className="w-full px-4 py-3 text-sm outline-none transition-colors font-mono bg-surface-raised border border-border text-text-primary"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] px-1.5 py-0.5 text-text-muted border border-border font-mono">
            ⌘K
          </span>
        </div>
      </div>

      {/* Filter bar + count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Tier segmented control */}
        <div
          className="flex items-center border border-border"
          role="group"
          aria-label="Filter by tier"
        >
          <TierButton
            active={tierFilter === "all"}
            onClick={() => setTierFilter("all")}
            label="All"
          />
          {(Object.keys(BRIDGE_TIER_LABELS) as BridgeTier[]).map((tier) => (
            <TierButton
              key={tier}
              active={tierFilter === tier}
              onClick={() => setTierFilter(tierFilter === tier ? "all" : tier)}
              label={BRIDGE_TIER_LABELS[tier]}
            />
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-text-muted font-mono">
          {filtered.length} bridge{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {(Object.keys(TIER_COLORS) as BridgeTier[]).map((tier) => (
          <div key={tier} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5"
              style={{ background: TIER_COLORS[tier] }}
            />
            <span className="text-[11px] uppercase tracking-wide text-text-muted font-mono">
              {BRIDGE_TIER_LABELS[tier]}
            </span>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div
        className="flex flex-wrap gap-2 mb-8"
        role="group"
        aria-label="Filter by category"
      >
        {(
          ["all", ...Object.keys(BRIDGE_CATEGORY_LABELS)] as CategoryFilter[]
        ).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            aria-pressed={categoryFilter === cat}
            className={`px-4 py-1.5 text-xs font-medium transition-colors font-mono border border-border ${
              categoryFilter === cat
                ? "bg-primary text-surface"
                : "bg-transparent text-text-muted"
            }`}
          >
            {cat === "all"
              ? "All categories"
              : BRIDGE_CATEGORY_LABELS[cat as BridgeCategory]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-text-muted">
          No bridges match your search. Try a different term.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((bridge) => (
            <BridgeCard key={bridge.id} bridge={bridge} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Bridge Card ───────────────────────────────────────────────────── */

function BridgeCard({ bridge }: { bridge: Bridge }) {
  const [expanded, setExpanded] = useState(false);
  const color = TIER_COLORS[bridge.tier];

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      aria-expanded={expanded}
      className={`text-left w-full transition-all cursor-pointer border border-border p-5 ${
        expanded ? "bg-surface-raised" : "bg-surface-overlay"
      }`}
      style={{
        transform: "translate(0, 0)",
        boxShadow: "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translate(-2px, -2px)";
        e.currentTarget.style.boxShadow = `4px 4px 0 ${color}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translate(0, 0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Category label */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 font-mono"
          style={{
            color,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
          }}
        >
          {BRIDGE_TIER_LABELS[bridge.tier]}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-text-muted font-mono">
          {BRIDGE_CATEGORY_LABELS[bridge.category]}
        </span>
      </div>

      {/* FE concept → ML concept */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-medium text-text-primary font-mono">
          {bridge.feConcept}
        </span>
        <span className="text-xs font-mono" style={{ color }}>
          →
        </span>
        <span className="text-sm font-medium text-text-primary font-mono">
          {bridge.mlConcept}
        </span>
      </div>

      {/* Description */}
      {expanded ? (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs leading-relaxed mb-3 text-text-muted">
            {bridge.connection}
          </p>
          {/* Code-style block */}
          <div className="px-3 py-2 text-[11px] leading-relaxed bg-surface border border-border text-text-muted font-mono">
            <span style={{ color }}>{"// "}</span>
            <span className="text-text-primary">{bridge.feConcept}</span>
            <span style={{ color }}>{" ≈ "}</span>
            <span className="text-text-primary">{bridge.mlConcept}</span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] mt-1 truncate text-text-muted">
          {bridge.connection}
        </p>
      )}
    </button>
  );
}

/* ── Tier Segmented Button ────────────────────────────────────────── */

function TierButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-2 text-xs font-medium transition-colors font-mono border-r border-border ${
        active ? "bg-primary text-surface" : "bg-transparent text-text-muted"
      }`}
    >
      {label}
    </button>
  );
}
