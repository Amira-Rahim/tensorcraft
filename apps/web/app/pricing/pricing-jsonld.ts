import { LAUNCHED_THEMES, PRICING, THEME_CONTENT } from "@tensorcraft/shared";

// A bundle Offer is only InStock once enough themes have launched to fill it
// (mirrors the cart gating in pricing-tiers.tsx). Until then it is
// OutOfStock, NOT PreOrder: schema.org PreOrder asserts an order can be
// placed now for later delivery, and no pre-order mechanism exists — the
// checkout buttons are hard-disabled (same overclaim the coming-soon stub
// fixed on 2026-07-19; R3-7 caught these bundle offers still saying
// PreOrder).
const IN_STOCK = "https://schema.org/InStock";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";
export const availabilityFor = (themes: number) =>
  LAUNCHED_THEMES.length >= themes ? IN_STOCK : OUT_OF_STOCK;

interface PricingOfferDef {
  name: string;
  price: number;
  themes: number;
  description: string;
}

// Every tier is listed, including bundles no buyer can complete checkout on
// yet. That is deliberate: `availabilityFor` marks them OutOfStock, which is
// a truthful description of a product that exists in the catalog and is not
// currently purchasable. A 2026-08-09 change briefly filtered them out on the
// belief that they were still emitting PreOrder; they were not (R3-7 fixed
// that on 2026-07-19), so the filter was reverted rather than override a
// correct, documented decision.
const OFFER_DEFS: PricingOfferDef[] = [
  {
    name: "Free preview",
    price: PRICING.free.price,
    themes: PRICING.free.themes,
    description:
      "Module 1 of Deep Orbit free: lessons and exercises, no account required. The other four themes ship in waves with per-theme waitlists.",
  },
  {
    name: "Single theme",
    price: PRICING.single.price,
    themes: PRICING.single.themes,
    description: `One full theme: ${THEME_CONTENT.totalLessonsPerTheme} lessons across ${THEME_CONTENT.modulesPerTheme} modules, capstone, lifetime access.`,
  },
  {
    name: "Two-theme bundle",
    price: PRICING.twoBundle.price,
    themes: PRICING.twoBundle.themes,
    description: "Any two themes bundled, lifetime access.",
  },
  {
    name: "Three-theme bundle",
    price: PRICING.threeBundle.price,
    themes: PRICING.threeBundle.themes,
    description: "Any three themes bundled, lifetime access.",
  },
  {
    name: "All five themes",
    price: PRICING.allFive.price,
    themes: PRICING.allFive.themes,
    description:
      "All five themes (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid). Lifetime access.",
  },
];

/**
 * Builds the JSON-LD Offer list for the pricing page.
 *
 * Extracted from page.tsx on 2026-08-09 so the offers array is testable: it
 * had no coverage at all, which is how a stale PreOrder value survived
 * several audits before R3-7 caught it by eye.
 *
 * Every tier is emitted. Availability, not membership, carries the "can you
 * buy this today" signal, and it flips on its own as themes launch.
 */
export function buildPricingOffers() {
  return OFFER_DEFS.map((offer) => ({
    "@type": "Offer" as const,
    name: offer.name,
    price: String(offer.price),
    priceCurrency: "USD",
    availability: availabilityFor(offer.themes),
    description: offer.description,
  }));
}
