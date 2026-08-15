# Exercise mlContent Audit - 2026-04-26

Total exercises: **315**
Exercises updated with new `mlContent` field: **0**

## Heuristic

Auto-classified by `tf.*` API surface in the solution code:
- **arithmetic** - no `tf.*` calls (plain JS math).
- **data** - tensor primitives only (`tf.tensor`, `tf.add`, `tf.matMul`, dataSync etc).
- **model** - layer composition (`tf.sequential`, `tf.layers.*`, `model.predict`).
- **training** - gradient/fit (`tf.train.*`, `model.fit`, `tf.variableGrads`).
- **evaluation** - metrics + drift (`model.evaluate`, precision/recall, drift detection).
- **deployment** - serialization, runtime, quantization, edge.
- **systems** - incident scenarios + production architecture (manual override category).

## Distribution

| mlContent | Count | % |
|---|---:|---:|
| arithmetic | 232 | 73.7% |
| data | 42 | 13.3% |
| model | 12 | 3.8% |
| training | 4 | 1.3% |
| evaluation | 11 | 3.5% |
| deployment | 14 | 4.4% |
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
|  |  | data |
|  |  | data |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | evaluation |
|  |  | evaluation |
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
|  |  | model |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | deployment |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |
|  |  | arithmetic |

_Showing first 50 of 315. Full list in `packages/content/.velite/exercises.json` after build._
