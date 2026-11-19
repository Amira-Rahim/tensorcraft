# Search indexing follow-up

Collected November 11, 2026 through the existing OpenSEO project and verified
`sc-domain:tensorcraft.app` property. Connector reads used zero credits.
The later Search Console actions below resubmitted the sitemap and requested
indexing for five URLs. Earlier evidence in this directory remains unchanged.

Latest status at 12:41 UTC: all five submitted URLs are indexed. The
[confirmation](#all-five-urls-indexed) follows the initial snapshots below.

## Initial Google indexing decisions

Stored URL Inspection results cover 15 URLs: eight indexed pages, four URLs
unknown to Google, one discovered page awaiting indexing and two expected
`www` redirects. The sample covers the homepage, pricing, Learn, Deep Orbit,
all five free lessons, the guide hub, all three guides and two host variants.
Uninspected URLs and Bing coverage remain unknown. Inspection reads Google's
stored version. It does not run a live crawl or request indexing.

| URL path or variant | Google state | Stored crawl date (UTC) |
| --- | --- | --- |
| `/` | Submitted and indexed | November 11 |
| `/pricing` | Submitted and indexed | September 2 |
| `/learn` | Submitted and indexed | October 26 |
| `/worlds/deep-orbit` | Submitted and indexed | November 5 |
| `/worlds/deep-orbit/foundations/introduction-to-tensors` | Submitted and indexed | October 25 |
| `/worlds/deep-orbit/foundations/tensor-shapes` | Submitted and indexed | November 2 |
| `/worlds/deep-orbit/foundations/tensor-operations` | Submitted and indexed | August 24 |
| `/worlds/deep-orbit/foundations/data-loading` | Submitted and indexed | October 4 |
| `/worlds/deep-orbit/foundations/normalization` | Discovered, currently not indexed | None returned |
| `/guides` | URL is unknown to Google | None returned |
| `/guides/tensorflow-js-reshape-vs-transpose` | URL is unknown to Google | None returned |
| `/guides/javascript-machine-learning-learning-path` | URL is unknown to Google | None returned |
| `/guides/browser-machine-learning-project` | URL is unknown to Google | None returned |
| `www.tensorcraft.app/` | Page with redirect to the non-www canonical | November 1 |
| `www.tensorcraft.app/learn` | Page with redirect to the non-www canonical | September 20 |

The eight indexed pages show successful fetching and allow crawling and
indexing. Google selected each page's own canonical URL. Seven also return
matching declared canonicals. Tensor Operations has no declared canonical
in its August 24 snapshot. A November 11 public HTTP check confirms that
the current page declares its own canonical, so this old snapshot does not
establish a current canonical defect.

Normalization appears in Google's sitemap and referring-URL fields but has
no recorded crawl. The guide hub and three new guides have no stored crawl
or canonical decision. These are discovery and indexing gaps. Their states
do not establish a robots restriction or content-quality rejection.
The [current HTTP check](live-lesson-indexability-2026-11-11.json) confirms
that Normalization and Tensor Operations return 200, declare their own
canonicals and contain one H1. Neither response has a robots meta tag or
`X-Robots-Tag` header. These response checks do not replace Google's live
eligibility test or verify rendered content.

The cached Learn and Deep Orbit results warn that video `uploadDate` has an
invalid datetime and lacks a timezone. Their overall rich-result verdicts
pass. Both crawls predate the release. A separate source check confirmed
date-only video timestamps, and the local timestamp correction still needs
release verification. Historical `www` search rows do not establish a
current duplicate-host problem because both inspected variants now show
the expected redirect and non-www canonical in Google's stored results.

Evidence: [core pages and guides](url-inspection-core-2026-11-11.json) and
[pricing, remaining free lessons and host variants](url-inspection-lessons-hosts-2026-11-11.json).
Each response includes its Google inspection link.

## Live discovery checks

A bounded public HTTP crawl finished at 12:17 UTC on November 11. All 23
pages in the live sitemap returned 200. The guide hub, three guides and
Normalization each declared their own canonical, contained one H1 and
included content in the initial HTML. Robots rules permit their paths,
and none returned a robots meta directive or `X-Robots-Tag` header.

The guide hub is one link from the homepage. The three guides and
Normalization are two links away within the inspected graph. Normalization
has links from six other inspected pages: the course overview, the other
four free lessons and the learning path. Each guide has four or five
referring pages. These checks found no orphan page, access restriction or
canonical defect requiring a code change.

The [readiness evidence](indexing-readiness-2026-11-11.json) records exact
URLs, responses and initial HTML links. It does not execute JavaScript,
verify rendered visibility or establish Google's live eligibility verdict.

## Google submission and first results

Search Console last read the canonical sitemap on November 6, before the
guide release. It reported 19 discovered pages and no videos. On November 11,
the owner-account submission succeeded. Google then reported a successful
November 11 read with 23 pages and one video.

The guide hub passed a separate Google live test with an available URL and
an indexable page. The other four URLs ran the live eligibility preflight
inside Request indexing. Google accepted all five requests and confirmed
their addition to its priority crawl queue. No code repair was necessary.

| URL | Submission | Stored status at 12:23 UTC |
| --- | --- | --- |
| `/guides` | Accepted | Submitted and indexed, crawl 12:20:24 UTC |
| `/guides/tensorflow-js-reshape-vs-transpose` | Accepted | Submitted and indexed, crawl 12:21:45 UTC |
| `/guides/javascript-machine-learning-learning-path` | Accepted | Discovered, currently not indexed |
| `/guides/browser-machine-learning-project` | Accepted | Unknown, no recorded crawl |
| `/worlds/deep-orbit/foundations/normalization` | Accepted | Unknown, no recorded crawl |

Both newly indexed pages return successful mobile crawls, allow indexing
and have matching declared and Google-selected canonicals. Normalization's
immediate API snapshot differs from its earlier discovered state and the UI
read before submission. This does not establish a new technical failure.
Its accepted submission and its pending index result are separate facts.

A check at 12:25 UTC confirmed Google fetched the project guide
successfully at 12:24:09 UTC. It reports crawled, currently not indexed.
Normalization reports discovered again, while the learning path reports
unknown. These immediate snapshots differ. The three URLs
still needed a confirmed indexing decision at that point. The evidence
retains both reads.

Evidence: [observed UI confirmations](google-indexing-submissions-2026-11-11.json)
and [the first post-submission inspection](url-inspection-after-submission-2026-11-11.json).
The JSON preserves exact URLs, inspection links and the connector response.
It excludes account identifiers and browser screenshots.

Google controls the remaining crawl and indexing decisions. Repeated requests
do not move a URL forward in the queue. A request can take days or weeks and
does not guarantee inclusion.
[Google recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

## All five URLs indexed

A new inspection completed at 12:41:04 UTC on November 11 confirms all five
submitted URLs are now indexed: the guide hub, reshape guide, learning path,
project guide and Normalization. Every result reports a successful mobile
crawl, permitted crawling and indexing, and matching declared and
Google-selected canonicals.

The learning path's recorded crawl is 12:25:32 UTC, the project guide's is
12:24:09 UTC and Normalization's is 12:25:33 UTC. The hub and reshape guide
retain their 12:20:24 and 12:21:45 UTC crawl times. This closes the five
observed indexing gaps. It does not establish search traffic, ranking gains
or AI citations.
[Exact confirmation](url-inspection-all-five-indexed-2026-11-11.json).

## Local video timestamp repair

The local correction records the first successful production deployment of
each film. Google's `uploadDate` definition requires the original publication
date and time and recommends a timezone.
[VideoObject documentation](https://developers.google.com/search/docs/appearance/structured-data/video#video-object).

- Introduction: `2026-11-09T19:44:03Z`, from
  [deployment 7664276496](https://api.github.com/repos/Amira-Rahim/tensorcraft/deployments/7664276496/statuses),
  commit `1fd61a4e`.
- Deep Orbit: `2026-08-29T14:31:46Z`, from
  [deployment 6156720039](https://api.github.com/repos/Amira-Rahim/tensorcraft/deployments/6156720039/statuses),
  commit `e1a869e7`.

Source comments preserve those deployment references. All 23 focused video,
Learn and sitemap tests and the web typecheck pass. The current public HTTP responses
still carry date-only values. The correction remains local and uncommitted,
and Google warning clearance requires deployment and a subsequent recrawl.

## Expanded search baseline

The new 90-day requests cover August 11 through November 8, 2026. They use
finalized web-search data, all countries and devices, and Pacific Time
(`America/Los_Angeles`). Daily, page, query, query/page, country and device
responses all exhaust pagination. The daily response contains 90 dates.

| Window | Clicks | Property impressions | CTR | Approximate average position |
| --- | ---: | ---: | ---: | ---: |
| August 11 to November 8 | 9 | 383 | 2.35% | 35.0 |
| October 12 to November 8 | 1 | 70 | 1.43% | 6.1 |
| September 14 to October 11 | 4 | 69 | 5.80% | 6.5 |

The existing same-day [28-day baseline](README.md#reporting-window-and-limits)
supplies the latter two rows. Country and device totals independently
reconcile with daily totals in all three windows. CTR divides total clicks
by impressions. Average position weights each daily position by impressions
and is approximate because the connector rounds row positions.

The 90-day query table exposes 25 queries, one click and 108 impressions.
Google omits anonymized and some other query rows, leaving eight clicks
without a disclosed query. The page table has 23 rows and 494 impressions
because it counts URLs separately. Property impressions remain 383.

The sole disclosed query click was `grid terra`, leading to the coming-soon
Terra Grid page. Visible JavaScript ML terms mainly map to historical
`www.tensorcraft.app/learn` rows at average positions 55 to 88, with few
impressions per term. These weak signals cannot justify a broad content
expansion. All reporting windows end before the November 11 release, so
they cannot establish its effect. Search clicks, consented PostHog visits,
AI citations and payments remain separate reporting populations.

## Next verification

All five submitted URLs now have confirmed indexing. No further indexing
request is needed for these unchanged pages. Release and
verify the separate video timestamp correction before rechecking its
rich-result warnings. A complete post-release window is needed before
reviewing acquisition outcomes.

## Added evidence

- Ninety-day [daily](search-console-90day-daily.json),
  [pages](search-console-90day-page.json),
  [queries](search-console-90day-query.json),
  [query/page mapping](search-console-90day-query-page.json),
  [countries](search-console-90day-country.json) and
  [devices](search-console-90day-device.json).
- Previously missing September 14 to October 11
  [query/page mapping](search-console-previous-query-page.json),
  [countries](search-console-previous-country.json) and
  [devices](search-console-previous-device.json).

Every added performance file records exact requests and responses. Existing
current-period files were reused without duplication. No report contains
account emails, credentials or person-level analytics.
