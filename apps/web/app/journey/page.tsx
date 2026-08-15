import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildGuestJourneyStates,
  getJourneyState,
} from "@/lib/journey-progress";
import { JourneyRing } from "./journey-ring";

export const metadata: Metadata = {
  title: "The Journey: five worlds, one arc | Tensorcraft",
  description:
    "The five Tensorcraft worlds are one connected story. Each finale hands its problem to the next domain: the tensor as lingua franca. Follow the canonical journey or play any world on its own.",
  alternates: { canonical: "https://tensorcraft.app/journey" },
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/journey",
    title: "The Journey: five worlds, one arc | Tensorcraft",
    images: [
      "/api/og?title=Five%20worlds%2C%20one%20arc&world=deep-orbit&subtitle=The%20signal%20answers%20back",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Journey: five worlds, one arc | Tensorcraft",
    images: [
      "/api/og?title=Five%20worlds%2C%20one%20arc&world=deep-orbit&subtitle=The%20signal%20answers%20back",
    ],
  },
};

export default async function JourneyPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const state = user ? await getJourneyState(user.id) : null;

  // Record the durable completion timestamp the moment the closed ring is
  // observed. Since the explicit enroll step was cut (2026-08-15), the
  // journey_enrollment table serves only as this completion record: most
  // users have no row, so this must upsert, not update. Effectively
  // idempotent (fires only while completedAt is null; a racing double-load
  // writes near-identical timestamps), self-scoped under the RLS policy,
  // and best-effort: the ring UI derives ringComplete independently, so a
  // failed write only delays the timestamp until the next visit.
  if (user && state?.ringComplete && !state.completedAt) {
    await supabase
      .from("journey_enrollment")
      .upsert(
        { user_id: user.id, completed_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
  }

  return (
    <main className="min-h-screen bg-page px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-3 flex items-center gap-3">
          <span className="w-[7px] h-[7px] bg-primary inline-block" />
          The arc
        </div>
        <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-text-primary mb-4">
          Five worlds, one journey
        </h1>
        <p className="text-lg text-text-muted font-sans leading-relaxed mb-4 max-w-2xl">
          Each world is a complete machine learning specialization with its own
          story. Play any world by itself, or follow the journey through all
          five.
        </p>

        {/* Status band. The explicit enroll step was cut 2026-08-15: everyone
            signed-in is on the journey (progress in ring order IS the
            journey), so the only states left are the sign-in prompt and the
            closed-ring acknowledgement. */}
        {state ? (
          state.ringComplete ? (
            <div
              className="brutalist-shadow border border-primary bg-surface-raised p-5 mb-8"
              data-testid="journey-complete"
            >
              <p className="font-mono text-sm font-bold text-primary">
                Journey complete: you closed the ring.
              </p>
              <p className="text-sm text-text-muted mt-1">
                Every world finished. The signal came all the way back to Deep
                Orbit.
              </p>
            </div>
          ) : null
        ) : (
          <div
            className="brutalist-shadow border border-border bg-surface-raised p-5 mb-8"
            data-testid="journey-signin"
          >
            <p className="text-sm text-text-muted mb-4">
              Sign in to track your progress across the ring.
            </p>
            <Link
              href="/auth?redirectTo=/journey"
              className="inline-flex items-center justify-center h-11 px-6 text-sm font-mono font-semibold uppercase tracking-wider bg-primary text-on-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* The ring. Signed-out visitors get the same stack built from the
            manifests: no progress, no recommendation, hero falls back to
            the first launched world. */}
        {state ? (
          <JourneyRing
            worldStates={state.worlds}
            recommendedNext={state.recommendedNext}
            showProgress
          />
        ) : (
          <JourneyRing
            worldStates={buildGuestJourneyStates()}
            recommendedNext={null}
            showProgress={false}
          />
        )}
      </div>
    </main>
  );
}
