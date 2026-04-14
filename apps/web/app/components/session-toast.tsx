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
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-4 px-5 py-4 font-mono text-sm border border-red-500/30 bg-red-500/10 backdrop-blur-sm md:left-auto md:right-6 md:max-w-md"
      role="alert"
    >
      <div>
        <p className="text-red-400 font-medium">Session expired</p>
        <p className="text-red-400/70 text-xs mt-1">
          Sign in again to save your progress.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-xs text-red-400/50 hover:text-red-400"
        >
          Dismiss
        </button>
        <Link
          href={`/auth?redirectTo=${redirectTo}`}
          className="text-xs font-semibold px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
        >
          Sign in →
        </Link>
      </div>
    </div>
  );
}
