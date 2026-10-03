/**
 * Analytics consent, single source of truth.
 *
 * Consent used to be read straight from localStorage by each consumer inside
 * a mount-once effect. That silently broke the first session for every
 * visitor: on a first visit the key does not exist, the effect returned
 * early, and nothing ever re-ran it - accepting the banner only wrote
 * localStorage and hid the banner. So the session in which someone lands,
 * reads the free lesson, hits the paywall and decides whether to buy emitted
 * ZERO events. Tracking only began on a later hard page load.
 *
 * `notifyConsentChanged` closes that loop. The `storage` event is not enough:
 * browsers do not fire it in the tab that performed the write, which is
 * exactly the tab that needs to react.
 */

export const CONSENT_KEY = "tc-cookie-consent";

/** Custom event fired in-tab whenever consent is granted or withdrawn. */
export const CONSENT_CHANGED_EVENT = "tc-consent-changed";

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    // localStorage unavailable (private mode, blocked cookies): treat as
    // no consent. Failing closed is the correct default for tracking.
    return false;
  }
}

/** Call after writing the consent key so same-tab listeners react immediately. */
export function notifyConsentChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}

/**
 * Run `handler` now and again whenever consent changes, in this tab or
 * another. Returns an unsubscribe function.
 */
export function onConsentChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  handler();
  // Cross-tab: `storage` covers the case where consent is granted elsewhere.
  // It fires for every localStorage write in any other tab, so only the
  // consent key counts (`null` means another tab cleared storage). Unfiltered,
  // PostHog's own write on each capture made two open tabs re-run each
  // other's handlers without end.
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_KEY || event.key === null) handler();
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
}
