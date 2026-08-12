import { Hono } from "hono";
/**
 * Waitlist route, originally designed for "coming soon" world interest capture.
 * All 5 worlds now launch simultaneously, so world-specific waitlist signups
 * are no longer needed. This route is kept for general newsletter signups
 * and may be repurposed in the future.
 */
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

const waitlist = new Hono();

/**
 * POST /api/waitlist, Add email to waitlist (no auth required).
 */
waitlist.post("/", async (c) => {
  let body: { email: string; worldId?: string; source?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || !emailRegex.test(body.email)) {
    return c.json({ error: "Valid email is required" }, 400);
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("waitlist").insert({
    email: body.email,
    world_id: body.worldId ?? null,
    source: body.source ?? null,
  });

  if (error) {
    // Unique constraint violation = already signed up
    if (error.code === "23505") {
      return c.json({ message: "Already on the waitlist" }, 200);
    }
    return c.json(
      {
        error: "Failed to join waitlist",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ message: "Added to waitlist" }, 201);
});

export { waitlist };
