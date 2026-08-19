import { LAUNCHED_WORLDS, PRICING, WORLD_CONTENT } from "@tensorcraft/shared";

// A bundle Offer is only InStock once enough worlds have launched to fill it
// (mirrors the cart gating in pricing-tiers.tsx). Until then it is
// OutOfStock, NOT PreOrder: schema.org PreOrder asserts an order can be
// placed now for later delivery, and no pre-order mechanism exists - the
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

// The full ladder stays DEFINED here, but only buyable tiers are EMITTED
// (owner directive, 2026-08-14): a search snippet quoting a bundle price
// nobody can buy is exactly the future product plan the owner removed from
// every user surface. This supersedes the 2026-08-09 decision to list gated
// bundles as OutOfStock; OutOfStock was truthful, but truthful is no longer
// the bar - the bar is "not published until buyable". Each bundle tier
// reappears on its own the day enough worlds have launched to fill it.
const OFFER_DEFS: PricingOfferDef[] = [
  {
    name: "Free preview",
    price: PRICING.free.price,
    worlds: PRICING.free.worlds,
    description:
      "Module 1 of Deep Orbit free: lessons and exercises, no account required.",
  },
  {
    name: "Full course",
    price: PRICING.single.price,
    worlds: PRICING.single.worlds,
    description: `One full course: ${WORLD_CONTENT.totalLessonsPerWorld} lessons across ${WORLD_CONTENT.modulesPerWorld} modules, capstone, lifetime access.`,
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
 * Membership carries the "can you buy this today" signal: a tier is emitted
 * only once enough worlds have launched to fill it (owner directive,
 * 2026-08-14, see OFFER_DEFS comment). `availabilityFor` still runs on what
 * is emitted so a mid-cycle launch flip cannot strand a stale value.
 */
export function buildPricingOffers() {
  return OFFER_DEFS.filter(
    (offer) => LAUNCHED_WORLDS.length >= offer.worlds,
  ).map((offer) => ({
    "@type": "Offer" as const,
    name: offer.name,
    price: String(offer.price),
    priceCurrency: "USD",
    availability: availabilityFor(offer.worlds),
    description: offer.description,
  }));
}
