import { getSupabaseServerClient } from "./supabase/server";
import { canAccessWorld } from "./entitlements";

/** Get user progress for a world */
export async function getUserProgress(userId: string, worldSlug: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("world_progress")
    .select(
      "id, world_id, module_id, lesson_id, status, score, started_at, completed_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("world_id", worldSlug);

  return data ?? [];
}

/** Check if a lesson is completed */
export async function isLessonCompleted(
  userId: string,
  worldSlug: string,
  lessonId: string,
) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("world_progress")
    .select("status")
    .eq("user_id", userId)
    .eq("world_id", worldSlug)
    .eq("lesson_id", lessonId)
    .single();

  return data?.status === "completed";
}

/** Check if all lessons in a module are completed */
export async function isModuleCompleted(
  userId: string,
  worldSlug: string,
  moduleSlug: string,
  totalLessons: number,
) {
  const supabase = await getSupabaseServerClient();
  const { count } = await supabase
    .from("world_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("world_id", worldSlug)
    .eq("module_id", moduleSlug)
    .eq("status", "completed");

  return (count ?? 0) >= totalLessons;
}

/**
 * Check if user has access to a world.
 *
 * Thin wrapper over `canAccessWorld` in lib/entitlements.ts, which is now the
 * single source of truth for entitlement (Tier 1 F4). Kept as a named export
 * because several call sites import it; new code should prefer
 * `getEntitledWorlds`/`canAccessWorld` directly. The status-filter rule and
 * the throw-on-fault behaviour (never silently deny a paying customer) live in
 * that one module now, not here.
 */
export async function hasWorldPurchase(userId: string, worldSlug: string) {
  return canAccessWorld(userId, worldSlug);
}
