"use client";

import { useState, useId } from "react";

interface DerivationDrawerProps {
  /**
   * Short summary of the derivation (1 line). Shown next to the chevron.
   * Example: "Chain rule, two-layer worked example"
   */
  summary: string;
  /**
   * Slug of the companion deep-dive lesson. Renders a "Read full derivation"
   * link that resolves to /themes/<themeSlug>/<moduleSlug>/<companionSlug>
   * when wrapped by a parent that knows the route. For now we surface the
   * slug as a relative link the parent route can rewrite if needed.
   */
  companionSlug?: string;
  /**
   * Optional href override. If provided, used directly instead of building
   * the URL from companionSlug. Lets MDX authors point at any lesson.
   */
  companionHref?: string;
  /**
   * Math content. Authors typically pass a <MathBlock> or pre-rendered
   * derivation steps as children.
   */
  children: React.ReactNode;
}

/**
 * <DerivationDrawer /> — closed-by-default disclosure that surfaces the
 * underlying math for an FE-bridge concept. Sits below the bridge callout
 * on training-loop main lessons. Default-closed honors the FE-bridge
 * pedagogy (you don't need calculus to ship); opening signals depth
 * exists for those who want it.
 *
 * Pattern: {@link docs/patterns/analogy-breaks-pattern.md} (companion).
 */
export function DerivationDrawer({
  summary,
  companionSlug,
  companionHref,
  children,
}: DerivationDrawerProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonId = useId();
  const href =
    companionHref ||
    (companionSlug ? `/extras/math-deep-dive/${companionSlug}` : null);

  return (
    <div
      data-testid="derivation-drawer"
      className="my-8 brutalist-shadow bg-surface-raised border border-border overflow-hidden"
    >
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left border-b border-border bg-code-bg hover:bg-surface-overlay transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span
          aria-hidden="true"
          className="font-mono text-xs text-text-muted transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
          ∂ derivation
        </span>
        <span className="font-mono text-xs text-text-primary/80 flex-1">
          {summary}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          {open ? "hide" : "open"}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          data-testid="derivation-drawer-content"
          className="p-5"
        >
          <div className="prose-invert">{children}</div>

          {href && (
            <div className="mt-5 pt-4 border-t border-border">
              <a
                href={href}
                className="font-mono text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Read full derivation in math-deep-dive →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
