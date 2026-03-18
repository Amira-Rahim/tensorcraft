"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackCheckoutStarted } from "@/lib/analytics";

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
  const router = useRouter();

  async function handleCheckout() {
    if (disabled) return;

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
          `/auth/sign-in?redirectTo=${encodeURIComponent(`/pricing?plan=${planId}`)}`,
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
        setError("Network error. Please check your connection and try again.");
        return;
      }

      if (!response.ok) {
        let errorMessage = "Failed to create checkout session";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Response wasn't valid JSON
        }
        setError(errorMessage);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        setError("No checkout URL received. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = disabled || loading;

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isDisabled}
        className={`flex items-center justify-center w-full h-[52px] text-[15px] font-medium font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          recommended
            ? "bg-primary text-[#1C1C1C] border border-primary hover:shadow-[4px_4px_0px_0px_#C8C8C8] hover:-translate-x-0.5 hover:-translate-y-0.5"
            : "bg-transparent text-primary border border-primary hover:bg-primary hover:text-[#1C1C1C]"
        } ${className}`}
      >
        {loading ? "Redirecting..." : children}
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
