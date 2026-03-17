"use client";

import { useState, useEffect, useCallback } from "react";
import { submitWaitlist } from "@/lib/waitlist";

interface ComingSoonModalProps {
  themeId: string;
  themeName: string;
  specialization: string;
  description: string;
  accentColor: string;
  surfaceColor: string;
  open: boolean;
  onClose: () => void;
}

export function ComingSoonModal({
  themeId,
  themeName,
  specialization,
  description,
  accentColor,
  // surfaceColor kept in interface for API compatibility
  surfaceColor: _surfaceColor,
  open,
  onClose,
}: ComingSoonModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );

  const previousFocusRef = useCallback(() => {
    return document.activeElement as HTMLElement | null;
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab") {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      const prevFocus = previousFocusRef();
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      // Auto-focus close button
      const closeBtn = document.querySelector<HTMLElement>(
        '[role="dialog"] [aria-label="Close"]',
      );
      closeBtn?.focus();

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        prevFocus?.focus();
      };
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown, previousFocusRef]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("saving");
    const result = await submitWaitlist(email, themeId, "coming-soon-modal");
    setStatus(result);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${themeName} — Coming Soon`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md p-8 bg-surface-raised"
        style={{
          border: `2px solid ${accentColor}`,
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-text-muted transition-colors hover:text-text-primary font-mono"
          aria-label="Close"
        >
          &#x2715;
        </button>

        {/* Accent bar */}
        <div className="w-12 h-1 mb-6" style={{ background: accentColor }} />

        {/* Theme info */}
        <h2
          className="text-xl font-bold font-mono mb-1"
          style={{ color: accentColor }}
        >
          {themeName}
        </h2>
        <p className="text-xs font-mono uppercase tracking-widest text-text-muted mb-3">
          {specialization}
        </p>
        <p className="text-sm leading-relaxed text-text-muted mb-6">
          {description}
        </p>

        {/* Status badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold font-mono uppercase tracking-wider bg-surface-overlay text-text-muted mb-6">
          Coming Soon
        </div>

        {/* Email form or confirmation */}
        {status === "done" ? (
          <div
            className="p-4 text-center text-sm font-mono"
            style={{
              background: `${accentColor}15`,
              color: accentColor,
            }}
          >
            You&apos;ll be notified when {themeName} launches!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-text-muted font-mono">
              Get notified when this theme launches:
            </p>
            <div className="flex gap-2">
              <label htmlFor="waitlist-email" className="sr-only">
                Email address
              </label>
              <input
                id="waitlist-email"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-10 px-4 text-sm text-text-primary font-mono outline-none bg-surface border border-border placeholder:text-text-muted/50 focus:border-primary"
              />
              <button
                type="submit"
                disabled={status === "saving"}
                className="h-10 px-5 text-sm font-semibold font-mono text-black disabled:opacity-50 transition-all hover:translate-x-px hover:translate-y-px hover:shadow-none"
                style={{
                  background: accentColor,
                  boxShadow: `3px 3px 0px ${accentColor}`,
                }}
              >
                {status === "saving" ? "..." : "Notify Me"}
              </button>
            </div>
            {status === "error" && (
              <p className="text-xs font-mono text-red-500">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
