import { getSupabaseServerClient } from "./supabase/server";

/** Get user progress for a theme */
export async function getUserProgress(userId: string, themeSlug: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("theme_progress")
    .select(
      "id, theme_id, module_id, lesson_id, status, score, started_at, completed_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("theme_id", themeSlug);

  return data ?? [];
}

/** Check if a lesson is completed */
export async function isLessonCompleted(
  userId: string,
  themeSlug: string,
  lessonId: string,
) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("theme_progress")
    .select("status")
    .eq("user_id", userId)
    .eq("theme_id", themeSlug)
    .eq("lesson_id", lessonId)
    .single();

  return data?.status === "completed";
}

/** Check if all lessons in a module are completed */
export async function isModuleCompleted(
  userId: string,
  themeSlug: string,
  moduleSlug: string,
  totalLessons: number,
) {
  const supabase = await getSupabaseServerClient();
  const { count } = await supabase
    .from("theme_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("theme_id", themeSlug)
    .eq("module_id", moduleSlug)
    .eq("status", "completed");

  return (count ?? 0) >= totalLessons;
}

/**
 * Check if user has purchased a theme.
 *
 * Throws on a genuine lookup failure rather than reporting "not purchased".
 *
 * This previously used `.single()` and discarded the error, returning
 * `!!data`. `.single()` errors both when there are zero rows (the ordinary
 * not-purchased case) AND on any transient fault — a network blip, an RLS
 * hiccup, a PostgREST 5xx — and the two were indistinguishable. The result
 * was that a momentary database problem showed a **paying customer** the
 * paywall for content they own, with no error state, no retry, and no way to
 * tell the difference. That is a refund and support driver, and the worst
 * possible experience for someone who just paid.
 *
 * `.maybeSingle()` returns `data: null` with no error for zero rows, so a
 * remaining error is always a real failure. Callers are server components, so
 * a throw surfaces the nearest error boundary — a retryable error page, which
 * is the honest outcome. Silently denying paid access is not.
 */
export async function hasThemePurchase(userId: string, themeSlug: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .contains("theme_ids", [themeSlug])
    // partially_refunded preserves access by policy (full refunds revoke);
    // keep this in sync with apps/api purchases/payments reads.
    .in("status", ["completed", "partially_refunded"])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Purchase lookup failed for theme "${themeSlug}": ${error.message}`,
    );
  }

  return !!data;
}
