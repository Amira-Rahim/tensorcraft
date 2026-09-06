/**
 * Briefing variant assignment (owner ruling 2026-09-04: launch ships
 * with video; the pre-clip baseline is forfeited, so clip causality is
 * readable only through this holdback).
 *
 * A browser is assigned once, sticky forever: "clip" renders the scene
 * clip in the Briefing's art slot, "text" keeps the pre-video Briefing
 * (still art + text reveal) as the concurrent control. The share of
 * browsers assigned "text" comes from NEXT_PUBLIC_CLIP_HOLDBACK (a
 * 0..1 fraction, build-time inlined). 0 or unset disables the holdback:
 * everyone gets clips and the experiment is off.
 *
 * Deliberately localStorage, not a server flag: it must work for the
 * free-tier guests the launch aims at, and it is a UX variant, not
 * tracking (assignment happens regardless of analytics consent; only
 * the EVENTS carrying the variant tag are consent-gated).
 */

const KEY = "tc-briefing-variant";

export type BriefingVariant = "clip" | "text";

function holdbackShare(): number {
  const raw = Number(process.env.NEXT_PUBLIC_CLIP_HOLDBACK ?? "0");
  if (!Number.isFinite(raw)) return 0;
  return Math.min(Math.max(raw, 0), 1);
}

/** Sticky per-browser assignment. SSR and blocked-storage fall to "clip". */
export function getAssignedBriefingVariant(): BriefingVariant {
  if (typeof window === "undefined") return "clip";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing === "clip" || existing === "text") return existing;
    const assigned: BriefingVariant =
      Math.random() < holdbackShare() ? "text" : "clip";
    window.localStorage.setItem(KEY, assigned);
    return assigned;
  } catch {
    // Storage blocked: serve the product experience, skip the experiment.
    return "clip";
  }
}
