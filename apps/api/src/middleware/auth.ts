import type { Context, Next } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";

/**
 * Auth middleware — validates Supabase JWT from Authorization header.
 * Sets `c.set("userId", ...)` and `c.set("accessToken", ...)` for downstream handlers.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseServerClient(token);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("userId", user.id);
  c.set("accessToken", token);

  await next();
}
