"use client";

import { useState } from "react";
import Link from "next/link";
import { TrailerLightbox } from "@/app/components/trailer-lightbox";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";
import { EVENTS, track } from "@/lib/analytics-events";

/**
 * Click-to-play trailer band for a world page. Poster-only at rest: the
 * page's WorldSceneBackdrop already animates, so no ambient loop competes
 * with it (a deliberate departure from /learn's hero). The mp4 loads only
 * when the lightbox opens.
 *
 * The server decides who sees this (prospects only; purchasers keep
 * today's page byte-for-byte), so nothing swaps client-side and the
 * aspect-ratio box keeps CLS at zero.
 */
export function WorldTrailerPanel({
  worldId,
  worldName,
  poster,
  src,
  durationLabel,
  freeLessonHref,
}: {
  worldId: string;
  worldName: string;
  poster: string;
  src: string;
  durationLabel: string;
  freeLessonHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-testid="world-trailer-panel"
        aria-label={`Play the ${worldName} trailer`}
        onClick={() => {
          track(EVENTS.WORLD_TRAILER_PLAYED, { worldId, mode: "full" });
          setOpen(true);
        }}
        className="relative block w-full aspect-video border-2 border-border bg-surface overflow-hidden cursor-pointer brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      >
        {/* Raw <img>: full-bleed poster sized by the aspect-ratio box, the
            same rationale as the /learn hero poster. */}
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
        {/* Bottom scrim so the chip reads on any poster frame. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20"
          style={{
            background:
              "linear-gradient(180deg, transparent, color-mix(in srgb, #0a0a0a 75%, transparent))",
          }}
        />
        <span className="absolute bottom-4 left-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white">
          ▶ Play trailer · {durationLabel}
        </span>
      </button>

      {open && (
        <TrailerLightbox
          src={src}
          poster={poster}
          ariaLabel={`${worldName} trailer`}
          onClose={() => setOpen(false)}
          endCard={
            <FreeLessonCtaTracker source="world_trailer_endcard">
              <Link
                href={freeLessonHref}
                data-testid="world-trailer-endcard-cta"
                className="rounded-none inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              >
                Start Module 1 free →
              </Link>
            </FreeLessonCtaTracker>
          }
        />
      )}
    </>
  );
}
