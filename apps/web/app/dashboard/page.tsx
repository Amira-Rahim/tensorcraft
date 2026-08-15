import { redirect } from "next/navigation";
import { worlds } from "@tensorcraft/worlds";
import {
  getModules,
  getModule,
  getModuleLessons,
  getLesson,
  getLessonTotalMinutes,
  getWorldLessons,
  getLessonsWithBridges,
} from "@tensorcraft/content";
import { LAUNCHED_WORLDS, isLaunched, isComingSoon } from "@tensorcraft/shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { surfacePlateSrc } from "@/lib/location-art";
import { patchSrc } from "@/lib/patch-art";
import { hasWorldPurchase } from "@/lib/progress";
import { getEntitledWorlds } from "@/lib/entitlements";
import type { Metadata } from "next";
import {
  DashboardView,
  type DashboardModule,
  type DashboardBridge,
  type ActivityRecord,
} from "./dashboard-view";
import { WorldCards, type WorldCardData } from "./world-cards";
import { computeWeeklyHints } from "./_lib/viz-data";

export const metadata: Metadata = {
  title: "Dashboard | Tensorcraft",
  description: "Track your ML learning progress across worlds.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
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
    { data: progressRecords },
    { data: streaksRaw },
    { data: exerciseAttempts },
    ownedWorlds,
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
    // One query serves both averageScore/moduleScoreMap (whole-history) and
    // lossCurveData (client-side filtered to the last 12 weeks). Keeping the
    // query unbounded by time preserves the existing averageScore semantics
    // (overall per-user average across all attempts).
    supabase
      .from("exercise_attempts")
      .select("score, attempted_at, lesson_id, world_id, hints_used")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false })
      .limit(800),
    // Entitled worlds from the single source (Tier 1 F4) — was a hand-rolled
    // purchases query + world_ids loop duplicated across three files.
    getEntitledWorlds(user.id),
  ]);

  // Streak nudge: any of the user's per-world streaks where last_activity_date
  // is exactly yesterday, meaning the streak survives if they act today, dies
  // tomorrow otherwise. Computed against the user's local-day boundary using
  // UTC date components (server uses UTC; the streak RPC also uses date math
  // without timezone, so this matches).
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const todayKey = today.toISOString().slice(0, 10);
  const streakAtRisk = (streaksRaw ?? []).some(
    (s) =>
      (s.current_streak ?? 0) >= 1 &&
      s.last_activity_date === yesterdayKey &&
      s.last_activity_date !== todayKey,
  );

  const twelveWeeksAgoMs = Date.now() - 12 * 7 * 24 * 60 * 60 * 1000;
  const lossCurveData = {
    weekly: computeWeeklyHints(
      (exerciseAttempts ?? []).filter(
        (a) => new Date(a.attempted_at).getTime() >= twelveWeeksAgoMs,
      ),
      12,
    ),
  };

  // ownedWorlds now comes from getEntitledWorlds (above) — the single
  // entitlement source, which already validates slugs.
  // "Full bundle" = all currently-launched worlds owned. Coming-soon worlds
  // are excluded, they aren't purchasable. When a new world launches and is
  // added to LAUNCHED_WORLDS, this check expands automatically.
  const hasFullBundle = LAUNCHED_WORLDS.every((slug) => ownedWorlds.has(slug));

  const streaks = streaksRaw ?? [];
  const records = progressRecords ?? [];
  const attempts = exerciseAttempts ?? [];

  // Active-world picks come from the LAUNCHED set only, coming-soon worlds
  // have no compiled content (Velite excludes them) so getModules/etc. would
  // return empty arrays. Coming-soon worlds still render as cards below for
  // discoverability + waitlist capture, but never become the active surface.
  const allWorlds = Object.values(worlds);
  const launchedWorlds = allWorlds.filter((t) => isLaunched(t.slug));
  const activeWorld = launchedWorlds[0];

  if (!activeWorld) redirect("/worlds");

  // Fetch skill genome data for the user's active world
  const { data: genomeData } = await supabase
    .from("skill_genome")
    .select("skill_axis, proficiency, velocity")
    .eq("user_id", user.id)
    .eq("world_id", activeWorld.slug);

  // Build module map
  const contentModules = getModules(activeWorld.slug);
  const completedLessonKeys = new Set(
    records
      .filter((r) => r.status === "completed")
      .map((r) => `${r.world_id}/${r.module_id}/${r.lesson_id}`),
  );

  // Build a map of module slug -> exercise scores for per-module averages
  const moduleScoreMap = new Map<string, number[]>();
  for (const attempt of attempts) {
    if (attempt.world_id !== activeWorld.slug) continue;
    // Find which module this lesson belongs to
    for (const mod of contentModules) {
      const modLessons = getModuleLessons(activeWorld.slug, mod.slug);
      if (modLessons.some((l) => l.slug === attempt.lesson_id)) {
        const existing = moduleScoreMap.get(mod.slug) ?? [];
        existing.push(attempt.score ?? 0);
        moduleScoreMap.set(mod.slug, existing);
        break;
      }
    }
  }

  // Find current module (first non-complete module)
  let foundActive = false;
  const dashModules: DashboardModule[] = contentModules.map((mod, i) => {
    const modLessons = getModuleLessons(activeWorld.slug, mod.slug);
    const completedInMod = modLessons.filter((l) =>
      completedLessonKeys.has(`${activeWorld.slug}/${mod.slug}/${l.slug}`),
    ).length;

    let score: number | null = null;
    if (completedInMod === modLessons.length && modLessons.length > 0) {
      // Module complete, derive score from real exercise attempts
      const modScores = moduleScoreMap.get(mod.slug);
      if (modScores && modScores.length > 0) {
        score = Math.round(
          modScores.reduce((sum, s) => sum + s, 0) / modScores.length,
        );
      } else {
        score = 0;
      }
    }

    let status: "done" | "active" | "locked";
    if (completedInMod === modLessons.length && modLessons.length > 0) {
      status = "done";
    } else if (!foundActive && (completedInMod > 0 || i === 0)) {
      status = "active";
      foundActive = true;
    } else if (!foundActive && i === 0) {
      status = "active";
      foundActive = true;
    } else {
      status = foundActive ? "locked" : "locked";
      // If no module has been started, make the first one active
    }

    const num = String(i + 1).padStart(2, "0");
    return {
      number: `M${num}`,
      name: mod.title,
      status,
      score,
      formula: mod.description?.slice(0, 20) ?? "",
      slug: mod.slug,
      patchSrc: patchSrc(activeWorld.slug, mod.slug),
    };
  });

  // Ensure at least one module is active
  if (!dashModules.some((m) => m.status === "active")) {
    const firstLocked = dashModules.find((m) => m.status === "locked");
    if (firstLocked) firstLocked.status = "active";
  }

  const completedModules = dashModules.filter(
    (m) => m.status === "done",
  ).length;

  // Current module info
  const activeModule = dashModules.find((m) => m.status === "active");
  let currentModuleInfo: {
    number: number;
    name: string;
    lessonNumber: number;
    totalLessons: number;
    estimatedMinutes: number;
    topic: string;
  } | null = null;

  let resumeUrl: string | null = null;
  let resumeLabel: string | undefined;

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
      currentModuleInfo = {
        number: modIndex + 1,
        name: activeModule.name,
        lessonNumber: lessonIndex + 1,
        totalLessons: modLessons.length,
        estimatedMinutes: getLessonTotalMinutes(currentLesson),
        topic: currentLesson.title ?? "",
      };

      resumeUrl = `/worlds/${activeWorld.slug}/${activeModule.slug}/${currentLesson.slug}`;

      // Don't promise a lesson the paywall will intercept: modules past
      // the free first one need a purchase, and the old "Resume Lesson"
      // label teleported unpurchased users to /pricing mid-click
      // (2026-07-14 UX audit).
      if (modIndex > 0) {
        const purchased = await hasWorldPurchase(user.id, activeWorld.slug);
        if (!purchased) {
          resumeUrl = "/paywall";
          resumeLabel = `Unlock Module ${modIndex + 1} →`;
        }
      }
    }
  }

  // Stats
  const totalLessons = contentModules.reduce(
    (sum, mod) => sum + getModuleLessons(activeWorld.slug, mod.slug).length,
    0,
  );
  const completedLessonsCount = records.filter(
    (r) => r.world_id === activeWorld.slug && r.status === "completed",
  ).length;
  const worldProgressPercent =
    totalLessons > 0
      ? Math.round((completedLessonsCount / totalLessons) * 100)
      : 0;

  const currentStreak = streaks.reduce(
    (max, s) => Math.max(max, s.current_streak ?? 0),
    0,
  );
  const bestStreak = streaks.reduce(
    (max, s) => Math.max(max, s.longest_streak ?? 0),
    0,
  );

  const averageScore =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / attempts.length
      : 0;

  // Bridge collectibles
  const completedLessonKeysSimple = new Set(
    records
      .filter((r) => r.status === "completed")
      .map((r) => `${r.world_id}/${r.lesson_id}`),
  );

  const allBridges: DashboardBridge[] = launchedWorlds.flatMap((world) => {
    const bridgeLessons = getLessonsWithBridges(world.slug);
    return bridgeLessons.map((b) => ({
      ...b,
      collected: completedLessonKeysSimple.has(`${world.slug}/${b.lessonSlug}`),
    }));
  });

  // Activity heatmap (last 30 days)
  const now = new Date();
  const activityDays: number[] = [];
  for (let d = 29; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().slice(0, 10);

    // Count records updated on this date
    const dayCount = records.filter(
      (r) => r.updated_at && r.updated_at.slice(0, 10) === dateStr,
    ).length;

    // Map count to 0-4 intensity
    if (dayCount === 0) activityDays.push(0);
    else if (dayCount <= 1) activityDays.push(1);
    else if (dayCount <= 3) activityDays.push(2);
    else if (dayCount <= 5) activityDays.push(3);
    else activityDays.push(4);
  }

  // Recent activity (from progress records), resolve slugs to titles
  const recentActivity: ActivityRecord[] = records.slice(0, 6).map((r) => {
    const timeAgo = getTimeAgo(r.updated_at);
    const event =
      r.status === "completed" ? "lesson_completed" : "lesson_started";

    const mod = getModule(r.world_id, r.module_id);
    const lesson = getLesson(r.world_id, r.module_id, r.lesson_id);
    const moduleTitle = mod?.title ?? r.module_id;
    const lessonTitle = lesson?.title ?? r.lesson_id;

    return {
      time: timeAgo,
      event,
      detail: `${moduleTitle} · ${lessonTitle}`,
      score: r.status === "completed" ? null : null,
    };
  });

  const displayName =
    profile?.display_name || user.email?.split("@")[0] || "Explorer";
  const avatarUrl = profile?.avatar_url || null;

  // Build per-world card data:
  //   - launched + owned: real per-world progress
  //   - launched + locked: total lesson count + pricing link
  //   - coming-soon: muted card linking to the per-world stub w/ waitlist;
  //                  totalLessons = 0 because Velite skipped that world's content.
  const worldCardsData: WorldCardData[] = allWorlds.map((world) => {
    const comingSoon = isComingSoon(world.slug);
    const worldLessons = comingSoon ? [] : getWorldLessons(world.slug);
    const totalLessonsForWorld = worldLessons.length;
    const owned = ownedWorlds.has(world.slug);
    const completedForWorld =
      owned && !comingSoon
        ? records.filter(
            (r) => r.world_id === world.slug && r.status === "completed",
          ).length
        : 0;
    const progressPercent =
      owned && totalLessonsForWorld > 0
        ? Math.round((completedForWorld / totalLessonsForWorld) * 100)
        : 0;

    return {
      slug: world.slug,
      displayName: world.displayName,
      tagline: world.tagline,
      specialization: world.specialization,
      primary: world.palette.primary,
      primaryLight: world.paletteLight.primary,
      owned,
      isActive: world.slug === activeWorld.slug && owned,
      completedLessons: completedForWorld,
      totalLessons: totalLessonsForWorld,
      progressPercent,
      comingSoon,
    };
  });

  return (
    <DashboardView
      displayName={displayName}
      avatarUrl={avatarUrl}
      worldName={activeWorld.displayName}
      worldSlug={activeWorld.slug}
      plateSrc={surfacePlateSrc(activeWorld.slug, "dashboard")}
      modules={dashModules}
      currentModule={currentModuleInfo}
      worldProgressPercent={worldProgressPercent}
      worldPoints={{
        current: Math.round(
          (completedLessonsCount / Math.max(totalLessons, 1)) * 100,
        ),
        total: 100,
      }}
      currentStreak={currentStreak}
      bestStreak={bestStreak}
      averageScore={averageScore}
      bridges={allBridges}
      activityDays={activityDays}
      recentActivity={recentActivity}
      resumeUrl={resumeUrl}
      resumeLabel={resumeLabel}
      totalModules={contentModules.length}
      completedModules={completedModules}
      genomeData={genomeData ?? []}
      lossCurveData={lossCurveData}
      worldCards={
        <WorldCards cards={worldCardsData} hasFullBundle={hasFullBundle} />
      }
      streakAtRisk={streakAtRisk}
    />
  );
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
