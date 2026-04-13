import Link from "next/link";
import { notFound } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import { getModule, getModuleLessons } from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProgress } from "@/lib/progress";
import { AmbientBackground } from "@/app/components/ambient-background";
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
  beginner: "#6BAA8A",
  intermediate: "#7096B0",
  advanced: "#A89060",
};

export default async function ModuleOverviewPage({ params }: Props) {
  const { slug, module: moduleSlug } = await params;
  const theme = themes[slug];
  const mod = getModule(slug, moduleSlug);
  if (!theme || !mod) notFound();

  const lessons = getModuleLessons(slug, moduleSlug);

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
    <main className="min-h-screen px-6 py-20 bg-surface relative overflow-hidden">
      <AmbientBackground count={180} />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8 text-text-muted">
          <Link href="/themes" className="hover:underline">
            Themes
          </Link>
          <span>/</span>
          <Link href={`/themes/${slug}`} className="hover:underline">
            {theme.displayName}
          </Link>
          <span>/</span>
          <span className="text-text-primary">{mod.title}</span>
        </div>

        {/* Module header */}
        <div className="mb-10">
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: theme.palette.primary }}
          >
            {theme.terminology.module} {mod.order}
          </span>
          <h1 className="text-3xl font-bold font-mono mt-1 mb-3 text-text-primary">
            {mod.title}
          </h1>
          <p className="text-base leading-relaxed text-text-muted">
            {mod.description}
          </p>
          {user && completedCount > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <div
                className="h-1.5 flex-1 max-w-[200px] overflow-hidden bg-border"
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
                  className="h-full transition-all bg-primary"
                  style={{
                    width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-text-muted">
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
                className="p-5 flex items-center justify-between transition-colors brutalist-hover border border-border bg-surface-raised"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {/* Progress node */}
                    <span
                      className="w-6 h-6 flex items-center justify-center text-xs font-medium shrink-0"
                      style={
                        status === "completed"
                          ? {
                              background: "var(--tc-primary)",
                              color: "var(--tc-bg)",
                            }
                          : status === "in_progress"
                            ? {
                                background: "transparent",
                                border: "2px solid var(--tc-primary)",
                                color: "var(--tc-primary)",
                              }
                            : {
                                background: "var(--tc-border)",
                                color: "var(--tc-text)",
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
                    <h3 className="text-base font-medium font-mono text-text-primary">
                      {lesson.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 ml-9">
                    <span className="text-xs text-text-muted">
                      {lesson.estimatedMinutes} min
                    </span>
                    <span
                      className="text-xs uppercase tracking-wider px-1.5 py-0.5"
                      style={{
                        color: difficultyColors[lesson.difficulty],
                        background: `${difficultyColors[lesson.difficulty]}15`,
                      }}
                    >
                      {lesson.difficulty}
                    </span>
                    {status === "in_progress" && (
                      <span className="text-xs uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-text-muted">→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
