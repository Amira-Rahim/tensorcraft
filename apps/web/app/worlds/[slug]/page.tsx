import { getLearningRoutePreference } from "@/lib/learning-route-server";
import { LearningRoutePicker } from "@/app/components/learning-route-picker";
import { CourseProjectPreview } from "@/app/components/course-project-preview";
import Link from "next/link";
import { notFound } from "next/navigation";
import { worlds } from "@tensorcraft/worlds";
import { PRICING, isLaunched, isComingSoon } from "@tensorcraft/shared";
import {
  getModules,
  getModuleLessons,
  getLessonTotalMinutes,
} from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasWorldPurchase, getUserProgress } from "@/lib/progress";
import { heroPlateSrc } from "@/lib/location-art";
import { patchSrc, sealSrc } from "@/lib/patch-art";
import { WorldSceneBackdrop } from "./world-scene-backdrop";
import { WorldCast } from "./world-cast";
import { WorldTrailerPanel } from "./world-trailer-panel";
import { buildWorldVideoJsonLd } from "./world-video-jsonld";
import { worldTrailer } from "@/lib/world-trailer";
import { ModuleMapClient } from "./module-map-client";
import { ModulePatch } from "@tensorcraft/ui/module-patch";
import { GuestModuleBanner } from "./guest-module-banner";
import { ComingSoonStub } from "./coming-soon-stub";
import { buildCourseJsonLd } from "./course-jsonld";
import { resolveContinueCta } from "./continue-cta";
import { resolveWorldStats } from "./world-stats";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const world = worlds[slug];
  if (!world) return {};
  const title = isComingSoon(slug)
    ? `${world.displayName}: Coming Soon, Tensorcraft`
    : `${world.displayName}: Machine Learning in JavaScript, Tensorcraft`;
  return {
    title,
    // Search snippets reach strangers with no framing, so they state what
    // the course is rather than opening on the story (owner bar 2026-08-16;
    // ruled 2026-08-20: the coming-soon PAGES keep their story copy, their
    // metadata does not).
    description: isComingSoon(slug)
      ? `${world.displayName} is a planned machine learning course in JavaScript: ${world.specialization.toLowerCase()}, taught in the browser with TensorFlow.js. Not released yet. Join the waitlist.`
      : `${world.displayName} is a story-driven machine learning course in JavaScript: ${world.specialization.toLowerCase()}, taught in the browser with TensorFlow.js. Module 1 is free.`,
    alternates: { canonical: `https://tensorcraft.app/worlds/${slug}` },
    // Full openGraph + twitter blocks: an images-only openGraph REPLACES the
    // root block (shallow merge), dropping og:url/type and inheriting the
    // homepage twitter card on the highest-share route in the product (R3-7).
    openGraph: {
      type: "website",
      url: `https://tensorcraft.app/worlds/${slug}`,
      title,
      images: [
        `/api/og?title=${encodeURIComponent(world.displayName)}&world=${slug}&subtitle=${encodeURIComponent(world.specialization)}`,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [
        `/api/og?title=${encodeURIComponent(world.displayName)}&world=${slug}&subtitle=${encodeURIComponent(world.specialization)}`,
      ],
    },
  };
}

export default async function WorldDetailPage({ params }: Props) {
  const { slug } = await params;
  const world = worlds[slug];
  if (!world) notFound();

  // Coming-soon worlds render a stub with waitlist capture instead of the
  // module map. Velite excludes their content from the build, so getModules
  // would return [] anyway, the explicit branch keeps the UX intentional.
  if (isComingSoon(slug)) {
    return <ComingSoonStub world={world} />;
  }

  if (!isLaunched(slug)) notFound();

  const worldModules = getModules(slug);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasPurchased = user ? await hasWorldPurchase(user.id, slug) : false;

  // Fetch progress
  const [progress, learningPreference] = await Promise.all([
    user ? getUserProgress(user.id, slug) : Promise.resolve([]),
    getLearningRoutePreference(supabase, user?.id ?? null),
  ]);
  const progressByLesson = new Map(
    progress.map((p) => [
      p.lesson_id,
      { status: p.status as string, score: p.score as number | null },
    ]),
  );

  // Compute per-module data
  type ModuleStatus = "completed" | "active" | "available" | "locked";

  const completedByModule = new Map<string, number>();
  const scoresByModule = new Map<string, number[]>();
  for (const p of progress) {
    if (p.status === "completed") {
      completedByModule.set(
        p.module_id,
        (completedByModule.get(p.module_id) ?? 0) + 1,
      );
      if (p.score != null) {
        const scores = scoresByModule.get(p.module_id) ?? [];
        scores.push(p.score as number);
        scoresByModule.set(p.module_id, scores);
      }
    }
  }

  const startedByModule = new Map<string, number>();
  for (const p of progress) {
    startedByModule.set(
      p.module_id,
      (startedByModule.get(p.module_id) ?? 0) + 1,
    );
  }

  // Module statuses: sequential unlock (owner ruling 2026-09-20, restoring
  // the pre-September order). The first incomplete module is the open one;
  // every module after it is locked until it is done. Free == module 1,
  // matching the paywall gate in worlds/[slug]/[module]/[lesson]/page.tsx.
  let foundFirstIncomplete = false;
  const moduleMapItems = worldModules.map((mod) => {
    const modLessons = getModuleLessons(slug, mod.slug);
    const totalLessons = modLessons.length;
    const completedCount = completedByModule.get(mod.slug) ?? 0;
    const hasStarted = (startedByModule.get(mod.slug) ?? 0) > 0;
    const isFree = mod.order === 1;

    let status: ModuleStatus;
    if (completedCount >= totalLessons && totalLessons > 0) {
      status = "completed";
    } else if (!foundFirstIncomplete) {
      foundFirstIncomplete = true;
      if (!user) {
        status = isFree ? "available" : "locked";
      } else if (!hasPurchased && !isFree) {
        status = "locked";
      } else {
        status = hasStarted ? "active" : "available";
      }
    } else {
      status = "locked";
    }

    // Compute average score for completed modules
    const modScores = scoresByModule.get(mod.slug) ?? [];
    const avgScore =
      modScores.length > 0
        ? Math.round(
            (modScores.reduce((a, b) => a + b, 0) / modScores.length) * 10,
          ) / 10
        : null;

    // Lesson statuses follow the same order inside a module.
    let foundFirstIncompleteLessonInModule = false;
    const lessonItems = modLessons.map((lesson) => {
      const lessonProgress = progressByLesson.get(lesson.slug);
      const progressStatus = lessonProgress?.status;

      let lessonStatus: "completed" | "in_progress" | "available" | "locked";
      if (progressStatus === "completed") {
        lessonStatus = "completed";
      } else if (progressStatus === "in_progress") {
        lessonStatus = "in_progress";
        foundFirstIncompleteLessonInModule = true;
      } else if (isFree) {
        lessonStatus = "available";
      } else if (
        !foundFirstIncompleteLessonInModule &&
        (status === "active" || status === "available")
      ) {
        foundFirstIncompleteLessonInModule = true;
        lessonStatus = "available";
      } else {
        lessonStatus = "locked";
      }

      return {
        slug: lesson.slug,
        title: lesson.title,
        moduleSlug: mod.slug,
        order: lesson.order,
        // Reading + embedded exercises: same basis as courseWorkload below.
        estimatedMinutes: getLessonTotalMinutes(lesson),
        difficulty: lesson.difficulty,
        status: lessonStatus,
        // scene location, narrative and bridge titles are deliberately NOT
        // sent: the map is a pre-lesson surface, so story text must not
        // render or ship in its payload (pre-lesson copy audit 2026-08-19).
      };
    });

    return {
      slug: mod.slug,
      title: mod.title,
      order: mod.order,
      // `summary`, not `description`: the map is a pre-lesson surface, so it
      // gets the plain-language line (pre-lesson copy audit 2026-08-19).
      description: mod.summary,
      status,
      completedLessons: completedCount,
      totalLessons,
      avgScore,
      lessons: lessonItems,
      patchSrc: patchSrc(slug, mod.slug),
    };
  });

  // Header stats: course facts until any lesson progress exists, progress
  // figures after (see world-stats.ts for the reasoning).
  const completedModuleCount = moduleMapItems.filter(
    (m) => m.status === "completed",
  ).length;
  const activeModuleIndex = moduleMapItems.findIndex(
    (m) => m.status === "active" || m.status === "available",
  );
  const allScores = progress
    .filter((p) => p.status === "completed" && p.score != null)
    .map((p) => p.score as number);
  const avgScore =
    allScores.length > 0
      ? Math.round(
          (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10,
        ) / 10
      : null;
  // Reading + embedded exercises for every lesson in the world: the header
  // stat and the Course JSON-LD's courseWorkload share this one sum.
  const totalMinutes = moduleMapItems.reduce(
    (n, m) => n + m.lessons.reduce((s, l) => s + l.estimatedMinutes, 0),
    0,
  );
  const worldStats = resolveWorldStats({
    hasProgress: progress.length > 0,
    moduleCount: moduleMapItems.length,
    lessonCount: moduleMapItems.reduce((n, m) => n + m.totalLessons, 0),
    totalMinutes,
    completedModuleCount,
    currentModuleOrder:
      activeModuleIndex >= 0 ? moduleMapItems[activeModuleIndex]!.order : null,
    avgScore,
  });

  // Check capstone eligibility
  const isWorldComplete = moduleMapItems.every((m) => m.status === "completed");

  // Continue CTA. Extracted to continue-cta.ts on 2026-08-23 so it could be
  // tested: a guest who finished the free module was shown "Continue M1"
  // pointing back into the module they had just completed. See that file for
  // the mechanism.
  const { href: continueHref, label: continueLabel } = resolveContinueCta({
    worldSlug: slug,
    modules: moduleMapItems,
    hasPurchased,
    learningRoute: learningPreference.route,
  });

  const courseJsonLd = buildCourseJsonLd(world, { totalMinutes });

  // Trailer band: prospects only, and the server decides, so nothing swaps
  // client-side and purchasers keep today's page byte-for-byte (marketing
  // ends at purchase; the film stays reachable on /learn). A prospect who
  // already has progress gets the band demoted below the map so their
  // Continue CTA stays first. Resolves to undefined until the film's
  // assets ship to public/media/, leaving this page exactly as it is now.
  const trailer = !hasPurchased ? worldTrailer(slug) : undefined;
  const trailerAboveMap = progress.length === 0;
  const firstModule = moduleMapItems[0];
  const firstLesson = firstModule?.lessons[0];
  const trailerPanel =
    trailer && firstModule && firstLesson ? (
      <WorldTrailerPanel
        worldId={slug}
        worldName={world.displayName}
        poster={trailer.poster}
        src={trailer.full}
        durationLabel={trailer.durationLabel}
        freeLessonHref={`/worlds/${slug}/${firstModule.slug}/${firstLesson.slug}`}
      />
    ) : null;

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--tc-bg)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      {/* VideoObject only while the band renders: schema mirrors visible
          content, same rule as every other block. */}
      {trailer && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildWorldVideoJsonLd(world, trailer)),
          }}
        />
      )}
      {/* The world's signature scene (Deep Orbit's orbital system for the
          live world) behind the module map - same renderer as the homepage
          and /worlds cards, viewport-capped with a bottom fade. Worlds with
          shipped art also get their location master plate under the canvas;
          the four unlaunched worlds resolve to undefined and render exactly
          as before. */}
      <WorldSceneBackdrop
        slug={world.slug}
        primary={world.palette.primary}
        primaryLight={world.paletteLight.primary}
        plateSrc={heroPlateSrc(world.slug)}
      />

      {/* Page header */}
      {/* tc-on-art when a plate is behind it: the veil below is --tc-bg at
          70%, which over dark art is an invisible darkening in dark scheme
          but a white wash in light, bleaching the plate and stopping dead at
          this border. Opting the header back onto the dark palette keeps the
          veil dark and the type legible in both schemes. */}
      {/* The space after `pb-9` belongs OUTSIDE the interpolation, not
          inside the ternary. Tailwind v4 builds utilities by scanning source
          text, and a class written `pb-9${...}` is read as the candidate
          `pb-9$` and dropped, so no `.pb-9` rule is emitted. The class still
          lands in the DOM and still looks right in the element panel, but
          computed padding-bottom is 0. This header rendered with no bottom
          padding that way, which is what pushed the stat labels onto the
          border (found 2026-09-15). `pb-9` appears nowhere else in the repo,
          so nothing else generated the rule for it. */}
      <header
        className={`relative z-10 px-12 pt-10 pb-9 ${
          heroPlateSrc(world.slug) ? "tc-on-art" : ""
        }`}
        style={{
          borderBottom: "1px solid var(--tc-border)",
          background: "color-mix(in srgb, var(--tc-bg) 70%, transparent)",
        }}
      >
        {/* The world name is the title (owner call, 2026-08-31; it replaced
            a generic "MODULE MAP" h1). The old world-name eyebrow went with
            it: the same words directly above the h1 read as a stutter. The
            module count survives in the subline and the stats strip. */}
        {/* Fluid one-liner (owner: bigger, 2026-09-01; same family as the
            landing//learn//pricing//worlds-index walls). Sized so the
            longest world name (13 mono chars at 0.58em per char) still
            fits one line inside the px-12 gutters at every width; shorter
            names simply spread less. */}
        <h1
          className="font-mono text-[clamp(2.5rem,calc(9vw-0.5rem),8rem)] leading-[1.02] font-bold uppercase mb-3"
          style={{ color: "var(--tc-text)", letterSpacing: "-0.02em" }}
        >
          {world.displayName}
        </h1>
        <p
          className="text-base md:text-xl"
          style={{ color: "var(--tc-muted)" }}
        >
          Learn machine learning through JavaScript and TensorFlow.js. Build,
          evaluate, and run a signal classifier as you follow the crew&apos;s
          investigation.
        </p>

        <div className="flex gap-8 md:gap-12 mt-6">
          {worldStats.map(({ value, label }) => (
            <div key={label}>
              <div
                className="font-mono text-xl md:text-3xl font-bold"
                style={{ color: "var(--tc-primary)" }}
              >
                {value}
              </div>
              {/* mt-2, not the old mt-0.5: at 2px the label sat inside the
                  number's descender space and read as one unit with it
                  (owner, 2026-09-15). 8px separates the pair without
                  breaking the column. */}
              <div
                className="font-mono text-xs md:text-sm mt-2"
                style={{ color: "var(--tc-muted)" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* The crew, directly under the header: who you'll be working with,
          before the module list says what you'll do. Only when the page has
          no film: the trailer poster IS the crew, so running both stacks
          the same faces twice (owner call, 2026-08-29). Purchasers never
          get the band, so they keep this strip. Self-hides for a world
          with no characters. */}
      {!trailerPanel && <WorldCast slug={world.slug} />}
      {/* The trailer for prospects with no progress. The header above is a
          tc-on-art surface whose dark veil only stays legible in the light
          scheme while it overlaps the viewport-capped backdrop plate;
          nothing may mount above the header for that reason (found by axe
          [light], 2026-08-29). The band itself and the module map are
          scheme-native, so their own position on or off the plate is
          free. */}
      {trailerAboveMap && trailerPanel && (
        <div className="relative z-10 max-w-6xl mx-auto px-8 pt-10">
          {trailerPanel}
        </div>
      )}

      {/* Capstone banner */}
      {isWorldComplete && (
        <div className="max-w-6xl mx-auto px-8 relative z-10 mt-6">
          <Link
            href={`/worlds/${slug}/capstone`}
            className="flex items-center justify-between p-5 border-2 brutalist-hover"
            style={{
              borderColor: "var(--tc-primary)",
              background: "var(--tc-surface)",
            }}
          >
            <div>
              <span
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: "var(--tc-primary)" }}
              >
                {world.terminology.lesson} Complete
              </span>
              <p
                className="text-sm font-mono font-semibold mt-1"
                style={{ color: "var(--tc-text)" }}
              >
                All modules completed. View your capstone
              </p>
            </div>
            {(() => {
              const glyph = (
                <span style={{ color: "var(--tc-primary)", fontSize: 24 }}>
                  &#x25CE;
                </span>
              );
              const seal = sealSrc(slug);
              // The world seal marks completion (docs/patch-bible.md); the
              // ◎ glyph returns if the art is missing or fails.
              return seal ? (
                <ModulePatch src={seal} size={40} fallback={glyph} />
              ) : (
                glyph
              );
            })()}
          </Link>
        </div>
      )}

      {/* Module List */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 pt-10 pb-20">
        {!hasPurchased && (
          <section
            aria-labelledby="course-syllabus-title"
            className="mb-8 max-w-3xl space-y-4 leading-relaxed text-text"
          >
            <h2
              id="course-syllabus-title"
              className="font-mono text-2xl font-bold"
            >
              Course syllabus
            </h2>
            <p>
              Start with JavaScript functions, arrays, objects, modules and
              async code. The course covers ML foundations through intermediate
              and advanced topics.
            </p>
            <p>
              Training and evaluation use TensorFlow.js. Runtime lessons also
              introduce ONNX Runtime Web, Transformers.js and WebGPU. Some
              exercises use controlled simulations, with separate downloadable
              labs for real runtimes.
            </p>
            <p>
              Browse all{" "}
              {moduleMapItems.reduce((n, mod) => n + mod.totalLessons, 0)}{" "}
              lesson titles across {worldModules.length} modules below. Allow
              about {Math.round(totalMinutes / 60)} hours for lessons and
              exercises. The independent project has a separate estimate of 4–8
              hours. These are our estimates.
            </p>
            <p>
              The first module is free. The full course costs $
              {PRICING.single.price}
              {PRICING.single.price < PRICING.single.regularPrice
                ? ` at the introductory price. The regular price is $${PRICING.single.regularPrice}.`
                : "."}{" "}
              One payment gives lifetime access to Deep Orbit. See{" "}
              <Link
                href="/pricing"
                className="min-h-11 inline-flex items-center text-primary underline underline-offset-4"
              >
                pricing and access terms
              </Link>
              .
            </p>
          </section>
        )}
        {!user && moduleMapItems[0] && (
          <GuestModuleBanner
            worldSlug={slug}
            freeModuleSlug={moduleMapItems[0].slug}
            freeModuleLessonCount={moduleMapItems[0].totalLessons}
            singlePrice={PRICING.single.price}
            moduleTerm={world.terminology.module}
          />
        )}
        <ModuleMapClient
          modules={moduleMapItems}
          worldSlug={slug}
          continueHref={continueHref}
          continueLabel={continueLabel}
          unlockHref={!hasPurchased && user ? "/paywall" : undefined}
          lockedTeaser={
            !user
              ? {
                  href: `/pricing?locked=${encodeURIComponent(slug)}`,
                  label: `From $${PRICING.single.price}, Module 1 free`,
                }
              : undefined
          }
        />
        {/* A prospect mid-free-module gets the film after the map, never
            in front of their Continue CTA. */}
        {!trailerAboveMap && trailerPanel && (
          <div className="mt-8">{trailerPanel}</div>
        )}

        {/* The project brief closes the page, collapsed. Course preferences
            (route and readiness check) render for purchasers only: prospects
            never see them, even collapsed (owner, 2026-09-20). They used to
            sit between the header and the film, which put a settings panel
            in front of the story for every visitor. */}
        {slug === "deep-orbit" && (
          <details className="mt-8 border border-border bg-surface p-4">
            <summary className="min-h-11 cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-primary">
              {hasPurchased
                ? "Course preferences and project brief"
                : "Project brief"}
            </summary>
            {hasPurchased && (
              <LearningRoutePicker
                accountId={user?.id ?? null}
                initialRoute={learningPreference.route}
                unavailable={learningPreference.unavailable}
                source="world"
                showReadiness
              />
            )}
            <CourseProjectPreview />
          </details>
        )}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  );
}
