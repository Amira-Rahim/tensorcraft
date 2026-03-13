import { Hono } from "hono";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

const waitlist = new Hono();

/**
 * POST /api/waitlist — Add email to waitlist (no auth required).
 */
waitlist.post("/", async (c) => {
  const body = await c.req.json<{
    email: string;
    themeId?: string;
    source?: string;
  }>();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || !emailRegex.test(body.email)) {
    return c.json({ error: "Valid email is required" }, 400);
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("waitlist").insert({
    email: body.email,
    theme_id: body.themeId ?? null,
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
