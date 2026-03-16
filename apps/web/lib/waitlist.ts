import { getSupabaseBrowserClient } from "./supabase/client";

/**
 * Submit a waitlist signup. Returns "done" on success or duplicate, "error" on failure.
 */
export async function submitWaitlist(
  email: string,
  themeId: string,
  source: string,
): Promise<"done" | "error"> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("waitlist")
    .insert({ email: email.trim(), theme_id: themeId, source });

  if (error && error.code === "23505") {
    return "done";
  }

  if (error) return "error";

  return "done";
}
