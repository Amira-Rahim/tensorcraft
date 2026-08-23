"use client";

import { useState } from "react";
import { submitWaitlist } from "@/lib/waitlist";

/**
 * Shown in place of the buy buttons when the visitor is in the EU or UK.
 *
 * Why the gate exists: a seller established outside the EU gets no
 * EUR 10,000 threshold, so EU VAT would be due at the buyer's rate from the
 * very first sale, the UK has no threshold either, and OSS registration
 * cannot be backdated. Until the US LLC exists, refusing the sale is cheaper
 * than a liability that cannot be unwound. Owner decision 2026-08-23; see the
 * Tier 1-LEGAL decision note in `docs/post-launch-backlog.md`.
 *
 * Why it captures rather than merely refuses: this list is the only
 * measurement of EU/UK paid demand that exists, and that number is evidence
 * the 500-user gate weighs when deciding whether to form the entity at all.
 * Refusing silently would throw away the data the gate is meant to judge.
 *
 * Free access is deliberately untouched. VAT triggers on a supply for
 * consideration, so reading the free module from Berlin costs nothing, and
 * those signups are the metric the gate actually counts.
 */
export function RegionNotice() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");

  return (
    <div className="max-w-105 mx-auto text-left border border-border bg-surface-raised p-5 mb-8">
      <p className="font-mono text-[10px] uppercase tracking-[2px] text-primary mb-2">
        Your region
      </p>
      <h2 className="text-lg font-semibold text-text-primary mb-2">
        Purchases are not open in the EU or UK yet
      </h2>
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Everything free stays available. You can sign up, read, and finish the
        first module from anywhere. Only paid access is on hold while the
        business registration is sorted out. Leave your email and we&rsquo;ll
        send one message when it opens.
      </p>

      {status === "done" ? null : (
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
            // Three arguments on purpose: the fourth is digest consent, and
            // "tell me when I can buy" is not newsletter consent (GDPR
            // Art. 4(11), migration 050).
            setStatus(await submitWaitlist(trimmed, "all", "region-blocked"));
          }}
        >
          <label htmlFor="region-notice-email" className="sr-only">
            Email address
          </label>
          <input
            id="region-notice-email"
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
            {status === "submitting" ? "Sending…" : "Email me when it opens"}
          </button>
        </form>
      )}

      {/*
        Always mounted, never rendered together with its own content: a
        polite live region inserted at the same moment as its text is
        announced unreliably. Same pattern the pending poller uses.
      */}
      <p role="status" className="text-sm font-mono text-primary">
        {status === "done" ? "Done. We will email you once." : ""}
      </p>

      {status === "error" ? (
        <p role="alert" className="mt-2 text-xs font-mono text-error">
          Couldn&rsquo;t save that. Try again.
        </p>
      ) : null}
    </div>
  );
}
