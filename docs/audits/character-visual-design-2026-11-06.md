# Character visual design audit

Date: 2026-11-06

Status: the follow-up [character visual repairs](character-visual-repairs-2026-11-06.md)
replace the scene silhouettes with visible canonical faces and address the
portrait and UI findings. This audit records the original assets and layout.

The Deep Orbit cast has a clear foundation: distinct hair shapes, useful uniform differences, a shared green and brass palette, and an abstract AI identity. Production consistency needs another pass. Scene art sometimes replaces the cast, ARIA changes structure between expressions, and several facial states change the intended personality.

## Review evidence and limits

- Visually inspected all 20 shipped portrait assets, including comparisons at the lesson's 44px size and the world page's 88px size.
- Visually sampled 16 scene assets across all 11 Deep Orbit modules. The sample is listed below. This does not establish that the remaining scenes pass.
- Reviewed avatar components, dialogue styling, crew introductions, character tooltips, character mappings, art prompts, and both design bibles.
- Inspected retained network-lesson briefing screenshots at 1440px in dark mode and 390px in light mode. These are existing captures, not a fresh browser run. Live browser access was unavailable.
- Other worlds have no shipped portrait sets. Their character sheets remain pending, so this audit covers Deep Orbit.
- No application code or artwork changed. No test suite ran for this audit.

UI source checks used the [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) for image labeling, focus, and motion. Visual judgments below come from the local artwork and project design contracts.

Current portrait originals remain available for [Mirza](../../art-src/neutrals/commander-mirza-openai-20261106.png), [Farah](../../art-src/neutrals/dr-farah-openai-20261106.png), [Nazari](../../art-src/neutrals/chief-nazari-openai-20261106.png), and [Demir](../../art-src/neutrals/ensign-demir-openai-20261106.png). The [portrait source record](../art-refs/deep-orbit/2026-11-06-human-portrait-repairs/prompts.json) lists the expression originals.

The November 9 cleanup removed the obsolete expression comparison sheets,
including the 44px and 88px previews. The [cleanup record](deep-orbit-quality-2026-11-08/unused-artwork-cleanup.json)
preserves their hashes and retained original paths. Findings below describe
the November 6 audit. Image links open the current artwork.

## Findings by priority

### 1. High: scene art contradicts character identity and cast count

[building-a-network.webp](../../apps/web/public/scenes/deep-orbit/neural-networks/building-a-network.webp) contains eight people. A visibly light-skinned, dark-haired man in a suit occupies the command station. The intended subject is Mirza alone, a mature Black woman in her command uniform. Both [the scene bible](../scene-bible.md#neural-networksbuilding-a-network) and [the lesson's frontmatter](../../packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx) establish that solitary scene.

This mismatch appears directly below Mirza's portrait and order in the retained lesson screenshots. It breaks the connection between the character speaking and the person the illustration presents.

[the-anomaly.webp](../../apps/web/public/scenes/deep-orbit/anomaly-detection/the-anomaly.webp) and [launch-epilogue.webp](../../apps/web/public/scenes/deep-orbit/capstone/launch-epilogue.webp) each show five human figures. Their full-crew staging calls for four humans and ARIA as a waveform on a screen.

Replace the network scene first. Establish reusable silhouettes for the four humans, with fixed hair, clothing outlines, proportions, and signature props. Keep the exact cast count for each scene. Check the other scenes before treating the sample as representative of the whole course.

### 2. Medium: ARIA's expressions redraw her identity

The four [ARIA assets](../../apps/web/public/characters/deep-orbit/aria.webp) have different outer-ring geometry, thickness, facets, and tick patterns. The deadpan ring becomes especially heavy. At 44px, the ring change competes with the waveform change.

This conflicts with [the expression contract](../../scripts/art/expressions.mjs): the surrounding instrument must stay fixed while only the trace changes. The abstract, nonhuman direction works well. Preserve one approved ring and background across all four states, then replace only the waveform inside it.

### 3. Medium: the portraits use noticeably different drawing treatments

This is a design judgment. Mirza uses comparatively simple shapes and restrained surface detail. Nazari and Demir have extensive scratch lines, seams, and texture. Farah has much larger eyes and a smaller jaw, giving her a younger, more animated appearance than the rest of the adults. Mirza and Demir also sit against visibly lighter gray backgrounds than Farah and Nazari.

The shared palette connects them, but the neutral lineup still looks like several illustration passes. Keep the recognizable faces and wardrobe. Agree on one eye treatment, line weight, texture density, background value, and glow strength before creating more art. Farah's stated age of 38 should inform that review, without treating an apparent age as an objective measurement.

### 4. Medium: several expressions change the intended personality

The clearest mismatches are visible in both the large sheet and the 88px comparison:

- [Nazari's grudging respect](../../apps/web/public/characters/deep-orbit/chief-nazari-grudging-respect.webp) is a broad, warm smile. Her prompt asks for a flat mouth and softened eyes, with approval kept small.
- [Nazari's haunted state](../../apps/web/public/characters/deep-orbit/chief-nazari-haunted.webp) loses much of her facial weathering and reads as a direct scowl. The intended beat is composed, distant unease.
- [Farah absorbed](../../apps/web/public/characters/deep-orbit/dr-farah-absorbed.webp) reads as worried or sad. The raised inner brows and downturned mouth compete with the intended thoughtful absorption.
- [Demir focused](../../apps/web/public/characters/deep-orbit/ensign-demir-focused.webp) has a hard frown. His prompt asks for calm concentration with level brows.

The [character bible already records accepted de-aging](../character-bible.md#deep-orbit-portraits-2026-08-09) in senior characters' variants. That history matters: this is a recommendation to revisit the strongest cases at larger display sizes, not a newly discovered failure in every expression. Mirza's recognizability and silver temples largely hold.

Direct each state through a specific mouth, brow, and gaze change while preserving age markers, facial proportions, and props. Review states beside the exact dialogue they accompany.

### 5. Medium: dialogue gives the artwork little visual weight

[AnimatedAvatar](../../packages/ui/src/animated-avatar.tsx) defaults to 44px in lesson dialogue. [The speech styles](../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-dialogue.css) use 22px speaker names and 24px body text on desktop. The retained screenshots confirm that the portrait functions mainly as a small identity marker inside a much larger dialogue card.

The characters remain broadly distinguishable at 44px. Subtle expressions, mature facial detail, the chronometer, and uniform markings carry much less meaning at that size. Compare a 64px dialogue portrait with the current layout, including 320px screens, before adopting a new size. A slightly tighter dialogue crop may help without enlarging every surface. This proposed size has not been browser-tested.

### 6. Low: small prop details drift between states

Mirza's neutral chronometer has a blank face. Her variants add dense generated markings. Demir's tablet changes from a bright display to a black face in his focused state. These changes add flicker and unrelated visual information to an expression crossfade.

Lock the props when producing variants. Keep the watch face simple and unlettered, as the portrait contract requires. This is more visible in large portraits than in lesson avatars.

### 7. Low: introduction labels and AI fallback weaken identity

[CrewStrip](../../apps/web/app/learn/crew-strip.tsx) and [WorldCast](../../apps/web/app/worlds/[slug]/world-cast.tsx) show manifest archetypes such as "Mentor" and "Skeptic". The character tooltips already use useful ship identities such as commander and chief engineer. Use those in-world jobs consistently so the uniform and role reinforce each other.

[AnimatedAvatar's fallback](../../packages/ui/src/animated-avatar.tsx) does not pass an AI flag to CharacterAvatar. If ARIA's base image fails, she becomes "AR" initials rather than the abstract placeholder that CharacterAvatar supports. All current files exist, so this is a failure-state issue rather than a visible defect in the inspected assets.

## Character-specific direction

| Character | What works | Main refinement |
| --- | --- | --- |
| Mirza | Silver temples, mature neutral face, command uniform and chronometer establish seniority. | Preserve her identity in scenes and lock age markers and watch detail across states. |
| Farah | Hair, lab layer, and AR lens distinguish her quickly. | Bring facial proportions into the shared adult cast style and redirect absorbed toward thoughtfulness. |
| Nazari | Weathering, gray streak, and scuffed coverall communicate experience. | Preserve that weathering and make approval and haunting fit her restrained personality. |
| Demir | Tousled hair, stubble, and earpiece create an approachable learner counterpart. | Reduce texture noise and make focused read as calm competence. |
| ARIA | The waveform establishes an unmistakably abstract AI. | Keep the instrument fixed and simplify details that disappear at 44px. |

## Story direction opportunity

Across 176 authored Dialogue tags, 44 specify an expression. Five shipped variants have no authored use: Mirza concerned and approving, Farah shaken, Demir overwhelmed, and ARIA alarm. This count alone is not a defect. Use expressions at earned emotional turns, especially approval, uncertainty, and discoveries, after fixing their visual meaning. Preserve neutral moments and restrained motion.

Keep the shared palette, square frames, recognizable hair shapes, and nonhuman ARIA. The source already provides named image semantics, expression-image fallbacks, keyboard focus for character mentions, and reduced-motion handling. Browser interaction checks remain unverified in this audit.

## Scene sample

Paths below are relative to `apps/web/public/scenes/deep-orbit/`:

```text
foundations/introduction-to-tensors.webp
foundations/tensor-shapes.webp
foundations/tensor-operations.webp
neural-networks/first-neuron.webp
neural-networks/building-a-network.webp
training-loop/loss-functions.webp
signal-processing/spectrograms.webp
recurrent-networks/lstm-gates.webp
anomaly-detection/the-anomaly.webp
advanced-time-series/temporal-attention.webp
llm-integration/report-generation.webp
optimization-edge/model-profiling.webp
browser-runtimes/why-the-browser.webp
browser-runtimes/transformers-js.webp
capstone/launch.webp
capstone/launch-epilogue.webp
```

Retained screenshots inspected:

```text
test-results/signed-in-network-review/signed-in-network-signed-i-25922-e-mission-at-1440px-in-dark/network-briefing-1440.png
test-results/signed-in-network-review/signed-in-network-signed-i-4ec84-e-mission-at-390px-in-light/network-briefing-390.png
```
