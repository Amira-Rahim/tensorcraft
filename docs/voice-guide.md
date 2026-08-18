# Story Voice Guide - Phase 1 voice cards + remaining methodology

Phase 1 (voice cards) and Phase 2 (naming consolidation) executed 2026-04-25. The full Phase 4 spot-check edit pass remains to be run by a human editor - see "Remaining work" below.

**Cards refreshed 2026-06-10:** Rohan's card corrected (he is Nova Canvas's audio artist, not a Terra Grid ops lead - the old card described a character who does not exist in his world). New cards added for Erdem and Samir (Nova Canvas) and Tariq Hussain, Priya Sharma, and Elif Yilmaz (Terra Grid), each derived from their actual dialogue blocks.

## Status

- **Phase 1 (voice cards):** done - character voice cards below.
- **Phase 2 (naming consolidation):** done - `Vikram Reddy` → `Vikram` (74 dialogue blocks consolidated), `Khalil Ansari` → `Khalil` (41 blocks). Frontmatter `speaker:` fields updated to match.
- **Phase 3 (extraction script):** spec'd, not run.
- **Phase 4 (spot-check + edit):** deferred for human editor judgment.
- **Phase 5 (verify):** continuous via velite parse + final build check.

## Voice cards (top 12 speakers)

These are the canonical voices. When editing dialogue, match the card.

### Noor (Signal Ward - clinical lead, 46 blocks)
- **Background:** Clinical informatics lead at Diagnostic One. Frontline doctor by training, ML-curious by necessity.
- **Tone:** warm-procedural. Fast to context-switch from human-to-machine reasoning.
- **Speech:** medium-length sentences, uses contractions, comfortable with both clinical jargon and technical analogies.
- **Verboten:** never claims medical certainty about a model output. Never says "the model knows" - always "the model predicts" or "the model flags".
- **Example:** *"The note says 'denied chest pain'. The model needs to learn that 'denied' flips the meaning. We can't ship a triage system that misses negation."*

### Vikram (Signal Ward - ML lead, 74 blocks)
- **Background:** ML engineer running the Diagnostic One model team. Authored the architecture choices.
- **Tone:** direct, slightly impatient with ambiguity. Loves analogies that compress.
- **Speech:** short to medium. Heavy on explicit comparison ("X is to Y as A is to B"). Uses contractions.
- **Verboten:** never hand-waves a tradeoff - always names which side wins and why.
- **Example:** *"Self-attention isn't enough. Wrap it in residuals and norm. Like React's vDOM diff - minimal targeted updates, not a full rebuild every layer."*

### Hassan Al-Rashid (cross-world advisor, 36 blocks)
- **Background:** Senior architect, multi-world presence (Deep Orbit + Terra Grid). Has shipped ML in production before.
- **Tone:** authoritative, calm. Speaks in tradeoffs.
- **Speech:** medium-long sentences, full names not contractions, sparing with jokes.
- **Verboten:** never says "best practice" - names the constraint instead. Never gives advice without naming the cost.
- **Example:** *"Quantizing to INT8 saves 4× memory at the cost of 2-3 points of accuracy. For an attention-driven UI feature where wrong predictions are recoverable, that's the right trade. For a medical alerting model, it isn't."*

### Amir (Neon Protocol - frontline, 36 blocks)
- **Background:** Resistance engineer running the Sentinel detection system on hostile networks.
- **Tone:** clipped-urgent, occasionally darkly funny. Operating under pressure.
- **Speech:** short fragments OK. Profession-tinged ("the array", "the holotable") not corporate.
- **Verboten:** no academic framing - explains things in operational terms. No "in the literature" or "researchers found".
- **Example:** *"Three drones, all firing redundant detections. NMS or we're staring at 50 boxes per drone. Sort by confidence, suppress the rest."*

### Imran (Deep Orbit - instructor, 34 blocks)
- **Background:** Teaching the foundations modules. Patient, methodical.
- **Tone:** explanatory, encouraging. Shows work step by step.
- **Speech:** medium sentences, frequent "let's", introduces terms before using them.
- **Verboten:** never says "obviously" or "just". Never assumes prior knowledge above the lesson order.
- **Example:** *"A tensor is the same shape as a multidimensional array - start there. Rank is the number of dimensions; shape is the size of each. We'll build up from rank-1 to rank-4."*

### Yara (Nova Canvas - creative lead, 33 blocks)
- **Background:** Generative artist running Studio One. Comfortable with both code and aesthetic intuition.
- **Tone:** curious, playful. Treats failure modes as features to explore.
- **Speech:** medium-long, lyrical without being purple. Uses concrete sensory metaphors.
- **Verboten:** no over-mysticism about generative models. Names the math when it matters.
- **Example:** *"VAEs sample from a continuous latent space - wander between two faces and the in-between point still looks face-shaped. That's what β controls: how tightly we pack the codes versus how cleanly they decode."*

### Ensign Demir (Deep Orbit - DEEP SCAN operator, 31 blocks)
- **Background:** Bridge officer running signal scans. Procedural, military-tinged.
- **Tone:** procedural, urgent, confident.
- **Speech:** short crisp sentences. Reports facts then proposes action.
- **Verboten:** never speculative ("maybe", "I think") in operational dialogue.
- **Example:** *"Loss dropped from 0.69 to 0.08 over 50 epochs. Network is learning. Recommend ship to inference."*

### Dr. Farah (Signal Ward - physician, 31 blocks)
- **Background:** Senior physician collaborating on Diagnostic One. Medically rigorous, ML-skeptical until convinced.
- **Tone:** careful-skeptical. Asks pointed questions about model claims.
- **Speech:** medium sentences, uses precise clinical vocabulary, avoids hype.
- **Verboten:** never accepts a model claim without the holdout data. Never speaks for a patient.
- **Example:** *"Before we ship, show me the recall on the high-risk class on the holdout. If we miss a sepsis flag, an 88% accuracy isn't 88% - it's a death."*

### Rohan (Nova Canvas - audio artist, ~32 blocks)
- **Background:** Musician and creative technologist in the Nova Collective. Owns the audio pipeline; came to ML through synthesizers and the Web Audio API.
- **Tone:** warm-pragmatic, aphoristic. Hears every ML concept as sound first ("the distribution is the composition; sampling is the performance").
- **Speech:** medium, contractions, ends explanations on a compressed punchline ("Music generation is setTimeout with taste."). Comfortable code-switching between studio vocabulary (knobs, takes, session briefs, tempo) and web-dev vocabulary, but the studio register comes first.
- **Verboten:** never delivers pure CSS/markup analogies - if a comparison is needed, he reaches for audio, performance, or composition. Never reverent about the models; they're instruments.
- **Example:** *"I've seen this in music. A composer finds one melody the audience likes and plays it forever. No exploration, no risk. The generator found the safe zone and refuses to leave."*

### Dr. Karimi (Signal Ward - researcher, 26 blocks)
- **Background:** Computational biology researcher applying ML to clinical text.
- **Tone:** academic, precise, occasionally professorial.
- **Speech:** longer sentences than the operations characters. Cites mechanism + paper-style framing.
- **Verboten:** no sloppy generalization across modalities. Names the dataset.
- **Example:** *"BERT pretraining on PubMed corpus shows different attention patterns than vanilla BERT - domain-specific pretraining transfers more cleanly to downstream clinical tasks. Devlin 2019 is the baseline; ClinicalBERT 2019 is the domain variant."*

### NEON (Neon Protocol - AI assistant, 25 blocks)
- **Background:** Onboard AI in the resistance network. Sardonic, pattern-matching, helpful but blunt.
- **Tone:** dry-witty, observational, occasionally cutting.
- **Speech:** short, punchy. Often delivers the technical truth wrapped in a one-liner.
- **Verboten:** no warmth. No reassurance. No "great question" filler.
- **Example:** *"Frame rate at 4fps. Congratulations. You can detect drones. Slowly."*

### MUSE (Nova Canvas - generative AI, 20 blocks)
- **Background:** AI partner in Studio One. Curious, suggestion-driven, treats Yara as collaborator.
- **Tone:** suggestive, exploratory, never authoritative.
- **Speech:** medium, uses "we could", "what if we", "this might".
- **Verboten:** never authoritative - always offers options.
- **Example:** *"What if we interpolate at three points along this latent direction? We'd see the model's internal axis of variation between Monet and Hokusai."*

## Voice cards added 2026-06-10

### Erdem (Nova Canvas - production lead / curator-ops, ~21 blocks)
- **Background:** Runs the operational side of the Nova Collective: kiosk hardware, deadlines, budgets, the Biennale's editorial line. The exhibition's producer.
- **Tone:** dry, exacting, constraint-first. Approval is always conditional and always quantified. Allowed one mutter of grudging praise per module ("Better than the interns.").
- **Speech:** short sentences front-loaded with numbers ("Forty-three seconds. I timed it."). States the constraint, then the consequence, then the demand. Uses contractions, but goes clipped and formal when issuing ultimatums.
- **Verboten:** never impressed without a metric attached. Never accepts an analogy whole - he's the one who names where it breaks ("Webpack hands you back the identical program. Quantization hands you back a slightly different artist."). Never says a deadline is flexible.
- **Example:** *"The gallery opens in nine days and each kiosk takes forty-three seconds to produce a single image. We will have a queue around the block, and not the good kind."*

### Samir (Nova Canvas - JavaScript engineer, ~25 blocks)
- **Background:** Senior JavaScript developer, newest member of the collective. The learner's mirror in this world: maps every ML mechanism onto a web-dev pattern, and is usually 80% right.
- **Tone:** eager-systematic, confident in his own domain, openly curious outside it. Likes architectures and clean pipelines.
- **Speech:** medium, structured ("Two encoders. One for images, one for text."), heavy on web vocabulary (monorepo, SSR, progressive disclosure, state machines). Proposes the JS analogy as a question or claim that someone else then corrects or sharpens.
- **Verboten:** never the one who delivers the correction - his role is the plausible first draft. Never bluffs about the math; when he doesn't know, he asks.
- **Example:** *"This is the same challenge as integrating a monorepo before a major release. Each package works in isolation. The hard part is making them work together: shared types, consistent interfaces, and a clear data flow."*

### Tariq Hussain (Terra Grid - fleet deployment lead, 23 blocks)
- **Background:** Owns the physical fleet: 847 edge devices, satellite uplinks, solar budgets, rollout windows. The person whose pager goes off.
- **Tone:** operational, unhurried, immovable on safety margins. Treats shipping as a privilege the artifact has to earn.
- **Speech:** short to medium, dense with fleet numbers and unit costs ("$0.50 per MB", "2,100 devices", "48 hours"). Speaks in requirements ("Every deployment artifact needs a version, a checksum, and a rollback path."). Verdicts are terse ("That I can ship.").
- **Verboten:** never deploys anything without a rollback path. Never hand-waves hardware ("it'll probably fit" does not exist in his vocabulary - the RAM number does).
- **Example:** *"Once I deploy a model here, I can't just SSH in and fix it. The update has to work perfectly, every time, over a satellite link that costs $0.50 per MB."*

### Priya Sharma (Terra Grid - ML platform engineer, 24 blocks)
- **Background:** Bridges data science and infrastructure: drift monitoring, A/B statistics, distillation, sharding. Trained the cloud models the edge fleet inherits.
- **Tone:** analytical-calm, patient, precise about uncertainty. The voice that says "we need more data before we act."
- **Speech:** medium-long, mechanism-first explanations ("The model is doing exactly what we trained it to do. The problem is that the world changed underneath it."). Quotes sample sizes, confidence, and costs. Maps to web-infra patterns but always names what changes ("The routing stays; the patience changes.").
- **Verboten:** never claims significance without the interval. Never blames the model before checking the inputs.
- **Example:** *"The new model shows 93.8% accuracy versus 91.2% for the control. That is a 2.6% improvement. But is it real? With 1,200 samples, the confidence interval is wide. We need more data before we act."*

### Elif Yilmaz (Terra Grid - security & safety engineer, 9 blocks)
- **Background:** Reviews everything that touches the grid for attack surface and failure blast radius: model files, update channels, federated aggregation, quantized safety thresholds.
- **Tone:** adversarial-precise. Thinks like the attacker, speaks like an auditor. Quietly alarming rather than loud.
- **Speech:** short-medium declaratives that name the threat, the mechanism, and the required control ("The checksum guards the artifact; sign the delta too, or don't ship it."). Cites concrete attack classes (gradient inversion, tampered weights) and failure signatures ("a 0.3% vibration anomaly, rounded away").
- **Verboten:** never assumes inputs are benign or parties are trustworthy. Never lets convenience ship unsigned, unreviewed, or without an instant fallback.
- **Example:** *"Weight updates aren't data. But a determined adversary can reconstruct training examples from gradients. It's called a gradient inversion attack. We need stronger guarantees."*

## Remaining work (Phase 4)

- Run `/tmp/extract-dialogue.mjs` to dump all 702 dialogue blocks grouped by speaker
- Spot-check top 5 speakers (Noor, Vikram, Hassan, Amir, Imran - covers ~190 blocks, 27% of total)
- Edit ~20 outliers per character flagging tonal mismatches against the cards above
- Re-run velite + web build to confirm no parse breakage

Estimated remaining cost: ~3.5h. Defers to human editor for taste calls.

## Why this matters

Each world has named characters who appear repeatedly in `<Dialogue speaker="X">` blocks. When character voice drifts (formal one lesson, casual the next), readers feel the seam. The course already invests in narrative scaffolding to keep learners engaged - voice consistency is the cheapest 10% improvement on top of that investment.

## Current state (audit run 2026-04-25)

```
Total dialogue blocks   : 702
Unique speaker names    : 32
Speakers per world      : ~6
Lessons containing dialogue : ~280 / 297
Average blocks per lesson   : 2.36
```

### Naming inconsistencies (must consolidate before voice pass)

| Speaker A | Speaker B | Suggested canonical |
|---|---|---|
| `Vikram` (39) | `Vikram Reddy` (35) | `Vikram Reddy` everywhere or `Vikram` first reference + `Vikram` after |
| `Khalil` (20) | `Khalil Ansari` (21) | Same: pick one |
| `Hassan Al-Rashid` (36) | possibly `Hassan` (check) | Pick one |
| `Tariq Hussain` (21) | possibly `Tariq` (check) | Pick one |
| `Priya Sharma` (23) | possibly `Priya` (check) | Pick one |
| `ARIA` (6) | (not aliased) | Increase prevalence - Deep Orbit's AI character is underused |

### Top 10 speakers by frequency

```
46  Noor
39  Vikram
36  Hassan Al-Rashid
36  Amir
35  Vikram Reddy
34  Imran
33  Yara
31  Ensign Demir
31  Dr. Farah
30  Rohan
```

## Methodology (5 phases, ~7h total)

### Phase 1 - Voice guide (1.5h)

For each canonical character, write a 100-word voice card answering:

- **Background:** one-line role and world (e.g. *Noor - clinical lead, Signal Ward*).
- **Tone:** one of `terse`, `procedural`, `warm`, `dry-witty`, `urgent`, `professorial`, `nervous-but-bright`.
- **Speech patterns:** typical sentence length (short / medium / long), domain jargon level (high / mid / low), uses contractions Y/N.
- **Verboten phrases:** things this character would never say (e.g. ARIA never says "great question").
- **Example dialogue:** 2 sample lines that exemplify the voice.

Output: `docs/voice-guide.md` (this file) gets a Phase-2 patch with one card per character.

### Phase 2 - Naming consolidation script (30 min)

`/tmp/normalize-speaker-names.mjs` - search/replace `Vikram Reddy` → `Vikram` (or vice versa) across all MDX, run velite to ensure no breaks. Do this BEFORE the voice pass so each character has exactly one identity to compare against.

### Phase 3 - Extraction (30 min)

`/tmp/extract-dialogue.mjs` - walks all MDX, outputs `dialogue-by-speaker.json`:

```json
{
  "Noor": [
    { "lesson": "signal-ward/foundations/01-clinical-pipelines.mdx", "block": "Welcome to triage. ..." },
    ...
  ]
}
```

### Phase 4 - Spot-check + edit (3.5h)

Open `dialogue-by-speaker.json` per character. For each character with > 10 blocks:
- Read 5 contiguous blocks side by side.
- Flag tonal outliers (block uses contractions when character doesn't, block is 4 sentences when character speaks in 1, block uses jargon when character avoids it).
- Edit each flagged block in place. Keep the technical content; rewrite the surface voice.

Empirical rate from prior pilots: **~10% of blocks need a rewrite** = ~70 blocks. At 3 min/edit: ~210 min.

### Phase 5 - Verify (30 min)

```bash
pnpm --filter @tensorcraft/content build:content   # all MDX still parses
pnpm --filter @tensorcraft/web build               # static pages regenerate
```

Re-read 3 random lessons per world cold. If voice still drifts, return to Phase 4 for that character.

## Total cost

| Phase | Hours |
|---|---:|
| 1. Voice guide | 1.5 |
| 2. Naming consolidation | 0.5 |
| 3. Extraction script | 0.5 |
| 4. Spot-check + edit | 3.5 |
| 5. Verify | 0.5 |
| Buffer (10%) | 0.5 |
| **Total** | **~7h** |

The original plan estimated 12h; the audit data revises it to ~7h because:
- Block count is 702 not the assumed 600
- But average block is short (most are 2-3 sentences) so reading is fast
- Naming consolidation is mechanical (script-driven)
- Real edit count is bounded by the 10% empirical rate

## Risks

- Voice cards require editorial taste; if no clear voice has been established (which is true for some minor characters), Phase 1 becomes invention. Risk: introduces voice that doesn't match what readers have already absorbed in V1.
- Mitigation: defer minor characters (< 10 blocks) - the polish payoff is concentrated in the top 10 speakers.

## Recommendation

Execute Phases 1-2 + spot-check the top 5 speakers (Noor, Vikram, Hassan Al-Rashid, Amir, Imran) only. That's ~3.5h and captures ~190 of the 702 blocks (27% of total). Defer the rest to V2.

## Out of scope here

- Plot continuity (separate concern - different audit)
- World-internal arc rewriting
- Adding new dialogue blocks to lessons that have none
- Voice for non-character narration (the lesson body itself)
