/**
 * Admin utilities for role-based access control.
 */

import { getSupabaseAdminClient } from "./server";
import type { UserRole } from "./types";

/**
 * Check if a user has admin role by their user ID.
 * Uses the admin client (bypasses RLS) to read the profile.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return false;
  return data.role === "admin";
}

/**
 * Get a user's role by their user ID.
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data.role;
}
