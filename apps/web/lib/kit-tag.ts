/**
 * Fire-once Kit lifecycle tagging.
 *
 * Every call site used to inline this, and every one of them got the dedupe
 * wrong in a way that silently and PERMANENTLY discarded the user:
 *
 *   - Writing the localStorage flag BEFORE the request meant a signed-out
 *     visitor (the common case on the paywall and in free module 1) burned
 *     the flag on a pass that could never tag anything, so signing up later
 *     never produced the tag.
 *
 *   - Writing it on `res.ok` was no better. `/api/email` answers
 *     `200 {ok: true, skipped: true}` when the tag's env var is unconfigured,
 *     which is the DEFAULT state on a fresh deploy because
 *     `KIT_TAG_PAYWALL_HIT` and `KIT_TAG_MODULE_1_COMPLETE` are not in
 *     `.env.example` or the deployment guide. Launching without them set
 *     would have burned the flag for every affected browser, and configuring
 *     the secret afterwards would NOT recover them - the flag never clears.
 *
 * The rule this encodes: only record "already tagged" when Kit actually
 * tagged someone. Anything else (no session, unconfigured tag, network
 * failure, server error) leaves the flag unset so a later attempt can still
 * succeed. Over-tagging is harmless - Kit tags are idempotent - while
 * under-tagging is invisible and permanent.
 */

export async function tagKitEventOnce(
  event: string,
  dedupeKey: string,
): Promise<void> {
  try {
    if (localStorage.getItem(dedupeKey)) return;
  } catch {
    // localStorage unavailable (private mode). Proceed without dedupe:
    // tagging repeatedly is cheaper than never tagging.
  }

  const [{ getApiUrl }, { getSupabaseBrowserClient }] = await Promise.all([
    import("./api-url"),
    import("./supabase/client"),
  ]);

  const {
    data: { session },
  } = await getSupabaseBrowserClient().auth.getSession();
  // No token means no address to tag. Leave the flag unset.
  if (!session?.access_token) return;

  const res = await fetch(`${getApiUrl()}/api/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ event }),
  });

  if (!res.ok) return;

  // A 200 is not proof of tagging: `skipped` means the tag id env var is
  // missing on the API host. Treating that as success is what made the
  // failure permanent.
  const data = (await res.json().catch(() => null)) as {
    skipped?: boolean;
  } | null;
  if (!data || data.skipped) return;

  try {
    localStorage.setItem(dedupeKey, "1");
  } catch {
    // Nothing to do; the tag landed, which is what matters.
  }
}
