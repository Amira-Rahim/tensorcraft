import { describe, it, expect } from "vitest";
import { LAUNCHED_THEMES, PRICING } from "@tensorcraft/shared";
import { buildPricingOffers } from "../pricing-jsonld";

/**
 * First coverage of the pricing JSON-LD offers (2026-08-09).
 *
 * The offers array had no tests at all, which is how it went on advertising
 * schema.org PreOrder for bundles that had no pre-order mechanism until audit
 * R3-7 caught it by eye on 2026-07-19. These assertions are the regression
 * guard that eye was standing in for.
 */
describe("buildPricingOffers", () => {
  it("lists every tier, so the catalog describes the whole product", () => {
    expect(buildPricingOffers().map((o) => o.name)).toEqual([
      "Free preview",
      "Single theme",
      "Two-theme bundle",
      "Three-theme bundle",
      "All five themes",
    ]);
  });

  it("never claims PreOrder: no order can be placed for an unlaunched theme", () => {
    // The R3-7 regression guard. PreOrder asserts an order can be placed now
    // for later delivery; the checkout API rejects any basket with an
    // unlaunched theme, so no such path exists at any price.
    for (const offer of buildPricingOffers()) {
      expect(offer.availability).not.toContain("PreOrder");
    }
  });

  it("marks a tier InStock exactly when enough themes have launched", () => {
    const availability = Object.fromEntries(
      buildPricingOffers().map((o) => [o.name, o.availability]),
    );
    const expected = (themes: number) =>
      LAUNCHED_THEMES.length >= themes
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

    expect(availability["Free preview"]).toBe(expected(PRICING.free.themes));
    expect(availability["Single theme"]).toBe(expected(PRICING.single.themes));
    expect(availability["Two-theme bundle"]).toBe(
      expected(PRICING.twoBundle.themes),
    );
    expect(availability["All five themes"]).toBe(
      expected(PRICING.allFive.themes),
    );
  });

  it("quotes prices from PRICING, never a literal", () => {
    const priced = Object.fromEntries(
      buildPricingOffers().map((o) => [o.name, o.price]),
    );
    expect(priced["Single theme"]).toBe(String(PRICING.single.price));
    expect(priced["All five themes"]).toBe(String(PRICING.allFive.price));
  });
});
