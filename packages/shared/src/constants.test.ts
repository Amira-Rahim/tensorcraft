import { describe, it, expect } from "vitest";
import {
  WORLD_SLUGS,
  PRICING,
  ROUTES,
  WORLD_CONTENT,
  DEFAULT_WORLD,
  getModuleLessonCount,
  getPaidLessonCount,
  SCHEME_STORAGE_KEY,
  isColorScheme,
} from "./constants";

describe("WORLD_SLUGS", () => {
  it("contains exactly 5 worlds", () => {
    expect(WORLD_SLUGS).toHaveLength(5);
  });

  it("includes all expected worlds", () => {
    expect(WORLD_SLUGS).toContain("deep-orbit");
    expect(WORLD_SLUGS).toContain("neon-protocol");
    expect(WORLD_SLUGS).toContain("signal-ward");
    expect(WORLD_SLUGS).toContain("nova-canvas");
    expect(WORLD_SLUGS).toContain("terra-grid");
  });
});

describe("PRICING", () => {
  it("has correct free tier", () => {
    expect(PRICING.free.price).toBe(0);
    expect(PRICING.free.worlds).toBe(0);
  });

  it("has the $79 introductory single tier and $99 regular price", () => {
    expect(PRICING.single.price).toBe(79);
    expect(PRICING.single.regularPrice).toBe(99);
    expect(PRICING.single.worlds).toBe(1);
  });

  it("has correct bundle tiers", () => {
    expect(PRICING.twoBundle.price).toBe(90);
    expect(PRICING.twoBundle.worlds).toBe(2);
    expect(PRICING.threeBundle.price).toBe(135);
    expect(PRICING.threeBundle.worlds).toBe(3);
    expect(PRICING.allFive.price).toBe(225);
    expect(PRICING.allFive.worlds).toBe(5);
  });

  it("bundles are cheaper per-world than single, never worse than a smaller bundle", () => {
    // Flat 10%-off-retail bundle rule (2026-08-31): every bundle lands at
    // the same per-world price, so bundle-to-bundle is <=, not <.
    const singlePerWorld = PRICING.single.price;
    const twoPerWorld = PRICING.twoBundle.price / PRICING.twoBundle.worlds;
    const threePerWorld =
      PRICING.threeBundle.price / PRICING.threeBundle.worlds;
    const fivePerWorld = PRICING.allFive.price / PRICING.allFive.worlds;

    expect(twoPerWorld).toBeLessThan(singlePerWorld);
    expect(threePerWorld).toBeLessThanOrEqual(twoPerWorld);
    expect(fivePerWorld).toBeLessThanOrEqual(threePerWorld);
  });
});

describe("ROUTES", () => {
  it("has correct auth routes", () => {
    expect(ROUTES.auth.root).toBe("/auth");
    expect(ROUTES.auth.signIn).toBe("/auth");
    expect(ROUTES.auth.signUp).toBe("/auth");
    expect(ROUTES.auth.callback).toBe("/auth/callback");
  });

  it("generates correct world routes", () => {
    expect(ROUTES.world("deep-orbit")).toBe("/worlds/deep-orbit");
  });

  it("generates correct lesson routes", () => {
    expect(ROUTES.lesson("deep-orbit", "module-1", "lesson-1")).toBe(
      "/worlds/deep-orbit/module-1/lesson-1",
    );
  });

  it("has correct static routes", () => {
    expect(ROUTES.home).toBe("/");
    expect(ROUTES.dashboard).toBe("/dashboard");
    expect(ROUTES.settings).toBe("/settings");
    expect(ROUTES.pricing).toBe("/pricing");
  });
});

/**
 * Paywall arithmetic gate (audit run #6, 2026-07-15).
 *
 * Both paywall surfaces (pricing/paywall-notice.tsx and the lesson
 * lesson-paywall.tsx) pasted the literal "51" for the lessons behind the
 * wall. A literal cannot follow the corpus: if browser-runtimes ever loses
 * its sixth lesson, or module 1 changes size, the customer is quoted a
 * number the product no longer delivers, on the exact screen where they are
 * deciding to pay.
 */
describe("getPaidLessonCount", () => {
  it("is the full world minus the free first module", () => {
    expect(getPaidLessonCount()).toBe(
      WORLD_CONTENT.totalLessonsPerWorld -
        getModuleLessonCount(DEFAULT_WORLD, WORLD_CONTENT.freeModuleSlug),
    );
  });

  it("equals 51 for the launched world", () => {
    // 56 total - 5 in foundations. Pinned so a change to either input has to
    // be a deliberate edit here, not a silent drift in marketing copy.
    expect(getPaidLessonCount()).toBe(51);
  });

  it("names a free module that actually exists in the override table logic", () => {
    // getModuleLessonCount falls back to lessonsPerModule for unknown slugs,
    // so a typo'd freeModuleSlug would silently still return 5. Assert the
    // slug is the one the content corpus ships as module 1.
    expect(WORLD_CONTENT.freeModuleSlug).toBe("foundations");
  });

  it("leaves the paid count smaller than the total", () => {
    expect(getPaidLessonCount()).toBeLessThan(
      WORLD_CONTENT.totalLessonsPerWorld,
    );
    expect(getPaidLessonCount()).toBeGreaterThan(0);
  });
});

/**
 * Light-mode rollout (2026-07-22): the scheme axis is orthogonal to the
 * narrative world. `isColorScheme` is the boundary guard for a stored
 * localStorage value or hand-edited DOM attribute, same role `isLaunched`
 * plays for world slugs.
 */
describe("isColorScheme", () => {
  it("accepts 'light' and 'dark'", () => {
    expect(isColorScheme("light")).toBe(true);
    expect(isColorScheme("dark")).toBe(true);
  });

  it("rejects anything else, including near-misses", () => {
    expect(isColorScheme("system")).toBe(false);
    expect(isColorScheme("")).toBe(false);
    expect(isColorScheme("Light")).toBe(false);
    expect(isColorScheme("auto")).toBe(false);
  });

  it("uses the expected storage key", () => {
    expect(SCHEME_STORAGE_KEY).toBe("tc-scheme");
  });
});
