import { getSupabaseBrowserClient } from "./supabase/client";
import { reportDataError } from "./report-data-error";

/**
 * Submit a waitlist signup. Returns "done" on success or duplicate, "error" on
 * failure.
 *
 * This function must NEVER throw. Both callers
 * (`world-waitlist-form.tsx`, `newsletter-modal.tsx`) do
 * `setStatus("submitting")` then `setStatus(await submitWaitlist(...))` with no
 * try/catch, so an exception here skipped the second setStatus and left the
 * form stuck on "submitting" forever - with a perfectly good error state
 * rendered just below that the throw made unreachable. Returning "error"
 * instead of throwing is what makes those call sites correct by construction.
 */
export async function submitWaitlist(
  email: string,
  worldId: string,
  source: string,
  opts?: {
    /**
     * Explicit opt-in to the weekly digest. As of 2026-08-17 NO call site
     * passes true: the newsletter modal became a launch-updates signup
     * (its copy promises launch emails only), and world waitlist forms
     * were always false. "Tell me when this ships" is not newsletter
     * consent (GDPR Art. 4(11); Tier 1-LEGAL waitlist consent fix,
     * migration 050 flipped the column default to false to match). Pass
     * true only from a surface whose copy explicitly offers the digest.
     */
    subscribeToDigest?: boolean;
  },
): Promise<"done" | "error"> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("waitlist").insert({
      email: email.trim(),
      world_id: worldId,
      source,
      subscribed: opts?.subscribeToDigest === true,
    });

    // 23505 = unique violation: already on the list, which is a success from
    // the visitor's point of view.
    if (error && error.code === "23505") {
      return "done";
    }

    if (error) {
      // The bug this exists for: a CHECK constraint rejected every source
      // value the app sends, this returned "error", and nothing anywhere
      // recorded why. For months. 23505 above is deliberately excluded, since
      // a duplicate is a success from the visitor's point of view.
      reportDataError("waitlist.insert", error, { worldId, source });
      return "error";
    }

    return "done";
  } catch (err) {
    // Network failure, blocked storage while constructing the client, or a
    // PostgREST transport error. All are "try again", never a dead form.
    reportDataError("waitlist.insert", {
      message: err instanceof Error ? err.message : "transport failure",
    });
    return "error";
  }
}
