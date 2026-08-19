import { describe, it, expect } from "vitest";
import { LAUNCHED_WORLDS, PRICING } from "@tensorcraft/shared";
import { buildPricingOffers } from "../pricing-jsonld";

/**
 * First coverage of the pricing JSON-LD offers (2026-08-09).
 *
 * The offers array had no tests at all, which is how it went on advertising
 * schema.org PreOrder for bundles that had no pre-order mechanism until audit
 * R3-7 caught it by eye on 2026-07-19. These assertions are the regression
 * guard that eye was standing in for.
 *
 * 2026-08-14 (owner directive): future product plans are not published on
 * any user surface, structured data included. The contract flipped from
 * "every tier listed, availability carries the signal" to "only buyable
 * tiers exist in the catalog at all".
 */
describe("buildPricingOffers", () => {
  it("emits only tiers a buyer can purchase today", () => {
    // Pinned on purpose: when world 2 launches this fails, which is the
    // reminder to walk the "Restore the bundle surfaces" checklist in
    // docs/post-launch-backlog.md before shipping the grown catalog.
    expect(LAUNCHED_WORLDS).toHaveLength(1);
    expect(buildPricingOffers().map((o) => o.name)).toEqual([
      "Free preview",
      "Full course",
    ]);
  });

  it("never lists a tier that needs more worlds than have launched", () => {
    // The owner-directive guard: an unbuyable bundle in a search snippet is
    // a future product plan, and those are not published.
    const gatedNames = (
      [
        ["Two-world bundle", PRICING.twoBundle.worlds],
        ["Three-world bundle", PRICING.threeBundle.worlds],
        ["All five worlds", PRICING.allFive.worlds],
      ] as const
    )
      .filter(([, worlds]) => LAUNCHED_WORLDS.length < worlds)
      .map(([name]) => name);
    const emitted = buildPricingOffers().map((o) => o.name);
    for (const name of gatedNames) {
      expect(emitted).not.toContain(name);
    }
  });

  it("marks every emitted offer InStock, never PreOrder or OutOfStock", () => {
    // Membership now carries the buyability signal, so anything emitted must
    // be purchasable. PreOrder stays banned for the original R3-7 reason: no
    // pre-order mechanism exists at any price.
    for (const offer of buildPricingOffers()) {
      expect(offer.availability).toBe("https://schema.org/InStock");
    }
  });

  it("quotes prices from PRICING, never a literal", () => {
    const priced = Object.fromEntries(
      buildPricingOffers().map((o) => [o.name, o.price]),
    );
    expect(priced["Free preview"]).toBe(String(PRICING.free.price));
    expect(priced["Full course"]).toBe(String(PRICING.single.price));
  });
});
