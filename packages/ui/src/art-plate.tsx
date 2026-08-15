"use client";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useImgSettled } from "./use-img-settled";

/* ── ArtPlate: a raster art plate on a marketing surface ──────────────
   The Deep Orbit art is dark in both colour schemes: a .webp cannot
   re-render per scheme the way the procedural canvases do. So a plate is
   never presented as a page background (which would read as a hole in a
   light page) but as a ship monitor: hard border, brass inner rule, house
   offset shadow in light. See `.tc-art-plate` in the host app's CSS.

   Art is optional by contract, exactly like ScenePortrait: on error this
   renders NOTHING, so a surface with no art is byte-identical to the
   layout it had before the art existed. Components may ship before
   assets. */

export interface ArtPlateProps {
  src: string;
  /** Meaningful description. Absent means decorative: plates usually sit
   *  behind a heading that already names the place. */
  alt?: string;
  /** Full-bleed section ground: drops the frame, since the section's own
   *  borders are already doing that job. */
  bleed?: boolean;
  /** Rendered instead of nothing when the image fails. For surfaces where
   *  the plate REPLACES an element (the onboarding glyph), the replaced
   *  element comes back rather than leaving a hole (ModulePatch contract). */
  fallback?: ReactNode;
  className?: string;
}

export function ArtPlate({
  src,
  alt,
  bleed = false,
  fallback,
  className,
}: ArtPlateProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  // An SSR'd plate can 404 before hydration attaches onError; recover the
  // lost verdict from the DOM (see use-img-settled.ts).
  const settle = useCallback(
    (ok: boolean) => {
      if (!ok) setFailed(src);
    },
    [src],
  );
  useImgSettled(imgRef, src, settle);
  if (failed === src) return <>{fallback ?? null}</>;

  return (
    <img
      ref={imgRef}
      data-testid="art-plate"
      src={src}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : "true"}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(src)}
      className={[
        // select-none rather than a user-select rule in .tc-art-plate:
        // Tailwind emits the -webkit- prefix Safari still needs, same as
        // ScenePortrait does.
        "tc-art-plate select-none",
        bleed ? "tc-art-plate-bleed" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
