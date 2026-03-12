"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/onboarding";

  const callbackUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

  const isSignIn = mode === "sign-in";

  async function handleOAuth(provider: "github" | "google") {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) setError(error.message);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  }

  const authError = isSignIn ? searchParams.get("error") : null;

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-border bg-surface-raised p-10 sm:p-12 relative z-10 animate-fade-up">
      {/* Logo */}
      <div className="text-center text-lg font-semibold tracking-wide mb-2">
        &#9671; tensorcraft
      </div>

      {/* Heading */}
      <h1 className="text-center text-2xl font-bold mb-9">
        {isSignIn ? "Sign in to Tensorcraft" : "Create your account"}
      </h1>

      {authError && (
        <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {authError === "session_expired"
            ? "Your session has expired. Please sign in again."
            : "Authentication failed. Please try again."}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {magicLinkSent ? (
        <div className="text-center">
          <div className="mb-4 text-4xl">&#9993;</div>
          <h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-text-muted text-sm mb-6">
            We sent a magic link to{" "}
            <strong className="text-text-primary">{email}</strong>. Click the
            link to {isSignIn ? "sign in" : "create your account"}.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          {/* GitHub OAuth */}
          <button
            onClick={() => handleOAuth("github")}
            className="flex w-full items-center justify-center gap-3 h-[52px] rounded-full border border-white/12 bg-transparent text-white text-[15px] font-medium hover:bg-white/4 hover:border-white/20 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          {/* Google OAuth */}
          <button
            onClick={() => handleOAuth("google")}
            className="flex w-full items-center justify-center gap-3 h-[52px] rounded-full border border-white/12 bg-transparent text-white text-[15px] font-medium hover:bg-white/4 hover:border-white/20 transition-all mt-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
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
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-[13px] text-text-muted uppercase tracking-widest font-medium">
              or
            </span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Email Magic Link */}
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full h-[52px] px-5 rounded-full border border-white/8 bg-white/3 text-white text-[15px] placeholder:text-text-muted/60 outline-none focus:border-accent/30 focus:bg-accent/3 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] rounded-full border border-accent/30 bg-accent/8 text-white text-[15px] font-medium hover:bg-accent/15 hover:border-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>

          {/* Footer link */}
          <div className="text-center mt-8 pt-6 border-t border-white/6 text-sm text-text-muted">
            {isSignIn ? (
              <>
                New to Tensorcraft?{" "}
                <Link
                  href="/themes/deep-orbit"
                  className="text-text-primary underline underline-offset-[3px] decoration-white/25 hover:decoration-white/60 transition-all"
                >
                  Start with Module 1
                </Link>{" "}
                — no account needed.
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href="/auth/sign-in"
                  className="text-text-primary underline underline-offset-[3px] decoration-white/25 hover:decoration-white/60 transition-all"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Terms */}
          <div className="text-center mt-5 text-xs text-text-muted/60">
            By {isSignIn ? "signing in" : "creating an account"}, you agree to
            our{" "}
            <Link
              href="/terms"
              className="text-text-muted underline underline-offset-2 decoration-text-muted/30 hover:text-white transition-colors"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-text-muted underline underline-offset-2 decoration-text-muted/30 hover:text-white transition-colors"
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
