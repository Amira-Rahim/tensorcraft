# Deep Orbit spacing audit, 2026-10-18

## Scope and result

Audited all 56 missions and their five shared phases. The requested
Introduction to Tensors briefing had accidental spacing differences caused by
prose margins stacking with grid gaps. Fixed the shared layout styles, retaining
the full-width vertical flow, visible story, dialogue treatment, task panel,
content, and exercise behavior.

The spacing hierarchy now has one source in `deep-orbit-lessons.css`:

| Boundary | Desktop | Below 640px |
| --- | ---: | ---: |
| Major section | 48px | 32px |
| Story beat | 32px | 24px |
| Related teaching content | 24px | 20px |

These values do not replace intentional spacing inside a component, such as a
speaker header, image caption, code editor, or diagram. Gap-managed stacks reset
only their immediate children's outer margins. A heading starts a new teaching
section with one major gap and stays closer to the explanation that follows it.

## Findings and changes

- Briefing narrator paragraphs retained 39px bottom margins in a grid with a
  32px gap. Adjacent gaps could reach 71px, and the last paragraph left 75px
  before the artwork. Immediate story children now use only the beat gap.
- Briefing section boundaries previously mixed 36px, 40px, and 48px. Artwork,
  key idea, first task, optional review, title, and navigation now use the shared
  major-section gap. A scene setting and its story use the beat gap.
- Twelve openings contain sensor-log blockquotes. Their more specific inherited
  margin rule also needed a reset; changing paragraphs alone was insufficient.
- Replay hid the notes but left their parent as an empty grid item. The parent
  now hides too. Empty post-scene slots contribute no space. The no-JavaScript
  reveal includes the new wrapper and preserves the empty-slot behavior.
- Concept heading margins compounded the reading grid's gap. The first visible
  heading after the workbench could start 80px below it. The first heading now
  has no extra lead-in; later headings use one major boundary.
- Challenge scenes, instructions, exercise briefs, and editors now share the
  spacing hierarchy in both the introductory workspace and standard layout.
- Takeaways recall, recap, and terms use a shared outer stack. Removed the
  recap's accumulated outer padding and redundant divider.
- Epilogues now use the same section and beat tokens at every breakpoint.
  Nine missions had archive blockquotes whose 33px outer margins produced
  65px gaps. A scoped reset removes those margins and retains quote padding.
- At 320px, the introductory tensor activity's select forced its mobile grid
  beyond the page. Kept its shrinking grid track, allowed children to shrink,
  and constrained the select. Code still scrolls inside its own region.

## Verification

Source review covered all 56 openings: all have scenes and opening story,
54 contain dialogue, 25 contain explicit story passages, and 12 contain
sensor-log blockquotes. Two missions author their briefing notes; the other
54 use the shared fallback. No opening has local spacing overrides.

Browser geometry checks used the development gallery, which renders production
section components without completion writes:

- Desktop, 1512px: all 280 mission sections. Checked title boundaries, story
  beats, section transitions, concept heading boundaries, challenge editor
  transitions, takeaway stacks, epilogue stacks, and document overflow.
- Phone, 390px: all 56 briefings plus the four other phases in six missions.
- Narrow phone, 320px: all five phases in the same six missions.
- The six representative missions were Introduction to Tensors, Tensor Shapes,
  Basic Tensor Operations, Layers and Architecture, The Training Loop, and
  Launch. This covers authored and fallback notes, archive quotes, distinct
  activity types, the introductory editor workspace, and a multiple-exercise
  mission.
- Rechecked the nine epilogue exceptions after their fix. Their direct quote
  margins are zero and all measured beat gaps match the token.
- Rechecked the 320px tensor activity: the select fits its 198px content area,
  and the document no longer overflows.
- On the requested normal lesson route, replay removed the empty notes grid
  item, retained the artwork, and restored the notes when playback finished.
  The story grid was exactly the artwork's height during replay.
- Reviewed desktop and phone story screenshots. Existing narrative waveforms,
  readable type, dialogue surfaces, and the new first-task treatment remain.

All measured boundaries passed after the fixes. These are layout measurements,
not a claim that every exercise or every interaction was re-executed. Lazy
image loading was recorded as a diagnostic; a pending offscreen image was not
treated as a spacing failure.

Existing regression tests passed: 219 playback/content/partition/layout tests,
105 scoped layout/component tests, three tensor interaction tests, and a final
eight-test no-JavaScript/post-scene check. Formatting and `git diff --check`
also passed. Some test groups overlap; these counts are not a unique total.

Local evidence is in `.superpowers/mission-spacing-*.json` and
`.superpowers/mission-spacing-story-desktop.png` / `mission-spacing-story-mobile.png`.
The design plan is `.superpowers/mission-spacing-design-2026-10-18.md`.
No deployment was performed.
