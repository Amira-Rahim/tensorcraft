import { worlds } from "@tensorcraft/worlds";
import type { WorldCharacter } from "@tensorcraft/worlds";

/* Character art resolution for the lesson UI. Lives app-side because
   packages/ui is deliberately manifest-blind: components take srcs and
   render slots, the manifest lookup and asset-path convention
   (docs/character-bible.md) stay here, in one place. */

export interface PortraitSources {
  /** Neutral portrait, absent when the character has no avatar slug. */
  src?: string;
  /** Expression variant, present only for a canonical non-neutral id. */
  expressionSrc?: string;
}

/** Speaker string (Dialogue prop or frontmatter) to manifest character. */
export function resolveCharacter(
  worldSlug: string,
  speaker: string | undefined,
): WorldCharacter | undefined {
  if (!speaker) return undefined;
  const chars = worlds[worldSlug]?.characters ?? [];
  return chars.find((c) => c.name === speaker || c.aliases?.includes(speaker));
}

/**
 * Asset URLs for a character portrait per the bible convention:
 * `/characters/<world>/<slug>.webp`, variants `<slug>-<expression>.webp`.
 * Unknown or "neutral" expressions resolve to the base portrait only, so a
 * bad annotation can never mint a guaranteed-404 URL (the content gate in
 * packages/content also rejects it at build time).
 */
export function portraitSources(
  worldSlug: string,
  character: WorldCharacter | undefined,
  expression?: string,
): PortraitSources {
  if (!character?.slug) return {};
  const src = `/characters/${worldSlug}/${character.slug}.webp`;
  const valid =
    expression !== undefined &&
    expression !== "neutral" &&
    (character.expressions?.includes(expression) ?? false);
  return valid
    ? {
        src,
        expressionSrc: `/characters/${worldSlug}/${character.slug}-${expression}.webp`,
      }
    : { src };
}

/** Shared "#rrggbb" to [r,g,b] (previously inlined per component). */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
