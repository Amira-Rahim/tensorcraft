"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/* ── useImgSettled: recover load/error events lost to SSR hydration ───
   React attaches onLoad/onError at hydration, but a server-rendered
   <img> starts fetching while the HTML streams in, so a fast success or
   failure (404, aborted request, art not produced yet) fires BEFORE the
   handlers exist and is silently lost. Every speculative portrait in
   this package relies on those events to collapse to its fallback, which
   left real browsers showing a broken-image frame that jsdom tests could
   never reproduce (caught by e2e/script-playback.spec.ts).

   After mount, an already-settled image reports through the DOM instead:
   `complete` is true and `naturalWidth` is 0 on failure, positive on
   success. Images still in flight are ignored; their events fire after
   hydration and reach the normal handlers. */
export function useImgSettled(
  ref: RefObject<HTMLImageElement | null>,
  src: string | undefined,
  onSettled: (ok: boolean) => void,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !src || !el.complete) return;
    onSettled(el.naturalWidth > 0);
  }, [ref, src, onSettled]);
}
