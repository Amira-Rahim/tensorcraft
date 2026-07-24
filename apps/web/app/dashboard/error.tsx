"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { errorMessageForCode } from "@/lib/error-messages";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string; code?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tensorcraft Dashboard Error]", error);
    // A nested boundary stops propagation, so without this the root
    // boundary never sees the crash and nothing is reported.
    Sentry.captureException(error, {
      tags: { boundary: "dashboard-error" },
      extra: { digest: error.digest, code: error.code },
    });
  }, [error]);

  const message = errorMessageForCode(error.code);

  return (
    <div className="min-h-screen flex items-center justify-center px-8">
      <div className="border border-border bg-surface p-10 max-w-md w-full rounded-none">
        <div className="font-mono text-xs text-error tracking-wider uppercase mb-4">
          ERROR
        </div>
        <h2 className="text-xl font-mono font-black tracking-[-0.03em] mb-4 uppercase text-text-primary">
          Something went wrong
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          {message}
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3 border-2 border-primary bg-primary/10 text-primary font-mono text-sm font-bold uppercase tracking-wider rounded-none hover:bg-primary/20 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
