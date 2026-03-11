import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ROUTES } from "./constants";

const WEB_APP_DIR = path.resolve(__dirname, "../../../apps/web/app");

function hasPage(dir: string): boolean {
  const fullPath = dir === "" ? WEB_APP_DIR : path.join(WEB_APP_DIR, dir);
  return (
    fs.existsSync(path.join(fullPath, "page.tsx")) ||
    fs.existsSync(path.join(fullPath, "page.ts"))
  );
}

describe("ROUTES map to actual pages", () => {
  it("home (/) has a page", () => {
    expect(hasPage("")).toBe(true);
  });

  it("auth.signIn has a page", () => {
    expect(hasPage("auth/sign-in")).toBe(true);
  });

  it("auth.signUp has a page", () => {
    expect(hasPage("auth/sign-up")).toBe(true);
  });

  it("auth.callback has a route handler", () => {
    const fullPath = path.join(WEB_APP_DIR, "auth/callback");
    const hasRoute =
      fs.existsSync(path.join(fullPath, "route.ts")) ||
      fs.existsSync(path.join(fullPath, "route.tsx"));
    expect(hasRoute).toBe(true);
  });

  it.todo("pricing page has a page (/pricing)");
  it.todo("dashboard page has a page (/dashboard)");
  it.todo("settings page has a page (/settings)");

  it("terms page exists", () => {
    expect(hasPage("terms")).toBe(true);
  });

  it("privacy page exists", () => {
    expect(hasPage("privacy")).toBe(true);
  });

  it("onboarding page exists", () => {
    expect(hasPage("onboarding")).toBe(true);
  });
});

describe("ROUTES constant values are well-formed", () => {
  it("all static routes start with /", () => {
    expect(ROUTES.home).toBe("/");
    expect(ROUTES.pricing).toMatch(/^\//);
    expect(ROUTES.dashboard).toMatch(/^\//);
    expect(ROUTES.settings).toMatch(/^\//);
    expect(ROUTES.auth.signIn).toMatch(/^\//);
    expect(ROUTES.auth.signUp).toMatch(/^\//);
  });

  it("dynamic route functions produce valid paths", () => {
    expect(ROUTES.theme("deep-orbit")).toBe("/themes/deep-orbit");
    expect(ROUTES.module("deep-orbit", "foundations")).toBe(
      "/themes/deep-orbit/foundations",
    );
    expect(ROUTES.lesson("deep-orbit", "foundations", "intro-to-tensors")).toBe(
      "/themes/deep-orbit/foundations/intro-to-tensors",
    );
  });
});
