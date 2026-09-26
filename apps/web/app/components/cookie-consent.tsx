"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import { CONSENT_KEY, notifyConsentChanged } from "../../lib/consent";

/* The bar publishes its height here while it shows. body reads it as
   bottom padding (globals.css), so the end of every page scrolls clear of
   the bar. The fixed layers that share its bottom edge (the toasts,
   the Report issue panel, the lesson drawer, the mobile menu and the
   glossary popover) read it too, because body padding moves none of them.
   The bar's own bottom padding clears the iOS home indicator (viewportFit
   is "cover"), and the measured height includes it. */
const CONSENT_HEIGHT_PROPERTY = "--tc-consent-h";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        setVisible(true);
      }
    } catch {
      // localStorage may be blocked (e.g. private browsing)
      setVisible(true);
    }
  }, []);

  // A plain effect, not a layout effect: the first publish lands a frame
  // after paint, which no reader can see, and the component renders null
  // on the server anyway.
  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    const bar = barRef.current;
    const publish = () => {
      const height = bar ? bar.getBoundingClientRect().height : 0;
      root.style.setProperty(CONSENT_HEIGHT_PROPERTY, `${height}px`);
    };
    publish();
    // Re-publish when the text wraps differently (a resize, a font swap).
    // jsdom has no ResizeObserver; the first publish still runs there.
    let observer: ResizeObserver | undefined;
    if (bar && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(publish);
      observer.observe(bar);
    }
    return () => {
      observer?.disconnect();
      root.style.removeProperty(CONSENT_HEIGHT_PROPERTY);
    };
  }, [visible]);

  // Both paths notify in-tab listeners. Writing localStorage alone is not
  // enough: the `storage` event does not fire in the tab that wrote the
  // value, so analytics stayed uninitialized for the whole session in which
  // the visitor actually accepted.
  function accept() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(CONSENT_KEY, "accepted");
      }
    } catch {
      // localStorage may be unavailable
    }
    notifyConsentChanged();
    setVisible(false);
  }

  function decline() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(CONSENT_KEY, "declined");
      }
    } catch {
      // localStorage may be unavailable
    }
    notifyConsentChanged();
    setVisible(false);
  }

  if (!visible) return null;

  /* One bar on the lesson frame's width: text left, choices right from md,
     stacked below it (spec 2026-09-24, section 1). No card, no offset
     shadow: a consent bar presents, it is not something the learner acts
     in for its own sake. The copy is the privacy audit's wording and does
     not change. */
  return (
    <div
      ref={barRef}
      role="region"
      aria-label="Cookie consent"
      data-testid="cookie-consent-card"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-raised rounded-none animate-fade-up"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:flex-row md:items-center md:justify-between md:gap-6 md:px-12">
        <p className="text-xs font-mono leading-relaxed text-text-muted">
          Essential cookies keep you signed in and remember your world choice.
          Analytics (PostHog, Vercel Analytics) runs only if you accept. See our{" "}
          <Link
            href="/privacy"
            className="text-primary rounded-none underline underline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={accept}
            className="min-h-11 border border-primary/30 bg-primary/8 px-5 py-2 text-sm font-mono font-medium rounded-none hover:bg-primary/25 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={decline}
            className="min-h-11 border border-border px-5 py-2 text-sm font-mono font-medium text-text-muted rounded-none hover:text-text-primary hover:border-text-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
