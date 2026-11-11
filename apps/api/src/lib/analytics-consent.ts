import { getSupabaseAdminClient } from "@tensorcraft/supabase";

/** Read current consent for delayed webhooks as well as interactive actions. */
export async function hasServerAnalyticsConsent(
  userId: string,
): Promise<boolean> {
  if (!userId) return false;

  // A cached grant could outlive a withdrawal on another machine or browser.
  // Keep this optional lookup short so analytics cannot hold up fulfillment.
  const { data, error } = await getSupabaseAdminClient()
    .from("analytics_consents")
    .select("granted")
    .eq("user_id", userId)
    .abortSignal(AbortSignal.timeout(1_000))
    .maybeSingle();

  if (error) throw new Error("Analytics consent lookup failed");
  return data?.granted === true;
}
