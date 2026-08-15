# Patch award moment

Status: approved design (owner: "go" on the award moment, 2026-08-15)
Date: 2026-08-15

The follow-up both art rounds deferred: the instant the last lesson of a
module completes, the Consequence step reveals the module's mission patch.
Until now patches appear silently on the dashboard and maps at next visit;
the earning moment itself showed nothing.

## Where the state comes from (the blocker, resolved)

No new queries. `LessonSteps` already receives `lessons` — every lesson in
the module with a server-truth `completed` flag — plus `moduleName`, and
its completion effect already distinguishes a genuine in-session walk to
the Consequence step from a restored mount (`enteredThisSession`, R3-7
guard). The award computes at that moment, client-side:

- A lesson counts as done if the server said so OR a guest completion is
  recorded locally (`getGuestCompletions`), so free-module guests get the
  moment too (their patch state replays through GuestProgressBridge after
  signup, same as completions).
- `completesModule` = the current lesson is NOT already done, AND every
  other lesson in the module is done, AND the module resolves patch art
  (`patchSrc(worldSlug, moduleSlug)`), AND `lessons` is present and
  non-empty.
- The award state arms only inside the `enteredThisSession` guard: a
  restored mount onto the final step never re-awards, matching the
  analytics semantics that guard exists for.

Replays and worlds without patch art fall out of the predicate: no
award. Out-of-order completion (reachable only in free modules, where
every lesson is unlocked) awards on whichever lesson closes out the
module — the predicate is "last remaining", not "last by order", and
that is the intended behavior.

## The reveal

`PatchAward`, a small component in the lesson directory, rendered in the
Consequence step directly under the "Mission Complete" badge when the
award state is armed:

- The module's `ModulePatch` at 96px with authored alt text (this is the
  one patch render that IS the content, not decoration): the alt is
  "<module name> mission patch".
- Mono eyebrow `{terms(worldSlug).module} Complete` (deep-orbit says
  "SECTOR COMPLETE" — the world never uses the word "module" on-screen,
  and the badge above it already renders `{terms.lesson} Complete` the
  same way), then the module name, then one plain line: "Mission patch
  earned." (rubric-checked: concrete, no slogan).
- Entrance uses the house `animate-fade-up` utility; reduced motion is
  honored the same way the utility already handles it elsewhere. No
  confetti, no sound: one object arriving is the celebration, matching
  the story register.
- If the patch asset fails, `ModulePatch` renders nothing and the block
  collapses to the text (never a broken image); the badge above already
  says the lesson is complete, so the degraded state stays coherent.

## Testing

- Predicate unit tests (extracted pure): completes / already-complete /
  out-of-order / no-lessons-prop / no-patch-art cases.
- Component test: renders patch + module name; art failure leaves text.
- Lesson-steps test: walking to the final step with all other lessons
  completed shows the award; a restored mount does not; a mid-module
  lesson does not.
- E2e: extend `end-of-lesson.spec.ts` only if it already walks a full
  module; otherwise unit coverage carries it (the guard logic is the same
  `enteredThisSession` path the existing tests pin).
- Battery + typecheck; no visual baselines cover lesson pages.

## Rejected

- A server-computed `completesModule` prop: the client must merge guest
  completions anyway, and the moment of truth is a client-side event; one
  computation in one place beats two half-truths.
- World-complete fanfare here: the capstone page is that moment and
  already carries the seal.
- Awarding on restored mounts ("they did earn it"): re-firing celebration
  on every reload of a finished lesson is how the moment stops meaning
  anything (and it would diverge from the R3-7 analytics semantics).
