import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { decryptToken, encryptToken } from "../token-crypto";
import { GitHubApiError } from "../github";
import {
  resolveGitHubToken,
  storedGitHubAccessToken,
  storeGitHubCredential,
} from "../github-credentials";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  set: vi.fn(),
  eval: vi.fn(),
}));
vi.mock("../github", async (original) => ({
  ...(await original<typeof import("../github")>()),
  refreshUserToken: mocks.refresh,
}));
vi.mock("../redis", () => ({
  getRedis: () => ({ set: mocks.set, eval: mocks.eval }),
}));
const pair = (access = "ghu_old", refresh = "ghr_old") => ({
  access_token: access,
  refresh_token: refresh,
  token_type: "bearer",
  expires_in: 28800,
  refresh_token_expires_in: 15897600,
});
function database(initial: string | null) {
  let stored = initial;
  const updates: unknown[] = [];
  let failWrites = 0;
  let disconnectDuringWrite = false;
  let ambiguousWrite = false;
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { github_token: stored }, error: null }),
        }),
      }),
      update: (patch: { github_token: string }) => ({
        eq: (_id: string, user: string) => ({
          eq: (_column: string, old: string) => ({
            select: () => ({
              maybeSingle: async () => {
                expect(user).toBe("u1");
                updates.push(patch);
                if (disconnectDuringWrite) stored = null;
                if (failWrites-- > 0)
                  return { data: null, error: { message: "offline" } };
                if (stored !== old) return { data: null, error: null };
                stored = patch.github_token;
                if (ambiguousWrite)
                  return { data: null, error: { message: "response lost" } };
                return { data: { github_token: stored }, error: null };
              },
            }),
          }),
        }),
      }),
    }),
  };
  return {
    client: client as unknown as Parameters<typeof resolveGitHubToken>[0],
    updates,
    get stored() {
      return stored;
    },
    set stored(value) {
      stored = value;
    },
    failWrites: (count: number) => {
      failWrites = count;
    },
    disconnectDuringWrite: () => {
      disconnectDuringWrite = true;
    },
    ambiguousWrite: () => {
      ambiguousWrite = true;
    },
  };
}
beforeEach(() => {
  vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "test-only-key");
  vi.stubEnv("GITHUB_CLIENT_ID", "test-client");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "test-secret");
  mocks.refresh.mockReset().mockResolvedValue(pair("ghu_new", "ghr_new"));
  mocks.set.mockReset().mockResolvedValue("OK");
  mocks.eval.mockReset().mockResolvedValue(1);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
const expired = () => storeGitHubCredential(pair(), Date.now() - 9 * 3600_000);

describe("GitHub credential renewal", () => {
  it("encrypts both tokens and expiry together without changing legacy handling", async () => {
    const stored = storeGitHubCredential(pair());
    expect(stored.startsWith("v1:")).toBe(true);
    expect(stored).not.toContain("ghr_old");
    expect(storedGitHubAccessToken(stored)).toBe("ghu_old");
    expect(JSON.parse(decryptToken(stored)!)).toMatchObject({
      refreshToken: "ghr_old",
      kind: "github-oauth-v1",
    });
    const db = database(stored);
    expect(await resolveGitHubToken(db.client, "u1", stored)).toBe("ghu_old");
    expect(
      await resolveGitHubToken(db.client, "u1", encryptToken("gho_legacy")),
    ).toBe("gho_legacy");
    expect(await resolveGitHubToken(db.client, "u1", "gho_plain_legacy")).toBe(
      "gho_plain_legacy",
    );
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("refuses to store refresh credentials unencrypted or without expiry", () => {
    expect(() =>
      storeGitHubCredential({ ...pair(), expires_in: undefined }),
    ).toThrow();
    vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "");
    expect(() => storeGitHubCredential(pair())).toThrow();
  });
  it("renews expired tokens and saves the rotated refresh token before use", async () => {
    const stored = expired(),
      db = database(stored);
    expect(await resolveGitHubToken(db.client, "u1", stored)).toBe("ghu_new");
    expect(mocks.refresh).toHaveBeenCalledExactlyOnceWith({
      clientId: "test-client",
      clientSecret: "test-secret",
      refreshToken: "ghr_old",
    });
    expect(JSON.parse(decryptToken(db.stored!)!)).toMatchObject({
      accessToken: "ghu_new",
      refreshToken: "ghr_new",
    });
    expect(db.updates).toHaveLength(1);
    expect(mocks.eval).toHaveBeenCalledWith(
      expect.stringContaining("ARGV[1]"),
      ["github:refresh:u1"],
      [expect.any(String)],
    );
  });
  it("uses the latest database row after taking the lock", async () => {
    const old = expired(),
      db = database(
        storeGitHubCredential(pair("ghu_elsewhere", "ghr_elsewhere")),
      );
    expect(await resolveGitHubToken(db.client, "u1", old)).toBe(
      "ghu_elsewhere",
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("allows a concurrent waiter to use the winner without reusing a refresh token", async () => {
    vi.useFakeTimers();
    const old = expired(),
      db = database(old);
    let acquired = false;
    mocks.set.mockImplementation(async () => {
      if (acquired) return null;
      acquired = true;
      return "OK";
    });
    let finish!: (value: ReturnType<typeof pair>) => void;
    mocks.refresh.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = resolveGitHubToken(db.client, "u1", old);
    await vi.advanceTimersByTimeAsync(0);
    const second = resolveGitHubToken(db.client, "u1", old);
    finish(pair("ghu_new", "ghr_new"));
    await vi.advanceTimersByTimeAsync(400);
    expect(await Promise.all([first, second])).toEqual(["ghu_new", "ghu_new"]);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
  it("fails closed when Redis cannot serialize refreshes", async () => {
    const old = expired(),
      db = database(old);
    mocks.set.mockRejectedValue(new Error("offline"));
    await expect(
      resolveGitHubToken(db.client, "u1", old),
    ).rejects.toMatchObject({ status: 503 });
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(db.stored).toBe(old);
  });
  it("bounds waiting for another machine and leaves credentials untouched", async () => {
    vi.useFakeTimers();
    const old = expired(),
      db = database(old);
    mocks.set.mockResolvedValue(null);
    const pending = expect(
      resolveGitHubToken(db.client, "u1", old),
    ).rejects.toMatchObject({ status: 503 });
    await vi.runAllTimersAsync();
    await pending;
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(db.stored).toBe(old);
  });
  it("does not restore a connection that was disconnected during renewal", async () => {
    const old = expired(),
      db = database(old);
    db.disconnectDuringWrite();
    await expect(
      resolveGitHubToken(db.client, "u1", old),
    ).rejects.toMatchObject({ status: 401 });
    expect(db.stored).toBeNull();
  });
  it("retries only storage after a database failure", async () => {
    const old = expired(),
      db = database(old);
    db.failWrites(1);
    expect(await resolveGitHubToken(db.client, "u1", old)).toBe("ghu_new");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(db.updates).toHaveLength(2);
  });
  it("recovers when a successful storage response was lost", async () => {
    const old = expired(),
      db = database(old);
    db.ambiguousWrite();
    expect(await resolveGitHubToken(db.client, "u1", old)).toBe("ghu_new");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(db.updates).toHaveLength(1);
  });
  it("does not return a renewed token if it could not be saved", async () => {
    const old = expired(),
      db = database(old);
    db.failWrites(2);
    await expect(
      resolveGitHubToken(db.client, "u1", old),
    ).rejects.toMatchObject({ status: 503 });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(db.stored).toBe(old);
  });
  it("distinguishes revoked refresh authorization from a temporary upstream error", async () => {
    const old = expired(),
      db = database(old);
    mocks.refresh.mockRejectedValueOnce(new GitHubApiError(401, "invalid"));
    await expect(
      resolveGitHubToken(db.client, "u1", old),
    ).rejects.toMatchObject({ status: 401 });
    mocks.refresh.mockRejectedValueOnce(new GitHubApiError(502, "upstream"));
    await expect(
      resolveGitHubToken(db.client, "u1", old),
    ).rejects.toMatchObject({ status: 503 });
    expect(db.stored).toBe(old);
  });
  it("requires reconnect after refresh expiry without calling GitHub", async () => {
    const old = storeGitHubCredential(pair(), Date.now() - 200 * 86400_000),
      db = database(old);
    await expect(
      resolveGitHubToken(db.client, "u1", old),
    ).rejects.toMatchObject({ status: 401 });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("treats corrupt credentials as disconnected", async () => {
    const bad = encryptToken('{"kind":"github-oauth-v1"}'),
      db = database(bad);
    expect(await resolveGitHubToken(db.client, "u1", bad)).toBeNull();
    expect(storedGitHubAccessToken(bad)).toBeNull();
  });
});
