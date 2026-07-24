"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SessionToast() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function handleExpired() {
      setVisible(true);
      // Auto-hide after 15 seconds
      setTimeout(() => setVisible(false), 15_000);
    }

    window.addEventListener("tc:session-expired", handleExpired);
    return () =>
      window.removeEventListener("tc:session-expired", handleExpired);
  }, []);

  if (!visible) return null;

  const redirectTo = encodeURIComponent(pathname);

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-4 px-5 py-4 font-mono text-sm border border-error/30 bg-error/10 backdrop-blur-sm md:left-auto md:right-6 md:max-w-md"
      role="alert"
    >
      <div>
        <p className="text-error font-medium">Session expired</p>
        <p className="text-error text-xs mt-1">
          Sign in again to save your progress.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-xs text-text-muted hover:text-error"
        >
          Dismiss
        </button>
        <Link
          href={`/auth?redirectTo=${redirectTo}`}
          className="text-xs font-semibold px-4 py-2 bg-error/15 text-error border border-error/30 hover:bg-error/30 transition-colors"
        >
          Sign in →
        </Link>
      </div>
    </div>
  );
}
