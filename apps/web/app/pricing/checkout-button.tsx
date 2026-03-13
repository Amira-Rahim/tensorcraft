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
  const router = useRouter();

  async function handleCheckout() {
    setLoading(true);

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

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId, themeIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      router.push("/pricing?error=payment_failed");
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
