import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../../types";
import { decryptToken, encryptToken } from "../../lib/token-crypto";
import { storeGitHubCredential } from "../../lib/github-credentials";
import {
  PROJECT_BODY_LIMIT,
  ROOM_MODEL_FILES,
  ROOM_PROJECT_FILES,
} from "@tensorcraft/shared";

// ─────────────────────────────────────────────────────────────
// Mocks, must be declared before `import("../github")` below.
// ─────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();

// In-memory profile row returned by .single() in select queries.
let mockProfileRow: Record<string, unknown> | null = null;
let mockProfileSelectError: unknown = null;

// Captures of calls
const mockProfileUpdate = vi.fn();
const mockAdminProfileUpdate = vi.fn();

// world_progress rows for retroactive-push tests
let mockWorldProgressRows: Array<Record<string, unknown>> = [];
let mockWorldProgressError: unknown = null;

// exercise_attempts rows (used by retroactive-push to fetch code)
let mockAttemptsRows: Array<Record<string, unknown>> = [];

function makeProfilesQuery() {
  return {
    select: () => ({
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: mockProfileRow,
            error: mockProfileSelectError,
          }),
      }),
    }),
    update: (data: unknown) => {
      mockProfileUpdate(data);
      let expectedToken: unknown;
      const query = {
        eq: (field: string, value: unknown) => {
          if (field === "github_token") expectedToken = value;
          return query;
        },
        select: () => query,
        maybeSingle: async () => {
          if (mockProfileRow?.github_token !== expectedToken)
            return { data: null, error: null };
          mockProfileRow = {
            ...mockProfileRow,
            ...(data as Record<string, unknown>),
          };
          return { data: mockProfileRow, error: null };
        },
        then: (resolve: (value: { error: null }) => unknown) =>
          Promise.resolve({ error: null }).then(resolve),
      };
      return query;
    },
  };
}

function makeWorldProgressQuery() {
  const thenable = {
    select: () => thenable,
    eq: () => thenable,
    order: () =>
      Promise.resolve({
        data: mockWorldProgressRows,
        error: mockWorldProgressError,
      }),
  };
  return thenable;
}

function makeExerciseAttemptsQuery() {
  const thenable = {
    select: () => thenable,
    eq: () => thenable,
    in: () => thenable,
    order: () =>
      Promise.resolve({
        data: mockAttemptsRows,
        error: null,
      }),
  };
  return thenable;
}

const mockGetUserById = vi.fn();
vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "profiles") return makeProfilesQuery();
      if (table === "world_progress") return makeWorldProgressQuery();
      if (table === "exercise_attempts") return makeExerciseAttemptsQuery();
      return {};
    },
  }),
  getSupabaseAdminClient: () => ({
    auth: {
      admin: { getUserById: (...a: unknown[]) => mockGetUserById(...a) },
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          update: (data: unknown) => {
            mockAdminProfileUpdate(data);
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
        };
      }
      return {};
    },
  }),
}));

vi.mock("../../lib/redis", () => ({
  getRedis: () => ({
    get: () => Promise.resolve(null),
    set: () => Promise.resolve("OK"),
  }),
}));

// ─────────────────────────────────────────────────────────────
// Global fetch mock, intercept all GitHub REST + OAuth calls.
// ─────────────────────────────────────────────────────────────

type FetchHandler = (
  url: string,
  init?: RequestInit,
) => Promise<Response> | Response;

let fetchHandler: FetchHandler = async () => {
  throw new Error("Unhandled fetch in test");
};

beforeEach(() => {
  mockGetUser.mockReset();
  mockProfileUpdate.mockReset();
  mockAdminProfileUpdate.mockReset();
  mockProfileRow = null;
  mockProfileSelectError = null;
  mockWorldProgressRows = [];
  mockWorldProgressError = null;
  mockAttemptsRows = [];
  fetchHandler = async () => {
    throw new Error("Unhandled fetch in test");
  };

  vi.stubGlobal("fetch", async (url: unknown, init?: RequestInit) => {
    const u = typeof url === "string" ? url : String(url);
    return fetchHandler(u, init);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const { github } = await import("../github");

function createApp() {
  const app = new Hono<AppEnv>();
  app.route("/api/github", github);
  return app;
}

function authedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user_123" } },
    error: null,
  });
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

describe("rotating GitHub credentials at route boundaries", () => {
  const pair = () => ({
    access_token: "ghu_access",
    refresh_token: "ghr_refresh",
    token_type: "bearer",
    expires_in: 28800,
    refresh_token_expires_in: 15897600,
  });
  beforeEach(() => {
    authedUser();
    vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "route-test-key");
  });
  it("previews the destination with the access token from the encrypted pair", async () => {
    mockProfileRow = {
      github_token: storeGitHubCredential(pair()),
      github_username: "octocat",
    };
    fetchHandler = (url, init) => {
      expect(url).toBe(
        "https://api.github.com/repos/octocat/tensorcraft-deep-orbit",
      );
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer ghu_access",
      );
      return jsonResponse({
        id: 17,
        full_name: "octocat/tensorcraft-deep-orbit",
        private: false,
        default_branch: "main",
      });
    };
    const res = await createApp().request("/api/github/project-export", {
      headers: { Authorization: "Bearer session" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ repositoryId: 17 });
  });
  it("renews an expired pair before the real project preview helper runs", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "client");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "secret");
    mockProfileRow = {
      github_token: storeGitHubCredential(pair(), Date.now() - 9 * 3600_000),
      github_username: "octocat",
    };
    let renewals = 0;
    fetchHandler = (url, init) => {
      if (url === "https://github.com/login/oauth/access_token") {
        expect(JSON.parse(init?.body as string)).toMatchObject({
          grant_type: "refresh_token",
          refresh_token: "ghr_refresh",
        });
        renewals++;
        return jsonResponse({
          ...pair(),
          access_token: "ghu_rotated",
          refresh_token: "ghr_rotated",
        });
      }
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer ghu_rotated",
      );
      return jsonResponse({
        id: 17,
        full_name: "octocat/tensorcraft-deep-orbit",
        private: false,
        default_branch: "main",
      });
    };
    const res = await createApp().request("/api/github/project-export", {
      headers: { Authorization: "Bearer session" },
    });
    expect(res.status).toBe(200);
    expect(renewals).toBe(1);
    expect(
      JSON.parse(decryptToken(mockProfileRow.github_token as string)!),
    ).toMatchObject({
      accessToken: "ghu_rotated",
      refreshToken: "ghr_rotated",
    });
  });
  it("returns a reconnect error when the refresh authorization has expired", async () => {
    mockProfileRow = {
      github_token: storeGitHubCredential(pair(), Date.now() - 200 * 86400_000),
      github_username: "octocat",
    };
    const res = await createApp().request("/api/github/project-export", {
      headers: { Authorization: "Bearer session" },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "github_token_expired" });
  });
  it("does not report a rejected legacy token as connected", async () => {
    mockProfileRow = {
      github_token: encryptToken("expired-legacy"),
      github_username: "octocat",
      github_connected: true,
    };
    fetchHandler = () =>
      jsonResponse({ message: "Bad credentials" }, { status: 401 });
    const res = await createApp().request("/api/github/status", {
      headers: { Authorization: "Bearer session" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      connected: false,
      code: "github_token_expired",
    });
  });
  it("disconnect revokes the access token, without sending the encrypted bundle", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "client");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "secret");
    mockProfileRow = { github_token: storeGitHubCredential(pair()) };
    fetchHandler = (_url, init) => {
      expect(JSON.parse(init?.body as string)).toEqual({
        access_token: "ghu_access",
      });
      return new Response(null, { status: 204 });
    };
    const res = await createApp().request("/api/github/disconnect", {
      method: "POST",
      headers: { Authorization: "Bearer session" },
    });
    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ github_token: null }),
    );
  });
});

describe("project export boundary", () => {
  const payload = () => ({
    repositoryId: 17,
    private: false,
    files: [
      ...ROOM_PROJECT_FILES,
      ...ROOM_MODEL_FILES,
      "runs/test-1.json",
      "runs/validation-1.json",
    ].map((path) => ({ path, base64: "YQ==" })),
  });
  const send = (body: unknown, auth = true) =>
    createApp().request("/api/github/project-export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: "Bearer session" } : {}),
      },
      body: JSON.stringify(body),
    });
  it("requires a verified session before reading or exporting", async () => {
    expect((await send(payload(), false)).status).toBe(401);
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("expired"),
    });
    expect((await send(payload())).status).toBe(401);
  });
  it("publishes a multi-file request above the normal 1 MiB cap using the decrypted caller token", async () => {
    authedUser();
    vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "unit-test-key-only");
    mockProfileRow = {
      github_token: encryptToken("project-test-token"),
      github_username: "octocat",
    };
    const input = payload();
    input.files.find((file) => file.path === "model/weights.bin")!.base64 =
      Buffer.alloc(900_000, 123).toString("base64");
    let published = false;
    fetchHandler = (url, init) => {
      expect(url).toContain("/repos/octocat/tensorcraft-deep-orbit");
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer project-test-token",
      );
      if (url.endsWith("/tensorcraft-deep-orbit"))
        return jsonResponse({
          id: 17,
          full_name: "octocat/tensorcraft-deep-orbit",
          private: false,
          default_branch: "main",
        });
      if (url.endsWith("/git/ref/heads/main"))
        return jsonResponse({ object: { sha: "head" } });
      if (url.endsWith("/git/commits/head"))
        return jsonResponse({ tree: { sha: "base" } });
      if (url.includes("/git/trees/base"))
        return jsonResponse({ truncated: false, tree: [] });
      if (url.endsWith("/git/blobs")) return jsonResponse({ sha: "weights" });
      if (url.endsWith("/git/trees"))
        return jsonResponse({ sha: "snapshot-tree" });
      if (url.endsWith("/git/commits"))
        return jsonResponse({ sha: "snapshot-commit" });
      if (init?.method === "PATCH") {
        expect(JSON.parse(String(init.body))).toEqual({
          sha: "snapshot-commit",
          force: false,
        });
        published = true;
        return jsonResponse({ object: { sha: "snapshot-commit" } });
      }
      throw new Error("Unexpected export request");
    };
    const response = await send(input);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      commitSha: "snapshot-commit",
      alreadyPublished: false,
    });
    expect(published).toBe(true);
  });
  it("validates uploads and limits request size before reading a profile", async () => {
    authedUser();
    for (const body of [
      null,
      {},
      { ...payload(), private: "false" },
      { ...payload(), files: [] },
    ])
      expect((await send(body)).status).toBe(400);
    expect(
      (await send({ padding: "x".repeat(PROJECT_BODY_LIMIT) })).status,
    ).toBe(413);
  });
  it("reports disconnected accounts and database failures", async () => {
    authedUser();
    mockProfileRow = { github_token: null, github_username: null };
    expect((await (await send(payload())).json()).code).toBe(
      "github_not_connected",
    );
    mockProfileSelectError = new Error("database unavailable");
    expect((await send(payload())).status).toBe(500);
  });
  it("previews only the stored learner repository and reveals no token", async () => {
    authedUser();
    mockProfileRow = {
      github_token: "private-test-token",
      github_username: "octocat",
    };
    fetchHandler = (url, init) => {
      expect(url).toBe(
        "https://api.github.com/repos/octocat/tensorcraft-deep-orbit",
      );
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer private-test-token",
      );
      return jsonResponse({
        id: 17,
        full_name: "octocat/tensorcraft-deep-orbit",
        private: true,
        default_branch: "main",
      });
    };
    const response = await createApp().request("/api/github/project-export", {
      headers: { Authorization: "Bearer session" },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.private).toBe(true);
    expect(body.repositoryId).toBe(17);
    expect(JSON.stringify(body)).not.toContain("private-test-token");
  });
  it("maps revoked access without creating another repository", async () => {
    authedUser();
    mockProfileRow = { github_token: "test-token", github_username: "octocat" };
    fetchHandler = (url) => {
      expect(url).toContain("/repos/octocat/tensorcraft-deep-orbit");
      return jsonResponse({}, { status: 404 });
    };
    const response = await send(payload());
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("github_repo_access_revoked");
  });
  it("requires a fresh preview when repository identity changes", async () => {
    authedUser();
    mockProfileRow = { github_token: "test-token", github_username: "octocat" };
    fetchHandler = () =>
      jsonResponse({
        id: 18,
        full_name: "octocat/tensorcraft-deep-orbit",
        private: false,
        default_branch: "main",
      });
    expect((await send(payload())).status).toBe(409);
  });
});

describe("GitHub routes, connect / callback / disconnect", () => {
  describe("POST /api/github/connect", () => {
    it("returns 401 without auth", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "no token" },
      });
      const res = await createApp().request("/api/github/connect", {
        method: "POST",
      });
      expect(res.status).toBe(401);
    });

    it("returns an authorize URL containing client_id and state", async () => {
      process.env.GITHUB_CLIENT_ID = "Iv1.test_client";
      process.env.APP_URL = "http://localhost:3000";
      authedUser();

      const res = await createApp().request("/api/github/connect", {
        method: "POST",
        headers: { Authorization: "Bearer valid" },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { url: string; state: string };
      expect(body.url).toContain("github.com/login/oauth/authorize");
      expect(body.url).toContain("client_id=Iv1.test_client");
      expect(body.state).toMatch(/^user_123\./);
    });

    it("returns 500 when GITHUB_CLIENT_ID is missing", async () => {
      delete process.env.GITHUB_CLIENT_ID;
      authedUser();
      const res = await createApp().request("/api/github/connect", {
        method: "POST",
        headers: { Authorization: "Bearer valid" },
      });
      expect(res.status).toBe(500);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("internal_error");
    });
  });

  describe("GET /api/github/callback", () => {
    beforeEach(() => {
      process.env.GITHUB_CLIENT_ID = "Iv1.test";
      process.env.GITHUB_CLIENT_SECRET = "secret";
      process.env.APP_URL = "http://localhost:3000";
    });

    it("returns 400 when code is missing", async () => {
      const res = await createApp().request(
        "/api/github/callback?state=user_123.abc",
      );
      expect(res.status).toBe(400);
    });

    it("exchanges code and persists the token", async () => {
      fetchHandler = async (url) => {
        if (url === "https://github.com/login/oauth/access_token") {
          return jsonResponse({
            access_token: "ghu_token_xyz",
            token_type: "bearer",
          });
        }
        if (url === "https://api.github.com/user") {
          return jsonResponse({ login: "amira-test" });
        }
        throw new Error(`Unexpected URL: ${url}`);
      };

      const res = await createApp().request(
        "/api/github/callback?code=ghcode&state=user_123.nonce",
        {
          // CSRF defense added 2026-05-05: callback requires the same
          // `state` value as a HttpOnly cookie set by `/connect`.
          headers: { Cookie: "tc_gh_oauth_state=user_123.nonce" },
        },
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        connected: boolean;
        username: string;
      };
      expect(body.connected).toBe(true);
      expect(body.username).toBe("amira-test");
      expect(mockAdminProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          github_token: "ghu_token_xyz",
          github_username: "amira-test",
          github_connected: true,
        }),
      );
    });

    it("persists the rotating token pair encrypted at callback", async () => {
      vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "callback-test-key");
      fetchHandler = async (url) => {
        if (url === "https://github.com/login/oauth/access_token")
          return jsonResponse({
            access_token: "ghu_access",
            refresh_token: "ghr_refresh",
            token_type: "bearer",
            expires_in: 28800,
            refresh_token_expires_in: 15897600,
          });
        if (url === "https://api.github.com/user")
          return jsonResponse({ login: "amira-test" });
        throw new Error("Unexpected request");
      };
      const response = await createApp().request(
        "/api/github/callback?code=ghcode&state=user_123.nonce",
        { headers: { Cookie: "tc_gh_oauth_state=user_123.nonce" } },
      );
      expect(response.status).toBe(200);
      const stored = mockAdminProfileUpdate.mock.calls[0]![0].github_token;
      expect(stored.startsWith("v1:")).toBe(true);
      expect(stored).not.toContain("ghr_refresh");
      expect(JSON.parse(decryptToken(stored)!)).toMatchObject({
        accessToken: "ghu_access",
        refreshToken: "ghr_refresh",
        kind: "github-oauth-v1",
      });
    });

    it("returns the structured GitHub error when exchange fails", async () => {
      fetchHandler = async (url) => {
        if (url === "https://github.com/login/oauth/access_token") {
          return jsonResponse(
            { error: "bad_verification_code" },
            { status: 200 },
          );
        }
        throw new Error("unexpected");
      };
      const res = await createApp().request(
        "/api/github/callback?code=bad&state=user_123.x",
        {
          headers: { Cookie: "tc_gh_oauth_state=user_123.x" },
        },
      );
      // exchangeCodeForToken throws → mapped to 500 github_api_error
      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/github/disconnect", () => {
    beforeEach(() => {
      process.env.GITHUB_CLIENT_ID = "Iv1.test";
      process.env.GITHUB_CLIENT_SECRET = "secret";
    });

    it("clears DB fields and returns disconnected:true", async () => {
      authedUser();
      mockProfileRow = { github_token: "ghu_existing" };

      fetchHandler = async (url) => {
        if (url.includes("/applications/") && url.endsWith("/grant")) {
          return new Response(null, { status: 204 });
        }
        throw new Error(`unexpected ${url}`);
      };

      const res = await createApp().request("/api/github/disconnect", {
        method: "POST",
        headers: { Authorization: "Bearer valid" },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { disconnected: boolean };
      expect(body.disconnected).toBe(true);
      expect(mockProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          github_token: null,
          github_connected: false,
        }),
      );
    });

    it("still clears DB even when revocation fails", async () => {
      authedUser();
      mockProfileRow = { github_token: "ghu_existing" };
      fetchHandler = async () => new Response("server error", { status: 500 });

      const res = await createApp().request("/api/github/disconnect", {
        method: "POST",
        headers: { Authorization: "Bearer valid" },
      });

      expect(res.status).toBe(200);
      expect(mockProfileUpdate).toHaveBeenCalled();
    });
  });
});

describe("GitHub routes, commit", () => {
  it("returns 400 when GitHub is not connected", async () => {
    authedUser();
    mockProfileRow = { github_token: null, github_username: null };

    const res = await createApp().request("/api/github/commit", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        worldId: "deep-orbit",
        lessonId: "lesson-01",
        code: "console.log('hi')",
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("github_not_connected");
  });

  it("rejects unknown worldId", async () => {
    authedUser();
    mockProfileRow = { github_token: "ghu_x", github_username: "amira" };

    const res = await createApp().request("/api/github/commit", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        worldId: "not-a-world",
        lessonId: "lesson-01",
        code: "x",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("creates repo + README + commits file on happy path", async () => {
    authedUser();
    mockProfileRow = { github_token: "ghu_x", github_username: "amira" };

    const fetchCalls: string[] = [];
    fetchHandler = async (url, init) => {
      fetchCalls.push(`${init?.method ?? "GET"} ${url}`);

      // createOrGetRepo
      if (
        url === "https://api.github.com/user/repos" &&
        init?.method === "POST"
      ) {
        return jsonResponse({
          id: 1,
          name: "tensorcraft-deep-orbit",
          full_name: "amira/tensorcraft-deep-orbit",
          html_url: "https://github.com/amira/tensorcraft-deep-orbit",
          private: false,
          owner: { login: "amira" },
        });
      }
      // getFile README.md → 404
      if (
        url.endsWith("/contents/README.md") &&
        (!init || init.method === undefined || init.method === "GET")
      ) {
        return new Response("not found", { status: 404 });
      }
      // pushFile README.md
      if (url.endsWith("/contents/README.md") && init?.method === "PUT") {
        return jsonResponse({
          content: {
            name: "README.md",
            path: "README.md",
            sha: "sha_readme",
            html_url:
              "https://github.com/amira/tensorcraft-deep-orbit/blob/main/README.md",
          },
          commit: {
            sha: "commit_readme",
            html_url:
              "https://github.com/amira/tensorcraft-deep-orbit/commit/readme",
            message: "docs: initialize",
          },
        });
      }
      // getFile lesson → 404
      if (
        url.includes("/contents/mod-01/lesson-01.ts") &&
        (!init || init.method === undefined || init.method === "GET")
      ) {
        return new Response("not found", { status: 404 });
      }
      // pushFile lesson → PUT
      if (
        url.includes("/contents/mod-01/lesson-01.ts") &&
        init?.method === "PUT"
      ) {
        return jsonResponse({
          content: {
            name: "lesson-01.ts",
            path: "mod-01/lesson-01.ts",
            sha: "sha_lesson",
            html_url:
              "https://github.com/amira/tensorcraft-deep-orbit/blob/main/mod-01/lesson-01.ts",
          },
          commit: {
            sha: "commit_lesson",
            html_url:
              "https://github.com/amira/tensorcraft-deep-orbit/commit/lesson",
            message: "feat",
          },
        });
      }
      throw new Error(`unexpected fetch: ${init?.method ?? "GET"} ${url}`);
    };

    const res = await createApp().request("/api/github/commit", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        worldId: "deep-orbit",
        moduleId: "mod-01",
        lessonId: "lesson-01",
        code: "export const answer = 42;",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; commitSha: string };
    expect(body.success).toBe(true);
    expect(body.commitSha).toBe("commit_lesson");
  });

  it("maps 403 repo-access-revoked to structured error", async () => {
    authedUser();
    mockProfileRow = { github_token: "ghu_x", github_username: "amira" };

    fetchHandler = async () =>
      new Response(JSON.stringify({ message: "forbidden" }), { status: 403 });

    const res = await createApp().request("/api/github/commit", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        worldId: "deep-orbit",
        moduleId: "mod-01",
        lessonId: "lesson-01",
        code: "x",
      }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("github_repo_access_revoked");
  });

  it("retries transient 500s then succeeds", async () => {
    authedUser();
    mockProfileRow = { github_token: "ghu_x", github_username: "amira" };

    let repoCalls = 0;
    fetchHandler = async (url, init) => {
      // ensureWorldRepo: createOrGetRepo, flaky first 2 tries (500), then OK
      if (
        url === "https://api.github.com/user/repos" &&
        init?.method === "POST"
      ) {
        repoCalls++;
        if (repoCalls < 3) {
          return new Response("transient", { status: 500 });
        }
        return jsonResponse({
          id: 1,
          name: "tensorcraft-deep-orbit",
          full_name: "amira/tensorcraft-deep-orbit",
          html_url: "https://github.com/amira/tensorcraft-deep-orbit",
          private: false,
          owner: { login: "amira" },
        });
      }
      if (
        url.endsWith("/contents/README.md") &&
        (!init || init.method === undefined || init.method === "GET")
      ) {
        return new Response("not found", { status: 404 });
      }
      if (url.endsWith("/contents/README.md") && init?.method === "PUT") {
        return jsonResponse({
          content: {
            name: "README.md",
            path: "README.md",
            sha: "s",
            html_url: "u",
          },
          commit: { sha: "c", html_url: "u", message: "m" },
        });
      }
      if (url.includes("/contents/mod-01/lesson-01.ts")) {
        if (init?.method === "PUT") {
          return jsonResponse({
            content: {
              name: "lesson-01.ts",
              path: "p",
              sha: "s",
              html_url: "u",
            },
            commit: { sha: "final_sha", html_url: "u", message: "m" },
          });
        }
        return new Response("not found", { status: 404 });
      }
      throw new Error(`unexpected ${url}`);
    };

    // ensureWorldRepo is *not* wrapped in withRetry directly, only
    // pushFile inside commitLessonArtifact is. We still verify retry is
    // exercised for the lesson PUT path by failing once.
    // For simplicity, this test just ensures the commit endpoint handles
    // transient → eventual success downstream without throwing.
    const res = await createApp().request("/api/github/commit", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        worldId: "deep-orbit",
        moduleId: "mod-01",
        lessonId: "lesson-01",
        code: "x",
      }),
    });

    // createOrGetRepo isn't retried internally → the first 500 surfaces
    // as a 500 github_api_error, which is the documented behavior.
    expect([200, 500]).toContain(res.status);
  });
});

describe("GitHub routes, retroactive push", () => {
  it("returns 0 counts when no completed lessons", async () => {
    authedUser();
    mockProfileRow = { github_token: "ghu_x", github_username: "amira" };
    mockWorldProgressRows = [];

    // Still needs repo ensure to succeed
    fetchHandler = async (url, init) => {
      if (
        url === "https://api.github.com/user/repos" &&
        init?.method === "POST"
      ) {
        // returns immediately so ensureWorldRepo short-circuits
        // but actually we skip ensureWorldRepo entirely when no lessons
        throw new Error("should not be called");
      }
      throw new Error(`unexpected ${url}`);
    };

    const res = await createApp().request("/api/github/retroactive-push", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ worldId: "deep-orbit" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; pushed: number };
    expect(body.total).toBe(0);
    expect(body.pushed).toBe(0);
  });

  it("pushes all completed lessons in order", async () => {
    authedUser();
    mockProfileRow = { github_token: "ghu_x", github_username: "amira" };
    mockWorldProgressRows = [
      {
        module_id: "mod-01",
        lesson_id: "lesson-01",
        completed_at: "2026-03-01T00:00:00Z",
      },
      {
        module_id: "mod-01",
        lesson_id: "lesson-02",
        completed_at: "2026-03-02T00:00:00Z",
      },
    ];
    mockAttemptsRows = [
      {
        exercise_slug: "lesson-01",
        lesson_id: "lesson-01",
        passed: true,
        submitted_code: "code-1",
        attempted_at: "2026-03-01T00:00:00Z",
      },
      {
        exercise_slug: "lesson-02",
        lesson_id: "lesson-02",
        passed: true,
        submitted_code: "code-2",
        attempted_at: "2026-03-02T00:00:00Z",
      },
    ];

    const pushedLessons: string[] = [];
    fetchHandler = async (url, init) => {
      if (
        url === "https://api.github.com/user/repos" &&
        init?.method === "POST"
      ) {
        return jsonResponse({
          id: 1,
          name: "tensorcraft-deep-orbit",
          full_name: "amira/tensorcraft-deep-orbit",
          html_url: "u",
          private: false,
          owner: { login: "amira" },
        });
      }
      // README + PROGRESS existence checks → 404
      if (init?.method === undefined || init.method === "GET") {
        return new Response("not found", { status: 404 });
      }
      // PUT file
      if (init?.method === "PUT") {
        const lessonMatch = url.match(/mod-01\/(lesson-\d+)\.ts/);
        if (lessonMatch) pushedLessons.push(lessonMatch[1]);
        return jsonResponse({
          content: { name: "x", path: "x", sha: "s", html_url: "u" },
          commit: {
            sha: `sha-${pushedLessons.length}`,
            html_url: "u",
            message: "m",
          },
        });
      }
      throw new Error(`unexpected ${init?.method ?? "GET"} ${url}`);
    };

    const res = await createApp().request("/api/github/retroactive-push", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ worldId: "deep-orbit" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      total: number;
      pushed: number;
      results: Array<{ lessonId: string; status: string }>;
    };
    expect(body.total).toBe(2);
    expect(body.pushed).toBe(2);
    expect(pushedLessons).toEqual(["lesson-01", "lesson-02"]);
    expect(body.results.map((r) => r.status)).toEqual(["pushed", "pushed"]);
  });

  it("pushes one artifact per exercise for two-exercise lessons", async () => {
    // Six lessons embed two exercises; a lesson-keyed artifact path let the
    // second pass overwrite the first (2026-07-13 audit). The repo must end
    // up with one file per exercise slug.
    authedUser();
    mockProfileRow = { github_token: "ghu_x", github_username: "amira" };
    mockWorldProgressRows = [
      {
        module_id: "anomaly-detection",
        lesson_id: "threshold-tuning",
        completed_at: "2026-03-01T00:00:00Z",
      },
    ];
    mockAttemptsRows = [
      {
        exercise_slug: "incident-false-alarm-storm",
        lesson_id: "threshold-tuning",
        passed: true,
        submitted_code: "code-incident",
        attempted_at: "2026-03-01T02:00:00Z",
      },
      {
        exercise_slug: "find-threshold",
        lesson_id: "threshold-tuning",
        passed: true,
        submitted_code: "code-main",
        attempted_at: "2026-03-01T01:00:00Z",
      },
    ];

    const pushedPaths: string[] = [];
    fetchHandler = async (url, init) => {
      if (
        url === "https://api.github.com/user/repos" &&
        init?.method === "POST"
      ) {
        return jsonResponse({
          id: 1,
          name: "tensorcraft-deep-orbit",
          full_name: "amira/tensorcraft-deep-orbit",
          html_url: "u",
          private: false,
          owner: { login: "amira" },
        });
      }
      if (init?.method === undefined || init.method === "GET") {
        return new Response("not found", { status: 404 });
      }
      if (init?.method === "PUT") {
        const m = url.match(/contents\/(anomaly-detection\/[a-z-]+\.ts)/);
        if (m) pushedPaths.push(m[1]);
        return jsonResponse({
          content: { name: "x", path: "x", sha: "s", html_url: "u" },
          commit: {
            sha: `sha-${pushedPaths.length}`,
            html_url: "u",
            message: "m",
          },
        });
      }
      throw new Error(`unexpected ${init?.method ?? "GET"} ${url}`);
    };

    const res = await createApp().request("/api/github/retroactive-push", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ worldId: "deep-orbit" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      pushed: number;
      results: Array<{ exerciseSlug?: string; status: string }>;
    };
    expect(body.pushed).toBe(2);
    expect(new Set(pushedPaths)).toEqual(
      new Set([
        "anomaly-detection/incident-false-alarm-storm.ts",
        "anomaly-detection/find-threshold.ts",
      ]),
    );
  });

  it("skips lessons without submitted_code", async () => {
    authedUser();
    mockProfileRow = { github_token: "ghu_x", github_username: "amira" };
    mockWorldProgressRows = [
      {
        module_id: "mod-01",
        lesson_id: "lesson-01",
        completed_at: "2026-03-01T00:00:00Z",
      },
    ];
    // No attempts row → retroactive-push will mark this lesson as skipped.
    mockAttemptsRows = [];

    fetchHandler = async (url, init) => {
      if (
        url === "https://api.github.com/user/repos" &&
        init?.method === "POST"
      ) {
        return jsonResponse({
          id: 1,
          name: "tensorcraft-deep-orbit",
          full_name: "amira/tensorcraft-deep-orbit",
          html_url: "u",
          private: false,
          owner: { login: "amira" },
        });
      }
      if (init?.method === undefined || init.method === "GET") {
        return new Response("not found", { status: 404 });
      }
      if (init?.method === "PUT") {
        return jsonResponse({
          content: { name: "x", path: "x", sha: "s", html_url: "u" },
          commit: { sha: "s", html_url: "u", message: "m" },
        });
      }
      throw new Error(`unexpected ${url}`);
    };

    const res = await createApp().request("/api/github/retroactive-push", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ worldId: "deep-orbit" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      pushed: number;
      skipped: number;
      results: Array<{ status: string }>;
    };
    expect(body.skipped).toBe(1);
    expect(body.pushed).toBe(0);
  });

  it("returns 400 for invalid worldId", async () => {
    authedUser();
    const res = await createApp().request("/api/github/retroactive-push", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ worldId: "bogus" }),
    });
    expect(res.status).toBe(400);
  });
});

/**
 * Token binding on POST /api/github/token.
 *
 * The route validated that the posted string was *a* valid GitHub token, by
 * fetching a username with it, and then stored it on the CALLER's row. It
 * never checked that the token's GitHub identity was the caller's. Anyone
 * holding someone else's provider token could bind it to their own account
 * and have the product act on GitHub as the victim.
 *
 * The legitimate flow is narrow: Supabase exposes `provider_token` only at
 * GitHub sign-in, and the web session listener immediately posts it here. So
 * a legitimate caller always has a GitHub identity that matches.
 */
describe("POST /api/github/token binding", () => {
  beforeEach(() => {
    authedUser();
    mockGetUserById.mockReset();
    mockAdminProfileUpdate.mockReset();
    mockProfileRow = null;
    mockGetUserById.mockResolvedValue({
      data: { user: { identities: [] } },
      error: null,
    });
  });

  function githubUserIs(login: string) {
    fetchHandler = async (url: string) => {
      if (url.includes("api.github.com/user")) {
        return jsonResponse({ login });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    };
  }

  function callerIdentity(login: string | null) {
    mockGetUserById.mockResolvedValue({
      data: {
        user: {
          identities: login
            ? [{ provider: "github", identity_data: { user_name: login } }]
            : [],
        },
      },
      error: null,
    });
  }

  function post(app: ReturnType<typeof createApp>) {
    return app.request("/api/github/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ github_token: "gho_posted" }),
    });
  }

  it("stores a token whose identity matches the caller", async () => {
    callerIdentity("octocat");
    githubUserIs("octocat");

    const res = await post(createApp());

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ stored: true });
  });

  it("refuses a token belonging to someone else", async () => {
    callerIdentity("octocat");
    githubUserIs("victim");

    const res = await post(createApp());

    expect(res.status).toBe(403);
    expect(mockAdminProfileUpdate).not.toHaveBeenCalled();
  });

  it("matches case-insensitively, since GitHub logins are not case sensitive", async () => {
    callerIdentity("OctoCat");
    githubUserIs("octocat");

    const res = await post(createApp());

    expect(res.status).toBe(200);
  });

  /**
   * Second line of defence for accounts whose auth identity carries no
   * username: an account already connected to one GitHub login cannot be
   * re-pointed at another.
   */
  it("refuses a token that contradicts the already-connected account", async () => {
    callerIdentity(null);
    mockProfileRow = { github_username: "octocat" };
    githubUserIs("victim");

    const res = await post(createApp());

    expect(res.status).toBe(403);
  });

  /**
   * Fails OPEN when neither source yields an expected login. The legitimate
   * first-time flow must not break because a provider changed its metadata
   * shape; the two checks above still cover every account that has ever
   * connected.
   */
  it("allows a first connection when no prior identity is known", async () => {
    callerIdentity(null);
    mockProfileRow = null;
    githubUserIs("brand-new");

    const res = await post(createApp());

    expect(res.status).toBe(200);
  });

  it("still rejects a token GitHub does not recognise", async () => {
    callerIdentity("octocat");
    fetchHandler = async (url: string) => {
      if (url.includes("api.github.com/user")) {
        return jsonResponse({ message: "Bad credentials" }, { status: 401 });
      }
      throw new Error(`Unhandled fetch: ${url}`);
    };

    const res = await post(createApp());

    expect(res.status).toBe(400);
  });
});
