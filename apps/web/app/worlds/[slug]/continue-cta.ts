/**
 * The world map's primary "Continue" call to action.
 *
 * Extracted from `page.tsx` on 2026-08-23 so it could be tested, following
 * the same pattern as `course-jsonld.ts`.
 *
 * The bug it fixes: a guest who finished the free module was shown
 * "Continue M1" linking back into the module they had just completed, at the
 * exact moment they were most ready to buy. The cause was a PARTIAL state
 * rather than a precedence mistake. `activeModule` matched module 1 because
 * its status was still active, while `activeLesson` was undefined because
 * every lesson in it was done. The label branch tested only `activeModule`,
 * the href branch tested both and fell through to the module root, and the
 * paywall branch never fired because it required `!activeModule`.
 *
 * The fix is to define "active" as what the CTA actually needs: a module
 * that still has somewhere to go. A module with no remaining lesson is not
 * somewhere to continue.
 */

export interface CtaLesson {
  slug: string;
  status: string;
}

export interface CtaModule {
  order: number;
  slug: string;
  status: string;
  lessons: CtaLesson[];
}

export interface ContinueCta {
  href: string;
  label: string;
}

function hasSomewhereToGo(module: CtaModule): boolean {
  return module.lessons.some(
    (l) => l.status === "in_progress" || l.status === "available",
  );
}

export function resolveContinueCta({
  worldSlug,
  modules,
  hasPurchased,
  learningRoute,
}: {
  worldSlug: string;
  modules: CtaModule[];
  hasPurchased: boolean;
  learningRoute?: "guided" | "challenge" | null;
}): ContinueCta {
  // Deliberately lessons, not module status. In the exact state this
  // function exists to fix, module 1's STATUS is still "active" while every
  // lesson inside it is complete, so a module-status count reads zero and the
  // paywall guard below never fires. Lessons are the ground truth for "this
  // person has actually done something".
  const hasCompletedLesson = modules.some((m) =>
    m.lessons.some((l) => l.status === "completed"),
  );
  const isWorldComplete =
    modules.length > 0 && modules.every((m) => m.status === "completed");

  // Requires a remaining lesson, not merely an active status. That extra
  // clause is the whole fix.
  const accessibleModules = modules.filter(
    (m) =>
      (m.status === "active" || m.status === "available") &&
      hasSomewhereToGo(m),
  );
  const activeModule =
    accessibleModules.find((m) =>
      m.lessons.some((l) => l.status === "in_progress"),
    ) ??
    (hasPurchased && learningRoute === "challenge"
      ? accessibleModules.find((m) => m.slug === "browser-runtimes")
      : undefined) ??
    accessibleModules[0];
  const activeLesson =
    activeModule?.lessons.find((l) => l.status === "in_progress") ??
    activeModule?.lessons.find(
      (l) => l.status === "in_progress" || l.status === "available",
    );

  const nextLockedModule = modules.find((m) => m.status === "locked");

  // The free-module dead end (2026-07-14 UX audit): module 1 done and module
  // 2 paywall-locked used to render "Start Learning" at a route that
  // redirected straight back here, a self-loop at the moment of highest
  // intent. Route that state to the paywall instead.
  const paywallBlocked =
    !activeModule &&
    !isWorldComplete &&
    !hasPurchased &&
    hasCompletedLesson &&
    !!nextLockedModule;

  if (paywallBlocked && nextLockedModule) {
    return {
      href: "/paywall",
      label: `Unlock Module ${nextLockedModule.order}`,
    };
  }

  if (activeModule && activeLesson) {
    // "Continue" is only true once something is started. A fresh learner
    // gets the same wording as the trailer endcard CTA, which points at the
    // same lesson; two names for one action read as two actions
    // (2026-08-29 design audit). Purchasers own the module, so no "free".
    const hasStartedAnything = modules.some((m) =>
      m.lessons.some(
        (l) => l.status === "completed" || l.status === "in_progress",
      ),
    );
    return {
      href: `/worlds/${worldSlug}/${activeModule.slug}/${activeLesson.slug}${learningRoute === "challenge" ? "?start=challenge" : ""}`,
      label: hasStartedAnything
        ? `Continue M${activeModule.order}`
        : hasPurchased
          ? `Start Module ${activeModule.order}`
          : `Start Module ${activeModule.order} free`,
    };
  }

  if (isWorldComplete) {
    return { href: `/worlds/${worldSlug}/capstone`, label: "View Capstone" };
  }

  return {
    href: `/worlds/${worldSlug}/${modules[0]?.slug}`,
    label: "Start Learning",
  };
}
