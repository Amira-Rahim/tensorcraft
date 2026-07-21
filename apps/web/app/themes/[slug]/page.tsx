import Link from "next/link";
import { notFound } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import { PRICING, isLaunched, isComingSoon } from "@tensorcraft/shared";
import {
  getModules,
  getModuleLessons,
  getLessonTotalMinutes,
} from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasThemePurchase, getUserProgress } from "@/lib/progress";
import { ThemeSceneBackdrop } from "./theme-scene-backdrop";
import { ModuleMapClient } from "./module-map-client";
import { GuestModuleBanner } from "./guest-module-banner";
import { ComingSoonStub } from "./coming-soon-stub";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const theme = themes[slug];
  if (!theme) return {};
  return {
    title: isComingSoon(slug)
      ? `${theme.displayName}: Coming Soon | Tensorcraft`
      : `${theme.displayName}: Module Map | Tensorcraft`,
    description: theme.description,
    alternates: { canonical: `https://tensorcraft.app/themes/${slug}` },
    openGraph: {
      images: [
        `/api/og?title=${encodeURIComponent(theme.displayName)}&theme=${slug}&subtitle=${encodeURIComponent(theme.specialization)}`,
      ],
    },
  };
}

export default async function ThemeDetailPage({ params }: Props) {
  const { slug } = await params;
  const theme = themes[slug];
  if (!theme) notFound();

  // Coming-soon themes render a stub with waitlist capture instead of the
  // module map. Velite excludes their content from the build, so getModules
  // would return [] anyway, the explicit branch keeps the UX intentional.
  if (isComingSoon(slug)) {
    return <ComingSoonStub theme={theme} />;
  }

  if (!isLaunched(slug)) notFound();

  const themeModules = getModules(slug);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasPurchased = user ? await hasThemePurchase(user.id, slug) : false;

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
  const moduleMapItems = themeModules.map((mod) => {
    const modLessons = getModuleLessons(slug, mod.slug);
    const totalLessons = modLessons.length;
    const completedCount = completedByModule.get(mod.slug) ?? 0;
    const hasStarted = (startedByModule.get(mod.slug) ?? 0) > 0;
    // Free == module 1, matching the paywall gate in
    // themes/[slug]/[module]/[lesson]/page.tsx, which redirects on
    // `mod.order > 1`.
    //
    // This used to call isFoundationsModule(mod), i.e. `track === "foundations"`
    // — and in deep-orbit that track spans modules 1 THROUGH 4. So the map
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
        sceneLocation: lesson.scene?.location,
        narrative: lesson.context?.narrative,
        bridgeFe: lesson.concept?.bridge?.feTitle,
        bridgeMl: lesson.concept?.bridge?.mlTitle,
      };
    });

    return {
      slug: mod.slug,
      title: mod.title,
      order: mod.order,
      description: mod.description,
      status,
      completedLessons: completedCount,
      totalLessons,
      avgScore,
      lessons: lessonItems,
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
  const isThemeComplete = moduleMapItems.every((m) => m.status === "completed");

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
  // straight back to this map — a self-loop at the exact moment the
  // learner is most ready to buy. Route that state to the paywall.
  const nextLockedModule = moduleMapItems.find((m) => m.status === "locked");
  const paywallBlocked =
    !activeModule &&
    !isThemeComplete &&
    !hasPurchased &&
    completedModuleCount > 0 &&
    !!nextLockedModule;

  // Continue CTA info
  const continueHref = paywallBlocked
    ? "/paywall"
    : activeModule && activeLesson
      ? `/themes/${slug}/${activeModule.slug}/${activeLesson.slug}`
      : isThemeComplete
        ? `/themes/${slug}/capstone`
        : `/themes/${slug}/${themeModules[0]?.slug}`;
  const continueLabel = paywallBlocked
    ? `Unlock Module ${nextLockedModule.order}`
    : activeModule
      ? `Continue M${activeModule.order}`
      : isThemeComplete
        ? "View Capstone"
        : "Start Learning";

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${theme.displayName}: ${theme.specialization}`,
    description: theme.description,
    provider: {
      "@type": "Organization",
      name: "Tensorcraft",
      url: "https://tensorcraft.app",
    },
    url: `https://tensorcraft.app/themes/${slug}`,
    educationalLevel: "Intermediate",
    programmingLanguage: ["JavaScript", "TypeScript"],
    numberOfCredits: themeModules.length,
    teaches: theme.specialization,
    offers: {
      "@type": "Offer",
      price: String(PRICING.single.price),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://tensorcraft.app/pricing",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      // Sum of lesson + exercise estimatedMinutes frontmatter (1,729 min
      // as of 2026-07-19: 975 lesson + 754 exercise). Recompute when
      // minutes change: sum lesson+exercise estimatedMinutes / 60, round.
      courseWorkload: "PT29H",
    },
  };

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: theme.palette.bg }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      {/* The theme's signature scene (Deep Orbit's orbital system for the
          live theme) behind the module map — same renderer as the homepage
          and /themes cards, viewport-capped with a bottom fade. */}
      <ThemeSceneBackdrop slug={theme.slug} primary={theme.palette.primary} />

      {/* Page header */}
      <header
        className="relative z-10 px-12 pt-10 pb-9"
        style={{
          borderBottom: `1px solid ${theme.palette.border}`,
          background: `color-mix(in srgb, ${theme.palette.bg} 70%, transparent)`,
        }}
      >
        <p
          className="font-mono text-xs uppercase mb-2.5"
          style={{ color: theme.palette.primary, letterSpacing: "0.15em" }}
        >
          {theme.displayName} &middot; {themeModules.length} MODULES
        </p>
        <h1
          className="font-mono text-3xl font-bold mb-2.5"
          style={{ color: theme.palette.text, letterSpacing: "-0.02em" }}
        >
          MODULE MAP
        </h1>
        <p className="text-sm" style={{ color: theme.palette.muted }}>
          {themeModules.length} modules between your frontend and a deployed
          model. Pick up where you left off.
        </p>

        <div className="flex gap-8 mt-6">
          {[
            [String(completedModuleCount), "Completed"],
            [
              activeModuleIndex >= 0 ? String(activeModuleIndex + 1) : "–",
              "Active Now",
            ],
            [allScores.length > 0 ? String(avgScore) : "–", "Avg Score"],
          ].map(([value, label]) => (
            <div key={label}>
              <div
                className="font-mono text-xl font-bold"
                style={{ color: theme.palette.primary }}
              >
                {value}
              </div>
              <div
                className="font-mono text-xs mt-0.5"
                style={{ color: theme.palette.muted }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Capstone banner */}
      {isThemeComplete && (
        <div className="max-w-[900px] mx-auto px-8 relative z-10 mt-6">
          <Link
            href={`/themes/${slug}/capstone`}
            className="flex items-center justify-between p-5 border-2 brutalist-hover"
            style={{
              borderColor: theme.palette.primary,
              background: theme.palette.surface,
            }}
          >
            <div>
              <span
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: theme.palette.primary }}
              >
                Mission Complete
              </span>
              <p
                className="text-sm font-mono font-semibold mt-1"
                style={{ color: theme.palette.text }}
              >
                All modules completed; view your capstone &rarr;
              </p>
            </div>
            <span style={{ color: theme.palette.primary, fontSize: 24 }}>
              &#x25CE;
            </span>
          </Link>
        </div>
      )}

      {/* Module List */}
      <div className="relative z-10 max-w-[900px] mx-auto px-8 pt-10 pb-20">
        {!user && moduleMapItems[0] && (
          <GuestModuleBanner
            themeSlug={slug}
            freeModuleSlug={moduleMapItems[0].slug}
            freeModuleLessonCount={moduleMapItems[0].totalLessons}
            singlePrice={PRICING.single.price}
            moduleTerm={theme.terminology.module}
          />
        )}
        <ModuleMapClient
          modules={moduleMapItems}
          themeSlug={slug}
          terminology={{
            lesson: theme.terminology.lesson,
            module: theme.terminology.module,
          }}
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
