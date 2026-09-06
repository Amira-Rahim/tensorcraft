# Lesson Content + Format Audit (2026-09-04)

Owner questions: is the current lesson content + format the best combo
for Tensorcraft's users; does it make lessons easy to follow and actually
learn from, for people who barely read anymore; are we using the best
measures to understand our users; and can the owner be sure enough of all
three to start generating the 42 lesson video clips
(`docs/video-scene-prompts-deep-orbit.md`, Generation plan)?

Method: a 9-agent workflow. Six independent investigators read the
actual code and content (lesson page anatomy as built; measured reading
burden across all 56 Deep Orbit MDX files; full analytics-event
inventory verified at every call site; learning-science evaluation
against three complete lessons; audience and 100K-goal fit from the
planning docs; a dedicated skeptic). Three judges with different
loyalties (the tired learner, the business, the scientist) then ruled
independently. All three returned the same video verdict.

## Answer 1: is this the best combo?

**The design: yes. The build: not yet, and the gap is one known
renderer defect, not the content.**

No competitor occupies this intersection: JS-to-ML bridge pedagogy plus
honestly graded real-TFJS exercises in the browser plus a story the
2026-07-25 adversarial audit found load-bearing (19 of 22 sampled
lessons collapse without it; content graded A-range; that audit also
concluded further content re-audits have negative expected value).
Duolingo has no real code, Brilliant no graded ML training,
Codecademy/freeCodeCamp are Python-first, video platforms grade
nothing. The content is not the open question.

The build undermines its own design in one place: the six steps are not
six segments. The same 700-1,100 words of teaching prose render on four
consecutive steps (Briefing after the scene, Concept, Code, Challenge
left column; verified in `lesson-steps.tsx` visibility sets), the
Concept step narrates code it hides (dangling "the table above"
references), the hint ladder sits below roughly 1,000 already-read
words, browser Back exits the lesson, and no skim or jump-to-exercise
path exists. The prose partition is already promised in a code comment
(`lesson-content.tsx` 85-94) "until real completion data exists," which
is a verified circular deadlock: the telemetry that would produce that
data does not exist. What beats the current product is the partitioned
version of itself, not a different format.

## Answer 2: followable and does it teach, for people who do not read?

**Structurally yes; behaviorally unproven and currently unprovable.
And the premise is half wrong for this buyer.**

The paying customer is a working JS engineer who reads for a living;
the repo's own market evidence (marketing plan: a plain-text ML-math
article pulling 743K views and tens of thousands of bookmarks from this
exact ICP) cuts against "people do not read anymore" as applied to
buyers, though bookmarks are clicks, not proven reading. The
non-reading worry genuinely applies to top-of-funnel scrollers, whom
the free-module-then-$50 gate filters before revenue. The format worry
and the distribution worry are being conflated.

The learning machinery is sound: worked example before an isomorphic
graded problem, immediate named-test feedback, three-level hint ladder,
honest per-lesson time estimates, one remembered skip control, an
earned epilogue. Real weaknesses, all fixable: a median 828 words
(about 6.5 minutes) of mandatory reading before the first keystroke and
61% of a lesson's words before its first exercise; the mastery gate is
soft (Show Solution then Run Tests opens it; recorded as
solutionViewed but not gated, so raw completion overstates learning);
retrieval practice is optional self-rating rendered next to the recap
that restates the answers; no spaced repetition anywhere in 56 lessons.

Decisive for the video question: story is the SMALLEST mandatory
reading bucket, a median 255 words (about 1.3 minutes) per lesson and
fully skippable. The real reading weight is concept prose plus
commented code, which story-scene clips do not offload.

## Answer 3: are we measuring our users well enough?

**No. This is the firmest verdict of the three, every gap verified at
its call site.**

What works: a typed, compile-checked event registry, careful dedup,
per-run exercise attempts persisting code, score, and solutionViewed, a
solid completion and signup-to-payment funnel.

What is missing, exactly:

1. No per-step event exists (`lesson_step_viewed` is absent; onboarding
   has one, lessons do not), so everything between `lesson_started` and
   the Challenge step is invisible: whether anyone reads any step, and
   where readers quit, are unanswerable.
2. `durationMs` is reserved in two schemas and populated by zero
   callers (`trackLessonCompleted` called with 3 args; the
   exercise-attempts POST omits it). Time-on-step and time-in-lesson
   are fully blind.
3. The narrative skip rate, the exact metric
   `docs/future-ai-video-scenes.md` sets a >40% kill rule on, has been
   structurally broken since the 2026-08-23 skip-preference change:
   `script_skipped` fires only on the first-ever manual skip; the
   auto-skip path emits nothing afterward; Continue-during-playback is
   never counted; no `script_finished` denominator exists.
4. Exercise runs that crash or time out record nothing anywhere, so the
   most-stuck learners are the least measured.
5. `world_progress.hints_used` and `.attempts` are permanently zero
   (their only writer has no call sites); `hint_requested` omits the
   exercise slug; recall reveal actions never fire; `streak_achieved`
   hardcodes streakDays 1; three defined events are dead.
6. All client events are consent-gated at an unmeasured opt-in rate,
   and free-tier guests write nothing to the database: coverage is an
   unknown fraction of exactly the activation audience.

And even perfect instruments currently have no subjects: the 2026-09-02
log review found 2-3 real humans in a 3-hour window, below the repo's
own 200-user world-2 data gate. Distribution remains the binding
constraint on 100K, as the 2026-07-25 audit already concluded (roadmap:
current-model ceiling 5-10k paying; about 5M qualified visits needed;
"no mechanism in this repository produces 5,000").

## Video generation verdict: hold until instrumented (3 judges, unanimous)

Generating now fails the project's own written decision rule: the video
doc conditions the spend on skip rates, completion, and time-on-step,
and two of those three are broken or unbuilt while the third has no
subjects. 36 of 42 clips sit behind the $50 paywall; the target surface
auto-suppresses forever after one skip, with no event counting that
cohort; and the clips offload the smallest reading bucket. A generation
run today produces spend whose effect can never be attributed, which is
the opposite of the certainty the owner asked for.

This is a short hold, not a cancellation. The clips as specced (silent,
alongside text, story layer only) are learning-neutral to mildly
positive, the best ones animate actual lesson mechanisms, and the
module 1 + E1 slice is a legitimate paywall-conversion pilot.

**Sequenced plan:**

1. **Ship in-lesson instrumentation first.** SHIPPED 2026-09-04, same
   day: `lesson_step_viewed` (with dwell and revisit), `script_finished`
   denominator, `script_skipped.via` (button / continue / auto, closing
   both silent-skip holes), `durationMs` at both reserved places,
   crashed/timed-out runs recorded (`errored`), hintsUsed + durationMs
   into the attempts POST, `world_progress.hints_used/attempts` now
   written, `streak_achieved` reads the real streak,
   `recall_answered("revealed")` fires, `consent_granted` numerator
   (decline-side counter left as an owner privacy call). Metric recipes:
   `docs/analytics-verification.md`, "In-lesson instrumentation".
2. **Ship the deferred prose partition and the skimmer path.** SHIPPED
   2026-09-04, same day. Each step now owns a disjoint slice: Briefing =
   story zone only (`hideTeaching`), Concept = the one full read with
   code and tables INLINE (dangling references dead on every viewport),
   Code = the worked example isolated (no prose re-read), Challenge =
   challenge zone + hints (the ladder no longer sits under ~1,000
   re-served words). Steps are URL-addressable (`#step-N`): browser Back
   steps back instead of exiting, deep links into covered ground work,
   never-reached ground clamps (the exercise gate is not bypassable by
   URL). First visits get a "Skip to the challenge" fast path that
   vanishes once the step bar can reach it. Analytics note: dwell
   numbers are only meaningful from this deploy on; the Concept step is
   now where reading happens.
3. **Record a pre-clip baseline** the moment instruments are live.
   TOOLING READY 2026-09-04, capture pending deploy + traffic:
   `scripts/analytics/module1-baseline.mjs` pulls every PostHog number
   and `docs/audits/module1-baseline-template.md` carries the capture
   protocol, the Supabase earned-pass SQL, the gate values to fill, and
   the 200-consented-starts threshold.
4. **Then generate the face-lock pilots plus module 1 + E1** (about
   10-11 clips, the entire surface a non-payer ever sees), require
   clips to honor the skip memory and never delay time-to-first-content,
   and read the conversion delta against the baseline.
5. **Hold the ~31 paid-tier clips** until the written threshold passes
   (suggested: after 200+ consented module-1 lesson starts, combined
   manual + auto + bypass skip under 40% and an agreed
   Briefing-to-Concept survival floor). Put the marginal video budget
   into the reach lever meanwhile: bridge-led marketing clips per the
   marketing plan's own creative thesis, which none of the 42 story
   clips address.
6. **Define the honest-learning queries now:** earned pass = passed
   with solutionViewed false and hint level under 3 (the data is
   already persisted per attempt); this is also the completion evidence
   enterprise buyers will demand later.

## Re-audit (same day, evening): verdicts moved, and it caught real bugs

A second 9-agent adversarial pass re-read the remediated working tree
with instructions to trust nothing. All three judges moved from
hold-until-instrumented to **deploy-baseline-then-module1-slice**, and
the re-audit confirmed the morning defects are cured at the mechanism
level: rendered prose before the first keystroke fell 45% median
(996 to 566 words, better in all 56 lessons; 94% on the skip path), the
narrate-hidden-code defect is dead, and the telemetry claims held at
their call sites.

It also found five real defects in the remediation itself, ALL FIXED the
same evening:

1. **Content regression (critical):** 11 mid-lesson Dialogue beats in 9
   lessons rendered on no step (hidden on the Briefing by hideTeaching,
   absent from every other set). Fixed: Dialogue joined CONCEPT_LEFT and
   a mirrored `hideStoryZone` rule keeps the opening scene from
   double-rendering there; cold-open CodeBlocks joined the Briefing set.
2. **Baseline killer (critical):** the visited-step seed marked step 0
   visited on every brand-new visit, so every first Briefing view fired
   revisit:true and the survival gate divided by zero. Fixed: the exact
   visited set persists per lesson and a fresh visit seeds nothing;
   regression tests added (fresh visit, restored session, jumped-over
   steps).
3. **Dead crash counter (critical):** the exercise runner resolves in
   every failure mode, so the errored catch branch never fired. Fixed:
   the runner's outcome now carries `errored` from its timeout,
   load-failure, and crash paths, and the attempt report reads it.
4. **CSS leaks (major):** top-level tables, raw code fences, and rules
   escaped the prose partition; and the challenge reveal swept post-recap
   DISPATCH story into the Challenge column. Fixed: table/pre/hr joined
   the hide list, the hidden LessonRecap now leaves a boundary marker,
   the challenge reveal stops at it, and the post-recap story renders on
   the Consequence step beside the Epilogue it introduces.
5. **Counter bugs (major/minor):** attempts double-counted on a step 4-5
   oscillation (session counter now zeroes after riding along),
   streak_achieved refired on reloads (now fires only on a genuine
   completion walk), a stale popstate flag could swallow one history
   push (fixed), and the baseline script's exercise query was scoped to
   the world instead of module 1, with boolean comparisons hardened and
   the payment count moved to the authoritative purchases table.

The class of bug behind 1 and 4 (unit tests mock the content, so nothing
content-shaped could fail) now has a standing gate:
`content-partition-contract.test.ts` sweeps all 56 lesson MDX files
against the live visibility sets and fails CI when any top-level
component would render on no step.

Still open, deliberately, as owner decisions or future work (see
backlog): the Code step is thin for the 42 drawer-less lessons (a
5-step-or-enrich question), the mastery gate remains measured-not-
enforced, spaced repetition is absent, teaching bodies are display:none
to crawlers on the free-tier acquisition surface, and the re-audit's
sharpest business finding stands: at 2-3 real humans per 3-hour window,
the 200-start gate is a 2-3 month organic wait, so the drafted,
never-fired launch playbook (Show HN + the PH/X copy idle since
2026-08-11) is the highest-leverage move while the baseline accrues.

## OWNER RULING (2026-09-04, evening): launch ships WITH video

The owner overruled the judges' deploy-baseline-then-slice sequencing:
the distribution launch goes out with clips live. Consequences, recorded
so no later session re-litigates them:

- The clean pre-clip baseline is forfeited by choice. The capture kit
  still runs; its numbers become the LAUNCH-WINDOW read (with clips),
  judged against the absolute gates (combined skip rate under 40%,
  an agreed Briefing-to-Concept survival floor, completion), which
  remain valid without a before-picture.
- Attribution is recoverable through a holdback: the clip player should
  randomize a visitor cohort to the text-reveal Briefing and tag every
  script/step event with the variant. A concurrent 50/50 control during
  launch week is statistically stronger than the before/after the old
  plan offered; the holdback share is an owner dial (0% disables it,
  and then clip causality is unprovable, accepted).
- Newly launch-critical: the in-lesson clip player does not exist yet
  (the integration design in docs/future-ai-video-scenes.md was
  sequenced after the baseline). It must render silent clips in the
  Briefing's story slot, honor the remembered skip preference, never
  delay time-to-first-content, fall back to the text reveal wherever a
  clip is missing (partial generation stays shippable), serve reduced
  motion the still art, and carry the variant tag into telemetry.
- Generation order rebased in docs/video-scene-prompts-deep-orbit.md:
  module 1 + E1 is launch-blocking; modules 2-3 next; spine and the
  rest follow; the 11 deferred entries stay post-launch.

## On "100% sure"

Not purchasable, at any spend, before users behave. What is purchasable
today: high confidence the design is right (adversarially verified,
differentiated, no better format identified), verified knowledge of the
build's frictions, and instruments that convert the first few hundred
real learners into per-step survival curves accurate to within 5-10
percentage points. One judge priced current design confidence at about
70%; the remaining 30% is bought with the instrumentation above plus
traffic, not with another audit and not with video.
