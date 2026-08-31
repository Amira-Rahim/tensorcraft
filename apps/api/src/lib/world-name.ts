/**
 * "deep-orbit" reads as an internal id to a customer. "Deep Orbit" does
 * not. Used everywhere a world slug reaches a buyer's eyes: the receipt
 * email and the Stripe checkout page's product description
 * (2026-08-31 phrasing audit; the checkout page showed raw slugs).
 */
export function worldDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
