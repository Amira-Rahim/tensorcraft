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
import { ModuleMapClient } from "./module-map-client";
import { ModulePatch } from "@tensorcraft/ui/module-patch";
import { GuestModuleBanner } from "./guest-module-banner";
import { ComingSoonStub } from "./coming-soon-stub";
import { buildCourseJsonLd } from "./course-jsonld";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const world = worlds[slug];
  if (!world) return {};
  return {
    title: isComingSoon(slug)
      ? `${world.displayName}: Coming Soon | Tensorcraft`
      : `${world.displayName}: Module Map | Tensorcraft`,
    // Search snippets reach strangers with no framing, so they state what
    // the course is rather than opening on the story (owner bar 2026-08-16;
    // ruled 2026-08-20: the coming-soon PAGES keep their story copy, their
    // metadata does not).
    description: isComingSoon(slug)
      ? `${world.displayName} is a planned machine learning course in JavaScript: ${world.specialization.toLowerCase()}, taught in the browser with TensorFlow.js. Not released yet; join the waitlist.`
      : `${world.displayName} is a story-driven machine learning course in JavaScript: ${world.specialization.toLowerCase()}, taught in the browser with TensorFlow.js. Module 1 is free.`,
    alternates: { canonical: `https://tensorcraft.app/worlds/${slug}` },
    // Full openGraph + twitter blocks: an images-only openGraph REPLACES the
    // root block (shallow merge), dropping og:url/type and inheriting the
    // homepage twitter card on the highest-share route in the product (R3-7).
    openGraph: {
      type: "website",
      url: `https://tensorcraft.app/worlds/${slug}`,
      title: `${world.displayName} | Tensorcraft`,
      images: [
        `/api/og?title=${encodeURIComponent(world.displayName)}&world=${slug}&subtitle=${encodeURIComponent(world.specialization)}`,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${world.displayName} | Tensorcraft`,
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
  const progress = user ? await getUserProgress(user.id, slug) : [];
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

  // Determine module statuses (sequential unlock)
  let foundFirstIncomplete = false;
  const moduleMapItems = worldModules.map((mod) => {
    const modLessons = getModuleLessons(slug, mod.slug);
    const totalLessons = modLessons.length;
    const completedCount = completedByModule.get(mod.slug) ?? 0;
    const hasStarted = (startedByModule.get(mod.slug) ?? 0) > 0;
    // Free == module 1, matching the paywall gate in
    // worlds/[slug]/[module]/[lesson]/page.tsx, which redirects on
    // `mod.order > 1`.
    //
    // This used to call isFoundationsModule(mod), i.e. `track === "foundations"`
    // - and in deep-orbit that track spans modules 1 THROUGH 4. So the map
    // advertised modules 2, 3 and 4 as available, and clicking any of them
    // bounced the learner to /pricing?locked=. It landed hardest right after
    // the free-account CTA converted someone: sign up, see three more modules
    // apparently unlocked, click, get a paywall. Anonymous visitors were
    // unaffected, which is why it survived the anonymous free-path checks.
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

    // Compute lesson statuses
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
        // All lessons in free modules are accessible without sequential unlock
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

  // Compute stats
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
      : 0;

  // Check capstone eligibility
  const isWorldComplete = moduleMapItems.every((m) => m.status === "completed");

  // Find active module for "Continue" CTA
  const activeModule = moduleMapItems.find(
    (m) => m.status === "active" || m.status === "available",
  );
  const activeLesson = activeModule?.lessons.find(
    (l) => l.status === "in_progress" || l.status === "available",
  );

  // The free-module dead end (2026-07-14 UX audit): with module 1 done
  // and module 2 paywall-locked, activeModule is undefined and the CTA
  // used to render "Start Learning" pointing at a route that redirects
  // straight back to this map - a self-loop at the exact moment the
  // learner is most ready to buy. Route that state to the paywall.
  const nextLockedModule = moduleMapItems.find((m) => m.status === "locked");
  const paywallBlocked =
    !activeModule &&
    !isWorldComplete &&
    !hasPurchased &&
    completedModuleCount > 0 &&
    !!nextLockedModule;

  // Continue CTA info
  const continueHref = paywallBlocked
    ? "/paywall"
    : activeModule && activeLesson
      ? `/worlds/${slug}/${activeModule.slug}/${activeLesson.slug}`
      : isWorldComplete
        ? `/worlds/${slug}/capstone`
        : `/worlds/${slug}/${worldModules[0]?.slug}`;
  const continueLabel = paywallBlocked
    ? `Unlock Module ${nextLockedModule.order}`
    : activeModule
      ? `Continue M${activeModule.order}`
      : isWorldComplete
        ? "View Capstone"
        : "Start Learning";

  const courseJsonLd = buildCourseJsonLd(world);

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--tc-bg)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
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
      <header
        className={`relative z-10 px-12 pt-10 pb-9${
          heroPlateSrc(world.slug) ? " tc-on-art" : ""
        }`}
        style={{
          borderBottom: "1px solid var(--tc-border)",
          background: "color-mix(in srgb, var(--tc-bg) 70%, transparent)",
        }}
      >
        <p
          className="font-mono text-xs uppercase mb-2.5"
          style={{ color: "var(--tc-primary)", letterSpacing: "0.15em" }}
        >
          {world.displayName} &middot; {worldModules.length} MODULES
        </p>
        <h1
          className="font-mono text-3xl font-bold mb-2.5"
          style={{ color: "var(--tc-text)", letterSpacing: "-0.02em" }}
        >
          MODULE MAP
        </h1>
        <p className="text-sm" style={{ color: "var(--tc-muted)" }}>
          {worldModules.length} modules between your JavaScript and a deployed
          model.
        </p>

        <div className="flex gap-8 mt-6">
          {[
            [String(completedModuleCount), "Completed"],
            [
              activeModuleIndex >= 0 ? String(activeModuleIndex + 1) : "0",
              "Active Now",
            ],
            [allScores.length > 0 ? String(avgScore) : "0", "Avg Score"],
          ].map(([value, label]) => (
            <div key={label}>
              <div
                className="font-mono text-xl font-bold"
                style={{ color: "var(--tc-primary)" }}
              >
                {value}
              </div>
              <div
                className="font-mono text-xs mt-0.5"
                style={{ color: "var(--tc-muted)" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* The crew, directly under the header: who you'll be working with,
          before the module list says what you'll do. Self-hides for a world
          with no characters. */}
      <WorldCast slug={world.slug} />

      {/* Capstone banner */}
      {isWorldComplete && (
        <div className="max-w-[900px] mx-auto px-8 relative z-10 mt-6">
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
                All modules completed; view your capstone &rarr;
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
      <div className="relative z-10 max-w-[900px] mx-auto px-8 pt-10 pb-20">
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
                  label: `From $${PRICING.single.price} · Module 1 free`,
                }
              : undefined
          }
        />
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
