import { describe, it, expect } from "vitest";
import { resolveContinueCta, type CtaModule } from "../continue-cta";

/**
 * The world map's Continue CTA.
 *
 * Extracted from `page.tsx` on 2026-08-23 to fix a bug that could not be
 * tested inside a server component: a guest who finished module 1 was shown
 * "Continue M1" pointing at the module they had just finished.
 *
 * The mechanism was not a precedence problem, it was a partial state.
 * `activeModule` matched module 1 because its STATUS was still active, while
 * `activeLesson` was undefined because every lesson in it was complete. The
 * label branch tested only `activeModule` (so: "Continue M1") and the href
 * branch tested both, fell through, and landed on the module root. The
 * paywall branch never fired because it required `!activeModule`.
 */
function lesson(slug: string, status: string) {
  return { slug, status };
}

const FRESH: CtaModule[] = [
  {
    order: 1,
    slug: "m1",
    status: "available",
    lessons: [lesson("l1", "available"), lesson("l2", "locked")],
  },
  { order: 2, slug: "m2", status: "locked", lessons: [lesson("l3", "locked")] },
];

describe("resolveContinueCta", () => {
  it("recommends browser work for an entitled challenge learner and resumes actual work first", () => {
    const modules = [
      {
        order: 1,
        slug: "foundations",
        status: "available",
        lessons: [{ slug: "intro", status: "available" }],
      },
      {
        order: 6,
        slug: "browser-runtimes",
        status: "available",
        lessons: [{ slug: "why-the-browser", status: "available" }],
      },
    ];
    expect(
      resolveContinueCta({
        worldSlug: "deep-orbit",
        modules,
        hasPurchased: true,
        learningRoute: "challenge",
      }).href,
    ).toBe(
      "/worlds/deep-orbit/browser-runtimes/why-the-browser?start=challenge",
    );
    modules[0]!.lessons[0]!.status = "in_progress";
    expect(
      resolveContinueCta({
        worldSlug: "deep-orbit",
        modules,
        hasPurchased: true,
        learningRoute: "challenge",
      }).href,
    ).toBe("/worlds/deep-orbit/foundations/intro?start=challenge");
    modules[0]!.lessons[0]!.status = "available";
    modules[1]!.status = "locked";
    expect(
      resolveContinueCta({
        worldSlug: "deep-orbit",
        modules,
        hasPurchased: false,
        learningRoute: "challenge",
      }).href,
    ).toBe("/worlds/deep-orbit/foundations/intro?start=challenge");
  });
  it("offers a brand new guest a start, not a continue", () => {
    const cta = resolveContinueCta({
      worldSlug: "deep-orbit",
      modules: FRESH,
      hasPurchased: false,
    });

    // Nothing is started, so "Continue" would claim progress that does not
    // exist. The wording matches the trailer endcard CTA, which points at
    // the same lesson (2026-08-29 design audit).
    expect(cta.href).toBe("/worlds/deep-orbit/m1/l1");
    expect(cta.label).toBe("Start Module 1 free");
  });

  it("offers a purchaser who never started a start without the free tag", () => {
    const cta = resolveContinueCta({
      worldSlug: "deep-orbit",
      modules: FRESH,
      hasPurchased: true,
    });

    expect(cta.href).toBe("/worlds/deep-orbit/m1/l1");
    expect(cta.label).toBe("Start Module 1");
  });

  it("switches to Continue once any lesson is completed", () => {
    const modules: CtaModule[] = [
      {
        order: 1,
        slug: "m1",
        status: "active",
        lessons: [lesson("l1", "completed"), lesson("l2", "available")],
      },
      FRESH[1],
    ];

    const cta = resolveContinueCta({
      worldSlug: "deep-orbit",
      modules,
      hasPurchased: false,
    });

    expect(cta.label).toBe("Continue M1");
    expect(cta.href).toBe("/worlds/deep-orbit/m1/l2");
  });

  it("continues into the lesson actually in progress", () => {
    const modules: CtaModule[] = [
      {
        order: 1,
        slug: "m1",
        status: "active",
        lessons: [lesson("l1", "completed"), lesson("l2", "in_progress")],
      },
      FRESH[1],
    ];

    const cta = resolveContinueCta({
      worldSlug: "deep-orbit",
      modules,
      hasPurchased: false,
    });

    expect(cta.label).toBe("Continue M1");
    expect(cta.href).toBe("/worlds/deep-orbit/m1/l2");
  });

  /** The bug. */
  it("sends a guest who finished the free module to the paywall, not backwards", () => {
    const modules: CtaModule[] = [
      {
        order: 1,
        // Status still reads active while every lesson inside it is done.
        status: "active",
        slug: "m1",
        lessons: [lesson("l1", "completed"), lesson("l2", "completed")],
      },
      { order: 2, slug: "m2", status: "locked", lessons: [] },
    ];

    const cta = resolveContinueCta({
      worldSlug: "deep-orbit",
      modules,
      hasPurchased: false,
    });

    expect(cta.href).toBe("/paywall");
    expect(cta.label).toBe("Unlock Module 2");
    expect(cta.label).not.toContain("Continue M1");
  });

  it("advances a paying learner into the next module", () => {
    const modules: CtaModule[] = [
      {
        order: 1,
        slug: "m1",
        status: "completed",
        lessons: [lesson("l1", "completed")],
      },
      {
        order: 2,
        slug: "m2",
        status: "available",
        lessons: [lesson("l3", "available")],
      },
    ];

    const cta = resolveContinueCta({
      worldSlug: "deep-orbit",
      modules,
      hasPurchased: true,
    });

    expect(cta.label).toBe("Continue M2");
    expect(cta.href).toBe("/worlds/deep-orbit/m2/l3");
  });

  it("points a finished world at the capstone", () => {
    const modules: CtaModule[] = [
      {
        order: 1,
        slug: "m1",
        status: "completed",
        lessons: [lesson("l1", "completed")],
      },
    ];

    const cta = resolveContinueCta({
      worldSlug: "deep-orbit",
      modules,
      hasPurchased: true,
    });

    expect(cta.label).toBe("View Capstone");
    expect(cta.href).toBe("/worlds/deep-orbit/capstone");
  });

  /**
   * A buyer is never sent to the paywall. Without the hasPurchased guard a
   * paid learner mid-world could be routed to buy something they own.
   */
  it("never paywalls someone who has purchased", () => {
    const modules: CtaModule[] = [
      {
        order: 1,
        slug: "m1",
        status: "active",
        lessons: [lesson("l1", "completed")],
      },
      { order: 2, slug: "m2", status: "locked", lessons: [] },
    ];

    const cta = resolveContinueCta({
      worldSlug: "deep-orbit",
      modules,
      hasPurchased: true,
    });

    expect(cta.href).not.toBe("/paywall");
  });
});
