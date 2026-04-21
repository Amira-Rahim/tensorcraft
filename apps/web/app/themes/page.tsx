import { themes } from "@tensorcraft/themes";
import { PRICING, THEME_CONTENT, isValidThemeSlug } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeCardsGrid, type ThemeCardData } from "./theme-cards-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5 ML Courses for Frontend Developers | Tensorcraft",
  description:
    "Choose your learning path — 5 themed courses from frontend to ML.",
  alternates: { canonical: "https://tensorcraft.app/themes" },
};

/**
 * ThemeSelection page (Phase 11 §11d Wave 2).
 *
 * - Equal 5-card brutalist grid (all themes launch simultaneously — no
 *   "coming soon" / "launched" labels per `project_launch_strategy.md`).
 * - Per-theme <ParticleField> atmosphere driven by each theme's own
 *   `--tc-primary` CSS variable.
 * - Newsletter signup modal with trapped focus + Escape/click-outside close.
 * - Per-user "Start" vs "Continue" CTA: users who own a theme see Continue.
 */
export default async function ThemesPage() {
  // Resolve per-user ownership so each card can show Start vs Continue. This
  // is a no-op (empty set) for logged-out visitors, which is fine — they
  // simply see "Start →" everywhere.
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
  }));

  return (
    <main className="min-h-screen bg-page px-6 py-20 relative overflow-hidden">
      <AmbientBackground count={240} />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero */}
        <p className="font-mono text-sm text-text-muted mb-2">
          {"// FIVE THEMED WORLDS"}
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-bold text-text-primary mb-3 tracking-tight">
          Choose Your World
        </h1>
        <p className="text-lg text-text-muted mb-6 max-w-2xl">
          Each theme teaches a different ML specialization through a unique
          narrative. Same depth, different career outcomes.
        </p>
        <p className="text-base text-text-muted mb-14 max-w-2xl leading-relaxed">
          Whether you&apos;re a React developer exploring neural networks or a
          Vue engineer building computer vision, each theme teaches a complete
          ML specialization through JavaScript and TensorFlow.js — no Python
          required.
        </p>

        {/* Equal 5-card grid + newsletter modal */}
        <ThemeCardsGrid cards={cards} />

        {/* Why 5 Themes? */}
        <section className="mt-24">
          <h2 className="text-2xl font-mono font-bold text-text-primary mb-4 tracking-tight">
            Why 5 Themes?
          </h2>
          <p className="text-base text-text-muted leading-relaxed max-w-2xl mb-4">
            Machine learning is not one skill — it&apos;s a family of
            specializations. Time-series analysis, computer vision, NLP,
            generative AI, and edge deployment each demand different mental
            models, architectures, and tooling. One course can&apos;t cover them
            all with the depth you need.
          </p>
          <p className="text-base text-text-muted leading-relaxed max-w-2xl">
            Each Tensorcraft theme maps to a different ML career path. Deep
            Orbit prepares you for signal processing roles. Neon Protocol covers
            the vision pipeline from convolutions to real-time object detection.
            Signal Ward builds NLP skills from tokenization to transformers.
            Nova Canvas explores multimodal and generative models. Terra Grid
            focuses on deploying and optimizing models at the edge. Pick the
            path that matches where you want to go.
          </p>
        </section>
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
