# Search and AI visibility follow-up, November 24, 2026

## Google inspection and requests

Search Console's smartphone live tests found the project guide and comparison
eligible for indexing. Stored Google index results, checked again after the
comparison request, showed the following. Crawl dates use UTC.

| Production path | Stored Google status | Last crawl | November 24 action |
| --- | --- | --- | --- |
| `/guides/browser-machine-learning-project` | Crawled, currently not indexed | Nov 23 11:09 | Inspected Google's live rendering. The stored crawl already postdates the November 14 release. |
| `/compare` | Indexed, matching canonical | Nov 24 13:51:58 | Initially discovered with no reported crawl. Google accepted the indexing request after the live test. A later inspection confirmed a successful crawl and indexing. |
| `/guides` | Indexed, matching canonical | Nov 11 12:20 | The new practice links passed production checks. Google accepted the refresh request on November 24 at 14:30 UTC. The immediate stored result still showed the November 11 crawl. |
| `/guides/javascript-machine-learning-learning-path` | Indexed, matching canonical | Nov 22 18:18 | Google has crawled the November 14 release. |
| `/learn` | Indexed, matching canonical | Nov 20 09:08 | Google has refreshed the page. |
| `/worlds/deep-orbit` | Indexed, matching canonical | Nov 23 06:13 | Google has refreshed the course page. |

The project guide's Google-rendered screenshot showed its heading and opening
explanation on mobile. Google reported HTTP 200 and one valid breadcrumb.
The one resource it could not load was a Sentry telemetry endpoint. The
initial production HTML also contains the five-epoch reference result and
validation table. Both the project guide and comparison have one self-canonical,
allow crawling, and appear in the sitemap. Six other sitemap pages link to
the project guide and 22 link to the comparison. These checks leave Google's
reason for excluding the project guide unresolved.

[Project guide live test](https://search.google.com/search-console/inspect?resource_id=sc-domain%3Atensorcraft.app&id=_vQ-DoZDvY3asofmJW7P9A&alt_id=FYItfVuRnOilg1RvXbHUSQ) and
[comparison live test](https://search.google.com/search-console/inspect?resource_id=sc-domain%3Atensorcraft.app&id=S3YZfZinvC8Uw-NOe9GcSA&alt_id=m2fIHWV2tf3_rTuy4dV0EA).

## Production release

Commit [`241828f4`](https://github.com/Amira-Rahim/tensorcraft/commit/241828f4e7b5b69703accb5b630f2268fa5bc841)
reached production at 14:06:59 UTC on November 24. All ten workspace typechecks
and 4,400 unit tests passed before the push, with 65 tests skipped.
All ten [GitHub CI jobs](https://github.com/Amira-Rahim/tensorcraft/actions/runs/45410275558)
passed. The [visual workflow](https://github.com/Amira-Rahim/tensorcraft/actions/runs/45410276009)
confirmed baseline files exist and skipped its two image comparisons.
The [release Lighthouse artifact](https://github.com/Amira-Rahim/tensorcraft/actions/runs/45410275765/artifacts/14928156765)
contains all twelve mobile reports. Median LCP on the GitHub runner's local
build was 5.31 s for Deep Orbit, 3.20 s for the comparison, and 3.24 s
each for the learning path and the project guide. Compare those figures
with future runs on the same runner setup.

The Lighthouse workflow now measures the Deep Orbit course, comparison,
learning path and project guide three times on pushes to `main` and on
manual runs. Pull requests keep their six existing checks and budgets.
The [mobile lab record](mobile-lab.md) has the four production baselines.
The course's bridge image accounted for its largest contentful paint on all
three runs. The release requests this one image eagerly at high priority.
The local production build served one image preload in the HTTP Link header.
Chrome made one request for the image. The matched simulation in the lab record
isolates the image attributes. On the deployed course, the same mobile lab
measured median LCP of 2.37 seconds, down from 5.07. The lab record includes
all three scored runs and one unscored attempt. Field performance remains open.

Keep PostHog and the session code out of this release's performance changes.
The lab found about 104 KiB and 50 KiB of unused JavaScript in the respective
chunks during signed-out loads. This supports testing a consent-triggered
PostHog import separately. The other three pages had median total blocking
time of 24 to 52 ms, and the runs did not test signed-in session recovery.
Measure both transfer and interaction delays and verify consent and
authenticated navigation before changing these shared imports.

The guides hub now links directly to the training demo, sensor prediction
and first graded JavaScript challenge. Each choice describes the result and
the page explains that all three work without a local install or account.
The local signed-out browser checks covered keyboard navigation in Chromium
and touch at 375 by 667 pixels in Chromium and WebKit. All three links had
at least 44 pixels of tap height, and the hub fit without horizontal scrolling.
The demo link landed with its heading in view. The training run produced 36
false alarms for the light rule and 20 for the model. The visual exercise
accepted the predicted second row. In Chromium, the grader rejected the
starter, accepted the two-line completion and exposed the sensor value 8
from the learner's run.

The local production build generated 104 pages. Both keyboard and mobile
Chromium tests passed again against that build. The guides hub, project guide
and course returned 200 with matching canonicals and allowed indexing.

At 14:34 UTC, the same three practice links passed the live Chromium desktop
keyboard, Chromium mobile touch and WebKit mobile touch checks. Each run used
a fresh signed-out session, declined analytics consent and marked the session
as internal. Training produced the expected error counts, the visual activity
graded the prediction correctly, and the graded editor opened with its test
button enabled. At 375 by 667 pixels each practice link had at least 44 pixels
of tap height, and the hub fit without horizontal scrolling.

### Recrawl assessment after deployment

The live guides hub returned 200 with one self-canonical, all three practice
links and no indexing exclusion. Both lesson entry points declared their
clean lesson canonicals. The project guide returned 200 and contained the
`#training` target. Google's [live test of the guides hub](https://search.google.com/search-console/inspect?resource_id=sc-domain%3Atensorcraft.app&id=OxfVpO0mdaxHUZlxcA0M0A&alt_id=BFv_qd3xa0ftnksLLYPW-g)
passed. Search Console confirmed that it added the hub to its priority crawl
queue. Recheck the project guide once Google sees that incoming link. Its
demo content and canonical URL remain the same.

Production served the bridge image with eager loading, high fetch priority and
an HTTP image preload. The image, course text and canonical stay the same,
so the loading change alone does not warrant a
repeat indexing request. The two free lessons gain incoming links to existing
entry points and retain their canonical content. The workflow, tests and
internal notes need no separate indexing request. The follow-up that records
these release results changes only internal documentation.

## Measurement after release

Final Search Console web data for November 15 through 21 (Pacific Time)
shows 24 property impressions and zero clicks. The page report shows one
impression for the guides hub and six for the learning path. Google can
count several pages from the property in one result, so use the daily
property report for totals. The week predates the new practice links.

For the next search comparison, record the release date and the next Google
crawl of each changed page. Compare the first 28 complete days after that
crawl with the preceding 28 complete days before release. Use the same
property, web search type, Pacific dates and final data in both windows.
Report clicks and impressions for each canonical URL alongside property
totals. Identify any days the project or comparison remained outside the
index. Small counts and differing crawl dates limit what a change can show.

The saved OpenSEO tracker still matches all 12 exact, neutral prompts and
their topics in the [original prompt list](../seo-geo-2026-11-11-baselines/geo/audit-plan-2026-11-11.json).
It uses US English, ChatGPT, Gemini and Google AI Overviews. The November 24
estimate for one repeat was 216 credits ($0.216) for 36 prompt and engine
pairs. Recurrence is off. The only collection is the [November 11 baseline](../seo-geo-2026-11-11-baselines/geo/README.md).

After the release and an observation window, obtain approval for a fresh
one-time quote. Preserve all 36 pairs and record answers, explicit no-answer
outcomes, upstream failures and pending results. Count brand mentions and
Tensorcraft citations separately over answered pairs, overall and by engine.
The baseline had 0/34 of each, with two failed AI Overview calls. Also compare
only the prompt and engine pairs answered in both runs. Record cited URLs so
a later reviewer can check which guide appeared.

Track consented guide-to-lesson clicks, arrivals and first submitted exercises
separately from search impressions and AI citations. Exclude internal and
test traffic. A demo run, a graded attempt and a purchase describe different
outcomes.
