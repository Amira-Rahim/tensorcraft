/**
 * EU/UK region gate, presentation half.
 *
 * The country is resolved once in `middleware.ts` from Vercel's
 * `x-vercel-ip-country` and handed to the client as a cookie, because
 * `/pricing` is statically rendered (`revalidate = 3600`) and reading request
 * headers in the page would make every hit dynamic.
 *
 * This is NOT the enforcement. The API refuses checkout for gated countries
 * using Cloudflare's `CF-IPCountry`, which the client cannot forge. Deleting
 * this cookie only gets you a buy button that answers 403.
 *
 * See the Tier 1-LEGAL decision note in `docs/post-launch-backlog.md`.
 */
export const REGION_GATED_COOKIE = "tc_region_gated";

/** Whether the gated flag is present and set, given a raw cookie string. */
export function isRegionGatedCookie(cookieString: string): boolean {
  return cookieString
    .split(";")
    .some((part) => part.trim() === `${REGION_GATED_COOKIE}=1`);
}
