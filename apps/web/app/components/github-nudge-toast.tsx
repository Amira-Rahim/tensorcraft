"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * One-time nudge shown when a passed exercise tried to push to GitHub and
 * the account isn't connected. The commit call is fire-and-forget by
 * design, so without this nothing in the lesson flow ever tells the
 * learner why their repo is empty (2026-07-13 value audit). The
 * once-per-browser guard lives at the dispatch site (github-commit.ts).
 */
export function GithubNudgeToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleNudge() {
      setVisible(true);
      setTimeout(() => setVisible(false), 20_000);
    }
    window.addEventListener("tc:github-nudge", handleNudge);
    return () => window.removeEventListener("tc:github-nudge", handleNudge);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-4 px-5 py-4 font-mono text-sm border border-primary/30 bg-primary/10 backdrop-blur-sm md:left-auto md:right-6 md:max-w-md"
      role="status"
      data-testid="github-nudge-toast"
    >
      <div>
        <p className="text-primary font-medium">Exercise solved. Repo empty.</p>
        <p className="text-text-muted text-xs mt-1">
          Connect GitHub in Settings and every solved exercise lands in your
          repo as a commit. Repos are created public on your GitHub account. A
          retroactive push covers everything you&apos;ve already solved.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          Dismiss
        </button>
        <Link
          href="/settings"
          className="text-xs font-semibold px-4 py-2 bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary transition-colors"
        >
          Connect →
        </Link>
      </div>
    </div>
  );
}
