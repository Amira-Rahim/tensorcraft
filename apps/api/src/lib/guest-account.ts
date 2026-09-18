import type {
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@tensorcraft/supabase";
import { logger } from "./logger";

/**
 * Resolve the Supabase user for a guest purchase, creating one if needed.
 *
 * Guest checkout lets someone pay before they have an account, so the webhook
 * is the first point at which we know who they are. Stripe gives us a verified
 * email (they just paid with it), which is enough to either attach the
 * purchase to an existing account or open a new one.
 *
 * Lookup goes through `profiles.email` rather than `auth.admin.listUsers()`,
 * which is paginated and would degrade badly as the user table grows.
 *
 * Returns null if the account could not be resolved or created. Callers MUST
 * treat null as a failure and let Stripe retry: silently dropping the purchase
 * would take the buyer's money and grant nothing.
 */
export async function resolveOrCreateUserByEmail(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  // Existing account: attach the purchase to it. This is also the collision
  // path, someone who already signed up and then bought as a guest, so a
  // guest purchase never orphans an existing account.
  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (lookupError) {
    // No address in the log line: the caller retries via Stripe, whose
    // dashboard already ties this failure to the checkout session.
    logger.error({ err: lookupError }, "Guest account: profile lookup failed");
    return null;
  }
  if (existing?.id) return existing.id as string;

  // No account yet. `email_confirm: true` because Stripe already proved
  // control of the address via payment; a confirmation round-trip here would
  // block access to something they have paid for.
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: normalized,
      email_confirm: true,
    });

  if (createError || !created?.user?.id) {
    logger.error({ err: createError }, "Guest account: createUser failed");
    return null;
  }

  logger.info(
    { userId: created.user.id },
    "Guest account: provisioned from purchase",
  );
  return created.user.id;
}

/**
 * Email the buyer a magic link so they can reach what they just bought.
 *
 * Uses Supabase's own OTP mail, the same channel as normal sign-in, so this
 * adds no new email infrastructure. Best-effort: a failure here must not fail
 * the webhook, because the purchase itself is already recorded and the buyer
 * can still sign in from the site with the same address.
 */
export async function sendPurchaseAccessLink(
  anon: ReturnType<typeof getSupabaseServerClient>,
  email: string,
  redirectTo?: string,
): Promise<void> {
  try {
    await anon.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });
  } catch (err) {
    logger.error({ err }, "Guest account: access link send failed");
  }
}
