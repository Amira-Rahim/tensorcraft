/**
 * Operator log — aggregation layer for /log meta-screen.
 *
 * Pulls per-user, per-theme strategic-decision telemetry from the existing
 * tables (skill_events, review_queue, theme_progress, streaks,
 * exercise_attempts) and surfaces:
 *   - exploration ratio (% of recalls that were ε-explored)
 *   - recall success rate
 *   - completion velocity
 *   - capstone outcome
 *   - strategy class (explorer / exploiter / balanced)
 *
 * Pure data layer. Narrator blurbs and presentation logic live in
 * `apps/web/app/log/log-view.tsx`.
 *
 * Uses the server Supabase client; relies on RLS so each call is scoped
 * to the authenticated user. Pass the SupabaseClient in so the same lib
 * can be exercised from tests with a fixture client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type StrategyClass = "explorer" | "exploiter" | "balanced";

export interface ThemeOperatorStats {
  themeId: string;
  /** Total review-recall attempts in this theme. */
  totalRecalls: number;
  /** count(success=true) / totalRecalls. 0 when no recalls. */
  recallSuccessRate: number;
  /** count(was_explored=true) / totalRecalls. 0 when no recalls. */
  explorationRatio: number;
  /** Number of lessons w/ status='completed'. */
  lessonsCompleted: number;
  /** Lessons completed in last 28 days, divided by 4 (weeks). */
  weeklyCompletionVelocity: number;
  /** True iff at least one passing capstone exercise attempt. */
  capstonePassed: boolean;
  /** Highest capstone score across capstone attempts, or null. */
  capstoneBestScore: number | null;
  /** longest_streak from streaks table for this theme. 0 if absent. */
  bestStreak: number;
  /** Strategy classification per per-theme exploration ratio. */
  strategyClass: StrategyClass;
}

export interface OperatorLogSummary {
  perTheme: ThemeOperatorStats[];
  crossTheme: {
    totalRecalls: number;
    overallRecallSuccessRate: number;
    overallExplorationRatio: number;
    strategyClass: StrategyClass;
    /** Number of themes the player has any progress in. */
    activeThemesCount: number;
  };
}

/**
 * Strategy class thresholds. Sourced from plan file §11 design:
 *   explorer  ≥ 0.20
 *   exploiter ≤ 0.10
 *   balanced  otherwise
 *
 * Exposed for tests + for future tuning.
 */
export const STRATEGY_THRESHOLDS = {
  explorer: 0.2,
  exploiter: 0.1,
} as const;

export function classifyStrategy(explorationRatio: number): StrategyClass {
  if (explorationRatio >= STRATEGY_THRESHOLDS.explorer) return "explorer";
  if (explorationRatio <= STRATEGY_THRESHOLDS.exploiter) return "exploiter";
  return "balanced";
}

interface RawSkillEvent {
  theme_id: string;
  metadata: Record<string, unknown> | null;
}

interface RawProgress {
  theme_id: string;
  status: string;
  updated_at: string;
}

interface RawStreak {
  theme_id: string;
  longest_streak: number | null;
}

interface RawExerciseAttempt {
  theme_id: string;
  exercise_slug: string;
  passed: boolean;
  score: number | null;
}

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

/**
 * Aggregates raw per-user data into per-theme + cross-theme stats.
 * Pure function — easy to test in isolation. Server callers pass in
 * already-fetched rows so this same code runs in tests w/ fixtures.
 */
export function aggregateOperatorLog(args: {
  ownedThemeIds: string[];
  recallEvents: RawSkillEvent[];
  progressRows: RawProgress[];
  streakRows: RawStreak[];
  exerciseAttempts: RawExerciseAttempt[];
  totalLessonsByTheme: Record<string, number>;
  now?: Date;
}): OperatorLogSummary {
  const now = args.now ?? new Date();
  const cutoffMs = now.getTime() - FOUR_WEEKS_MS;

  const perTheme: ThemeOperatorStats[] = args.ownedThemeIds.map((themeId) => {
    const themeRecalls = args.recallEvents.filter(
      (e) => e.theme_id === themeId,
    );
    const totalRecalls = themeRecalls.length;
    const successCount = themeRecalls.filter(
      (e) => e.metadata?.success === true,
    ).length;
    const exploreCount = themeRecalls.filter(
      (e) => e.metadata?.was_explored === true,
    ).length;
    const recallSuccessRate =
      totalRecalls === 0 ? 0 : successCount / totalRecalls;
    const explorationRatio =
      totalRecalls === 0 ? 0 : exploreCount / totalRecalls;

    const themeProgress = args.progressRows.filter(
      (r) => r.theme_id === themeId,
    );
    const lessonsCompleted = themeProgress.filter(
      (r) => r.status === "completed",
    ).length;
    const recentCompletions = themeProgress.filter(
      (r) =>
        r.status === "completed" &&
        new Date(r.updated_at).getTime() >= cutoffMs,
    ).length;
    const weeklyCompletionVelocity = recentCompletions / 4;

    const themeAttempts = args.exerciseAttempts.filter(
      (a) => a.theme_id === themeId,
    );
    const capstoneAttempts = themeAttempts.filter((a) =>
      a.exercise_slug.toLowerCase().includes("capstone"),
    );
    const capstonePassed = capstoneAttempts.some((a) => a.passed);
    const capstoneBestScore = capstoneAttempts.reduce<number | null>(
      (best, a) =>
        a.score === null
          ? best
          : best === null
            ? a.score
            : Math.max(best, a.score),
      null,
    );

    const streak = args.streakRows.find((s) => s.theme_id === themeId);
    const bestStreak = streak?.longest_streak ?? 0;

    return {
      themeId,
      totalRecalls,
      recallSuccessRate,
      explorationRatio,
      lessonsCompleted,
      weeklyCompletionVelocity,
      capstonePassed,
      capstoneBestScore,
      bestStreak,
      strategyClass: classifyStrategy(explorationRatio),
    };
  });

  const crossTotalRecalls = perTheme.reduce((s, t) => s + t.totalRecalls, 0);
  const crossSuccessCount = args.recallEvents.filter(
    (e) =>
      args.ownedThemeIds.includes(e.theme_id) && e.metadata?.success === true,
  ).length;
  const crossExploreCount = args.recallEvents.filter(
    (e) =>
      args.ownedThemeIds.includes(e.theme_id) &&
      e.metadata?.was_explored === true,
  ).length;
  const overallRecallSuccessRate =
    crossTotalRecalls === 0 ? 0 : crossSuccessCount / crossTotalRecalls;
  const overallExplorationRatio =
    crossTotalRecalls === 0 ? 0 : crossExploreCount / crossTotalRecalls;
  const activeThemesCount = perTheme.filter(
    (t) => t.lessonsCompleted > 0 || t.totalRecalls > 0,
  ).length;

  return {
    perTheme,
    crossTheme: {
      totalRecalls: crossTotalRecalls,
      overallRecallSuccessRate,
      overallExplorationRatio,
      strategyClass: classifyStrategy(overallExplorationRatio),
      activeThemesCount,
    },
  };
}

/**
 * Server-side entrypoint. Fetches raw rows from Supabase via the passed
 * client (which already carries the user's auth context via cookies in the
 * Next.js server-component path) and aggregates them.
 *
 * Pass `totalLessonsByTheme` from the content layer (Velite) — this lib
 * stays free of content-package coupling, since callers already need to
 * know launched themes.
 */
export async function fetchOperatorLog(
  supabase: SupabaseClient,
  args: {
    userId: string;
    ownedThemeIds: string[];
    totalLessonsByTheme: Record<string, number>;
  },
): Promise<OperatorLogSummary> {
  const [
    { data: recallEvents },
    { data: progressRows },
    { data: streakRows },
    { data: exerciseAttempts },
  ] = await Promise.all([
    supabase
      .from("skill_events")
      .select("theme_id, metadata")
      .eq("user_id", args.userId)
      .eq("event_type", "review_recall")
      .limit(2000),
    supabase
      .from("theme_progress")
      .select("theme_id, status, updated_at")
      .eq("user_id", args.userId)
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase
      .from("streaks")
      .select("theme_id, longest_streak")
      .eq("user_id", args.userId),
    supabase
      .from("exercise_attempts")
      .select("theme_id, exercise_slug, passed, score")
      .eq("user_id", args.userId)
      .limit(2000),
  ]);

  return aggregateOperatorLog({
    ownedThemeIds: args.ownedThemeIds,
    recallEvents: (recallEvents ?? []) as RawSkillEvent[],
    progressRows: (progressRows ?? []) as RawProgress[],
    streakRows: (streakRows ?? []) as RawStreak[],
    exerciseAttempts: (exerciseAttempts ?? []) as RawExerciseAttempt[],
    totalLessonsByTheme: args.totalLessonsByTheme,
  });
}
