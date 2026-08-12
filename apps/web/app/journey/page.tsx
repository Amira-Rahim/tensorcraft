import Link from "next/link";
import type { Metadata } from "next";
import { worlds } from "@tensorcraft/worlds";
import { JOURNEY_ORDER, getLeadsTo } from "@tensorcraft/shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getJourneyState } from "@/lib/journey-progress";
import { JourneyRing } from "./journey-ring";
import { EnrollButton } from "./enroll-button";

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
  // observed. Migration 044's header promises "recording it once … gives a
  // durable completion timestamp", but nothing ever wrote the column (R3-6)
  // — completedAt was permanently null. Idempotent (fires only while null),
  // self-scoped under the journey_enrollment RLS policy, and best-effort:
  // the ring UI derives ringComplete independently, so a failed write only
  // delays the timestamp until the next visit.
  if (user && state?.enrolled && state.ringComplete && !state.completedAt) {
    await supabase
      .from("journey_enrollment")
      .update({ completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("completed_at", null);
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
          Each world is a complete ML specialization with its own story, and
          each finale hands its problem to the next. Deep Orbit&rsquo;s anomaly
          becomes Neon Protocol&rsquo;s heatmap; the signal answers back across
          all five. Play any world on its own, or follow the canonical journey
          through the whole ring.
        </p>

        {/* Enrollment / status band */}
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
          ) : state.enrolled ? (
            <div
              className="brutalist-shadow border border-border bg-surface-raised p-5 mb-8"
              data-testid="journey-enrolled"
            >
              <p className="font-mono text-sm font-bold text-text-primary">
                You&rsquo;re on the canonical journey.
              </p>
              {state.recommendedNext ? (
                <p className="text-sm text-text-muted mt-1">
                  Up next:{" "}
                  <Link
                    href={`/worlds/${state.recommendedNext}`}
                    className="text-primary hover:underline underline-offset-4"
                  >
                    {worlds[state.recommendedNext]?.displayName}
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          ) : (
            <div
              className="brutalist-shadow border border-border bg-surface-raised p-5 mb-8"
              data-testid="journey-enroll"
            >
              <p className="text-sm text-text-muted mb-4 leading-relaxed">
                Commit to the whole arc. The canonical journey tracks your run
                through all five worlds as one storyline. It never blocks
                anything, it just marks the path.
              </p>
              <EnrollButton />
            </div>
          )
        ) : (
          <div
            className="brutalist-shadow border border-border bg-surface-raised p-5 mb-8"
            data-testid="journey-signin"
          >
            <p className="text-sm text-text-muted mb-4">
              Sign in to follow the canonical journey and track your progress
              across the ring.
            </p>
            <Link
              href="/auth?redirectTo=/journey"
              className="inline-flex items-center justify-center h-11 px-6 text-sm font-mono font-semibold uppercase tracking-wider bg-primary text-on-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* The ring */}
        {state ? (
          <JourneyRing
            worldStates={state.worlds}
            recommendedNext={state.recommendedNext}
            showProgress
          />
        ) : (
          <ol className="space-y-4">
            {JOURNEY_ORDER.map((slug, i) => {
              const manifest = worlds[slug];
              const leadsTo = getLeadsTo(slug);
              return (
                <li
                  key={slug}
                  className="brutalist-shadow border border-border bg-surface-raised p-5 tc-world-card"
                  style={
                    {
                      "--card-primary": manifest?.palette.primary,
                      "--card-primary-light": manifest?.paletteLight.primary,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="shrink-0 font-mono text-sm font-bold w-8 h-8 flex items-center justify-center border"
                      style={{
                        color: "var(--card-active-primary)",
                        borderColor: "var(--card-active-primary)",
                      }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-mono font-bold text-text-primary">
                        {manifest?.displayName}
                      </h2>
                      <p className="text-sm text-text-muted mt-1 leading-relaxed">
                        {manifest?.tagline}
                      </p>
                      {leadsTo ? (
                        <p className="text-[11px] font-mono uppercase tracking-wider text-text-muted mt-2">
                          Leads to {worlds[leadsTo]?.displayName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </main>
  );
}
