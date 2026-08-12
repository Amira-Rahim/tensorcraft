# AI-Slop Audit and Fix, 2026-08-12 (two rounds)

> **Round 2 (same day, owner-directed redo):** a second full pass over every
> sentence of every document, with surfaces round 1 skipped (all 323 exercise
> `title`/`instructions`, 55 module.yaml descriptions, 103 glossary
> definitions, worlds metadata, packages/ui microcopy, README) and a
> readability emphasis (overloaded sentences split, unexplained jargon
> glossed or replaced, compressed abstraction unpacked, filler adjectives
> cut, character-register stiffness fixed). ~260 additional fixes. Every
> file in scope is accounted for in an agent ledger as FIXED or VERIFIED
> CLEAN. Final tree: 248 files changed, 525 insertions, 498 deletions.
>
> **Rules are now codified**: `docs/writing-quality-rubric.md` (binding, all
> prose), a pointer section in the story style bible, a Writing Rules block
> in CLAUDE.md, and a CI gate `packages/content/__tests__/slop-lexicon.test.ts`
> (banned lexicon + canned framing + vague authorities, code-exempt,
> calibrated to zero false positives; one allowlisted entry: the "Math Deep
> Dive" module title).
>
> **Incident, for the record:** at 13:18 a `git stash` reverted the working
> tree to HEAD mid-round-2, and an account session limit later interrupted
> six agents. All work was recovered: agents restored their scopes from
> stash@{0}, a coordinator sentinel sweep (~120 old-phrase greps) re-applied
> the 10 fixes that fell through, and the six interrupted scopes were re-run
> from scratch on the recovered tree. stash@{0} still exists and is now
> redundant; safe to drop after review.
>
> Round-2 additions to the needs-an-author list: ml-through-text/05 quiz
> options cite BERT/[CLS] in a bag-of-words lesson; signal capstone/03
> Karimi line reads inverted against P=0.89/R=0.84; signal capstone/01 says
> six stages while its code prints "5 stages"; nova gan/04 consequence's
> "200 samples" first appears in gan/05's body; text-classification/03
> breaks calls softmax "the wrong loss" (activation/loss imprecision);
> neon capstone/05 quiz uses "RPS" unexplained.

Full-corpus sweep for AI-slop prose against a four-category
professional-writing rubric (formulaic/slogan language; vague or unsupported
substance; wordy/indirect language; unnecessary framing/repetition), with
do-not-flag protections for real technical contrasts, quoted sources, legal
conditions, and concrete lists. Character dialogue was judged by
`docs/story-style-bible.md` registers, not the professional rubric.

**Scope**: all 305 lesson/blog MDX files (deep-orbit, extras, blog,
neon-protocol, nova-canvas, signal-ward, terra-grid), all user-visible web
app copy (`apps/web/app`, `apps/web/lib`), API email templates, launch copy
(`docs/distribution-launch-copy.md`), `packages/shared` user-visible strings.
Terms/privacy excluded (legal register; text pinned by legal.spec).

**Method**: 17 scoped auditor-fixer agents (one file set each, no overlaps) +
coordinator follow-up pass for surfaces agents were forbidden to touch
(code-block comments, nudge hints, cross-file duplicates, numeral-bearing
lines). Every changed phrase was grepped against test dirs before editing.

## Outcome

~255 fixes across 148 files (261 insertions, 271 deletions). Fix density by
surface confirms provenance: the launched, previously-audited surfaces were
nearly clean; the batch-generated unlaunched worlds carried the bulk.

| Surface | Files audited | Fixes |
| --- | --- | --- |
| Web app UI + emails | ~150 | 6 (5 em-dash regressions on journey surface, 1 stale metadata promise) |
| Blog + launch copy | 8 | 3 |
| deep-orbit (launched) | 56 | 6 |
| extras | 23 | 10 |
| neon-protocol | 53 | 60 |
| nova-canvas | 55 | 70 |
| signal-ward | 55 | 71 |
| terra-grid | 55 | 16 |
| Follow-up pass (code comments, hints, dupes) | - | ~25 |

## Dominant patterns removed

1. **Inflated contrast**: "X is not just Y. It is Z." as rhetoric
   ("Documentation is not just courtesy. It is accountability."). Real
   mechanism contrasts kept ("both left and right context, not just the
   tokens that came before it").
2. **Anaphora rhythm**: "Every component, every connection, every fallback."
   and "No X. No Y. Just Z." staccato runs.
3. **Vague benefit takeaways**: "directly affects model accuracy",
   "enables intuitive creative control" rewritten to name the mechanism.
4. **Canned scene endings** in consequence narratives: "Every edge case
   accounted for.", "The curators are thrilled.", "This changes everything."
5. **Slogan tag-lines**: "Augmentation, not replacement.", "Measure,
   document, remediate.", "True real-time performance."
6. **Vague authorities**: "researchers tested" now names Gender Shades;
   "Research on clinical transformers shows" now says what you observe.
7. **Cross-lesson batch fingerprints**: cloned punchlines ("That is the X."
   x3, ".. in a browser tab" x4, duplicated 512-dim Rohan quote, metronome
   simile x2) varied so one strong instance survives.
8. **Code-comment slogans** (learner-visible via shiki, missed by all prose
   gates): "Transfer learning is the great equalizer.", "It is the force
   that pushes the model from copying to creating.", etc.
9. **Slop hints**: three nova-canvas nudge hints rewritten (one factually
   contradicted its own lesson). Solution hints untouched (Gate B).

## Factual fixes made along the way

- signal-ward capstone/03 takeaway equated precision/recall with FP/FN
  *rates*; now states what each actually counts.
- nova-canvas multimodal/05 said "eight words" for a six-word prompt.
- deep-orbit training-loop/05 carried the course's third conflicting
  "most common failure in ML" superlative; deleted (foundations/03 and
  neural-networks/04 agree with each other and stay).
- apps/web onboarding metadata promised a "pick a world" step that no longer
  exists.
- paywall footer sold "a bundle, or all five" while no bundle is purchasable
  (aligned with the 2026-08-09 /pricing precedent).

## Report-only: needs an author/owner decision

1. **sequence-models/01 (signal-ward) coherence bug**: Karimi and MEDI claim
   "same words, different order" but the lesson's own example pair differs
   by a WORD ("denied" vs "reported") and the printed BoW vectors differ.
   Load-bearing for the quiz framing; needs a real content pass, not a
   prose patch.
2. **neon feature-extraction/04**: consequence says MobileNetV2 "48ms";
   body and code table say 45ms.
3. **nova vae/03**: consequence says "By epoch 50"; body shows epochs 40-42.
4. **Latent Gate A exposure**: consequence.narrative numbers that never
   appear in lesson bodies pass today only because the numbers gate scopes
   to launched worlds. Will fire on world launch:
   terra-grid scale-reliability/01-05, monitoring-drift/02; nova-canvas
   clip-alignment/01+03, capstone/03+05, creative-deployment/04, vae/03;
   signal-ward tc/05, pp/04, qa/04. Added to world-launch-checklist.
5. **Em dashes in developer code comments**: 206 instances across
   apps/web/packages source comments, all written after the 2026-06-10
   sweep. User-visible strings are clean (verified); this is a style-bible
   rule 6 regression in dev-facing text only. Backlogged: sweep + gate.
6. **Neon "The Architect"** speaks in capstone/05 but is not in the world
   cast list.
7. terra edge-ai-basics/02 solution hint says "three pillars" (cliche) but
   is Gate-B-pinned; leave unless hints are regenerated.
8. blog/audit-exercise-mlcontent.mdx sentences "Zero mismatches remain" etc.
   are pinned by mlcontent-taxonomy.test.ts; load-bearing, do not reword.
9. Capstone owns-all placeholder copy ("V1.0 coming ... watch your inbox")
   reads compressed; intent unclear.

## Verification (run at repo root after all edits)

- velite content build: green (305 files parse)
- vitest: 175 files, 1759 passed / 88 skipped
- typecheck: 10/10 packages
- exercise grader: 88/88
- e2e (Playwright, all projects incl. tablet): 127 passed, 30 skipped
- Em-dash sweep: content at exactly the 2 blessed exceptions; user-visible
  app strings zero.
- Surviving "not just" instances (58 corpus-wide) individually reviewed:
  all draw real technical distinctions.

Nothing committed (owner rule). All work uncommitted in the working tree.
