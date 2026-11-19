# SEO release distribution drafts

Updated November 14, 2026. **Unpublished and unsent. Outreach is paused.**
Keep this pack internal until the owner confirms that the main repository is
private again and explicitly instructs publication or contact. The existing
$200 monthly marketing budget does not authorize a placement, sponsorship or
purchase. This pack records no spend.

## Release status and publication checks

The November 12 release supplied runnable browser training with 1, 5 or 15
epochs, loss values, paired validation results and actual mistakes. The draft
below describes that released demonstration and the verified five-epoch
maintainer result. It does not claim learner outcomes.

The November 14 implementation adds a labelled reference table in initial
HTML, adjustable error costs and a standalone reproduction export. Those
changes are local release candidates. Verify their production responses and
behavior before using the optional post-release copy or claiming they are
available. Source review and local tests do not establish production release.

Before publishing or contacting anyone:

1. Confirm the privacy condition and the owner's explicit publication or
   recipient instruction.
2. Verify the canonical destination, article text, demo and referenced assets
   on the intended production release.
3. Run the five-epoch example and check the results against the labelled
   reference. Confirm the loss chart, mistake picker and error handling.
4. Verify any source package and notices anonymously. Use only the intended
   public evidence paths. This pack needs no link to the application repository.
5. Review screenshots and captions if they are added. No new still or video
   accompanies this pack. Existing teaser and campaign media remain separate.

## Canonical destinations and assets

| Destination                                                                   | Release state and purpose                                                                                                                                                                           |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| https://tensorcraft.app/guides/browser-machine-learning-project               | Published main destination. Supplied browser training, epoch choices, paired validation results and mistake inspection. The new static reference and cost controls still need release verification. |
| https://tensorcraft.app/demos/room-training.mjs                               | Published demonstration source. Identifies the fixed model, feature preparation, chronological periods and evaluation choices.                                                                      |
| https://tensorcraft.app/guides/javascript-machine-learning-learning-path      | Published learning path. Its new runtime selector is a local release candidate.                                                                                                                     |
| https://tensorcraft.app/guides/tensorflow-js-reshape-vs-transpose             | Published runnable TensorFlow.js example with exact sensor-excerpt outputs. Its data is authored fiction.                                                                                           |
| https://tensorcraft.app/compare                                               | Published comparison of learning options. The new Grider and Manning additions still need release verification.                                                                                     |
| https://tensorcraft.app/worlds/deep-orbit/foundations/introduction-to-tensors | First free lesson. Deep Orbit's first five lessons need no account.                                                                                                                                 |
| https://tensorcraft.app/assignments/room-project-preview.json                 | Published supplied maintainer fixture. The new standalone reproduction command is a local change until deployed.                                                                                    |
| https://tensorcraft.app/assignments/room-training-reference-v1.json           | Local release candidate. Versioned five-epoch maintainer metrics, periods, source hashes and limits.                                                                                                |
| https://tensorcraft.app/evidence/room-project-v1.zip                          | Local release candidate. Standalone reproduction tools and the supplied fixture, separate from the learner starter.                                                                                 |
| https://tensorcraft.app/evidence/room-project-v1/README.md                    | Local release candidate. Exact prerequisites, reproduction commands and separate browser check.                                                                                                     |
| https://tensorcraft.app/evidence/room-project-v1/manifest.json                | Local release candidate. Allowlisted export files and hashes.                                                                                                                                       |
| https://tensorcraft.app/assignments/room-occupancy-v1.zip                     | Published independent project starter. Requires Node.js 22+ and an initial dependency download. Contains no trained solution.                                                                       |
| https://tensorcraft.app/assignments/room-occupancy-v1/DATA-LICENSE.md         | Published data attribution, CC BY 4.0 terms, sampling details and source archive hash.                                                                                                              |

Keep the canonical fields below free of campaign parameters. The acquisition
convention at the end applies to selected links on external publications.

## DEV article draft

Suggested title: Comparing a TensorFlow.js model trained in the browser with a light rule

Suggested tags: javascript, machinelearning, tensorflow

Canonical article: https://tensorcraft.app/guides/browser-machine-learning-project

By Tensorcraft, a group of JavaScript engineers.

A model can improve overall accuracy while introducing a mistake that a
simple rule avoids. Our browser ML example makes that tradeoff inspectable:
train a supplied TensorFlow.js model, compare both policies on the same room
readings, then open an actual mistaken prediction.

The browser example offers 1, 5 or 15 training epochs. It records loss after
each epoch and compares the resulting model with a fixed light rule. An epoch
is one pass through the training examples. The light rule calls a room
occupied when its measured light is at least 100 lux.

### The same validation readings for both policies

The supplied five-epoch CPU run uses TensorFlow.js 4.22.0. It trains a single
sigmoid unit from temperature, light and CO2. The first 1,200 chronological
readings supply the fitted scaling values and model training. Both policies
then predict the next 400 validation readings. The final 456 readings remain
outside this comparison.

These are recorded maintainer results for that supplied setup:

| Validation outcome                          | Light rule | Model, five epochs |
| ------------------------------------------- | ---------- | ------------------ |
| Correct occupied                            | 61         | 60                 |
| Correct empty                               | 303        | 319                |
| False alarms                                | 36         | 20                 |
| Missed occupancy                            | 0          | 1                  |
| Correct predictions                         | 91%        | 94.75%             |
| Illustrative cost, false alarm 1 and miss 4 | 36         | 24                 |

A false alarm calls an empty room occupied. A miss calls an occupied room
empty. The model makes fewer false alarms and one additional miss. Its higher
accuracy does not determine which policy serves an application.

### The application's error costs

Suppose a false alarm costs 1 and a missed occupied reading costs 4. Applying
those illustrative costs to the recorded counts gives the rule a cost of 36
and the model a cost of 24. With a miss cost of 32, the model's cost becomes
52 while the rule stays at 36.

This JavaScript calculates those two scenarios from the recorded counts. It
does not train a model or change any prediction:

```js
const policies = {
  lightRule: { falseAlarms: 36, misses: 0 },
  model: { falseAlarms: 20, misses: 1 },
};

for (const missCost of [4, 32]) {
  console.table(
    Object.fromEntries(
      Object.entries(policies).map(([name, counts]) => [
        name,
        { cost: counts.falseAlarms + missCost * counts.misses },
      ]),
    ),
  );
}
```

Choose error costs from the task's consequences. These two values illustrate
how that choice changes the comparison. They are not measured financial
costs, and they do not establish a policy for another room.

### An actual mistake to inspect

The guide exposes up to eight mistaken validation readings from the current
browser run, with shared mistakes first. That selection is separate from the
full error counts above.

One recorded shared mistake has 271 lux of light and an unoccupied label.
The light rule calls it occupied. The supplied five-epoch model returns a
score of approximately 0.6563, which also means occupied at threshold 0.5.
Both policies are wrong on this reading. Their agreement alone would conceal
the mistake.

The guide also lets you change the decision threshold on this one saved
score. Correcting that row does not establish a useful threshold across the
dataset. A model score has no established probability calibration here.

### The data and the independent task

The example uses 2,056 readings derived from
[Candanedo's Occupancy Detection dataset](https://doi.org/10.24432/C5X01N).
Tensorcraft sorted the source's 20,560 readings and kept every tenth row.
Values and labels remain unchanged. The source data uses
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and the
[modification record](https://tensorcraft.app/assignments/room-occupancy-v1/DATA-LICENSE.md)
documents that transformation.

Nearby observations remain related. A validation result from one room does
not establish performance in another building. Inspecting validation results
helps choose a model. Keep the final test period separate from those choices.
Repeated tuning against that final period would require fresh independent
data for a later test.

The [public demonstration](https://tensorcraft.app/guides/browser-machine-learning-project)
needs no installation. Its supplied code defines the training setup.
The separate independent project asks you to choose features, periods, model,
threshold and error costs yourself. Its starter supplies export/reload
helpers, metric arithmetic and a local browser application. It requires
Node.js 22+ and an initial dependency download, and contains no trained
solution. Keeping a simple rule is a valid outcome when your evaluation
supports it.

Tensorcraft sells Deep Orbit, the course connected to this project. Its first
five browser lessons are free without an account. The
[learning path](https://tensorcraft.app/guides/javascript-machine-learning-learning-path)
explains how the lessons connect to this work. The supplied run above is
maintainer evidence, separate from a learner's independent result.

## Curator pitch draft

Subject: Runnable TensorFlow.js training with a rule comparison

Hi,

We're the JavaScript engineers behind Tensorcraft. We have a public browser
example that trains a small TensorFlow.js model and compares it with a light
rule on the same 400 validation readings:

https://tensorcraft.app/guides/browser-machine-learning-project

Readers choose 1, 5 or 15 epochs, inspect actual loss values and compare false
alarms with missed occupancy. A five-epoch supplied run reduces false alarms
from 36 to 20 and introduces one miss. The page lets readers inspect mistaken
readings and explains why accuracy alone cannot choose the policy.

The guide includes the data source, sampling record, training method and
limits of one room. The browser demonstration needs no installation. Its
separate independent project starter requires local setup and contains no
trained solution.

If this fits your publication, the example is available to readers without
an account. Tensorcraft sells the connected Deep Orbit course. Its first five
lessons are free. We identify the supplied demonstration separately from
learner work.

Thanks,
Tensorcraft

## Optional copy after the November 14 release

Keep this paragraph outside the article and pitch until the candidate URLs
and controls pass production verification. Then decide whether it belongs in
the final publication:

> The guide includes a versioned maintainer reference that you can read before
> running the model. After a run, you can change the illustrative costs of
> false alarms and missed occupancy while the predictions stay fixed. Its
> standalone reproduction download includes the supplied fixture, hashes and
> exact commands, with no application-repository checkout required.

Only add these links once their released contents match the paragraph:

- https://tensorcraft.app/assignments/room-training-reference-v1.json
- https://tensorcraft.app/evidence/room-project-v1.zip
- https://tensorcraft.app/evidence/room-project-v1/README.md
- https://tensorcraft.app/evidence/room-project-v1/manifest.json

## External acquisition conventions

Prepare these values now. Apply them only to the agreed external placement
after publication is authorized. They describe the link's source, not the
reader's identity or every influence on the visit.

| Field                   | Prepared convention                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical article field | `https://tensorcraft.app/guides/browser-machine-learning-project`, with no query parameters.                                                |
| `utm_source`            | `devto` for DEV. For another publisher, choose its actual name or hostname once the placement is known.                                     |
| `utm_medium`            | `referral` for the unpaid editorial placements described here. A future paid placement would need its own authorization and classification. |
| `utm_campaign`          | `browser-ml-project`. Keep this value consistent across this specific release's approved external links.                                    |
| `utm_content`           | The external link's placement, such as `article-main` or `resource-link`.                                                                   |

Prepared DEV acquisition URL:

`https://tensorcraft.app/guides/browser-machine-learning-project?utm_source=devto&utm_medium=referral&utm_campaign=browser-ml-project&utm_content=article-main`

Use the clean canonical URL in DEV's canonical field. Keep navigation between
Tensorcraft pages free of acquisition UTMs so it preserves the arrival source.
Report attributable visits, learning activity and purchases separately from
AI mentions or citations. AI tools do not always preserve a referrer, so
direct or unknown traffic cannot establish whether an AI answer influenced a
visit.
