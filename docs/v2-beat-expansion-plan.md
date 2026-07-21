# BossBeat Expansion Plan (V2)

**Status:** planned, not started. Written 2026-07-13 when "beat dormancy" (32
lessons with no decision beat) was accepted for V1 launch.
Indexed in `docs/post-launch-backlog.md` §3 (canonical post-launch index).
**Owner gate:** start after launch, once ~100 real lesson completions exist so
placement can follow observed drop-off instead of guesses.

## Current state

4 BossBeats live: f/05 (keep/delete Sample 7741), ad/01 (trainset call),
llm/04 (cut-call), cap/05 (canary window). 7 of 11 modules have no decision
beat. This is deliberate V1 scope, not a bug: a bad beat is worse than no
beat, and the P3 audit rounds proved each one costs real hardening work.

## Why not 32 beats

A BossBeat earns its place only where the lesson already contains a genuine
decision with tension between stances. Most lessons teach a mechanism and
have no such moment; stapling a choice onto them produces the
validated-guess dialogue smell the copy audits keep flagging. Target: every
module has at most one beat, and only where canon already carries the
decision.

## Ranked candidates (six, one per dormant module with a real decision)

1. **ad/04 threshold call.** After the fourteen-alert week: set the cutoff
   for precision or recall. The lesson's own RecallPrompt already teaches
   the cost-asymmetry argument; the beat makes the learner take a side
   before the epilogue replays last week's alerts through their choice.
2. **oe/02 quantization ship call.** Ship 85 MB with the measured 1.2%
   accuracy drop, or hold the 340 MB build. Consequence pays immediately:
   oe/03 pruning starts from whichever ledger the learner accepted.
3. **tl/05 suspicious-metric call.** The 0.998-from-an-untrained-model
   print: trust it, re-run it, or tear down the fixture. Rhymes with f/05
   ("a question mark is an instrument") — the strongest thematic pairing.
4. **br/03 backend fallback.** Ship the WebGL fast path only, or pay the
   WASM fallback complexity for the crew tablets. Real engineering
   tradeoff learners recognize from their own work.
5. **ats/03 interval decision.** Nazari's question about the widening
   interval; cap/05's eleven-days extrapolation already exists as the
   long-range payoff, so the beat closes an arc that currently opens
   without a choice.
6. **nn/05 deploy call.** Put the 673-parameter net on the live feed or
   keep it shadowed. Smallest tension of the six; cut first if the wave
   shrinks.

Result if all six ship: 10/11 modules carry exactly one beat (sp remains
beat-free by evidence: three blind evaluators liked its pacing as-is).

## Quality gates every new beat must pass (earned in P3, non-negotiable)

- No stance label anywhere in the rendered component (P3 round 1 leak).
- `displayOrder` via the FNV-1a + xorshift shuffle, EXECUTED across ids —
  a randomizer is a claim (P3 round 3: the LCG parked dominant at one
  position in all four beats).
- The dominant stance pays a visible cost on-page, in that lesson (P3
  round 2: three costless dominants had to be retrofitted).
- Consequence text references the recorded stance, never pre-tells the
  epilogue.
- Extend `boss-beat.test.tsx` (dominant-position-varies gate) and the e2e
  answer-key leak check to each new beat's page.
- Voice: in-world, per the character bible; beats are written by the
  module's cast, not by a narrator.

## Effort

Roughly 1.5–2h per beat (copy + wiring + gates + battery), ~10–12h for the
wave. Ship as one wave so the shuffle-distribution test sees the full id
space, then re-run the P3 leak battery.
