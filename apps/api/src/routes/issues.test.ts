// apps/api/src/routes/issues.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

const mockInsert = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockGetUser = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "issues") {
        return {
          insert: (data: unknown) => {
            mockInsert(data);
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: "test-uuid-1234", ...data },
                    error: null,
                  }),
              }),
            };
          },
        };
      }
      return {};
    },
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => {
          mockUpload(...args);
          return Promise.resolve({ data: { path: "test.png" }, error: null });
        },
        getPublicUrl: (path: string) => {
          mockGetPublicUrl(path);
          return {
            data: {
              publicUrl: `https://storage.test/issue-screenshots/${path}`,
            },
          };
        },
      }),
    },
  }),
  getSupabaseServerClient: (token: string) => ({
    auth: {
      getUser: () => mockGetUser(token),
    },
  }),
}));

vi.mock("../lib/email", () => ({
  sendIssueNotification: (...args: unknown[]) => {
    mockSendEmail(...args);
    return Promise.resolve();
  },
}));

vi.mock("../lib/redis", () => ({
  getRedis: () => ({
    pipeline: () => ({
      zremrangebyscore: vi.fn(),
      zadd: vi.fn(),
      zcard: vi.fn(),
      expire: vi.fn(),
      exec: () => Promise.resolve([null, null, 1, null]),
    }),
  }),
}));

// Import after mocks
const { issues } = await import("./issues");

const app = new Hono();
app.route("/api/issues", issues);

function createFormData(fields: Record<string, string | Blob>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return form;
}

const validFields = {
  category: "bug",
  description: "The exercise editor crashes when I paste code",
  severity: "high",
  email: "user@example.com",
  context: JSON.stringify({
    url: "https://tensorcraft.app/themes/deep-orbit/1/1",
    userAgent: "Mozilla/5.0",
    viewport: JSON.stringify({ width: 1920, height: 1080 }),
  }),
};

describe("POST /api/issues", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockUpload.mockClear();
    mockGetPublicUrl.mockClear();
    mockGetUser.mockClear();
    mockSendEmail.mockClear();
  });

  it("returns 201 for valid anonymous submission", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(validFields),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("test-uuid-1234");
    expect(json.message).toBe("Issue reported successfully");
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });

  it("returns 400 when category is missing", async () => {
    const { category, ...rest } = validFields;
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(rest),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid category value", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, category: "spam" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when description is too short", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, description: "short" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when description exceeds 2000 chars", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({
        ...validFields,
        description: "x".repeat(2001),
      }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid severity", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, severity: "urgent" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when anonymous and email is missing", async () => {
    const { email, ...rest } = validFields;
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(rest),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, email: "not-an-email" }),
    });
    expect(res.status).toBe(400);
  });

  it("uses authenticated user email when no email field provided", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "authed@example.com" } },
      error: null,
    });

    const { email, ...rest } = validFields;
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(rest),
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(201);
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.email).toBe("authed@example.com");
    expect(insertArg.user_id).toBe("user-123");
  });

  it("uploads screenshot to storage when provided", async () => {
    const file = new File(["fake-image-data"], "screenshot.png", {
      type: "image/png",
    });
    const form = createFormData(validFields);
    form.set("screenshot", file);

    const res = await app.request("/api/issues", {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(201);
    expect(mockUpload).toHaveBeenCalledOnce();
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.screenshot_url).toContain("issue-screenshots");
  });

  it("returns 400 when context is missing", async () => {
    const { context, ...rest } = validFields;
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(rest),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when description is exactly 9 chars (boundary)", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, description: "123456789" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 201 when description is exactly 10 chars (boundary)", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, description: "1234567890" }),
    });
    expect(res.status).toBe(201);
  });
});
