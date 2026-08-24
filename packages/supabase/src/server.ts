/**
 * Supabase Server Client
 *
 * Used in Hono API routes and Next.js server components.
 * Uses the service role key for admin operations, or anon key for user-scoped queries.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Wall-clock bound for a single PostgREST request.
 *
 * 10s, chosen against the sharpest caller rather than the average one: the
 * Stripe webhook runs several queries inline, and holding that handler open
 * earns a re-delivery. A query that has not answered in 10s is not going to.
 */
const QUERY_TIMEOUT_MS = 10_000;

/**
 * fetch with a default deadline, handed to supabase-js via `global.fetch`.
 *
 * Applied at the FACTORY rather than at each call site on purpose: this covers
 * every query that exists now and every one anyone adds later, which a
 * call-site sweep cannot promise. Before this, no Supabase query in the API
 * had a timeout at all.
 *
 * A caller-supplied signal always wins, so anything that deliberately chose a
 * different deadline keeps it.
 */
function timeoutFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (init?.signal) return fetch(input, init);
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
  });
}

/**
 * Create a Supabase client for server-side use.
 * Pass a user's JWT to scope queries to that user via RLS.
 */
export function getSupabaseServerClient(accessToken?: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: timeoutFetch,
      // Spread rather than replace: dropping this header would silently run
      // every authenticated query as the service role, which is a privilege
      // escalation, not a bug.
      ...(accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : {}),
    },
  });
}

/**
 * Admin client, bypasses RLS. Use only for server-side operations
 * like webhook handlers and background jobs.
 */
export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: { fetch: timeoutFetch },
  });
}
