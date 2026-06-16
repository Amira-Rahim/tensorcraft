# Character Personas (design bible + avatar integration)

**Date:** 2026-06-15
**Status:** Approved design, pending implementation plan
**Scope:** Stream D of the lesson-overhaul effort. Character *creation* (design bible + in-product avatar slots with placeholders). Character *animation* in the screenplay is a deliberately separate follow-up stream (this spec only captures the expression set that animation will need).

## Problem / goal

The 25 story characters across 5 themes exist only as text personalities; there is no visual identity and no avatar anywhere in the product. We want a cartoon persona for each character. Per the chosen approach, this stream delivers:

1. A written **character design bible** that imagines each character's look from their personality/backstory and ends with a ready-to-use image-gen prompt in one cohesive style.
2. In-product **avatar slots** (a `CharacterAvatar` component) that render real art when present and a branded placeholder until then, wired into the dialogue and the Briefing cast card.

Real cel-shaded raster art is produced later by the user (AI image-gen or commissioned illustrator) using the prompts; nothing in this stream depends on that art existing.

## Decisions (locked in brainstorming)

- **Production path:** art-direction bible only; the product ships placeholders, real art added later externally.
- **Style token (shared by every prompt):** "cel-shaded cartoon illustration, clean bold linework, flat shading with one soft key light, slightly stylized proportions, head-and-shoulders framing, near-black background, theme-accent rim light, cohesive ensemble cast, not photorealistic."
- **Sheet scope now:** Deep Orbit's 5 characters fully written + wired (Commander Mirza, Dr. Farah, Chief Nazari, Ensign Demir, ARIA). The other 20 are stubbed in the bible for when their themes approach launch.
- **Placement now:** avatar in the Briefing cast card AND next to each `Dialogue` speaker. Placeholders until art exists.
- **AI characters** (ARIA, and later NEON/MEDI/MUSE/GRID) get an abstract glyph, not a face, in both the prompt direction and the placeholder.

## Non-goals

- No animation (entrance/talking/expression transitions) - separate stream. Sheets capture a 4-state expression set only as forward-looking data.
- No real raster art produced here. No external image-gen run.
- Other 4 themes are not wired into the product (not in the Velite build); only their bible stubs exist.
- No change to lesson content, step gating, or the bridge/glossary/recap work.

## Character bible

New doc `docs/character-bible.md`:

- **Header:** the style token (above), the asset convention, and the per-character template.
- **Per-character sheet** (the approved template): role / archetype; personality + voice; imagined appearance; attire; signature / prop; palette (theme accent + any personal accent); expression set (`neutral`, plus 3 character-appropriate states, e.g. explaining / concern / approval - for the later animation stream); do / don't notes; and a ready **image-gen prompt** ending in the shared style token.
- **Deep Orbit section:** full sheets for Mirza, Farah, Nazari, Demir, ARIA. Appearance is imagined from each manifest personality + the richer backstory in `docs/scripts/deep-orbit.md`. ARIA's sheet specifies an abstract representation (e.g. a geometric voice/waveform glyph), not a human face.
- **Other themes:** one stub line per remaining character (name/role) under each theme heading, marked "sheet pending (gated on theme launch)".
- No em dashes (style bible rule 6).

## Data model

Extend `ThemeCharacter` (`packages/themes/src/types.ts`):

```ts
export interface ThemeCharacter {
  name: string;
  role: string;
  personality: string;
  /** kebab-case id used for the avatar asset path; added per character. */
  slug?: string;
  /** Alternate speaker strings used in dialogue, if any (deep-orbit needs none). */
  aliases?: string[];
  /** AI characters render an abstract glyph instead of a portrait/monogram. */
  isAI?: boolean;
}
```

Populate `slug` (+ `isAI: true` for ARIA) on Deep Orbit's 5 characters in `packages/themes/src/deep-orbit.ts`. Slugs: `commander-mirza`, `dr-farah`, `chief-nazari`, `ensign-demir`, `aria`. Other themes' characters get slugs when their sheets are written. Dialogue speaker strings in deep-orbit exactly match the manifest `name` values (verified), so name->character lookup is exact; `aliases` is for future themes.

## Asset convention

- Path: `apps/web/public/characters/<theme-slug>/<character-slug>.webp` (neutral portrait). Expression variants later: `<slug>-<expression>.webp`.
- Until art exists, files are simply absent; the component falls back to a placeholder via `onError`. No per-character flag to toggle when art lands - dropping the file in is sufficient.

## Components

### `CharacterAvatar` (new, `packages/ui/src/character-avatar.tsx`)

Theme-agnostic, presentational.

```ts
interface CharacterAvatarProps {
  name: string;            // for initials + alt text
  src?: string;            // conventional asset path; may 404
  accentColor?: string;    // theme accent for border/placeholder (defaults to currentColor/token)
  isAI?: boolean;          // abstract glyph placeholder instead of monogram
  size?: number;           // px, default ~40
}
```

- Renders an `<img>` at `src` with `alt={name}`; on error (or when `src` is omitted) swaps to a placeholder: a brutalist square (2px accent border, surface bg, no radius) containing either the 2-letter monogram from `name` (human) or an abstract glyph (AI).
- SSR-safe (use a client error-state swap, or render placeholder + `<img onError>` overlay). Keep it small and dependency-free.

### Wiring

- **`Dialogue`** (`packages/ui/src/mdx/dialogue.tsx`): add an optional `avatarSrc?: string`, `avatarName?: string`, `isAI?: boolean`. When provided, render a `CharacterAvatar` above the centered speaker name. Keep the component theme-agnostic (it does NOT look up characters). Default behavior (no avatar props) is unchanged.
  - The app injects the avatar: in `lesson-content.tsx`, replace the plain `wrapVisibility("Dialogue", Dialogue)` with a wrapper (mirroring the Quiz/RecallPrompt wrappers, which close over the in-scope `themeId`). Note: lesson-content has `themeId`, NOT `themeSlug` - but `themeId` is passed the slug value ("deep-orbit"), so use it directly. The wrapper must add `import { themes } from "@tensorcraft/themes"`, look up `themes[themeId]?.characters`, match the character by `speaker` name (or `aliases`), build `src = /characters/${themeId}/${slug}.webp`, and pass `avatarSrc`/`avatarName`/`isAI` to `Dialogue`. The lookup derives from the stable `themeId` so it folds into the existing components `useMemo` without churn. Unknown speakers render with no avatar (graceful).
- **Briefing cast card** (`SceneCard` in `lesson-steps.tsx`): `SceneCard` currently receives a `theme` prop whose TYPE omits `characters` (it is the narrowed `LessonStepsProps["theme"]`), so it cannot reach `slug`/`isAI` today. Fix: pass `themeSlug` into `SceneCard` (already a prop on `LessonStepsInner`) and look up `themes[themeSlug]?.characters` (same pattern as the Dialogue wrapper), rather than relying on the narrowed `theme` prop. Then for each speaker, match the character for `slug`/`isAI` and render `CharacterAvatar` beside the name/role. Falls back to the current text chip if a speaker has no matching character.

## Testing

- **vitest:** `CharacterAvatar` - renders `<img>` with src + alt; on `onError` shows the monogram placeholder; `isAI` shows the glyph; correct initials from multi-word names ("Commander Mirza" -> "CM", "ARIA" -> AI glyph). `Dialogue` - renders the avatar when `avatarSrc` is provided, and is unchanged when not. A manifest test asserting each Deep Orbit character has a `slug` and ARIA has `isAI: true`. Import new `packages/ui` tests using the repo's existing resolution scheme (the playback test imports `@tensorcraft/ui/mdx/dialogue`); do not assume a new subpath export for `CharacterAvatar` - export it from the `packages/ui` root/barrel the way other shared components are.
- **Update** the existing `lesson-content`/`lesson-steps` tests if the Dialogue wrapper or SceneCard structure changes; keep the playback test green (the Briefing beat structure and `data-dialogue`/`data-script-beat` attributes must be preserved - the avatar is additive markup inside the dialogue block).
- **e2e (optional):** on a deep-orbit Briefing step, a dialogue speaker shows a placeholder avatar tile; the cast card lists avatars.
- All suites green before done.

## Documentation

- `docs/character-bible.md` is the deliverable doc.
- `docs/dev-plan.md`: record (a) real cel-shaded art is pending external production (prompts are in the bible), (b) the other 20 character sheets + theme wiring are gated on those themes launching, (c) character *animation* is a planned follow-up stream that will consume the expression sets.

## Risks / open questions

- **Playback safety:** the Briefing screenplay timeline keys off `data-script-beat`/`data-dialogue` elements. Adding an avatar inside the `Dialogue` block must not change those hooks or the beat reveal. Verify against `lesson-steps.playback.test.tsx`.
- **Layout:** dialogue is centered, max-w-[440px]; the avatar should sit centered above the speaker name so it does not disrupt the screenplay rhythm. Mobile unaffected (small tile).
- **Asset weight (future):** when real art lands, use `webp` + width-capped exports; not a concern for placeholders.
- **ARIA / AI representation:** abstract glyph must still feel like a distinct "character" presence; the sheet should specify a recognizable motif (e.g. a steady waveform ring) reused wherever ARIA speaks.
- The retained external-art dependency is intentional; the product is fully functional with placeholders.
