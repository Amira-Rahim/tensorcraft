import Link from "next/link";
import { notFound } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import { getModule, getModuleLessons } from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProgress } from "@/lib/progress";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; module: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, module: moduleSlug } = await params;
  const theme = themes[slug];
  const mod = getModule(slug, moduleSlug);
  if (!theme || !mod) return {};
  return {
    title: `${mod.title} — ${theme.displayName} | Tensorcraft`,
    description: mod.description,
  };
}

const difficultyColors = {
  beginner: "#00D4FF",
  intermediate: "#7B68EE",
  advanced: "#F0C75E",
};

export default async function ModuleOverviewPage({ params }: Props) {
  const { slug, module: moduleSlug } = await params;
  const theme = themes[slug];
  const mod = getModule(slug, moduleSlug);
  if (!theme || !mod) notFound();

  const lessons = getModuleLessons(slug, moduleSlug);

  // Fetch user progress for this theme (if authenticated)
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const progressRecords = user ? await getUserProgress(user.id, slug) : [];
  const progressMap = new Map(
    progressRecords.map((r) => [r.lesson_id, r.status as string]),
  );

  const completedCount = progressRecords.filter(
    (r) => r.module_id === moduleSlug && r.status === "completed",
  ).length;

  return (
    <main
      className="min-h-screen px-6 py-20"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-2 text-sm mb-8"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          <Link href="/themes" className="hover:underline">
            Themes
          </Link>
          <span>/</span>
          <Link href={`/themes/${slug}`} className="hover:underline">
            {theme.displayName}
          </Link>
          <span>/</span>
          <span style={{ color: theme.palette.text }}>{mod.title}</span>
        </div>

        {/* Module header */}
        <div className="mb-10">
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: theme.palette.accent }}
          >
            {theme.terminology.module} {mod.order}
          </span>
          <h1
            className="text-3xl font-bold mt-1 mb-3"
            style={{ color: theme.palette.text }}
          >
            {mod.title}
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ color: theme.palette.muted }}
          >
            {mod.description}
          </p>
          {user && completedCount > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <div
                className="h-1.5 flex-1 max-w-[200px] rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
                role="progressbar"
                aria-valuenow={
                  lessons.length > 0
                    ? Math.round((completedCount / lessons.length) * 100)
                    : 0
                }
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Module progress: ${completedCount} of ${lessons.length} completed`}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%`,
                    background: theme.palette.accent,
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: theme.palette.muted }}>
                {completedCount}/{lessons.length} completed
              </span>
            </div>
          )}
        </div>

        {/* Lesson list */}
        <div className="flex flex-col gap-3">
          {lessons.map((lesson) => {
            const status = progressMap.get(lesson.slug);
            return (
              <Link
                key={lesson.slug}
                href={`/themes/${slug}/${moduleSlug}/${lesson.slug}`}
                className="rounded-xl p-5 flex items-center justify-between transition-colors hover:bg-white/[0.02]"
                style={{
                  background: theme.palette.surface,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {/* Progress node */}
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={
                        status === "completed"
                          ? {
                              background: theme.palette.accent,
                              color: "#000",
                            }
                          : status === "in_progress"
                            ? {
                                background: "transparent",
                                border: `2px solid ${theme.palette.accent}`,
                                color: theme.palette.accent,
                              }
                            : {
                                background: "rgba(255,255,255,0.06)",
                                color: theme.palette.text,
                              }
                      }
                    >
                      {status === "completed" ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        lesson.order
                      )}
                    </span>
                    <h3
                      className="text-base font-medium"
                      style={{ color: theme.palette.text }}
                    >
                      {lesson.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 ml-9">
                    <span
                      className="text-xs"
                      style={{ color: theme.palette.muted }}
                    >
                      {lesson.estimatedMinutes} min
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: difficultyColors[lesson.difficulty],
                        background: `${difficultyColors[lesson.difficulty]}15`,
                      }}
                    >
                      {lesson.difficulty}
                    </span>
                    {status === "in_progress" && (
                      <span
                        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: theme.palette.accent,
                          background: `${theme.palette.accent}15`,
                        }}
                      >
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color: theme.palette.muted }}>→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
