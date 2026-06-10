"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "tc-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

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

  function accept() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(CONSENT_KEY, "accepted");
      }
    } catch {
      // localStorage may be unavailable
    }
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
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-up"
    >
      <div
        data-testid="cookie-consent-card"
        className="max-w-160 mx-auto border border-border bg-surface-raised p-5 rounded-none brutalist-shadow"
      >
        <p className="text-sm text-text-muted leading-relaxed mb-4 font-mono">
          We use essential cookies for authentication and optional analytics
          cookies (PostHog) to improve the learning experience. See our{" "}
          <Link
            href="/privacy"
            className="text-primary rounded-none underline underline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={accept}
            className="min-h-11 border border-primary/30 bg-primary/8 px-5 py-2 text-sm font-mono font-medium rounded-none hover:bg-primary/25 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all brutalist-hover"
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
