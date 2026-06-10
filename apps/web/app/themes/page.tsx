import { themes } from "@tensorcraft/themes";
import {
  LAUNCHED_THEMES,
  PRICING,
  THEME_CONTENT,
  THEME_SLUGS,
  isValidThemeSlug,
  isLaunched,
} from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeCardsGrid, type ThemeCardData } from "./theme-cards-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Tensorcraft: Deep Orbit is live, ${THEME_SLUGS.length - LAUNCHED_THEMES.length} more coming`,
  description:
    "Deep Orbit (time-series & signals) is live. Neon Protocol, Signal Ward, Nova Canvas, and Terra Grid follow in waves; join each waitlist.",
  alternates: { canonical: "https://tensorcraft.app/themes" },
};

/**
 * ThemeSelection page.
 *
 * - Hero card for the launched theme (Deep Orbit) + a muted 2-column grid
 *   for coming-soon themes whose cards link to per-theme stub pages with
 *   waitlist capture (see app/themes/[slug]/coming-soon-stub.tsx).
 * - Per-theme <ParticleField> atmosphere driven by each theme's own
 *   `--tc-primary` CSS variable.
 * - Newsletter signup modal with trapped focus + Escape/click-outside close.
 * - Per-user "Start" vs "Continue" CTA on the live card; coming-soon cards
 *   always show "Notify me →".
 */
export default async function ThemesPage() {
  // Resolve per-user ownership so each card can show Start vs Continue. This
  // is a no-op (empty set) for logged-out visitors.
  const ownedThemes = await loadOwnedThemes();

  const themeList = Object.values(themes);
  const cards: ThemeCardData[] = themeList.map((theme) => ({
    slug: theme.slug,
    displayName: theme.displayName,
    tagline: theme.tagline,
    specialization: theme.specialization,
    primary: theme.palette.primary,
    owned: ownedThemes.has(theme.slug),
    modulesCount: THEME_CONTENT.modulesPerTheme,
    lessonsCount: THEME_CONTENT.totalLessonsPerTheme,
    price: PRICING.single.price,
    status: isLaunched(theme.slug) ? "live" : "coming-soon",
  }));

  return (
    <main className="min-h-screen bg-page px-6 py-20 relative overflow-hidden">
      <AmbientBackground count={240} />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero */}
        <h1 className="text-4xl md:text-5xl font-mono font-bold text-text-primary mb-3 tracking-tight">
          Choose Your World
        </h1>
        <p className="text-lg text-text-muted mb-6 max-w-2xl">
          Five ML specializations, each told through its own story universe.
          Deep Orbit is live. The other four ship in waves; sign up to their
          waitlists below.
        </p>
        <p className="text-base text-text-muted mb-14 max-w-2xl leading-relaxed">
          React, Vue, Svelte, Angular: pick the theme that maps to the ML
          problem you actually want to solve. Each one teaches a complete
          specialization through JavaScript and TensorFlow.js. No Python.
        </p>

        <ThemeCardsGrid cards={cards} />
      </div>
    </main>
  );
}

/**
 * Fetch the set of theme slugs the current user owns. Falls back to an empty
 * set when no session is present or the Supabase call throws (e.g. during
 * tests that stub only part of the client surface).
 */
async function loadOwnedThemes(): Promise<Set<string>> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Set();

    const { data } = await supabase
      .from("purchases")
      .select("theme_ids")
      .eq("user_id", user.id)
      .eq("status", "completed");

    const owned = new Set<string>();
    for (const row of data ?? []) {
      if (!Array.isArray(row.theme_ids)) continue;
      for (const slug of row.theme_ids) {
        if (isValidThemeSlug(slug)) owned.add(slug);
      }
    }
    return owned;
  } catch {
    return new Set();
  }
}
