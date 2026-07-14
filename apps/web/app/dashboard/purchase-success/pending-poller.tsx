"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * While the Stripe webhook hasn't confirmed the purchase yet, re-fetch
 * the server component on an interval so the page flips to the confirmed
 * state on its own. Replaces the old "refresh this page shortly" ask, the
 * most anxious moment in the journey (2026-07-14 UX audit). Stops after a
 * bounded number of tries so a genuinely failed payment doesn't poll
 * forever.
 */
export function PendingPoller() {
  const router = useRouter();
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (tries > 20) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
