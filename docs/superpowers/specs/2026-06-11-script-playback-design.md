# Lesson Script Playback + Screenplay Format

**Date:** 2026-06-11
**Status:** Requirements given verbatim by owner; design decisions recorded here.
**Builds on:** `2026-06-11-lesson-screenplay-register-design.md`

## Requirements (owner)

1. Script parts must look like a real screenplay (reference: standard
   dialogue-list format: centered speaker in caps, parenthetical under the
   speaker, dialogue in a narrow centered column).
2. On page load the script part animates as if the script is being played.
3. When the animation finishes, the explanation part appears and the page
   scrolls to it.
4. The animation can be replayed.
5. The bottom Back button is removed entirely.

## Design decisions

### Screenplay format (`packages/ui/src/mdx/dialogue.tsx`)

- Dialogue block: `max-w-[440px] mx-auto` (centered column).
- Speaker: centered, caps, mono, theme primary (unchanged color).
- Parenthetical `(direction)`: centered, italic, muted.
- Dialogue text: left-aligned inside the centered column (screenplay
  convention; centered text is a lyrics convention, not a script one).
- Stage directions (story-zone prose) and scene slugline keep the existing
  register: action lines in real screenplays are left-aligned full blocks.
- CUT-TO divider unchanged (now constrained by the narrower column).

### Playback engine (`StepBriefing` in lesson-steps.tsx)

Beat-by-beat reveal, attribute-driven, no DOM text mutation (MDX output is
React-owned; char-level typewriter would require splitting text nodes and
fighting React). A "beat" is one story element: the scene slugline, the
narrative stage direction, and each pre-heading child of the MDX container
(dialogues and story prose, same boundary as the story-zone CSS).

- Wrapper div carries `data-script-state="playing" | "done"`.
- Beats hidden via CSS while playing until they get `data-beat-shown`
  (opacity/translate transition, 0.45s ease).
- Timeline: JS `setTimeout` chain; each beat's hold time is
  `clamp(800ms, words * 170ms, 3200ms)` so pacing follows reading length.
- Instructional content (first `h2/h3` and everything after) and the
  CUT-TO divider are `display: none` while playing.
- Finish: state flips to `done`, everything visible, smooth-scroll to the
  first heading in the content (fallback: the CUT-TO divider).
- Skip button (visible while playing): jumps to `done`, no auto-scroll.
- Replay button (visible when done): reruns the timeline from the top,
  hiding instruction again; finishes with the same scroll-to-explanation.
- Auto-play once per lesson visit: `LessonSteps` keeps a ref; returning to
  step 1 within the session renders the scene static with Replay offered.
- `prefers-reduced-motion: reduce`: no auto-play, Replay resolves
  instantly; CSS transitions disabled.
- Accessibility: beats are hidden with opacity (visual only), so screen
  readers get the full scene immediately; Skip/Replay are labeled buttons.

### Back button removal

Bottom nav loses the `← Back` button; row becomes `justify-end` with only
Continue / Next Lesson / Back to Mission Map. Backward navigation remains
via the segmented step bar (click any visited segment) and the swipe-right
gesture on mobile.

## Files

| File | Change |
|---|---|
| `packages/ui/src/mdx/dialogue.tsx` | screenplay layout |
| `apps/web/.../lesson-steps.tsx` | playback engine in StepBriefing, Skip/Replay, Back button removed, autoPlay ref in LessonSteps |
| `apps/web/app/globals.css` | beat transitions, playing-state hiding, reduced-motion |
| tests | dialogue layout, playback states, back-button absence |

## Testing

jsdom + fake timers: playing→done transition, Skip, Replay, auto-play-once
(via parent ref), Back button absent. CSS visibility is contract-tested via
attributes (jsdom applies no styles); real rendering verified in Chrome.
