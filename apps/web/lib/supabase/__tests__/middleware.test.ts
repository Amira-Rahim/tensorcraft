import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Auth-middleware redirect gates (2026-07-19 UX audit).
 *
 * Three bugs lived here: startsWith("/auth") swallowed /auth/callback so
 * signed-in magic-link clicks lost their destination; redirectTo carried
 * only the pathname so checkout's /pricing?plan=... roundtrip stranded
 * buyers; and url.pathname = redirectTo percent-encoded a "?" into the
 * path and 404'd. These tests pin all three, plus the same-origin guard.
 */

const getUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: () => getUser() },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { onboarding_completed: true } }),
        }),
      }),
    }),
  }),
}));

import { updateSession } from "../middleware";

const ORIGIN = "https://tensorcraft.app";

function request(path: string) {
  return new NextRequest(`${ORIGIN}${path}`);
}

function signedIn() {
  getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
}

function signedOut() {
  getUser.mockResolvedValue({ data: { user: null }, error: null });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://stub.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "stub-anon-key");
  getUser.mockReset();
});

describe("signed-in user on /auth", () => {
  it("preserves a query-bearing redirectTo as a real query string", async () => {
    signedIn();
    const dest = "/pricing?plan=single&themes=deep-orbit";
    const res = await updateSession(
      request(`/auth?redirectTo=${encodeURIComponent(dest)}`),
    );
    const location = res.headers.get("location");
    expect(location).toBe(`${ORIGIN}${dest}`);
  });

  it("allows plain paths containing hyphens (guard must not over-reject)", async () => {
    signedIn();
    const res = await updateSession(
      request(`/auth?redirectTo=${encodeURIComponent("/themes/deep-orbit")}`),
    );
    expect(res.headers.get("location")).toBe(`${ORIGIN}/themes/deep-orbit`);
  });

  it.each([
    ["protocol-relative", "//evil.com"],
    ["backslash protocol-relative", "/\\evil.com"],
    ["absolute url", "https://evil.com"],
    ["newline injection", "/pricing\ntrick"],
  ])(
    "rejects %s redirectTo and falls back to /dashboard",
    async (_label, evil) => {
      signedIn();
      const res = await updateSession(
        request(`/auth?redirectTo=${encodeURIComponent(evil)}`),
      );
      expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard`);
    },
  );
});

describe("auth sub-routes are not swallowed", () => {
  it("signed-in user on /auth/callback is not redirected by the middleware", async () => {
    signedIn();
    const res = await updateSession(
      request("/auth/callback?next=%2Fthemes%2Fdeep-orbit"),
    );
    expect(res.headers.get("location")).toBeNull();
  });

  it("signed-in user on /auth/sign-out is not redirected by the middleware", async () => {
    signedIn();
    const res = await updateSession(request("/auth/sign-out"));
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("signed-out user on protected routes", () => {
  it("redirectTo carries pathname AND query", async () => {
    signedOut();
    const res = await updateSession(request("/dashboard?tab=streak"));
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/auth");
    expect(location.searchParams.get("redirectTo")).toBe(
      "/dashboard?tab=streak",
    );
  });
});
