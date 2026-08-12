"use client";
import { useCallback, useRef, useState } from "react";
import { useImgSettled } from "./use-img-settled";

/* ── ScenePortrait: the establishing shot under a scene slugline ──────
   A framed illustration of the lesson's scene, produced externally per
   docs/scene-bible.md and dropped at
   public/scenes/<world>/<module>/<lesson>.webp. Art is optional by
   contract: on error the component renders NOTHING, so the figure and its
   data-script-beat leave the DOM and the playback timeline (collectBeats
   in lesson-steps) never holds on an absent image. A lesson with no art is
   byte-identical to today's slugline-only layout.

   The art stays dark in both schemes (raster cannot re-render like the
   canvas scenes); the frame presents it as a diegetic ship-monitor panel,
   with the host app adding the house offset shadow in light scheme. */

export interface ScenePortraitProps {
  src: string;
  /** Meaningful description of the depicted moment. Absent means the art
   *  is decorative for now (alt=""): the adjacent slugline already
   *  announces location and time. */
  alt?: string;
  /** Reserved box ratio so a late image never shifts layout. */
  aspectRatio?: string;
  /** Participate in script playback as a beat (Briefing establishing
   *  shot). Epilogue portraits omit this: no playback on that step. */
  beat?: boolean;
  className?: string;
}

export function ScenePortrait({
  src,
  alt,
  aspectRatio = "3 / 2",
  beat = false,
  className,
}: ScenePortraitProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  // An SSR'd portrait can 404 before hydration attaches onError; recover
  // the lost verdict from the DOM (see use-img-settled.ts).
  const settle = useCallback(
    (ok: boolean) => {
      if (!ok) setFailed(src);
    },
    [src],
  );
  useImgSettled(imgRef, src, settle);
  if (failed === src) return null;

  return (
    <figure
      data-testid="scene-portrait"
      data-script-beat={beat ? "" : undefined}
      className={className ?? "mb-7"}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(src)}
        className="tc-scene-portrait block w-full select-none"
        style={{
          aspectRatio,
          objectFit: "cover",
          border: "2px solid var(--tc-border)",
          background: "var(--tc-surface)",
          borderRadius: 0,
        }}
      />
    </figure>
  );
}
