"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackCheckoutStarted } from "@/lib/analytics";
import { errorMessageForCode, ERROR_MESSAGES } from "@/lib/error-messages";

interface CheckoutButtonProps {
  planId: string;
  themeIds: string[];
  children: React.ReactNode;
  recommended?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}

export function CheckoutButton({
  planId,
  themeIds,
  children,
  recommended = false,
  disabled = false,
  disabledReason,
  className = "",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const router = useRouter();

  // Check if user already owns all themes in this plan
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("purchases")
        .select("theme_ids")
        .eq("user_id", session.user.id)
        .eq("status", "completed")
        .then(({ data }) => {
          if (!data) return;
          const owned = new Set(data.flatMap((p) => p.theme_ids));
          const allOwned = themeIds.every((t) => owned.has(t));
          setAlreadyOwned(allOwned);
        });
    });
  }, [themeIds]);

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
        router.push(
          `/auth?redirectTo=${encodeURIComponent(`/pricing?plan=${planId}`)}`,
        );
        return;
      }

      let response: Response;
      try {
        response = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ planId, themeIds }),
        });
      } catch {
        setError(ERROR_MESSAGES.network);
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
        return;
      }

      const data = await response.json();
      if (data.granted) {
        // Auto-grant, themes were granted instantly, redirect to success
        window.location.href = "/dashboard/purchase-success";
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(ERROR_MESSAGES.unknown);
      }
    } catch {
      setError(ERROR_MESSAGES.unknown);
    } finally {
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
              ? "bg-primary text-page border border-primary hover:brutalist-shadow hover:-translate-x-0.5 hover:-translate-y-0.5"
              : "bg-transparent text-primary border border-primary hover:bg-primary hover:text-page"
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
        <p className="mt-2 text-xs text-center text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
