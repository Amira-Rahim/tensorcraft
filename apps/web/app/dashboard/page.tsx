import { redirect } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import {
  getModules,
  getModule,
  getModuleLessons,
  getLesson,
  getLessonsWithBridges,
} from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import {
  DashboardView,
  type DashboardModule,
  type DashboardBridge,
  type ActivityRecord,
} from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard | Tensorcraft",
  description: "Track your ML learning progress across themes.",
};

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // Fetch profile, progress, streaks, and exercise attempts in parallel.
  // Queries are scoped to the user and limited to prevent unbounded fetches.
  const [
    { data: profile },
    { data: progressRecords },
    { data: streaksRaw },
    { data: exerciseAttempts },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("theme_progress")
      .select("theme_id, module_id, lesson_id, status, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(300),
    supabase
      .from("streaks")
      .select("theme_id, current_streak, longest_streak")
      .eq("user_id", user.id),
    supabase
      .from("exercise_attempts")
      .select("score, attempted_at, lesson_id, theme_id")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false })
      .limit(200),
  ]);

  const streaks = streaksRaw ?? [];
  const records = progressRecords ?? [];
  const attempts = exerciseAttempts ?? [];

  // Use first launched theme for the dashboard (Deep Orbit)
  const launchedThemes = Object.values(themes).filter(
    (t) => t.status === "launched",
  );
  const activeTheme = launchedThemes[0];

  if (!activeTheme) redirect("/themes");

  // Fetch skill genome data for the user's active theme
  const { data: genomeData } = await supabase
    .from("skill_genome")
    .select("skill_axis, proficiency, velocity")
    .eq("user_id", user.id)
    .eq("theme_id", activeTheme.slug);

  // Build module map
  const contentModules = getModules(activeTheme.slug);
  const completedLessonKeys = new Set(
    records
      .filter((r) => r.status === "completed")
      .map((r) => `${r.theme_id}/${r.module_id}/${r.lesson_id}`),
  );

  // Build a map of module slug -> exercise scores for per-module averages
  const moduleScoreMap = new Map<string, number[]>();
  for (const attempt of attempts) {
    if (attempt.theme_id !== activeTheme.slug) continue;
    // Find which module this lesson belongs to
    for (const mod of contentModules) {
      const modLessons = getModuleLessons(activeTheme.slug, mod.slug);
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
    const modLessons = getModuleLessons(activeTheme.slug, mod.slug);
    const completedInMod = modLessons.filter((l) =>
      completedLessonKeys.has(`${activeTheme.slug}/${mod.slug}/${l.slug}`),
    ).length;

    let score: number | null = null;
    if (completedInMod === modLessons.length && modLessons.length > 0) {
      // Module complete — derive score from real exercise attempts
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

  if (activeModule) {
    const modIndex = dashModules.indexOf(activeModule);
    const modLessons = getModuleLessons(activeTheme.slug, activeModule.slug);

    // Find first incomplete lesson in module
    const firstIncompleteLessonIndex = modLessons.findIndex(
      (l) =>
        !completedLessonKeys.has(
          `${activeTheme.slug}/${activeModule.slug}/${l.slug}`,
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
        estimatedMinutes: currentLesson.estimatedMinutes ?? 18,
        topic: currentLesson.title ?? "",
      };

      resumeUrl = `/themes/${activeTheme.slug}/${activeModule.slug}/${currentLesson.slug}`;
    }
  }

  // Stats
  const totalLessons = contentModules.reduce(
    (sum, mod) => sum + getModuleLessons(activeTheme.slug, mod.slug).length,
    0,
  );
  const completedLessonsCount = records.filter(
    (r) => r.theme_id === activeTheme.slug && r.status === "completed",
  ).length;
  const themeProgressPercent =
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
      .map((r) => `${r.theme_id}/${r.lesson_id}`),
  );

  const allBridges: DashboardBridge[] = launchedThemes.flatMap((theme) => {
    const bridgeLessons = getLessonsWithBridges(theme.slug);
    return bridgeLessons.map((b) => ({
      ...b,
      collected: completedLessonKeysSimple.has(`${theme.slug}/${b.lessonSlug}`),
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

  // Recent activity (from progress records) — resolve slugs to titles
  const recentActivity: ActivityRecord[] = records.slice(0, 6).map((r) => {
    const timeAgo = getTimeAgo(r.updated_at);
    const event =
      r.status === "completed" ? "lesson_completed" : "lesson_started";

    const mod = getModule(r.theme_id, r.module_id);
    const lesson = getLesson(r.theme_id, r.module_id, r.lesson_id);
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

  return (
    <DashboardView
      displayName={displayName}
      themeName={activeTheme.displayName}
      themeSlug={activeTheme.slug}
      modules={dashModules}
      currentModule={currentModuleInfo}
      themeProgressPercent={themeProgressPercent}
      themePoints={{
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
      totalModules={contentModules.length}
      completedModules={completedModules}
      genomeData={genomeData ?? []}
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
