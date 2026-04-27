# Story Voice Guide — Methodology and Cost

This doc is the **spec** for executing a story-voice consistency pass across all 297 lessons. Execution is deferred — the curriculum already ships, this pass is polish. If a future session runs the pass, follow the methodology here verbatim.

## Why this matters

Each theme has named characters who appear repeatedly in `<Dialogue speaker="X">` blocks. When character voice drifts (formal one lesson, casual the next), readers feel the seam. The course already invests in narrative scaffolding to keep learners engaged — voice consistency is the cheapest 10% improvement on top of that investment.

## Current state (audit run 2026-04-25)

```
Total dialogue blocks   : 702
Unique speaker names    : 32
Speakers per theme      : ~6
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
| `ARIA` (6) | (not aliased) | Increase prevalence — Deep Orbit's AI character is underused |

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

### Phase 1 — Voice guide (1.5h)

For each canonical character, write a 100-word voice card answering:

- **Background:** one-line role and theme (e.g. *Noor — clinical lead, Signal Ward*).
- **Tone:** one of `terse`, `procedural`, `warm`, `dry-witty`, `urgent`, `professorial`, `nervous-but-bright`.
- **Speech patterns:** typical sentence length (short / medium / long), domain jargon level (high / mid / low), uses contractions Y/N.
- **Verboten phrases:** things this character would never say (e.g. ARIA never says "great question").
- **Example dialogue:** 2 sample lines that exemplify the voice.

Output: `docs/voice-guide.md` (this file) gets a Phase-2 patch with one card per character.

### Phase 2 — Naming consolidation script (30 min)

`/tmp/normalize-speaker-names.mjs` — search/replace `Vikram Reddy` → `Vikram` (or vice versa) across all MDX, run velite to ensure no breaks. Do this BEFORE the voice pass so each character has exactly one identity to compare against.

### Phase 3 — Extraction (30 min)

`/tmp/extract-dialogue.mjs` — walks all MDX, outputs `dialogue-by-speaker.json`:

```json
{
  "Noor": [
    { "lesson": "signal-ward/foundations/01-clinical-pipelines.mdx", "block": "Welcome to triage. ..." },
    ...
  ]
}
```

### Phase 4 — Spot-check + edit (3.5h)

Open `dialogue-by-speaker.json` per character. For each character with > 10 blocks:
- Read 5 contiguous blocks side by side.
- Flag tonal outliers (block uses contractions when character doesn't, block is 4 sentences when character speaks in 1, block uses jargon when character avoids it).
- Edit each flagged block in place. Keep the technical content; rewrite the surface voice.

Empirical rate from prior pilots: **~10% of blocks need a rewrite** = ~70 blocks. At 3 min/edit: ~210 min.

### Phase 5 — Verify (30 min)

```bash
pnpm --filter @tensorcraft/content build:content   # all MDX still parses
pnpm --filter @tensorcraft/web build               # static pages regenerate
```

Re-read 3 random lessons per theme cold. If voice still drifts, return to Phase 4 for that character.

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
- Mitigation: defer minor characters (< 10 blocks) — the polish payoff is concentrated in the top 10 speakers.

## Recommendation

Execute Phases 1-2 + spot-check the top 5 speakers (Noor, Vikram, Hassan Al-Rashid, Amir, Imran) only. That's ~3.5h and captures ~190 of the 702 blocks (27% of total). Defer the rest to V2.

## Out of scope here

- Plot continuity (separate concern — different audit)
- Theme-internal arc rewriting
- Adding new dialogue blocks to lessons that have none
- Voice for non-character narration (the lesson body itself)
