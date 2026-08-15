# Art expansion spine: unused assets, expressions, patches, certificate

Status: approved design (owner approved the ranked spine 2026-08-15)
Date: 2026-08-15

## Problem

The 2026-08-09 art run put generated art on four surfaces: the landing Five
Worlds band, the Deep Orbit world page, and steps 1 and 6 of the lesson
reader. Everything else the user touches is text and procedural canvas. Three
gaps stand out:

1. **Paid-for art does nothing.** Three of the four location plates (`lab`,
   `engineering`, `dashboard-station`) are ingested and referenced by no
   component. Fifteen of the twenty portraits are expression variants that
   never render, because no lesson carries an `expression` annotation.
2. **The sharing loop is art-free.** The certificate page is a bordered text
   box that fetches the learner's avatar and never renders it. Every social
   share goes out as a text-only card from `/api/og`.
3. **Completion has no artifact.** There is no module-complete emblem, and
   world completion is a text banner.

## Constraints

Carried over from the 2026-08-09 marketing-surfaces spec, still binding:

1. **Art stays optional.** Every surface renders byte-identical to its
   art-less layout when an asset is missing or fails (`ScenePortrait` /
   `ArtPlate` precedent). Components may ship before assets.
2. **Resolution goes through app-side helpers** (`character-art.ts`,
   `location-art.ts` pattern). `packages/ui` stays manifest-blind; no
   component builds an asset path from a string.
3. **Dark-only raster.** Plates present as ship monitors (the `ArtPlate`
   frame) or as grounds under a canvas, never as a light-page background.
4. **Budgets enforced at ingest**, exit 1 when over.
5. **No text in generated art.** Generated lettering artifacts; labels come
   from the UI.
6. **No future product plans on user surfaces.** Everything here references
   launched content only.
7. User-visible copy follows `docs/writing-quality-rubric.md`; new alt text
   follows the scene-bible alt rules.

## Wave 1a: the three orphaned plates

`apps/web/lib/location-art.ts` gains a second map beside `HERO_PLATE`:

```ts
const SURFACE_PLATE: Record<string, Record<string, string>> = {
  "deep-orbit": {
    dashboard: "dashboard-station",
    auth: "lab",
    "purchase-success": "engineering",
  },
};
export function surfacePlateSrc(worldSlug: string, surface: string): string | undefined;
```

Unknown world or surface resolves to `undefined`; consumers fall back to
today's render. Same typo defence as `HERO_PLATE`.

- **/auth**: the left pane takes the `lab` plate as its ground with the
  existing `OrbitCanvas` above it at 50% opacity - the exact Five Worlds
  band composite. Copy block stays at `z-10`. Desktop-only pane, off the
  form's critical path.
- **/dashboard**: a framed `ArtPlate` panel at the top of the module-map
  sidebar, above the `MODULE MAP` header row: the station's own monitor
  feed. The plate is `dashboard-station`, the alcove the page is named for.
  Decorative (`alt=""`), desktop-only (the sidebar is `hidden lg:flex`),
  and never behind text. The server page resolves the src and passes a new
  optional `plateSrc` prop to `DashboardView`.
- **/dashboard/purchase-success**: a framed `ArtPlate` (`engineering`,
  non-bleed, decorative) between the confirmation hero and the next-steps
  cards. Renders only in the confirmed-purchase state, not in the
  "Almost There" pending or failed states.

## Wave 1b: expression annotation pass

The `Dialogue` corpus has 176 tags, zero annotated. The pass adds
`expression="<id>"` attributes only - no prose changes, no reflow.

Editorial rules:

- Annotate a line only when its written emotion clearly matches one of the
  speaker's three canonical non-neutral expressions (manifest sets in
  `packages/worlds/src/deep-orbit.ts`). The stage `direction` attribute,
  when present, is the primary signal; the expression must agree with it.
- Neutral stays unannotated. Sparse beats saturated: a crossfade is a
  beat, and a lesson with zero annotations is a valid outcome. Guideline
  ceiling: about one annotated line in three.
- The existing gate (`packages/content/src/expressions.test.ts`) validates
  every annotation against the manifest. It gains one assertion: the
  corpus contains at least one annotation, so a future sweep that strips
  attributes fails loudly.

## Wave 1c: certificate avatar

The share page already fetches `user_avatar_url` and drops it. Render it
beside the "Awarded to" row via the existing `CharacterAvatar` (size 44):
external URL as `src`, learner display name as `name`, so a dead URL
degrades to the initials monogram instead of a broken image. `alt=""` - the
name is the adjacent text.

## Wave 1d: plates on the OG cards

Satori's raster support is the constraint: it decodes PNG and JPEG
reliably; WebP is not a format we can bet an edge route on. So:

- `scripts/art/ingest.mjs` gains an `og` mode that reads the **shipped**
  plates in `apps/web/public/locations/<world>/` (shipped means approved)
  and emits `apps/web/public/og/<world>/<location>.jpg` at 1200×630,
  quality 70, 150 KB hard cap.
- `/api/og` (`kind=default`) resolves the world's hero plate (`bridge` for
  `deep-orbit`, mirroring `HERO_PLATE`), fetches the JPEG from its own
  origin, and renders it as a full-bleed cover background under a dark
  scrim; the existing type and accent strip sit on top. Any fetch failure
  falls back to today's text-only card inside a try/catch. The `digest`
  kind keeps its deliberate text-first news layout.

## Wave 2: mission patches

Eleven module emblems in the style of embroidered mission patches - Deep
Orbit canon, and the app's first collectible.

**Assets.** `apps/web/public/patches/deep-orbit/<module-slug>.webp`,
512×512, 40 KB budget. Iconographic only, no lettering; the UI supplies
module number and name. Prompts live in a new `docs/patch-bible.md` (the
contract, like the other two bibles): a shared patch style token plus one
emblem line per module drawn from that module's subject.

**Pipeline.** `generate.mjs` accepts phases `patches` and `seals`.
`scripts/art/patches.mjs` drives generation like `masters.mjs`.
`ingest.mjs patches` validates filenames against the module directories in
the content tree and emits with a square 512 spec. (`emit()` currently
branches on `spec === PORTRAIT` reference equality; it switches to
`"size" in spec` so any square spec resizes correctly.)

**Resolution.** `apps/web/lib/patch-art.ts`: `patchSrc(worldSlug,
moduleSlug)` with an explicit per-world allowlist, same shape as
`location-art.ts`.

**UI.** `ModulePatch` in `packages/ui` (client): an `img` with the
`useImgSettled` recovery, rendering nothing on failure. Surfaces:

- Dashboard module sidebar: a module row with `status: "done"` and a
  resolved `patchSrc` (new optional field on `DashboardModule`) shows its
  patch in place of the ✓ status box; every other state keeps today's box.
- World page module map: same treatment for completed modules.
- Capstone `CertificateCard`: a strip of the world's patches.
- Certificate share page: the full strip - a certificate exists only when
  every module is complete.

Patches appear only when earned. No locked/empty slots, which would
promise content state the surface should not promise.

**Gate.** A `packages/content` test: if any patch asset exists for a
world, every module of that world has one. All-or-none, so a partial set
cannot ship silently.

**Deferred** (to `docs/post-launch-backlog.md`): an award animation at the
moment the last lesson of a module completes. It needs module-completion
state inside the lesson page, which does not exist today.

## Wave 3: certificate package

- **Seal.** One world-completion seal, `apps/web/public/seals/deep-orbit.webp`,
  512×512, patch grammar but a distinct crest (orbital rings motif).
  Prompt in `docs/patch-bible.md`. Resolver: `sealSrc(worldSlug)` in
  `patch-art.ts`.
- **Certificate page.** Seal at the head of the card, avatar (1c) beside
  the learner name, patch strip above the footer. All optional per the
  art contract; the text certificate is the floor.
- **World page.** The capstone/world-complete banner shows the seal when
  the world is complete.
- **OG.** A `cert` kind: plate background + scrim, seal tile, learner
  name, world name. `ingest.mjs og` also emits `og/<world>/seal.png`
  (256×256 PNG) for the edge route. The certificate page's metadata
  switches to `kind=cert`.

## Generation plan

FLUX.2 [pro] via fal.ai, key already in `art-src/.env.art`. Twelve finals
(11 patches + 1 seal), 2–3 candidates each: roughly 30 generations,
about $1 at the 2026-08-09 unit cost. Winners are picked against the
patch bible, canons land in `docs/art-refs/deep-orbit/patches/` as
regeneration anchors (FLUX seeds are not captured). Components ship
before assets, so a rejected batch blocks nothing.

## Testing

- **Unit:** `surfacePlateSrc` / `patchSrc` / `sealSrc` resolvers;
  `ModulePatch` (render, settle-fail → null); dashboard sidebar patch vs
  status box; cert page avatar fallback and no-avatar state; OG plate
  resolution helper extracted pure for tests.
- **No-art fixtures:** each new surface with the image route aborted (not
  merely absent), exercising the `useImgSettled` recovery.
- **Content gates:** expressions gate (extended), patch all-or-none gate,
  slop-lexicon (attribute-only MDX edits add no prose).
- **Axe:** dual-scheme run on touched pages, matching the existing matrix.
- **Visual baselines:** re-mint whatever drifts; `auth-sign-in` (dark and
  light) will. Verify each new baseline by eye before accepting - the
  2026-08-15 Tailwind incident showed a regenerated baseline can certify
  a broken page.
- **Battery:** content, ui+web, typecheck, e2e per the repo's standard.

## Rejected alternatives

- **A plate behind the dashboard stat grid.** Raster under dense text
  fails the legibility rule that shaped every prior surface.
- **Fetching WebP inside the OG route.** Satori's WebP support is not
  dependable; two JPEG emits at ingest are cheap and controlled.
- **Lettering on patches** (real mission patches carry names): generated
  text artifacts; the no-text law stands, the UI labels the patch.
- **Per-lesson OG scene cards** (63 emits): lesson pages sit behind
  auth/paywall and are not shared; the world plate covers today's actual
  share surfaces. Revisit if lessons ever get public share URLs.
- **An award animation now:** blocked on module-completion state at
  lesson end; deferred, not dropped.
