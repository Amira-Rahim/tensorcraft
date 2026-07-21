"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { hasAnalyticsConsent, onConsentChange } from "../../lib/consent";

export function PlausibleScript() {
  const [consented, setConsented] = useState(false);
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  // Previously listened only for `storage`, which browsers do not fire in the
  // tab that wrote the value — i.e. never in the tab where the visitor just
  // accepted. Plausible therefore never loaded in the session consent was
  // granted. `onConsentChange` covers both same-tab and cross-tab.
  useEffect(() => {
    return onConsentChange(() => setConsented(hasAnalyticsConsent()));
  }, []);

  if (!domain || !consented) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
