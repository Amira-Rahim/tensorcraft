"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
}

/* ------------------------------------------------------------------ */
/*  Gradient-descent loss landscape canvas                            */
/* ------------------------------------------------------------------ */
function LossLandscapeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let t = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw contour lines for a loss landscape
      const cx = w * 0.45;
      const cy = h * 0.5;
      const rings = 8;
      for (let i = rings; i >= 1; i--) {
        const rx = (i / rings) * w * 0.38;
        const ry = (i / rings) * h * 0.32;
        const alpha = 0.06 + (rings - i) * 0.025;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          rx,
          ry,
          0.15 + Math.sin(t * 0.003) * 0.05,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = `rgba(107, 170, 138, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Animated gradient descent path (dots moving toward minimum)
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const progress = ((t * 0.4 + i * 30) % (steps * 30)) / (steps * 30);
        const angle = progress * Math.PI * 3.5 + 0.8;
        const radius = (1 - progress) * 0.85;
        const px = cx + Math.cos(angle) * radius * w * 0.32;
        const py = cy + Math.sin(angle) * radius * h * 0.28;
        const dotAlpha = 0.15 + progress * 0.6;
        const dotSize = 1.5 + progress * 2.5;

        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(107, 170, 138, ${dotAlpha})`;
        ctx.fill();
      }

      // Center minimum marker
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(107, 170, 138, 0.8)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(107, 170, 138, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      t++;
      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Bridge mapping rows for left panel                                */
/* ------------------------------------------------------------------ */
const bridgeMappings = [
  { fe: "useState()", ml: "model weights" },
  { fe: "useEffect()", ml: "training loop" },
  { fe: "Array.map()", ml: "tensor ops" },
  { fe: "fetch()", ml: "inference API" },
  { fe: "JSON.parse()", ml: "data pipeline" },
];

/* ------------------------------------------------------------------ */
/*  Main AuthForm component                                           */
/* ------------------------------------------------------------------ */
export function AuthForm({ mode: initialMode }: AuthFormProps) {
  const [activeMode, setActiveMode] = useState<"sign-in" | "sign-up">(
    initialMode,
  );
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/onboarding";

  const callbackUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

  const isSignIn = activeMode === "sign-in";

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

  function switchMode(mode: "sign-in" | "sign-up") {
    setActiveMode(mode);
    setError(null);
    setMagicLinkSent(false);
  }

  const authError = isSignIn ? searchParams.get("error") : null;

  return (
    <div className="flex w-full max-w-240 min-h-160 border border-border bg-surface relative z-10">
      {/* ============================================================ */}
      {/*  LEFT PANEL — Gradient descent visualization                 */}
      {/* ============================================================ */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 relative overflow-hidden bg-code-bg border-r border-border">
        {/* Canvas visualization */}
        <LossLandscapeCanvas />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="font-mono text-sm font-bold tracking-wider text-primary">
            T_ tensorcraft
          </div>
        </div>

        {/* Middle: Quote */}
        <div className="relative z-10">
          <blockquote className="font-mono text-xl font-semibold text-text-primary leading-relaxed">
            &ldquo;You already think like
            <br />
            an ML engineer.&rdquo;
          </blockquote>
        </div>

        {/* Bottom: Bridge mappings */}
        <div className="relative z-10 space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-3">
            // concept bridges
          </div>
          {bridgeMappings.map((b) => (
            <div
              key={b.fe}
              className="flex items-center gap-3 font-mono text-[13px]"
            >
              <span className="text-text-primary">{b.fe}</span>
              <span className="text-text-muted">&rarr;</span>
              <span className="text-primary">{b.ml}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  RIGHT PANEL — Auth form                                     */}
      {/* ============================================================ */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-10 bg-surface-raised">
        {/* Mobile logo (hidden on lg) */}
        <div className="lg:hidden text-sm font-mono font-bold tracking-wider text-primary mb-6">
          T_ tensorcraft
        </div>

        {/* Mode toggle tabs */}
        <div className="flex border border-border mb-8">
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className={`flex-1 h-11 font-mono text-sm font-medium uppercase tracking-wider transition-colors ${
              isSignIn
                ? "bg-primary text-code-bg"
                : "bg-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("sign-up")}
            className={`flex-1 h-11 font-mono text-sm font-medium uppercase tracking-wider transition-colors border-l border-border ${
              !isSignIn
                ? "bg-primary text-code-bg"
                : "bg-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            Create account
          </button>
        </div>

        {/* Error messages */}
        {authError && (
          <div className="mb-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
            {authError === "session_expired"
              ? "Your session has expired. Please sign in again."
              : "Authentication failed. Please try again."}
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
            <div className="mb-4 text-4xl" aria-hidden="true">
              &#9993;
            </div>
            <h2 className="text-xl font-mono font-semibold text-text-primary mb-2">
              Check your email
            </h2>
            <p className="text-text-muted text-sm font-mono mb-6">
              We sent a magic link to{" "}
              <strong className="text-text-primary">{email}</strong>. Click the
              link to {isSignIn ? "sign in" : "create your account"}.
            </p>
            <button
              type="button"
              onClick={() => setMagicLinkSent(false)}
              className="text-sm font-mono text-text-muted hover:text-primary transition-colors"
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
              className="flex w-full items-center justify-center gap-3 h-13 border border-border bg-transparent text-text-primary text-[15px] font-mono font-medium hover:border-primary/50 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(107,170,138,0.2)] transition-all"
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
              className="flex w-full items-center justify-center gap-3 h-13 border border-border bg-transparent text-text-primary text-[15px] font-mono font-medium hover:border-primary/50 hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(107,170,138,0.2)] transition-all mt-3"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
                className="w-full h-13 px-5 border border-border bg-code-bg text-text-primary text-[15px] font-mono placeholder:text-text-muted/60 outline-none focus:border-primary/50 focus:bg-surface transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 border border-primary/40 bg-transparent text-primary text-[15px] font-mono font-medium uppercase tracking-wider hover:bg-primary hover:text-code-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send magic link"}
              </button>
            </form>

            {/* Bottom toggle link */}
            <div className="text-center mt-8 text-sm text-text-muted font-mono">
              {isSignIn ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-up")}
                    className="text-primary hover:underline underline-offset-[3px]"
                  >
                    Create one free
                  </button>
                </>
              ) : (
                <>
                  Already have one?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("sign-in")}
                    className="text-primary hover:underline underline-offset-[3px]"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

            {/* Info box with green left border */}
            <div className="mt-6 border border-border bg-code-bg px-4 py-3 font-mono text-[13px] text-text-muted border-l-2 border-l-primary">
              <span className="text-primary">{"//"}</span> MODULE 1{" "}
              <span className="text-text-muted/50">&middot;</span> FREE{" "}
              <span className="text-text-muted/50">&middot;</span> NO CARD
            </div>

            {/* Terms */}
            <div className="text-center mt-5 text-xs text-text-muted/60 font-mono">
              By {isSignIn ? "signing in" : "creating an account"}, you agree to
              our{" "}
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
    </div>
  );
}
