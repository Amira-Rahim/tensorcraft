# Patch Bible: Deep Orbit

Single source of truth for the module mission patches and the world
completion seal. Companion to `docs/character-bible.md` and
`docs/scene-bible.md`, same contract: **the prompts here are the
contract.** Art may be regenerated at any time, but it must keep matching
each entry's emblem and the shared style token. Nothing here blocks a
build; until an image ships, every surface renders exactly as it does
today (`ModulePatch` falls back to the status glyph or to nothing).

Asset conventions (wired in code 2026-08-15):

- Patches: `apps/web/public/patches/deep-orbit/<module-slug>.webp`,
  320x320 webp q82, 40 KB cap (`scripts/art/ingest.mjs patches`). 320
  because the largest render is the 72px certificate seal at 2x DPR, and
  stitched texture compresses worse than flat portrait color: at 512 seven
  of eleven first-run patches blew the cap.
- Seal: `apps/web/public/seals/deep-orbit.webp`, same spec
  (`scripts/art/ingest.mjs seals`).
- OG derivative: `apps/web/public/og/deep-orbit/seal.jpg`, 256x256
  (`scripts/art/ingest.mjs og`; JPEG because the seal has no alpha and
  PNG tripled the byte cost).
- Generation: `scripts/art/patches.mjs` (drives `generate.mjs` with the
  `patches` / `seals` phases; candidates stage to `art-src/patches/` and
  `art-src/seals/`).
- Approved canons: `docs/art-refs/deep-orbit/patches/` (committed;
  FLUX seeds are not captured, so the canon file IS the regeneration
  anchor).
- Coverage: `packages/content/__tests__/patch-art-coverage.test.ts`
  enforces all-or-none per world, so a partial patch set cannot ship
  silently.

## Shared patch style token

Append verbatim to every patch prompt (`TOKEN` in
`scripts/art/patches.mjs` carries the same text):

> embroidered space-mission patch on a near-black field, circular warm
> brass #A89060 border ring, flat cel-shaded fill with bold clean
> linework, green #6BAA8A glow accents, single central emblem, stitched
> texture suggestion, cohesive series look, not photorealistic,
> absolutely no text, lettering, numerals, letters or logos anywhere.

## Rules

1. **No lettering, ever.** Real mission patches carry mission names;
   generated lettering artifacts. The UI supplies the module number and
   name beside the art. This is the same no-text law the scene bible
   carries, and it is the first thing to check at review.
2. **One central emblem.** A patch reads at 28 px in the dashboard
   sidebar. Busy compositions fail at that size; reject them.
3. **Series coherence.** Same ring weight, same palette, same flat fill
   across all eleven. Review candidates side by side, not one at a time.
4. **Patches are earned.** Surfaces render a patch only for completed
   modules; no locked/empty slots, which would read as a promise.
5. **The seal outranks the patches.** Heavier, radially symmetric, more
   formal. It marks world completion on the certificate and the world
   page; it never appears beside unfinished work.

## Emblem canon

One line per module; the emblem subject is drawn from the module's title
and story role. Prompt text lives in `scripts/art/patches.mjs` (`PATCHES`
map) and mirrors this table.

| module | emblem |
|---|---|
| foundations | a luminous wireframe cube of stacked data planes held in a gloved hand |
| neural-networks | a layered lattice of glowing nodes converging to a single bright output star |
| training-loop | a descending orbital spiral tightening toward a glowing minimum point |
| browser-runtimes | a browser window frame with a small starship engine glowing inside it |
| signal-processing | a clean sine wave passing through a prism and emerging as sharp pulses |
| recurrent-networks | an ouroboros loop of signal arrows around a small memory core |
| anomaly-detection | one jagged spike breaking a calm telemetry line inside a crosshair ring |
| advanced-time-series | three forecast trajectories fanning out from a comet's path |
| llm-integration | a speech-bubble constellation linked by circuit traces to a ship antenna |
| optimization-edge | a compact satellite shedding excess panels, streamlined for descent |
| capstone | a fully deployed deep-space dish antenna over a cleared orbital field |

**Seal:** a world-completion crest for the same series: a brass laurel of
three concentric orbital rings around a small keystone star, radial
symmetry, formal and austere.

## Production log

- 2026-08-15: initial run, FLUX.2 [pro] via fal.ai, 2 candidates per
  emblem. Whatever the gates teach lands here, the way the character and
  scene bibles keep their own logs.
