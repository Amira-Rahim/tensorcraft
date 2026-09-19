import { resolveDueForUser } from "@/lib/review-store-server";
import { FREE_RECALL_PROMPTS } from "@/lib/free-recall-prompts";
import { notFound, redirect } from "next/navigation";
import { worlds } from "@tensorcraft/worlds";
import { LAUNCHED_WORLDS, isLaunched } from "@tensorcraft/shared";
import {
  getLesson,
  getAdjacentLessons,
  getModuleLessons,
  getModule,
  getModules,
  getLessonExercises,
  getWorldLessons,
} from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getUserProgress,
  getPassedExercises,
  hasWorldPurchase,
  isModuleCompleted,
} from "@/lib/progress";
import { LessonSteps } from "./lesson-steps";
import { NoscriptReveal } from "./noscript-reveal";
import { LessonPrefsProvider } from "@tensorcraft/ui";
import type { Metadata } from "next";
import { getLearningRoutePreference } from "@/lib/learning-route-server";
import { LearningRoutePicker } from "@/app/components/learning-route-picker";
import { ModuleEntryContext } from "@/app/components/module-entry-context";

interface Props {
  params: Promise<{ slug: string; module: string; lesson: string }>;
  searchParams?: Promise<{ start?: string }>;
}

// Enumerate valid launched-world lesson routes for dynamicParams=false.
// cookies() in the Supabase client keeps lesson rendering request-specific,
// so authentication and purchase checks still run for each page request.
export function generateStaticParams() {
  return LAUNCHED_WORLDS.flatMap((slug) =>
    getWorldLessons(slug).map((l) => ({
      slug,
      module: l.moduleId,
      lesson: l.slug,
    })),
  );
}

// Reject params outside generateStaticParams at the router level. Without
// this, unknown/coming-soon lesson URLs stream a 200 shell (via loading.tsx)
// before the page body's notFound() runs, a soft-404. Router-level
// rejection returns a real 404 status before anything is flushed.
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, module: moduleSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(slug, moduleSlug, lessonSlug);
  const world = worlds[slug];
  // notFound() here (not only in the page body) so the response carries a
  // real 404 status. The page body's notFound() fires after loading.tsx has
  // already streamed a 200 shell, which turns unknown/coming-soon lesson
  // URLs into soft-404s (bad for crawlers and uptime checks alike).
  if (!isLaunched(slug) || !lesson || !world) notFound();
  return {
    title: `${lesson.title} | ${world.displayName} | Tensorcraft`,
    description: lesson.concept.explanation,
    alternates: {
      canonical: `https://tensorcraft.app/worlds/${slug}/${moduleSlug}/${lessonSlug}`,
    },
    // Full blocks - images-only openGraph shallow-replaces the root block,
    // dropping og:url and inheriting the homepage twitter card on every
    // lesson share (R3-7).
    openGraph: {
      type: "article",
      url: `https://tensorcraft.app/worlds/${slug}/${moduleSlug}/${lessonSlug}`,
      title: `${lesson.title} | ${world.displayName} | Tensorcraft`,
      images: [
        `/api/og?title=${encodeURIComponent(lesson.title)}&world=${slug}&subtitle=${encodeURIComponent(world.displayName)}`,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${lesson.title} | ${world.displayName} | Tensorcraft`,
      images: [
        `/api/og?title=${encodeURIComponent(lesson.title)}&world=${slug}&subtitle=${encodeURIComponent(world.displayName)}`,
      ],
    },
  };
}

export default async function LessonPage({ params, searchParams }: Props) {
  const { slug, module: moduleSlug, lesson: lessonSlug } = await params;
  if (!isLaunched(slug)) notFound();
  const world = worlds[slug];
  const lesson = getLesson(slug, moduleSlug, lessonSlug);
  if (!world || !lesson) notFound();

  const { prev, next } = getAdjacentLessons(lesson);
  const moduleLessons = getModuleLessons(slug, moduleSlug);
  const exercises = getLessonExercises(lessonSlug);
  const mod = getModule(slug, moduleSlug);

  // Paywall: Module 1 is free, Module 2+ requires purchase
  // Prerequisites guide study order but do not restrict entitled learners.
  //
  // Per dev-plan §4c, the paywall uses redirect-based enforcement. Both the
  // signed-out and the authenticated-but-locked case land on
  // /pricing?locked=<worldSlug>&module=<moduleSlug>; <PaywallNotice> reads
  // those params to explain the gate and to fire `paywall_hit`.
  // Module 1 stays fully accessible to everyone, signed in or not.
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

  // Signed-out visitor on a paid lesson: show the price, not a signup form.
  // The old order (forced /auth first, /pricing only after account creation)
  // demanded commitment before disclosure; CheckoutButton handles the auth
  // roundtrip when they decide to buy (2026-07-19 UX audit).
  if (mod && mod.order > 1 && !user) {
    redirect(
      `/pricing?locked=${encodeURIComponent(slug)}&module=${encodeURIComponent(moduleSlug)}`,
    );
  }

  const purchasedPromise =
    user && mod && mod.order > 1
      ? hasWorldPurchase(user.id, slug)
      : Promise.resolve(true);
  const prevCompletedPromise =
    user && prevMod
      ? isModuleCompleted(user.id, slug, prevMod.slug, prevLessonCount)
      : Promise.resolve(true);
  const progressPromise = user
    ? getUserProgress(user.id, slug)
    : Promise.resolve([]);
  const routePromise = getLearningRoutePreference(supabase, user?.id ?? null);

  const [purchased, prevCompleted, progress, learningPreference, dueReviews] =
    await Promise.all([
      purchasedPromise,
      prevCompletedPromise,
      progressPromise,
      routePromise,
      user
        ? resolveDueForUser(supabase, user.id, slug, 2, new Date())
        : Promise.resolve([]),
    ]);

  if (mod && mod.order > 1 && !purchased) {
    redirect(
      `/pricing?locked=${encodeURIComponent(slug)}&module=${encodeURIComponent(moduleSlug)}`,
    );
  }

  const exerciseHistory = user
    ? await getPassedExercises(user.id, slug, lessonSlug)
    : { slugs: [], unavailable: false };

  const query = await searchParams;
  const entryStep =
    query?.start === "concept" ||
    (query?.start === "experiment" && lessonSlug === "tensor-shapes")
      ? 1
      : query?.start === "challenge" || learningPreference.route === "challenge"
        ? 3
        : 0;

  const completedLessonSlugs = new Set<string>();
  for (const p of progress) {
    if (p.module_id === moduleSlug && p.status === "completed") {
      completedLessonSlugs.add(p.lesson_id);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--tc-bg)" }}>
      {/* Undoes the scene-playback hiding for clients that never run JS.
          Without it the lesson body ships at opacity:0 / display:none and
          stays that way, which is cloaking-adjacent on the primary organic
          surface. Must be server-rendered: React drops noscript children on
          a client render. */}
      <NoscriptReveal />
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
              // Reading + embedded exercises, so per-lesson timeRequired sums
              // to the world page's courseWorkload (one accounting basis).
              timeRequired: `PT${lesson.estimatedMinutes + exercises.reduce((s, e) => s + e.estimatedMinutes, 0)}M`,
              isPartOf: {
                "@type": "Course",
                name: `${world.displayName}: ${world.specialization || "ML Course"}`,
                url: `https://tensorcraft.app/worlds/${slug}`,
              },
              provider: { "@type": "Organization", name: "Tensorcraft" },
              url: `https://tensorcraft.app/worlds/${slug}/${moduleSlug}/${lessonSlug}`,
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
                  name: world.displayName,
                  item: `https://tensorcraft.app/worlds/${slug}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: mod?.title || moduleSlug,
                  item: `https://tensorcraft.app/worlds/${slug}/${moduleSlug}`,
                },
                { "@type": "ListItem", position: 4, name: lesson.title },
              ],
            },
          ]),
        }}
      />
      {!user && (
        <div
          role="status"
          data-testid="guest-progress-notice"
          className="border-b border-border bg-page px-4 py-2 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted"
        >
          {/* This used to read "your progress is not saved", which was
              false and actively discouraged starting: lib/guest-progress.ts
              persists completions locally and guest-progress-bridge.tsx
              replays them into world_progress after signup. GuestModuleBanner
              already said the opposite; this notice was both wrong and the
              more prominent of the two. */}
          Reading as a guest: progress is saved in this browser.{" "}
          <a
            href={`/auth?redirectTo=${encodeURIComponent(`/worlds/${slug}/${moduleSlug}/${lessonSlug}`)}`}
            className="text-primary underline underline-offset-4"
          >
            Create a free account
          </a>{" "}
          and we&rsquo;ll carry your progress over.
        </div>
      )}
      {/* Keep the reader in the initial HTML. A streamed Suspense boundary
          needs JavaScript to reveal its content, including the no-JS fallback. */}
      {slug === "deep-orbit" && (
        <div className="mx-auto max-w-5xl px-5">
          <details className="my-4 border-b border-border pb-3 text-text">
            <summary className="cursor-pointer text-sm focus-visible:outline-2 focus-visible:outline-primary">
              Course route and prerequisites
            </summary>
            {mod && (
              <ModuleEntryContext
                moduleSlug={moduleSlug}
                previousModule={prevMod?.slug}
                previousComplete={prevCompleted}
              />
            )}
            <LearningRoutePicker
              accountId={user?.id ?? null}
              initialRoute={learningPreference.route}
              unavailable={learningPreference.unavailable}
              source="lesson"
            />
          </details>
        </div>
      )}
      <LessonPrefsProvider
        value={{
          expandDerivations: learningPreference.route === "challenge",
        }}
      >
        <LessonSteps
          entryStep={entryStep}
          passedExerciseSlugs={exerciseHistory.slugs}
          exerciseHistoryUnavailable={exerciseHistory.unavailable}
          reviewUserId={user?.id ?? null}
          dueReviews={dueReviews}
          freeRecallPrompts={user ? [] : FREE_RECALL_PROMPTS}
          lesson={lesson}
          exercises={exercises}
          worldSlug={slug}
          moduleSlug={moduleSlug}
          moduleName={mod?.title}
          moduleOrder={mod?.order}
          prevLesson={prev}
          nextLesson={next}
          lessons={moduleLessons.map((l) => ({
            slug: l.slug,
            title: l.title,
            order: l.order,
            locked: false, // This route already verified free or paid access.
            completed: completedLessonSlugs.has(l.slug),
          }))}
        />
      </LessonPrefsProvider>
    </main>
  );
}
