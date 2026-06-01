import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { LAUNCHED_THEMES, isLaunched } from "@tensorcraft/shared";
import {
  getLesson,
  getAdjacentLessons,
  getModuleLessons,
  getModule,
  getModules,
  getLessonExercises,
  getThemeLessons,
  isFoundationsModule,
} from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getUserProgress,
  hasThemePurchase,
  isModuleCompleted,
} from "@/lib/progress";
import { LessonPaywall } from "./lesson-paywall";
import { LessonSteps } from "./lesson-steps";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; module: string; lesson: string }>;
}

// Pre-render every launched-theme lesson at build time. Cold lesson loads
// previously paid a full SSR + Supabase round-trip; with static params the
// first paint is served from the edge cache. Coming-soon themes are
// intentionally excluded — their routes still 404 via `isLaunched()` below.
export function generateStaticParams() {
  return LAUNCHED_THEMES.flatMap((slug) =>
    getThemeLessons(slug).map((l) => ({
      slug,
      module: l.moduleId,
      lesson: l.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, module: moduleSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(slug, moduleSlug, lessonSlug);
  const theme = themes[slug];
  if (!lesson || !theme) return {};
  return {
    title: `${lesson.title} — ${theme.displayName} | Tensorcraft`,
    description: lesson.concept.explanation,
    alternates: {
      canonical: `https://tensorcraft.app/themes/${slug}/${moduleSlug}/${lessonSlug}`,
    },
    openGraph: {
      images: [
        `/api/og?title=${encodeURIComponent(lesson.title)}&theme=${slug}&subtitle=${encodeURIComponent(theme.displayName)}`,
      ],
    },
  };
}

export default async function LessonPage({ params }: Props) {
  const { slug, module: moduleSlug, lesson: lessonSlug } = await params;
  if (!isLaunched(slug)) notFound();
  const theme = themes[slug];
  const lesson = getLesson(slug, moduleSlug, lessonSlug);
  if (!theme || !lesson) notFound();

  const { prev, next } = getAdjacentLessons(lesson);
  const moduleLessons = getModuleLessons(slug, moduleSlug);
  const exercises = getLessonExercises(lessonSlug);
  const mod = getModule(slug, moduleSlug);

  // Paywall: Module 1 is free, Module 2+ requires purchase
  // Prerequisite: Module N+1 requires Module N completed
  //
  // Per dev-plan §4c, the paywall uses redirect-based enforcement:
  //   - Unauthenticated → /auth?redirectTo=<current-path>
  //   - Authenticated but locked → /pricing?locked=<themeSlug>
  // Module 1 stays fully accessible to all authenticated users.
  //
  // Round-12 perf fix: previously this page made three sequential blocks of
  // Supabase round-trips (getUser → purchase → prereq → getUser → progress
  // → profile). The fan-in below resolves auth once, then fans out the four
  // independent queries in a single `Promise.all` so LCP doesn't pay for
  // serial network hops.
  const allModules = getModules(slug);
  const prevMod =
    mod && mod.order > 1
      ? allModules.find((m) => m.order === mod.order - 1)
      : undefined;
  const prevLessonCount = prevMod
    ? getModuleLessons(slug, prevMod.slug).length
    : 0;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (mod && mod.order > 1 && !user) {
    const currentPath = `/themes/${slug}/${moduleSlug}/${lessonSlug}`;
    redirect(`/auth?redirectTo=${encodeURIComponent(currentPath)}`);
  }

  const purchasedPromise =
    user && mod && mod.order > 1
      ? hasThemePurchase(user.id, slug)
      : Promise.resolve(true);
  const prevCompletedPromise =
    user && prevMod
      ? isModuleCompleted(user.id, slug, prevMod.slug, prevLessonCount)
      : Promise.resolve(true);
  const progressPromise = user
    ? getUserProgress(user.id, slug)
    : Promise.resolve([]);
  const profilePromise = user
    ? supabase
        .from("profiles")
        .select("fe_framework")
        .eq("id", user.id)
        .single()
    : Promise.resolve({ data: null });

  const [purchased, prevCompleted, progress, profileResult] = await Promise.all(
    [purchasedPromise, prevCompletedPromise, progressPromise, profilePromise],
  );

  if (mod && mod.order > 1 && !purchased) {
    redirect(`/pricing?locked=${encodeURIComponent(slug)}`);
  }

  const requiresPaywall = mod && mod.order > 1 ? !purchased : false;
  const requiresPrerequisite =
    mod && mod.order > 1 && !!prevMod && !purchased ? false : !prevCompleted;
  const prevModuleSlug = prevMod?.slug ?? moduleSlug;

  const completedLessonSlugs = new Set<string>();
  for (const p of progress) {
    if (p.module_id === moduleSlug && p.status === "completed") {
      completedLessonSlugs.add(p.lesson_id);
    }
  }
  const userFramework =
    (profileResult as { data: { fe_framework?: string } | null }).data
      ?.fe_framework ?? undefined;

  // A lesson is locked if a previous lesson (by order) is not completed,
  // unless it's the very first lesson, the current lesson, or the module is free (foundations).
  const isFreeModule = mod ? isFoundationsModule(mod) : false;
  function isLessonLocked(
    lessonOrder: number,
    lessonSlugToCheck: string,
  ): boolean {
    if (isFreeModule) return false; // all lessons in free modules are accessible
    if (lessonSlugToCheck === lessonSlug) return false; // current lesson is always accessible
    if (lessonOrder === 1) return false; // first lesson is always open
    // Check that all previous lessons are completed
    for (const l of moduleLessons) {
      if (l.order >= lessonOrder) break;
      if (!completedLessonSlugs.has(l.slug)) return true;
    }
    return false;
  }

  if (requiresPaywall) {
    return (
      <main
        className="min-h-screen"
        style={{ background: "var(--tc-bg, #181818)" }}
      >
        <div className="flex-1 max-w-3xl mx-auto px-8 md:px-14 py-16 font-sans">
          <div className="mb-12">
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: theme.palette.text }}
            >
              {lesson.title}
            </h1>
          </div>
          <LessonPaywall
            themeSlug={slug}
            themeName={theme.displayName}
            accentColor={theme.palette.accent}
          />
        </div>
      </main>
    );
  }

  if (requiresPrerequisite) {
    return (
      <main
        className="min-h-screen"
        style={{ background: "var(--tc-bg, #181818)" }}
      >
        <div className="flex-1 max-w-3xl mx-auto px-8 md:px-14 py-16 font-sans">
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
              style={{ color: "var(--tc-muted, #A0A0A0)" }}
            >
              Finish all lessons in the previous module to unlock this one.
            </p>
            <Link
              href={`/themes/${slug}/${prevModuleSlug}`}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: theme.palette.accent,
                color: "var(--tc-bg, #181818)",
              }}
            >
              Go to previous module
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--tc-bg, #181818)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "LearningResource",
              name: lesson.title,
              description: lesson.concept.explanation,
              educationalLevel: lesson.difficulty || "beginner",
              learningResourceType: "lesson",
              timeRequired: `PT${lesson.estimatedMinutes}M`,
              isPartOf: {
                "@type": "Course",
                name: `${theme.displayName} — ${theme.specialization || "ML Course"}`,
                url: `https://tensorcraft.app/themes/${slug}`,
              },
              provider: { "@type": "Organization", name: "Tensorcraft" },
              url: `https://tensorcraft.app/themes/${slug}/${moduleSlug}/${lessonSlug}`,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://tensorcraft.app",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: theme.displayName,
                  item: `https://tensorcraft.app/themes/${slug}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: mod?.title || moduleSlug,
                  item: `https://tensorcraft.app/themes/${slug}/${moduleSlug}`,
                },
                { "@type": "ListItem", position: 4, name: lesson.title },
              ],
            },
          ]),
        }}
      />
      <Suspense>
        <LessonSteps
          lesson={lesson}
          exercises={exercises}
          theme={theme}
          themeSlug={slug}
          moduleSlug={moduleSlug}
          moduleName={mod?.title}
          prevLesson={prev}
          nextLesson={next}
          userFramework={
            userFramework as import("@tensorcraft/shared").Framework | undefined
          }
          lessons={moduleLessons.map((l) => ({
            slug: l.slug,
            title: l.title,
            order: l.order,
            locked: isLessonLocked(l.order, l.slug),
            completed: completedLessonSlugs.has(l.slug),
          }))}
        />
      </Suspense>
    </main>
  );
}
