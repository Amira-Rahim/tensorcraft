import { Suspense } from "react";
import { AuthForm } from "../components/auth-form";
import { OrbitCanvas } from "@tensorcraft/ui/effects";
import { themes, themeSlugs } from "@tensorcraft/themes";
import { isLaunched } from "@tensorcraft/shared";

/**
 * Auth page — split-screen brutalist redesign (2026-06-16).
 *
 * One coherent two-column layout (the previous version nested a full auth
 * *card* inside this page's right pane, which crushed the card's own columns
 * and duplicated the brand + tagline):
 *  - Left pane (desktop only, ~55%): the live Deep Orbit canvas backdrop
 *    (shared `OrbitCanvas`, identical to the landing page) behind the brand
 *    mark, headline, and an "FE → ML · bridge online" status line.
 *  - Right pane (full-width mobile, ~45% desktop): the form-only <AuthForm/>.
 *
 * Brutalist rules: `rounded-none`, theme color tokens only, mono accents.
 * Auth logic / Supabase wiring / `tc_visited` gate live in <AuthForm>.
 */

// Hex "#rrggbb" → [r,g,b]. OrbitCanvas takes an rgb triple so the backdrop
// matches the launched theme's primary without reading CSS vars at runtime.
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const HERO_SLUG = themeSlugs.find((s) => isLaunched(s)) ?? themeSlugs[0];
const HERO_RGB = hexToRgb(themes[HERO_SLUG].palette.primary);

export default function AuthPage() {
  return (
    <main className="flex min-h-screen w-full bg-surface">
      {/* ============================================================ */}
      {/* LEFT PANE — orbit backdrop + brand + headline (desktop only) */}
      {/* ============================================================ */}
      <aside
        data-testid="auth-left-pane"
        className="hidden md:flex md:w-[55%] relative overflow-hidden border-r border-border rounded-none bg-page"
      >
        {/* Live Deep Orbit canvas — same component as the landing page. Sizes
            to this positioned parent; decorative (aria-hidden internally). */}
        <OrbitCanvas
          rgb={HERO_RGB}
          className="absolute inset-0 z-0 pointer-events-none"
        />

        {/* Foreground copy block */}
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 lg:p-14">
          {/* Brand mark */}
          <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            T_ tensorcraft
          </div>

          {/* Headline */}
          <h2
            data-testid="auth-tagline"
            className="max-w-130 font-mono text-3xl lg:text-5xl font-black leading-[0.95] tracking-[-0.03em] uppercase text-text-primary"
          >
            You Already Think Like an ML Engineer
          </h2>

          {/* Footer status line */}
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
