"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { errorMessageForCode } from "@/lib/error-messages";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; code?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tensorcraft Error]", error);
    // Forward to Sentry (no-op if DSN is not configured).
    Sentry.captureException(error, {
      tags: { boundary: "route-error" },
      extra: { digest: error.digest, code: error.code },
    });
  }, [error]);

  const message = errorMessageForCode(error.code);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 bg-page">
      <div className="max-w-md w-full border border-border bg-surface p-10 rounded-none">
        <div className="font-mono text-xs text-error tracking-wider uppercase mb-4">
          ERROR
        </div>
        <h1 className="text-xl font-mono font-black tracking-[-0.03em] mb-4 uppercase text-text-primary">
          Something went wrong
        </h1>
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
            href="/"
            className="px-6 py-3 border border-border bg-transparent text-text-muted font-mono text-sm font-bold uppercase tracking-wider rounded-none hover:text-text-primary hover:border-primary/30 transition-colors text-center"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
