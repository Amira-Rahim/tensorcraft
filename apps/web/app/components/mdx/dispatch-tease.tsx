import Link from "next/link";
import { worlds } from "@tensorcraft/worlds";
import { getLeadsTo } from "@tensorcraft/shared";

interface DispatchTeaseProps {
  /**
   * The world this finale belongs to. When set, the tease TARGET is resolved
   * from the journey ring (getLeadsTo) instead of being hardcoded — so the
   * "leads to" relationship lives in the journey model
   * (packages/shared/src/journey.ts), and reordering the ring updates every
   * tease automatically. This is the de-siloing: the cross-world handoff is
   * modeled once, not copy-pasted into five capstones.
   */
  fromWorldId?: string;
  /** Explicit target override. Optional when `fromWorldId` is given. */
  toWorldId?: string;
  /** Display name override. Defaults to the target world's registered name. */
  toWorldName?: string;
  /** 1-3 sentence DISPATCH narrator beat introducing the cross-world thread. */
  body: string;
  /** Override CTA label. Defaults to "Continue this thread in {toWorldName}". */
  ctaLabel?: string;
}

/**
 * Free-reveal cross-world cliffhanger. Always shown to anyone who reaches
 * this lesson, soft-gate per scoping lock #1. Purchase = depth, not unlock.
 *
 * Renders inside the world finale lesson MDX. CTA points at the next world's
 * detail page; learners who already own it land in /worlds/[slug], non-owners
 * hit the pricing-aware lock flow there. Target and name resolve from the
 * journey ring when `fromWorldId` is provided; explicit props still override.
 */
export function DispatchTease({
  fromWorldId,
  toWorldId,
  toWorldName,
  body,
  ctaLabel,
}: DispatchTeaseProps) {
  const targetId =
    toWorldId ?? (fromWorldId ? getLeadsTo(fromWorldId) : undefined);
  if (!targetId) return null;
  const targetName = toWorldName ?? worlds[targetId]?.displayName ?? targetId;

  return (
    <aside
      className="my-10 p-6 brutalist-shadow bg-surface-raised border border-border"
      data-testid="dispatch-tease"
      style={{ borderLeft: "4px solid var(--tc-primary)" }}
    >
      <p className="text-[10px] font-mono uppercase tracking-[3px] text-primary mb-3">
        DISPATCH · cross-world intel
      </p>
      <p className="text-base text-text-primary leading-relaxed mb-5">{body}</p>
      <Link
        href={`/worlds/${targetId}`}
        className="inline-block px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-primary text-on-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-colors"
        data-testid="dispatch-tease-cta"
      >
        {ctaLabel ?? `Continue this thread in ${targetName} →`}
      </Link>
    </aside>
  );
}
