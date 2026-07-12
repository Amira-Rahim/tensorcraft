# Deep Orbit — Story Style Bible

Canonical craft rules for all lesson narrative. Written 2026-06-10 after the
fresh-eyes editorial audit. Every content pass — human or agent — follows
this document. Where an existing lesson conflicts with it, the lesson is
wrong.

## The season in one line

A crew that runs on rules learns to run on learning — and the signal they
decode answers back.

## Canon facts (do not contradict)

- The ship is the **Archimedes**. The signal source is **Sector 7-G**.
- The stream is **64 channels** (established foundations/02). Eleven days of
  archived telemetry ≈ **28,800 readings** (foundations/04).
- **Sample 7741** — archived reading, logged 11 days before module 1. First
  flagged in foundations/05. It is THE anomaly's first onscreen appearance.
  Later canonized as training-loop's "51.8% anomalous — ambiguous" sample.
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

## Character registers (hard rules)

**Commander Mirza** — never explains anything. Questions and decisions only.
Two sentences maximum per line. No metaphors, ever. If Mirza speaks more
than twice in a lesson, cut one.

**Chief Nazari** — speaks in counts, hours, and costs. Constitutionally
allergic to analogies: she counters them with numbers ("Don't tell me it's
like a cache. Tell me the false-positive rate."). Has a standing grievance:
wasted investigation time. Warms over the season by exactly one degree.

**Dr. Farah** — owns the metaphors, capped at ONE per lesson. Corrects
Demir's analogies with precision, not validation. Her tic: she cares about
*trust* in methods, not just correctness. Never says "Exactly!"

**Ensign Demir** — the learner's mirror, a frontend dev gunning for
mission-specialist certification and quietly afraid his analogies are a
crutch. His FE analogy may be blessed at most 1 time in 3. At least once
per module it must be WRONG in a way that costs something on-page, and the
cost is shown, not narrated.

**ARIA** — the rule-based AI being obsoleted by the thing the learner is
building. Literal probabilities, no contractions, dry as vacuum. Her arc IS
the course's thesis (rules → learning): she goes from "my rules failed" to
quietly studying what replaced her, one line per module. She is allowed
something adjacent to feelings in the capstone only.

**DISPATCH intercepts** (Yara, Hassan, Lin, Jin, Dr. Amara, Kira) — flavor
texture from other themes. Keep; do not expand.

## Anti-template rules

1. **Openers.** "You've [done X] your entire career" may appear at most
   ONCE per module. Other lessons open differently: mid-failure, a number
   that doesn't make sense, a question, an order, an instrument reading.
2. **The validation loop is dead.** Demir-guesses-Farah-blesses is allowed
   at most once per module, and the bless must contain a real correction.
   "Almost." / "Close, with one caveat." are themselves now templated —
   vary or cut.
3. **Counts are not sacred.** 4 objectives / 4 takeaways / 3 hints is the
   *default*, not the law. 3–5 objectives and takeaways are all legal.
   A lesson that needs 2 hints ships 2 hints.
4. **One lesson per module breaks the skeleton** — opens mid-crisis, runs
   quiz-first, plays as a dialogue argument, or ends unresolved (the next
   lesson opens inside the unresolved problem).
5. **Fragment triads** ("Flat, typed, contiguous.") — maximum one per
   lesson. They were a tell the moment they became a rhythm.
6. **Em-dashes are banned** (owner directive, 2026-06-10). The entire app
   (lesson prose, frontmatter, UI copy, code-comment text) carries zero
   em dashes. Use a comma, colon, semicolon, period, or parentheses
   instead. Same for decorative `//` prefixes on UI labels: dead. Real
   code comments keep their `//` marker; only the text gets repunctuated.
   Two deliberate exceptions survive: the quiz-option sanitizer regex in
   `packages/ui/src/mdx/quiz.tsx` and the `&mdash;`-decoding example in
   signal-ward's text-cleaning lesson (both are behavior, not prose).
7. **No tidy bows.** A lesson body may NOT end on a summary sentence that
   re-states the takeaways. Takeaways component does that job.

## Epilogue rules (the page-turn engine)

Every lesson carries an `<Epilogue>` block at the end of the MDX body —
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
  RETIRED — delete on touch; the epilogue is the teaser.

## Lesson close (authoring)

Each built lesson ends its body with two blocks, in this order, both rendered
on the Takeaways step (the story belongs to the Epilogue, never here):

1. `<RecallPrompt>` first. One active-recall question and answer on the core
   idea of the lesson. Phrase the question so a learner must retrieve the
   concept, not recognize it; keep the answer to a few sentences.
2. `<LessonRecap>` second.
   - `whatYouLearned`: the transferable points, story-stripped. No character
     names, no scene references, no "Aria discovered" framing.
   - `bridge`: one FE to ML sentence (the same kind of bridge the lesson
     teaches), e.g. "X in React is Y in TensorFlow".
   - `youCanNow`: a single capability line describing what the learner can do.

Do NOT use a `## Knowledge check` heading or any `<Quiz>` / `<KeyTakeaways>`
block in built lessons; those are deprecated. The recap is summary, not
narrative — keep all story in the Epilogue.

## Stakes rules

- Nothing succeeds on the first try more than twice per module.
- One irreversible event per season minimum. Canon: the 340 MB model
  crashes the bridge dashboard during a predicted pulse window
  (optimization-edge) — the capture is missed, Earth's transmission slot
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
  that term in each lesson's prose and lists it in the lesson's glossary rail.
  Clicking the underlined term highlights its rail entry. There is no per-lesson
  markup to add or maintain.

Definitions follow the same prose rules as everything else: one or two plain
sentences, no em dashes (rule 6).
