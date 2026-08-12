"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-fetch";
import { trackCheckoutStarted } from "@/lib/analytics";
import { errorMessageForCode, ERROR_MESSAGES } from "@/lib/error-messages";

interface CheckoutButtonProps {
  planId: string;
  worldIds: string[];
  children: React.ReactNode;
  recommended?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}

export function CheckoutButton({
  planId,
  worldIds,
  children,
  recommended = false,
  disabled = false,
  disabledReason,
  className = "",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [alreadyOwned, setAlreadyOwned] = useState(false);

  // Check if user already owns all worlds in this plan
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("purchases")
        .select("world_ids")
        .eq("user_id", session.user.id)
        .in("status", ["completed", "partially_refunded"])
        .then(({ data }) => {
          if (!data) return;
          const owned = new Set(data.flatMap((p) => p.world_ids));
          const allOwned = worldIds.every((t) => owned.has(t));
          setAlreadyOwned(allOwned);
        });
    });
  }, [worldIds]);

  async function handleCheckout() {
    if (disabled || alreadyOwned) return;

    setLoading(true);
    setError(null);
    trackCheckoutStarted(planId);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // GUEST CHECKOUT IS DISABLED (2026-07-21). `POST /guest-checkout`
        // exists on the API but nothing routes to it, because the flow it
        // completed was broken in three ways that only surface after the card
        // is charged:
        //   1. Stripe returns to /dashboard/purchase-success, which redirects
        //      a session-less visitor to /auth — pay, then hit a login wall,
        //      no receipt.
        //   2. A returning customer whose session merely expired reads as a
        //      guest here, and /guest-checkout carries neither the
        //      already-own guard nor the upgrade credit, so they are charged
        //      full price a second time.
        //   3. checkout.session.async_payment_succeeded resolves identity from
        //      client_reference_id only, so a guest paying by bank debit stays
        //      "pending" forever — money taken, access never granted.
        // Do not re-point this at /guest-checkout until all three are fixed
        // and lib/guest-account.ts has real (unmocked) tests. See
        // docs/roadmap.md Horizon 0.
        //
        // Carry the WHOLE selection through the auth roundtrip so the buyer
        // returns to the picker they left (audit run #7).
        const restore = new URLSearchParams({
          plan: planId,
          worlds: worldIds.join(","),
        });
        router.push(
          `/auth?redirectTo=${encodeURIComponent(`/pricing?${restore.toString()}`)}`,
        );
        return;
      }

      let response: Response;
      try {
        // apiFetch, not raw fetch: it carries a 10s AbortController and emits
        // `tc:api-timeout` for the global toast. With raw fetch a stalled API
        // left the button on "Redirecting…" forever with no error ever shown.
        // It also attaches the bearer token itself and routes to the separate
        // API host (api.tensorcraft.app) — a relative URL 404s on Vercel.
        response = await apiFetch("/api/payments/checkout", {
          method: "POST",
          body: JSON.stringify({ planId, worldIds }),
        });
      } catch {
        setError(ERROR_MESSAGES.network);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        // Prefer a server-supplied code; fall back to HTTP status heuristics.
        let code: string | undefined;
        try {
          const data = await response.json();
          code = data.code ?? data.error;
        } catch {
          // Response wasn't valid JSON
        }
        if (!code) {
          if (response.status === 401) code = "session_expired";
          else if (response.status === 403) code = "forbidden";
          else if (response.status === 429) code = "rate_limited";
        }
        setError(errorMessageForCode(code));
        setLoading(false);
        return;
      }

      const data = await response.json();
      // NOTE: the two redirect paths below deliberately do NOT clear the
      // loading state. `window.location.href` starts a navigation that takes
      // time; the old `finally { setLoading(false) }` re-enabled the button
      // while the browser was still on its way to Stripe, so a second click
      // created a second Checkout Session. Leaving it disabled until the page
      // unloads is the point.
      if (data.granted) {
        // Auto-grant, worlds were granted instantly, redirect to success
        window.location.href = "/dashboard/purchase-success";
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(ERROR_MESSAGES.unknown);
      setLoading(false);
    } catch {
      setError(ERROR_MESSAGES.unknown);
      setLoading(false);
    }
  }

  const isDisabled = disabled || loading || alreadyOwned;

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isDisabled}
        className={`flex items-center justify-center w-full h-11 text-[13px] font-medium font-mono uppercase tracking-wider rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
          alreadyOwned
            ? "bg-transparent text-text-muted border border-border cursor-default"
            : recommended
              ? "bg-primary text-on-primary border border-primary hover:brutalist-shadow hover:-translate-x-0.5 hover:-translate-y-0.5"
              : "bg-transparent text-primary border border-primary hover:bg-primary hover:text-on-primary"
        } ${className}`}
      >
        {alreadyOwned
          ? "Already Owned ✓"
          : loading
            ? "Redirecting..."
            : children}
      </button>
      {disabled && disabledReason && (
        <p className="mt-2 text-xs text-center text-text-muted font-mono">
          {disabledReason}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-center text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
