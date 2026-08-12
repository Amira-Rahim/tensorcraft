import { LAUNCHED_WORLDS, PRICING } from "@tensorcraft/shared";

/**
 * BundleRoadmap: the bundle ladder stated, not sold.
 *
 * The pricing grid used to render all five tiers, which meant three cards
 * whose only interaction was a dead CTA reading "Available when more worlds
 * launch". Two things were wrong with that.
 *
 * 1. Anchoring inversion. With one world launched, the only live paid card
 *    was the SECOND cheapest of five, so $59 read as a stripped entry tier
 *    when $59 is in fact the entire product.
 * 2. An implied schedule. "Available when more worlds launch" sounds like a
 *    roadmap with dates on it. World 2 is gated on world 1 launching AND
 *    reaching a paying-user threshold; that promises no date at all, and
 *    quoting a price against an unstarted world is the part a buyer would
 *    rightly call unfair.
 *
 * So the bundle prices stay visible (they are real, and a buyer comparing
 * ladders deserves to see where this one goes) but they carry no purchase
 * affordance whatsoever: no CheckoutButton, no disabled button, no link.
 * A disabled control is still a control; it invites a click and then refuses
 * it. A statement does not.
 *
 * Presentation only. PRICING is untouched and the server diff is zero.
 *
 * Server component on purpose: no state, no interactivity, nothing to
 * hydrate.
 *
 * Accessibility: the unavailable state is carried by the words "not for
 * sale" on every row, never by the muted colour alone (WCAG 1.4.1), the
 * same rule the WorldPicker in pricing-tiers.tsx follows for selection.
 */

const BUNDLE_TIERS = ["twoBundle", "threeBundle", "allFive"] as const;

export function BundleRoadmap() {
  // Derive the gate rather than hardcoding "unavailable": a tier that
  // becomes buyable must not keep claiming it is not for sale. When no tier
  // is gated any more there is nothing to state and the strip disappears.
  const gated = BUNDLE_TIERS.filter(
    (id) => LAUNCHED_WORLDS.length < PRICING[id].worlds,
  );
  if (gated.length === 0) return null;

  return (
    <section
      data-testid="bundle-roadmap"
      aria-labelledby="bundle-roadmap-heading"
      className="px-6 pb-20"
    >
      {/* max-w-4xl, not 7xl: the refund badge, the tier cards and the
          curriculum preview all sit at 4xl, so a wider box here broke the
          page's vertical edge alignment. Caught by eye on the regenerated
          2026-08-09 baseline, not by any assertion. */}
      <div className="max-w-4xl mx-auto">
        <div className="border border-border bg-surface/60 rounded-none p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted font-mono">
            bundle pricing &middot; {LAUNCHED_WORLDS.length} of{" "}
            {PRICING.allFive.worlds} worlds built
          </p>
          <h2
            id="bundle-roadmap-heading"
            className="mt-3 text-xl sm:text-2xl font-bold text-text-primary font-mono tracking-tight"
          >
            Listed, not sold.
          </h2>
          {/* Register note (2026-08-09): an earlier draft named the internal
              gate ("enough paying learners to justify the work") and said
              nobody had started world two. Both were true, and both went past
              the brief: the requirement is to promise no date, not to hand a
              buyer reasons to doubt the roadmap exists. This says the same
              three facts (one world built, $59 is the product, no date) and
              volunteers nothing further. */}
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted font-sans">
            Bundle pricing exists for when more worlds do. Deep Orbit is the one
            world built today, and at ${PRICING.single.price} it is the only
            thing on this page you can buy. The rest unlock as worlds ship, and
            we are not putting a date on that.
          </p>

          <ul className="mt-6 border-t border-border">
            {gated.map((id) => (
              <li
                key={id}
                data-bundle-tier={id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-3"
              >
                <span className="text-xs uppercase tracking-wider text-text-primary font-mono">
                  {PRICING[id].label}
                </span>
                <span className="flex items-baseline gap-3">
                  <span className="text-lg font-bold text-text-muted font-mono">
                    ${PRICING[id].price}
                  </span>
                  {/* Text, not tint: the state has to survive greyscale and
                      a screen reader. */}
                  <span className="border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-text-muted font-mono">
                    not for sale
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
