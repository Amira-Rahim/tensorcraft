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

/** Check if user has purchased a theme */
export async function hasThemePurchase(userId: string, themeSlug: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .contains("theme_ids", [themeSlug])
    .eq("status", "completed")
    .limit(1)
    .single();

  return !!data;
}
