import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitledThemes } from "@/lib/entitlements";
import {
  JOURNEY_ORDER,
  recommendedNextTheme,
  type ThemeSlug,
} from "@tensorcraft/shared";
import { THEME_CONTENT } from "@tensorcraft/shared";

/** Per-theme state within the canonical journey. */
export interface JourneyThemeState {
  slug: ThemeSlug;
  position: number;
  owned: boolean;
  /** Fully completed (every lesson of the theme done). */
  completed: boolean;
  completedLessons: number;
  totalLessons: number;
}

export interface JourneyState {
  /** Whether the learner opted into the canonical track. */
  enrolled: boolean;
  enrolledAt: string | null;
  completedAt: string | null;
  /** The five themes in ring order with per-theme progress. */
  themes: JourneyThemeState[];
  /** Soft nudge: next theme to pursue (ring order, first unowned). Never gates. */
  recommendedNext: ThemeSlug | null;
  /** True once every theme in the ring is completed. */
  ringComplete: boolean;
}

/**
 * Resolve the learner's canonical-journey state.
 *
 * This is the READ foundation for the hybrid canonical track (scalability
 * audit F2, owner decision: canonical track + free play). It composes three
 * already-centralized sources — journey ring order (shared), entitlements
 * (getEntitledThemes), and per-theme completion (theme_progress) — into one
 * shape the canonical-track UI consumes.
 *
 * Position is DERIVED here from completion, never stored (migration 044
 * deliberately keeps no denormalized pointer), so it cannot drift.
 *
 * Enrollment is opt-in: `enrolled=false` is the free-play default. The
 * per-theme progress and `recommendedNext` are still returned in free-play
 * mode so soft recommendations work without enrollment.
 */
export async function getJourneyState(userId: string): Promise<JourneyState> {
  const supabase = await getSupabaseServerClient();

  const [{ data: enrollment }, owned, { data: progressRows }] =
    await Promise.all([
      supabase
        .from("journey_enrollment")
        .select("enrolled_at, completed_at")
        .eq("user_id", userId)
        .maybeSingle(),
      getEntitledThemes(userId),
      supabase
        .from("theme_progress")
        .select("theme_id, lesson_id, status")
        .eq("user_id", userId)
        .eq("status", "completed"),
    ]);

  // Count distinct completed lessons per theme.
  const completedByTheme = new Map<string, Set<string>>();
  for (const row of progressRows ?? []) {
    const t = (row as { theme_id: string }).theme_id;
    const l = (row as { lesson_id: string }).lesson_id;
    if (!completedByTheme.has(t)) completedByTheme.set(t, new Set());
    completedByTheme.get(t)!.add(l);
  }

  // Every theme has the same lesson count (module-level overrides are already
  // folded into the per-theme total). One constant, not a per-theme lookup.
  const total = THEME_CONTENT.totalLessonsPerTheme;
  const themes: JourneyThemeState[] = JOURNEY_ORDER.map((slug, position) => {
    const done = completedByTheme.get(slug)?.size ?? 0;
    return {
      slug,
      position,
      owned: owned.has(slug),
      completedLessons: done,
      totalLessons: total,
      completed: total > 0 && done >= total,
    };
  });

  const completedSet = new Set(
    themes.filter((t) => t.completed).map((t) => t.slug),
  );
  const ringComplete = themes.every((t) => t.completed);

  return {
    enrolled: !!enrollment,
    enrolledAt: enrollment?.enrolled_at ?? null,
    completedAt: enrollment?.completed_at ?? null,
    themes,
    // Recommend the next theme not yet COMPLETED (canonical journey is about
    // finishing the ring, not just owning it), walking forward from the last
    // completed theme.
    recommendedNext: recommendedNextTheme(
      completedSet,
      themes.filter((t) => t.completed).at(-1)?.slug,
    ),
    ringComplete,
  };
}
