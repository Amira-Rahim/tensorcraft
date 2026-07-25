"use client";

import { CONSENT_KEY, notifyConsentChanged } from "@/lib/consent";

/**
 * The consent WITHDRAWAL path (GDPR Art. 7(3): withdrawing must be as easy
 * as giving). The privacy page has always claimed "withdraw at any time",
 * but until this control existed the only routes were emailing support or
 * manually clearing localStorage — the banner renders solely when the
 * consent key is missing (Tier 1-LEGAL).
 *
 * Clearing the key does two things at once: every consent gate
 * (AnalyticsProvider, ConsentGatedVercelAnalytics) re-evaluates to false via
 * notifyConsentChanged, and the cookie banner reappears so the visitor can
 * make a fresh choice.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      data-testid="cookie-settings"
      className={className}
      onClick={() => {
        try {
          localStorage.removeItem(CONSENT_KEY);
        } catch {
          // Storage unavailable — nothing was consented in the first place.
        }
        notifyConsentChanged();
        // The banner mounts at the layout level; scroll to keep it in view.
        window.scrollTo({ top: 0 });
      }}
    >
      Cookie settings
    </button>
  );
}
