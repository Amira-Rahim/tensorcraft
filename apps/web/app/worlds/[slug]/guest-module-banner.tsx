"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { countGuestCompletedInModule } from "@/lib/guest-progress";

interface GuestModuleBannerProps {
  worldSlug: string;
  freeModuleSlug: string;
  freeModuleLessonCount: number;
  singlePrice: number;
  moduleTerm: string;
}

/**
 * The end-of-free-module moment for signed-out learners (2026-07-19 UX
 * audit). Guest completions never reach the DB, so the server-rendered
 * map shows guests zero progress and no purchase CTA at the exact moment
 * they are most ready to buy. This reads the local completion evidence
 * and stages the congratulation + save-your-progress + pricing ask.
 * Renders nothing for signed-in users (server omits it) or guests who
 * haven't finished the free module.
 */
export function GuestModuleBanner({
  worldSlug,
  freeModuleSlug,
  freeModuleLessonCount,
  singlePrice,
  moduleTerm,
}: GuestModuleBannerProps) {
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setComplete(
      countGuestCompletedInModule(worldSlug, freeModuleSlug) >=
        freeModuleLessonCount,
    );
  }, [worldSlug, freeModuleSlug, freeModuleLessonCount]);

  if (!complete) return null;

  return (
    <div
      className="mb-8 rounded-none border-2 p-6"
      style={{
        borderColor: "var(--tc-primary)",
        background: "var(--tc-surface)",
      }}
      data-testid="guest-module-complete-banner"
    >
      <p
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color: "var(--tc-primary)" }}
      >
        {moduleTerm} 1 complete
      </p>
      <p
        className="mt-2 font-sans text-sm leading-relaxed"
        style={{ color: "var(--tc-text)" }}
      >
        You finished the free {moduleTerm.toLowerCase()} without an account.
        Your progress only lives in this browser. Create a free account and
        we&apos;ll transfer your progress, so {moduleTerm.toLowerCase()} 2 opens
        where you left off.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/auth?redirectTo=${encodeURIComponent(`/worlds/${worldSlug}`)}`}
          className="rounded-none border-2 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest transition-all brutalist-hover"
          style={{
            background: "var(--tc-primary)",
            color: "var(--tc-on-primary)",
            borderColor: "var(--tc-primary)",
          }}
          data-testid="guest-banner-signup"
        >
          Save my progress, free
        </Link>
        <Link
          href={`/pricing?locked=${encodeURIComponent(worldSlug)}`}
          className="rounded-none border-2 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest transition-all brutalist-hover"
          style={{
            color: "var(--tc-primary)",
            borderColor: "var(--tc-primary)",
          }}
          data-testid="guest-banner-pricing"
        >
          Unlock the rest &middot; ${singlePrice}
        </Link>
      </div>
    </div>
  );
}
