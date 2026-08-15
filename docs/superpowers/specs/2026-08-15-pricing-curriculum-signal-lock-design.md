# Pricing Curriculum Signal-Lock Cinematic

Design spec, approved 2026-08-15. Turns the "What's in a World" section on
/pricing from a plain list into a canvas-backed scene: a one-time boot
cinematic that settles into a living Deep Orbit backdrop behind the module
list.

## Goal and constraints

The section is a conversion surface. Locked users land on
`/pricing?locked=<slug>` to see what a purchase unlocks, so the module
facts (titles, descriptions, lesson counts, minutes, the FREE badge) must
stay legible and must reach search engines unchanged. The cinematic adds
world-feel on top of that constraint, never at its expense.

Decisions made during brainstorming, in order:

1. **Role of the canvas**: cinematic transition into the section, not a
   plain backdrop and not a canvas-laid-out module map.
2. **Driver**: plays on entry on the scene clock, fixed duration (about
   3 seconds). Not scroll-scrubbed.
3. **Replay policy**: plays once ever per browser (localStorage flag).
   Later views render the settled state immediately.
4. **Direction**: "Signal lock", a terminal boot. Static resolves, a scan
   sweep passes, orbit rings draw themselves in, module rows flicker on
   like telemetry. Chosen over camera-flight alternatives because the site
   chrome already speaks this terminal language.
5. **Settled state**: a living backdrop. A faint, slow `drawOrbit` keeps
   idling behind the list, matching the world detail page's backdrop
   pattern.
6. **Implementation approach**: one-shot timeline inside a `SceneDraw`
   (approach 1 of 3). The boot is the early region of the scene's time
   axis, so the existing SceneCanvas chrome supplies the canvas-side
   entry triggering, clock, visibility gating, DPR cap, and
   reduced-motion behavior. The only new plumbing is DOM-side: the
   wrapper's own IntersectionObserver described under Components.

## Components

### `drawSignalLock` (new)

`packages/ui/src/effects/signal-lock.ts`, exported from the effects
barrel. A `SceneDraw` implementing the boot timeline below, delegating to
`drawOrbit` after the boot completes. Not added to `world-scenes.ts`,
which is scoped to the four unlaunched worlds.

SceneCanvas advances its clock only while the canvas is visible
(IntersectionObserver gate), so mounting this scene below the fold gives
plays-on-entry behavior for free: `t` stays 0 until the section scrolls
into view.

### `CurriculumScene` (new)

`apps/web/app/pricing/curriculum-scene.tsx`, a client component modeled
on `WorldSceneBackdrop`: subpath import from `@tensorcraft/ui/effects`,
`aria-hidden`, `pointer-events-none`, absolutely positioned container
capped to the section with a bottom fade mask, canvas colored from the
Deep Orbit palette (dark hue required, light hue optional with fallback
to the dark hue, the same contract as WorldSceneBackdrop's
`primaryLight?`). It resolves one of two modes at mount:

- **Boot mode**, when the localStorage flag is absent and the user allows
  motion: renders `SceneCanvas` with `drawSignalLock`, at the same 0.45
  intensity floor as settled mode so the post-boot delegation renders
  identically in both modes. The wrapper runs its own
  IntersectionObserver on the section, with the same `rootMargin`
  SceneCanvas uses (120px) so both observers fire on the same scroll
  position; the first intersection is the boot-start moment. At that moment, and not at mount, the wrapper
  sets the `data-boot` attribute that arms the CSS row reveal and writes
  the localStorage flag. Mount-time arming would start the CSS clock
  while the section is still below the fold (only the canvas clock is
  visibility-gated by SceneCanvas), letting the rows finish flickering
  off-screen and burning the once-ever boot unseen.
The wrapper also exposes the resolved mode as a `data-mode` attribute
("boot" | "settled"): the draw-function choice is otherwise unobservable
to automation, and the wrapper tests pin mode resolution through it.

- **Settled mode**, otherwise: renders `SceneCanvas` with `drawOrbit` at
  an intensity floor of 0.45 (lower than WorldSceneBackdrop's 0.7: this
  scene sits directly behind dense text; value tunable during visual
  review). No `data-boot` attribute, rows visible from the first frame.
  Reduced-motion users get the standard SceneCanvas static frame of this
  settled pose, never a frozen half-boot. A user who toggles reduced
  motion mid-boot freezes at the current boot frame; accepted slack, do
  not build plumbing for it.

### `CurriculumPreview` (existing, modified)

Stays a server component and keeps its DOM structure and copy unchanged.
`CurriculumScene` receives the existing section content as `children`:
the server-rendered rows, testids and all, pass through untouched, so
the assertions in the existing pricing tests keep holding. The wrapper
adds `relative` positioning and stacks the rows above the canvas layer,
per the WorldSceneBackdrop `z-0` pattern. No copy changes, so no
writing-rubric surface.

## Scene timeline

All positions are pure functions of `t`, per the SceneDraw contract.
`hot` and `scheme` affect styling only.

| t (s) | Phase |
| --- | --- |
| 0.0 to 0.7 | Static noise resolves. Deterministic `hash()` specks keyed off `floor(t * 60)`, the world-scenes convention. |
| 0.15 to 1.5 | Scan sweep passes down the section. |
| 0.9 to 2.2 | Orbit rings draw in as arc-progress strokes; the core lights up. |
| 2.2 to 3.0 | Crossfade. Boot layer alpha ramps out while true `drawOrbit` output ramps in, so the handoff cannot pop geometry. |
| 3.0 and on | `drawOrbit` at the settled intensity floor, forever. |

Light scheme follows the ink conventions recorded in `world-scenes.ts`:
specks become ink marks, and the sweep uses a paper-lifted wash tint
drawn source-over. Large soft fields never multiply the raw hue (the
grey-storm-cloud lesson in `orbit-canvas.tsx`).

## Module row reveal

Rows are server-rendered in every mode. Search engines, the JSON-LD
workload parity, and screen readers see the full list regardless of
animation state.

The flicker-in is CSS keyframes, opacity only, with per-row staggered
delays spanning roughly 1.6 to 2.6 seconds, active only under
`[data-boot]`. Only the client wrapper sets that attribute, and only at
first intersection, so a browser without JavaScript never hides the rows
and a below-the-fold load never plays the reveal off-screen.
Opacity-hidden rows stay readable to screen readers during the boot. The
keyframes live next to the app's existing animation utilities in
`globals.css` (where every keyframe in the app lives); scoping comes
from the `[data-boot] .tc-curriculum-row` selector, not the file.

Two observers, one moment: the wrapper's IntersectionObserver arms
`data-boot` and SceneCanvas's own observer releases the canvas clock,
both on the same first intersection, so the two clocks start within a
frame or two of each other. Row-level sync is therefore approximate. The
telemetry-flicker aesthetic absorbs that slack; nothing requires frame
accuracy.

## First-visit gating and failure handling

- localStorage key `tc_curriculum_boot_seen`, written at boot start,
  which is the wrapper's first-intersection moment, not component mount
  and not boot completion. A user who never scrolls to the section keeps
  their boot; a locked user who bounces mid-boot has seen it and never
  waits again.
- Any storage read failure counts as seen. When in doubt the section
  shows the list instantly, because it exists to convert.
- Canvas failure changes nothing for the rows; they never depend on the
  canvas in any mode.

## Testing

- `signal-lock.test.ts` on the shared recording-canvas utility, mirroring
  the world-scenes suite: hover continuity (`hot` is style-only), dark
  and light geometry equivalence, static-frame determinism. Plus one
  boot-specific assertion: recorded geometry at `t` past the boot equals
  plain `drawOrbit` at the same `t`, locking the settled-delegation
  guarantee.
- Wrapper tests in `apps/web/app/pricing/__tests__`: first intersection
  sets `data-boot` and writes the flag; before intersection neither
  happens (mock IntersectionObserver, the pattern the effects tests
  already use); a later render mounts settled; reduced motion mounts
  settled; rows are present in server HTML in all modes.
- Existing curriculum-preview tests keep passing untouched; the DOM they
  assert on is preserved.

Historical sequencing note (resolved): at spec time the working tree
carried uncommitted edits to `orbit-canvas.test.ts`,
`world-scenes.test.ts`, and `test-utils/recording-canvas.ts`; those were
committed before implementation, which then landed on top. During
implementation the recorder's `ellipse` capture was widened to all seven
args (authorized amendment) so the contract tests cover the arc-progress
ring channel.

## Out of scope

- No sound, no copy changes, no changes to tier cards or checkout.
- No scroll-scrubbed variant.
- Other worlds' pricing sections (only Deep Orbit is launched; the
  section maps over `LAUNCHED_WORLDS` and the scene resolves per world
  slug the same way `WorldSceneBackdrop` does, so a second world becomes
  a palette-plus-scene decision at its own launch, not a rework).
