"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { errorMessageForCode } from "@/lib/error-messages";

export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string; code?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tensorcraft Lesson Error]", error);
    // Forward to Sentry (no-op if DSN is not configured). Lesson is the
    // heaviest user-facing surface, so unreported crashes here mask real
    // production issues.
    Sentry.captureException(error, {
      tags: { boundary: "lesson-error" },
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
          Lesson failed to load
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
