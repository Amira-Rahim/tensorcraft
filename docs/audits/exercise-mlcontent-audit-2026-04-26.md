# Exercise mlContent Audit — 2026-04-26

Total exercises: **300**
Exercises updated with new `mlContent` field: **4**

## Heuristic

Auto-classified by `tf.*` API surface in the solution code:
- **arithmetic** — no `tf.*` calls (plain JS math).
- **data** — tensor primitives only (`tf.tensor`, `tf.add`, `tf.matMul`, dataSync etc).
- **model** — layer composition (`tf.sequential`, `tf.layers.*`, `model.predict`).
- **training** — gradient/fit (`tf.train.*`, `model.fit`, `tf.variableGrads`).
- **evaluation** — metrics + drift (`model.evaluate`, precision/recall, drift detection).
- **deployment** — serialization, runtime, quantization, edge.
- **systems** — incident scenarios + production architecture (manual override category).

## Distribution

| mlContent | Count | % |
|---|---:|---:|
| arithmetic | 252 | 84.0% |
| data | 17 | 5.7% |
| model | 8 | 2.7% |
| training | 3 | 1.0% |
| evaluation | 7 | 2.3% |
| deployment | 13 | 4.3% |
| systems | 0 | 0.0% |

## Difficulty/content mismatches (0)

Exercises tagged intermediate or advanced but auto-classified as `arithmetic` (no real ML primitives in the solution).
Recommend either: (a) downgrade difficulty to `beginner`, or (b) strengthen exercise to use TFJS primitives.

| Slug | Difficulty | File |
|---|---|---|

## Full classification

| Slug | Difficulty | mlContent |
|---|---|---|
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | deployment |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | data |
|  |  | data |
|  |  | data |
|  |  | data |
|  |  | data |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | model |
|  |  | model |
|  |  | data |
|  |  | data |
|  |  | model |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | deployment |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |

_Showing first 50 of 300. Full list in `packages/content/.velite/exercises.json` after build._
