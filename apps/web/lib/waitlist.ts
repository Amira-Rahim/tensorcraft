import { getSupabaseBrowserClient } from "./supabase/client";

/**
 * Submit a waitlist signup. Returns "done" on success or duplicate, "error" on
 * failure.
 *
 * This function must NEVER throw. Both callers
 * (`theme-waitlist-form.tsx`, `newsletter-modal.tsx`) do
 * `setStatus("submitting")` then `setStatus(await submitWaitlist(...))` with no
 * try/catch, so an exception here skipped the second setStatus and left the
 * form stuck on "submitting" forever — with a perfectly good error state
 * rendered just below that the throw made unreachable. Returning "error"
 * instead of throwing is what makes those call sites correct by construction.
 */
export async function submitWaitlist(
  email: string,
  themeId: string,
  source: string,
): Promise<"done" | "error"> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.trim(), theme_id: themeId, source });

    // 23505 = unique violation: already on the list, which is a success from
    // the visitor's point of view.
    if (error && error.code === "23505") {
      return "done";
    }

    if (error) return "error";

    return "done";
  } catch {
    // Network failure, blocked storage while constructing the client, or a
    // PostgREST transport error. All are "try again", never a dead form.
    return "error";
  }
}
