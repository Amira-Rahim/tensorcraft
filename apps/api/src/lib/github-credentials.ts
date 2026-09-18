import { randomUUID } from "node:crypto";
import type { getSupabaseServerClient } from "@tensorcraft/supabase";
import {
  GitHubApiError,
  refreshUserToken,
  type GitHubOAuthTokens,
} from "./github";
import { decryptToken, encryptToken } from "./token-crypto";
import { getRedis } from "./redis";

type Client = ReturnType<typeof getSupabaseServerClient>;
interface Credential {
  kind: "github-oauth-v1";
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
}
export class GitHubCredentialError extends Error {
  constructor(
    public readonly status: 401 | 503,
    message: string,
  ) {
    super(message);
  }
}
const reconnect = () =>
  new GitHubCredentialError(
    401,
    "GitHub authorization expired. Reconnect GitHub in Settings.",
  );
const unavailable = () =>
  new GitHubCredentialError(
    503,
    "GitHub token renewal is temporarily unavailable. Please retry shortly.",
  );

/** One encrypted column keeps access/refresh rotation atomic; old rows still work. */
export function storeGitHubCredential(
  tokens: GitHubOAuthTokens,
  now = Date.now(),
): string {
  if (!tokens.refresh_token) return encryptToken(tokens.access_token);
  if (!process.env.GITHUB_TOKEN_ENC_KEY?.trim()) throw unavailable();
  if (
    !tokens.access_token ||
    typeof tokens.refresh_token !== "string" ||
    !Number.isSafeInteger(tokens.expires_in) ||
    tokens.expires_in! <= 0 ||
    !Number.isSafeInteger(tokens.refresh_token_expires_in) ||
    tokens.refresh_token_expires_in! <= 0
  )
    throw unavailable();
  const credential: Credential = {
    kind: "github-oauth-v1",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: now + tokens.expires_in! * 1000,
    refreshExpiresAt: now + tokens.refresh_token_expires_in! * 1000,
  };
  return encryptToken(JSON.stringify(credential));
}

function read(stored: string | null | undefined): Credential | string | null {
  if (!stored) return null;
  const plain = decryptToken(stored);
  if (!plain) return null;
  if (!plain.startsWith("{")) return plain;
  try {
    const value = JSON.parse(plain) as Credential;
    if (
      value.kind !== "github-oauth-v1" ||
      typeof value.accessToken !== "string" ||
      !value.accessToken ||
      typeof value.refreshToken !== "string" ||
      !value.refreshToken ||
      !Number.isSafeInteger(value.expiresAt) ||
      !Number.isSafeInteger(value.refreshExpiresAt)
    )
      return null;
    return value;
  } catch {
    return null;
  }
}

/** Disconnect needs the current access token without creating another token. */
export function storedGitHubAccessToken(
  stored: string | null | undefined,
): string | null {
  const value = read(stored);
  return typeof value === "string" ? value : (value?.accessToken ?? null);
}

function ready(value: ReturnType<typeof read>): string | null | undefined {
  if (typeof value === "string" || value === null) return value;
  if (value.expiresAt > Date.now() + 60_000) return value.accessToken;
  if (value.refreshExpiresAt <= Date.now()) throw reconnect();
  return undefined;
}

async function current(client: Client, userId: string): Promise<string | null> {
  const result = await client
    .from("profiles")
    .select("github_token")
    .eq("id", userId)
    .single();
  if (result.error || !result.data) throw unavailable();
  return result.data.github_token;
}

export async function resolveGitHubToken(
  client: Client,
  userId: string,
  stored: string | null | undefined,
): Promise<string | null> {
  const initial = ready(read(stored));
  if (initial !== undefined) return initial;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret || !process.env.GITHUB_TOKEN_ENC_KEY?.trim())
    throw unavailable();
  // The API runs on multiple machines. A process-local lock cannot protect a
  // single-use refresh token from two requests reaching different machines.
  const key = `github:refresh:${userId}`;
  const owner = randomUUID();
  let redis: ReturnType<typeof getRedis>;
  let locked: string | null;
  try {
    redis = getRedis();
    locked = await redis.set(key, owner, { nx: true, ex: 120 });
  } catch {
    throw unavailable();
  }
  if (!locked) {
    // Another request is renewing. Read only: never consume the same token.
    for (let attempt = 0; attempt < 10; attempt++) {
      const next = ready(read(await current(client, userId)));
      if (next !== undefined) return next;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw unavailable();
  }
  try {
    const latest = await current(client, userId);
    const credential = read(latest);
    const existing = ready(credential);
    if (existing !== undefined) return existing;
    if (!credential || typeof credential === "string") throw reconnect();
    let tokens: GitHubOAuthTokens;
    try {
      tokens = await refreshUserToken({
        clientId,
        clientSecret,
        refreshToken: credential.refreshToken,
      });
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 401)
        throw reconnect();
      throw unavailable();
    }
    const replacement = storeGitHubCredential(tokens);
    // CAS prevents a late renewal from undoing a concurrent disconnect or
    // replacing a new authorization. Retry only persistence, never refresh.
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await client
        .from("profiles")
        .update({
          github_token: replacement,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .eq("github_token", latest!)
        .select("github_token")
        .maybeSingle();
      if (!result.error && result.data?.github_token === replacement)
        return tokens.access_token;
      const observed = await current(client, userId);
      if (observed === replacement) return tokens.access_token;
      if (observed !== latest) throw reconnect();
    }
    throw unavailable();
  } finally {
    try {
      await redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        [key],
        [owner],
      );
    } catch {
      /* The lease expires; do not hide the original outcome. */
    }
  }
}
