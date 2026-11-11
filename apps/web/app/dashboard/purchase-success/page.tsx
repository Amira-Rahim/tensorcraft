import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { PurchaseAnalytics } from "./purchase-analytics";
import { PendingPoller } from "./pending-poller";
import {
  PurchaseSuccessView,
  type PurchaseReceipt,
} from "./purchase-success-view";

export const metadata: Metadata = {
  title: "Purchase Confirmation | Tensorcraft",
  description: "Your Tensorcraft purchase details and course access.",
};

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Stripe's success_url embeds `?session_id={CHECKOUT_SESSION_ID}`.
  // When present we look up the exact purchase row; otherwise fall back to
  // the user's most recent completed purchase (defends against users who
  // land here via direct nav or refresh without the query param).
  const params = (await searchParams) ?? {};
  const rawSessionId = params.session_id;
  const sessionId =
    typeof rawSessionId === "string"
      ? rawSessionId
      : Array.isArray(rawSessionId)
        ? rawSessionId[0]
        : undefined;

  const selectCols =
    "plan_id, world_ids, amount, created_at, stripe_session_id";

  let purchase: PurchaseReceipt | null = null;

  // A bounced delayed payment (async_payment_failed → status "failed") must
  // not render as "Almost There" with a poller promising "nothing is lost by
  // waiting" - that reads as still-confirming forever. Track it so the hero
  // can say what actually happened and point back at checkout.
  let paymentFailed = false;

  if (sessionId) {
    const { data } = await supabase
      .from("purchases")
      .select(`${selectCols}, status`)
      .eq("user_id", user.id)
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (data?.status === "completed") {
      purchase = data;
    } else if (data?.status === "failed") {
      paymentFailed = true;
    }
  }

  // Fallback to the most recent completed purchase ONLY when the page was
  // reached without a session_id (direct nav / refresh after the param was
  // dropped). When a session_id IS present but its row hasn't landed yet,
  // falling back here rendered the PREVIOUS purchase's full receipt - wrong
  // amount, wrong worlds - and skipped the poller, so the page never
  // corrected itself (audit run #7; latent until a second purchase is
  // possible). With a pending session_id we stay in the "Almost There"
  // state and let the poller pick up the real row.
  if (!purchase && !sessionId) {
    const { data } = await supabase
      .from("purchases")
      .select(selectCols)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    purchase = data ?? null;
  }

  return (
    <>
      {purchase && (
        <PurchaseAnalytics planId={purchase.plan_id} amount={purchase.amount} />
      )}
      <PurchaseSuccessView
        purchase={purchase}
        paymentFailed={paymentFailed}
        pendingContent={
          !purchase && !paymentFailed ? (
            <PendingPoller sessionId={sessionId} />
          ) : undefined
        }
      />
    </>
  );
}
