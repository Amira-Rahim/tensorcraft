import { redirect } from "next/navigation";
import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { getModules, getModuleLessons } from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Tensorcraft",
  description: "Track your ML learning progress across themes.",
};

interface ThemeProgress {
  themeSlug: string;
  displayName: string;
  accentColor: string;
  totalLessons: number;
  completedLessons: number;
  lastLessonId: string | null;
  lastModuleId: string | null;
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Fetch all progress records for this user
  const { data: progressRecords } = await supabase
    .from("theme_progress")
    .select("theme_id, module_id, lesson_id, status, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Build per-theme progress summaries
  const launchedThemes = Object.values(themes).filter(
    (t) => t.status === "launched",
  );

  const themeProgress: ThemeProgress[] = launchedThemes.map((theme) => {
    const modules = getModules(theme.slug);
    let totalLessons = 0;
    for (const mod of modules) {
      totalLessons += getModuleLessons(theme.slug, mod.slug).length;
    }

    const themeRecords = (progressRecords ?? []).filter(
      (r) => r.theme_id === theme.slug,
    );
    const completedLessons = themeRecords.filter(
      (r) => r.status === "completed",
    ).length;

    // Most recently updated record = resume point
    const lastRecord = themeRecords[0] ?? null;

    return {
      themeSlug: theme.slug,
      displayName: theme.displayName,
      accentColor: theme.palette.accent,
      totalLessons,
      completedLessons,
      lastLessonId: lastRecord?.lesson_id ?? null,
      lastModuleId: lastRecord?.module_id ?? null,
    };
  });

  // Find the theme to continue (most recent activity)
  const continueTheme = themeProgress.find((t) => t.lastLessonId) ?? null;

  // Fetch streaks (table added in migration 003 — may not be in generated types yet)
  type StreakRow = {
    theme_id: string;
    current_streak: number;
    longest_streak: number;
  };
  const { data: streaksRaw } = await supabase
    .from("streaks" as "profiles")
    .select("theme_id, current_streak, longest_streak")
    .eq("user_id", user.id);
  const streaks = (streaksRaw ?? []) as unknown as StreakRow[];

  const totalStreak = streaks.reduce(
    (max, s) => Math.max(max, s.current_streak ?? 0),
    0,
  );
  const longestStreak = streaks.reduce(
    (max, s) => Math.max(max, s.longest_streak ?? 0),
    0,
  );

  const displayName =
    profile?.display_name || user.email?.split("@")[0] || "Explorer";

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--tc-text, #FFFFFF)" }}
          >
            Welcome back, {displayName}
          </h1>
          <p className="text-sm" style={{ color: "var(--tc-muted, #8B92A5)" }}>
            Pick up where you left off or explore a new theme.
          </p>
        </div>

        {/* Streak Stats */}
        {totalStreak > 0 && (
          <div className="flex gap-4 mb-10">
            <div
              className="rounded-[14px] px-5 py-4 flex-1"
              style={{
                background: "var(--tc-surface, #0F1320)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--tc-accent, #00D4FF)" }}
              >
                {totalStreak}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--tc-muted, #8B92A5)" }}
              >
                Day Streak
              </div>
            </div>
            <div
              className="rounded-[14px] px-5 py-4 flex-1"
              style={{
                background: "var(--tc-surface, #0F1320)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--tc-text, #FFFFFF)" }}
              >
                {longestStreak}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--tc-muted, #8B92A5)" }}
              >
                Best Streak
              </div>
            </div>
            <div
              className="rounded-[14px] px-5 py-4 flex-1"
              style={{
                background: "var(--tc-surface, #0F1320)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--tc-text, #FFFFFF)" }}
              >
                {themeProgress.reduce((sum, t) => sum + t.completedLessons, 0)}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--tc-muted, #8B92A5)" }}
              >
                Lessons Done
              </div>
            </div>
          </div>
        )}

        {/* Continue Learning */}
        {continueTheme && (
          <section className="mb-10">
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--tc-muted, #8B92A5)" }}
            >
              Continue Learning
            </h2>
            <Link
              href={`/themes/${continueTheme.themeSlug}/${continueTheme.lastModuleId}/${continueTheme.lastLessonId}`}
              className="block rounded-[14px] p-6 transition-all hover:scale-[1.01]"
              style={{
                background: "var(--tc-surface, #0F1320)",
                border: `1px solid ${continueTheme.accentColor}30`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-sm font-semibold"
                  style={{ color: continueTheme.accentColor }}
                >
                  {continueTheme.displayName}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: `${continueTheme.accentColor}15`,
                    color: continueTheme.accentColor,
                  }}
                >
                  {continueTheme.completedLessons}/{continueTheme.totalLessons}{" "}
                  lessons
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="h-1.5 rounded-full overflow-hidden mb-3"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${continueTheme.totalLessons > 0 ? (continueTheme.completedLessons / continueTheme.totalLessons) * 100 : 0}%`,
                    background: continueTheme.accentColor,
                  }}
                />
              </div>

              <span
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                Resume →
              </span>
            </Link>
          </section>
        )}

        {/* All Themes */}
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            Your Themes
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {themeProgress.map((tp) => {
              const percent =
                tp.totalLessons > 0
                  ? Math.round((tp.completedLessons / tp.totalLessons) * 100)
                  : 0;
              const hasStarted = tp.completedLessons > 0 || tp.lastLessonId;

              return (
                <Link
                  key={tp.themeSlug}
                  href={`/themes/${tp.themeSlug}`}
                  className="rounded-[14px] p-5 transition-all hover:scale-[1.01]"
                  style={{
                    background: "var(--tc-surface, #0F1320)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: tp.accentColor }}
                    >
                      {tp.displayName}
                    </span>
                    {hasStarted && (
                      <span
                        className="text-xs font-mono"
                        style={{ color: "var(--tc-muted, #8B92A5)" }}
                      >
                        {percent}%
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-1 rounded-full overflow-hidden mb-2"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        background: tp.accentColor,
                      }}
                    />
                  </div>

                  <span
                    className="text-xs"
                    style={{ color: "var(--tc-muted, #8B92A5)" }}
                  >
                    {tp.completedLessons} of {tp.totalLessons} lessons
                    {!hasStarted && " — Start learning"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Coming Soon Themes */}
        <section className="mt-10">
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            Coming Soon
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.values(themes)
              .filter((t) => t.status === "coming-soon")
              .map((theme) => (
                <div
                  key={theme.slug}
                  className="rounded-[14px] p-5 opacity-60"
                  style={{
                    background: "var(--tc-surface, #0F1320)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: theme.palette.accent }}
                  >
                    {theme.displayName}
                  </span>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--tc-muted, #8B92A5)" }}
                  >
                    {theme.specialization}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
