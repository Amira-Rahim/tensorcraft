"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { errorMessageForCode } from "@/lib/error-messages";

export default function ThemeError({
  error,
  reset,
}: {
  error: Error & { digest?: string; code?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tensorcraft Theme Error]", error);
    // A nested boundary stops propagation, so without this the root
    // boundary never sees the crash and nothing is reported.
    Sentry.captureException(error, {
      tags: { boundary: "theme-error" },
      extra: { digest: error.digest, code: error.code },
    });
  }, [error]);

  const message = errorMessageForCode(error.code);

  return (
    <div className="min-h-screen flex items-center justify-center px-8">
      <div className="border border-border bg-surface p-10 max-w-md w-full rounded-none">
        <div className="font-mono text-xs text-red-400 tracking-wider uppercase mb-4">
          ERROR
        </div>
        <h2 className="text-xl font-mono font-black tracking-[-0.03em] mb-4 uppercase text-text-primary">
          Theme failed to load
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 border-2 border-primary bg-primary/10 text-primary font-mono text-sm font-bold uppercase tracking-wider rounded-none hover:bg-primary/20 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/themes"
            className="px-6 py-3 border border-border bg-transparent text-text-muted font-mono text-sm font-bold uppercase tracking-wider rounded-none hover:text-text-primary hover:border-primary/30 transition-colors text-center"
          >
            Browse themes
          </Link>
        </div>
      </div>
    </div>
  );
}
