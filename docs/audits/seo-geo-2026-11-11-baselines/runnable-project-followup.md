# Runnable room-project follow-up

November 11, 2026. Local implementation after commit `46e311d4`, which was
pushed to `origin/main` after normal hooks passed workspace typechecks and
4,343 tests (65 skipped). The runnable demonstration described here remains
uncommitted and undeployed. Native-browser verification remains pending.

## Reader task and implementation

The existing browser-project guide now lets a reader train a supplied model
for 1, 5 or 15 epochs, compare it with the light-threshold rule and inspect
actual validation mistakes. The page distinguishes current-run results from
the older recorded threshold example and from a learner's independent work.

The worker loads the existing same-origin TensorFlow.js 4.22.0 runtime and
recorded data only after Run. It checks the data's SHA-256 before training:
`6c1885aad2b29fceaaad3a509f95290af7b6542901cbd9d2229b1b76df9011f0`.

The first 1,200 chronological rows supply all fitted scaling parameters and
model training. The next 400 supply validation comparisons. The final 456
remain outside predictions and metrics. Changing validation inputs or labels
does not change training loss or scaling. Changing reserved inputs or labels
does not change any result. Tests execute both checks with the real runtime.

The CPU model uses temperature, light and CO2, one sigmoid unit, seed 17,
Adam at 0.01, binary cross-entropy, batches of 32 and no shuffling. Model
threshold 0.5 and the rule's light threshold of 100 lux stay fixed. The page
explains these choices, validation reuse, related observations and the limits
of one room. It links directly to the executable source and recorded data.

## Executed default result

These values come from the real CPU runtime test. They do not establish that
the browser interaction or production release works.

| Validation outcome | Light rule | Model, five epochs |
| --- | ---: | ---: |
| Correct occupied | 61 | 60 |
| Correct empty | 303 | 319 |
| False alarms | 36 | 20 |
| Missed occupancy | 0 | 1 |
| Accuracy | 91% | 94.75% |
| Illustrative cost, false alarm 1 and miss 4 | 36 | 24 |

The shared mistake `datatest2.txt:1193` reproduces the recorded model score,
approximately 0.6562567353. Both policies call that empty room occupied.
The UI displays loss values and at most eight actual mistakes, with shared
mistakes first. It does not present that selection as all errors.

## Verification

- 55 tests passed across eight files: all guide tests, auth middleware tests
  and the repository character gate. The new core contributes nine real-runtime
  tests. UI and controller tests contribute 17 tests with simulated worker
  messages, including cancellation, stale replies, retry, focus retention,
  load/execution timeouts and no worker before Run.
- Web typecheck, scoped ESLint and source Prettier checks passed.
- The production build completed with 104 static pages. Generated guide HTML
  includes the method, source/data links and canonical URL, with no completed
  training result. Its 18 initial scripts contain no detected TensorFlow
  runtime signatures. Neither the worker nor vendor runtime appears as an
  initial script. This is a compiled-asset check, not a browser network trace.
- The local development server returned 200 for the guide and six required
  assets. Worker, core and helper modules have JavaScript MIME types. CSP
  permits same-origin workers and scripts. The served data hash matches.
- The compiled middleware matcher excludes the worker, core and helper
  modules while retaining the guide and dashboard. The new `.mjs` exclusion
  avoids auth refresh work for public modules.
- Existing fixture, preview, source data and shared assignment helpers remain
  unchanged. Success and error tests verify tensor/model/optimizer cleanup.
- An independent source review found no blocking defect.

Reproduction commands, from the repository root:

```bash
pnpm exec vitest run apps/web/app/guides apps/web/lib/supabase/__tests__/middleware.test.ts packages/content/__tests__/em-dash-ban.test.ts
pnpm --filter @tensorcraft/web typecheck
pnpm --filter @tensorcraft/web build
```

The build and combined tests used Node 26.10.0. The implementation follows the
[TensorFlow.js training API](https://www.tensorflow.org/js/guide/train_models)
and [tensor cleanup guidance](https://www.tensorflow.org/js/guide/tensors_operations).
The worker terminates on completion, error, cancellation, timeout or unmount.

## Remaining checks

CUA reported an unavailable browser host. Both native Chrome connection
attempts failed with `Sky Computer Use native pipe closed before response`.
No visual, keyboard-in-browser, mobile, worker-import or CSP-execution success
is claimed. Check a real five-epoch run, changing epochs, selecting a mistake,
cancel/restart, keyboard controls and narrow layouts before release.

A separate local `next start` attempt served the static assets but returned
500 for page requests because its instrumentation guard requires missing
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` variables. The production build
and development HTTP checks passed. No credentials or guards were changed.

The sourced course-comparison additions remain the next content task. This
implementation makes no ranking or citation claim. No paid audit rerun,
recurring collection, outreach or checkout-question activation occurred.
