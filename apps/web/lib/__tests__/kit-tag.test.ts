import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tagKitEventOnce } from "../kit-tag";

const mockGetSession = vi.fn();
vi.mock("../supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getSession: () => mockGetSession() },
  }),
}));
vi.mock("../api-url", () => ({ getApiUrl: () => "https://api.test" }));

const KEY = "tc_test_tagged";

function session(token: string | null) {
  return { data: { session: token ? { access_token: token } : null } };
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

/**
 * These cover the dedupe trap that made Kit tagging silently and permanently
 * lose users. The flag must be recorded ONLY when Kit actually tagged
 * someone; every other outcome has to leave it unset so a later attempt can
 * still land. Over-tagging is harmless (Kit tags are idempotent);
 * under-tagging is invisible and irreversible.
 */
describe("tagKitEventOnce", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetSession.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tags and records the flag on a real success", async () => {
    mockGetSession.mockResolvedValue(session("tok"));
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { ok: true, event: "paywall_hit" }),
    );

    await tagKitEventOnce("paywall_hit", KEY);

    expect(fetch).toHaveBeenCalledOnce();
    expect(localStorage.getItem(KEY)).toBe("1");
  });

  /**
   * The regression that mattered most. `/api/email` answers
   * 200 {ok:true, skipped:true} when the tag's env var is unconfigured —
   * the DEFAULT on a fresh deploy, since KIT_TAG_PAYWALL_HIT and
   * KIT_TAG_MODULE_1_COMPLETE are absent from .env.example and the
   * deployment guide. Treating that 200 as success burned the flag for
   * every affected browser, and setting the secret later could never
   * recover them.
   */
  it("does NOT record the flag when the API reports the tag was skipped", async () => {
    mockGetSession.mockResolvedValue(session("tok"));
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { ok: true, skipped: true }),
    );

    await tagKitEventOnce("paywall_hit", KEY);

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  /**
   * Signed-out is the PRIMARY path into the paywall notice and into free
   * module 1. Burning the flag on that pass meant the tag never fired for
   * exactly the audience it exists for.
   */
  it("does NOT record the flag when there is no session", async () => {
    mockGetSession.mockResolvedValue(session(null));

    await tagKitEventOnce("paywall_hit", KEY);

    expect(fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("does NOT record the flag on a server error", async () => {
    mockGetSession.mockResolvedValue(session("tok"));
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, {}));

    await tagKitEventOnce("paywall_hit", KEY);

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("does not call the API again once the flag is recorded", async () => {
    localStorage.setItem(KEY, "1");

    await tagKitEventOnce("paywall_hit", KEY);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("retries on a later attempt after a skipped response", async () => {
    // Proves recoverability: configure the env var, and the next visit tags.
    mockGetSession.mockResolvedValue(session("tok"));
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, { ok: true, skipped: true }),
    );
    await tagKitEventOnce("paywall_hit", KEY);
    expect(localStorage.getItem(KEY)).toBeNull();

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    await tagKitEventOnce("paywall_hit", KEY);
    expect(localStorage.getItem(KEY)).toBe("1");
  });
});
