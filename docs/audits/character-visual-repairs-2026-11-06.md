# Character visual repairs

Date: 2026-11-06

Deep Orbit now uses the canonical crew with visible faces throughout its 63
lesson illustrations. The repaired set covers all 56 briefing scenes and seven
epilogues. Each scene ships once under its runtime lesson slug.

[Scene review gallery](character-visual-design-2026-11-06/scene-gallery.html)
supports module filtering and opens each image at full resolution.
Current original scenes remain available for [Building a Network](../../art-src/scenes/neural-networks__building-a-network-openai-20261107.png)
and [The Anomaly](../../art-src/scenes/anomaly-detection__the-anomaly-openai-20261107.png).
The November 9 cleanup removed the obsolete four-scene preview. Its
[cleanup record](deep-orbit-quality-2026-11-08/unused-artwork-cleanup.json)
preserves the preview hash and retained original paths. This document records
the November 6 repairs. Image links open the current artwork.

## Character and scene changes

All sixteen human portrait states now share cleaner cel shading, adult facial
proportions, reduced clothing texture, and consistent backgrounds. Their
expression states preserve identity and age. Nazari's approval stays restrained,
her haunted state shows distant unease, Farah's absorbed state shows thought,
and Demir's focused state shows calm concentration. Mirza's chronometer remains
plain. Farah keeps her AR lens and Demir keeps his earpiece.

ARIA's four portrait states use one approved ring shell. A deterministic local
renderer changes only the waveform and exports the existing raster asset names.

Scene regeneration uses the repaired portrait references for each named human.
Every replacement shows recognizable faces, the intended cast, and the scene's
task display. Mirza's network scene now uses a medium shot of the actual
commander alone. Ensemble scenes show four human crew members. ARIA remains an
abstract screen waveform. The scene bible and generation driver now require
visible faces and preserve each character's age, hair, skin tone, and uniform.

Dialogue portraits now use 64px frames on desktop and 56px on narrow screens.
Crew introductions use ship jobs instead of narrative archetypes. Missing AI
art keeps its abstract placeholder.

## Saved artwork and exact prompts

Final assets remain in the existing directories:

- `apps/web/public/characters/deep-orbit/`
- `apps/web/public/scenes/deep-orbit/`

All raster generation and editing used the built-in imagegen tool. The ARIA
renderer adds vector waveform paths to its tool-edited shell.

- [Human portrait prompts and selected sources](../art-refs/deep-orbit/2026-11-06-human-portrait-repairs/prompts.json)
- [ARIA shell prompt and renderer record](../art-refs/deep-orbit/2026-11-06-aria-repair.json)
- [Scene source index](../art-refs/deep-orbit/face-visible-scenes-2026-11-06/approved-scenes.json)
- [First scene batch prompts](../art-refs/deep-orbit/face-visible-scenes-2026-11-06/root.json)
- [Second scene batch prompts](../art-refs/deep-orbit/face-visible-scenes-2026-11-06/scene-character-audit.json)
- [Third scene batch prompts](../art-refs/deep-orbit/face-visible-scenes-2026-11-06/character-ui-audit.json)
- [Fourth scene batch prompts](../art-refs/deep-orbit/face-visible-scenes-2026-11-06/portrait-repairs.json)
- [Normalization diagram refinement](../art-refs/deep-orbit/face-visible-scenes-2026-11-06/normalization-cleanup.json)

Selected full-size PNGs stay in gitignored `art-src/scenes`. The explicit
approved-source index prevents the ingestion command from selecting historical
shadow candidates. A missing approved source fails before any scene writes.
The driver also resolves actual lesson slugs, including
`time-series-ensemble-methods`.

The normalization hologram keeps four separate input and output traces with
one-to-one connections. Scaling changes their amplitudes while preserving
their distinct patterns.

## Asset cleanup

The requested cleanup removed 267 obsolete files, reclaiming about 151 MiB.
These included old shadow-scene sources, replaced portrait sources, duplicate
approved PNGs, original snapshots, superseded prompt records, and local review
scratch files. The unused `ensemble-methods.webp` alias was also removed.
The coverage check now reads the lesson's frontmatter slug, matching the app's
`time-series-ensemble-methods.webp` request.

The 63 approved scene sources, sixteen human portrait sources, canonical
references, ARIA ring, final assets, exact selected prompts, and review gallery
remain. Prompt records mark removed historical inputs explicitly. Selected
source paths now point to the retained canonical copies. Hash checks confirm
that all approved scene sources and shipped scene and portrait images stayed
unchanged.

## Verification

Source review and visual inspection covered all 20 portrait states and all 63
canonical scene replacements. Each scene has a 1536x1024 WebP under 200 KB.
Each portrait has a 512x512 WebP under 40 KB. Image descriptions no longer refer
to shadow figures and stay within the scene bible's 150-character limit.

Validation passed:

- Focused avatar, character lookup, character bible, and repository punctuation
  checks: 38 tests. The UI implementation pass also passed its targeted
  component tests and web TypeScript check.
- Twelve scene prompt and ingestion tests cover cast references, ARIA's abstract form,
  runtime slugs, explicit source selection, and missing-source failures.
- Eight Chromium lesson checks cover keyboard and touch character cards,
  accessibility, and dialogue layout at 320px, 390px, and 1440px in both themes
  across the tested cases.
- A separate gallery browser check covers filtering, loaded images, and narrow
  layout. The local review content build passes.

No commits were created.
