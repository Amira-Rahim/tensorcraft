import { describe, it, expect } from "vitest";
import {
  THEME_SLUGS,
  PRICING,
  ROUTES,
  THEME_CONTENT,
  getModuleLessonCount,
  getPaidLessonCount,
} from "./constants";

describe("THEME_SLUGS", () => {
  it("contains exactly 5 themes", () => {
    expect(THEME_SLUGS).toHaveLength(5);
  });

  it("includes all expected themes", () => {
    expect(THEME_SLUGS).toContain("deep-orbit");
    expect(THEME_SLUGS).toContain("neon-protocol");
    expect(THEME_SLUGS).toContain("signal-ward");
    expect(THEME_SLUGS).toContain("nova-canvas");
    expect(THEME_SLUGS).toContain("terra-grid");
  });
});

describe("PRICING", () => {
  it("has correct free tier", () => {
    expect(PRICING.free.price).toBe(0);
    expect(PRICING.free.themes).toBe(0);
  });

  it("has correct single tier at $59", () => {
    expect(PRICING.single.price).toBe(59);
    expect(PRICING.single.themes).toBe(1);
  });

  it("has correct bundle tiers", () => {
    expect(PRICING.twoBundle.price).toBe(99);
    expect(PRICING.twoBundle.themes).toBe(2);
    expect(PRICING.threeBundle.price).toBe(129);
    expect(PRICING.threeBundle.themes).toBe(3);
    expect(PRICING.allFive.price).toBe(159);
    expect(PRICING.allFive.themes).toBe(5);
  });

  it("bundles are cheaper per-theme than single", () => {
    const singlePerTheme = PRICING.single.price;
    const twoPerTheme = PRICING.twoBundle.price / PRICING.twoBundle.themes;
    const threePerTheme =
      PRICING.threeBundle.price / PRICING.threeBundle.themes;

    expect(twoPerTheme).toBeLessThan(singlePerTheme);
    expect(threePerTheme).toBeLessThan(twoPerTheme);
  });
});

describe("ROUTES", () => {
  it("has correct auth routes", () => {
    expect(ROUTES.auth.root).toBe("/auth");
    expect(ROUTES.auth.signIn).toBe("/auth");
    expect(ROUTES.auth.signUp).toBe("/auth");
    expect(ROUTES.auth.callback).toBe("/auth/callback");
  });

  it("generates correct theme routes", () => {
    expect(ROUTES.theme("deep-orbit")).toBe("/themes/deep-orbit");
  });

  it("generates correct lesson routes", () => {
    expect(ROUTES.lesson("deep-orbit", "module-1", "lesson-1")).toBe(
      "/themes/deep-orbit/module-1/lesson-1",
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
  it("is the full theme minus the free first module", () => {
    expect(getPaidLessonCount()).toBe(
      THEME_CONTENT.totalLessonsPerTheme -
        getModuleLessonCount(THEME_CONTENT.freeModuleSlug),
    );
  });

  it("equals 51 for the launched theme", () => {
    // 56 total - 5 in foundations. Pinned so a change to either input has to
    // be a deliberate edit here, not a silent drift in marketing copy.
    expect(getPaidLessonCount()).toBe(51);
  });

  it("names a free module that actually exists in the override table logic", () => {
    // getModuleLessonCount falls back to lessonsPerModule for unknown slugs,
    // so a typo'd freeModuleSlug would silently still return 5. Assert the
    // slug is the one the content corpus ships as module 1.
    expect(THEME_CONTENT.freeModuleSlug).toBe("foundations");
  });

  it("leaves the paid count smaller than the total", () => {
    expect(getPaidLessonCount()).toBeLessThan(
      THEME_CONTENT.totalLessonsPerTheme,
    );
    expect(getPaidLessonCount()).toBeGreaterThan(0);
  });
});
