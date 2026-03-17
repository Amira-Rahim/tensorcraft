"use client";

import { getSupabaseBrowserClient } from "./supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Gets the current user's access token from Supabase.
 */
async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Push exercise code to the user's GitHub repository.
 */
export async function pushExerciseToGithub(
  exerciseSlug: string,
  code: string,
  themeId: string,
  moduleId: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  const res = await fetch(`${API_URL}/api/github/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ exerciseSlug, code, themeId, moduleId }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.error || "Failed to push to GitHub" };
  }

  return { success: true, url: data.url };
}

/**
 * Check if the current user has GitHub connected.
 */
export async function getGithubStatus(): Promise<{
  connected: boolean;
  username?: string;
}> {
  const token = await getAccessToken();
  if (!token) {
    return { connected: false };
  }

  const res = await fetch(`${API_URL}/api/github/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return { connected: false };
  }

  return res.json();
}
