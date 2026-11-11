"use client";

import { setConsentChoice } from "@/lib/consent";

/** Stop browser capture immediately and save the account withdrawal separately.
 * The banner reopens and keeps any unsaved account choice visible.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      data-testid="cookie-settings"
      className={className}
      onClick={() => {
        setConsentChoice(null);
        // The banner mounts at the layout level; scroll to keep it in view.
        window.scrollTo({ top: 0 });
      }}
    >
      Cookie settings
    </button>
  );
}
