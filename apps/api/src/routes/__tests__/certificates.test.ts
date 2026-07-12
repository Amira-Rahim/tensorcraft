import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../../types";

// ─────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();

// theme_progress rows returned by the user-scoped client
let mockProgressRows: Array<{ status: string }> = [];
let mockProgressError: unknown = null;

// certificates rows used by the admin client
let mockExistingCert: Record<string, unknown> | null = null;
let mockExistingCertError: unknown = null;
const mockCertInsert = vi.fn();

// RPC (get_shared_certificate) mock
const mockRpc = vi.fn();

function makeProgressQuery() {
  const thenable = {
    select: () => thenable,
    eq: () => thenable,
    then: (resolve: (v: unknown) => void) =>
      resolve({ data: mockProgressRows, error: mockProgressError }),
  };
  return thenable;
}

function makeCertificatesUserQuery() {
  // user-scoped client never reads certs in our code path, but keep a stub.
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  };
}

function makeCertificatesAdminQuery() {
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: mockExistingCert,
              error: mockExistingCertError,
            }),
        }),
      }),
    }),
    insert: (data: unknown) => {
      mockCertInsert(data);
      return {
        select: () => ({
          single: () =>
            Promise.resolve({
              data: {
                id: "cert_new_1",
                theme_id: (data as { theme_id: string }).theme_id,
                issued_at: (data as { issued_at: string }).issued_at,
                cert_hash: (data as { cert_hash: string }).cert_hash,
              },
              error: null,
            }),
        }),
      };
    },
  };
}

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "theme_progress") return makeProgressQuery();
      if (table === "certificates") return makeCertificatesUserQuery();
      return {};
    },
  }),
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "certificates") return makeCertificatesAdminQuery();
      return {};
    },
    rpc: (fn: string, args: Record<string, unknown>) => mockRpc(fn, args),
  }),
}));

vi.mock("../../lib/redis", () => ({
  getRedis: () => ({
    get: () => Promise.resolve(null),
    set: () => Promise.resolve("OK"),
  }),
}));

beforeEach(() => {
  mockGetUser.mockReset();
  mockProgressRows = [];
  mockProgressError = null;
  mockExistingCert = null;
  mockExistingCertError = null;
  mockCertInsert.mockReset();
  mockRpc.mockReset();
  process.env.CERT_SIGNING_SECRET = "test-secret-deadbeef";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const { certificates } = await import("../certificates");

function createApp() {
  const app = new Hono<AppEnv>();
  app.route("/api/certificates", certificates);
  return app;
}

function authedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user_123" } },
    error: null,
  });
}

// Simulate a fully completed theme by seeding the progress-row count to
// THEME_CONTENT.totalLessonsPerTheme = 56.
function seedFullyCompletedTheme() {
  mockProgressRows = Array.from({ length: 56 }, () => ({
    status: "completed",
  }));
}

describe("POST /api/certificates", () => {
  it("returns 401 without auth", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "no token" },
    });
    const res = await createApp().request("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId: "deep-orbit" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects invalid themeId", async () => {
    authedUser();
    const res = await createApp().request("/api/certificates", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ themeId: "not-a-theme" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 403 theme_not_complete when not all lessons done", async () => {
    authedUser();
    mockProgressRows = Array.from({ length: 10 }, () => ({
      status: "completed",
    }));
    const res = await createApp().request("/api/certificates", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ themeId: "deep-orbit" }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("theme_not_complete");
  });

  it("issues a new certificate on happy path", async () => {
    authedUser();
    seedFullyCompletedTheme();

    const res = await createApp().request("/api/certificates", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ themeId: "deep-orbit" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      theme_id: string;
      cert_hash: string;
      issued_at: string;
    };
    expect(body.id).toBe("cert_new_1");
    expect(body.theme_id).toBe("deep-orbit");
    // SHA-256 hex length
    expect(body.cert_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(mockCertInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_123",
        theme_id: "deep-orbit",
      }),
    );
  });

  it("is idempotent, returns existing certificate without re-inserting", async () => {
    authedUser();
    seedFullyCompletedTheme();
    mockExistingCert = {
      id: "cert_existing",
      theme_id: "deep-orbit",
      issued_at: "2026-04-01T00:00:00Z",
      cert_hash: "a".repeat(64),
    };

    const res = await createApp().request("/api/certificates", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ themeId: "deep-orbit" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe("cert_existing");
    expect(mockCertInsert).not.toHaveBeenCalled();
  });

  it("returns 500 when CERT_SIGNING_SECRET is missing", async () => {
    authedUser();
    seedFullyCompletedTheme();
    delete process.env.CERT_SIGNING_SECRET;

    const res = await createApp().request("/api/certificates", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ themeId: "deep-orbit" }),
    });
    expect(res.status).toBe(500);
  });
});

describe("GET /api/certificates/:id", () => {
  it("returns the shared certificate fields without auth", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: "11111111-2222-3333-4444-555555555555",
          theme_id: "deep-orbit",
          issued_at: "2026-04-01T00:00:00Z",
          cert_hash: "b".repeat(64),
          user_display_name: "Amira",
          user_avatar_url: "https://example.com/a.png",
        },
      ],
      error: null,
    });

    const res = await createApp().request(
      "/api/certificates/11111111-2222-3333-4444-555555555555",
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      user_display_name: string;
      theme_id: string;
    };
    expect(body.user_display_name).toBe("Amira");
    expect(body.theme_id).toBe("deep-orbit");
  });

  it("returns 404 when the certificate does not exist", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const res = await createApp().request(
      "/api/certificates/11111111-2222-3333-4444-555555555555",
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when id is not a UUID", async () => {
    const res = await createApp().request("/api/certificates/not-a-uuid");
    expect(res.status).toBe(400);
  });
});
