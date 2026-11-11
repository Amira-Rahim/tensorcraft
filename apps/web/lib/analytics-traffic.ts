import { SITE_URL } from "./site-identity";

export const INTERNAL_TRAFFIC_KEY = "tc-internal-traffic";

const publicHostname = new URL(SITE_URL).hostname;
let lastSearch: string | undefined;
let unpersistedOverride: boolean | undefined;

/** Classify this browser without relying on an identified person profile. */
export function isInternalTraffic(): boolean {
  if (typeof window === "undefined") return false;

  const search = window.location.search;
  if (search !== lastSearch) {
    lastSearch = search;
    const directive = new URLSearchParams(search).get("tc_internal");
    if (directive === "1" || directive === "0") {
      unpersistedOverride = directive === "1";
      try {
        if (unpersistedOverride) {
          localStorage.setItem(INTERNAL_TRAFFIC_KEY, "1");
        } else {
          localStorage.removeItem(INTERNAL_TRAFFIC_KEY);
        }
        unpersistedOverride = undefined;
      } catch {
        // Keep the explicit choice for this page when storage is unavailable.
      }
    }
  }

  let markedInternal = unpersistedOverride ?? false;
  if (unpersistedOverride === undefined) {
    try {
      markedInternal = localStorage.getItem(INTERNAL_TRAFFIC_KEY) === "1";
    } catch {
      // Host-based classification still works without browser storage.
    }
  }

  const hostname = window.location.hostname;
  const publicHost =
    hostname === publicHostname || hostname === `www.${publicHostname}`;
  return !publicHost || markedInternal;
}
