import { Hono } from "hono";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

const health = new Hono();

health.get("/", async (c) => {
  let dbStatus: "ok" | "error" = "ok";
  let dbError: string | undefined;

  try {
    const supabase = getSupabaseAdminClient();
    // Lightweight connectivity check using a real table with head-only count query.
    // This avoids querying a non-existent table and the fragile error-message check.
    const res = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    if (res.error) {
      dbStatus = "error";
      dbError = res.error.message;
    }
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : "Unknown error";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";
  const code = dbStatus === "ok" ? 200 : 503;

  return c.json(
    {
      status,
      service: "tensorcraft-api",
      timestamp: new Date().toISOString(),
      checks: { db: dbStatus, ...(dbError ? { dbError } : {}) },
    },
    code,
  );
});

export { health };
