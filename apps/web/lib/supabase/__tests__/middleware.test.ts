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
const getSession = vi.fn();
// The profiles fallback read. Spied so tests can assert it is NOT hit when the
// JWT already carries the onboarding_completed claim (re-audit N3).
const single = vi.fn(async () => ({ data: { onboarding_completed: true } }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: () => getUser(), getSession: () => getSession() },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => single(),
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

/** A fake JWT (`h.<payload>.s`) whose base64url payload encodes `claims`. */
function tokenWith(claims: Record<string, unknown>) {
  const b64 = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `h.${b64}.s`;
}

/** Session carrying an access token with the given claims (or none). */
function sessionWithClaims(claims?: Record<string, unknown>) {
  getSession.mockResolvedValue({
    data: {
      session: claims ? { access_token: tokenWith(claims) } : null,
    },
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://stub.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "stub-anon-key");
  getUser.mockReset();
  getSession.mockReset();
  single.mockClear();
  // Default: no session token, so the onboarding gate falls back to profiles.
  sessionWithClaims(undefined);
});

describe("signed-in user on /auth", () => {
  it("preserves a query-bearing redirectTo as a real query string", async () => {
    signedIn();
    const dest = "/pricing?plan=single&worlds=deep-orbit";
    const res = await updateSession(
      request(`/auth?redirectTo=${encodeURIComponent(dest)}`),
    );
    const location = res.headers.get("location");
    expect(location).toBe(`${ORIGIN}${dest}`);
  });

  it("allows plain paths containing hyphens (guard must not over-reject)", async () => {
    signedIn();
    const res = await updateSession(
      request(`/auth?redirectTo=${encodeURIComponent("/worlds/deep-orbit")}`),
    );
    expect(res.headers.get("location")).toBe(`${ORIGIN}/worlds/deep-orbit`);
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
      request("/auth/callback?next=%2Fworlds%2Fdeep-orbit"),
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

describe("onboarding gate reads the JWT claim, not profiles (re-audit N3)", () => {
  it("claim onboarding_completed=false → redirect to /onboarding, NO profiles read", async () => {
    signedIn();
    sessionWithClaims({ onboarding_completed: false });
    const res = await updateSession(request("/dashboard"));
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/onboarding");
    expect(location.searchParams.get("redirectTo")).toBe("/dashboard");
    expect(single).not.toHaveBeenCalled();
  });

  it("claim onboarding_completed=true on /onboarding → redirect to /dashboard, NO profiles read", async () => {
    signedIn();
    sessionWithClaims({ onboarding_completed: true });
    const res = await updateSession(request("/onboarding"));
    expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard`);
    expect(single).not.toHaveBeenCalled();
  });

  it("claim onboarding_completed=true on /dashboard → passes through, NO profiles read", async () => {
    signedIn();
    sessionWithClaims({ onboarding_completed: true });
    const res = await updateSession(request("/dashboard"));
    expect(res.headers.get("location")).toBeNull();
    expect(single).not.toHaveBeenCalled();
  });

  it("no claim (hook not enabled / pre-refresh token) → falls back to a profiles read", async () => {
    signedIn();
    sessionWithClaims(undefined); // no access token → claim absent
    // Fallback returns onboarding_completed=true (default `single` mock), so a
    // request to /dashboard passes through — but only after reading profiles.
    const res = await updateSession(request("/dashboard"));
    expect(res.headers.get("location")).toBeNull();
    expect(single).toHaveBeenCalledTimes(1);
  });
});
