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
  surfaceColor,
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
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl p-8"
        style={{
          background: surfaceColor,
          border: `1px solid ${accentColor}20`,
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/[0.06]"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
          aria-label="Close"
        >
          &#x2715;
        </button>

        {/* Accent bar */}
        <div
          className="w-12 h-1 rounded-full mb-6"
          style={{ background: accentColor }}
        />

        {/* Theme info */}
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--tc-text, #FFFFFF)" }}
        >
          {themeName}
        </h2>
        <p className="text-sm font-medium mb-3" style={{ color: accentColor }}>
          {specialization}
        </p>
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          {description}
        </p>

        {/* Status badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider mb-6"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "var(--tc-muted, #8B92A5)",
          }}
        >
          Coming Soon
        </div>

        {/* Email form or confirmation */}
        {status === "done" ? (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{
              background: `${accentColor}10`,
              color: accentColor,
            }}
          >
            You&apos;ll be notified when {themeName} launches!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p
              className="text-xs"
              style={{ color: "var(--tc-muted, #8B92A5)" }}
            >
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
                className="flex-1 h-10 px-4 rounded-full text-sm text-white outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <button
                type="submit"
                disabled={status === "saving"}
                className="h-10 px-5 rounded-full text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: accentColor, color: "#000" }}
              >
                {status === "saving" ? "..." : "Notify Me"}
              </button>
            </div>
            {status === "error" && (
              <p className="text-xs" style={{ color: "#EF4444" }}>
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
