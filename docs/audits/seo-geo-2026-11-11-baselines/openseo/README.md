# OpenSEO search baseline

Collected November 11, 2026 for `tensorcraft.app`. OpenSEO responded successfully.
The connected organization initially had no projects. This collection created the
no-credit [Tensorcraft project](https://app.openseo.so/p/83d1f46c-c0d8-44ab-966e-e9a343691c44).
After the owner connected Google, the collection selected the sole verified
property, `sc-domain:tensorcraft.app`. Successful evidence collection finished
at 11:23:55 Cairo time. The Search Console requests cover all countries and
devices, independently of the inherited project market.
Its inherited default market is United States, English (`2840/en`). The owner has
not confirmed that market as the reporting target.

## Available measurements

| Source | Observed setup | Baseline |
| --- | --- | --- |
| Google Search Console | Verified domain property selected, successful read | October 12 to November 8: 1 click, 70 impressions, 1.43% CTR, approximate average position 6.1. |
| Google Analytics 4 | Earlier check returned `ga4_not_connected` | GA4 sessions, key events, transactions and revenue unknown. No new GA4 request followed Search Console connection. |
| Rank tracking | No configurations | No recorded ranking baseline in this project. |
| AI visibility | `configured: false`, no prompts or recent runs | Brand mentions and owned-site citations unknown. |

The project contains no saved business context, competitors, key pages or
research log. PostHog supplies the provisional traffic and learning observations
in the [parent baseline](../README.md). Search clicks and consented browser
sessions measure different populations. This collection does not join search
queries to individual purchases.

## Connection history and remaining access

Google Search Console now reads successfully through
[OpenSEO search performance](https://app.openseo.so/p/83d1f46c-c0d8-44ab-966e-e9a343691c44/search-performance).
The connected Google account exposed one eligible property with owner access.
The collection selected it to complete the project binding. The saved binding
record omits the account identifier and email.

The optional [Google Analytics connection](https://app.openseo.so/p/83d1f46c-c0d8-44ab-966e-e9a343691c44/settings/integrations)
also needs an existing GA4 property. This collection does not establish whether
Tensorcraft already measures GA4 outside OpenSEO.

The earlier retry at 09:11:24 UTC (11:11:24 Cairo time) returned
`not_connected`. After the owner reported completion, a new request still
needed property selection. The collection then selected the verified domain
property and retrieved the data. Earlier failed responses remain historical
evidence. Representative URL Inspection and Bing evidence remain pending.

AI visibility needs an agreed prompt set, engines and market plus approval of
the priced collection before a paid check. Saving a new AI tracker enables
weekly paid checks. This collection created no rank or AI tracker and started
no paid checks.

## Reporting window and limits

The successful Search Console requests used October 12 through November 8,
2026, and September 14 through October 11, inclusive. Both 28-day windows use
Pacific Time, web search and `dataState=final`. Each daily response contains
28 dates with `hasMore=false`. All successful requests use a 1,000-row limit,
and none reports another page of results.

| Measure | October 12 to November 8 | September 14 to October 11 |
| --- | --- | --- |
| Clicks | 1 | 4 |
| Property impressions | 70 | 69 |
| CTR | 1.43% | 5.80% |
| Approximate average position | 6.1 | 6.5 |

Totals sum daily clicks and impressions. CTR divides total clicks by total
impressions. Average position weights each returned daily position by its
impressions and is approximate because the connector rounds positions.
Zero-impression dates contribute no weight. These are period averages, rather
than current live ranks. Four clicks followed by one cannot establish a
reliable trend or the effect of the November 11 release.

The connector rejects dimensionless queries. Current device and country
breakdowns independently reconcile to 1 click and 70 impressions. Google
supports dimensionless queries in its underlying API.
[Search Analytics API reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).

The current query table contains `deep orbit` (19 impressions), `deeporbit`
(1) and `tensorcraft` (4), all with zero disclosed clicks. It covers 24 of
70 property impressions and cannot identify the recorded click's term. Google
omits anonymized and some other query rows. The three disclosed terms cannot
establish broader technical search demand.
[Google query-report limits](https://support.google.com/webmasters/answer/17011259?hl=en).

The homepage has the sole recorded page click and 26 page impressions. The
Deep Orbit overview has 36 impressions, `/learn` has 14 and pricing has 9.
The 13 page rows sum to 124 page impressions. Google counts each URL separately
when grouping by page. Do not substitute that sum for the 70 property
impressions. The query/page mapping's four `tensorcraft` impressions for each
of the homepage and `/learn` do not establish harmful competition between them.
[Google aggregation rules](https://support.google.com/webmasters/answer/17011364?hl=en).

Devices contribute 41 desktop, 28 mobile and 1 tablet impressions. The sole
click is on desktop. The 25 country rows include 16 US impressions and the
sole click in Switzerland. These aggregate search populations cannot be joined
directly to PostHog's observed Egyptian browser visitors or individual payments.
No guide appears in this pre-release search window, which cannot establish
present indexing status. The GA4 property timezone remains unknown.

## Evidence files

- [Selected Search Console property](search-console-binding.json)
- [Calculated comparison and method](search-console-summary.json)
- [Current daily rows](search-console-current-daily.json)
- [Previous daily rows](search-console-previous-daily.json)
- [Current queries](search-console-current-query.json)
- [Previous queries](search-console-previous-query.json)
- [Current pages](search-console-current-page.json)
- [Previous pages](search-console-previous-page.json)
- [Current query/page mapping](search-console-current-query-page.json)
- [Current devices](search-console-current-device.json)
- [Current countries](search-console-current-country.json)
- [Initial project list](project-list.json)
- [Created project](project-create.json)
- [Project context](project-context.json)
- [Search Console connection response](search-console.json)
- [Search Console retry at 09:11:24 UTC](search-console-retry.json)
- [GA4 connection response](google-analytics.json)
- [Rank tracking setup](rank-trackers.json)
- [AI visibility setup and history](ai-visibility.json)

All calls used zero OpenSEO credits according to the tools' declared pricing.
The remote changes created the project and selected its verified Search
Console property. No content, tracking schedule, checkout attribution or
privacy setting changed.
