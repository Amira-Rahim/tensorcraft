"use client";

/**
 * The Briefing's scene clip (owner ruling 2026-09-04: launch ships with
 * video). Renders a silent 10-second clip in the exact slot the scene
 * still occupies, with that still as the poster, so the loading state,
 * the reduced-motion state, and every fallback look like the shipped
 * design rather than a broken player.
 *
 * Contract (recorded in the lesson-format audit's ruling section):
 * - Text-reveal fallback everywhere: no clip in the manifest, a load
 *   error, or the holdback variant all render the pre-video Briefing.
 *   This component is only mounted when a clip exists and the browser's
 *   variant is "clip"; internally it still falls back to the still on a
 *   media error.
 * - Never delays time-to-first-content: the beat timeline runs
 *   independently; the poster paints immediately (it is the already
 *   shipped still); nothing awaits the video.
 * - Honors the remembered skip preference and reduced motion: callers
 *   pass autoPlayEligible=false for those visitors, who get the poster
 *   with a manual play control instead of motion they opted out of.
 * - The dialogue text below the clip is the accessible narrative; the
 *   clip carries the scene's alt text as its label.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ScenePortrait } from "@tensorcraft/ui";
import { EVENTS, track } from "@/lib/analytics-events";

interface SceneClipProps {
  clipUrl: string;
  /** The lesson's scene still; poster and error fallback. */
  posterSrc: string;
  alt?: string;
  /** Scene autoplay minus skip preference minus reduced motion. */
  autoPlayEligible: boolean;
  worldId: string;
  lessonId: string;
}

export function SceneClip({
  clipUrl,
  posterSrc,
  alt,
  autoPlayEligible,
  worldId,
  lessonId,
}: SceneClipProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(true);

  const play = useCallback(
    (trigger: "auto" | "manual") => {
      const video = videoRef.current;
      if (!video) return;
      // Promise.resolve: older engines (and jsdom) return void from
      // play(); wrapping keeps the telemetry path uniform.
      Promise.resolve(video.play())
        .then(() => {
          track(EVENTS.SCENE_CLIP_PLAYED, { worldId, lessonId, trigger });
        })
        .catch(() => {
          // Autoplay refused or the source is unplayable: the poster is
          // already the shipped still, so the Briefing stays whole.
        });
    },
    [worldId, lessonId],
  );

  useEffect(() => {
    if (autoPlayEligible) play("auto");
    // Mount-once by design: eligibility is a mount-time fact of this visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    // Media error: identical to the pre-video Briefing (still as a beat).
    return <ScenePortrait beat src={posterSrc} alt={alt} />;
  }

  return (
    <figure
      data-testid="scene-clip"
      data-script-beat=""
      className="mb-7 relative"
    >
      {/* No caption track by design: the clip is silent (trailer audio
          doctrine) and the screenplay text below IS the narrative,
          revealed by the beat timeline. */}
      <video
        ref={videoRef}
        src={clipUrl}
        poster={posterSrc}
        muted
        playsInline
        preload={autoPlayEligible ? "auto" : "metadata"}
        aria-label={alt}
        className="w-full h-auto block"
        style={{ border: "1px solid var(--tc-border)" }}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onError={() => setFailed(true)}
        onEnded={() => {
          setPaused(true);
          const video = videoRef.current;
          track(EVENTS.SCENE_CLIP_COMPLETED, {
            worldId,
            lessonId,
            watchedMs: video ? Math.round(video.currentTime * 1000) : 0,
          });
        }}
      />
      {paused && (
        <button
          type="button"
          onClick={() => play("manual")}
          aria-label="Play scene clip"
          className="absolute inset-0 flex items-center justify-center bg-transparent"
        >
          <span
            aria-hidden="true"
            className="flex items-center justify-center w-12 h-12 text-xl"
            style={{
              background: "color-mix(in srgb, var(--tc-bg) 70%, transparent)",
              color: "var(--tc-text)",
              border: "1px solid var(--tc-border-interactive)",
            }}
          >
            &#9654;
          </span>
        </button>
      )}
    </figure>
  );
}
