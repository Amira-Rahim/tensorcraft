"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface CheckoutButtonProps {
  planId: string;
  themeIds?: string[];
  children: React.ReactNode;
  recommended?: boolean;
  className?: string;
}

export function CheckoutButton({
  planId,
  themeIds = ["deep-orbit"],
  children,
  recommended = false,
  className = "",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckout() {
    setLoading(true);
    setError(null);

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

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={`flex items-center justify-center w-full h-[52px] rounded-full text-[15px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={
          recommended
            ? {
                border: "1px solid rgba(0,212,255,0.3)",
                background: "rgba(0,212,255,0.08)",
                color: "#FFFFFF",
              }
            : {
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "#FFFFFF",
              }
        }
      >
        {loading ? "Redirecting..." : children}
      </button>
      {error && (
        <p
          className="mt-2 text-xs text-center"
          style={{ color: "#EF4444" }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
