# Runnable room-project follow-up

November 11, 2026. Local implementation after commit `46e311d4`, which was
pushed to `origin/main` after normal hooks passed workspace typechecks and
4,343 tests (65 skipped). On November 12, commit `470ded71` released the
runnable demonstration. Production browser checks then passed, as recorded in
the last section.

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

These values come from the real CPU runtime test. On November 12, the
production page displayed the same values in Chromium and WebKit.

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

## Production browser check

The first attempts on November 11 never reached a browser check. CUA
reported an unavailable browser host, and both native Chrome connection
attempts failed with `Sky Computer Use native pipe closed before response`.
A local `next start` served the static assets but returned 500 for page
requests because its instrumentation guard requires `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. No credentials or guards were changed.

On November 12, after the release, headless Playwright ran the checks against
tensorcraft.app in Chromium at 1440x900 and WebKit at 393x659.

- The page requests no worker, runtime or data before Run.
- A five-epoch run started from the keyboard finishes and shows the table
  above. Reading `datatest2.txt:1193` shows score 0.65626.
- Selecting another of the eight listed mistakes updates the inspection
  panel. Reading `datatest2.txt:1203` shows score 0.71889.
- Cancel during a 15-epoch run shows the cancelled status, and no result
  appears three seconds later. A one-epoch restart then finishes.
- The worker, runtime, helper modules and data return 200 under the
  production CSP. Neither browser reported a console error or CSP violation.
- The page has no horizontal scroll at 393 px.

The check did not cover physical devices, Safari itself, Firefox or screen
readers. WebKit's default Tab order skips buttons, so the keyboard run
focused each button before pressing Enter or Space. The reading picker is a
native select, so its keyboard behavior comes from the browser.

Commit `68d6e3d7` released the sourced course-comparison additions on
November 12. This
implementation makes no ranking or citation claim. No paid audit rerun,
recurring collection, outreach or checkout-question activation occurred.
