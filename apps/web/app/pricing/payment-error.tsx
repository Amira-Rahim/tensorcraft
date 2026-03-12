"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function PaymentError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const hasError = searchParams.get("error") === "payment_failed";

  const dismiss = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  if (!hasError) return null;

  return (
    <div
      role="alert"
      style={{
        background: "var(--tc-surface, #0F1320)",
        border: "1px solid rgba(239,68,68,0.35)",
        borderRadius: "14px",
        padding: "16px 24px",
        margin: "0 auto",
        maxWidth: "720px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        position: "relative",
      }}
    >
      {/* Red indicator dot */}
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#EF4444",
          flexShrink: 0,
        }}
      />

      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: "14px",
          lineHeight: "1.5",
          color: "var(--tc-text, #FFFFFF)",
        }}
      >
        Payment could not be completed. Please try again or{" "}
        <a
          href="mailto:support@tensorcraft.dev"
          style={{
            color: "#EF4444",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          contact support
        </a>
        .
      </p>

      <button
        onClick={dismiss}
        aria-label="Dismiss error"
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "8px",
          color: "var(--tc-muted, #8B92A5)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          flexShrink: 0,
          fontSize: "16px",
          lineHeight: 1,
          padding: 0,
          transition: "border-color 0.15s",
        }}
      >
        &#10005;
      </button>
    </div>
  );
}
