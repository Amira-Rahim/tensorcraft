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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-up">
      <div className="max-w-[640px] mx-auto rounded-2xl border border-border bg-surface-raised p-5 shadow-2xl">
        <p className="text-sm text-text-muted leading-relaxed mb-4">
          We use essential cookies for authentication and optional analytics
          cookies (PostHog) to improve the learning experience. See our{" "}
          <Link
            href="/privacy"
            className="text-accent hover:underline underline-offset-2"
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={accept}
            className="rounded-full border border-accent/30 bg-accent/8 px-5 py-2 text-sm font-medium hover:bg-accent/15 hover:border-accent/50 transition-all"
          >
            Accept all
          </button>
          <button
            onClick={decline}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-text-muted hover:text-text-primary hover:border-white/20 transition-all"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
