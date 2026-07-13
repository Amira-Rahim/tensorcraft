// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Gate for the guest-401 toast fix (2026-07-13): a 401 must only announce
// "session expired" when a session was actually attached to the request.
// Guests hit 401s on every fire-and-forget call (attempt recording, GitHub
// commit) as the normal case and must not see the toast.

let session: { access_token: string } | null = null;

vi.mock("./supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: async () => ({ data: { session } }),
    },
  }),
}));
vi.mock("./api-url", () => ({ getApiUrl: () => "http://api.test" }));

import { apiFetch } from "./api-fetch";

describe("apiFetch 401 session-toast gating", () => {
  let dispatchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unauthorized", { status: 401 })),
    );
    dispatchSpy = vi.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("does NOT emit tc:session-expired for guests (no session attached)", async () => {
    session = null;
    const res = await apiFetch("/api/github/commit", { method: "POST" });
    expect(res.status).toBe(401);
    const events = dispatchSpy.mock.calls.map(
      (c: [Event]) => (c[0] as CustomEvent).type,
    );
    expect(events).not.toContain("tc:session-expired");
  });

  it("emits tc:session-expired when an attached session gets a 401", async () => {
    session = { access_token: "stale-token" };
    const res = await apiFetch("/api/github/commit", { method: "POST" });
    expect(res.status).toBe(401);
    const events = dispatchSpy.mock.calls.map(
      (c: [Event]) => (c[0] as CustomEvent).type,
    );
    expect(events).toContain("tc:session-expired");
  });
});
