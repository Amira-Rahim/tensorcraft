"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tensorcraft Error]", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 bg-page">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-primary/10">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--tc-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold font-mono mb-3 text-text-primary">
          Something went wrong
        </h1>

        <p className="text-base mb-8 text-text-muted">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 text-sm font-medium font-mono bg-primary text-page border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
          >
            Try again
          </button>

          <Link
            href="/"
            className="px-6 py-3 text-sm font-medium font-mono border border-border text-text-muted hover:text-text-primary hover:border-primary/30 transition-all brutalist-hover"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
