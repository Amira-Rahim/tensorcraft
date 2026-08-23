import { Hono } from "hono";
import { isValidAdminKey } from "../lib/admin-auth";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";
import { isAdmin } from "@tensorcraft/supabase";
import { authMiddleware } from "../middleware/auth";
import { sendDigestNewsletter } from "../lib/newsletter";

// Use a broader env type since admin routes may authenticate via API key (no userId)
type AdminEnv = {
  Variables: {
    userId?: string;
    accessToken?: string;
    isAdmin?: boolean;
  };
};

const admin = new Hono<AdminEnv>();

// Key check lives in lib/admin-auth.ts, shared with the Kit unsubscribe relay.
const isValidApiKey = isValidAdminKey;

/**
 * Combined admin auth middleware.
 * Supports two auth methods:
 * 1. Supabase role-based auth (user with admin role), preferred
 * 2. API key via x-admin-key header, fallback for CI/scripts
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
    await authMiddleware(c as any, async () => {
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
    // Auth failed, fall through to 401
  }

  return c.json({ error: "Unauthorized" }, 401);
});

/**
 * GET /api/admin/stats, Dashboard stats (waitlist, users, purchases, revenue).
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
 * GET /api/admin/waitlist, Paginated waitlist entries.
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

/**
 * POST /api/admin/newsletter/send, Send the weekly digest newsletter.
 * Body: { weekIso: "2026-W18", dryRun?: boolean }
 */
admin.post("/newsletter/send", async (c) => {
  let body: { weekIso?: string; dryRun?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const weekIso = body.weekIso;
  if (!weekIso || !/^\d{4}-W\d{2}$/.test(weekIso)) {
    return c.json({ error: "weekIso must match YYYY-Www" }, 400);
  }
  try {
    const result = await sendDigestNewsletter(weekIso, {
      dryRun: !!body.dryRun,
    });
    return c.json(result);
  } catch (err) {
    return c.json(
      {
        error: err instanceof Error ? err.message : "send failed",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }
});

export { admin };
