import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitledWorlds } from "@/lib/entitlements";
import {
  JOURNEY_ORDER,
  recommendedNextWorld,
  type WorldSlug,
} from "@tensorcraft/shared";
import { getWorldTotalLessons } from "@tensorcraft/shared";
import { getWorldLessons } from "@tensorcraft/content";

/** Per-world state within the canonical journey. */
export interface JourneyWorldState {
  slug: WorldSlug;
  position: number;
  owned: boolean;
  /** Fully completed (every lesson of the world done). */
  completed: boolean;
  completedLessons: number;
  totalLessons: number;
}

export interface JourneyState {
  /** When the learner closed the ring; null until then. */
  completedAt: string | null;
  /** The five worlds in ring order with per-world progress. */
  worlds: JourneyWorldState[];
  /** Soft nudge: next world to pursue (ring order, first unowned). Never gates. */
  recommendedNext: WorldSlug | null;
  /** True once every world in the ring is completed. */
  ringComplete: boolean;
}

/**
 * Resolve the learner's canonical-journey state.
 *
 * This is the READ foundation for the hybrid canonical track (scalability
 * audit F2, owner decision: canonical track + free play). It composes three
 * already-centralized sources — journey ring order (shared), entitlements
 * (getEntitledWorlds), and per-world completion (world_progress) — into one
 * shape the canonical-track UI consumes.
 *
 * Position is DERIVED here from completion, never stored (migration 044
 * deliberately keeps no denormalized pointer), so it cannot drift.
 *
 * There is no enrollment concept: the explicit opt-in step was cut
 * 2026-08-15. Every signed-in learner is on the journey; progressing through
 * worlds in ring order IS the journey. The journey_enrollment table survives
 * only as the durable completion record (completed_at), written by the
 * /journey page when it first observes the closed ring.
 */
export async function getJourneyState(userId: string): Promise<JourneyState> {
  const supabase = await getSupabaseServerClient();

  const [
    { data: enrollment, error: enrollmentError },
    owned,
    { data: progressRows, error: progressError },
  ] = await Promise.all([
    supabase
      .from("journey_enrollment")
      .select("completed_at")
      .eq("user_id", userId)
      .maybeSingle(),
    getEntitledWorlds(userId),
    supabase
      .from("world_progress")
      .select("world_id, lesson_id, status")
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  // Fail loud, not blank (same contract as entitlements.ts): a transient
  // PostgREST fault must not render a finished learner as unfinished with
  // 0/56 progress. Throwing reaches the route's error boundary, which offers
  // a retry instead of confidently lying.
  if (enrollmentError) {
    throw new Error(
      `Journey completion lookup failed: ${enrollmentError.message}`,
    );
  }
  if (progressError) {
    throw new Error(`Journey progress lookup failed: ${progressError.message}`);
  }

  // Count distinct completed lessons per world.
  const completedByWorld = new Map<string, Set<string>>();
  for (const row of progressRows ?? []) {
    const t = (row as { world_id: string }).world_id;
    const l = (row as { lesson_id: string }).lesson_id;
    if (!completedByWorld.has(t)) completedByWorld.set(t, new Set());
    completedByWorld.get(t)!.add(l);
  }

  // Per-world total: the corpus is NOT uniform (deep-orbit 56, neon 54, the
  // rest 55 — re-audit N2/F-A), so each world's completion is measured against
  // its OWN lesson count, not one shared constant.
  const worlds: JourneyWorldState[] = JOURNEY_ORDER.map((slug, position) => {
    const total = getWorldTotalLessons(slug);
    // Count only lessons that exist in the CURRENT corpus. world_progress
    // keeps rows for re-slugged/removed lessons (tl/05 was rebuilt once),
    // and counting orphans can mark a world "completed" while live lessons
    // remain undone — and push done past total.
    const validSlugs = new Set(getWorldLessons(slug).map((l) => l.slug));
    let done = 0;
    for (const lessonId of completedByWorld.get(slug) ?? []) {
      if (validSlugs.has(lessonId)) done += 1;
    }
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
    worlds.filter((t) => t.completed).map((t) => t.slug),
  );
  const ringComplete = worlds.every((t) => t.completed);

  return {
    completedAt: enrollment?.completed_at ?? null,
    worlds,
    // Recommend the next world not yet COMPLETED (canonical journey is about
    // finishing the ring, not just owning it), walking forward from the last
    // completed world.
    recommendedNext: recommendedNextWorld(
      completedSet,
      worlds.filter((t) => t.completed).at(-1)?.slug,
    ),
    ringComplete,
  };
}
