import { getRedis } from "./redis";

/**
 * Cache-through query helper. Checks Redis first, falls back to queryFn,
 * stores result in Redis with TTL.
 */
export async function cachedQuery<T>(
  key: string,
  ttlSeconds: number,
  queryFn: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();

  const cached = await redis.get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const result = await queryFn();
  await redis.set(key, result, { ex: ttlSeconds });
  return result;
}

/** Bust a specific cache key */
export async function bustCache(key: string): Promise<void> {
  const redis = getRedis();
  await redis.del(key);
}

/** Bust multiple cache keys */
export async function bustCacheKeys(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
