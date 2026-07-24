"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
