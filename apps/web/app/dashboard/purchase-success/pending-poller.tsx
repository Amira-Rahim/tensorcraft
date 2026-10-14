"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const MAX_TRIES = 20;
const INTERVAL_MS = 3000;

export function PendingHelp({
  sessionId,
  children,
  active = true,
}: {
  sessionId?: string;
  children: ReactNode;
  active?: boolean;
}) {
  const mailSubject = encodeURIComponent("Purchase not confirmed");
  const mailBody = encodeURIComponent(
    `My payment went through but the confirmation page is still pending.\n` +
      (sessionId ? `Checkout session: ${sessionId}\n` : ""),
  );

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={active ? "pending-timeout" : undefined}
      className={active ? "purchase-pending-help" : undefined}
    >
      {active && (
        <>
          <h2>Taking longer than usual</h2>
          <p>
            We&apos;re still waiting for payment confirmation. Some payment
            methods take a few minutes.
          </p>
          <div className="purchase-actions">
            {children}
            <a
              href={`mailto:support@tensorcraft.app?subject=${mailSubject}&body=${mailBody}`}
              className="purchase-button purchase-button-secondary"
            >
              Email support
            </a>
          </div>
        </>
      )}
    </div>
  );
}

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

  // The live region must exist BEFORE it has content: mounting
  // role="status" together with its message announces unreliably across
  // screen readers (same rule as exercise.tsx's TestResultsLiveRegion -
  // the region is always in the tree, the message arrives later).
  return (
    <PendingHelp sessionId={sessionId} active={timedOut}>
      <button
        type="button"
        onClick={() => {
          setTimedOut(false);
          setPollRun((n) => n + 1);
        }}
        className="purchase-button"
      >
        Check again
      </button>
    </PendingHelp>
  );
}
