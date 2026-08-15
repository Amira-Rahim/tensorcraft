"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SceneCanvas } from "@tensorcraft/ui/effects";
import { worlds } from "@tensorcraft/worlds";
import { isLaunched, type WorldSlug } from "@tensorcraft/shared";
import { SCENE_BY_SLUG, hexToRgb } from "@/lib/scene-by-slug";
import type { JourneyWorldState } from "@/lib/journey-progress";

interface JourneyRingProps {
  worldStates: JourneyWorldState[];
  recommendedNext: WorldSlug | null;
  /** Show per-world progress (only meaningful for a signed-in learner). */
  showProgress: boolean;
}

/**
 * The five worlds as one route: a hero card for the world the learner
 * should be in, slim scene-washed rows for the rest, color-gradient
 * threads connecting each world to the next (and 05 back to 01). Purely
 * presentational; state comes from getJourneyState or
 * buildGuestJourneyStates.
 *
 * Every card wraps its world's signature <SceneCanvas> scene (shared with
 * /worlds and the homepage strip via lib/scene-by-slug), tinted by the
 * world's primary and ignited on hover/focus.
 */
export function JourneyRing({
  worldStates,
  recommendedNext,
  showProgress,
}: JourneyRingProps) {
  // The hero is the world to be in right now: the recommendation when one
  // exists (which can be a coming-soon world once every live world is
  // finished - then the hero's action is its waitlist), else the first
  // launched world (the guest/no-recommendation case).
  const heroSlug =
    recommendedNext ??
    worldStates.find((t) => isLaunched(t.slug))?.slug ??
    worldStates[0]?.slug;

  return (
    <ol className="relative" data-testid="journey-ring">
      {worldStates.map((t, i) => {
        const isHero = t.slug === heroSlug;
        const next = worldStates[(i + 1) % worldStates.length];
        return (
          <li key={t.slug}>
            {isHero ? (
              <HeroNode
                state={t}
                showProgress={showProgress}
                recommended={t.slug === recommendedNext}
              />
            ) : (
              <RowNode state={t} showProgress={showProgress} />
            )}
            {next ? (
              <Connector
                from={t}
                to={next}
                closing={i === worldStates.length - 1}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function code(position: number): string {
  return String(position + 1).padStart(2, "0");
}

function statusLabel(t: JourneyWorldState, live: boolean): string {
  return t.completed
    ? "Complete"
    : t.owned
      ? "In progress"
      : live
        ? "Available"
        : "Coming soon";
}

function ctaLabel(t: JourneyWorldState, live: boolean): string {
  return t.completed
    ? "Revisit →"
    : t.owned
      ? "Continue →"
      : live
        ? "Start →"
        : "Join waitlist →";
}

/** Clamp: world_progress can carry rows for re-slugged/removed lessons, so
 *  completedLessons can exceed totalLessons; an unclamped value renders a
 *  bar wider than its track. */
function progressPct(t: JourneyWorldState): number {
  return t.totalLessons > 0
    ? Math.min(100, Math.round((t.completedLessons / t.totalLessons) * 100))
    : 0;
}

/** Shared per-node scene plumbing: hover/focus ignition + memoized hues. */
function useNodeScene(slug: WorldSlug) {
  const manifest = worlds[slug];
  const [hovered, setHovered] = useState(false);
  const rgb = useMemo(
    () => hexToRgb(manifest?.palette.primary ?? "#6BAA8A"),
    [manifest],
  );
  const rgbLight = useMemo(
    () =>
      manifest?.paletteLight.primary
        ? hexToRgb(manifest.paletteLight.primary)
        : undefined,
    [manifest],
  );
  const bind = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };
  return { manifest, hovered, rgb, rgbLight, bind };
}

function HeroNode({
  state,
  showProgress,
  recommended,
}: {
  state: JourneyWorldState;
  showProgress: boolean;
  recommended: boolean;
}) {
  const { manifest, hovered, rgb, rgbLight, bind } = useNodeScene(state.slug);
  const live = isLaunched(state.slug);
  const pct = progressPct(state);
  const showMeter =
    showProgress && live && (state.owned || state.completedLessons > 0);

  return (
    <Link
      href={`/worlds/${state.slug}`}
      aria-label={`${manifest?.displayName ?? state.slug}, ${manifest?.tagline ?? ""}${live ? "" : " (coming soon)"}`}
      data-testid={`journey-node-${state.slug}`}
      data-variant="hero"
      data-recommended={recommended ? "true" : undefined}
      // --tc-primary is re-pointed at the card hue so brutalist-shadow and
      // brutalist-hover (both keyed to it) cast the world's color, not the
      // site default.
      className="tc-world-card group relative block border-2 bg-surface-raised overflow-hidden brutalist-shadow brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      style={
        {
          "--card-primary": manifest?.palette.primary,
          "--card-primary-light": manifest?.paletteLight.primary,
          "--tc-primary": "var(--card-active-primary)",
          borderColor: "var(--card-active-primary)",
        } as React.CSSProperties
      }
      {...bind}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <SceneCanvas
          draw={SCENE_BY_SLUG[state.slug]}
          rgb={rgb}
          rgbLight={rgbLight}
          hovered={hovered}
          className="absolute inset-0"
        />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-3 px-5 pt-4 font-mono text-[10px] uppercase tracking-[0.16em]">
        <span
          className="font-semibold"
          style={{ color: "var(--card-active-primary)" }}
        >
          {code(state.position)} · {manifest?.specialization}
        </span>
        <span className="text-text-muted">{statusLabel(state, live)}</span>
      </div>

      <div className="relative z-10 px-5 pb-5 pt-12 md:pt-16">
        <h2
          className="font-mono font-black text-2xl md:text-3xl tracking-tight"
          style={{ color: "var(--card-active-primary)" }}
        >
          {manifest?.displayName ?? state.slug}
        </h2>
        <p className="text-sm md:text-base text-text-muted font-sans leading-relaxed mt-1 max-w-[480px]">
          {manifest?.tagline}
        </p>

        <div className="mt-5 flex items-center justify-between gap-4">
          {showMeter ? (
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div
                className="flex-1 h-1 bg-surface"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${manifest?.displayName} progress`}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: "var(--card-active-primary)",
                  }}
                />
              </div>
              <span className="font-mono text-[10px] text-text-muted whitespace-nowrap">
                {state.completedLessons} / {state.totalLessons} lessons
              </span>
            </div>
          ) : (
            <span aria-hidden="true" />
          )}
          <span
            className="font-mono text-xs font-semibold uppercase tracking-[0.14em] whitespace-nowrap"
            style={{ color: "var(--card-active-primary)" }}
          >
            {ctaLabel(state, live)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RowNode({
  state,
  showProgress,
}: {
  state: JourneyWorldState;
  showProgress: boolean;
}) {
  const { manifest, hovered, rgb, rgbLight, bind } = useNodeScene(state.slug);
  const live = isLaunched(state.slug);
  const pct = progressPct(state);
  // No meter on completed rows: the "Complete" label already says it, and a
  // full bar next to it is noise. The hero keeps its meter in every owned
  // state since it is the card being acted on.
  const showMeter =
    showProgress &&
    live &&
    !state.completed &&
    (state.owned || state.completedLessons > 0);

  return (
    <Link
      href={`/worlds/${state.slug}`}
      aria-label={`${manifest?.displayName ?? state.slug}, ${manifest?.tagline ?? ""}${live ? "" : " (coming soon)"}`}
      data-testid={`journey-node-${state.slug}`}
      data-variant="row"
      className="tc-world-card group relative flex items-center justify-between gap-4 border border-border bg-surface-raised overflow-hidden px-4 py-3 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      style={
        {
          "--card-primary": manifest?.palette.primary,
          "--card-primary-light": manifest?.paletteLight.primary,
        } as React.CSSProperties
      }
      {...bind}
    >
      <div
        className="tc-journey-row-scene absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <SceneCanvas
          draw={SCENE_BY_SLUG[state.slug]}
          rgb={rgb}
          rgbLight={rgbLight}
          hovered={hovered}
          intensity={0.5}
          className="absolute inset-0"
        />
      </div>

      <span className="relative z-10 flex items-baseline gap-3 min-w-0">
        <span
          aria-hidden="true"
          className="font-mono text-[11px] opacity-60"
          style={{ color: "var(--card-active-primary)" }}
        >
          {code(state.position)}
        </span>
        <h2
          className="font-mono font-bold text-sm md:text-base whitespace-nowrap"
          style={{ color: "var(--card-active-primary)" }}
        >
          {manifest?.displayName ?? state.slug}
        </h2>
        <span className="hidden md:inline text-xs text-text-muted font-sans truncate">
          {manifest?.tagline}
        </span>
      </span>

      <span className="relative z-10 flex items-center gap-3 whitespace-nowrap">
        {showMeter ? (
          <span className="flex items-center gap-2">
            <span
              className="w-16 h-1 bg-surface inline-block"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${manifest?.displayName} progress`}
            >
              <span
                className="block h-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: "var(--card-active-primary)",
                }}
              />
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              {state.completedLessons}/{state.totalLessons}
            </span>
          </span>
        ) : null}
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {statusLabel(state, live)}
        </span>
      </span>
    </Link>
  );
}

/**
 * The thread between two worlds: a 2px vertical gradient from the earlier
 * world's hue to the next one's. The closing thread (after 05) points back
 * to 01 with the positions spelled out. Scheme resolution lives in the
 * .tc-journey-conn rule in globals.css, since one thread spans two worlds
 * and can't ride the per-card --card-active-primary pair.
 */
function Connector({
  from,
  to,
  closing,
}: {
  from: JourneyWorldState;
  to: JourneyWorldState;
  closing: boolean;
}) {
  const fm = worlds[from.slug];
  const tm = worlds[to.slug];
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-2.5 pl-6 ${closing ? "pt-2" : "py-1"}`}
    >
      <span
        className="tc-journey-conn block w-0.5 h-5"
        style={
          {
            "--conn-from": fm?.palette.primary,
            "--conn-to": tm?.palette.primary,
            "--conn-from-light": fm?.paletteLight.primary,
            "--conn-to-light": tm?.paletteLight.primary,
          } as React.CSSProperties
        }
      />
      {closing ? (
        <span className="font-mono text-[10px] tracking-[0.14em] text-text-muted">
          {code(from.position)} → {code(to.position)}
        </span>
      ) : null}
    </div>
  );
}
