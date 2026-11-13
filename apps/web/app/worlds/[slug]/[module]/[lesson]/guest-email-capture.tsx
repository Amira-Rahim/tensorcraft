"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { submitWaitlist } from "@/lib/waitlist";

/**
 * Email capture at the point the free trial is actually being consumed
 * (fresh-eyes rerun T1-13 / §9): a guest who reads two lessons and leaves
 * was permanently unreachable - capture existed only on coming-soon pages
 * nobody can buy from. Renders on the Consequence (lesson-complete) step of
 * free-module lessons, for GUESTS only: signed-in learners are already
 * reachable via their account email and Kit tags.
 *
 * Consent posture: single-purpose capture - the button copy IS the ask
 * (progress + what's next for this world). Stored via the waitlist table
 * with a distinct source; `subscribed` stays false (migration 050), so this
 * never auto-enrolls anyone into the weekly digest.
 */

/**
 * Off since 2026-11-12. The form promised "a link back to where you
 * stopped" and confirmed "Sent.", but no sender mails `free-module-end`
 * waitlist rows. Turn it back on together with a sender for those rows.
 */
export const GUEST_EMAIL_CAPTURE_ENABLED = false;

export function GuestEmailCapture({ worldSlug }: { worldSlug: string }) {
  if (!GUEST_EMAIL_CAPTURE_ENABLED) return null;
  return <GuestEmailCaptureForm worldSlug={worldSlug} />;
}

function GuestEmailCaptureForm({ worldSlug }: { worldSlug: string }) {
  const [isGuest, setIsGuest] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");

  useEffect(() => {
    let cancelled = false;
    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!cancelled && !session) setIsGuest(true);
      })
      .catch(() => {
        // Session lookup failed (blocked storage etc.) - treat as guest;
        // worst case a signed-in user sees an email box they can ignore.
        if (!cancelled) setIsGuest(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isGuest) return null;

  return (
    <div
      data-testid="guest-email-capture"
      className="max-w-105 mx-auto text-left border border-border bg-surface-raised p-5 mb-8"
    >
      <p className="font-mono text-[10px] uppercase tracking-[2px] text-primary mb-2">
        Reading as a guest
      </p>
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Your progress lives in this browser only. Leave your email and{" "}
        we&rsquo;ll send you a link back to where you stopped, plus what comes
        after the free module.
      </p>
      {status === "done" ? (
        <p role="status" className="text-sm font-mono text-primary">
          Sent. See you back on the bridge.
        </p>
      ) : (
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = email.trim();
            if (!trimmed) {
              setStatus("error");
              return;
            }
            setStatus("submitting");
            setStatus(
              await submitWaitlist(trimmed, worldSlug, "free-module-end"),
            );
          }}
        >
          <label htmlFor="guest-capture-email" className="sr-only">
            Email address
          </label>
          <input
            id="guest-capture-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 min-w-0 bg-page border border-interactive px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="shrink-0 px-4 py-2.5 text-sm font-mono font-semibold uppercase tracking-wider bg-primary text-on-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-colors disabled:opacity-60"
          >
            {status === "submitting" ? "Sending…" : "Email me my spot"}
          </button>
        </form>
      )}
      {status === "error" ? (
        <p role="alert" className="mt-2 text-xs font-mono text-error">
          Couldn&rsquo;t save that. Try again.
        </p>
      ) : null}
    </div>
  );
}
