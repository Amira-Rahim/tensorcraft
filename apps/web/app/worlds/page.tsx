import { worlds } from "@tensorcraft/worlds";
import {
  LAUNCHED_WORLDS,
  PRICING,
  WORLD_CONTENT,
  WORLD_SLUGS,
  isLaunched,
} from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitledWorlds } from "@/lib/entitlements";
import { heroPlateSrc } from "@/lib/location-art";
import { WorldCardsGrid, type WorldCardData } from "./world-cards-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `ML Courses in JavaScript: ${LAUNCHED_WORLDS.length} live, ${WORLD_SLUGS.length - LAUNCHED_WORLDS.length} coming | Tensorcraft`,
  description:
    "Deep Orbit, a JavaScript course on reading signals and data that arrive over time (time series), is live. Four more story worlds (Neon Protocol, Signal Ward, Nova Canvas, Terra Grid) are coming; join the waitlists.",
  alternates: { canonical: "https://tensorcraft.app/worlds" },
  // Per-route openGraph/twitter. Without these the route inherited the root
  // layout's block, so og:url pointed at the homepage and every share of
  // this page presented as the site root - wrong title, wrong image, wrong
  // destination preview. Matters most during a distribution push.
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/worlds",
    title: "Five story courses, one live | Tensorcraft",
    images: [
      "/api/og?title=Five%20story%20courses%2C%20one%20live&world=deep-orbit&subtitle=Deep%20Orbit%20is%20live%20now",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Five story courses, one live | Tensorcraft",
    images: [
      "/api/og?title=Five%20story%20courses%2C%20one%20live&world=deep-orbit&subtitle=Deep%20Orbit%20is%20live%20now",
    ],
  },
};

/**
 * WorldSelection page.
 *
 * - Hero card for the launched world (Deep Orbit) + a muted 2-column grid
 *   for coming-soon worlds whose cards link to per-world stub pages with
 *   waitlist capture (see app/worlds/[slug]/coming-soon-stub.tsx).
 * - Per-world signature <SceneCanvas> scene (same renderers as the
 *   homepage five-worlds strip), ignited on hover/focus.
 * - Newsletter signup modal with trapped focus + Escape/click-outside close.
 * - Per-user "Start" vs "Continue" CTA on the live card; coming-soon cards
 *   always show "Notify me →".
 */
export default async function WorldsPage() {
  // Resolve per-user ownership so each card can show Start vs Continue. This
  // is a no-op (empty set) for logged-out visitors.
  const ownedWorlds = await loadOwnedWorlds();

  const worldList = Object.values(worlds);
  const cards: WorldCardData[] = worldList.map((world) => ({
    slug: world.slug,
    displayName: world.displayName,
    tagline: world.tagline,
    specialization: world.specialization,
    primary: world.palette.primary,
    primaryLight: world.paletteLight.primary,
    owned: ownedWorlds.has(world.slug),
    plateSrc: isLaunched(world.slug) ? heroPlateSrc(world.slug) : undefined,
    modulesCount: WORLD_CONTENT.modulesPerWorld,
    lessonsCount: WORLD_CONTENT.totalLessonsPerWorld,
    price: PRICING.single.price,
    status: isLaunched(world.slug) ? "live" : "coming-soon",
  }));

  return (
    // pt-24: the 96px header-to-title gap is shared with /pricing and
    // /blog (owner, 2026-09-01).
    <main className="min-h-screen bg-page px-6 pt-24 pb-20 relative overflow-hidden">
      <AmbientBackground count={240} />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero. Fluid one-liner (owner: "spread across the grid",
            2026-08-31, same pattern as landing//learn//pricing): 17 mono
            chars at 0.575em per char (0.6em advance minus tracking-tight's
            0.025em) track the max-w-7xl container, whose 1280px cap sets
            the 8rem ceiling; the 2.25rem floor keeps the old mobile size. */}
        <h1 className="text-[clamp(2.25rem,calc(10vw-0.25rem),8rem)] font-mono font-bold text-text-primary mb-4 tracking-tight">
          Choose Your World
        </h1>
        <p className="text-lg md:text-2xl text-text-muted mb-6 max-w-[70ch]">
          Five ML specializations, each told through its own story universe.
          Deep Orbit is live. The other four have no release dates yet; join a
          waitlist below and we will email you when one opens.
        </p>
        <p className="text-base md:text-lg text-text-muted mb-14 max-w-[70ch] leading-relaxed">
          Pick the world that maps to the ML problem you actually want to solve.
          Each world focuses on a different ML problem through JavaScript.
          Browser lessons need no Python. The optional model-conversion lab uses
          a Python command-line tool.
        </p>

        <WorldCardsGrid cards={cards} />
      </div>
    </main>
  );
}

/**
 * Fetch the set of world slugs the current user owns. Falls back to an empty
 * set when no session is present or the Supabase call throws (e.g. during
 * tests that stub only part of the client surface).
 */
async function loadOwnedWorlds(): Promise<Set<string>> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Set();

    // Single entitlement source (Tier 1 F4). Was a hand-rolled purchases query
    // + Set loop duplicated in three files; the rule lives in one place now,
    // so adding seat-based access later changes only getEntitledWorlds.
    return await getEntitledWorlds(user.id);
  } catch {
    // This grid only paints "owned" badges - not an access gate - so a
    // transient fault degrading to "nothing owned" is acceptable here (the
    // real paywall is the lesson route, which surfaces the error). Keeping the
    // swallow local and documented rather than in the shared helper.
    return new Set();
  }
}
