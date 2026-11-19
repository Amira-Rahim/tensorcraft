import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { authMiddleware } from "../middleware/auth";
import { logger } from "../lib/logger";
import type { AppEnv } from "../types";

const analyticsConsent = new Hono<AppEnv>();

analyticsConsent.use("*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  await next();
});
analyticsConsent.use("*", authMiddleware);

function responseFor(row: {
  granted: boolean;
  revision: number;
  updated_at: string | null;
}) {
  return {
    granted: row.granted,
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}

analyticsConsent.get("/", async (c) => {
  try {
    const { data, error } = await getSupabaseServerClient(c.get("accessToken"))
      .from("analytics_consents")
      .select("granted, revision, updated_at")
      .eq("user_id", c.get("userId"))
      .maybeSingle();
    if (error) throw error;
    return c.json(
      responseFor(data ?? { granted: false, revision: 0, updated_at: null }),
    );
  } catch {
    logger.warn("Analytics consent read failed");
    return c.json({ error: "Could not read analytics preferences" }, 503);
  }
});

analyticsConsent.put("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !("granted" in body) ||
    typeof body.granted !== "boolean" ||
    !("expectedRevision" in body) ||
    typeof body.expectedRevision !== "number" ||
    !Number.isInteger(body.expectedRevision) ||
    body.expectedRevision < 0 ||
    body.expectedRevision > 2_147_483_647 ||
    Object.keys(body).some(
      (key) => key !== "granted" && key !== "expectedRevision",
    )
  ) {
    return c.json(
      {
        error:
          "Provide a boolean granted and a nonnegative integer expectedRevision",
      },
      400,
    );
  }

  try {
    // The RPC derives the account from this token, never from request data.
    const { data, error } = await getSupabaseServerClient(
      c.get("accessToken"),
    ).rpc("set_analytics_consent", {
      p_granted: body.granted,
      p_expected_revision: body.expectedRevision,
    });
    const row = data?.[0];
    if (error || !row) throw error ?? new Error("Missing consent response");
    return c.json(responseFor(row), row.applied ? 200 : 409);
  } catch {
    logger.warn("Analytics consent update failed");
    return c.json({ error: "Could not save analytics preferences" }, 503);
  }
});

export { analyticsConsent };
