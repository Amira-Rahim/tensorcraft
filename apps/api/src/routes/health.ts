import { Hono } from "hono";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

const health = new Hono();

/**
 * LIVENESS — what Fly (fly.toml, 10s) and the Dockerfile HEALTHCHECK (15s)
 * probe. Process-up only, NO dependency checks: gating liveness on a DB
 * query meant a Supabase blip made every machine report unhealthy at once
 * and Fly killed the whole API fleet during a hiccup it would have ridden
 * out (R2-5; fresh-eyes rerun T2-25). The old check was also a
 * `count: "exact"` sequential scan over profiles, ~20 scans/min forever.
 */
health.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "tensorcraft-api",
    timestamp: new Date().toISOString(),
  });
});

/**
 * READINESS — for humans, dashboards, and any orchestration that wants
 * dependency truth. 503 when the DB is unreachable; never wired to
 * anything that kills machines. Cheap probe: head-only single-row select,
 * not a table count.
 */
health.get("/ready", async (c) => {
  let dbStatus: "ok" | "error" = "ok";

  try {
    const supabase = getSupabaseAdminClient();
    const res = await supabase
      .from("profiles")
      .select("id", { head: true })
      .limit(1);
    if (res.error) dbStatus = "error";
  } catch {
    dbStatus = "error";
  }

  return c.json(
    {
      status: dbStatus === "ok" ? "ok" : "degraded",
      service: "tensorcraft-api",
      timestamp: new Date().toISOString(),
      checks: { db: dbStatus },
    },
    dbStatus === "ok" ? 200 : 503,
  );
});

export { health };
