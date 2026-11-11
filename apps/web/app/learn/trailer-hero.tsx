"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TrailerLightbox } from "@/app/components/trailer-lightbox";
import { EVENTS, track } from "@/lib/analytics-events";
import { INTRO_VIDEO } from "@/lib/intro-video";

/**
 * The video hero (owner ruling 2026-08-27: nothing over the film but an
 * overlay and one button). One island owning the whole surface:
 *
 * - The video displays its poster at first paint without preloading media.
 *   Its silent loop starts after interaction or a delay. Reduced-motion
 *   and Save-Data visitors keep the poster.
 * - The entire video surface is a button: clicking it opens the full cut
 *   with sound in a FocusTrap lightbox.
 * - The page's single CTA overlays via its own layer above this island.
 */
function prefersStillness(): boolean {
  // The matchMedia guard also covers jsdom, which never implements it:
  // under vitest 4 an effect throwing here fails every test that renders
  // the page (surfaced 2026-08-29; the poster-only path is the right
  // behavior for a motionless environment anyway).
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return true;
  }
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
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
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
    // Allow the poster to load before starting ambient playback.
    const idleId = window.setTimeout(arm, 6000);
    return cleanup;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !armed) return;
    if (open) {
      video.pause();
      return;
    }
    // Autoplay can still fail under browser policy. The poster and the
    // explicit lightbox play control remain usable when that happens.
    void video.play()?.catch(() => {});
  }, [armed, open]);

  return (
    <>
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          aria-label="Tensorcraft introduction preview"
          muted
          loop
          playsInline
          preload="none"
          poster={INTRO_VIDEO.poster}
          src={INTRO_VIDEO.src}
          onPlaying={() => {
            if (!trackedRef.current) {
              trackedRef.current = true;
              track(EVENTS.TRAILER_PLAYED, { mode: "loop" });
            }
          }}
          className="absolute inset-0 w-full h-full object-cover select-none"
        >
          <track
            kind="captions"
            src={INTRO_VIDEO.captions}
            srcLang="en"
            label="English"
          />
        </video>
        {/* Bottom scrim so the overlay CTA reads on any frame. */}
        <div
          aria-hidden="true"
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
        <TrailerLightbox
          src={INTRO_VIDEO.src}
          poster={INTRO_VIDEO.poster}
          captionsSrc={INTRO_VIDEO.captions}
          ariaLabel="Tensorcraft introduction"
          onClose={close}
        />
      )}
    </>
  );
}
