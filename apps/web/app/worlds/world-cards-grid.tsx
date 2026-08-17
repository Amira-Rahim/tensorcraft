"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SceneCanvas, drawOrbit } from "@tensorcraft/ui/effects";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
// Signature scene per world - shared with the per-world backdrop, so a
// world's motion identity follows it across surfaces. Hover/focus
// ignites the scene via SceneCanvas's eased hot.
import { SCENE_BY_SLUG, hexToRgb } from "@/lib/scene-by-slug";
import { NewsletterModal } from "./newsletter-modal";

export interface WorldCardData {
  slug: string;
  displayName: string;
  tagline: string;
  specialization: string;
  primary: string;
  /** Light-scheme primary (world.paletteLight.primary). Falls back to `primary` when absent. */
  primaryLight?: string;
  owned: boolean;
  modulesCount: number;
  lessonsCount: number;
  price: number;
  /**
   * Launch status. `live` worlds link to their module map; `coming-soon`
   * cards render inert (no link, not-allowed cursor) until launch, with
   * one interactive element: the Notify me CTA, which opens the shared
   * newsletter modal. The per-world stub at /worlds/{slug} still exists
   * for direct URLs.
   */
  status: "live" | "coming-soon";
  /**
   * Location plate for the hero variant's ground (lib/location-art.ts
   * `heroPlateSrc`). Muted cards never render it; absent, the card keeps
   * its canvas-only render.
   */
  plateSrc?: string;
}

export interface WorldCardsGridProps {
  cards: WorldCardData[];
}

/**
 * WorldCardsGrid, hero card for the launched world + muted grid for
 * coming-soon worlds. Each card wraps its world's signature <SceneCanvas>
 * scene (shared with the homepage five-worlds strip), tinted by the
 * world's primary and ignited on hover/focus.
 * Renders a newsletter modal trigger + dialog for "Get updates" CTA.
 *
 * Layout:
 *   - launched world renders as a wide hero card on top
 *   - coming-soon worlds render in a 2-column grid below, muted
 */
export function WorldCardsGrid({ cards }: WorldCardsGridProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const liveCards = cards.filter((c) => c.status === "live");
  const comingSoonCards = cards.filter((c) => c.status === "coming-soon");

  return (
    <>
      <div className="space-y-12" data-testid="worlds-grid">
        {liveCards.length > 0 && (
          <div className="grid grid-cols-1 gap-5">
            {liveCards.map((card) => (
              <WorldCard key={card.slug} card={card} variant="hero" />
            ))}
          </div>
        )}

        {comingSoonCards.length > 0 && (
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted mb-4">
              Coming soon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {comingSoonCards.map((card) => (
                <WorldCard
                  key={card.slug}
                  card={card}
                  variant="muted"
                  onNotify={() => setModalOpen(true)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Newsletter CTA */}
      <div className="mt-16 flex flex-col items-center text-center">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted mb-3">
          stay in the loop
        </p>
        <h3 className="text-xl sm:text-2xl font-mono font-bold text-text-primary mb-3 tracking-tight">
          New worlds, launch discounts.
        </h3>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          data-testid="open-newsletter-modal"
          className="inline-flex items-center font-mono px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all bg-transparent text-text-primary border-2 border-border rounded-none brutalist-hover hover:border-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          Get updates
        </button>
      </div>

      <NewsletterModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

interface WorldCardProps {
  card: WorldCardData;
  variant: "hero" | "muted";
  /**
   * Opens the grid's shared newsletter modal. Only the coming-soon CTA
   * uses it; live cards navigate instead.
   */
  onNotify?: () => void;
}

function WorldCard({ card, variant, onNotify }: WorldCardProps) {
  const isHero = variant === "hero";
  const isComingSoon = card.status === "coming-soon";
  // Ignites the card's scene (SceneCanvas eases its own 0..1 hot amount);
  // focus mirrors hover so keyboard users get the same moment.
  const [hovered, setHovered] = useState(false);
  // Memoized so hover-driven re-renders (setHovered above) don't mint a
  // fresh array literal every render: SceneCanvas's render() useCallback
  // depends on [draw, rgb, rgbLight] by reference, so a new array each
  // render would give it a new identity, which the containing useEffect
  // (dep [render]) treats as "everything changed" - full teardown/rebuild
  // of the resize/IntersectionObserver/MutationObserver bundle on every
  // hover in/out. Pre-existing churn (hexToRgb was already inline before
  // this task); fixed here since this file was already being touched.
  const rgb = useMemo(() => hexToRgb(card.primary), [card.primary]);
  const rgbLight = useMemo(
    () => (card.primaryLight ? hexToRgb(card.primaryLight) : undefined),
    [card.primaryLight],
  );

  // `tc-world-card` opts into the scheme-aware --card-active-primary
  // rule in globals.css (shared with dashboard/world-cards.tsx - see
  // that rule's doc comment). No useScheme() here: this is a client
  // component, so the hook WOULD work, but every card re-rendering on
  // scheme toggle just to recompute a style string is unnecessary
  // churn the CSS mechanism avoids entirely (and it keeps this file
  // symmetric with the server-rendered dashboard grid, which has no
  // hook available at all).
  const shellClassName = `tc-world-card group relative flex flex-col h-full border-2 border-border bg-surface-raised rounded-none overflow-hidden brutalist-hover${isHero && card.plateSrc ? " tc-on-art" : ""}`;

  const shellStyle = {
    "--card-primary": card.primary,
    "--card-primary-light": card.primaryLight ?? card.primary,
    "--tc-primary": "var(--card-active-primary)",
    // Over the plate the card is a lit viewport (tc-on-art), so the
    // accent pins to the dark-scheme hue in both schemes: the
    // light-scheme hue was minted for a paper background and goes
    // murky on near-black art.
    ...(isHero && card.plateSrc
      ? { "--card-active-primary": card.primary }
      : {}),
  } as React.CSSProperties;

  const body = (
    <>
      {/* Hero ground: the world's location plate under the canvas, the
            shipped plate-under-canvas composite (the canvas becomes the
            reflection on the glass at 50%). Muted cards never ground. */}
      {isHero && card.plateSrc && (
        <ArtPlate
          src={card.plateSrc}
          bleed
          className="absolute inset-0 pointer-events-none"
        />
      )}
      {/* Scene brightness rides SceneCanvas's eased hot amount, so no CSS
            opacity ramp here - a second ramp would mute the ignition. rgb/
            rgbLight stay as the STATIC per-world hues (not scheme-resolved
            here): SceneCanvas reads document.documentElement's data-scheme
            itself every frame and picks between them independently. */}
      <div
        className={`absolute inset-0 pointer-events-none ${isHero ? "" : "opacity-80"}`}
        aria-hidden="true"
      >
        <SceneCanvas
          draw={SCENE_BY_SLUG[card.slug] ?? drawOrbit}
          rgb={rgb}
          rgbLight={rgbLight}
          hovered={hovered}
          className={`absolute inset-0${isHero && card.plateSrc ? " opacity-50" : ""}`}
        />
      </div>
      {/* Legibility veil over the plate, under the copy: the fixed dark
            tc-art-scrim, NOT a bg-colored gradient - the art underneath is
            the same dark image in both schemes, so the veil must be too
            (five-worlds band precedent). */}
      {isHero && card.plateSrc && (
        <div aria-hidden="true" className="tc-art-scrim" />
      )}

      <div
        className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-surface-raised/80 backdrop-blur-[1px]"
        style={
          // Over the plate the strip is glass on a lit viewport: fixed
          // dark frost in both schemes, matching the tc-on-art tokens.
          isHero && card.plateSrc
            ? { background: "color-mix(in srgb, #181818 80%, transparent)" }
            : undefined
        }
      >
        <span
          className="font-mono text-[11px] uppercase tracking-[0.15em] font-semibold"
          style={{ color: "var(--card-active-primary)" }}
        >
          {card.specialization}
        </span>
        <span
          className="font-mono text-[11px] uppercase tracking-[0.15em]"
          style={{
            // Drive-by fix: `--text-muted` doesn't exist (undefined custom
            // prop resolves to nothing); the correct token is `--tc-muted`
            // (Tailwind's `--color-text-muted` maps to it - see globals.css).
            color: isComingSoon
              ? "var(--card-active-primary)"
              : "var(--tc-muted)",
          }}
          data-testid={`world-status-${card.slug}`}
        >
          {isComingSoon ? "Coming soon" : "Live"}
        </span>
      </div>

      <div
        className={`relative z-10 flex flex-col flex-1 ${isHero ? "px-6 py-7 md:px-10 md:py-10" : "px-4 py-5"}`}
      >
        <h2
          className={`font-mono font-bold mb-2 tracking-tight ${isHero ? "text-3xl md:text-4xl" : "text-xl"}`}
          style={{ color: "var(--card-active-primary)" }}
        >
          {card.displayName}
        </h2>
        <p
          className={`text-text-muted mb-4 leading-relaxed font-sans ${isHero ? "text-base md:text-lg max-w-[640px]" : "text-sm"}`}
        >
          {card.tagline}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/60">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">
            {isComingSoon ? null : (
              <>
                <span className="text-text-primary font-bold">
                  {card.modulesCount}
                </span>{" "}
                mod ·{" "}
                <span className="text-text-primary font-bold">
                  {card.lessonsCount}
                </span>{" "}
                lessons
              </>
            )}
          </span>
          {isComingSoon ? (
            // The one interactive element on an otherwise inert card:
            // opens the grid's shared newsletter modal. Focus mirrors
            // hover so keyboard users get the same scene ignition the
            // card link used to provide.
            <button
              type="button"
              data-testid={`world-cta-${card.slug}`}
              onClick={onNotify}
              onFocus={() => setHovered(true)}
              onBlur={() => setHovered(false)}
              className="font-mono text-xs uppercase tracking-[0.15em] font-semibold cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              style={{ color: "var(--card-active-primary)" }}
            >
              Notify me →
            </button>
          ) : (
            <span
              data-testid={`world-cta-${card.slug}`}
              className="font-mono text-xs uppercase tracking-[0.15em] font-semibold"
              style={{ color: "var(--card-active-primary)" }}
            >
              {card.owned ? "Continue →" : "Start →"}
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div
      data-world={card.slug}
      data-testid={`world-card-${card.slug}`}
      data-status={card.status}
      className="world-card-wrapper"
    >
      {isComingSoon ? (
        // Inert until launch: no link, not-allowed cursor. The mouse
        // handlers stay so hover still ignites the scene and the
        // brutalist-hover pose still completes. The card's one tab stop
        // is the Notify me CTA button inside the body.
        <div
          className={`${shellClassName} cursor-not-allowed opacity-80 hover:opacity-100 transition-opacity`}
          style={shellStyle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {body}
        </div>
      ) : (
        <Link
          href={`/worlds/${card.slug}`}
          aria-label={`${card.displayName}, ${card.tagline}`}
          className={`${shellClassName} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`}
          style={shellStyle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          {body}
        </Link>
      )}
    </div>
  );
}
