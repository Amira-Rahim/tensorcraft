import { Suspense } from "react";
import { AuthForm } from "../components/auth-form";
import { ParticleField } from "@tensorcraft/ui/effects";

/**
 * Auth page — Phase 11 §11d Wave 1 brutalist redesign.
 *
 * Split layout:
 *  - Left pane (desktop only, ~55%): decorative ParticleField + tagline from
 *    `project_copy_lines.md` ("You Already Think Like an ML Engineer").
 *    LossLandscape is deferred per §11b, so we use a low-density particle
 *    field treatment matching the Landing page.
 *  - Right pane (full-width mobile, ~45% desktop): existing <AuthForm/>
 *    (already brutalised in §11c).
 *
 * Brutalist rules: `rounded-none` throughout, theme color tokens only
 * (mapped to CSS vars in globals.css `@theme`), mono-font accents with
 * Inter body. Auth logic / Supabase wiring / `tc_visited` gate are owned
 * by `<AuthForm>` and unchanged here.
 */
export default function AuthPage() {
  return (
    <main className="flex min-h-screen w-full bg-surface">
      {/* ============================================================ */}
      {/* LEFT PANE — decorative + tagline (desktop only)              */}
      {/* ============================================================ */}
      <aside
        data-testid="auth-left-pane"
        aria-hidden="true"
        className="hidden md:flex md:w-[55%] relative overflow-hidden border-r border-border rounded-none bg-surface-raised"
      >
        {/* Low-density particle field — pure decoration. Respects
            prefers-reduced-motion internally (ParticleField skips rAF). */}
        <ParticleField
          density={0.25}
          className="absolute inset-0 z-0 pointer-events-none"
        />

        {/* Foreground copy block */}
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 lg:p-14">
          {/* Brand mark */}
          <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            T_ tensorcraft
          </div>

          {/* Tagline block */}
          <div className="max-w-130">
            <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-text-muted">
              // onboarding
            </div>
            <h2
              data-testid="auth-tagline"
              className="font-mono text-3xl lg:text-5xl font-black leading-[0.95] tracking-[-0.03em] uppercase text-text-primary"
            >
              You Already Think Like an ML Engineer
            </h2>
            <p
              data-testid="auth-subtagline"
              className="mt-8 max-w-110 font-sans text-base leading-relaxed text-text-muted"
            >
              If you&apos;ve shipped React, you&apos;ve built state machines,
              trained on user behavior, and debugged runtime mismatches. The
              vocabulary is different; the ideas are the same.
            </p>
          </div>

          {/* Footer accent */}
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted">
            <span className="inline-block h-1.75 w-1.75 rounded-none bg-primary" />
            FE &rarr; ML · bridge online
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* RIGHT PANE — auth form                                       */}
      {/* ============================================================ */}
      <section
        data-testid="auth-right-pane"
        className="flex w-full md:w-[45%] items-center justify-center px-6 py-16 sm:px-10 bg-surface"
      >
        <div className="w-full max-w-110">
          <Suspense>
            <AuthForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
