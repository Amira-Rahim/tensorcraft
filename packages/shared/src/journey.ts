/**
 * The cross-world JOURNEY - the modeled arc that connects the five worlds so
 * they are one collection, not five silos.
 *
 * Built for docs/audits/scalability-architecture-2026-07-21.md finding F2: a
 * real collection-level narrative already exists (a closed ring where each
 * world's finale hands its problem to the next; named spines that recur across
 * worlds) but it lived only as hardcoded MDX props in five capstones plus an
 * inline `THREAD` constant in one component. For a product sold on the arc,
 * the arc had no first-class representation. This module IS that
 * representation. Every cross-world surface resolves against this data instead
 * of copy-pasting prose, so reordering or inserting a world is a data edit,
 * not a hunt across capstones.
 *
 * Two modes consume this (owner decision, hybrid):
 *  - FREE PLAY: any world is purchasable/playable; the journey only powers
 *    soft recommendations ("recommended next"), continuity callbacks, and
 *    completion acknowledgement. Never blocks.
 *  - CANONICAL TRACK: an opt-in sequenced run through the ring with its own
 *    progress. See lib/journey-progress + migration 044.
 */

import { WORLD_SLUGS, type WorldSlug } from "./constants";

/**
 * The canonical order of the journey. A closed ring: the last world's finale
 * loops back to the first (deep-orbit's anomaly re-appears). Kept identical to
 * WORLD_SLUGS order so there is a single ordering truth; this constant names
 * the *intent* (journey order) so a future reorder is explicit.
 */
export const JOURNEY_ORDER: readonly WorldSlug[] = WORLD_SLUGS;

export interface JourneyNode {
  slug: WorldSlug;
  /** 0-based position in the ring. */
  position: number;
  /** Previous world in the ring (the one whose finale hands off to this). */
  arrivesFrom: WorldSlug;
  /** Next world in the ring (where this world's finale points). */
  leadsTo: WorldSlug;
}

function buildNodes(): Record<WorldSlug, JourneyNode> {
  const n = JOURNEY_ORDER.length;
  const out = {} as Record<WorldSlug, JourneyNode>;
  JOURNEY_ORDER.forEach((slug, i) => {
    out[slug] = {
      slug,
      position: i,
      // Ring: wrap around at both ends.
      arrivesFrom: JOURNEY_ORDER[(i - 1 + n) % n],
      leadsTo: JOURNEY_ORDER[(i + 1) % n],
    };
  });
  return out;
}

export const JOURNEY_NODES: Record<WorldSlug, JourneyNode> = buildNodes();

/** The node for a world, or undefined for an unknown slug. */
export function getJourneyNode(slug: string): JourneyNode | undefined {
  return (JOURNEY_NODES as Record<string, JourneyNode>)[slug];
}

/** The world whose finale hands off INTO this one. */
export function getArrivesFrom(slug: string): WorldSlug | undefined {
  return getJourneyNode(slug)?.arrivesFrom;
}

/** The world this one's finale points toward (ring order). */
export function getLeadsTo(slug: string): WorldSlug | undefined {
  return getJourneyNode(slug)?.leadsTo;
}

/**
 * A named narrative SPINE - a thread that recurs across worlds, teaching the
 * same primitive in different domains. Each spine is an ordered list of stops;
 * a lesson references a spine stop by id.
 *
 * This replaces the inline `THREAD` constant that used to live inside
 * StrategyThread. New stops are data here, not a component edit.
 */
export interface SpineStop {
  id: string;
  worldSlug: WorldSlug;
  href: string;
  title: string;
  /** One-line summary of the stop. */
  gist: string;
  /** The shared primitive this stop expresses (e.g. "Minimax · non-cooperative"). */
  primitive: string;
}

export interface Spine {
  id: string;
  label: string;
  description: string;
  stops: SpineStop[];
}

export const SPINES: Record<string, Spine> = {
  "game-theory": {
    id: "game-theory",
    label: "Strategy thread · game-theory spine",
    description:
      "Lessons that build on a shared game-theoretic primitive (minimax, regret) across worlds.",
    stops: [
      {
        id: "gan-game",
        worldSlug: "nova-canvas",
        href: "/worlds/nova-canvas/generative-adversarial-networks/the-gan-game",
        title: "The GAN Game",
        gist: "Generator vs discriminator: minimax saddle point.",
        primitive: "Minimax · non-cooperative",
      },
      {
        id: "bandit",
        worldSlug: "terra-grid",
        href: "/worlds/terra-grid/ab-testing/multi-armed-bandits",
        title: "Multi-armed bandits",
        gist: "Explore vs exploit: regret minimization under uncertainty.",
        primitive: "Regret · sequential",
      },
    ],
  },
  "signal-continuity": {
    id: "signal-continuity",
    label: "Signal thread · the anomaly answers back",
    description:
      "The main ring: each world's finale hands its signal to the next domain, the tensor as lingua franca.",
    stops: [],
  },
};

/** Resolve spine stops by id, in the order requested. Unknown ids are dropped. */
export function getSpineStops(spineId: string, stopIds: string[]): SpineStop[] {
  const spine = SPINES[spineId];
  if (!spine) return [];
  const byId = new Map(spine.stops.map((s) => [s.id, s]));
  return stopIds.map((id) => byId.get(id)).filter((s): s is SpineStop => !!s);
}

/**
 * FREE-PLAY recommendation: given the worlds a learner already owns/completed
 * and where they are now, which world should we nudge next?
 *
 * Walks the ring forward from `currentSlug`, returning the first world not in
 * `owned`. Returns null if they own the whole ring (nothing to recommend).
 * This is a soft suggestion only - it never gates.
 */
export function recommendedNextWorld(
  owned: ReadonlySet<string>,
  currentSlug?: string,
): WorldSlug | null {
  const startPos = currentSlug
    ? (getJourneyNode(currentSlug)?.position ?? -1)
    : -1;
  const n = JOURNEY_ORDER.length;
  for (let step = 1; step <= n; step++) {
    const candidate = JOURNEY_ORDER[(startPos + step + n) % n];
    if (!owned.has(candidate)) return candidate;
  }
  return null;
}
