"use client";

import { useState } from "react";
import { FocusTrap } from "@tensorcraft/ui/a11y";

/**
 * The shared trailer dialog: a FocusTrap lightbox whose mp4 mounts only
 * while open. Extracted from learn/trailer-hero.tsx (2026-08-29) so world
 * pages reuse the exact surface /learn shipped. A supplied caption track
 * makes the introduction's on-screen titles available in the native player.
 *
 * `endCard` renders over the video once playback finishes: the moment of
 * peak intent, used by the world page to make the film's closing offer
 * clickable. Replaying from the controls clears it. /learn passes none and
 * keeps its original behavior.
 */
export function TrailerLightbox({
  src,
  poster,
  captionsSrc,
  ariaLabel,
  onClose,
  endCard,
}: {
  src: string;
  poster?: string;
  captionsSrc?: string;
  ariaLabel: string;
  onClose: () => void;
  endCard?: React.ReactNode;
}) {
  const [ended, setEnded] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12"
      style={{ background: "color-mix(in srgb, #0a0a0a 92%, transparent)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <FocusTrap active onEscape={onClose}>
        <div className="max-w-[1280px] w-full">
          <div className="relative">
            <video
              controls
              autoPlay
              playsInline
              preload="none"
              poster={poster}
              src={src}
              onEnded={() => setEnded(true)}
              onPlay={() => setEnded(false)}
              className="block w-full h-auto border border-border bg-[#0a0a0a]"
            >
              {captionsSrc && (
                <track
                  kind="captions"
                  src={captionsSrc}
                  srcLang="en"
                  label="English"
                />
              )}
            </video>
            {ended && endCard && (
              <div
                data-testid="trailer-endcard"
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: "color-mix(in srgb, #0a0a0a 55%, transparent)",
                }}
              >
                {endCard}
              </div>
            )}
          </div>
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-xs uppercase tracking-wider text-primary hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              Close ✕
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
