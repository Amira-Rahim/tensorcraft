import { buildSystemEvidence } from "@/lib/system-evidence";
import { getLearningRoutePreference } from "@/lib/learning-route-server";
import { canOpenLearningModule } from "@tensorcraft/shared";
import { redirect } from "next/navigation";
import { worlds } from "@tensorcraft/worlds";
import {
  getModules,
  getModuleLessons,
  getLesson,
  getLessonTotalMinutes,
  getWorldLessons,
  getLessonsWithBridges,
} from "@tensorcraft/content";
import { isLaunched } from "@tensorcraft/shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { surfacePlateSrc } from "@/lib/location-art";
import { patchSrc } from "@/lib/patch-art";
import { getEntitledWorlds } from "@/lib/entitlements";
import {
  type DashboardModule,
  type DashboardBridge,
  type ActivityRecord,
} from "../dashboard-view";
import { computeWeeklyHints } from "./viz-data";

export async function loadDashboardData(
  view: "home" | "progress" | "project" = "home",
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Fetch profile, progress, streaks, exercise attempts, and purchases in
  // parallel. Queries are scoped to the user and limited to prevent
  // unbounded fetches. Purchases are queried directly via Supabase (same
  // pattern as settings / pricing / purchase-success) rather than
  // GET /api/purchases/access, avoids an extra hop and keeps RLS as
  // the single source of truth for access gating.
  const [
    { data: profile },
    { data: progressRecords, error: progressError },
    { data: streaksRaw },
    { data: exerciseAttempts, error: attemptsError },
    ownedWorlds,
    learningPreference,
    activityResult,
    reviewResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("world_progress")
      .select("world_id, module_id, lesson_id, status, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(300),
    supabase
      .from("streaks")
      // last_activity_date rides along so the streak-at-risk nudge below
      // doesn't need its own BLOCKING second query over the same table
      // (fresh-eyes rerun T2-26: the dashboard issued the streaks query
      // twice, the second serially).
      .select("world_id, current_streak, longest_streak, last_activity_date")
      .eq("user_id", user.id),
    // Recent recorded attempts support project evidence and the Progress view.
    // Null scores are excluded from the average; hint data is bucketed by week.
    supabase
      .from("exercise_attempts")
      .select("score, attempted_at, lesson_id, world_id, hints_used")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false })
      .limit(800),
    // Entitled worlds from the single source (Tier 1 F4) - was a hand-rolled
    // purchases query + world_ids loop duplicated across three files.
    getEntitledWorlds(user.id),
    getLearningRoutePreference(supabase, user.id),
    Promise.resolve(
      supabase
        .from("learning_activity_progress")
        .select("*")
        .eq("user_id", user.id)
        .limit(64),
    ).catch(() => ({
      data: null,
      error: new Error("Activity records unavailable"),
    })),
    Promise.resolve(
      supabase
        .from("review_queue")
        .select("lesson_id,next_review_at")
        .eq("user_id", user.id)
        .eq("world_id", "deep-orbit")
        .limit(300),
    ).catch(() => ({
      data: null,
      error: new Error("Review records unavailable"),
    })),
  ]);

  const streaks = streaksRaw ?? [];
  const records = progressRecords ?? [];
  const attempts = exerciseAttempts ?? [];

  const displayName =
    profile?.display_name || user.email?.split("@")[0] || "Explorer";
  const avatarUrl = profile?.avatar_url || null;

  // Only launched worlds have course content. The catalog lives on /worlds.
  const launchedWorlds = Object.values(worlds).filter((t) =>
    isLaunched(t.slug),
  );
  const activeWorld = launchedWorlds[0];

  if (!activeWorld) redirect("/worlds");

  // Streaks use UTC date keys, matching the existing streak RPC.
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const streakAtRisk = streaks.some(
    (s) =>
      s.world_id === activeWorld.slug &&
      (s.current_streak ?? 0) >= 1 &&
      s.last_activity_date === yesterdayKey,
  );

  // Fetch skill genome data for the user's active world
  const { data: genomeData } =
    view === "progress"
      ? await supabase
          .from("skill_genome")
          .select("skill_axis, proficiency, velocity")
          .eq("user_id", user.id)
          .eq("world_id", activeWorld.slug)
      : { data: [] };

  // Build module map
  const contentModules = getModules(activeWorld.slug);
  const completedLessonKeys = new Set(
    records
      .filter((r) => r.status === "completed")
      .map((r) => `${r.world_id}/${r.module_id}/${r.lesson_id}`),
  );

  // Sequential unlock (owner ruling 2026-09-20): the first module that is
  // not done is the active one and every later module stays locked until it
  // is. Paid modules also stay locked without Deep Orbit access. The route
  // preference changes recommendations inside lessons, never this order.
  let foundIncomplete = false;
  const dashModules: DashboardModule[] = contentModules.map((mod, i) => {
    const modLessons = getModuleLessons(activeWorld.slug, mod.slug);
    const completedInMod = modLessons.filter((l) =>
      completedLessonKeys.has(`${activeWorld.slug}/${mod.slug}/${l.slug}`),
    ).length;

    let status: DashboardModule["status"];
    let lockReason: DashboardModule["lockReason"];
    const prerequisite = i > 0 ? contentModules[i - 1] : undefined;
    if (completedInMod === modLessons.length && modLessons.length > 0) {
      status = "done";
    } else {
      lockReason = foundIncomplete
        ? "prerequisite"
        : !canOpenLearningModule(mod.order, ownedWorlds.has(activeWorld.slug))
          ? "access"
          : undefined;
      status = lockReason ? "locked" : "active";
      foundIncomplete = true;
    }

    const num = String(i + 1).padStart(2, "0");
    return {
      number: `M${num}`,
      name: mod.title,
      story: mod.description,
      status,
      score: null,
      formula: "",
      completedLessons: completedInMod,
      totalLessons: modLessons.length,
      lockReason,
      prerequisiteName: prerequisite?.title,
      slug: mod.slug,
      patchSrc: patchSrc(activeWorld.slug, mod.slug),
      missions: modLessons.map((lesson) => ({
        title: lesson.title,
        completed: completedLessonKeys.has(
          `${activeWorld.slug}/${mod.slug}/${lesson.slug}`,
        ),
      })),
    };
  });

  const completedModules = dashModules.filter(
    (m) => m.status === "done",
  ).length;

  // Current module info
  const activeModule =
    dashModules.find((m) => m.status === "active") ??
    dashModules.find((m) => m.status === "locked");
  let currentModuleInfo: {
    number: number;
    name: string;
    lessonNumber: number;
    totalLessons: number;
    estimatedMinutes: number;
    topic: string;
  } | null = null;

  let resumeUrl: string | null = null;
  let missionScene:
    | { src: string; alt: string; location: string; narrative: string }
    | undefined;
  let resumeLabel = records.some((r) => r.world_id === activeWorld.slug)
    ? "Continue course →"
    : "Start learning →";

  if (activeModule) {
    const modIndex = dashModules.indexOf(activeModule);
    const modLessons = getModuleLessons(activeWorld.slug, activeModule.slug);

    // Find first incomplete lesson in module
    const firstIncompleteLessonIndex = modLessons.findIndex(
      (l) =>
        !completedLessonKeys.has(
          `${activeWorld.slug}/${activeModule.slug}/${l.slug}`,
        ),
    );
    const lessonIndex =
      firstIncompleteLessonIndex >= 0 ? firstIncompleteLessonIndex : 0;
    const currentLesson = modLessons[lessonIndex];

    if (currentLesson) {
      if (currentLesson.scene?.portraitAlt) {
        missionScene = {
          src: `/scenes/${activeWorld.slug}/${activeModule.slug}/${currentLesson.slug}.webp`,
          alt: currentLesson.scene.portraitAlt,
          location: currentLesson.scene.location,
          narrative: currentLesson.context?.narrative ?? "",
        };
      }
      currentModuleInfo = {
        number: modIndex + 1,
        name: activeModule.name,
        lessonNumber: lessonIndex + 1,
        totalLessons: modLessons.length,
        estimatedMinutes: getLessonTotalMinutes(currentLesson),
        topic: currentLesson.title ?? "",
      };

      resumeUrl = `/worlds/${activeWorld.slug}/${activeModule.slug}/${currentLesson.slug}${learningPreference.route === "challenge" ? "?start=challenge" : ""}`;

      if (activeModule.lockReason === "access") {
        resumeUrl = `/pricing?locked=${activeWorld.slug}&module=${activeModule.slug}`;
        resumeLabel = `Get access to Module ${modIndex + 1} →`;
      }
    }
  }

  // Stats
  const totalLessons = contentModules.reduce(
    (sum, mod) => sum + getModuleLessons(activeWorld.slug, mod.slug).length,
    0,
  );
  const completedLessonsCount = contentModules.reduce(
    (sum, mod) =>
      sum +
      getModuleLessons(activeWorld.slug, mod.slug).filter((l) =>
        completedLessonKeys.has(`${activeWorld.slug}/${mod.slug}/${l.slug}`),
      ).length,
    0,
  );
  const worldProgressPercent =
    totalLessons > 0
      ? Math.round((completedLessonsCount / totalLessons) * 100)
      : 0;

  const evidenceUnavailable =
    !!activityResult.error ||
    !!reviewResult.error ||
    !!progressError ||
    !!attemptsError;
  const stages =
    activeWorld.slug === "deep-orbit"
      ? buildSystemEvidence({
          entitled: ownedWorlds.has("deep-orbit"),
          lessons: getWorldLessons("deep-orbit"),
          attempts,
          progress: records,
          activities: activityResult.data ?? [],
          reviews: reviewResult.data ?? [],
          now: new Date(),
        })
      : [];
  const dueReviews = reviewResult.error
    ? []
    : stages.flatMap((stage) => stage.due);

  const worldStreaks = streaks.filter((s) => s.world_id === activeWorld.slug);
  const currentStreak = worldStreaks.reduce(
    (max, s) => Math.max(max, s.current_streak ?? 0),
    0,
  );
  const bestStreak = worldStreaks.reduce(
    (max, s) => Math.max(max, s.longest_streak ?? 0),
    0,
  );

  const scoredAttempts = attempts.filter(
    (a) =>
      a.world_id === activeWorld.slug &&
      a.score !== null &&
      Number.isFinite(a.score),
  );
  const averageScore = scoredAttempts.length
    ? scoredAttempts.reduce((sum, a) => sum + a.score!, 0) /
      scoredAttempts.length
    : null;
  const worldAttempts = attempts.filter((a) => a.world_id === activeWorld.slug);
  const lossCurveData = {
    weekly: computeWeeklyHints(
      worldAttempts
        .filter(
          (a) =>
            typeof a.hints_used === "number" && Number.isFinite(a.hints_used),
        )
        .map((a) => ({
          attempted_at: a.attempted_at,
          hints_used: a.hints_used!,
        })),
      12,
    ),
  };

  // Bridge collectibles
  const completedLessonKeysSimple = new Set(
    records
      .filter((r) => r.status === "completed")
      .map((r) => `${r.world_id}/${r.lesson_id}`),
  );

  const allBridges: DashboardBridge[] = getLessonsWithBridges(
    activeWorld.slug,
  ).map((b) => ({
    ...b,
    collected: completedLessonKeysSimple.has(
      `${activeWorld.slug}/${b.lessonSlug}`,
    ),
  }));

  // Activity heatmap (last 30 days)
  const now = new Date();
  const activityDays: number[] = [];
  for (let d = 29; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().slice(0, 10);

    // Count records updated on this date
    const dayCount = records.filter(
      (r) =>
        r.world_id === activeWorld.slug &&
        r.updated_at &&
        r.updated_at.slice(0, 10) === dateStr,
    ).length;

    // Map count to 0-4 intensity
    if (dayCount === 0) activityDays.push(0);
    else if (dayCount <= 1) activityDays.push(1);
    else if (dayCount <= 3) activityDays.push(2);
    else if (dayCount <= 5) activityDays.push(3);
    else activityDays.push(4);
  }

  // Completed, known lessons only. Opening a lesson is not an accomplishment.
  const recentActivity: ActivityRecord[] = [...records]
    .filter(
      (r) =>
        r.world_id === activeWorld.slug &&
        r.status === "completed" &&
        getModuleLessons(activeWorld.slug, r.module_id).some(
          (l) => l.slug === r.lesson_id,
        ),
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .filter(
      (r, i, rows) =>
        rows.findIndex(
          (other) =>
            other.module_id === r.module_id && other.lesson_id === r.lesson_id,
        ) === i,
    )
    .slice(0, 3)
    .map((r) => ({
      time: getTimeAgo(r.updated_at),
      event: "lesson_completed",
      detail:
        getLesson(r.world_id, r.module_id, r.lesson_id)?.title ?? r.lesson_id,
      href: `/worlds/${r.world_id}/${r.module_id}/${r.lesson_id}`,
      sceneSrc: getLesson(r.world_id, r.module_id, r.lesson_id)?.scene
        ?.portraitAlt
        ? `/scenes/${r.world_id}/${r.module_id}/${r.lesson_id}.webp`
        : undefined,
      score: null,
    }));

  return {
    userId: user.id,
    entitled: ownedWorlds.has(activeWorld.slug),
    stages,
    evidenceUnavailable,
    dashboard: {
      displayName,
      avatarUrl,
      worldName: activeWorld.displayName,
      worldSlug: activeWorld.slug,
      plateSrc: surfacePlateSrc(activeWorld.slug, "dashboard"),
      missionScene,
      modules: dashModules,
      currentModule: currentModuleInfo,
      worldProgressPercent,
      completedLessons: completedLessonsCount,
      totalLessons,
      currentStreak,
      bestStreak,
      averageScore,
      scoredAttemptCount: scoredAttempts.length,
      exerciseLessonCount: new Set(scoredAttempts.map((a) => a.lesson_id)).size,
      bridges: allBridges,
      activityDays,
      recentActivity,
      resumeUrl,
      resumeLabel,
      totalModules: contentModules.length,
      completedModules,
      genomeData: genomeData ?? [],
      lossCurveData,
      dueReviews,
      reviewsUnavailable: !!reviewResult.error,
      progressUnavailable: !!progressError,
      streakAtRisk,
      projectCheckpoint: stages.find(
        (stage) => stage.completedLessons > 0 && stage.work.length > 0,
      )?.title,
    },
  };
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}
