# Retrofit Playbook: adding `breaks:` to existing lessons

Companion to `analogy-breaks-pattern.md`. Use this when working through the backlog of 244 structural+intuition bridges that pre-date the pattern.

Source data: `docs/audits/bridge-tier-audit-2026-04-25.md` — full inventory.

## Scope

| Tier | Count | Action |
|---|---:|---|
| structural | 215 | Required `breaks:` |
| intuition | 30 | Required `breaks:` |
| identity | 49 | Optional; skip unless code is non-trivially different |
| missing | 1 | Add bridge first, then `breaks:` per pattern |

## Priority order

Work this order. Earlier batches are higher-leverage retrofits.

### Batch 1 — Tier mismatches (13 lessons)

From audit: 13 lessons claim a different tier than the canonical registry says for the same FE/ML pair. **Resolve the tier first** (update lesson OR update registry — pick one), then add `breaks:` per the resolved tier's requirement. List in the audit report.

### Batch 2 — Suspect structurals (168 lessons)

Heuristic: `tier: structural` AND zero shared significant words between `feTitle` and `mlTitle`. These have the largest cognitive gap and are most likely to mislead. Examples from audit:

- `Webpack Tree-Shaking ↔ Model Pruning` — shared word: none (after stopwords)
- `Micro-Frontends ↔ Model Ensemble`
- `scrollIntoView() ↔ Temporal Attention`
- `Compression ↔ Autoencoder`

Process per lesson:
1. Read the lesson MDX to understand the actual analogy used in the body.
2. Identify the most concrete failure mode — what wrong inference does the analogy invite?
3. Write 1–3 sentences per `analogy-breaks-pattern.md` rules.
4. Add `breaks:` to lesson `concept.bridge` frontmatter.
5. If the bridge is reused across 3+ lessons → also add `breaks:` to canonical registry entry; remove inline duplicates.

### Batch 3 — Remaining structurals (47 lessons)

Structurals that share words between FE and ML (e.g. `Performance Baseline ↔ Anomaly Threshold` shares "threshold"-adjacent terms after stem). Lower priority but still required.

### Batch 4 — Intuitions (30 lessons)

These by definition stretch farthest. Write `breaks:` carefully — for many of these, the honest break is "the mechanisms are completely unrelated; only the high-level shape rhymes." That's fine — say it.

### Batch 5 — Identity audit pass (49 lessons)

Manual pass. For each identity claim, verify the codes are literally interchangeable. If not → demote to structural, then write `breaks:` per Batch 2 process.

## Tactical: per-lesson workflow

```
1. cd packages/content/content/<theme>/<module>/
2. Open <NN>-<slug>.mdx
3. In frontmatter `concept.bridge`, after `tier:`, add:
     breaks: "..."
4. Save. Visual check: pnpm --filter @tensorcraft/web dev → navigate to lesson.
5. Confirm "Where this breaks" footer renders below the bridge callout.
```

## Bulk approach (alternative)

For Batches 2-3, faster to:
1. Generate a single CSV of all suspect bridges from the audit script.
2. Fill in the `breaks:` column for a batch of 20-50.
3. Write a one-shot script that injects each `breaks:` line into its lesson frontmatter.
4. Run `pnpm typecheck` + `pnpm test` after each batch; visual spot-check 3 lessons per batch.

## Checklist per `breaks:` field

- [ ] Lead with concrete failure mode, not "the analogy is imperfect".
- [ ] 1–3 sentences. Under ~280 chars.
- [ ] States both sides of the gap (FE does X; ML does Y).
- [ ] Technical terms exact.
- [ ] No hedging ("may", "could", "in some cases").
- [ ] No story voice / character names.

## Escape hatches

- **Bridge too weak to fix:** if you can't write a meaningful `breaks:` because the analogy itself is bad, replace the bridge entirely. Find a stronger one — registry has 50 candidates, also see `themes-and-bridges` memory note.
- **Bridge truly identity:** if you find yourself with no `breaks:` because the FE concept literally is the ML concept, change tier to `identity`. Audit script will flag for review next pass.
- **Bridge spans 3+ tiers depending on context:** split into separate bridges per lesson. Don't try to make one bridge serve "intuition for beginners, structural for advanced."

## Definition of done (per batch)

- All targeted lessons have `breaks:` field present in frontmatter.
- `pnpm --filter @tensorcraft/ui test bridge-callout` passes.
- `pnpm --filter @tensorcraft/web build` succeeds.
- `pnpm typecheck` passes.
- Re-run `node /tmp/bridge-audit.mjs` (or the committed audit script if promoted) — batch's lessons no longer flagged as missing `breaks:`.

## Definition of done (full retrofit)

- Audit report shows 0 lessons missing required `breaks:`.
- All structural and intuition lessons have `breaks:` either inline or via canonical registry match.
- `bridge-tier-audit-2026-04-25.md` superseded by a follow-up audit dated post-completion.

## Estimated effort

- Batch 1 (13 lessons, tier reconciliation): ~2 hours.
- Batch 2 (168 lessons, suspect structurals): ~12 hours (4 min/lesson average).
- Batch 3 (47 lessons): ~3 hours.
- Batch 4 (30 lessons, intuitions): ~3 hours (these need more thought per lesson).
- Batch 5 (49 lessons, identity audit): ~4 hours.
- **Total: ~24 hours focused work.** Realistic over 2-3 sprints alongside other content.
