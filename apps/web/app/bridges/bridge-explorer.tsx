"use client";

import { useState, useMemo } from "react";
import {
  BRIDGES,
  BRIDGE_TIER_COLORS,
  BRIDGE_TIER_LABELS,
  BRIDGE_CATEGORY_LABELS,
} from "@tensorcraft/shared";
import type { Bridge, BridgeTier, BridgeCategory } from "@tensorcraft/shared";

type TierFilter = BridgeTier | "all";
type CategoryFilter = BridgeCategory | "all";

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
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search bridges... (e.g. "ReLU", "middleware", "canvas")'
          className="flex-1 rounded-full bg-surface border border-border px-5 py-3 text-sm text-text-primary placeholder:text-text-muted/60 outline-none focus:border-accent/40 transition-colors"
        />

        {/* Tier filter */}
        <div className="flex items-center gap-2">
          <TierPill
            active={tierFilter === "all"}
            onClick={() => setTierFilter("all")}
            color="#8B92A5"
            label="All tiers"
          />
          {(Object.keys(BRIDGE_TIER_LABELS) as BridgeTier[]).map((tier) => (
            <TierPill
              key={tier}
              active={tierFilter === tier}
              onClick={() => setTierFilter(tierFilter === tier ? "all" : tier)}
              color={BRIDGE_TIER_COLORS[tier]}
              label={BRIDGE_TIER_LABELS[tier]}
            />
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(
          ["all", ...Object.keys(BRIDGE_CATEGORY_LABELS)] as CategoryFilter[]
        ).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              categoryFilter === cat
                ? "border-accent/40 text-accent bg-accent/10"
                : "border-border text-text-muted hover:text-text-primary hover:border-white/15"
            }`}
          >
            {cat === "all"
              ? "All categories"
              : BRIDGE_CATEGORY_LABELS[cat as BridgeCategory]}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-text-muted text-sm mb-6">
        {filtered.length} bridge{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          No bridges match your search. Try a different term.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
  const color = BRIDGE_TIER_COLORS[bridge.tier];

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="text-left rounded-2xl p-5 border border-border bg-surface hover:border-white/15 transition-colors cursor-pointer"
    >
      {/* Tier badge + category */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full"
          style={{
            color,
            background: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          {BRIDGE_TIER_LABELS[bridge.tier]}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-text-muted">
          {BRIDGE_CATEGORY_LABELS[bridge.category]}
        </span>
      </div>

      {/* Two-side layout */}
      <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-0 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
            Frontend
          </p>
          <p className="text-sm font-medium text-text-primary leading-snug">
            {bridge.feConcept}
          </p>
        </div>

        <div className="flex justify-center">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
            style={{
              border: `1px solid ${color}`,
              color,
            }}
          >
            ⇄
          </span>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
            ML
          </p>
          <p className="text-sm font-medium text-text-primary leading-snug">
            {bridge.mlConcept}
          </p>
        </div>
      </div>

      {/* Expandable connection */}
      {expanded && (
        <p className="text-xs leading-relaxed text-text-muted mt-3 pt-3 border-t border-border">
          {bridge.connection}
        </p>
      )}

      {!expanded && (
        <p className="text-[11px] text-text-muted/50 mt-2">Click to expand</p>
      )}
    </button>
  );
}

/* ── Tier Pill ─────────────────────────────────────────────────────── */

function TierPill({
  active,
  onClick,
  color,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
      style={{
        borderColor: active ? `${color}60` : "rgba(255,255,255,0.06)",
        color: active ? color : "#8B92A5",
        background: active ? `${color}10` : "transparent",
      }}
    >
      {label}
    </button>
  );
}
