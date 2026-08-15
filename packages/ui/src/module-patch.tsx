"use client";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useImgSettled } from "./use-img-settled";

/* ── ModulePatch: an earned module emblem ─────────────────────────────
   Mission-patch art for a completed module (docs/patch-bible.md). Unlike
   ArtPlate there is no monitor frame: a patch is an emblem, not a screen.

   Art is optional by contract: on failure this renders the `fallback`
   node (usually the status glyph the surface showed before patches
   existed), or nothing when no fallback is given, so a surface with no
   art is identical to its pre-patch layout. */

export interface ModulePatchProps {
  src: string;
  /** Rendered box in px. Patches must read at 28 (dashboard sidebar). */
  size?: number;
  /** Meaningful description. Absent means decorative: patches sit beside
   *  the module's own number and name. */
  alt?: string;
  /** Rendered instead of nothing when the image fails. */
  fallback?: ReactNode;
  className?: string;
}

export function ModulePatch({
  src,
  size = 28,
  alt,
  fallback,
  className,
}: ModulePatchProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  // An SSR'd patch can 404 before hydration attaches onError; recover the
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
      data-testid="module-patch"
      src={src}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : "true"}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(src)}
      className={["shrink-0 select-none", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{ objectFit: "cover" }}
    />
  );
}
