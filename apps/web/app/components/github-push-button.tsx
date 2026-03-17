"use client";

import { useState, useEffect } from "react";
import { pushExerciseToGithub, getGithubStatus } from "@/lib/github";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface GitHubPushButtonProps {
  exerciseSlug: string;
  code: string;
  themeId: string;
  moduleId: string;
}

type PushState = "idle" | "loading" | "success" | "error";

export function GitHubPushButton({
  exerciseSlug,
  code,
  themeId,
  moduleId,
}: GitHubPushButtonProps) {
  const [pushState, setPushState] = useState<PushState>("idle");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | undefined>();
  const [resultUrl, setResultUrl] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    getGithubStatus().then((status) => {
      setConnected(status.connected);
      setUsername(status.username);
    });
  }, []);

  async function handleConnectGitHub() {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.href,
        scopes: "repo",
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setPushState("error");
    }
  }

  async function handlePush() {
    setPushState("loading");
    setErrorMessage(undefined);
    setResultUrl(undefined);

    const result = await pushExerciseToGithub(
      exerciseSlug,
      code,
      themeId,
      moduleId,
    );

    if (result.success) {
      setPushState("success");
      setResultUrl(result.url);
    } else {
      setPushState("error");
      setErrorMessage(result.error);
    }
  }

  // Still checking connection status
  if (connected === null) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-surface font-mono text-sm text-text-muted cursor-wait"
      >
        <LoadingDots />
        Checking GitHub...
      </button>
    );
  }

  // Not connected — show connect button
  if (!connected) {
    return (
      <button
        type="button"
        onClick={handleConnectGitHub}
        className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-surface font-mono text-sm text-text-primary brutalist-hover brutalist-shadow hover:border-primary/50 transition-colors"
      >
        <GitHubIcon />
        Connect GitHub
      </button>
    );
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={handlePush}
        disabled={pushState === "loading"}
        className={`inline-flex items-center gap-2 px-4 py-2 border font-mono text-sm transition-colors ${
          pushState === "success"
            ? "border-primary/60 bg-primary/10 text-primary"
            : pushState === "error"
              ? "border-red-500/40 bg-red-500/10 text-red-400"
              : "border-border bg-surface text-text-primary brutalist-hover brutalist-shadow hover:border-primary/50"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {pushState === "loading" ? (
          <>
            <LoadingDots />
            Pushing...
          </>
        ) : pushState === "success" ? (
          <>
            <CheckIcon />
            Pushed to GitHub
          </>
        ) : pushState === "error" ? (
          <>
            <ErrorIcon />
            Push failed
          </>
        ) : (
          <>
            <GitHubIcon />
            Push to GitHub
          </>
        )}
      </button>

      {/* Success link */}
      {pushState === "success" && resultUrl && (
        <a
          href={resultUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-primary hover:underline underline-offset-2"
        >
          View on GitHub &rarr;
        </a>
      )}

      {/* Error message */}
      {pushState === "error" && errorMessage && (
        <p className="font-mono text-xs text-red-400">{errorMessage}</p>
      )}

      {/* Username indicator */}
      {username && pushState === "idle" && (
        <span className="font-mono text-xs text-text-muted">
          as @{username}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline icons                                                       */
/* ------------------------------------------------------------------ */

function GitHubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      <span className="animate-pulse">.</span>
      <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>
        .
      </span>
      <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>
        .
      </span>
    </span>
  );
}
