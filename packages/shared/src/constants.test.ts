import { describe, it, expect } from "vitest";
import { THEME_SLUGS, PRICING, ROUTES, V05_SCOPE } from "./constants";

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

  it("has correct single tier at $79", () => {
    expect(PRICING.single.price).toBe(79);
    expect(PRICING.single.themes).toBe(1);
  });

  it("has correct bundle tiers", () => {
    expect(PRICING.twoBundle.price).toBe(129);
    expect(PRICING.twoBundle.themes).toBe(2);
    expect(PRICING.threeBundle.price).toBe(169);
    expect(PRICING.threeBundle.themes).toBe(3);
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

describe("V05_SCOPE", () => {
  it("scopes to Deep Orbit", () => {
    expect(V05_SCOPE.theme).toBe("deep-orbit");
  });

  it("scopes to 3 modules and 15 lessons", () => {
    expect(V05_SCOPE.modules).toBe(3);
    expect(V05_SCOPE.lessons).toBe(15);
  });
});
