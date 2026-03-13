import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Mock Supabase modules
const mockFrom = vi.fn();
const mockIsAdmin = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: mockFrom,
  }),
  getSupabaseServerClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" },
      }),
    },
  }),
  isAdmin: (...args: unknown[]) => mockIsAdmin(...args),
}));

// Must import after mocks
const { admin } = await import("../admin");

const app = new Hono();
app.route("/api/admin", admin);

const VALID_ADMIN_KEY = "test-admin-secret-key";

describe("Admin routes", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_API_KEY", VALID_ADMIN_KEY);
    mockFrom.mockReset();
    mockIsAdmin.mockReset();
  });

  describe("GET /api/admin/stats", () => {
    it("returns 401 without admin auth", async () => {
      vi.stubEnv("ADMIN_API_KEY", VALID_ADMIN_KEY);

      const res = await app.request("/api/admin/stats");
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns stats with valid admin key", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "waitlist") {
          return {
            select: () => Promise.resolve({ count: 42, error: null }),
          };
        }
        if (table === "profiles") {
          return {
            select: () => Promise.resolve({ count: 10, error: null }),
          };
        }
        if (table === "purchases") {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [
                    { amount: 7900, status: "completed" },
                    { amount: 7900, status: "completed" },
                  ],
                  error: null,
                }),
            }),
          };
        }
        return {};
      });

      const res = await app.request("/api/admin/stats", {
        headers: { "x-admin-key": VALID_ADMIN_KEY },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.waitlistCount).toBe(42);
      expect(body.userCount).toBe(10);
      expect(body.purchaseCount).toBe(2);
      expect(body.revenue).toBe(15800);
    });
  });

  describe("GET /api/admin/waitlist", () => {
    it("returns 401 without admin auth", async () => {
      const res = await app.request("/api/admin/waitlist");
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns paginated data", async () => {
      const mockData = [
        { id: 1, email: "a@test.com", created_at: "2026-01-01" },
        { id: 2, email: "b@test.com", created_at: "2026-01-02" },
      ];

      mockFrom.mockReturnValue({
        select: () => ({
          order: () => ({
            range: () =>
              Promise.resolve({
                data: mockData,
                count: 2,
                error: null,
              }),
          }),
        }),
      });

      const res = await app.request("/api/admin/waitlist?page=1&limit=10", {
        headers: { "x-admin-key": VALID_ADMIN_KEY },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(10);
    });

    it("validates page/limit params with defaults", async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          order: () => ({
            range: () =>
              Promise.resolve({
                data: [],
                count: 0,
                error: null,
              }),
          }),
        }),
      });

      const res = await app.request("/api/admin/waitlist?page=-5&limit=9999", {
        headers: { "x-admin-key": VALID_ADMIN_KEY },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      // page should be clamped to 1 minimum
      expect(body.page).toBe(1);
      // limit should be clamped to 100 maximum
      expect(body.limit).toBe(100);
    });
  });
});
