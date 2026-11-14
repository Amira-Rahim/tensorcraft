# SEO and GEO release discovery

November 14, 2026. Commit `bf0e9025` is pushed to `origin/main`. Vercel
confirmed deployment at 16:35:02 UTC. The normal hooks passed ten workspace
typechecks and 4,399 tests, with 65 tests skipped.

The [structured evidence](discovery-followup-2026-11-14.json) retains production
checks, Google snapshots, resource measurements and acceptance criteria. The
[private report](https://app.openseo.so/p/83d1f46c-c0d8-44ab-966e-e9a343691c44/reports/265fd79b-1d22-430c-ac3c-1e65f581ea45)
explains the recommendations. The earlier implementation record remains a
historical snapshot of local readiness before this release.

## Production verification

All 23 sitemap pages return 200 with one H1, matching preferred URLs and no
page-level indexing exclusion. The changed project, learning path, comparison
and guides hub expose the expected initial HTML. The supplied reference,
eight-option comparison and runtime selector are live.

The standalone archive returns 200 and contains 99,704 bytes. Its SHA-256 is
`9e0e351f2c3d56a7d9651d58583f10f4f249a1656480122c4332c388278a3439`,
matching the verified local archive. The reference JSON, manifest, sitemap and
existing `llms.txt` also return 200. All five free Foundation lessons remain
available anonymously with substantive initial text.

A free OpenSEO crawl completed 45 URLs: 41 returned 200 and four protected
lesson URLs redirected. It reports no critical issue, 12 warning instances and
31 informational instances. JavaScript rendering and Lighthouse were disabled.
Intentional noindex auth pages and canonical pricing/section variants explain
many flags. The empty blog follows the existing removed-promotion policy.
Four planned-course pages have deliberately inert cards but remain in the
sitemap. A contextual details link is an optional future policy decision.
These flags do not justify filler content or arbitrary copy cuts.

## Scoped follow-ups

These nine actions refine the existing 53-item plan. They do not represent
nine new completed features or demonstrated traffic opportunities.

1. **N01, P1: release-path performance checks.** Add direct-main and manual
   Lighthouse coverage for the course, comparison, learning path and project
   guide. Save repeatable mobile lab results before tightening budgets. The
   current workflow runs only on pull requests and omits these routes.
2. **N02, P1: public-page SDK loading.** Profile initial execution, then test
   deferred analytics and narrower app providers. Comparison and learning-path
   HTML each declare 18 scripts totaling 453,211 independently gzipped bytes.
   The project guide totals 460,513. Shared chunks contain PostHog and Supabase.
   These resource sums do not establish wire transfer, execution time, field
   performance or achievable savings. Verify consent and authenticated behavior.
3. **N03, P1: practice discovery.** Extend the existing guides hub with clear
   choices for a runnable demo, visual prediction and graded JavaScript work.
   State setup, account requirements and expected output. Verify the signed-out
   mobile and keyboard path while preserving story-first lessons.
4. **N04, P2: comparison choices.** Verify the current 79rem-wide matrix on
   mobile. Add a compact sourced goal/access summary before it, distinguishing
   free tutorials, course purchase, membership and book. Preserve publisher
   disclosure and avoid adding more columns.
5. **N05, P2: class balance and conditional errors.** Explain the existing
   model's 60 correct occupied flags out of 80 flags, and 60 occupied readings
   found out of 61. These are precision 75% and recall 98.36% on the same
   400-row validation set. Use a compact confusion view and preserve supplied
   reference labels, one-room limits and the unused final data.
6. **N06, P2: handled demo outcomes.** After defining the reliability decision,
   add consent-gated start, completion, failure and cancellation events with
   bounded reason/stage values. Verify controlled outcomes with internal
   markers. A completed demonstration does not establish learning mastery.
7. **N07, P2: public download middleware.** Exclude the deliberate `/evidence/`
   namespace from session processing. Test the actual Next matcher, protected
   HTML and unchanged artifact bytes. Downloads currently work, and this review
   measured no authentication-network call or latency penalty.
8. **N08, P2: certificate image indexing.** Add `X-Robots-Tag: noindex` only to
   the certificate OG image branch. Preserve 200 responses and social previews.
   Verify ordinary course/guide images remain eligible. The separate image
   currently lacks this policy, but no actual image indexing was demonstrated.
9. **N09, P3: evidence version durability.** Prevent source changes from silently
   overwriting a released v1 archive. Require a new version or content-addressed
   path and preserve prior bytes. The current deployed package is correct.

The structured record maps each finding to existing plan IDs and source paths.
Start with repeatable release and mobile checks, then the practice hub. The
metric explanation is a bounded improvement to the existing project.

## Search and AI evidence limits

Stored Google inspection still reports `/compare` unknown. The project guide,
learning path and guides hub retain November 11 crawls. `/learn` retains its
October 26 snapshot and old video warnings. These inspections read stored
Google state and do not run live crawls.

Final query/page data for November 1 through 11, Pacific Time, returns two
disclosed rows: nine impressions for Deep Orbit and three for the learning
path, with zero clicks in this subset. This tiny pre-release sample cannot
establish demand or lift. It does not replace property totals.

The November 11 AI sample remains 34 answered collections with zero recorded
brand mentions and own-site citations. No new paid collection or recurring
check ran. A web-reading tool returned stale seven-option comparison text,
while direct HTTP confirmed identical current eight-option HTML for two user
agents. That reading limitation does not establish a production defect.

No post-release traffic, citation, learning or revenue lift is established.
Current mobile/browser execution, consent/payment verification and the wider
application source/license decisions remain open. Outreach stays paused until
the owner confirms repository privacy. Repository visibility is unchanged.

## Recrawl assessment

The release changes four indexable pages:

- `/guides/browser-machine-learning-project`
- `/guides/javascript-machine-learning-learning-path`
- `/compare`
- `/guides`

Their live content, canonicals and page-level indexing state pass HTTP checks.
Targeted Google requests remain pending alongside the older `/learn` refresh.
Native Chrome control timed out on November 14 before any Request indexing
action completed. No request acceptance or later recrawl is claimed.

The sitemap and existing `llms.txt` are live. Certificate metadata declares
noindex in source and focused tests. This review accessed no real learner ID
and submits no certificate for indexing. Deep Orbit already has a recorded
successful November 13 crawl and needs no unchanged repeat request.

This discovery follow-up changes internal documentation and a private report
only. It changes no public route, rendering, link or indexing policy, so these
notes create no additional recrawl request. Every future change still requires
its own recorded assessment.
