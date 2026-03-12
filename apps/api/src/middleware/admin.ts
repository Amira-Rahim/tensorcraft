import type { Context, Next } from "hono";
import { isAdmin } from "@tensorcraft/supabase";

/**
 * Admin middleware — must be used AFTER authMiddleware.
 * Checks that the authenticated user has the admin role.
 */
export async function adminMiddleware(c: Context, next: Next) {
  const userId = c.get("userId") as string | undefined;

  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const admin = await isAdmin(userId);
  if (!admin) {
    return c.json({ error: "Forbidden — admin access required" }, 403);
  }

  c.set("isAdmin", true);
  await next();
}
