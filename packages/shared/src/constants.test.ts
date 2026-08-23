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
  isVatGatedCountry,
  VAT_GATED_COUNTRIES,
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

  it("has correct single tier at $59", () => {
    expect(PRICING.single.price).toBe(59);
    expect(PRICING.single.worlds).toBe(1);
  });

  it("has correct bundle tiers", () => {
    expect(PRICING.twoBundle.price).toBe(99);
    expect(PRICING.twoBundle.worlds).toBe(2);
    expect(PRICING.threeBundle.price).toBe(129);
    expect(PRICING.threeBundle.worlds).toBe(3);
    expect(PRICING.allFive.price).toBe(159);
    expect(PRICING.allFive.worlds).toBe(5);
  });

  it("bundles are cheaper per-world than single", () => {
    const singlePerWorld = PRICING.single.price;
    const twoPerWorld = PRICING.twoBundle.price / PRICING.twoBundle.worlds;
    const threePerWorld =
      PRICING.threeBundle.price / PRICING.threeBundle.worlds;

    expect(twoPerWorld).toBeLessThan(singlePerWorld);
    expect(threePerWorld).toBeLessThan(twoPerWorld);
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

/**
 * VAT-gated regions. Selling to EU/UK consumers creates a VAT obligation from
 * the FIRST sale for a non-EU-established seller (no threshold applies), so
 * checkout is gated to those regions until the entity exists. See the
 * Tier 1-LEGAL decision note in docs/post-launch-backlog.md.
 */
describe("isVatGatedCountry", () => {
  it("gates EU member states", () => {
    expect(isVatGatedCountry("DE")).toBe(true);
    expect(isVatGatedCountry("FR")).toBe(true);
    expect(isVatGatedCountry("IE")).toBe(true);
  });

  it("gates the United Kingdom", () => {
    expect(isVatGatedCountry("GB")).toBe(true);
  });

  it("does not gate the United States", () => {
    expect(isVatGatedCountry("US")).toBe(false);
  });

  it("is case insensitive, since header casing is not guaranteed", () => {
    expect(isVatGatedCountry("de")).toBe(true);
  });

  /**
   * Fail OPEN on an unknown country. Cloudflare sends "XX" for anonymous
   * proxies and the header is absent entirely on a direct-to-origin request.
   * Failing closed would mean any change in edge configuration silently stops
   * every sale worldwide; the webhook billing-country check is the backstop.
   */
  it("does not gate when the country is unknown or absent", () => {
    expect(isVatGatedCountry(undefined)).toBe(false);
    expect(isVatGatedCountry(null)).toBe(false);
    expect(isVatGatedCountry("")).toBe(false);
    expect(isVatGatedCountry("XX")).toBe(false);
  });

  it("covers all 27 EU member states plus the UK", () => {
    expect(VAT_GATED_COUNTRIES).toHaveLength(28);
  });
});
