"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tensorcraft Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "var(--tc-bg, #181818)",
          color: "#E0E0E0",
          fontFamily: "ui-monospace, monospace",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            textAlign: "center",
            padding: "0 1.5rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "4rem",
              height: "4rem",
              backgroundColor:
                "color-mix(in srgb, var(--tc-primary, #6BAA8A) 10%, transparent)",
              marginBottom: "1.5rem",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--tc-primary, #6BAA8A)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
              color: "#E0E0E0",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: "1rem",
              color: "#A0A0A0",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            A critical error occurred. Please try again or reload the page.
          </p>

          <button
            onClick={reset}
            style={{
              backgroundColor: "var(--tc-primary, #6BAA8A)",
              color: "var(--tc-bg, #181818)",
              border: "2px solid var(--tc-primary, #6BAA8A)",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
