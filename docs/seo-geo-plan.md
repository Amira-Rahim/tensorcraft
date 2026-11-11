# SEO and GEO execution checklist

Updated November 11, 2026. This is the single current work list. The
[audit record](audits/seo-geo-2026-11-10/README.md) preserves evidence,
corrections and verification limits. Changes require release before they affect
production. Search demand, AI citations and acquisition results remain unknown.

## Cleanup

Keep factual copy fixes, public sitemap selection, honest dates, indexing
controls, the shared publisher identity, generated source facts and the verified
guide. Remove handwritten audit parsers, arbitrary length warnings, simulated
bot-access claims, speculative empty-blog infrastructure and redundant plans.
Preserve the existing teaser and marketing work.

## Ordered work

| Item | Work | Status and completion evidence |
| --- | --- | --- |
| 1 | Supply video sitemap media URLs. | Local tests verify emitted watch-page XML and media paths. Secondary course trailers are not promoted as watch pages. |
| 2 | Render discoverable video without interaction. | Local SSR/playback tests pass. Poster, captions, reduced motion, Save-Data and delayed playback remain. |
| 3 | Correct consent-aware session/pricing events. | Local regression tests pass for late consent, withdrawal/reacceptance, visible intervals and pricing/paywall readiness. |
| 4 | Track guide-to-lesson handoffs. | Local tests verify guide ID, canonical target and placement. Existing callers retain their payloads. |
| 5 | Define meaningful learning activity. | Defined in analytics-verification.md: submitted attempts, passes and progression remain distinct. Live coverage awaits integrations. |
| 6 | Preserve acquisition attribution. | Pricing entryContext separates page context from acquisition. Internal blog UTMs removed. Local tests pass. |
| 7 | Define conversion reporting populations. | Reporting contract distinguishes consented cohorts, matched journeys, all payments/refunds and unknown source. |
| 8 | Review optional checkout source reporting. | Owner confirmed on November 10: keep disabled. No checkout or privacy activation. |
| 9 | Establish account baselines. | Owner selected integrations. PostHog/OpenSEO remain uninstalled at the November 11 check. Account data and Bing property access remain pending. |
| 10 | Inspect rendered acquisition pages. | Isolated production-preview HTTP/SSR checks pass for guides, five free lessons, media, breadcrumbs and access redirects. Browser and native computer-use hosts failed; visual desktop/mobile/keyboard verification remains incomplete. |
| 11 | Inspect the internal link graph. | Bounded production scan: 19 HTML pages and 18 sampled media URLs returned 200. Initial-link gaps identified; no fabricated coverage of private/query routes. |
| 12 | Improve contextual lesson navigation. | Local free-module footer links and course-to-lesson breadcrumbs implemented. No gating, story or answer changes. |
| 13 | Stabilize the guide registry. | Local cleanup: slug lookup and per-guide summaries, without a publishing framework. |
| 14 | Establish campaign canonical ownership. | Keep the existing published campaign host as owner. Source canonical now matches its OG URL. It returned 200; the main-domain mirror still returned 404. Campaign release remains pending. |
| 15 | Establish current mobile performance. | Fresh mobile PSI attempt returned 429. Old main .next artifacts predate this revision. Field/lab performance remains unknown. Fresh compiled-byte evidence is in the audit record. |
| 16 | Fix measured performance bottlenecks. | Public Exercise now loads its implementation lazily. Exact build comparison on two free lessons: 26 to 24 initial scripts, 931,675 to 670,486 summed gzip bytes (28.03% less). Six public controls unchanged. 282 tests and typechecks pass. Browser Challenge and field/lab verification remain pending. Earlier unsuccessful candidates were removed. |
| 17 | Create a JavaScript ML learning path. | Implemented with compiled curriculum counts, prerequisites, three goals, inspectable outputs and tracked free links. |
| 18 | Publish the reproducible project case. | Implemented locally with provenance, responsibilities, artifact links and a supplied-score threshold explorer. Data/fixture/decisions verified. Release pending. |
| 19 | Repair the sourced course comparison. | Named primary sources and observable criteria replace unsupported competitor prices/prerequisites/quality labels. Local tests pass. |
| 20 | Connect acquisition assets. | Guides, project case, comparison, About, free module and pricing are contextually linked. New guide/compare lesson handoffs use existing tracking. |
| 21 | Make technical credibility inspectable. | About and project case expose the recorded fixture, reproduction/hash evidence and checked examples. No learner outcomes invented. |
| 22 | Verify release and prepare deployment. | Changed-file behavior tests, audit tests, web/UI typechecks, lint and isolated production build pass. Visual and live-account checks remain pending. No commit or push without the owner's request. |
| 23 | Verify production search behavior. | Needs deployment, URL Inspection, Bing and verified crawler logs where available. |
| 24 | Prepare distribution. | Unpublished DEV article and curator pitch prepared in marketing/seo-release-drafts.md. Release URLs must return 200 before use. No messages or purchases. |
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
