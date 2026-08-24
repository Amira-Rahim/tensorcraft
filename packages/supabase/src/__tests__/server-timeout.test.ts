import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Supabase query timeouts.
 *
 * Every Supabase query in the API was unbounded. The sharpest case is the
 * Stripe webhook: it makes several queries inline, so one hung connection
 * holds the handler past Stripe's timeout and earns a re-delivery. Auth
 * middleware is the same shape, where a hang stalls every request behind it.
 *
 * Bounding it at the two client factories rather than at ~7 call sites is
 * deliberate. supabase-js accepts a custom `fetch`, so one change covers every
 * query that exists today AND every query anyone adds later, which a call-site
 * sweep cannot promise.
 */

type ClientOptions = {
  global?: { fetch?: typeof fetch; headers?: Record<string, string> };
};

// Typed explicitly so the package build, which typechecks tests too, can see
// the third argument this file asserts on.
const createClient = vi.hoisted(() =>
  vi.fn((_url: string, _key: string, _options?: ClientOptions) => ({
    from: vi.fn(),
  })),
);
vi.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, key: string, options?: ClientOptions) =>
    createClient(url, key, options),
}));

import { getSupabaseServerClient, getSupabaseAdminClient } from "../server";

beforeEach(() => {
  createClient.mockClear();
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function optionsFrom(call: number): ClientOptions {
  return createClient.mock.calls[call][2] ?? {};
}

describe("Supabase client timeouts", () => {
  it("gives the server client a custom fetch", () => {
    getSupabaseServerClient();

    expect(typeof optionsFrom(0).global?.fetch).toBe("function");
  });

  it("gives the admin client one too", () => {
    getSupabaseAdminClient();

    expect(typeof optionsFrom(0).global?.fetch).toBe("function");
  });

  /**
   * The access token is how the server client scopes queries to a user via
   * RLS. Adding a custom fetch must not drop it, or every authenticated query
   * silently starts running as the service role, which is a privilege
   * escalation rather than a bug.
   */
  it("keeps the Authorization header when scoping to a user", () => {
    getSupabaseServerClient("user-jwt");

    expect(optionsFrom(0).global?.headers?.Authorization).toBe(
      "Bearer user-jwt",
    );
  });

  it("passes an abort signal down to the underlying fetch", async () => {
    const spy = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", spy);

    getSupabaseAdminClient();
    await optionsFrom(0).global!.fetch!(
      "https://example.supabase.co/rest/v1/x",
    );

    const init = spy.mock.calls[0][1] as { signal?: AbortSignal };
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  /**
   * A caller that supplies its own signal wins. Overriding it would silently
   * extend a deadline the caller chose on purpose.
   */
  it("does not override a signal the caller already set", async () => {
    const spy = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", spy);
    const mine = AbortSignal.timeout(50);

    getSupabaseAdminClient();
    await optionsFrom(0).global!.fetch!(
      "https://example.supabase.co/rest/v1/x",
      {
        signal: mine,
      },
    );

    const init = spy.mock.calls[0][1] as { signal?: AbortSignal };
    expect(init.signal).toBe(mine);
  });
});
