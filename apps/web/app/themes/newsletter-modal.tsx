"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FocusTrap } from "@tensorcraft/ui/a11y";
import { submitWaitlist } from "@/lib/waitlist";

export interface NewsletterModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Newsletter signup modal — brutalist dialog, trapped focus, escape-to-close,
 * click-outside-to-close. Submits to the shared waitlist helper
 * (`submitWaitlist`) which writes to Supabase.
 */
export function NewsletterModal({ open, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset form state whenever the modal closes.
  useEffect(() => {
    if (!open) {
      setEmail("");
      setStatus("idle");
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (status === "submitting") return;
      const trimmed = email.trim();
      if (!trimmed) {
        setStatus("error");
        return;
      }
      setStatus("submitting");
      const result = await submitWaitlist(trimmed, "all", "theme-selection");
      setStatus(result);
    },
    [email, status],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close when the backdrop itself is clicked — not its descendants.
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <FocusTrap active={open} initialFocus={inputRef} onEscape={onClose}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
        onClick={handleBackdropClick}
        data-testid="newsletter-modal-backdrop"
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="newsletter-modal-title"
          data-testid="newsletter-modal"
          className="relative w-full max-w-md border-2 border-border bg-surface-raised rounded-none brutalist-shadow"
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-border">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
              // get updates
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close newsletter signup"
              className="font-mono text-sm text-text-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-none px-2"
            >
              ×
            </button>
          </div>

          <div className="px-6 py-6">
            <h2
              id="newsletter-modal-title"
              className="text-2xl font-mono font-bold text-text-primary mb-2 tracking-tight"
            >
              The Bridge, monthly
            </h2>
            <p className="text-sm text-text-muted mb-5 leading-relaxed">
              New themes, bridge essays, launch discounts. No spam, one email at
              most per month.
            </p>

            {status === "done" ? (
              <div
                role="status"
                data-testid="newsletter-success"
                className="border-2 border-primary/50 bg-primary/10 px-4 py-3 font-mono text-sm text-primary rounded-none"
              >
                You&rsquo;re on the list.
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <label
                  htmlFor="newsletter-email"
                  className="block font-mono text-xs uppercase tracking-[0.15em] text-text-muted mb-2"
                >
                  Email
                </label>
                <input
                  ref={inputRef}
                  id="newsletter-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  disabled={status === "submitting"}
                  className="w-full border-2 border-border bg-page px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary rounded-none"
                  data-testid="newsletter-email-input"
                />

                {status === "error" ? (
                  <p
                    role="alert"
                    className="mt-2 font-mono text-xs text-red-400"
                  >
                    Couldn&rsquo;t submit. Check the address and try again.
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  data-testid="newsletter-submit"
                  className="mt-5 w-full inline-flex items-center justify-center font-mono px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all bg-primary text-page border-2 border-primary rounded-none brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-60"
                >
                  {status === "submitting" ? "Submitting..." : "Subscribe →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
