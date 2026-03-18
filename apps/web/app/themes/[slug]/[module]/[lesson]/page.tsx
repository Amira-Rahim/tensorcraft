import { notFound } from "next/navigation";
import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import {
  getLesson,
  getAdjacentLessons,
  getModuleLessons,
  getModule,
  getModules,
  getLessonExercises,
} from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getUserProgress,
  hasThemePurchase,
  isModuleCompleted,
} from "@/lib/progress";
import { LessonContent } from "./lesson-content";
import { LessonProgressTracker } from "./lesson-progress";
import { LessonPaywall } from "./lesson-paywall";
import { MobileLessonNav } from "./mobile-lesson-nav";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; module: string; lesson: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, module: moduleSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(slug, moduleSlug, lessonSlug);
  const theme = themes[slug];
  if (!lesson || !theme) return {};
  return {
    title: `${lesson.title} — ${theme.displayName} | Tensorcraft`,
    description: lesson.concept.explanation,
    openGraph: {
      images: [
        `/api/og?title=${encodeURIComponent(lesson.title)}&theme=${slug}&subtitle=${encodeURIComponent(theme.displayName)}`,
      ],
    },
  };
}

export default async function LessonPage({ params }: Props) {
  const { slug, module: moduleSlug, lesson: lessonSlug } = await params;
  const theme = themes[slug];
  const lesson = getLesson(slug, moduleSlug, lessonSlug);
  if (!theme || !lesson) notFound();

  const { prev, next } = getAdjacentLessons(lesson);
  const moduleLessons = getModuleLessons(slug, moduleSlug);
  const exercises = getLessonExercises(lessonSlug);
  const mod = getModule(slug, moduleSlug);

  // Paywall: Module 1 is free, Module 2+ requires purchase
  // Prerequisite: Module N+1 requires Module N completed
  let requiresPaywall = false;
  let requiresPrerequisite = false;
  let prevModuleSlug = moduleSlug;
  if (mod && mod.order > 1) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      requiresPaywall = true;
    } else {
      const purchased = await hasThemePurchase(user.id, slug);
      requiresPaywall = !purchased;

      // Check prerequisite: previous module must be completed
      if (!requiresPaywall) {
        const allModules = getModules(slug);
        const prevMod = allModules.find((m) => m.order === mod.order - 1);
        if (prevMod) {
          prevModuleSlug = prevMod.slug;
          const prevLessons = getModuleLessons(slug, prevMod.slug);
          const prevCompleted = await isModuleCompleted(
            user.id,
            slug,
            prevMod.slug,
            prevLessons.length,
          );
          requiresPrerequisite = !prevCompleted;
        }
      }
    }
  }

  // Compute which lessons are completed to enforce sequential locking
  const completedLessonSlugs = new Set<string>();
  {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const progress = await getUserProgress(user.id, slug);
      for (const p of progress) {
        if (p.module_id === moduleSlug && p.status === "completed") {
          completedLessonSlugs.add(p.lesson_id);
        }
      }
    }
  }

  // A lesson is locked if a previous lesson (by order) is not completed,
  // unless it's the very first lesson or the current lesson.
  function isLessonLocked(
    lessonOrder: number,
    lessonSlugToCheck: string,
  ): boolean {
    if (lessonSlugToCheck === lessonSlug) return false; // current lesson is always accessible
    if (lessonOrder === 1) return false; // first lesson is always open
    // Check that all previous lessons are completed
    for (const l of moduleLessons) {
      if (l.order >= lessonOrder) break;
      if (!completedLessonSlugs.has(l.slug)) return true;
    }
    return false;
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--tc-bg, #1C1C1C)" }}
    >
      <div className="flex">
        {/* Sidebar — lesson navigation */}
        <aside
          className="hidden lg:flex flex-col w-64 min-h-screen p-5 sticky top-0 overflow-y-auto"
          style={{
            background: theme.palette.surface,
            borderRight: "1px solid var(--tc-border, rgba(255,255,255,0.06))",
          }}
        >
          <Link
            href={`/themes/${slug}/${moduleSlug}`}
            className="text-xs mb-6 inline-flex items-center gap-1"
            style={{ color: "var(--tc-muted, #8A8A8A)" }}
          >
            ← Back to module
          </Link>

          <nav className="flex flex-col gap-1">
            {moduleLessons.map((l) => {
              const isActive = l.slug === lessonSlug;
              const locked = isLessonLocked(l.order, l.slug);
              if (locked) {
                return (
                  <div
                    key={l.slug}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-not-allowed opacity-40"
                  >
                    <span
                      className="w-5 h-5 flex items-center justify-center text-[10px] font-medium shrink-0"
                      style={{
                        background: "var(--tc-border, rgba(255,255,255,0.06))",
                        color: theme.palette.muted,
                      }}
                    >
                      &#x1F512;
                    </span>
                    <span
                      className="truncate"
                      style={{ color: theme.palette.muted }}
                    >
                      {l.title}
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={l.slug}
                  href={`/themes/${slug}/${moduleSlug}/${l.slug}`}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                  style={{
                    background: isActive
                      ? "var(--tc-border, rgba(255,255,255,0.06))"
                      : "transparent",
                    color: isActive ? theme.palette.text : theme.palette.muted,
                  }}
                >
                  <span
                    className="w-5 h-5 flex items-center justify-center text-[10px] font-medium shrink-0"
                    style={{
                      background: isActive
                        ? theme.palette.accent
                        : "var(--tc-border, rgba(255,255,255,0.06))",
                      color: isActive
                        ? "var(--tc-bg, #1C1C1C)"
                        : theme.palette.muted,
                    }}
                  >
                    {l.order}
                  </span>
                  <span className="truncate">{l.title}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 max-w-3xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-2 text-xs mb-8"
            style={{ color: "var(--tc-muted, #8A8A8A)" }}
          >
            <Link href={`/themes/${slug}`} className="hover:underline">
              {theme.displayName}
            </Link>
            <span>/</span>
            <Link
              href={`/themes/${slug}/${moduleSlug}`}
              className="hover:underline"
            >
              {mod?.title ?? moduleSlug}
            </Link>
            <span>/</span>
            <span style={{ color: theme.palette.text }}>{lesson.title}</span>
          </div>

          {/* Lesson header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs" style={{ color: theme.palette.accent }}>
                {theme.terminology.lesson} {lesson.order}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--tc-muted, #8A8A8A)" }}
              >
                {lesson.estimatedMinutes} min
              </span>
            </div>
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: theme.palette.text }}
            >
              {lesson.title}
            </h1>
          </div>

          {requiresPaywall ? (
            <LessonPaywall
              themeSlug={slug}
              themeName={theme.displayName}
              accentColor={theme.palette.accent}
            />
          ) : requiresPrerequisite ? (
            <div
              className="p-8 text-center"
              style={{
                background: theme.palette.surface,
                border: "1px solid var(--tc-border, rgba(255,255,255,0.06))",
              }}
            >
              <div className="text-3xl mb-4" aria-hidden="true">
                &#x1F512;
              </div>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: theme.palette.text }}
              >
                Complete the previous module first
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: "var(--tc-muted, #8A8A8A)" }}
              >
                Finish all lessons in the previous module to unlock this one.
              </p>
              <Link
                href={`/themes/${slug}/${prevModuleSlug}`}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  background: theme.palette.accent,
                  color: "var(--tc-bg, #1C1C1C)",
                }}
              >
                Go to previous module
              </Link>
            </div>
          ) : (
            <>
              {/* 5C Loop: Context */}
              <section className="mb-8">
                <h3
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ color: theme.palette.accent }}
                >
                  Context
                </h3>
                <LessonContent
                  lesson={lesson}
                  exercises={exercises}
                  themeId={slug}
                  lessonId={lessonSlug}
                />
              </section>

              {/* 5C Loop: Consequence */}
              <section
                className="p-5 my-8"
                style={{
                  background: theme.palette.surface,
                  borderLeft: `3px solid ${theme.palette.accent}`,
                }}
              >
                <h3
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ color: theme.palette.accent }}
                >
                  Consequence
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                >
                  {lesson.consequence.narrative}
                </p>
                {lesson.consequence.nextLessonTeaser && (
                  <p
                    className="text-xs mt-2 italic"
                    style={{ color: "var(--tc-muted, #8A8A8A)" }}
                  >
                    {lesson.consequence.nextLessonTeaser}
                  </p>
                )}
              </section>

              {/* Progress tracking & Mark Complete */}
              <LessonProgressTracker
                themeId={slug}
                moduleId={moduleSlug}
                lessonId={lessonSlug}
                accentColor={theme.palette.accent}
                exerciseCount={exercises.length}
              />

              {/* Navigation */}
              <nav
                className="flex items-center justify-between mt-12 pt-6"
                style={{
                  borderTop:
                    "1px solid var(--tc-border, rgba(255,255,255,0.06))",
                }}
              >
                {prev ? (
                  <Link
                    href={`/themes/${slug}/${moduleSlug}/${prev.slug}`}
                    className="text-sm"
                    style={{ color: "var(--tc-muted, #8A8A8A)" }}
                  >
                    ← {prev.title}
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/themes/${slug}/${moduleSlug}/${next.slug}`}
                    className="text-sm font-medium px-4 py-2"
                    style={{
                      background: theme.palette.accent,
                      color: "var(--tc-bg, #1C1C1C)",
                    }}
                  >
                    Next: {next.title} →
                  </Link>
                ) : (
                  <Link
                    href={`/themes/${slug}/${moduleSlug}`}
                    className="text-sm font-medium px-4 py-2"
                    style={{
                      background: theme.palette.accent,
                      color: "var(--tc-bg, #1C1C1C)",
                    }}
                  >
                    Module Complete ✓
                  </Link>
                )}
              </nav>
            </>
          )}
        </div>
      </div>

      {/* Mobile lesson navigation drawer */}
      <MobileLessonNav
        lessons={moduleLessons.map((l) => ({
          slug: l.slug,
          title: l.title,
          order: l.order,
          locked: isLessonLocked(l.order, l.slug),
        }))}
        currentLessonSlug={lessonSlug}
        themeSlug={slug}
        moduleSlug={moduleSlug}
        accentColor={theme.palette.accent}
        mutedColor={theme.palette.muted}
        backHref={`/themes/${slug}/${moduleSlug}`}
      />
    </main>
  );
}
