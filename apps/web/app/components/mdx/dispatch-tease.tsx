import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { getLeadsTo } from "@tensorcraft/shared";

interface DispatchTeaseProps {
  /**
   * The theme this finale belongs to. When set, the tease TARGET is resolved
   * from the journey ring (getLeadsTo) instead of being hardcoded — so the
   * "leads to" relationship lives in the journey model
   * (packages/shared/src/journey.ts), and reordering the ring updates every
   * tease automatically. This is the de-siloing: the cross-theme handoff is
   * modeled once, not copy-pasted into five capstones.
   */
  fromThemeId?: string;
  /** Explicit target override. Optional when `fromThemeId` is given. */
  toThemeId?: string;
  /** Display name override. Defaults to the target theme's registered name. */
  toThemeName?: string;
  /** 1-3 sentence DISPATCH narrator beat introducing the cross-theme thread. */
  body: string;
  /** Override CTA label. Defaults to "Continue this thread in {toThemeName}". */
  ctaLabel?: string;
}

/**
 * Free-reveal cross-theme cliffhanger. Always shown to anyone who reaches
 * this lesson, soft-gate per scoping lock #1. Purchase = depth, not unlock.
 *
 * Renders inside the theme finale lesson MDX. CTA points at the next theme's
 * detail page; learners who already own it land in /themes/[slug], non-owners
 * hit the pricing-aware lock flow there. Target and name resolve from the
 * journey ring when `fromThemeId` is provided; explicit props still override.
 */
export function DispatchTease({
  fromThemeId,
  toThemeId,
  toThemeName,
  body,
  ctaLabel,
}: DispatchTeaseProps) {
  const targetId =
    toThemeId ?? (fromThemeId ? getLeadsTo(fromThemeId) : undefined);
  if (!targetId) return null;
  const targetName = toThemeName ?? themes[targetId]?.displayName ?? targetId;

  return (
    <aside
      className="my-10 p-6 brutalist-shadow bg-surface-raised border border-border"
      data-testid="dispatch-tease"
      style={{ borderLeft: "4px solid var(--tc-primary)" }}
    >
      <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary mb-3">
        DISPATCH · cross-theme intel
      </p>
      <p className="text-base text-text-primary leading-relaxed mb-5">{body}</p>
      <Link
        href={`/themes/${targetId}`}
        className="inline-block px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-primary text-on-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-colors"
        data-testid="dispatch-tease-cta"
      >
        {ctaLabel ?? `Continue this thread in ${targetName} →`}
      </Link>
    </aside>
  );
}
