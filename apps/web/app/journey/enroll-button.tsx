"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { track, EVENTS } from "@/lib/analytics-events";

/**
 * Opt into the canonical journey. Writes directly to journey_enrollment via
 * RLS (auth.uid() = user_id), matching how the app persists other per-user
 * state. Idempotent upsert so a double-click is harmless.
 */
export function EnrollButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  async function enroll() {
    setState("saving");
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Re-arm before navigating: if the user comes back via history the
        // button must not sit on a dead "Enrolling…".
        setState("idle");
        router.push("/auth?redirectTo=/journey");
        return;
      }
      const { error } = await supabase
        .from("journey_enrollment")
        .upsert(
          { user_id: user.id },
          { onConflict: "user_id", ignoreDuplicates: true },
        );
      if (error) {
        setState("error");
        return;
      }
      track(EVENTS.JOURNEY_ENROLLED, { source: "journey_page" });
      // refresh() swaps this button out for the enrolled view. Re-arm the
      // local state anyway: if the refreshed render races a read replica and
      // still shows the un-enrolled page, the learner keeps a live button
      // instead of a spinner that never resolves.
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={enroll}
        disabled={state === "saving"}
        className="inline-flex items-center justify-center h-11 px-6 text-sm font-mono font-semibold uppercase tracking-wider bg-primary text-on-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover disabled:opacity-60"
      >
        {state === "saving" ? "Enrolling…" : "Begin the canonical journey"}
      </button>
      {state === "error" ? (
        <p role="alert" className="mt-2 text-xs font-mono text-error">
          Couldn&rsquo;t enroll right now. Try again.
        </p>
      ) : null}
    </div>
  );
}
