/**
 * Supabase Server Client
 *
 * Used in Hono API routes and Next.js server components.
 * Uses the service role key for admin operations, or anon key for user-scoped queries.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

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
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
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
  });
}
