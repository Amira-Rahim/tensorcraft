import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildReadmeTemplate,
  buildRepoName,
  buildOAuthAuthorizeUrl,
  isTransientStatus,
  withRetry,
  GitHubApiError,
} from "../github";

describe("buildRepoName", () => {
  it("prefixes theme slug", () => {
    expect(buildRepoName("deep-orbit")).toBe("tensorcraft-deep-orbit");
  });
});

describe("buildReadmeTemplate", () => {
  it("includes theme badge + Tensorcraft link", () => {
    const md = buildReadmeTemplate({ themeSlug: "deep-orbit" });
    expect(md).toContain("# tensorcraft-deep-orbit");
    expect(md).toContain("img.shields.io/badge/Tensorcraft-");
    expect(md).toContain("https://tensorcraft.app");
    expect(md).toContain("## Modules");
  });

  it("renders provided module list", () => {
    const md = buildReadmeTemplate({
      themeSlug: "neon-protocol",
      modules: [
        { slug: "mod-01", title: "Foundations" },
        { slug: "mod-02", title: "Classification" },
      ],
    });
    expect(md).toContain("`mod-01` — Foundations");
    expect(md).toContain("`mod-02` — Classification");
  });

  it("emits 11 placeholder modules when none provided", () => {
    const md = buildReadmeTemplate({ themeSlug: "signal-ward" });
    expect(md).toContain("Module 01");
    expect(md).toContain("Module 11");
  });
});

describe("buildOAuthAuthorizeUrl", () => {
  it("builds a well-formed authorize URL", () => {
    const url = buildOAuthAuthorizeUrl({
      clientId: "Iv1.abc",
      redirectUri: "http://localhost:3001/api/github/callback",
      state: "user_1.nonce",
    });
    expect(url.startsWith("https://github.com/login/oauth/authorize?")).toBe(
      true,
    );
    expect(url).toContain("client_id=Iv1.abc");
    expect(url).toContain("state=user_1.nonce");
  });
});

describe("isTransientStatus", () => {
  it.each([
    [429, true],
    [500, true],
    [503, true],
    [599, true],
    [400, false],
    [401, false],
    [403, false],
    [404, false],
    [200, false],
  ])("status %i → %s", (status, expected) => {
    expect(isTransientStatus(status)).toBe(expected);
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the value on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient errors up to maxRetries", async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls < 3) throw new GitHubApiError(500, "transient");
      return "ok";
    });

    const promise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
    // fast-forward timers
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-transient errors (403)", async () => {
    const fn = vi.fn(async () => {
      throw new GitHubApiError(403, "forbidden");
    });
    await expect(withRetry(fn, { baseDelayMs: 1 })).rejects.toMatchObject({
      status: 403,
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxRetries attempts", async () => {
    const fn = vi.fn(async () => {
      throw new GitHubApiError(503, "still down");
    });
    const promise = withRetry(fn, { maxRetries: 2, baseDelayMs: 1 });
    // Attach a rejection handler before advancing timers so the rejection
    // is always observed (prevents PromiseRejectionHandledWarning).
    const assertion = expect(promise).rejects.toMatchObject({ status: 503 });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });
});
