# Build failure triage

A build service wants to flag builds that deserve an engineer's attention.
At the instant a build starts, predict whether it will fail. A flag requests
review; it does not cancel a build or block a release.

This is an independent assignment after Deep Orbit's first trained
classifier. Use JavaScript and TensorFlow.js. Choose the approach yourself.
Allow 60 to 90 minutes for a first attempt; this is an author estimate.

## Run the starter

Use Node.js 22 or later. In this extracted folder, run `npm install`, then
`npm start`. The starter loads the data and prints one row. Add your experiment
to `starter.mjs` or create other files. You can use the same data in a browser
project if you prefer.

## Data and decision time

`data.json` contains 720 original, synthetic builds in chronological order,
one build per row. The records imitate a small build service for practice.
They are not evidence about real software teams or a production benchmark.
The label was generated with randomness, so the supplied inputs cannot
explain every failure.

| Field               | Meaning                                                         | Available when the build starts? |
| ------------------- | --------------------------------------------------------------- | -------------------------------- |
| `buildId`           | Unique identifier                                               | Yes; metadata                    |
| `startedAt`         | UTC start time                                                  | Yes; metadata                    |
| `changedFiles`      | Count of changed files                                          | Yes                              |
| `dependencyUpdates` | Count of dependency updates                                     | Yes                              |
| `previousFailures`  | Failed builds among this service's previous 10 completed builds | Yes                              |
| `queueMinutes`      | Minutes spent waiting before this build started                 | Yes                              |
| `durationSeconds`   | Total execution time, recorded when the build finishes          | No                               |
| `failed`            | Outcome: 1 failed, 0 succeeded                                  | No; this is the target           |

Choose features that would exist when a real prediction is requested.
Identifiers, timestamps and outcomes need different treatment from measurements.

## Deliverable

Keep your runnable code, environment versions and a short report. Explain:

1. The prediction and review decision, and which mistakes matter.
2. Your features, exclusions and chronological split. Give row counts and
   failure rates per split. Fit preprocessing only on training rows.
3. A simple baseline, a trained classifier and the metric you chose before
   comparing them. Include a confusion matrix so someone can inspect both
   missed failures and unnecessary reviews.
4. The validation choices you made and results on the final untouched period.
   If you inspect it and then change the model, say that the score now informs
   development and needs new test data.
5. At least three individual errors, or all of them if there are fewer.
   Explain what you can learn from those cases and what remains uncertain.
6. Whether the trained model earns its added complexity. A baseline can win.
   Do not claim production readiness from this synthetic dataset.
7. Any help used, including lesson examples, rescue hints, AI or another person.

There is no required architecture, score threshold or provided model solution.
A clear report explaining a losing model is useful work. The lesson's journal
records your self-review; it does not certify independent mastery.

## Reuse

The data and starter are original Tensorcraft teaching material released under
CC0-1.0. You may reuse, modify and publish them and your own implementation.
See `LICENSE.txt`. TensorFlow.js has its own license.
