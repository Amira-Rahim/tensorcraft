# Deep Orbit - Story Style Bible

Canonical craft rules for all lesson narrative. Written 2026-06-10 after the
fresh-eyes editorial audit. Every content pass - human or agent - follows
this document. Where an existing lesson conflicts with it, the lesson is
wrong.

## Story comes first (binding, 2026-10-15)

The story leads the learning experience. Show the crew's situation, relevant
dialogue, and scene artwork in the main flow before the related technical work.
Keep each section's story visible when that section is reached. Never move it
behind optional controls or remove it to shorten a page. A section heading may
precede the scene so readers know where they are.

Make every lesson as visual, interactive, and dynamic as possible. Let learners
explore examples, make predictions and choices, run code, and see explanatory
feedback. Connect those actions to the story while preserving the canon and
accurate results. Keep earned epilogues and recall-answer reveals in their
intended stages.

These requirements also bind layout and component changes. See
[the project-wide rules](../CLAUDE.md#story-and-interaction-binding-2026-10-15).

## Teaching through the story (binding, 2026-10-16)

Each lesson gives the crew one understandable task. The concept activity,
exercise, recall, and ending should advance that same task. Keep the wording
simple and casual while preserving technical requirements and character voices.
Let learners see and explore what their actions change before explaining a
result as a story discovery.

State how the crew knows the meaning and order of readings, such as a recording
header or sensor documentation. A tensor's shape cannot identify sensors, units,
or timestamps. Clearly label made-up practice data and distinguish it from the
ship's real captures. Do not resolve mysteries early or invent a discovery to
reward the learner.

## The season in one line

A crew that runs on rules learns to run on learning - and the signal they
decode answers back.

## Canon facts (do not contradict)

- The ship is the **Archimedes**. The signal source is **Sector 7-G**.
- The stream is **64 channels** (established foundations/02). Eleven days of
  archived telemetry ≈ **28,800 readings** (foundations/04).
- **Sample 7741** - archived reading, logged 8 days before module 1 (ID 7741 of 28,800 ≈ day 3 of the 11-day archive). First
  flagged in foundations/05. It is THE anomaly's first onscreen appearance.
  Later canonized as training-loop's "51.8% anomalous - ambiguous" sample.
- The anomalous component is at **73.4 Hz** (signal-processing/02).
- The hull sensor array samples at **256 Hz** (Nyquist ceiling 128 Hz, so
  73.4 Hz is comfortably detectable). Teaching demos may use 128 Hz, but any
  DEEP SCAN spectrum reads out to 128 Hz. Established signal-processing/02.
- **The pulse interval is accelerating.** Canonical sequence: every 73.4
  seconds when first measured (signal-processing), macro-cycle 47 minutes
  (recurrent-networks), down to every 30 seconds by the capstone. The
  numbers were once a continuity bug; they are now the escalation engine.
  Advanced-time-series module = the crew NOTICING the acceleration.
- Fibonacci ratios in the pulse intervals mirror the ship's own sensor
  calibration harmonics (anomaly-detection/05). Correlation 0.9987.
- DEEP SCAN is the learner-built system. ARIA is the ship's legacy
  rule-based AI.
- **Deploy night is canonical** (2026-08-10): at 0157 DEEP SCAN went out as
  a hot canary on a single bridge console over one live pulse, thirty
  verdicts matched the shadow model, fleet-wide followed two minutes later.
  The BossBeat's three untaken calls exist in-fiction as ARIA's simulated
  transcripts, filed unrequested under `deploy/counterfactuals`.
- **The operator of record** is the learner's in-fiction identity (the
  BossBeats address them as "operator"). ARIA's 0213 deploy-record entry
  (`operator_of_record: uncredentialed … disposition: noted with approval`)
  is the only time the cast addresses them directly; do not add more. The
  final `operator_note: none` row is that entry's unanswered reply and
  must stay the last beat of the season.
- The 73.4 Hz / 73.4 s coincidence is canonically a constant of the shared
  instrument chain, named by ARIA in the finale ("I note both correlations.
  I resolve neither.") and deliberately left unresolved. Do not explain it
  further anywhere.
- The bridge dashboard is the deploy target because it sits on the hardened
  bus inside the 24/7 watch rotation (Nazari, capstone/01); the engineering
  rig is faster but reboots with firmware flashes and has no standing watch.

## Saved decisions (2026-09-18)

Six optional decisions affect later handoffs and crew work. Their option indices
and existing IDs are stable. Later scenes read the saved choice; skipped choices
receive a neutral continuation, and a failed lookup must not invent a choice.
The added cache and drift decisions are internal pilots, not learner-tested.
See the branch table in [the internal review](audits/internal-content-review-2026-09-18.md).

Removing 7741 from a working list never destroys its raw archived capture. The
training-set decision changes review and replay work, not its unknown true label.
Report drafts remain subject to the release gate. Deployment is explicitly a
rehearsal choice that changes the follow-up checklist; the 0157 canary is fixed.
Do not change model scores or scientific truth to reward an option. Keep the
last operator-note row after all conditional scenes.

## Character registers (hard rules)

**Commander Mirza** - never explains anything. Questions and decisions only.
Two sentences maximum per line. No metaphors, ever. If Mirza speaks more
than twice in a lesson, cut one.

**Chief Nazari** - speaks in counts, hours, and costs. Constitutionally
allergic to analogies: she counters them with numbers ("Don't tell me it's
like a cache. Tell me the false-positive rate."). Has a standing grievance:
wasted investigation time. Warms over the season by exactly one degree.

**Dr. Farah** - owns the metaphors, capped at ONE per lesson. Corrects
Demir's analogies with precision, not validation. Her tic: she cares about
*trust* in methods, not just correctness. Never says "Exactly!"

**Ensign Demir** - the learner's mirror, a JavaScript engineer gunning for
mission-specialist certification and quietly afraid his analogies are a
crutch. His JS analogy may be blessed at most 1 time in 3. At least once
per module it must be WRONG in a way that costs something on-page, and the
cost is shown, not narrated.

**ARIA** - the rule-based AI being obsoleted by the thing the learner is
building. Literal probabilities, no contractions, dry as vacuum. Her arc IS
the course's thesis (rules → learning): she goes from "my rules failed" to
quietly studying what replaced her, one line per module. She is allowed
something adjacent to feelings in the capstone only.

**DISPATCH intercepts** (Yara, Hassan, Lin, Jin, Dr. Amara, Kira) - flavor
texture from other worlds. Keep; do not expand.

## Writing quality rubric (binding, 2026-08-12)

Every sentence of prose in this repo also answers to
`docs/writing-quality-rubric.md` (the owner's four-category AI-slop
screener: formulaic/slogan language, vague substance, wordy/indirect
language, unnecessary framing). It covers surfaces this bible does not:
exercise instructions, module.yaml descriptions, glossary definitions, UI
copy, emails, blog, marketing. The high-precision tier is CI-enforced by
`packages/content/__tests__/slop-lexicon.test.ts`. Where this bible grants
dialogue its register, the rubric defers to the bible; everywhere else the
rubric wins.

## Anti-template rules

1. **Openers.** "You've [done X] your entire career" may appear at most
   ONCE per module. Other lessons open differently: mid-failure, a number
   that doesn't make sense, a question, an order, an instrument reading.
2. **The validation loop is dead.** Demir-guesses-Farah-blesses is allowed
   at most once per module, and the bless must contain a real correction.
   "Almost." / "Close, with one caveat." are themselves now templated -
   vary or cut.
3. **Counts are not sacred.** 4 objectives / 4 takeaways / 3 hints is the
   *default*, not the law. 3–5 objectives and takeaways are all legal.
   A lesson that needs 2 hints ships 2 hints.
4. **One lesson per module breaks the skeleton** - opens mid-crisis, runs
   quiz-first, plays as a dialogue argument, or ends unresolved (the next
   lesson opens inside the unresolved problem).
5. **Fragment triads** ("Flat, typed, contiguous.") - maximum one per
   lesson. They were a tell the moment they became a rhythm.
6. **Em-dashes are banned** (owner directive, 2026-06-10). The entire app
   (lesson prose, frontmatter, UI copy, code-comment text) carries zero
   em dashes. Use a comma, colon, semicolon, period, or parentheses
   instead. Same for decorative `//` prefixes on UI labels: dead. Real
   code comments keep their `//` marker; only the text gets repunctuated.
   The repo-wide rule in `CLAUDE.md` permits no literal-character exceptions.
   Code that detects or decodes the character must spell it as `\u2014`
   or an entity string; it must not contain the literal character.
7. **No tidy bows.** A lesson body may NOT end on a summary sentence that
   re-states the takeaways. Takeaways component does that job.

## Epilogue rules (the page-turn engine)

Every lesson carries an `<Epilogue>` block at the end of the MDX body -
AFTER the exercise and takeaways. It renders only on the Consequence step:
the reader earns the scene by doing the work.

- 2–6 sentences of scene + optionally one Dialogue beat. Concrete: an
  instrument reading, a timestamp, a character doing something.
- It advances either the mystery (preferred) or a character. "Module
  complete, foundations in place" is banned phrasing.
- Per module, at least TWO epilogues must end on an open question or an
  unresolved image. Dead-stop endings ("the pipeline works") are allowed
  only twice per module.
- The frontmatter `consequence.narrative` stays as a one-line logline (it
  renders above the scene). `nextLessonTeaser` ("Next: [gerund]") is
  REMOVED from the schema (2026-07-12) - do not add it back; the epilogue
  is the teaser.

## Scene + format frontmatter (authoring, added with P2 2026-07-12)

- Every built lesson carries a `scene:` block: `location` (required;
  canon geography only: Bridge, Engineering, Lab, Galley, and named
  stations of those), optional `time`, optional `epilogueLocation` when
  the epilogue moves. Renders as the INT. slugline row above the picture and
  the dialogue. No em dashes in location strings (SceneHeading joins with
  " - "). Do NOT give every lesson a `time`; uniform time-stamps are their
  own fingerprint.
- `pattern:` tags a lesson whose BODY genuinely breaks the 5C skeleton
  (`broken_code_first`, `discovery`, `flashback`, `peer_review`). The tag
  must describe structure that is actually there; it renders as the
  Briefing FORMAT tag. One skeleton-breaker per module minimum, enforced
  by `packages/content/__tests__/structure-variety.test.ts`. Any error
  text or measured value used in a cold open must be captured from the
  real runtime, never composed from memory.
- RecallPrompt count is 1–3 per lesson (dense lessons may carry a second);
  takeaway bullet counts should follow the lesson's real density, not a
  house number.

## Lesson close (authoring)

Each built lesson ends its body with two blocks, in this order, both rendered
on the Takeaways step (the story belongs to the Epilogue, never here):

1. `<RecallPrompt>` first. One active-recall question and answer on the core
   idea of the lesson. Phrase the question so a learner must retrieve the
   concept, not recognize it; keep the answer to a few sentences.
2. `<LessonRecap>` second.
   - `whatYouLearned`: the transferable points, story-stripped. No character
     names, no scene references, no "Aria discovered" framing.
   - `bridge`: one JS to ML sentence (the same kind of bridge the lesson
     teaches), e.g. "X in React is Y in TensorFlow" or "X in Node is Y in
     TensorFlow".
   - `youCanNow`: a single capability line describing what the learner can do.

Do NOT use a `## Knowledge check` heading or any `<Quiz>` / `<KeyTakeaways>`
block in built lessons; those are deprecated. The recap is summary, not
narrative - keep all story in the Epilogue.

## Stakes rules

- Nothing succeeds on the first try more than twice per module.
- One irreversible event per season minimum. Canon: the 340 MB model
  crashes the bridge dashboard during a predicted pulse window
  (optimization-edge) - the capture is missed, Earth's transmission slot
  closes without it. It is never recovered. Module 10's optimization sprint
  is penance.
- A deadline that can't be missed isn't a deadline. If the text asserts a
  time limit, something must happen when it's tight.

## Voice litmus tests

Before shipping a scene, check:
1. Could you swap any two characters' lines without anyone noticing? If
   yes, rewrite.
2. Does anyone want something in this scene that another character isn't
   giving them? If no one does, it's a lecture with name-tags.
3. Would a reader screenshot any line? One per module should be worth it.

## Term and code styling

Two reader affordances are automatic. Do not hand-author markup for either.

- **Inline code is an automatic chip.** Just use backticks in the MDX
  (`` `tf.tensor` ``). The build renders any inline code inside lesson prose as
  a bordered chip via CSS. No span, class, or component needed. Use backticks
  for API names, identifiers, and literal values, not for emphasis.
- **Concept terms auto-underline from the glossary.** To make a term an
  interactive concept term, add one entry to
  `packages/content/src/glossary.ts` (term, plain-language definition, optional
  aliases, scope). Define it once. The build underlines the FIRST occurrence of
  that term in each lesson's prose and lists it under "Terms in this lesson"
  on the Takeaways step. There is no per-lesson markup to add or maintain.
  Two consequences to write around: the match is lexical, so a lesson whose
  first "recall" or "attention" is the everyday word gets the ML chip on it
  (reword that sentence), and text inside Dialogue, BossBeat, drawers and
  other components is never underlined, so a term that appears only there
  stays off the terms list (the build derives the list from the rendered
  underlines, gate `glossary-rail-contract.test.ts`).

Definitions follow the same prose rules as everything else: one or two plain
sentences, no em dashes (rule 6).
