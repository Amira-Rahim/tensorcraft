"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FocusTrap } from "@tensorcraft/ui/a11y";
import { EVENTS, track } from "@/lib/analytics-events";

/**
 * The video hero (owner ruling 2026-08-27: nothing over the film but an
 * overlay and one button). One island owning the whole surface:
 *
 * - Poster at first paint (LCP-stable, CLS 0), the silent loop crossfades
 *   in only after first interaction or an idle delay, so the loop never
 *   enters the Lighthouse-audited load. Reduced-motion and Save-Data
 *   visitors keep the poster.
 * - The entire video surface is a button: clicking it opens the full cut
 *   with sound in a FocusTrap lightbox (the mp4 loads only then).
 * - The page's single CTA overlays via its own layer above this island.
 */
const POSTER = "/media/learn-trailer-poster.webp";
const LOOP = "/media/learn-trailer-loop.webm";
const FULL = "/media/learn-trailer.mp4";

function prefersStillness(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }
  // Save-Data is a request not to spend megabytes on ambiance.
  const conn = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return conn?.saveData === true;
}

export function TrailerHero() {
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const trackedRef = useRef(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (prefersStillness()) return;
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      cleanup();
      setArmed(true);
    };
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
      "scroll",
    ];
    const cleanup = () => {
      for (const e of events) window.removeEventListener(e, arm);
      if (idleId !== null) window.clearTimeout(idleId);
    };
    for (const e of events) {
      window.addEventListener(e, arm, { passive: true, once: false });
    }
    // Idle fallback: a motionless visitor still gets the film, well after
    // any load trace has ended.
    const idleId = window.setTimeout(arm, 6000);
    return cleanup;
  }, []);

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- full-bleed
            poster; sized by the container, not the layout */}
        <img
          src={POSTER}
          alt=""
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
        {armed && (
          <video
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            src={LOOP}
            onPlaying={() => {
              setPlaying(true);
              if (!trackedRef.current) {
                trackedRef.current = true;
                track(EVENTS.TRAILER_PLAYED, { mode: "loop" });
              }
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              playing ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        {/* Bottom scrim so the overlay CTA reads on any frame. */}
        <div
          className="absolute inset-x-0 bottom-0 h-48"
          style={{
            background:
              "linear-gradient(180deg, transparent, color-mix(in srgb, #0a0a0a 70%, transparent))",
          }}
        />
      </div>

      {/* The whole film is the play control. */}
      <button
        type="button"
        aria-label="Play the trailer with sound"
        data-testid="learn-watch-trailer"
        onClick={() => {
          track(EVENTS.TRAILER_PLAYED, { mode: "full" });
          setOpen(true);
        }}
        className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-4"
      />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12"
          style={{ background: "color-mix(in srgb, #0a0a0a 92%, transparent)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Tensorcraft trailer"
        >
          <FocusTrap active onEscape={close}>
            <div className="max-w-[1280px] w-full">
              {/* The film has no speech: title cards carry the copy, so
                  the cards are the captions. */}
              <video
                controls
                autoPlay
                playsInline
                preload="none"
                poster={POSTER}
                src={FULL}
                className="block w-full h-auto border border-border bg-[#0a0a0a]"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={close}
                  className="font-mono text-xs uppercase tracking-wider text-primary hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  Close ✕
                </button>
              </div>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
}
