import { describe, it, expect } from "vitest";
import {
  JOURNEY_ORDER,
  getJourneyNode,
  getArrivesFrom,
  getLeadsTo,
  getSpineStops,
  recommendedNextWorld,
} from "./journey";

/**
 * The journey model is the de-siloing skeleton (scalability audit F2): the
 * cross-world arc modeled as data instead of hardcoded MDX props. These pin
 * the ring topology and the resolution helpers so reordering worlds is a safe
 * data edit.
 */
describe("journey ring", () => {
  it("is a closed ring — last leads back to first, first arrives from last", () => {
    const first = JOURNEY_ORDER[0];
    const last = JOURNEY_ORDER[JOURNEY_ORDER.length - 1];
    expect(getLeadsTo(last)).toBe(first);
    expect(getArrivesFrom(first)).toBe(last);
  });

  it("every node's leadsTo/arrivesFrom are consistent neighbours", () => {
    for (const slug of JOURNEY_ORDER) {
      const next = getLeadsTo(slug)!;
      const prev = getArrivesFrom(slug)!;
      // The world I lead to must arrive from me; the world I arrive from must
      // lead to me. This is what makes a reorder safe: the invariant is data.
      expect(getArrivesFrom(next)).toBe(slug);
      expect(getLeadsTo(prev)).toBe(slug);
    }
  });

  it("assigns 0-based positions in order", () => {
    JOURNEY_ORDER.forEach((slug, i) => {
      expect(getJourneyNode(slug)?.position).toBe(i);
    });
  });

  it("returns undefined for an unknown slug", () => {
    expect(getJourneyNode("not-a-world")).toBeUndefined();
    expect(getLeadsTo("not-a-world")).toBeUndefined();
  });
});

describe("spine resolution (de-silos StrategyThread)", () => {
  it("resolves game-theory stops by id, in requested order", () => {
    const stops = getSpineStops("game-theory", ["bandit", "gan-game"]);
    expect(stops.map((s) => s.id)).toEqual(["bandit", "gan-game"]);
    expect(stops[0].primitive).toContain("Regret");
  });

  it("drops unknown stop ids and unknown spines", () => {
    expect(getSpineStops("game-theory", ["nope"])).toEqual([]);
    expect(getSpineStops("no-spine", ["gan-game"])).toEqual([]);
  });
});

describe("recommendedNextWorld (free-play soft nudge)", () => {
  it("suggests the next unowned world walking forward from current", () => {
    const owned = new Set([JOURNEY_ORDER[0]]);
    expect(recommendedNextWorld(owned, JOURNEY_ORDER[0])).toBe(
      JOURNEY_ORDER[1],
    );
  });

  it("skips owned worlds and wraps around the ring", () => {
    const owned = new Set([JOURNEY_ORDER[1], JOURNEY_ORDER[2]]);
    // From position 0, next unowned after skipping 1 and 2 is position 3.
    expect(recommendedNextWorld(owned, JOURNEY_ORDER[0])).toBe(
      JOURNEY_ORDER[3],
    );
  });

  it("returns null when the whole ring is owned", () => {
    expect(
      recommendedNextWorld(new Set(JOURNEY_ORDER), JOURNEY_ORDER[0]),
    ).toBeNull();
  });

  it("works with no current world (recommends from the start)", () => {
    expect(recommendedNextWorld(new Set())).toBe(JOURNEY_ORDER[0]);
  });
});
