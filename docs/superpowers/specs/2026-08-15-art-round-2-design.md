# Art round 2: onboarding, worlds index, patch collection, adrift

Status: approved design (owner approved the round-2 ranked list 2026-08-15,
"start round 2")
Date: 2026-08-15

Companion to `2026-08-15-art-expansion-spine-design.md`; every contract
there (art optional, app-side resolvers, ingest budgets, no text in art,
no future product plans on user surfaces) carries over unchanged.

## Scope

The four "do next" items from the round-2 brainstorm. The parked items
(coming-soon casts, pricing, journey, blog, email, other worlds) stay
parked.

### 1. Onboarding finish step

The wizard's Ready step shows a `◎` glyph above "All Systems Go". When
`surfacePlateSrc(DEFAULT_WORLD, "onboarding")` resolves (new surface key
`"onboarding"` → `bridge` - the wizard hands the learner to the Bridge),
render a framed `ArtPlate` at the summary card's width in place of the
glyph; the glyph stays as the art-less render. Because this is the first
*replacement* use of ArtPlate, the component gains a `fallback` prop
(mirroring `ModulePatch`): a plate that resolves but fails to load
renders the glyph again, never nothing. No copy changes.

### 2. /worlds index hero card

`WorldCardData` gains `plateSrc?: string`; the server page resolves it
with `heroPlateSrc(slug)` for live worlds only. In the hero variant,
`ArtPlate bleed` becomes the card's ground with the existing
`SceneCanvas` above it at 50% opacity (the shipped plate-under-canvas
composite), plus a bottom-up scrim in the card body region so the
tagline and stats stay legible. Muted coming-soon cards are untouched.

### 3. Dashboard patch collection panel

`PatchCollection`, a sibling of `BridgeCollection`, rendered directly
after it. Input: the existing `modules` array (`DashboardModule` already
carries `status` and `patchSrc`). Render: a bordered section with the
house mono header ("MISSION PATCHES" + earned/total count) and one slot
per module: earned modules (`status: "done"`, the same predicate the
header count uses) show `ModulePatch` at 48px with the module number
beneath; unearned modules show a dashed empty box with the muted module
number. Empty slots are allowed here (unlike the earned-only
map rows): every module is launched content, so a slot promises nothing
unbuyable. The panel renders only when at least one module resolves a
`patchSrc` (worlds without patch art keep today's dashboard).

### 4. 404 and error pages: the adrift plate

A new auxiliary location master, `adrift` (a small probe alone in open
space, slack tether, one green running light), generated through
`masters.mjs` and ingested by the existing `masters` mode; it joins
`LOCATIONS` but is a page plate, not a scene reference. `not-found.tsx`
and `error.tsx` render it as a framed `ArtPlate` above their card copy
via two new surface keys (`"not-found"`, `"error"`, both → `adrift`),
resolved with `DEFAULT_WORLD` since both pages are app-global.
`global-error.tsx` stays dependency-free and untouched.

## Testing

- Resolver tests for the three new surface keys.
- Component tests: onboarding Ready step with and without art; hero card
  with and without `plateSrc` (muted card never renders a plate);
  `PatchCollection` earned/unearned/absent states; 404 page plate.
- E2e: `/worlds` joins the aborted-route art fixtures.
- Visual: `worlds-index` baselines (dark + light) will drift; re-mint
  and verify by eye.
- Full battery, web typecheck, dual-scheme axe on touched pages.

## Rejected

- Plate on `global-error.tsx`: the root crash boundary should not add
  asset dependencies.
- Empty patch slots on the world map or module sidebar: those rows stay
  earned-only; the collection panel is the one place absence is shown,
  because a collection is the one framing where an empty slot reads as
  "not yet" rather than "broken".
- A new scrim system for the hero card: reuse the color-mix gradient
  grammar from the auth pane.
