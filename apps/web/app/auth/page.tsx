import { Suspense } from "react";
import { AuthForm } from "../components/auth-form";
import { OrbitCanvas } from "@tensorcraft/ui/effects";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { worlds, worldSlugs } from "@tensorcraft/worlds";
import { isLaunched } from "@tensorcraft/shared";
import { surfacePlateSrc } from "@/lib/location-art";

/**
 * Auth page: split-screen brutalist redesign (2026-06-16).
 *
 * One coherent two-column layout (the previous version nested a full auth
 * *card* inside this page's right pane, which crushed the card's own columns
 * and duplicated the brand + tagline):
 *  - Left pane (desktop only, ~55%): the live Deep Orbit canvas backdrop
 *    (shared `OrbitCanvas`, identical to the landing page) behind the brand
 *    mark, headline, and an "FE → ML · bridge online" status line.
 *  - Right pane (full-width mobile, ~45% desktop): the form-only <AuthForm/>.
 *
 * Brutalist rules: `rounded-none`, world color tokens only, mono accents.
 * Auth logic / Supabase wiring / `tc_visited` gate live in <AuthForm>.
 */

// Hex "#rrggbb" → [r,g,b]. OrbitCanvas takes an rgb triple so the backdrop
// matches the launched world's primary without reading CSS vars at runtime.
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const HERO_SLUG = worldSlugs.find((s) => isLaunched(s)) ?? worldSlugs[0];
const HERO_RGB = hexToRgb(worlds[HERO_SLUG].palette.primary);
const HERO_RGB_LIGHT = hexToRgb(worlds[HERO_SLUG].paletteLight.primary);
const AUTH_PLATE_SRC = surfacePlateSrc(HERO_SLUG, "auth");

export default function AuthPage() {
  return (
    <main className="flex min-h-screen w-full bg-surface">
      {/* ============================================================ */}
      {/* LEFT PANE: orbit backdrop + brand + headline (desktop only) */}
      {/* ============================================================ */}
      <aside
        data-testid="auth-left-pane"
        className="hidden md:flex md:w-[55%] relative overflow-hidden border-r border-border rounded-none bg-page"
      >
        {/* The lab plate as the pane's ground, the live canvas above it as
            the reflection on the glass: the Five Worlds band composite. Over
            dark art the canvas keeps its dark hue in both schemes - the
            light hue was minted for a paper background (WorldSceneBackdrop
            precedent). Absent art, the pane renders exactly as before. */}
        {AUTH_PLATE_SRC && (
          <ArtPlate
            src={AUTH_PLATE_SRC}
            bleed
            className="absolute inset-0 z-0"
          />
        )}
        <OrbitCanvas
          rgb={HERO_RGB}
          rgbLight={AUTH_PLATE_SRC ? HERO_RGB : HERO_RGB_LIGHT}
          className={`absolute inset-0 z-0 pointer-events-none${AUTH_PLATE_SRC ? " opacity-50" : ""}`}
        />
        {/* Legibility scrim: the headline sits directly on the plate, and
            the lab's whiteboard is the brightest region of any plate, so
            the scrim dims the whole pane and hardest where the type is. */}
        {AUTH_PLATE_SRC && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--tc-bg) 92%, transparent) 0%, color-mix(in srgb, var(--tc-bg) 62%, transparent) 55%, color-mix(in srgb, var(--tc-bg) 34%, transparent) 100%)",
            }}
          />
        )}

        {/* Foreground copy block */}
        <div className="relative z-10 flex h-full w-full flex-col justify-center p-10 lg:p-14">
          {/* Headline */}
          <h2
            data-testid="auth-tagline"
            className="max-w-130 font-mono text-3xl lg:text-5xl font-black leading-[0.95] tracking-[-0.03em] uppercase text-text-primary"
          >
            You Already Think Like an ML Engineer
          </h2>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* RIGHT PANE: auth form                                       */}
      {/* ============================================================ */}
      <section
        data-testid="auth-right-pane"
        className="flex w-full md:w-[45%] items-center justify-center px-6 py-10 sm:px-10 bg-surface"
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
