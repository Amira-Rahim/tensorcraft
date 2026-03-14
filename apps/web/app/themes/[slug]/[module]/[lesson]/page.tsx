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
import { hasThemePurchase, isModuleCompleted } from "@/lib/progress";
import { LessonContent } from "./lesson-content";
import { LessonProgressTracker } from "./lesson-progress";
import { LessonPaywall } from "./lesson-paywall";
import { MobileLessonNav } from "./mobile-lesson-nav";
import { AmbientBackground } from "@/app/components/ambient-background";
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

  return (
    <main className="min-h-screen bg-surface relative overflow-hidden">
      <AmbientBackground count={180} />
      <div className="flex relative z-10">
        {/* Sidebar — lesson navigation */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen p-5 sticky top-0 overflow-y-auto bg-surface-raised border-r border-border">
          <Link
            href={`/themes/${slug}/${moduleSlug}`}
            className="text-xs mb-6 inline-flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
          >
            ← Back to module
          </Link>

          <nav className="flex flex-col gap-1">
            {moduleLessons.map((l) => {
              const isActive = l.slug === lessonSlug;
              return (
                <Link
                  key={l.slug}
                  href={`/themes/${slug}/${moduleSlug}/${l.slug}`}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-text-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <span
                    className="w-5 h-5 flex items-center justify-center text-[10px] font-medium shrink-0"
                    style={{
                      background: isActive
                        ? "var(--tc-primary)"
                        : "var(--tc-border)",
                      color: isActive ? "var(--tc-bg)" : "var(--tc-muted)",
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
          <div className="flex items-center gap-2 text-xs mb-8 text-text-muted">
            <Link href={`/themes/${slug}`} className="hover:underline">
              {theme.displayName}
            </Link>
            <span>/</span>
            <Link
              href={`/themes/${slug}/${moduleSlug}`}
              className="hover:underline"
            >
              {moduleSlug}
            </Link>
            <span>/</span>
            <span className="text-text-primary">{lesson.title}</span>
          </div>

          {/* Lesson header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="text-xs"
                style={{ color: theme.palette.primary }}
              >
                {theme.terminology.lesson} {lesson.order}
              </span>
              <span className="text-xs text-text-muted">
                {lesson.estimatedMinutes} min
              </span>
            </div>
            <h1 className="text-3xl font-bold font-mono mb-4 text-text-primary">
              {lesson.title}
            </h1>
          </div>

          {requiresPaywall ? (
            <LessonPaywall
              themeSlug={slug}
              themeName={theme.displayName}
              accentColor={theme.palette.primary}
            />
          ) : requiresPrerequisite ? (
            <div className="p-8 text-center bg-surface-raised border border-border">
              <div className="text-3xl mb-4" aria-hidden="true">
                &#x1F512;
              </div>
              <h2 className="text-lg font-semibold font-mono mb-2 text-text-primary">
                Complete the previous module first
              </h2>
              <p className="text-sm mb-6 text-text-muted">
                Finish all lessons in the previous module to unlock this one.
              </p>
              <Link
                href={`/themes/${slug}/${prevModuleSlug}`}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium font-mono bg-primary text-surface border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
              >
                Go to previous module
              </Link>
            </div>
          ) : (
            <>
              {/* 5C Loop: Context */}
              <section className="mb-8">
                <LessonContent lesson={lesson} exercises={exercises} />
              </section>

              {/* 5C Loop: Consequence */}
              <section className="p-5 my-8 bg-surface-raised border-l-[3px] border-l-primary">
                <h3 className="text-xs uppercase tracking-widest mb-2 text-primary font-mono">
                  Consequence
                </h3>
                <p className="text-sm leading-relaxed text-text-primary/80">
                  {lesson.consequence.narrative}
                </p>
                {lesson.consequence.nextLessonTeaser && (
                  <p className="text-xs mt-2 italic text-text-muted">
                    {lesson.consequence.nextLessonTeaser}
                  </p>
                )}
              </section>

              {/* Progress tracking & Mark Complete */}
              <LessonProgressTracker
                themeId={slug}
                moduleId={moduleSlug}
                lessonId={lessonSlug}
                accentColor={theme.palette.primary}
              />

              {/* Navigation */}
              <nav className="flex items-center justify-between mt-12 pt-6 border-t border-border">
                {prev ? (
                  <Link
                    href={`/themes/${slug}/${moduleSlug}/${prev.slug}`}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    ← {prev.title}
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/themes/${slug}/${moduleSlug}/${next.slug}`}
                    className="text-sm font-medium font-mono px-4 py-2 bg-primary text-surface border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
                  >
                    Next: {next.title} →
                  </Link>
                ) : (
                  <Link
                    href={`/themes/${slug}/${moduleSlug}`}
                    className="text-sm font-medium font-mono px-4 py-2 bg-primary text-surface border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
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
        }))}
        currentLessonSlug={lessonSlug}
        themeSlug={slug}
        moduleSlug={moduleSlug}
        accentColor={theme.palette.primary}
        mutedColor={theme.palette.muted}
        backHref={`/themes/${slug}/${moduleSlug}`}
      />
    </main>
  );
}
