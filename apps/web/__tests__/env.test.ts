import { afterEach, describe, expect, it, vi } from "vitest";
import { assertWebEnv } from "../lib/env";

/** Stub the full happy-path baseline, then let each test poke holes. */
function stubBaseline() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("assertWebEnv", () => {
  it("throws naming the missing always-required var in any environment", () => {
    stubBaseline();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(() => assertWebEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("does not enforce production-only vars outside production", () => {
    stubBaseline();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    // NODE_ENV is "test" here and VERCEL_ENV is unset: dev semantics.
    expect(() => assertWebEnv()).not.toThrow();
  });

  it("enforces the server-side Supabase pair on production deploys", () => {
    stubBaseline();
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => assertWebEnv()).toThrow(
      /SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY/,
    );
  });

  it("treats Vercel previews as non-production even under NODE_ENV=production", () => {
    stubBaseline();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => assertWebEnv()).not.toThrow();
  });

  it("skips entirely during the next build phase", () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => assertWebEnv()).not.toThrow();
  });

  it("warns (never throws) for the degrade-tier vars, naming the consequence", () => {
    stubBaseline();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => assertWebEnv()).not.toThrow();
    expect(warn.mock.calls.flat().join("\n")).toMatch(
      /NEXT_PUBLIC_POSTHOG_KEY.*unobservable/,
    );
  });
});
