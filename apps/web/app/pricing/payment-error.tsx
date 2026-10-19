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
      className="flex items-center gap-3.5 relative mx-auto max-w-[720px] px-6 py-4 bg-surface-raised border border-error/35"
    >
      {/* Red indicator dot */}
      <span className="w-2 h-2 bg-error shrink-0" />

      <p className="flex-1 m-0 text-sm leading-relaxed text-text-primary">
        We could not complete your payment. Please try again or{" "}
        <a
          href="mailto:support@tensorcraft.app"
          className="text-error underline underline-offset-2"
        >
          contact support
        </a>
        .
      </p>

      <button
        onClick={dismiss}
        aria-label="Dismiss error"
        className="flex items-center justify-center w-11 h-11 shrink-0 bg-transparent border border-interactive text-text-muted hover:text-text-primary hover:border-primary/30 transition-colors cursor-pointer text-base leading-none p-0"
      >
        &#10005;
      </button>
    </div>
  );
}
