# Arena Scoring Contract (design)

**Status:** design contract for a not-yet-built feature. The scalability
re-audit (2026-07-24, `docs/audits/scalability-architecture-2026-07-21.md`
§RE-AUDIT / N1) found that a competitive arena has three *foundational* bones —
decisions that get exponentially more expensive to retrofit after launch. One
of them is now built; the other two are captured here so they are **known now**
and cannot be quietly designed wrong later.

The arena itself (matchmaking, tournaments, ELO, live leaderboards, cosmetics)
is additive and remains deferred to `docs/post-launch-backlog.md`.

## A-F0 — THE ARENA STARTS AT ZERO (binding, added 2026-07-25)

**No arena ranking, leaderboard, or seed may ever be derived from historical
`world_progress` / `exercise_attempts` scores.** Every score recorded before
the server-authoritative harness exists is client-reported and forgeable
(see below); seeding from it would launder forged history into the
competitive ladder, and that laundering is UNRECOVERABLE once ratings
propagate (fresh-eyes rerun 2026-07-25, irreversible list #4). Rankings
begin from the first server-verified `arena_submissions` row and from
nothing else.

---

## Why this exists: scoring today is client-authoritative

Verified in code (re-audit, Axis B):

- The browser computes pass/score and POSTs it: `exercise.tsx` (`results.every(r
  => r.passed)`).
- `POST /api/exercise-attempts` inserts the client-reported `passed`/`score`
  with only shape validation, under the **user's own JWT**.
- `world_progress` and `skill_events` are likewise client-written.

⇒ A leaderboard built on any existing table is forgeable with
`POST {passed:true, score:100}`. The certificate stack is a *share* primitive
(no score/rank column, proves payment not skill), not a *ranking* one.

---

## A-F1 — Authoritative write model  ✅ BONE LAID (migration 048)

`arena_submissions` exists and is **service-role-write-only**: it has a
self-read RLS policy and **no insert/update/delete policy at all**, so
authenticated clients cannot write scores. `service_role` bypasses RLS, so the
Hono API — the only holder of the service key — is the sole writer.

**Contract the scoring service must honour when built:**

1. A submission arrives at a server endpoint (e.g. `POST /api/arena/submit`)
   carrying the learner's code, never a score.
2. The server re-runs the code against a **hidden hold-out test set the client
   never sees** (distinct from the practice tests shipped in the lesson), inside
   the hardened isolate (A-F2).
3. The server writes `arena_submissions {user_id, challenge_id, score,
   submitted_code, verified_at}` with the **service-role client**.
4. The public leaderboard is a **`SECURITY DEFINER` top-N RPC** over
   `arena_submissions` (the `get_shared_certificate` / CONVENTIONS.md pattern),
   returning only public-safe columns — never a broad SELECT policy.

`submitted_code` is retained on every row specifically so a score can be
re-verified and audited (anti-cheat).

---

## A-F2 — Sandbox the server execution path  ⛔ DESIGN-TIME DECISION (not built)

Both server-capable graders today run untrusted code with **ambient authority**:

- `exercise-runner-node.ts` uses `node:worker_threads` with `{ eval: true }`;
  user code runs via `new Function` with `process` / `globalThis` reachable.
- `scripts/validate-exercises.mjs` uses `vm.createContext`, which the Node docs
  state explicitly is **not** a security boundary.

This is fine for CI over trusted authored solutions. It is an **RCE farm** the
moment it is pointed at adversarial learner code at scale. Building arena scoring
around "just reuse the Node runner" bakes the vulnerability in; swapping the
execution engine later is a rewrite of the hot path — hence a decision to make
now, not code to write now.

**Decision to lock before writing the scoring service:** run the grader inside a
hardened isolate with **no network egress, no filesystem, and CPU/memory/wall
limits** — `isolated-vm`, or a microVM (Firecracker / gVisor), or a locked-down
worker pool. It MUST be **warm-pooled**: today the runner spawns one worker and
`importScripts` a ~1.4 MB TFJS bundle *per run*, which is unviable per submission
at scale.

**Do not** reuse the lesson grader (`WORKER_BODY_STRING`) as the arena execution
engine. It is deliberately unsandboxed for authored content, and it is the exact
string both the browser worker and the Node twin execute — its blast radius is
the entire 315-exercise lesson grader.

---

## A-F3 — Determinism / RNG-seeding convention  ⛔ DESIGN-TIME DECISION (not built)

The lesson grader executes user code against **real TFJS** whose stochastic ops
(`randomNormal`, `randomUniform`, dropout, `model.fit` SGD/shuffle,
`multinomial`) are **unseeded** — `grep setSeed` across the harness returns
nothing. Tolerances (`toBeCloseTo`) mask some of this, but a valid submission can
fail on server re-score, producing disputes. A competitive score must be
reproducible.

**Why this is documented, not coded now.** The single chokepoint where a seeded
`tf` would be injected is the `tfProxy` in
`packages/ui/src/mdx/exercise-runner.ts` (the `new Function('console','tf',
code)` boundary). But:

1. That Proxy lives inside `WORKER_BODY_STRING`, whose blast radius is the whole
   lesson grader (315 exercises + every lesson). A change there for an unbuilt
   feature is disproportionate risk.
2. **Wrapping the top-level `tf` random factories is not sufficient for real
   determinism.** Weight initialisation inside `tf.layers.*`, the shuffle inside
   `model.fit`, and dropout all draw from the same unseeded generator and are not
   reachable by decorating the `tf` namespace object. A partial seed gives
   *false* determinism confidence — worse than none, because it looks solved.

**Contract for when the arena scoring service is built:**

- Add an optional `seed` to the worker message contract; when present, the
  isolate seeds every stochastic surface it can (top-level ops **and**
  initializer/`fit` paths — e.g. by constructing layers with seeded initializers
  and passing `shuffle:false` / a seeded shuffle in the challenge harness).
- Author every arena challenge to a **determinism checklist**: fixed seeds,
  `shuffle:false`, seeded initializers, no wall-clock or `Math.random`.
- Gate acceptance of a challenge on a **re-score-twice-must-match** CI check
  (run the reference solution twice in the isolate, assert identical score) so a
  non-deterministic challenge cannot ship.

Guarding on `seed` presence keeps every current caller (which passes no seed) a
strict no-op, so the lesson grader is untouched.

---

## Additive / deferred (safe to build when arena ships)

Leaderboard read RPC, matchmaking, tournaments, ELO/reputation, realtime board
(none exists today — Supabase Realtime is a config add; a board can ship
poll-first), anti-cheat heuristics (duration sanity, rate limits, replay/hash
dedup) layered on top of A-F1. All sit on the authoritative table above.
