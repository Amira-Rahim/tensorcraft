import Link from "next/link";

interface DispatchTeaseProps {
  /** Theme slug the tease is pointing toward (next-theme target). */
  toThemeId: string;
  /** Display name for the target theme. */
  toThemeName: string;
  /** 1-3 sentence DISPATCH narrator beat introducing the cross-theme thread. */
  body: string;
  /** Override CTA label. Defaults to "Continue this thread in {toThemeName}". */
  ctaLabel?: string;
}

/**
 * Free-reveal cross-theme cliffhanger. Always shown to anyone who reaches
 * this lesson — soft-gate per scoping lock #1. Purchase = depth, not unlock.
 *
 * Renders inside the theme finale lesson MDX. CTA points at the next
 * theme's detail page; learners who already own it land in /themes/[slug],
 * non-owners hit the pricing-aware lock flow there.
 */
export function DispatchTease({
  toThemeId,
  toThemeName,
  body,
  ctaLabel,
}: DispatchTeaseProps) {
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
        href={`/themes/${toThemeId}`}
        className="inline-block px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-primary text-page border-2 border-primary hover:bg-transparent hover:text-primary transition-colors"
        data-testid="dispatch-tease-cta"
      >
        {ctaLabel ?? `Continue this thread in ${toThemeName} →`}
      </Link>
    </aside>
  );
}
