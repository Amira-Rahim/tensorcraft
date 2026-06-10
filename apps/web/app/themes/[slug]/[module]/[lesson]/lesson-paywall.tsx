"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackPaywallShown } from "@/lib/analytics";

interface LessonPaywallProps {
  themeSlug: string;
  themeName: string;
  accentColor: string;
  moduleId?: string;
}

/**
 * Shown instead of lesson content when a user hasn't purchased
 * the theme and is trying to access Module 2+.
 */
export function LessonPaywall({
  themeSlug,
  themeName,
  accentColor,
  moduleId,
}: LessonPaywallProps) {
  useEffect(() => {
    trackPaywallShown(themeSlug, moduleId || "unknown");
  }, [themeSlug, moduleId]);

  return (
    <div
      className="p-10 text-center my-12 bg-surface-raised"
      style={{
        border: `1px solid ${accentColor}25`,
      }}
    >
      <div className="text-4xl mb-4" style={{ color: accentColor }}>
        &#128274;
      </div>
      <h2 className="text-xl font-bold font-mono mb-3 text-text-primary">
        This lesson requires a purchase
      </h2>
      <p className="text-sm mb-6 max-w-md mx-auto leading-relaxed text-text-muted">
        Module 1 is free. Modules 2-11 of {themeName} (50 more lessons, the
        capstone, and your certificate) are one payment, yours forever.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium font-mono bg-primary text-page border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
        >
          View Pricing &rarr;
        </Link>
        <Link
          href={`/themes/${themeSlug}`}
          className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium font-mono border border-border text-text-muted hover:text-text-primary hover:border-primary/30 transition-all brutalist-hover"
        >
          Back to {themeName}
        </Link>
      </div>
    </div>
  );
}
