/**
 * Authenticated fetch wrapper for API calls.
 * Includes auth header from Supabase session and emits
 * tc:session-expired event on 401 responses.
 */
import { getApiUrl } from "./api-url";
import { getSupabaseBrowserClient } from "./supabase/client";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const apiUrl = getApiUrl();
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

  // Emit session-expired event on 401 for toast display
  if (response.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tc:session-expired"));
  }

  return response;
}
