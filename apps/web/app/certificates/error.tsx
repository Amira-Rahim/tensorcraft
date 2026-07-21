"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * Certificates had no error boundary, so a transport failure reaching the
 * certificates API surfaced as a raw 500. That is the worst place in the
 * product for it: a learner shares their certificate publicly, and during any
 * API blip everyone who clicks the link sees a server error.
 *
 * This deliberately does NOT render "not found". The credential exists; we
 * just could not reach it. Telling a sharer's audience it does not exist is
 * worse than telling them to try again.
 */
export default function CertificateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tensorcraft Certificate Error]", error);
    Sentry.captureException(error, {
      tags: { boundary: "certificate-error" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-8">
      <div className="border border-border bg-surface p-10 max-w-md w-full rounded-none">
        <div className="font-mono text-xs text-red-400 tracking-wider uppercase mb-4">
          Temporarily unreachable
        </div>
        <h1 className="text-xl font-bold font-mono mb-3 text-text-primary">
          Couldn&rsquo;t load this certificate
        </h1>
        <p className="text-sm mb-8 leading-relaxed text-text-muted font-sans">
          The certificate is still valid, we just couldn&rsquo;t reach it right
          now. This is usually brief.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium font-mono bg-primary text-page border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium font-mono border border-border text-text-muted hover:text-text-primary hover:border-primary/30 transition-all brutalist-hover"
          >
            Go to Tensorcraft
          </Link>
        </div>
      </div>
    </div>
  );
}
