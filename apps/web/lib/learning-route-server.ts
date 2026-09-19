import { isMLLearningRoute, type MLLearningRoute } from "@tensorcraft/shared";
import type { getSupabaseServerClient } from "./supabase/server";

export async function getLearningRoutePreference(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string | null,
): Promise<{ route: MLLearningRoute | null; unavailable: boolean }> {
  if (!userId) return { route: null, unavailable: false };
  // Keep this separate from essential profile reads so an old schema or a
  // temporary failure does not erase display names or block paid lessons.
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("ml_learning_route")
      .eq("id", userId)
      .maybeSingle();
    return {
      route: isMLLearningRoute(data?.ml_learning_route)
        ? data.ml_learning_route
        : null,
      unavailable: !!error,
    };
  } catch {
    return { route: null, unavailable: true };
  }
}
