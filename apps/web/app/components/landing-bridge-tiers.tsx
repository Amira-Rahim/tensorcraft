import {
  BRIDGES,
  BRIDGE_TIER_LABELS,
  type BridgeTier,
} from "@tensorcraft/shared";

/**
 * Static bridge-tier table: one exemplar row per tier.
 *
 * Tiers explained briefly:
 *  - Identity    — same exact idea, different name.
 *  - Structural  — same shape/mechanism, different domain.
 *  - Intuition   — same mental model, different math.
 *
 * Rows are picked deterministically from the canonical BRIDGES catalog
 * so the table always reflects the source of truth.
 */

const TIER_ORDER: BridgeTier[] = ["identity", "structural", "intuition"];

const TIER_COLOR_VAR: Record<BridgeTier, string> = {
  identity: "var(--tc-tier-identity, var(--tc-primary))",
  structural: "var(--tc-tier-structural, var(--tc-primary))",
  intuition: "var(--tc-tier-intuition, var(--tc-muted))",
};

const TIER_BLURB: Record<BridgeTier, string> = {
  identity: "Same idea. Different name.",
  structural: "Same shape. Different domain.",
  intuition: "Same mental model. Different math.",
};

function firstBridgeOfTier(tier: BridgeTier) {
  return BRIDGES.find((b) => b.tier === tier);
}

const TIER_ROWS = TIER_ORDER.map((tier) => {
  const bridge = firstBridgeOfTier(tier);
  return { tier, bridge };
}).filter(
  (row): row is { tier: BridgeTier; bridge: NonNullable<typeof row.bridge> } =>
    Boolean(row.bridge),
);

export function LandingBridgeTiers() {
  return (
    <section
      id="bridge-tiers"
      data-testid="landing-bridge-tiers"
      className="border-b border-border"
    >
      <div className="px-10 md:px-20 pt-16 pb-10">
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-3">
          // BRIDGE TIERS
        </div>
        <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-3 uppercase">
          Three kinds of bridge
        </h2>
        <p className="text-[15px] text-text-muted leading-relaxed max-w-[560px] font-sans">
          Not every analogy is equally tight. We label every bridge by how
          precise the mapping is, so you always know whether you&apos;re
          learning the same thing twice or a genuinely new concept.
        </p>
      </div>

      <div className="border-t border-border grid grid-cols-1 md:grid-cols-3">
        {TIER_ROWS.map((row, i) => {
          const { tier, bridge } = row;
          const isLast = i === TIER_ROWS.length - 1;
          return (
            <article
              key={tier}
              data-testid="bridge-tier-row"
              data-tier={tier}
              className="px-8 md:px-10 py-10 border-b md:border-b-0 border-border"
              style={{
                borderRight: isLast ? "none" : "1px solid var(--tc-border)",
              }}
            >
              <div
                data-testid="tier-badge"
                className="inline-block rounded-none border-2 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] mb-5"
                style={{
                  borderColor: TIER_COLOR_VAR[tier],
                  color: TIER_COLOR_VAR[tier],
                }}
              >
                {BRIDGE_TIER_LABELS[tier]}
              </div>

              <p className="font-mono text-xs text-text-muted mb-6 uppercase tracking-wider">
                {TIER_BLURB[tier]}
              </p>

              <div className="border border-border rounded-none p-4 bg-surface">
                <div className="font-mono text-[11px] text-text-muted uppercase tracking-wider mb-2">
                  FE
                </div>
                <div className="font-mono text-sm text-text-primary mb-4">
                  {bridge.feConcept}
                </div>
                <div className="h-px bg-border mb-4" />
                <div className="font-mono text-[11px] text-text-muted uppercase tracking-wider mb-2">
                  ML
                </div>
                <div
                  className="font-mono text-sm"
                  style={{ color: "var(--tc-primary)" }}
                >
                  {bridge.mlConcept}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
