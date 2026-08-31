"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_TRIES = 20;
const INTERVAL_MS = 3000;

/**
 * While the Stripe webhook hasn't confirmed the purchase yet, re-fetch
 * the server component on an interval so the page flips to the confirmed
 * state on its own. Replaces the old "refresh this page shortly" ask, the
 * most anxious moment in the journey (2026-07-14 UX audit).
 *
 * The polling is bounded, and the bound is VISIBLE: this used to stop
 * silently after 60 seconds under page copy promising "this page updates
 * itself the moment it clears", which left a paying customer with a slow
 * or lost webhook staring at a frozen page with no recourse (audit run #7).
 * On exhaustion it now says so, offers a retry, and gives the customer a
 * support address with their session reference pre-filled.
 */
export function PendingPoller({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  // Incremented by "Check again" to restart the bounded polling loop.
  const [pollRun, setPollRun] = useState(0);

  useEffect(() => {
    // Guard on timedOut: if the effect re-runs after exhaustion (a new
    // router identity is enough to retrigger it), an unguarded body would
    // silently start a FRESH interval with a reset counter and poll forever.
    if (timedOut) return;
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (tries > MAX_TRIES) {
        clearInterval(id);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [router, pollRun, timedOut]);

  const mailSubject = encodeURIComponent("Purchase not confirmed");
  const mailBody = encodeURIComponent(
    `My payment went through but the confirmation page is still pending.\n` +
      (sessionId ? `Checkout session: ${sessionId}\n` : ""),
  );

  // The live region must exist BEFORE it has content: mounting
  // role="status" together with its message announces unreliably across
  // screen readers (same rule as exercise.tsx's TestResultsLiveRegion -
  // the region is always in the tree, the message arrives later).
  if (!timedOut) return <div role="status" aria-live="polite" />;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="pending-timeout"
      className="max-w-xl mx-auto mb-12 border border-border bg-surface-raised px-6 py-5 text-left"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-text-muted mb-2">
        Taking longer than usual
      </p>
      <p className="text-sm leading-relaxed text-text-primary mb-4">
        Your payment is still being confirmed. That can take a few minutes for
        some payment methods. Your access unlocks automatically the moment the
        payment clears, and nothing is lost by waiting. If this page still shows
        &quot;Almost There&quot; after a few minutes, tell us and we&apos;ll
        sort it out directly.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => {
            setTimedOut(false);
            setPollRun((n) => n + 1);
          }}
          className="inline-flex items-center justify-center h-10 px-5 text-sm font-mono border-2 border-primary text-primary hover:bg-primary hover:text-on-primary transition-colors"
        >
          Check again
        </button>
        <a
          href={`mailto:support@tensorcraft.app?subject=${mailSubject}&body=${mailBody}`}
          className="inline-flex items-center justify-center h-10 px-5 text-sm font-mono border border-interactive text-text-primary hover:border-primary transition-colors"
        >
          Email support
        </a>
      </div>
    </div>
  );
}
