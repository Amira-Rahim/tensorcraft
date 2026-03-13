import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";
import { isAdmin } from "@tensorcraft/supabase";
import { authMiddleware } from "../middleware/auth";

// Use a broader env type since admin routes may authenticate via API key (no userId)
type AdminEnv = {
  Variables: {
    userId?: string;
    accessToken?: string;
    isAdmin?: boolean;
  };
};

const admin = new Hono<AdminEnv>();

/**
 * Timing-safe comparison for API key.
 * Uses constant-time comparison to prevent timing attacks.
 */
function isValidApiKey(provided: string | undefined): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || !provided) return false;

  // timingSafeEqual requires equal-length buffers
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  if (expectedBuf.length !== providedBuf.length) {
    // Still perform a comparison to avoid leaking length info via timing
    const dummy = Buffer.alloc(expectedBuf.length);
    timingSafeEqual(expectedBuf, dummy);
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * Combined admin auth middleware.
 * Supports two auth methods:
 * 1. Supabase role-based auth (user with admin role) — preferred
 * 2. API key via x-admin-key header — fallback for CI/scripts
 */
admin.use("*", async (c, next) => {
  // Method 1: Try API key first (for CI/scripts without a Supabase session)
  const apiKey = c.req.header("x-admin-key");
  if (isValidApiKey(apiKey)) {
    c.set("isAdmin", true);
    await next();
    return;
  }

  // Method 2: Try Supabase role-based auth
  try {
    // Run authMiddleware to extract userId
    let authPassed = false;
    await authMiddleware(c, async () => {
      authPassed = true;
    });

    if (authPassed) {
      const userId = c.get("userId");
      if (userId && (await isAdmin(userId))) {
        c.set("isAdmin", true);
        await next();
        return;
      }
    }
  } catch {
    // Auth failed — fall through to 401
  }

  return c.json({ error: "Unauthorized" }, 401);
});

/**
 * GET /api/admin/stats — Dashboard stats (waitlist, users, purchases, revenue).
 */
admin.get("/stats", async (c) => {
  const supabase = getSupabaseAdminClient();

  const [waitlistRes, profilesRes, purchasesRes] = await Promise.all([
    supabase.from("waitlist").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("purchases")
      .select("amount, status")
      .eq("status", "completed"),
  ]);

  const revenue = (purchasesRes.data ?? []).reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0,
  );

  return c.json({
    waitlistCount: waitlistRes.count ?? 0,
    userCount: profilesRes.count ?? 0,
    purchaseCount: purchasesRes.data?.length ?? 0,
    revenue,
  });
});

/**
 * GET /api/admin/waitlist — Paginated waitlist entries.
 * Query params: ?page=1&limit=50
 */
admin.get("/waitlist", async (c) => {
  const page = Math.max(1, Math.floor(Number(c.req.query("page")) || 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(Number(c.req.query("limit")) || 50)),
  );
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdminClient();

  const { data, count, error } = await supabase
    .from("waitlist")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json(
      {
        error: "Failed to fetch waitlist",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
});

export { admin };
