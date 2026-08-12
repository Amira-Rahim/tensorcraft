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
import { WorldCardsGrid, type WorldCardData } from "./world-cards-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Tensorcraft: Deep Orbit is live, ${WORLD_SLUGS.length - LAUNCHED_WORLDS.length} more coming`,
  description:
    "Deep Orbit (time-series & signals) is live. Neon Protocol, Signal Ward, Nova Canvas, and Terra Grid follow in waves; join each waitlist.",
  alternates: { canonical: "https://tensorcraft.app/worlds" },
  // Per-route openGraph/twitter. Without these the route inherited the root
  // layout's block, so og:url pointed at the homepage and every share of
  // this page presented as the site root — wrong title, wrong image, wrong
  // destination preview. Matters most during a distribution push.
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/worlds",
    title: "Five worlds, one live | Tensorcraft",
    images: [
      "/api/og?title=Five%20worlds%2C%20one%20live&world=deep-orbit&subtitle=Deep%20Orbit%20is%20shipping%20now",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Five worlds, one live | Tensorcraft",
    images: [
      "/api/og?title=Five%20worlds%2C%20one%20live&world=deep-orbit&subtitle=Deep%20Orbit%20is%20shipping%20now",
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
    modulesCount: WORLD_CONTENT.modulesPerWorld,
    lessonsCount: WORLD_CONTENT.totalLessonsPerWorld,
    price: PRICING.single.price,
    status: isLaunched(world.slug) ? "live" : "coming-soon",
  }));

  return (
    <main className="min-h-screen bg-page px-6 py-20 relative overflow-hidden">
      <AmbientBackground count={240} />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero */}
        <h1 className="text-4xl md:text-5xl font-mono font-bold text-text-primary mb-3 tracking-tight">
          Choose Your World
        </h1>
        <p className="text-lg text-text-muted mb-6 max-w-2xl">
          Five ML specializations, each told through its own story universe.
          Deep Orbit is live. The other four ship in waves; sign up to their
          waitlists below.
        </p>
        <p className="text-base text-text-muted mb-14 max-w-2xl leading-relaxed">
          Pick the world that maps to the ML problem you actually want to solve.
          Each one teaches a complete specialization through React and
          TensorFlow.js. No Python.
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
    // This grid only paints "owned" badges — not an access gate — so a
    // transient fault degrading to "nothing owned" is acceptable here (the
    // real paywall is the lesson route, which surfaces the error). Keeping the
    // swallow local and documented rather than in the shared helper.
    return new Set();
  }
}
