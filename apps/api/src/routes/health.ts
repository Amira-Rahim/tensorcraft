import { Hono } from "hono";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

const health = new Hono();

health.get("/", async (c) => {
  let dbStatus: "ok" | "error" = "ok";
  let dbError: string | undefined;

  try {
    const supabase = getSupabaseAdminClient();
    // Query a nonexistent table with limit 0.
    // A "relation does not exist" error still proves DB is reachable.
    // Only network / auth failures indicate a real problem.
    const res = await supabase.from("_health_check_noop").select("*").limit(0);
    if (res.error && !res.error.message.includes("does not exist")) {
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
