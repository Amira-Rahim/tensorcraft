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

  const { data: streaksRaw } = await supabase
    .from("streaks")
    .select("theme_id, current_streak, longest_streak")
    .eq("user_id", user.id);
  const streaks = streaksRaw ?? [];

  const totalStreak = streaks.reduce(
    (max, s) => Math.max(max, s.current_streak ?? 0),
    0,
  );
  const longestStreak = streaks.reduce(
    (max, s) => Math.max(max, s.longest_streak ?? 0),
    0,
  );
  const totalCompleted = themeProgress.reduce(
    (sum, t) => sum + t.completedLessons,
    0,
  );

  const displayName =
    profile?.display_name || user.email?.split("@")[0] || "Explorer";

  return (
    <main className="min-h-screen bg-surface relative">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="font-mono text-[11px] text-text-muted tracking-wider mb-2 flex items-center gap-2">
            <span className="inline-block w-[5px] h-[5px] bg-primary" />
            Good to see you
          </div>
          <h1 className="text-2xl font-bold font-mono text-text-primary mb-1">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm font-mono text-text-muted">
            Pick up where you left off or explore a new theme.
          </p>
        </div>

        {/* Streak Stats */}
        {totalStreak > 0 && (
          <div className="grid grid-cols-3 border border-border mb-10">
            {[
              {
                label: "Day Streak",
                value: totalStreak,
                accent: true,
              },
              {
                label: "Best Streak",
                value: longestStreak,
                accent: false,
              },
              {
                label: "Lessons Done",
                value: totalCompleted,
                accent: false,
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="px-6 py-5"
                style={{
                  borderRight: i < 2 ? "1px solid var(--tc-border)" : "none",
                  background: stat.accent
                    ? "rgba(107,170,138,0.03)"
                    : "transparent",
                }}
              >
                <div className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase mb-2">
                  {stat.label}
                </div>
                <div
                  className="font-mono text-3xl font-black leading-none"
                  style={{
                    color: stat.accent ? "var(--tc-primary)" : "var(--tc-text)",
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Continue Learning */}
        {continueTheme && (
          <section className="mb-10">
            <div className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase mb-3">
              // Continue Learning
            </div>
            <Link
              href={`/themes/${continueTheme.themeSlug}/${continueTheme.lastModuleId}/${continueTheme.lastLessonId}`}
              className="block p-6 bg-surface-raised border-2 border-primary/30 transition-all brutalist-hover brutalist-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold font-mono text-primary">
                  {continueTheme.displayName}
                </span>
                <span className="text-xs font-mono text-text-muted px-2.5 py-1 border border-border">
                  {continueTheme.completedLessons}/{continueTheme.totalLessons}{" "}
                  lessons
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-border overflow-hidden mb-3">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${continueTheme.totalLessons > 0 ? (continueTheme.completedLessons / continueTheme.totalLessons) * 100 : 0}%`,
                  }}
                />
              </div>

              <span className="text-sm font-bold font-mono text-primary uppercase tracking-wider">
                Resume Lesson →
              </span>
            </Link>
          </section>
        )}

        {/* All Themes */}
        <section>
          <div className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase mb-3">
            // Your Themes
          </div>
          <div className="grid gap-0.5 sm:grid-cols-2">
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
                  className="p-5 bg-surface-raised border border-border transition-all brutalist-hover"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold font-mono text-primary">
                      {tp.displayName}
                    </span>
                    {hasStarted && (
                      <span className="text-xs font-mono text-primary font-bold">
                        {percent}%
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-border overflow-hidden mb-2">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="text-xs font-mono text-text-muted">
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
          <div className="font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase mb-3">
            // Coming Soon
          </div>
          <div className="grid gap-0.5 sm:grid-cols-2">
            {Object.values(themes)
              .filter((t) => t.status === "coming-soon")
              .map((theme) => (
                <div
                  key={theme.slug}
                  className="p-5 bg-surface-raised border border-border opacity-50"
                >
                  <span className="text-sm font-semibold font-mono text-text-primary">
                    {theme.displayName}
                  </span>
                  <p className="text-xs font-mono text-text-muted mt-1">
                    {theme.specialization}
                  </p>
                  <span className="inline-block mt-2 font-mono text-[9px] text-text-muted border border-border px-2 py-0.5 tracking-wider">
                    COMING SOON
                  </span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
