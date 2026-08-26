import type { Context, Next } from "hono";
import { createHash } from "node:crypto";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { getRedis } from "../lib/redis";
import { withPostHogUserContext } from "../lib/posthog";
import type { AppEnv } from "../types";

const JWT_CACHE_TTL = 30;

/** Hash a token for use as a Redis key (SHA-256, collision-safe at 1M+ users) */
function hashToken(token: string): string {
  return `jwt:${createHash("sha256").update(token).digest("hex").slice(0, 32)}`;
}

export async function authMiddleware(
  c: Context<AppEnv>,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  if (!token) {
    return c.json({ error: "Empty bearer token" }, 401);
  }

  // Check Redis cache first
  const cacheKey = hashToken(token);
  try {
    const redis = getRedis();
    const cached = await redis.get<{ userId: string }>(cacheKey);
    if (cached?.userId) {
      c.set("userId", cached.userId);
      c.set("accessToken", token);
      return withPostHogUserContext(cached.userId, next);
    }
  } catch {
    // Redis failure is non-fatal, fall through to Supabase validation
  }

  // Validate with Supabase
  const supabase = getSupabaseServerClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  // Cache validated claims
  try {
    const redis = getRedis();
    await redis.set(cacheKey, { userId: user.id }, { ex: JWT_CACHE_TTL });
  } catch {
    // Cache write failure is non-fatal
  }

  c.set("userId", user.id);
  c.set("accessToken", token);
  return withPostHogUserContext(user.id, next);
}
