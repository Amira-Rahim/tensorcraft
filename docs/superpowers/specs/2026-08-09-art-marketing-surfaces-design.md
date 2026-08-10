# Deep Orbit art on the marketing surfaces

Status: approved design, not yet implemented
Date: 2026-08-09

## Problem

The Deep Orbit art shipped on 2026-08-09: 16 character portraits and 63 scene
establishing shots under `apps/web/public`, plus four location master plates
staged in `art-src/masters` that were never ingested. Every one of those assets
is reachable only from inside a lesson. The landing page, the theme pages,
pricing, and the rest of the app render exactly as they did before the art
existed.

The masters are the sharpest gap. `docs/scene-bible.md` generated them as the
reference plates that keep the Bridge the same Bridge across 24 lessons, and
records that they are "reusable as marketing / theme-page art." They are wide,
figure-free environment shots. They are the right asset for a marketing
surface, and they are sitting in a gitignored staging tree as PNGs.

## Constraints

1. **The art is dark-only raster; light mode shipped on 2026-07-23.** Nothing
   in a `.webp` re-renders per scheme the way the procedural canvases do.
2. **The marketing surfaces run a procedural visual system.** `ParticleField`,
   `OrbitCanvas`, `SceneCanvas`, and `ThemeSceneBackdrop` all react to theme hue
   and to scheme. Raster does neither. Where the two meet, one must yield.
3. **The landing hero already carries the page's thesis.** `DeepScanDemo` runs
   a real 4 KB TFJS model in the visitor's tab. Illustration must not displace
   working proof.
4. **Scenes average 150 KB, 7.3 MB in total.** The hero is LCP-sensitive.
5. **Four of the five themes have no art** and will not until the theme-2 gate
   opens. Any shared component must serve them unchanged.

Palette is not a constraint. The art is `#6BAA8A` green and `#A89060` brass,
already inside the brand rule.

## Design

### The signature: a viewport onto the Archimedes

The Five Worlds band on the landing page takes the Bridge master plate as its
ground, and `OrbitCanvas` keeps running above it as the reflection on the
glass. This is the single bold move on the page. It resolves constraint 2 by
making the procedural layer read as an optical property of the raster layer
rather than a competitor to it, and it leaves the hero's proof panel alone.

Everything else stays quiet.

### The frame: one treatment everywhere

Every raster plate on a marketing surface gets the same presentation:

- 2px `--tc-border`
- brass inner rule
- `4px 4px 0 var(--tc-border)` offset shadow, light scheme only

This is the grammar `ScenePortrait` already uses in lessons
(`globals.css:417`). Dark art reads as screen content inside a lit room, in
both schemes. No filters, no light-variant art set.

### Contracts that hold across all three waves

**Art stays optional.** Every surface degrades to today's layout when an image
is missing or fails, matching the `ScenePortrait` precedent of rendering
nothing rather than a placeholder. Components may ship before assets.

**Resolution goes through the existing helpers.** Character paths come from
`portraitSources()` in `apps/web/lib/character-art.ts`. No surface builds an
asset path from a string.

**Alt text follows the job.** Plates that sit behind type are decorative
(`alt=""`); the adjacent heading already names the world. Cast portraits carry
the character's name.

**Budgets are enforced at ingest,** not in review. Over-budget files fail the
script with exit 1, as they do today.

---

## Wave 1: location plates

### Ingest

`scripts/art/ingest.mjs` gains a third mode alongside `portraits` and `scenes`:

```bash
node scripts/art/ingest.mjs masters [--dry-run]
```

- A `LOCATIONS` list: `bridge`, `lab`, `engineering`, `dashboard-station`.
- A `MASTER` spec at 1536x1024, quality 72, 200 KB cap. `emit()` selects its
  resize branch by comparing `spec === PORTRAIT` by reference, so any new spec
  object falls through to the width/height branch with no change to `emit()`.
- Source: `newest("art-src/masters", location)`, the same picker the other two
  modes use.
- Destination: `apps/web/public/locations/deep-orbit/<location>.webp`.
- A location with no staged candidate lands in `results.missing` and the run
  continues.

**Pre-flight, before the first real ingest.** `newest()` picks by name sort,
which resolves to the latest timestamp, not to the approved plate. `bridge` has
three staged candidates, `lab` and `engineering` have two each, and
`dashboard-station` has one. The latest `bridge` candidate does match the
centered, symmetric camera canon in `scene-bible.md`. The other three are
unverified. Look at each winner against its location canon before ingesting; if
a name-sort winner is the wrong plate, rename the approved file rather than
teaching the picker a second rule.

### `ThemeSceneBackdrop`

Add an optional `plateSrc` prop. When present, the component renders the plate
at `z-0` beneath the existing `SceneCanvas`, which drops to reduced opacity.
Both layers sit inside the current wrapper and inherit its
`linear-gradient(180deg, black 55%, transparent 100%)` mask, so the plate fades
out on the same curve as the canvas.

When `plateSrc` is absent, the render is byte-identical to today. The component
is extended, not replaced, because it serves all five themes and only Deep
Orbit has art (constraint 5). The existing early return stays, widened: bail
only when the theme has neither a draw function nor a plate.

`/themes/deep-orbit` passes `plateSrc="/locations/deep-orbit/bridge.webp"`.

### Landing page

`apps/web/app/components/five-worlds-section.tsx` composites the same two
layers in the flagship band:

- `z-0` Bridge plate
- `z-1` `OrbitCanvas`, currently at `z-0`
- `z-10` existing content, unchanged

The plate is below the fold, so it stays off the LCP path.

### Out of scope for wave 1

The landing hero, `/api/og`, and the four coming-soon theme cards.

---

## Wave 2: cast on `/themes/deep-orbit`

A cast row on the theme page, built on `AnimatedAvatar` and
`portraitSources()`. One uniform row: five characters, five shipped
portraits.

**Superseded during implementation, 2026-08-10.** This section originally
specified four faces plus a live `AriaWaveformAvatar`, because ARIA had no
portrait art and `CharacterAvatar`'s `isAI` branch renders only a static
glyph. While Wave 1 was being built, a concurrent session shipped ARIA's four
portraits (her art is a waveform inside a brass instrument ring, not a face)
and retired the procedural waveform component along with `ariaWaveformState()`.
The row is therefore uniform, and simpler than planned. The "four faces and
one waveform" asymmetry described here no longer exists.

The landing page gets no faces. A row of portraits on a landing page is the
most templated pattern available, and the faces earn their meaning inside the
lessons.

---

## Wave 3: module filmstrip on `/pricing#curriculum`

Eleven frames, one per module, lazy, below the fold, under an aggregate byte
cap. The cap belongs to the page, not to ingest: these scenes already shipped
under the per-file 200 KB cap, and nothing today stops a component from putting
eleven of them on one route. A test asserts the frame count and the summed
transfer size.

**This wave opens with a content edit, not a component.** Scene art is keyed by
lesson, so no "module hero" scene exists. Choosing which lesson's shot stands
for its module is an editorial decision and belongs in `docs/scene-bible.md` as
a named field per module. A component that reaches for index `[0]` of a
module's lessons would be making that call silently and would drift the first
time a lesson is reordered.

Sequence: bible field, then a content-gate check that every module names a
valid lesson, then the component.

---

## Testing

- **Ingest.** Slug validation rejects a misnamed master; an over-budget plate
  exits 1.
- **No-art fixtures.** One per new surface, with the image route aborted, not
  merely absent. An SSR'd `<img>` can 404 before hydration attaches `onError`;
  `useImgSettled` recovers the verdict from the DOM, and the fixture must
  exercise that path.
- **Dual-scheme axe** on the landing page, `/themes/deep-orbit`, and
  `/pricing`, matching the existing 28/28 matrix.
- **Visual regression baselines** regenerated for all three surfaces.
- **Reduced motion** needs no new work: the canvases already render a static
  frame, and the plates do not animate.

## Rejected alternatives

**A CSS filter to lift the plates in light scheme.** Muddies flat cel shading
and the brass trim, and puts a compositing filter on 150 KB rasters during
scroll.

**A light-scheme art set.** Best fidelity, but it costs another generation run
and doubles the asset count, the ingest surface, and the regression surface.
The diegetic frame gets most of the benefit for none of that.

**Cast portraits on the landing page.** Reads as a stock avatar row and spends
the page's boldness in the wrong place.

**Replacing the hero's `DeepScanDemo` with art.** Trades working proof for
decoration.
