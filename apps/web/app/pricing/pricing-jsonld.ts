import { LAUNCHED_WORLDS, PRICING, WORLD_CONTENT } from "@tensorcraft/shared";

// A bundle Offer is only InStock once enough worlds have launched to fill it
// (mirrors the cart gating in pricing-tiers.tsx). Until then it is
// OutOfStock, NOT PreOrder: schema.org PreOrder asserts an order can be
// placed now for later delivery, and no pre-order mechanism exists — the
// checkout buttons are hard-disabled (same overclaim the coming-soon stub
// fixed on 2026-07-19; R3-7 caught these bundle offers still saying
// PreOrder).
const IN_STOCK = "https://schema.org/InStock";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";
export const availabilityFor = (worlds: number) =>
  LAUNCHED_WORLDS.length >= worlds ? IN_STOCK : OUT_OF_STOCK;

interface PricingOfferDef {
  name: string;
  price: number;
  worlds: number;
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
    worlds: PRICING.free.worlds,
    description:
      "Module 1 of Deep Orbit free: lessons and exercises, no account required. The other four worlds ship in waves with per-world waitlists.",
  },
  {
    name: "Single world",
    price: PRICING.single.price,
    worlds: PRICING.single.worlds,
    description: `One full world: ${WORLD_CONTENT.totalLessonsPerWorld} lessons across ${WORLD_CONTENT.modulesPerWorld} modules, capstone, lifetime access.`,
  },
  {
    name: "Two-world bundle",
    price: PRICING.twoBundle.price,
    worlds: PRICING.twoBundle.worlds,
    description: "Any two worlds bundled, lifetime access.",
  },
  {
    name: "Three-world bundle",
    price: PRICING.threeBundle.price,
    worlds: PRICING.threeBundle.worlds,
    description: "Any three worlds bundled, lifetime access.",
  },
  {
    name: "All five worlds",
    price: PRICING.allFive.price,
    worlds: PRICING.allFive.worlds,
    description:
      "All five worlds (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid). Lifetime access.",
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
 * buy this today" signal, and it flips on its own as worlds launch.
 */
export function buildPricingOffers() {
  return OFFER_DEFS.map((offer) => ({
    "@type": "Offer" as const,
    name: offer.name,
    price: String(offer.price),
    priceCurrency: "USD",
    availability: availabilityFor(offer.worlds),
    description: offer.description,
  }));
}
