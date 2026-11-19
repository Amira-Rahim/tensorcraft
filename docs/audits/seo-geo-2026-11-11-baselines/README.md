# Tensorcraft acquisition baseline

Collected November 11, 2026 through PostHog and OpenSEO. PostHog supplies a
provisional traffic baseline. The connected Search Console property supplies
the search baseline below. The first GEO sample is complete, with its coverage
limits below. Verified purchase reporting remains incomplete. This is a
one-off analysis, with no saved metric definition.

Later November 11 checks extend this record: the
[indexing follow-up](openseo/indexing-followup.md) covers 15 URLs and a 90-day search
window. The [browser follow-up](browser-followup.md) verifies a real internal
guide click, matching lesson arrival and submitted prediction in one SDK
session. Project filters exclude all three test events. Remaining account,
withdrawal and server-event checks stay open.

The later indexing action resubmitted the current sitemap and obtained five
accepted Google indexing requests. Google now reports 23 sitemap pages and
one video. A new inspection completed at 12:41 UTC confirms all five URLs
indexed with successful mobile fetches and matching canonicals.
See the [confirmation](openseo/indexing-followup.md#all-five-urls-indexed).

The eight-file SEO follow-up was promoted at 12:49 UTC and its production
deployment is ready. It releases the lesson-arrival consent implementation,
verified video timestamps and three immutable reproduction links. Public
checks confirm those video dates, the source links, the project's visible
November 11 date, matching Article metadata and sitemap date. The release
passed 156 focused tests across ten files, web typechecking, migration checks
and a 104-page production build.
[Build evidence](release/seo-followup-build.json),
[public verification](release/seo-followup-public-verification.json).
A browser accepted late consent at 12:55 UTC. A settled PostHog read confirms
one consent event, pageview and current tensor-shapes arrival in one internal
SDK session. No introduction arrival appears in the bounded query.
[Late-consent delivery evidence](posthog/browser-late-consent-verification.json).
SPA navigation, withdrawal/reacceptance and signed-in persistence still need
browser coverage. Google video-warning clearance still requires a recrawl.

The main window is October 12 through November 8, 2026, inclusive. PostHog uses
UTC. The Search Console window uses the same calendar dates in Pacific
Time, so the boundaries differ. The three-day search reporting lag motivated
the end date. This window precedes the November 11 release and cannot measure
its effect. November 9 and 10 appear separately below.

## Observed traffic

Source: [PostHog EU project 257980](https://eu.posthog.com/project/257980/web),
named `Default project`. Its actual pageview host is `tensorcraft.app`.
Queries restrict browser events to that exact host and request configured
test-account exclusions. The project contains no governed metrics.

| Measure | October 12 to November 8 | Evidence |
| --- | --- | --- |
| Observed visitors | 2 | [Overview](posthog/traffic-overview.json) |
| SDK sessions | 45 | Overview |
| Pageviews | 139 | Overview and [daily series](posthog/traffic-daily.json) |
| Bounce rate | 24.44% | Overview |
| Mean session duration | 1,096.53 seconds, about 18 minutes 17 seconds | Overview |
| Direct sessions | 44 | [Session channel breakdown](posthog/channel-sessions.json) |
| Organic Social sessions | 1 | Session channel breakdown |
| Recorded Organic Search sessions | 0 in the returned channel breakdown | Session channel breakdown |
| Guide pageviews and guide landings | 0 in the complete returned path tables | [Pages](posthog/traffic-Page.json) and [landing pages](posthog/traffic-InitialPage.json) |

The configured [internal/test cohort](https://eu.posthog.com/project/257980/cohorts/221371)
contains zero people. It matches the person property `$internal_or_test_user`.
The last calculation was November 10 at 18:13 UTC. Requesting test-account
exclusions therefore does not establish that these are external visitors.
These numbers include any unmarked owner or test activity. They cannot support
an external acquisition or commercial conversion rate.
[Settings](posthog/project-settings.json), [cohort evidence](posthog/internal-cohort.json).

PostHog attributes 138 pageviews to Direct and one to `t.co` / Organic Social.
Direct can include missing attribution. It does not establish that someone
typed the URL. One desktop visitor accounts for 138 pageviews, and one mobile
visitor accounts for one. The country table places both visitors in Egypt.
Visitor counts across landing pages overlap and must not be added.
[Referrers](posthog/traffic-InitialReferringDomain.json),
[devices](posthog/traffic-DeviceType.json), [countries](posthog/traffic-Country.json).

The most viewed paths are introduction-to-tensors (35), tensor-shapes (35),
the homepage (32) and the Deep Orbit overview (13). The page table returns
19 paths within a 25-row limit, and their views sum to all 139 pageviews.
The landing table returns five paths. Neither contains a guide.

All 139 pageviews classify as `Regular` under PostHog's current detection.
This classification cannot identify unmarked internal browsers or establish
the absence of crawlers. Browser analytics misses crawlers that never execute
its JavaScript. No crawler-log baseline was collected.
[Traffic classification](posthog/pageview-traffic-types.json).

The separate November 9 to 10 window contains 2 visitors, 3 sessions and
4 pageviews. The visitor populations may overlap with the main window.
[Recent overview](posthog/recent-traffic-overview.json).

## Observed activity and conversion limits

Browser capture covers consented activity. Custom `session_started` intervals
differ from SDK sessions. These counts use the production host and configured
test-account exclusions, subject to the empty-cohort limitation above.

| Recorded event | Events | Unique persons over the full window | Interpretation |
| --- | --- | --- | --- |
| `lesson_started` | 30 | 1 | Arrivals, with historical consent coverage limits. |
| `lesson_completed` | 10 | 1 | Recorded progression, including possible repeated completions. |
| `experiment_submitted` | 1 | 1 | One submitted answer for tensor-shapes. |
| `pricing_page_viewed` | 2 | 1 | Pricing activity. |
| `checkout_started` | 1 | 1 | Checkout choice, without settlement evidence. |
| `signup_completed` | 204 | 1 | Repeated sign-in callbacks can emit this event. New registrations remain unknown. |
| `payment_completed` | 2 | 1 | Browser confirmation events. Verified payments remain unknown. |

Sources: [event totals](posthog/activity-totals.json),
[period-unique persons](posthog/activity-users.json),
[payment-event counts](posthog/payment-client-totals.json).

The one experiment submission has `correct=false` and `assisted=true`.
It supplies no successful unassisted answer.
[Outcome breakdown](posthog/experiment-outcomes.json).

An ordered, person-level, one-hour funnel finds one pricing visitor who then
starts checkout, about five seconds later. A separate funnel finds one
tensor-shapes arrival followed by a submission for that same lesson, about
23 minutes 33 seconds later. Each native funnel reports 1 of 1. These tiny,
potentially internal populations cannot establish a market conversion rate.
The learning funnel does not require the same SDK session and is separate
from the guide-to-attempt reporting contract.
[Pricing funnel](posthog/pricing-checkout-funnel.json),
[learning funnel](posthog/shapes-arrival-submission-funnel.json).

The two payment records occurred on October 14, about two minutes apart.
Both use `$lib=web`, report amount 50 and plan `single`. The current payment
property schema exposes no checkout `sessionId`. The source can emit browser
confirmation again when someone revisits a receipt. Summing these amounts
would not establish $100 of revenue or two purchases. No server settlement
record appears in this bounded inspection. Payment records and server-event
delivery still need reconciliation. Refund totals and net revenue remain
unknown.
[Sanitized payment inspection](posthog/payment-record-inspection.json),
[source findings](instrumentation-notes.md#payment-and-refund-counts).

The October 12 to November 10 event census contains no
`free_lesson_cta_clicked`, `exercise_attempted`, `exercise_completed`,
`module_completed` or `payment_refunded`. Their ingestion coverage was
unverified in that census. Their absence cannot establish zero real attempts, module
completions or refunds. A guide-to-attempt rate has no observed guide-session
denominator and remains unavailable.
[Event freshness](posthog/event-freshness.json).
The later [controlled browser check](browser-followup.md) verifies
`free_lesson_cta_clicked`, `lesson_started` and `experiment_submitted` delivery
in one SDK session. The internal test is excluded from acquisition reports.
Exercise, module-completion and refund ingestion remain unverified.

The later [measurement repair](measurement-fix.md) enables live internal
filters and ships browser/server corrections. Migration 067 is now
applied in production, with all 15 catalog checks passing. Protected API release
35 is deployed and both machines pass health checks. Runtime settings match
the existing PostHog project and EU host. The web release is
promoted, public pages and assets pass HTTP checks, and eight live API consent
checks pass. The later controlled browser check verifies guide handoff,
lesson arrival and prediction submission delivery. Broader account-consent,
withdrawal, exercise, module and server payment checks remain open alongside
the [deployment record](deployment.md).
A read-only Stripe and Supabase check verifies one paid $50 checkout in the
same UTC checkout
creation cohort. This does not establish settlement-date revenue or source
attribution. Server payment and refund events still need production delivery
verification. The historical observations above remain intact.

## Search and AI visibility

OpenSEO was connected but had no project. This collection created a no-credit
[Tensorcraft project](https://app.openseo.so/p/83d1f46c-c0d8-44ab-966e-e9a343691c44)
for `tensorcraft.app`. It inherited United States / English as its default
market. The owner has not confirmed that target market.

After the owner connected Google, the sole verified property
`sc-domain:tensorcraft.app` was available but unselected. This collection
linked it to Tensorcraft and retrieved web-search data with `dataState=final`.
The request covers all countries and devices. OpenSEO's inherited US market
does not restrict this unfiltered Search Console report.

| Search measure | October 12 to November 8 | September 14 to October 11 |
| --- | --- | --- |
| Clicks | 1 | 4 |
| Property impressions | 70 | 69 |
| CTR | 1.43% | 5.80% |
| Approximate average position | 6.1 | 6.5 |

Both daily responses return 28 dates with `hasMore=false`. Summed daily clicks
and impressions supply the headline totals. Current device and country totals
independently reconcile to 1 click and 70 impressions. CTR uses total clicks
divided by total impressions. Average position weights each returned daily
position by impressions and is approximate because the connector rounds its
positions. It describes the reporting period, rather than a current live rank.
The change from four clicks to one is too small to establish a reliable trend.
[Calculated summary](openseo/search-console-summary.json),
[current daily rows](openseo/search-console-current-daily.json),
[previous daily rows](openseo/search-console-previous-daily.json).

The current query table exposes only `deep orbit` (19 impressions),
`deeporbit` (1) and `tensorcraft` (4), all with zero disclosed clicks.
It accounts for 24 of the 70 property impressions and cannot identify the
recorded click's query. Google omits anonymized and some other query rows from
the table. This sample cannot establish broader technical search demand.
[Query evidence](openseo/search-console-current-query.json),
[Google query-report limits](https://support.google.com/webmasters/answer/17011259?hl=en).

The homepage has the sole recorded page click and 26 page impressions.
The Deep Orbit overview has 36 impressions and no clicks, while `/learn` has
14 and no clicks. The page table returns 13 URLs and 124 page impressions.
Google counts each URL separately in a page breakdown, so that total differs
from the 70 property impressions.
[Page evidence](openseo/search-console-current-page.json),
[Google aggregation rules](https://support.google.com/webmasters/answer/17011364?hl=en).

`tensorcraft` appears for both the homepage and `/learn`, with four page
impressions each. That small overlap does not establish harmful competition
between the pages or justify changing their purposes. No guide appears in this
pre-release window, which cannot establish its present indexing status.
[Query-to-page mapping](openseo/search-console-current-query-page.json).

Devices contribute 41 desktop, 28 mobile and 1 tablet impressions. The sole
click is on desktop. The country table returns 25 countries, including 16 US
impressions and the sole click in Switzerland. These aggregate search
populations differ from PostHog's consented browser population. The reports do
not identify an individual purchase path or establish an ingestion failure.
[Device evidence](openseo/search-console-current-device.json),
[country evidence](openseo/search-console-current-country.json).

GA4 also requires connection. PostHog supplies the traffic observations above.
The initial OpenSEO inventory contained no rank tracker or AI visibility
history. The first one-off GEO check is complete: 34 answered observations,
two upstream failures and zero no-answer results. OpenSEO recorded 0/34
Tensorcraft mentions and 0/34 own-site citations. Twenty-three Google redirect
URLs remain unresolved, so this records the provider's attribution rather
than independently verifying every destination. The failures do not count
as brand absence. This single sample establishes no trend, visits or purchases.
See the [private report](https://app.openseo.so/p/83d1f46c-c0d8-44ab-966e-e9a343691c44/reports/faddb2f6-fed3-4397-a0cc-992419c10721)
and [sample evidence](geo/findings-2026-11-11.json).
Live tracked ranks and Bing property access remain pending. The later
[initial 15-URL inspection](openseo/indexing-followup.md) recorded eight indexed pages, four
guide URLs unknown to Google, one discovered but unindexed normalization
lesson and two expected www redirects. After the accepted requests, the
[12:41 UTC follow-up](openseo/indexing-followup.md#all-five-urls-indexed)
confirms all five target URLs indexed. Current HTTP checks confirm that
normalization and tensor-operations return 200 with self-canonicals.
[OpenSEO findings and raw evidence](openseo/README.md).

## Remaining baseline gates

1. Obtain Bing property evidence. All five requested Google URLs are indexed,
   and representative Search Console inspection is complete. The 90-day
   extension records 9 clicks and 383 property impressions
   for August 11 through November 8. All search windows precede the release.
   Query-row sums do not establish property totals or individual purchase
   attribution.
2. Mark owner browsers using the released browser marker. Live project
   exclusions now work for marked events, including the controlled diagnostic.
   Historical unmarked owner traffic remains unclassified.
3. The controlled browser check verifies guide handoff and experiment submission
   ingestion. Verify exercise, free-module and server payment ingestion. Separate
   browser confirmations, settled cash checkouts, test payments and zero-dollar
   grants. One paid checkout creation cohort now reconciles with Stripe and
   Supabase. Verify production delivery and complete refund reporting before
   calculating conversion or net revenue.
4. Collect a later cohort after the release and instrumentation verification.
   The first GEO sample supports two bounded improvements to the existing
   project guide and course comparison. Their validation gates live in the
   [canonical backlog](../../post-launch-backlog.md#seo-and-geo-release-verification-2026-11-10).

The search baseline and indexing reads spent zero OpenSEO credits. The
completed GEO collection had an approved cap of 216 credits ($0.216). The
provider did not return the actual debit. Recurrence remains disabled.
The later SEO follow-up release publishes the reviewed metadata,
source links and lesson-arrival implementation. It does not activate the
optional checkout-source question. The execution checklist and canonical
backlog retain the unfinished baseline work.
