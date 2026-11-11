# SEO release distribution drafts

Prepared November 10, 2026. These drafts have not been published or sent.
Publish only after the release destinations return HTTP 200 and show the
reviewed content. The existing $200 monthly marketing budget does not imply
a placement, sponsorship, or purchase. This pack records no spend.

## Canonical destinations and available assets

| Destination | Purpose and scope |
| --- | --- |
| https://tensorcraft.app/guides/browser-machine-learning-project | Main article and curator destination. Interactive threshold example using a saved demonstration score, project responsibilities, data provenance, and limitations. |
| https://tensorcraft.app/guides/javascript-machine-learning-learning-path | Learning goals, prerequisites, stages, and course entry. |
| https://tensorcraft.app/guides/tensorflow-js-reshape-vs-transpose | Runnable TensorFlow.js example with exact sensor-excerpt outputs. This guide uses authored fictional data. |
| https://tensorcraft.app/compare | Source-based comparison of named learning options. |
| https://tensorcraft.app/worlds/deep-orbit/foundations/introduction-to-tensors | First free lesson. Deep Orbit's first five lessons need no account. |
| https://tensorcraft.app/assignments/room-project-preview.json | Supplied maintainer fixture. Includes the recorded score and label, artifact hashes, fixture hash, and reproduction commands. |
| https://tensorcraft.app/assignments/room-occupancy-v1/README.md | Independent project brief. Requires Node.js 22+ and an initial dependency download. |
| https://tensorcraft.app/assignments/room-occupancy-v1.zip | Starter download. Contains no trained model solution. |
| https://tensorcraft.app/assignments/room-occupancy-v1/DATA-LICENSE.md | Dataset attribution, CC BY 4.0 terms, sampling details, and source archive hash. |

The project article and recorded fixture supply the evidence for these drafts.
No new video or still accompanies this pack. Existing teaser and sensor-campaign
media remain separate assets.

## DEV article draft

Suggested title: A TensorFlow.js model and a light rule made the same mistake

Suggested tags: javascript, machinelearning, tensorflow

Canonical article: https://tensorcraft.app/guides/browser-machine-learning-project

By Tensorcraft, a group of JavaScript engineers.

One reading from a recorded office dataset has 271 lux of light and an
unoccupied label. Our demonstration's light rule flags any reading at or above
100 lux as occupied. Its trained model returns a score of
`0.6562567353248596`, which also means occupied at a decision threshold of
`0.5`.

Both policies are wrong on that reading. Checking their agreement would miss
the error. Comparing each prediction with the recorded label reveals it.

The following JavaScript reads the saved demonstration fixture. It applies two
thresholds to the same model score. Run it in a modern browser console or a
Node.js module:

```js
const response = await fetch(
  "https://tensorcraft.app/assignments/room-project-preview.json",
);
if (!response.ok) throw new Error(`Fixture HTTP ${response.status}`);
const saved = await response.json();

for (const threshold of [saved.threshold, 0.7]) {
  console.log({
    threshold,
    model: Number(saved.prediction.score >= threshold),
    lightRule: Number(saved.row.light >= saved.baseline.threshold),
    recordedLabel: saved.prediction.label,
  });
}
```

Here `1` means occupied and `0` means unoccupied. The recorded fixture produces:

| Threshold | Model decision | Light rule | Recorded label |
| --- | --- | --- | --- |
| 0.5 | 1 | 1 | 0 |
| 0.7 | 0 | 1 | 0 |

At `0.7`, the model decision matches this row's label. The score stays fixed.
That illustrates the decision rule. It supplies no evidence that `0.7` is a
useful threshold across the dataset. The score also has no established
probability calibration.

To choose a policy, compare the rule and model on the same validation rows.
Count false positives and missed occupancy, then apply the error costs the
application needs. Freeze the feature choices, preprocessing, model settings,
and threshold before evaluating a separate final test period. If you change
them after inspecting that period, you need fresh data for an independent
test.

The fixture comes from five fixed training epochs used to check Tensorcraft's
saved-model workflow. It is supplied maintainer work, separate from a learner's
project. Its hashes and reproduction commands identify the recorded artifacts.
One selected mistake cannot establish overall model quality.

The independent project starter contains 2,056 readings derived from
[Candanedo's Occupancy Detection dataset](https://doi.org/10.24432/C5X01N).
Tensorcraft sorted the source's 20,560 readings and kept every tenth row.
Values and labels remain unchanged. The source data uses
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and the
[modification record](https://tensorcraft.app/assignments/room-occupancy-v1/DATA-LICENSE.md)
documents the transformation. Nearby observations can remain related. One room
does not establish performance in other buildings.

You choose the features, chronological periods, model, threshold, and error
costs. The starter supplies export/reload helpers, metric arithmetic, and a
local browser application. It contains no trained solution. Keeping the simple
rule is a valid outcome if your evaluation supports it.

The [complete project case](https://tensorcraft.app/guides/browser-machine-learning-project)
lets you change the threshold and inspect the task, data, and supplied tools.
Tensorcraft sells Deep Orbit, the course connected to this project. Its first
five browser lessons are free without an account. The independent project
requires local setup. The
[learning path](https://tensorcraft.app/guides/javascript-machine-learning-learning-path)
explains how the lessons lead into this work.

## Curator pitch draft

Subject: A JavaScript ML example where a model and a rule agree and fail

Hi,

We're the group of JavaScript engineers behind Tensorcraft. We prepared an
interactive explanation of one recorded occupancy-classification mistake:

https://tensorcraft.app/guides/browser-machine-learning-project

A light rule and a TensorFlow.js model both flag an empty-room reading as
occupied. Readers can change the decision threshold while the saved score
stays fixed, then inspect why correcting one row cannot establish a useful
policy. The page includes JavaScript project files, the supplied fixture's
artifact hashes, reproduction commands, and dataset attribution.

If this fits your publication, the explanation is public and the starter is
downloadable. Tensorcraft sells the connected Deep Orbit course. Its first
five browser lessons are free without an account. The page identifies the
demonstration separately from learner work and limits the conclusions to the
recorded example.

Thanks,
Tensorcraft
