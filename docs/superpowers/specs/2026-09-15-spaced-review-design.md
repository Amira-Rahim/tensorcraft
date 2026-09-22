# Spaced Review (retention spine: scheduled recall + commit-before-reveal)

**Date:** 2026-09-15
**Status:** Both stages implemented locally, 2026-09-16. Hosted rollout and
signup/checkout verification remain pending; see `docs/launch-verification.md`.
**Scope:** Sub-project A of a four-part learning-science remediation. Covers
scheduled cross-lesson recall (gap G1) and commit-before-reveal on the recall
prompt (gap G3). Restores, in changed form, the review queue deleted by
migration 033 on 2026-06-01.

## Problem

Nothing in Tensorcraft is spaced, and the one retrieval surface it has can be
skipped without retrieving.

1. **Every retrieval happens minutes after the material was taught.** Migration
   `033_drop_review_and_lore.sql` dropped `review_queue`, the SM-2-lite
   scheduler, and the epsilon-greedy selector. The 80 `<RecallPrompt>`
   instances across deep-orbit's 56 lessons therefore fire once, on the page
   that taught the answer, and never again. That is the schedule with the
   smallest effect on long-term retention.
2. **The self-rating it collects goes nowhere.** `RecallPrompt` still reports
   `"revealed" | "got-it" | "review"`, and the only consumer is a PostHog
   event at `apps/web/lib/analytics.ts:183`. A learner who says "I need to
   review this" is never asked again.
3. **Reveal needs no attempt.** The learner presses "Reveal Answer" and reads.
   Reading a correct answer feels like knowing it, and the retention benefit
   comes from the attempt, including a failed one. The component currently
   measures reading.

## Goals

- Schedule each authored recall prompt independently and resurface it when due.
- Require a retrieval attempt before the answer appears, on every surface.
- Ship without authoring any new content. Deep Orbit's 80 prompts are enough.
- Serve guests as well as signed-in learners, because the free module is a
  guest's entire experience of the product.
- Keep one implementation of the interval math, testable in vitest.

## Non-goals

- **No epsilon-greedy bandit.** See "Departures", item 1.
- **No machine grading.** The 80 authored answers are 2 to 3 sentences of
  prose. Self-rating after a genuine attempt is the signal this design uses.
- **No new content fields and no lesson authoring.** Cumulative checkpoints
  (G2), completion problems (G4), and misconception quizzes (G5) belong to
  sub-project C and are out of scope here.
- **No adaptive routing off the Skill Genome** (G7). It has nothing to route
  to until C exists.
- **No blocking.** Nothing gates lesson progress on a review.
- **No `skill_events` row per review.** See "Departures", item 4.

### Supersedes one prior non-goal

`docs/superpowers/specs/2026-06-15-end-of-lesson-design.md` set the non-goal
"no new assessment that blocks progress or persists a grade; the self-check is
non-blocking and self-rated." Two halves of that survive and one does not.
Non-blocking survives. Self-rated survives. Persistence does not: the rating
now writes a row and drives a schedule. The reason is that the 2026-06-15
design assumed the recall prompt was the end of the lesson, and here it also
becomes the beginning of a later one.

## Design

### A. One scheduler, two stores

The interval math lives in `packages/shared/src/review-schedule.ts` as pure
functions. Postgres and localStorage are storage adapters behind one interface.

```text
packages/shared/src/review-schedule.ts
  nextInterval(item, outcome) -> { nextDueAt, pulls, successes }
  selectDue(items, now, limit) -> ReviewItem[]

packages/shared/src/review-store.ts
  interface ReviewStore {
    getDue(worldId: string, limit: number): Promise<ReviewItem[]>   // server or guest
    record(item: ReviewItem, outcome: ReviewOutcome): Promise<void>
  }

apps/web/lib/review-store-guest.ts    localStorage, mirrors guest-progress.ts
apps/web/lib/review-store-server.ts   reads, in the lesson page server component
apps/web/lib/review-store-api.ts      writes, fetch -> the API route
apps/api/src/routes/review.ts         authed writes, calls the shared functions
```

Reads and writes split by surface for a signed-in learner: the due queue is
read server-side during the page render (section D), and outcomes are written
from the client through the API route. Guests do both against `localStorage`.
`selectDue` and `nextInterval` are the same functions in every case.

The deleted migration put SM-2 in plpgsql, which was right when the only caller
was an authenticated RPC. Guests add a second caller, and a second caller in
another language means the algorithm exists twice and drifts. This repo has
been bitten by that shape before: the PostHog test-mock drift on 2026-08-26 and
the e2e SOLUTION drift that needed its own gate on 2026-09-13.

A client can forge its own schedule under this arrangement. That is acceptable
for the schedule itself: a review grants no patch, no certificate, and no
entitlement, so a learner who reorders their own queue cheats only themselves.

**That tolerance stops at the prompt text.** Forged keys must not become a way
to read content the learner has not bought, and 74 of the 80 prompts are paid.
Section D, "Resolving a key to its text", closes this by never letting a
client-supplied key select content: the server resolves a signed-in learner's
queue against entitlement it has already computed, and a guest can only match
against the free module.

### B. Data model

```sql
-- packages/supabase/migrations/061_review_queue.sql
create table public.review_queue (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  world_id       text not null,
  module_id      text not null,
  lesson_id      text not null,
  prompt_index   integer not null default 0 check (prompt_index >= 0),
  pulls          integer not null default 0 check (pulls >= 0),
  successes      integer not null default 0 check (successes >= 0 and successes <= pulls),
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null,
  created_at     timestamptz not null default now(),
  primary key (user_id, world_id, lesson_id, prompt_index)
);

create index idx_review_queue_due
  on public.review_queue (user_id, world_id, next_review_at);
```

`getDue` is the only hot read, so it gets the index. The recovered migration
used a partial index predicated on `next_review_at <= now()`, which Postgres
rejects because `now()` is not immutable in an index predicate. A plain
three-column index serves the same query.

RLS grants select, insert and update on own rows, all three `auth.uid() =
user_id`. The two write policies are REQUIRED, not optional: apps/api writes
through `getSupabaseServerClient(token)`, which is built on the service-role
key but spreads the caller's JWT, so PostgREST resolves the role from that JWT
and RLS is enforced. A select-only table denies every write silently. Migration
041 exists to repair exactly that on `skill_events`; `exercise_attempts` 004:25
is the working precedent.

The consequence is that every non-key column is a value the learner can choose,
which is why section D reads freeness off the content build rather than off the
row. See "Every key is treated as client-supplied" there.

Restoring from `2def3de3` requires two renames: `theme_id` to `world_id`
(migration 058) and `fe_integration` to `js_integration` (migration 059).
Historical `skill_events` rows with `event_type = 'review_recall'` survived
migration 033 and carry pre-rename axis values, so the restore tolerates them
rather than migrating them.

### C. Departures from the recovered design

1. **The bandit stays deleted.** `review_queue_epsilon()`, the epsilon-greedy
   selector, and `was_explored` do not come back. Selection is most-overdue
   first, ties broken by failure rate. The bandit's real value was
   pedagogical: it ran the algorithm taught in
   `terra-grid/ab-testing/05-multi-armed-bandits.mdx` and rendered the
   learner's own arm state in that lesson. Terra Grid is world 4. Restoring
   the bandit now buys a marginal scheduling gain and ships an algorithm
   nobody can see. It returns when world 4 launches.
2. **Rows are keyed per prompt, not per lesson.** The original primary key was
   `(user_id, theme_id, lesson_id)`. Twenty deep-orbit lessons carry two
   recall prompts and two carry three, so a per-lesson row cannot say which
   question is due. `prompt_index` makes each question its own item: 80 items
   for Deep Orbit rather than 56.
3. **Enqueue keeps `on conflict do nothing`.** Re-completing a lesson must
   never reset `next_review_at`, which would cancel the schedule. The deleted
   migration's comment made this point and it still holds.
4. **A review emits no `skill_events` row.** The recovered
   `record_recall_attempt` inserted `event_type = 'review_recall'` with a
   required `p_skill_axis`, and migration
   `055_normalize_skill_genome.sql:62` still weights `review_recall` at +1
   inside the live `compute_user_skill_genome`, on a 90-day rolling sum. For
   scale, that table prices `exercise_pass` at 3, `lesson_complete` at 2, and
   `solution_view` at -1, so a review is already priced well below a graded
   pass and no weight needs changing.

   Two reasons to stay silent anyway. The weight was set when the emitter was
   bandit-driven and is unreviewed since; resuming emission would raise the
   Genome of every learner who reviews relative to one who does not, on a
   self-rated signal, before anyone has decided that is the intent. And it
   would force a `skill_axis` column or a lesson lookup into the table, which
   is scope this sub-project does not need. Deferred to sub-project D, where
   the Genome is actually read for routing and the weights get set
   deliberately.

### D. Content extraction

The warm-up renders a question from a lesson the learner is not on, so the
question and answer must leave the compiled MDX body. The lesson collection in
`packages/content/velite.config.ts` gains a derived field, using the pattern
`glossaryTerms` already established:

```ts
rawBody: s.raw(),   // declared so the transform can read it; never emitted
// ...
.transform((data) => {
  const { rawBody, ...rest } = data;
  return {
    ...rest,
    glossaryTerms: glossaryTermsInCompiledBody(data.body, GLOSSARY),
    recallPrompts: parseRecallPrompts(rawBody),  // [{ index, question, answer }]
  };
});
```

All 80 prompts pass `answer` as a string prop and none pass JSX children
(verified 2026-09-15), so `parseRecallPrompts` matches the raw source rather
than walking MDX.

**The parser must not use a character class.** Two prompts carry a `>` inside
a quoted attribute value: `|z| > 3` in
`anomaly-detection/01-normal-vs-anomalous.mdx` and `r => r.json()` in
`browser-runtimes/03-model-loading.mdx`. A naive `<RecallPrompt[^>]*/>` loses
both. A non-greedy `/<RecallPrompt\b.*?\/>/s` parses all 80 correctly, verified
against the corpus on 2026-09-15.

**The gate scopes to built worlds.** A new gate,
`recall-prompt-extraction.test.ts`, asserts that the `<RecallPrompt` count in
each raw file equals the length of that lesson's built `recallPrompts`. It
imports `BUILT_WORLD_DIRS` from `packages/content/src/built-worlds.ts`, as the
other content gates do. Scanning all of `packages/content/content` instead
would compare 83 raw tags against 80 built entries, because
`terra-grid/ab-testing/05-multi-armed-bandits.mdx` carries 3 prompts and
Terra Grid is not in the build. The gate would be red on day one.

Without this gate, a parser that silently matches 79 of 80 prompts is
invisible: one lesson simply never schedules a review.

**Resolving a key to its text.** A `ReviewItem` carries keys only
(`worldId`, `moduleId`, `lessonId`, `promptIndex`, `nextDueAt`, `pulls`,
`successes`). It never carries the question or the answer. The warm-up
gets its text from the lesson page's server component, which already holds
everything needed. **There is no route handler**, and the two paths differ only
in who reads the queue.

74 of Deep Orbit's 80 prompts sit behind the paywall: `foundations` carries 6
and is free, and `[lesson]/page.tsx:167` redirects any module with `order > 1`
to `/pricing` unless the learner has purchased. So prompt text is paid content
and must never be served on the strength of a key the client supplied.

**Signed-in learners.** The server component reads `review_queue` inside the
existing `Promise.all` at `page.tsx:159` as a fifth parallel promise, using the
same cookie-bound RLS-scoped client the other reads use, filters the rows by
entitlement, resolves each surviving key against the velite build, and passes
the due items down with their text.

**The filter is `canAccessWorld`, not the page's `purchased` value.** This
distinction is the security boundary, and getting it wrong is subtle.
`purchasedPromise` at `page.tsx:137` is
`user && mod && mod.order > 1 ? hasWorldPurchase(...) : Promise.resolve(true)`.
So `purchased` is a hardcoded `true` on every module-1 lesson and for every
guest, with no entitlement lookup performed at all. It means "not blocked on
this page", not "entitled to this world". The warm-up renders on every lesson
including module-1 ones, and module-1 is exactly what stays open to a learner
after a refund, so filtering on `purchased` would resolve a refunded learner's
paid keys to text on any free lesson.

The filter is therefore `module order === 1 || await canAccessWorld(userId,
worldSlug)` (`apps/web/lib/entitlements.ts`). `getEntitledWorlds` is
`React.cache`-wrapped, so this stays one purchases query, and it keeps the
single throw-on-fault failure mode rather than a per-key deny. Cost to accept:
module-1 lessons currently issue no purchases query and will now issue one, in
parallel inside the same block.

**Guests.** The server cannot see `localStorage`, so it inlines the free
module's prompts as a lookup table and the client matches its own queue keys
against it. Two independent reasons that is safe, in order of strength:

1. **The table holds only the 6 free prompts.** A guest key that named paid
   content would match nothing. This holds whatever the queue contains, and
   does not depend on any redirect staying where it is.
2. **A guest cannot enqueue a paid key anyway.** `page.tsx:131` redirects a
   module with `order > 1` to `/pricing` when there is no `user`, and enqueue
   happens only at the completion call site, so a guest queue can only ever
   hold `foundations` keys.

Note that the guest gate is line 131, not the `!purchased` check at line 167.
For a guest, `purchased` is `true` (see above), so 167 provably never fires
for them. Anything that later reorganizes those redirects must keep 131.

The payload is the 6 foundations prompts, roughly 3KB, against 38.5KB for the
whole world.

Two consequences worth stating, because both were problems in an earlier draft
of this spec that routed through an endpoint:

- **Every key is treated as client-supplied, including a signed-in
  learner's.** An earlier draft of this spec claimed the signed-in path reads
  no client-supplied key. That is wrong, and the correction matters (found
  2026-09-16 while implementing). Migration 061 grants each learner INSERT and
  UPDATE on their own `review_queue` rows, `with check (auth.uid() =
  user_id)` and nothing more, because apps/api writes through a JWT-scoped
  client and would otherwise be denied. Every other column is therefore a
  value the learner chooses. Holding only the public anon key, an unentitled
  learner can insert `module_id: 'foundations'` (free, order 1) naming
  `lesson_id: 'beyond-lstm'` (paid, `advanced-time-series`, order 8) with a
  past due date.

  So freeness is read off the CONTENT BUILD via the lesson, never off the
  row's `module_id`, and any row whose `module_id` disagrees with the build is
  dropped. A module absent from the build counts as not free. The guest path
  needs none of this: its table holds only the 6 free prompts, so a forged key
  matches nothing.

  **Validating keys in the API route would not help, and the reason is worth
  recording so nobody adds it believing it does.** The forging learner holds
  the public anon key and their own JWT, so they insert straight through
  PostgREST and never call our route. Route-side validation constrains only
  attackers who choose the front door. `apps/api` also has no dependency on
  `@tensorcraft/content` and never imports it, so it could not do the check
  without a new dependency and a Docker build change, for zero security gain.

  The real alternative is structural: drop the INSERT and UPDATE policies and
  route every write through `getSupabaseAdminClient()`, so a learner cannot
  write to the table at all. Rejected here, deliberately. The API already
  scopes writes to `c.get("userId")`, so the policies are not what prevents
  cross-user writes; they are the backstop if that scoping ever breaks. Under
  the chosen design a learner can forge only their own queue, which the read
  gate renders harmless (forged paid keys drop, they see less and never more),
  and self-pollution is self-harm. Trading an RLS backstop against cross-user
  writes for protection against self-harm is the wrong trade.
- **Entitlement is not re-checked per key.** `getEntitledWorlds`
  (`apps/web/lib/entitlements.ts`) throws on a lookup fault by deliberate
  design, so that "a transient DB fault must not silently show a paying
  customer the paywall". A per-key `try`/`catch` would convert exactly that
  fault into a silent deny. Reusing the page's single already-awaited
  `purchased` value keeps one check, one failure mode, and the existing error
  boundary.

The rejected alternative: *ship the whole world's prompts to every lesson
page.* Deep Orbit's 80 question and answer pairs are 38.5KB of raw text
(39,380 bytes, measured 2026-09-15). Every learner would download all of them
on every lesson to display at most two, and the Lighthouse script budget is
already ratcheted to a measured baseline rather than an aspirational one
(`.github/lighthouse-budget.json`, 2026-08-24). Inlining only the free
module's 6 prompts for guests costs about 3KB and is the same idea kept to a
size that does not matter.

### E. One card, two hosts

Extract the question-and-answer interaction into `ReviewPromptCard`:

- `RecallPrompt` keeps its current MDX call signature, wraps the card, and
  reports to analytics.
- `LessonWarmup` is new, wraps the card, feeds it due items, and reports to the
  store.

**Card states.** `prompt` shows the question, a textarea, a Check button, and
an "I couldn't recall it" button. `revealed` shows the canonical answer and the
Got it / Needs work rating. Reveal is reachable only through one of those two
commit paths. The typed text is never stored or transmitted. It exists to force
the attempt.

**Check stays disabled until the textarea holds non-whitespace text.** This
single rule is the whole of G3. If Check accepts an empty textarea, reveal is
one click again and the fix is cosmetic. A learner who has nothing to write
presses "I couldn't recall it", which is an honest answer and a useful signal,
rather than an empty Check, which is neither. The component test pins the
empty and whitespace-only cases explicitly.

**Analytics vocabulary changes.** `trackRecallAnswered` currently accepts
`"revealed" | "hidden" | "got-it" | "review"`
(`apps/web/lib/analytics.ts:179`), and the component comment records that
`"revealed"` existed to catch reveal-without-retrieving. Once reveal requires
a commit, `"revealed"` no longer describes anything that can happen, and the
bail-out has no value at all. The union becomes
`"attempted" | "bailed" | "got-it" | "review"`. Before this lands, grep
`vi.mock` across the repo: a new or changed export in a widely-mocked lib
broke every mock factory on 2026-08-26.

Both hosts use the same states. Choosing to require typing in the warm-up means
the in-lesson prompts stop being one-click reveals, across all 56 lessons.
That is the G3 fix and it is intentional.

**Accessibility.** The current component's work carries over unchanged: an
always-mounted live region, focus moved to the answer on reveal, and a region
that announces the event and never the answer text (WCAG 4.1.3 and 2.4.3).
Added: the textarea takes `aria-labelledby` pointing at the question, and the
warm-up takes `aria-label="Warm-up, item 1 of 2"`, matching how
`lesson-steps.tsx` labels the step bar.

### F. Placement

> **Amended 2026-09-22.** Two parts of this section no longer hold and are
> kept below only as the record of the original reasoning.
>
> 1. **The warm-up now renders AFTER the scene**, inside the Briefing root's
>    `data-post-scene` block next to the mid-module catch-up, and playback is
>    no longer deferred. The owner's 2026-09-20 ruling is that a lesson page
>    opens with its story, and the deferral had a cost this section did not
>    predict: the held-back Briefing root stayed in the flow at
>    `visibility: hidden`, so a returning learner saw one card, about 1,600
>    px of empty page, and a Continue button. Focus moves to Continue when
>    the last card unmounts. The `"idle"` state remains as the initial value
>    but now lasts only until the mount effect runs.
> 2. **Source rule is enforced, not assumed.** Section D says the warm-up
>    asks "a question from a lesson the learner is not on"; nothing enforced
>    it, and a learner reopening lesson 1 a day after finishing it was asked
>    lesson 1's own prompt. `resolveDueForUser` now takes the opening lesson's
>    course position and returns only prompts from lessons before it;
>    `FREE_RECALL_PROMPTS` carries `moduleOrder` and `lessonOrder` so the
>    guest warm-up applies the same rule in the browser
>    (`apps/web/lib/course-position.ts`). A row for the current or a later
>    lesson stays queued for a later lesson.


`LessonWarmup` renders at the top of the Briefing step, capped at two items,
and unmounts once both are answered so the Briefing returns to its usual shape.
An empty queue renders nothing, which covers every learner's first lesson and
most of their first day.

**It mounts outside the `aria-busy` root, and it defers playback.** This is
not a cosmetic placement. `StepBriefing`
(`apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx:1545`)
autoplays a beat timeline on mount: `collectBeats()` walks the children of the
beats container and reveals them on a timer, and the Briefing root carries
`aria-busy="true"` for the duration of playback (line 1749). Two failures
follow from mounting the warm-up naively inside it:

- A screen reader would announce the warm-up's own live region as part of a
  busy region, so the reveal announcement could be dropped.
- If the warm-up landed inside the beats container, `collectBeats()` would
  sweep it into the scene timeline and animate it like a line of dialogue.

So the warm-up renders above the Briefing root, outside the `aria-busy`
element and outside the beats container. `collectBeats()` needs no guard once
it is out there: it queries `[data-script-beat]` within `rootRef` and then
walks the pre-heading children of `.lesson-step-content`, and the warm-up is
outside both. The plan should not go looking for something to guard.

**Deferring playback needs a named mechanism, and two obvious ones are
wrong.** Autoplay is gated inside `useEffect(..., [])` at
`lesson-steps.tsx:1719-1740`, a mount-once effect with an
`exhaustive-deps` disable. So flipping a `scriptAutoPlay` prop from false to
true after the warm-up unmounts starts nothing: the effect has already run.

- *Do not mount `StepBriefing` until the warm-up finishes.* Rejected. The
  visible `<h1>` lives inside `StepBriefing` (line 1759), and the `sr-only`
  fallback at line 1217 is gated on `currentStep !== 0`. Step 0 would render
  with no level-one heading at all, undoing the WCAG 1.3.1 and 2.4.6 repair
  those lines exist for.
- *Remount it with a changing `key`.* Rejected. The effect's
  `else if (scriptAutoPlay)` branch fires `SCRIPT_SKIPPED` with `via: "auto"`,
  and a remount runs it twice. That metric was already biased low once and
  repaired by the 2026-09-04 audit. Double-counting it is the same wound in
  the other direction.

**Chosen mechanism.** `StepBriefing` mounts normally, so the heading is never
missing. The body of that mount effect is extracted into a `beginAutoPlay()`
callback, guarded by a `hasBegunRef` so it can run at most once per lesson
view. `SCRIPT_SKIPPED` therefore keeps firing exactly once and the skip rate
stays honest.

For a signed-in learner the decision is available at mount, because section D
resolves due items server-side and they arrive as props on the first render.

**For a guest it is not, and the spec must not pretend otherwise.**
`LessonSteps` is `"use client"` but still server-rendered, so reading
`localStorage` during the first client render is a hydration mismatch. The
file already forbids this in its own precedent: `briefingVariant` stays
`"text"` until mount "so SSR and the first client render agree", and all of
its `localStorage` access sits in effects and callbacks, never in render. So a
guest's queue is known one effect tick after mount, not at mount.

**A third `scriptState` makes both paths one mechanism.** `scriptState`
currently initializes to `scriptAutoPlay ? "playing" : "done"`
(`lesson-steps.tsx:1585`), and deferring `play()` does not defer that. Left
alone, a deferred Briefing sits in `"playing"` underneath the warm-up with
`aria-busy="true"` on it, its instructional content `display:none`, and a live
"Skip intro" button for a scene that has not started. Pressing it would call
`rememberScriptSkipped()` and fire `SCRIPT_SKIPPED` with `via: "button"`, so a
learner could permanently opt out of a scene they never saw, and bias the
metric the 2026-09-04 audit exists to keep honest. It would also recreate the
exact `aria-busy` problem this section opens by citing, one element below the
warm-up.

So `scriptState` gains `"idle"` as its initial value, and only
`beginAutoPlay()` moves it to `"playing"` or `"done"`:

| State | Content | `aria-busy` | Skip intro |
| --- | --- | --- | --- |
| `idle` | hidden | absent | not rendered |
| `playing` | hidden | `"true"` | live |
| `done` | visible | absent | not rendered |

`aria-busy` binds to actual playback and content visibility binds to
`scriptState === "done"`, so nothing flashes and nothing announces busy before
a scene exists.

The release is then uniform. Whoever answers "is a warm-up due" calls
`beginAutoPlay()`: the mount effect when a signed-in learner's props are
empty, the guest queue read when it comes back empty or fails, and the warm-up
itself on unmount when one was due. `hasBegunRef` makes it once. Section H's
silent-read rule must release too, or a failed guest read freezes the scene in
`idle` forever.

**Not through `scriptStatusRef`.** That ref looks like the obvious carrier and
is the wrong one: `play()` at `lesson-steps.tsx:1638` replaces the object
wholesale (`scriptStatusRef.current = { playing: true, startedAt: ... }`),
while `finish()` at 1617 and `markSceneSkippedByNav` at 818 mutate its fields.
A function hung on that ref is destroyed the first time playback starts, and
again on every "Replay scene". It is also a one-directional status payload the
child writes and the parent reads, so adding a child-registered function turns
it into a mixed imperative handle and widens the type at line 1566 that
`markSceneSkippedByNav` reads at 817-825.

Use a separate `beginAutoPlayRef` instead. It carries none of that coupling
and needs no existing type changed. `StepBriefing` must also refuse a
`beginAutoPlay()` that arrives after it has unmounted, or it schedules timers
with no cleanup registered and sets state on an unmounted component.

The effect keeps `return clearTimeline;`. That return must not move into
`beginAutoPlay()`. `clearTimeline` is a `useCallback(..., [])` reading
`timeoutsRef.current`, so its identity is stable and it clears whatever
`play()` scheduled whenever `play()` ran.

Starting the story under a learner who is typing an answer wastes the beat and
splits their attention, which is why the deferral is worth this much care.
`lesson-steps.playback.test.tsx` (a vitest component test) and
`e2e/script-playback.spec.ts` (Playwright) both cover playback start and must
be extended, not merely kept passing. Add a case asserting `SCRIPT_SKIPPED`
fires exactly once when a warm-up is present.

"Above the scene heading" was the earlier wording and it is too vague to
build from: that region also holds the module and lesson eyebrow, the `<h1>`,
the duration line, and the Skip intro and Replay scene controls. The warm-up
sits above all of them.

There is no Skip control. "I couldn't recall it" is the bail-out: one click,
two seconds, and unlike a Skip it carries signal. It reveals the answer, marks
the arm a failure, and schedules the item for tomorrow. A Skip would tell us
nothing and leave the item due forever.

### G. Flows

1. **Enqueue**, at lesson completion: insert one row per `recallPrompts`
   entry, `on conflict do nothing`, first due in one day.

   The enqueue hooks the existing completion call site at
   `lesson-steps.tsx:663-673`, not `markLessonCompleted` itself.
   `markLessonCompleted` returns `null` for guests
   (`apps/web/lib/progress-client.ts:102`), and the guest path is the
   `recordGuestCompletion` fallback in that call site's `.then` and `.catch`.
   Review enqueue mirrors it exactly, so both stores are fed from one place.

   One inherited quirk to preserve deliberately rather than copy blindly: the
   `.catch` branch also calls `recordGuestCompletion`, so a signed-in learner
   whose write fails is recorded as a guest. Replicating that for review would
   write a guest-local review row for a signed-in learner, whose queue then
   holds items the server never sees. Review enqueue therefore branches on
   `result === null` only, and a thrown error goes to the outbox in section H
   instead.
2. **Read**, at two different moments by auth state. A signed-in learner's
   queue is read in the lesson page's server component and arrives as props
   with text already resolved, so it is known at first render. A guest's is
   read from `localStorage` in a mount effect, never during render, and
   matched against the inlined free-module table, so it is known one effect
   tick later. Both use `selectDue(items, now, 2)`, and both release playback
   through the single path in section F.

   The `ReviewStore` interface stays promise-returning for both. The signed-in
   read is simply already settled by the time the client sees it.
3. **Record**, on Got it, Needs work, or bail-out: `nextInterval()` computes
   the new due date and the adapter writes it.

### H. Error handling

Reads and writes get opposite treatment, deliberately.

- **Read failure stays silent.** No queue, no warm-up, the learner proceeds.
  A missing warm-up loses nothing.
- **Write failure is never swallowed.** If a learner answers and the write
  fails, the item stays due forever and the same question returns every
  session. The write result is checked. Failures go to a localStorage outbox
  (`tc_review_outbox_v1`) retried on the next page load, and a failed retry
  reports to Sentry. No bare `catch {}` appears in the write path.

  This rule exists because of the waitlist incident of 2026-08-23, where a
  never-throws writer with no logging hid every failed signup until someone
  went looking.

- **localStorage unavailable** (private browsing, blocked site data) returns an
  empty queue and renders no warm-up, matching how `guest-progress.ts`
  already degrades.

### I. Guest merge

`GuestProgressBridge` gains a review pass beside its completions pass, under
the same `on conflict do nothing` rule. A guest who signs up holds no
server-side review rows for those lessons, so the merge is effectively an
insert, and the conflict rule means re-running the bridge cannot reset a
schedule.

Guests schedule against the client clock and signed-in learners against the
server clock. A learner who changes their device clock can make their own items
due early. This is not defended against, for the reason given in section A.

## Test plan

| Layer | File | Pins |
| --- | --- | --- |
| Unit | `packages/shared/src/review-schedule.test.ts` | Intervals, table-driven: fresh item, first success, repeated success, bail-out, cap |
| Unit | `apps/web/lib/review-store-guest.test.ts` | localStorage round-trip and the throwing-localStorage case |
| Component | `review-prompt-card.test.tsx` | Reveal unreachable without a commit; both commit paths; live region announces the event, not the answer; focus lands on the answer |
| Component | `lesson-warmup.test.tsx` | Cap of two, renders nothing on an empty queue, unmounts when finished |
| Content gate | `packages/content/__tests__/recall-prompt-extraction.test.ts` | Raw `<RecallPrompt` count equals built `recallPrompts` length, per lesson |
| API | `apps/api/src/routes/__tests__/review.test.ts` | Writes: auth required, own rows only, conflict rule holds |
| Server | `apps/web/app/worlds/.../__tests__/review-resolution.test.ts` | **The entitlement filter.** Free keys resolve for anyone; paid keys resolve only for an entitled learner; a refunded learner on a module-1 lesson gets their paid keys dropped. This is the only thing between a stale `review_queue` row and paid prompt text, and an earlier draft of this spec got it wrong by filtering on `purchased` |
| e2e | `e2e/review-warmup.spec.ts` | Full guest loop, no auth needed: complete a lesson, advance the clock, see the warm-up |
| unit + e2e | `lesson-steps.playback.test.tsx`, `e2e/script-playback.spec.ts` | Scene playback starts only after the warm-up unmounts |
| axe | existing dual light and dark matrix | Warm-up passes both schemes, seeded (see below) |

### Known trap: an empty queue makes the warm-up invisible to two gates

Visual baselines and the axe suite both drive a fresh browser whose review
queue is empty. `e2e/accessibility.spec.ts` seeds only `tc_step_*` keys. So
the Briefing step renders exactly as it does today, and both suites pass
without ever seeing the component.

Both need the same seeded fixture: a guest `localStorage` queue with due items,
written before navigation. Without it the plan will contain two tasks that
silently test nothing. Prior form here is bad: mint-run baselines have
self-passed before, and copy-sized diffs have sat at the 0.001 tolerance.

The axe matrix size is derived from the `pages` and `STEP_NAMES` arrays in
that spec file and changes as routes are added, so this document deliberately
quotes no count.

## Staging

The work splits at a natural seam, and the implementation plan should keep it:

1. **Data spine.** Shared scheduler, both store adapters, migration 061,
   the velite derived field, the extraction gate, the server-side read plus
   entitlement filter, the guest free-module table.
   Nothing user-visible ships.
2. **Surfaces.** `ReviewPromptCard` extraction, commit-before-reveal,
   `LessonWarmup`, Briefing placement and playback deferral, guest merge,
   outbox.

Stage 1 is testable end to end with no UI, which is the point of the split.

## Open decision for the owner

`nextInterval()` carries the pedagogy of this feature in about eight lines:
the success multiplier, the floor after a failure, whether a bail-out counts
the same as a wrong rating, and the ceiling that stops an item drifting to a
six-month interval. The deleted migration used 2.5x on success and a flat
one-day reset on failure, which is textbook SM-2 and defensible. The owner
writes this function. Implementation scaffolds the file, the types, and the
test table around it.

This is a plan dependency, not a task that can be worked around. The
`review-schedule.test.ts` row in the test plan cannot be authored without the
owner's numbers, so stage 1 carries it as an explicit checkpoint rather than
discovering it blocked mid-execution.

## Follow-on sub-projects (not this spec)

- **B. Honest prediction (G6).** Forty of 56 lessons print an outcome in a code
  comment before the reader can predict it.
- **C. Practice depth (G2, G4, G5).** Cumulative checkpoints, completion
  problems, misconception-targeted distractors. Schema commitments, cheapest
  before the remaining four worlds are authored. Note that `Quiz` was replaced
  deliberately on 2026-06-15, so reviving it means revisiting a decision, not
  finishing an unfinished job.
- **D. Adaptive routing (G7).** Depends on C.
