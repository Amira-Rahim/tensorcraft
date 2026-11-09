# Deep Orbit artwork quality audit, historical record

Later user reports and a related check reopened twelve scenes that this audit had approved. Those repairs are now installed and independently reviewed. See the [follow-up correction record](../deep-orbit-quality-2026-11-09-followup/README.md). The original audit counts below are historical.

Completed November 9, 2026. Reviewed all 280 lesson scenes and 41 supporting images against the latest batch. Replaced 75 scenes and one supporting patch. Retained 205 scenes and 40 supporting images after inspection. The later corrections are recorded separately.

The [current artwork gallery](index.html) uses the installed images. The [per-image record](final-review.json) links every original finding to its retained image or reviewed replacement. Exact prompts, reference roles, hashes and review notes live in each [repair record](repairs/).

## Changes

The repairs give lesson displays more space, replace awkward hand and prop interactions, and restore natural character reactions. Text and diagrams follow their physical screens. Characters read their own documents while shared screens expose the required information to the learner.

The latest reported Nazari scene now uses a relaxed mouse hand and a supported hand on the notebook. Farah's autoencoder briefing uses the large wall display for its feature checks. The temporal-attention scenes replace the broken pen and strained grips with coherent console interactions.

All replacements used built-in image generation. Current source PNGs remain in `art-src/scenes/`, runtime WebPs in `apps/web/public/scenes/deep-orbit/`, and the corrected signal-processing patch retains its existing source and runtime paths. Five distinct images remain available for every lesson.

| Module | Replaced scenes |
|---|---:|
| advanced-time-series | 13 |
| anomaly-detection | 9 |
| browser-runtimes | 11 |
| capstone | 1 |
| foundations | 6 |
| llm-integration | 12 |
| neural-networks | 5 |
| optimization-edge | 6 |
| recurrent-networks | 1 |
| signal-processing | 7 |
| training-loop | 4 |

## Review evidence

Every lesson image received a native-size comparison and a focused hand, prop and display review. Reviewers compared faces with the canonical portraits and checked displayed facts against lesson sources. Every replacement then received an independent review of the exact generated file. All 75 replacement scenes passed a further 768 x 512 review of the compressed runtime asset. The patch passed at 320 x 320.

Peer review caught two audience-facing report scenes and an ambiguous FFT heading before publication. Those candidates were corrected and reviewed again. Suspected palm reversals that proved plausible from the full arm and camera view were cleared and documented.

The [technical validation](validation.json) passes for all 321 active stills. All 280 scenes have unique hashes, complete section coverage, matching source/runtime hashes and reproducible encoding. Every scene meets the 1536 x 1024 dimensions and 200 KiB limit. `git diff --check` also passes. These checks cover image assets and source consistency, not a new application browser test.

## Cleanup

Replacements overwrite their active paths. Removed 78 temporary project candidate copies and eight redundant original copies or obsolete review sheets. The latter reclaimed 3,454,799 bytes. Retained canonical references and current source assets. See [candidate cleanup](cleanup.json) and [unused artwork cleanup](unused-artwork-cleanup.json).

The [scene rules](../../scene-bible.md) now require available-space display readability, complete arm-chain inspection, correct grips and straight rigid props. Future image changes require another review.
