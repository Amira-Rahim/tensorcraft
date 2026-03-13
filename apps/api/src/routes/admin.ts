import { Hono } from "hono";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

const admin = new Hono();

/**
 * Simple admin auth check — requires ADMIN_API_KEY header.
 * In production, replace with Supabase role-based check.
 */
function requireAdmin(c: {
  req: { header: (name: string) => string | undefined };
}) {
  const key = c.req.header("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) {
    return false;
  }
  return true;
}

/**
 * GET /api/admin/stats — Dashboard stats (waitlist, users, purchases, revenue).
 */
admin.get("/stats", async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

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
  if (!requireAdmin(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 50));
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdminClient();

  const { data, count, error } = await supabase
    .from("waitlist")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json({ error: "Failed to fetch waitlist" }, 500);
  }

  return c.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
});

export { admin };
