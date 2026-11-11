# SEO and GEO execution checklist

Updated November 11, 2026. This is the single current work list. The
[audit record](audits/seo-geo-2026-11-10/README.md) preserves evidence,
corrections and verification limits. Main release `22cae183` is deployed. The
eight-file SEO follow-up was promoted at 12:49 UTC on November 11 and its
production deployment is ready. The
[account baseline](audits/seo-geo-2026-11-11-baselines/README.md) records
provisional PostHog traffic and measured Search Console performance. The
October 12 to November 8 search window has 1 click and 70 impressions. The
first GEO sample is complete. Verified commercial conversion remains unknown.

The [November 11 follow-up](audits/seo-geo-2026-11-11-baselines/openseo/indexing-followup.md)
adds 90-day search coverage and initial inspections of 15 URLs. Google has
since read the refreshed sitemap and accepted all five indexing requests.
All five requested URLs now have confirmed indexing and matching canonicals:
the hub, three guides and normalization. A
[real browser check](audits/seo-geo-2026-11-11-baselines/browser-followup.md)
verified the internal guide-to-attempt sequence and its exclusion from reports.
The video datetimes, immutable project-source links, November 11 project date
and lesson-arrival consent implementation are now deployed. The
[release checks](audits/seo-geo-2026-11-11-baselines/release/seo-followup-public-verification.json)
verify public metadata and source links. A narrow production browser check
also confirms late-consent event delivery. Google warning clearance remains
separate. The one-off GEO check returned 34 answers, two upstream failures and
zero no-answer results. OpenSEO recorded 0/34 Tensorcraft mentions and 0/34
own-site citations. Twenty-three Google redirect URLs remain unresolved, so
this is the provider's recorded result, not independently verified absence
from every destination. See the [private report](https://app.openseo.so/p/83d1f46c-c0d8-44ab-966e-e9a343691c44/reports/faddb2f6-fed3-4397-a0cc-992419c10721)
and [sample evidence](audits/seo-geo-2026-11-11-baselines/geo/findings-2026-11-11.json).
Recurrence is disabled. The approved cap was 216 credits ($0.216), and the
provider did not return the actual debit. This single sample establishes no trend.

The [consent and measurement release](audits/seo-geo-2026-11-11-baselines/deployment.md)
has applied migration 067 in production and passed all 15 catalog checks.
Protected API release 35 is live with both machines passing health checks.
Runtime settings match the existing PostHog project and EU host.
The web release is promoted and its public pages and assets pass HTTP checks.
Eight live API consent checks pass. The controlled browser check verifies
guide handoff, lesson arrival and prediction submission delivery in one SDK
session. Broader account-consent, withdrawal, exercise, module and server
payment checks remain pending.
The separate lesson-arrival and evidence-link implementation release is
complete. A browser accepted late consent at 12:55 UTC. PostHog confirms one
consent event, one pageview and one tensor-shapes arrival in the same SDK
session, all marked internal. No introduction arrival appears in the bounded
query. SPA navigation, withdrawal and signed-in persistence still need
browser coverage.

## Cleanup

Keep factual copy fixes, public sitemap selection, honest dates, indexing
controls, the shared publisher identity, generated source facts and the verified
guide. Remove handwritten audit parsers, arbitrary length warnings, simulated
bot-access claims, speculative empty-blog infrastructure and redundant plans.
Preserve the existing teaser and marketing work.

## Ordered work

| Item | Work | Status and completion evidence |
| --- | --- | --- |
| 1 | Supply video sitemap media URLs. | Deployed. Production video sitemap has one watch-page content_loc and working media. Secondary course trailers are not promoted as watch pages. |
| 2 | Render discoverable video without interaction. | Deployed initial video, poster and captions verified in production HTML. Local playback regressions pass. Real-browser playback remains pending. |
| 3 | Correct consent-aware session/pricing events. | Session/pricing fixes and the lesson_started follow-up are deployed. The latter observes the current visit after consent without replay or duplicate capture. The eight-file release passed 156 focused tests and web typechecking. Both consent-before-navigation and late-consent arrival reach PostHog. The late-consent check records one consent event, pageview and current lesson arrival in one internal SDK session, with no earlier introduction arrival in the bounded query. SPA navigation, withdrawal/reacceptance and account persistence still need browser coverage. |
| 4 | Track guide-to-lesson handoffs. | Verified in a production browser and PostHog: guide slug, canonical target and activity placement, followed by matching lesson arrival and submission in one SDK session. Internal filters exclude the test. |
| 5 | Define meaningful learning activity. | Defined in analytics-verification.md. The historical baseline has one incorrect assisted submission. A separate internal browser check delivered an incorrect unassisted prediction. Exercise and module-completion ingestion remain unverified. |
| 6 | Preserve acquisition attribution. | Pricing entryContext separates page context from acquisition. Internal blog UTMs removed. Local tests pass. |
| 7 | Define conversion reporting populations. | Reporting contract distinguishes consented cohorts, matched journeys, all payments/refunds and unknown source. |
| 8 | Review optional checkout source reporting. | Owner confirmed on November 10: keep disabled. No checkout or privacy activation. |
| 9 | Establish account baselines. | Partial. Search Console records 1 click and 70 impressions for October 12 to November 8. PostHog records 2 visitors, 45 sessions and 139 pageviews. Live event/host exclusions pass a controlled SDK check. Browser/payment/signup repairs are deployed. Consent migration 067 passes all 15 production catalog checks, and protected API release 35 passes health checks on both machines. PostHog runtime settings match the project and EU host. Eight live API consent checks and public web page/asset checks pass. One paid $50 checkout creation cohort reconciles with Stripe/Supabase. A real internal browser run verifies guide handoff, lesson arrival and prediction submission in one SDK session, excluded from reports. The first GEO sample returned 34 answers and two upstream failures, with zero no-answer results. OpenSEO recorded 0/34 mentions and own-site citations, subject to 23 unresolved Google redirect URLs. Broader account-consent/withdrawal QA, normal owner-browser marking, exercise/module/server-payment ingestion and Bing remain pending. See account baseline, measurement repair and deployment record. |
| 10 | Inspect rendered acquisition pages. | Desktop native-browser checks pass for the guide hub, reshape guide interaction, free lesson handoff, incorrect prediction feedback and retained practice record. Broader mobile/video/Challenge and account-consent QA remains pending after another active browser window interrupted DevTools work. |
| 11 | Inspect the internal link graph. | November 11 bounded crawl: all 23 public sitemap pages return 200. The guide hub is one link from the homepage. Three guides and normalization are two links away, with four to six referring pages each. All five target pages have initial HTML links, self-canonicals and no page-level indexing exclusions. The evidence does not cover private/query routes or rendered visibility. |
| 12 | Improve contextual lesson navigation. | Deployed. Production free-module footers have five canonical lesson links and one current item, after the reader. Breadcrumbs link directly through the course. |
| 13 | Stabilize the guide registry. | Deployed slug lookup and per-guide summaries, without a publishing framework. |
| 14 | Establish campaign canonical ownership. | Main mirror now returns 200 with the published campaign host as canonical/OG owner. The campaign host returns 200 but still lacks the source canonical tag. Its separate release remains pending. |
| 15 | Establish current mobile performance. | Post-release mobile PSI retry on November 11 returned 429 again. Field/lab performance remains unknown. Compiled-byte evidence is in the audit record. |
| 16 | Fix measured performance bottlenecks. | Lazy public Exercise boundary deployed. Local exact comparison: 26 to 24 initial scripts, 28.03% fewer summed gzip bytes on two free lessons. Production confirms 24 initial scripts without detected editor signatures. Browser/field verification remains pending. |
| 17 | Create a JavaScript ML learning path. | Deployed learning path with curriculum counts, prerequisites, three goals, outputs and tracked free links. Production canonical/OG and content checks pass. |
| 18 | Publish the reproducible project case. | Project case and immutable code links are deployed. Five production artifact URLs return 200 and recorded fixture/source checks pass. Public HTML now exposes three pinned reproduction links, the visible November 11 update and matching Article metadata. Interactive browser check remains pending. |
| 19 | Repair the sourced course comparison. | Sourced comparison deployed. Named primary sources and observable criteria replace unsupported competitor claims. Local tests pass. |
| 20 | Connect acquisition assets. | Acquisition crosslinks deployed. Guides, case, comparison, About, free module and pricing are connected; new lesson handoffs use existing tracking. |
| 21 | Make technical credibility inspectable. | Recorded fixture and checked examples deployed. Three reproduction files are verified anonymously at the pinned commit, and the fixture hash matches. The released case links directly to all three sources. No learner outcomes invented. |
| 22 | Verify release and prepare deployment. | Main 22cae183 pushed/deployed after normal hooks (4,258 passed, 65 skipped). All remote CI jobs and visual regression pass, including 307 browser tests (38 skipped). The later eight-file SEO follow-up deployed from isolated source at 12:49 UTC after 156 focused tests, web typechecking, migration checks and a 104-page production build. Public metadata/source-link checks pass and deployment readiness is confirmed. The release manifest records the deployed source. |
| 23 | Verify production search behavior. | Google read the resubmitted sitemap successfully: 23 pages and one video. All five requested URLs passed the live test or submission preflight, and Google accepted their indexing requests. The 12:41 UTC inspection confirms the hub, three guides and normalization indexed with successful mobile crawls and matching canonicals. All 23 public sitemap pages pass HTTP checks. Corrected video datetimes are live. Google recrawl/warning clearance, Bing indexing and crawler logs remain pending. |
| 24 | Prepare distribution. | Unpublished DEV article and curator pitch prepared in marketing/seo-release-drafts.md. Main release URLs now return 200. No outreach or external publication; campaign-owner metadata release remains pending. |
| 25 | Review outcomes before expanding. | First GEO sample complete with provider attribution limits. The canonical backlog records bounded improvements to the existing project guide and course comparison. Live acquisition/learning outcomes remain pending. Keep citations separate from visits and purchases. |

## Verification

Run focused behavior tests, web typecheck and the production build. Use the
HTTP audit only for its narrow response checks:

```bash
node --test scripts/seo-audit.test.mjs
node scripts/seo-audit.mjs --origin https://tensorcraft.app --output /tmp/tensorcraft-seo.json
```

After release, inspect the homepage, pricing, Deep Orbit, guides and all five
free lessons in Search Console. Record selected canonicals, rendered content
and indexing decisions. Compare available query/page/device/country exports.
Use landing-page cohorts for learning outcomes. Aggregate search queries do
not identify individual purchase journeys.

Preserve the video-led `/learn` page and shared story-first lessons. Keep
future worlds labeled coming soon. Publish complete, verified answers without
fabricated author credentials, learner outcomes, ratings or traffic estimates.
