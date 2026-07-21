"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ERROR_MESSAGES } from "@/lib/error-messages";
import { EVENTS, track } from "@/lib/analytics-events";

/* ------------------------------------------------------------------ */
/*  Context-aware copy                                                */
/* ------------------------------------------------------------------ */
const COPY = {
  new: {
    heading: "Start Learning",
    subtitle: "Create an account to start learning",
    terms: "creating an account",
  },
  returning: {
    heading: "Welcome Back",
    subtitle: "Sign in to continue learning",
    terms: "signing in",
  },
};

/* ------------------------------------------------------------------ */
/*  Main AuthForm component                                           */
/* ------------------------------------------------------------------ */
export function AuthForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  // Confirms a successful resend. Without visible feedback the button just
  // returned to its resting label, so the user could not tell whether it
  // worked and had no reason to keep waiting for the mail — which is exactly
  // the impatience that triggers Supabase's rate limiter.
  const [resent, setResent] = useState(false);
  // Focus target for the "check your inbox" panel that replaces the form.
  const sentPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (magicLinkSent) {
      sentPanelRef.current?.focus();
    }
  }, [magicLinkSent]);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const callbackUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

  // Detect returning user via localStorage
  useEffect(() => {
    try {
      setIsReturning(localStorage.getItem("tc_visited") === "1");
    } catch {
      // localStorage unavailable (e.g. private browsing)
    }
  }, []);

  const copy = isReturning ? COPY.returning : COPY.new;

  function markVisited() {
    try {
      localStorage.setItem("tc_visited", "1");
    } catch {
      // localStorage unavailable
    }
  }

  async function handleOAuth(provider: "github" | "google") {
    markVisited();
    track(EVENTS.SIGNUP_STARTED, { method: provider });
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) {
      track(EVENTS.SIGNUP_FAILED, { method: provider });
      setError(error.message);
    }
  }

  // Both handlers clear `loading` in a `finally`. Without it, any throw from
  // signInWithOtp (network drop, Supabase 5xx) skipped the reset and left the
  // button spinning permanently with no error text and no way back — on the
  // sign-in screen, which is the front door. Resend, the natural recovery
  // action, died the same way, so the only escape was a hard refresh.
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    markVisited();
    track(EVENTS.SIGNUP_STARTED, { method: "magic_link" });
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        track(EVENTS.SIGNUP_FAILED, { method: "magic_link" });
        setError(error.message);
      } else {
        track(EVENTS.MAGIC_LINK_SENT, { method: "magic_link" });
        setMagicLinkSent(true);
      }
    } catch {
      track(EVENTS.SIGNUP_FAILED, { method: "magic_link" });
      setError(ERROR_MESSAGES.network);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError(null);
    setResent(false);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        // Without this the button simply returned to its resting label, so a
        // user could not tell whether the resend worked and had no reason to
        // keep waiting for the mail.
        setResent(true);
      }
    } catch {
      setError(ERROR_MESSAGES.network);
    } finally {
      setLoading(false);
    }
  }

  const authError = searchParams.get("error");

  return (
    <div className="flex w-full flex-col justify-center">
      {/* Mobile logo, shown only when the left brand panel is hidden (<md) */}
      <div className="md:hidden text-sm font-mono font-bold tracking-wider text-primary mb-6">
        T_ tensorcraft
      </div>

      {/* Context-aware heading */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-mono font-semibold text-text-primary mb-2">
          {copy.heading}
        </h1>
        <p className="text-sm font-mono text-text-muted">{copy.subtitle}</p>
      </div>

      {/* Error messages */}
      {authError && (
        <div className="mb-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
          {authError === "session_expired"
            ? ERROR_MESSAGES.session_expired
            : "Sign-in didn't go through. Try again, or request a fresh email link below."}
        </div>
      )}

      {error && (
        <div className="mb-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
          {error}
        </div>
      )}

      {magicLinkSent ? (
        /* Magic link sent state */
        <div className="text-center py-6">
          {/*
            Submitting the form replaced it with this panel in the same
            commit, so focus fell to <body> and nothing announced — on the
            sign-in screen, where the whole instruction ("go check your
            email") lives in the text that was never read out. tabIndex -1
            makes it programmatically focusable without entering the tab
            sequence; the effect below moves focus here on mount.
            WCAG 4.1.3, 2.4.3.
          */}
          <div
            ref={sentPanelRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="outline-none"
          >
            <div className="mb-4 text-4xl" aria-hidden="true">
              &#9993;
            </div>
            <h2 className="text-xl font-mono font-semibold text-text-primary mb-2">
              Check your inbox
            </h2>
          </div>
          <p className="text-text-muted text-sm font-mono mb-4">
            We sent a magic link to{" "}
            <strong className="text-text-primary">{email}</strong>. Click the
            link and you&apos;ll be taken to your dashboard automatically.
          </p>
          <p className="text-text-muted/60 text-xs font-mono mb-6">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-primary rounded-none hover:underline underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50"
            >
              {loading ? "sending..." : "resend the link"}
            </button>
            .
          </p>
          {resent ? (
            <p
              role="status"
              className="text-[13px] text-primary font-mono mt-2"
            >
              Sent again. Check your inbox.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setMagicLinkSent(false);
              setError(null);
            }}
            className="text-sm font-mono text-text-muted rounded-none hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-colors"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          {/* GitHub OAuth */}
          <button
            type="button"
            onClick={() => handleOAuth("github")}
            aria-label="Continue with GitHub"
            className="flex w-full items-center justify-center gap-3 h-13 border border-border bg-transparent text-text-primary text-[15px] font-mono font-medium rounded-none hover:border-primary/50 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--tc-primary)] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            aria-label="Continue with Google"
            className="flex w-full items-center justify-center gap-3 h-13 border border-border bg-transparent text-text-primary text-[15px] font-mono font-medium rounded-none hover:border-primary/50 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--tc-primary)] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all mt-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[13px] text-text-muted uppercase tracking-widest font-mono font-medium">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email Magic Link */}
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <label htmlFor="auth-email" className="sr-only">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full h-13 px-5 border border-border bg-code-bg text-text-primary text-[15px] font-mono rounded-none placeholder:text-text-muted/60 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus:border-primary focus:bg-surface transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 border border-primary/40 bg-transparent text-primary text-[15px] font-mono font-medium uppercase tracking-wider rounded-none hover:bg-primary hover:text-code-bg focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>

          {/* Terms */}
          <div className="text-center mt-4 text-xs text-text-muted font-mono">
            By {copy.terms}, you agree to our{" "}
            <Link
              href="/terms"
              className="text-text-muted underline underline-offset-2 decoration-text-muted/30 hover:text-text-primary transition-colors"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-text-muted underline underline-offset-2 decoration-text-muted/30 hover:text-text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </div>
        </>
      )}
    </div>
  );
}
