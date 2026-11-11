# SEO and GEO execution checklist

Updated November 11, 2026. This is the single current work list. The
[audit record](audits/seo-geo-2026-11-10/README.md) preserves evidence,
corrections and verification limits. Main release `22cae183` is deployed. The
lesson-arrival consent follow-up remains local. The
[account baseline](audits/seo-geo-2026-11-11-baselines/README.md) records
provisional PostHog traffic and measured Search Console performance. The
October 12 to November 8 search window has 1 click and 70 impressions. AI
citations and verified commercial conversion remain unknown.

The [consent and measurement release](audits/seo-geo-2026-11-11-baselines/deployment.md)
has applied migration 067 in production and passed all 15 catalog checks.
Protected API release 35 is live with both machines passing health checks.
Runtime settings match the existing PostHog project and EU host.
The web release is promoted and its public pages and assets pass HTTP checks.
Eight live API consent checks pass. Full browser runtime and live ingestion
verification remain pending.
This does not close the separate lesson-arrival or evidence-link follow-ups.

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
| 3 | Correct consent-aware session/pricing events. | Session/pricing fixes deployed. A further local lesson_started fix observes the current visit after consent without replay or duplicate capture. 173 focused tests and web typecheck pass; follow-up release and live ingestion remain pending. |
| 4 | Track guide-to-lesson handoffs. | Local tests verify guide ID, canonical target and placement. Existing callers retain their payloads. |
| 5 | Define meaningful learning activity. | Defined in analytics-verification.md. Account baseline observes one incorrect assisted experiment submission. Exercise and module-completion ingestion remain unverified. |
| 6 | Preserve acquisition attribution. | Pricing entryContext separates page context from acquisition. Internal blog UTMs removed. Local tests pass. |
| 7 | Define conversion reporting populations. | Reporting contract distinguishes consented cohorts, matched journeys, all payments/refunds and unknown source. |
| 8 | Review optional checkout source reporting. | Owner confirmed on November 10: keep disabled. No checkout or privacy activation. |
| 9 | Establish account baselines. | Partial. Search Console records 1 click and 70 impressions for October 12 to November 8. PostHog records 2 visitors, 45 sessions and 139 pageviews. Live event/host exclusions pass a controlled SDK check. Browser/payment/signup repairs are deployed. Consent migration 067 passes all 15 production catalog checks, and protected API release 35 passes health checks on both machines. PostHog runtime settings match the project and EU host. Eight live API consent checks and public web page/asset checks pass. One paid $50 checkout creation cohort reconciles with Stripe/Supabase. Full browser runtime, owner-browser marking, production payment ingestion, Bing and AI visibility remain pending. See account baseline, measurement repair and deployment record. |
| 10 | Inspect rendered acquisition pages. | Production HTTP/SSR and the existing remote browser suite pass (307 passed, 38 skipped). Manual review of new acquisition pages remains incomplete: dedicated browser host unavailable and native window changes interrupted navigation. |
| 11 | Inspect the internal link graph. | Bounded production scan: 19 HTML pages and 18 sampled media URLs returned 200. Initial-link gaps identified; no fabricated coverage of private/query routes. |
| 12 | Improve contextual lesson navigation. | Deployed. Production free-module footers have five canonical lesson links and one current item, after the reader. Breadcrumbs link directly through the course. |
| 13 | Stabilize the guide registry. | Deployed slug lookup and per-guide summaries, without a publishing framework. |
| 14 | Establish campaign canonical ownership. | Main mirror now returns 200 with the published campaign host as canonical/OG owner. The campaign host returns 200 but still lacks the source canonical tag. Its separate release remains pending. |
| 15 | Establish current mobile performance. | Post-release mobile PSI retry on November 11 returned 429 again. Field/lab performance remains unknown. Compiled-byte evidence is in the audit record. |
| 16 | Fix measured performance bottlenecks. | Lazy public Exercise boundary deployed. Local exact comparison: 26 to 24 initial scripts, 28.03% fewer summed gzip bytes on two free lessons. Production confirms 24 initial scripts without detected editor signatures. Browser/field verification remains pending. |
| 17 | Create a JavaScript ML learning path. | Deployed learning path with curriculum counts, prerequisites, three goals, outputs and tracked free links. Production canonical/OG and content checks pass. |
| 18 | Publish the reproducible project case. | Project case deployed; five production artifact URLs return 200 and recorded fixture/source checks pass. Local follow-up adds immutable code links. Interactive browser check remains pending. |
| 19 | Repair the sourced course comparison. | Sourced comparison deployed. Named primary sources and observable criteria replace unsupported competitor claims. Local tests pass. |
| 20 | Connect acquisition assets. | Acquisition crosslinks deployed. Guides, case, comparison, About, free module and pricing are connected; new lesson handoffs use existing tracking. |
| 21 | Make technical credibility inspectable. | Recorded fixture and checked examples deployed. Three reproduction files verified anonymously at the pushed commit; fixture hash matches. Local case follow-up links them directly. No learner outcomes invented. |
| 22 | Verify release and prepare deployment. | Main 22cae183 pushed/deployed after normal hooks (4,258 passed, 65 skipped). All remote CI jobs and visual regression pass, including 307 browser tests (38 skipped). Width/spacing budgets retained. New lesson-arrival/evidence-link follow-ups remain uncommitted. |
| 23 | Verify production search behavior. | Production HTTP audit: 23 sitemap pages, zero errors/warnings; media, canonicals, guides, free links and access redirects verified. Search Console URL Inspection, Bing indexing and verified crawler logs remain pending. |
| 24 | Prepare distribution. | Unpublished DEV article and curator pitch prepared in marketing/seo-release-drafts.md. Main release URLs now return 200. No outreach or external publication; campaign-owner metadata release remains pending. |
| 25 | Review outcomes before expanding. | Needs live acquisition/learning data. Keep citations separate from visits and purchases. |

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
