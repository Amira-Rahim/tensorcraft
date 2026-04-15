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
  beginner: "var(--tc-tier-identity)",
  intermediate: "var(--tc-tier-structural)",
  advanced: "var(--tc-tier-intuition)",
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

  // Compute stats for banner
  const totalMinutes = lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0);
  const completedMinutes = lessons
    .filter((l) => progressMap.get(l.slug) === "completed")
    .reduce((sum, l) => sum + l.estimatedMinutes, 0);
  const remainingMinutes = totalMinutes - completedMinutes;

  const difficulties = lessons.map((l) => l.difficulty);
  const difficultyOrder = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  } as const;
  const minDiff = difficulties.reduce((a, b) =>
    difficultyOrder[a] <= difficultyOrder[b] ? a : b,
  );
  const maxDiff = difficulties.reduce((a, b) =>
    difficultyOrder[a] >= difficultyOrder[b] ? a : b,
  );
  const difficultyRange =
    minDiff === maxDiff
      ? minDiff.charAt(0).toUpperCase() + minDiff.slice(1)
      : `${minDiff.charAt(0).toUpperCase() + minDiff.slice(1)} → ${maxDiff.charAt(0).toUpperCase() + maxDiff.slice(1)}`;

  return (
    <main className="min-h-screen px-6 py-20 bg-page relative overflow-hidden">
      <AmbientBackground count={180} />
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm pt-5 text-text-muted font-mono">
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

        {/* Narrative Banner */}
        <div className="relative mt-4 pt-8 pb-6 border-b border-border-active">
          {/* Gradient wash */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 4%, transparent) 0%, transparent 60%)",
            }}
          />
          {/* Bottom glow */}
          <div
            className="absolute -bottom-[6px] left-0 right-0 h-[6px] pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--tc-primary) 8%, transparent), transparent)",
            }}
          />
          <div className="relative">
            <div className="font-mono text-[11px] text-primary uppercase tracking-[0.12em] mb-2">
              // {theme.terminology.module} {String(mod.order).padStart(2, "0")}{" "}
              · {lessons.length} {theme.terminology.lesson}s
            </div>
            <h1 className="font-mono text-[28px] font-bold text-text-primary leading-tight mb-3">
              {mod.title}
            </h1>
            <p
              className="text-[13px] text-text-muted italic leading-relaxed max-w-[680px] pl-3.5 mb-5"
              style={{
                borderLeft:
                  "2px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)",
              }}
            >
              &ldquo;{mod.description}&rdquo;
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 border-t border-border font-mono">
              <div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider">
                  {theme.terminology.lesson}s
                </div>
                <div className="text-[15px] text-text-primary">
                  {completedCount}{" "}
                  <span className="text-text-muted">
                    / {lessons.length} complete
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider">
                  Time Left
                </div>
                <div className="text-[15px] text-text-primary">
                  ~{remainingMinutes} min
                </div>
              </div>
              <div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider">
                  Difficulty
                </div>
                <div className="text-[15px] text-text-primary">
                  {difficultyRange}
                </div>
              </div>
              <div
                className="ml-auto h-[3px] w-[140px] max-md:ml-0 max-md:w-full max-md:mt-2 bg-border"
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
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dossier List */}
        <div className="flex flex-col gap-3 mt-8">
          {lessons.map((lesson) => {
            const status = progressMap.get(lesson.slug);
            const isComplete = status === "completed";
            const isActive = status === "in_progress";
            const isUpcoming = !isComplete && !isActive;

            const locationLabel = lesson.scene?.location
              ? `${lesson.scene.location} · ${lesson.estimatedMinutes} min`
              : `${theme.terminology.lesson} ${String(lesson.order).padStart(2, "0")} · ${lesson.estimatedMinutes} min`;

            return (
              <Link
                key={lesson.slug}
                href={`/themes/${slug}/${moduleSlug}/${lesson.slug}`}
                className={`flex text-left transition-all ${
                  isUpcoming
                    ? "opacity-45 hover:opacity-65 bg-page border border-border/60"
                    : "brutalist-hover bg-surface"
                } ${
                  isComplete
                    ? "border border-border-active"
                    : isActive
                      ? "border border-border-active shadow-[0_0_20px_color-mix(in_srgb,var(--tc-primary)_5%,transparent)]"
                      : ""
                }`}
              >
                {/* Side panel */}
                <div
                  className={`w-16 max-md:w-12 shrink-0 flex flex-col items-center justify-center gap-1.5 py-4 border-r ${
                    isComplete
                      ? "bg-primary-muted border-r-border-subtle"
                      : isActive
                        ? "border-r-border-subtle"
                        : "bg-page border-r-border/60"
                  }`}
                  style={
                    isActive
                      ? {
                          background:
                            "color-mix(in srgb, var(--tc-primary) 10%, transparent)",
                        }
                      : undefined
                  }
                >
                  <span
                    className={`font-mono text-[20px] max-md:text-[16px] font-bold ${
                      isComplete || isActive
                        ? "text-primary"
                        : "text-text-muted"
                    }`}
                  >
                    {String(lesson.order).padStart(2, "0")}
                  </span>
                  <span
                    className="w-3.5 h-3.5 flex items-center justify-center"
                    style={
                      isComplete
                        ? {
                            background: "var(--tc-primary)",
                          }
                        : isActive
                          ? {
                              background: "transparent",
                              border: "2px solid var(--tc-primary)",
                            }
                          : {
                              background: "var(--tc-border)",
                            }
                    }
                  >
                    {isComplete && (
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--tc-bg)"
                        strokeWidth="4"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 px-6 py-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div
                        className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                          isActive ? "text-primary" : "text-text-muted"
                        }`}
                      >
                        {locationLabel}
                      </div>
                      <h3 className="font-mono text-[16px] font-bold text-text-primary mt-1 truncate">
                        {lesson.title}
                      </h3>
                    </div>
                    {isComplete && (
                      <span className="shrink-0 font-mono text-[9px] bg-primary text-page px-2.5 py-[3px] uppercase tracking-wider">
                        ✓ Complete
                      </span>
                    )}
                    {isActive && (
                      <span className="shrink-0 font-mono text-[9px] border border-primary text-primary px-2.5 py-[3px] uppercase tracking-wider">
                        ▶ Continue
                      </span>
                    )}
                  </div>

                  {/* Narrative excerpt — only on complete + active */}
                  {!isUpcoming && lesson.context?.narrative && (
                    <p className="text-[12px] text-text-muted italic leading-relaxed mt-2 line-clamp-2 max-md:hidden">
                      &ldquo;
                      {lesson.context.narrative.slice(0, 150)}
                      {lesson.context.narrative.length > 150 ? "..." : ""}
                      &rdquo;
                    </p>
                  )}

                  {/* Meta row — only on complete + active */}
                  {!isUpcoming && (
                    <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                      {lesson.concept?.bridge && (
                        <span className="font-mono text-[10px] text-primary bg-primary-muted px-2 py-0.5">
                          {lesson.concept.bridge.feTitle} →{" "}
                          {lesson.concept.bridge.mlTitle}
                        </span>
                      )}
                      <span
                        className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5"
                        style={{
                          color: difficultyColors[lesson.difficulty],
                          background: `color-mix(in srgb, ${difficultyColors[lesson.difficulty]} 8%, transparent)`,
                        }}
                      >
                        {lesson.difficulty}
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="shrink-0 flex items-center px-4 font-mono text-base text-text-muted">
                  →
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
