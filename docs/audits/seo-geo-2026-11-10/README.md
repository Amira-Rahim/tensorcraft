# SEO and GEO audit record

November 10, 2026, with a November 11 performance follow-up. The
[execution checklist](../../seo-geo-plan.md) owns the
current work sequence. This record separates the original diagnosis from
implemented fixes and pending verification. Application changes remain local
until release.

The [frozen production HTTP report](live-baseline.json) captured 19 sitemap
URLs returning HTTP 200. Its zero hard errors apply only to the original smoke
test. That report used heuristics and simulated robots rules removed during
cleanup. Its old format remains historical evidence, not an SEO health score.
The new guide routes were absent from production at collection time.

November 10 local checks passed 214 changed-file tests, seven HTTP-audit tests,
web/UI typechecks and an isolated production build generating 104 pages.
Targeted lint had no errors and two existing lesson-content warnings.
HTTP/SSR checks verified all three guides, five free-lesson footers,
canonical/schema identity, video XML/media and paid/planned access redirects.
Browser visual QA was
unavailable because the computer-use host was unavailable. The standard review
launcher required Docker. HTTP/build checks used an isolated source snapshot
with local placeholder configuration and no production credentials.

## Correction to the earlier lesson diagnosis

The initial report described the technical teaching as absent from the first
response. That was too broad.

The live default tensor-shapes response contains substantial teaching prose and
a code block. Three MDX instances include approximately 630, 503, and 498 words.
CSS hides teaching in the briefing instance and ordinary prose in the two note
instances. The raw response therefore includes repeated text that a body-word
counter cannot distinguish from visible content.

The no-JavaScript override reveals the teaching prose in the story instance.
When JavaScript runs, the briefing keeps that prose hidden until the learner
enters the Concept step. Complete Concept components, experiments, bridges,
and derivations also depend on step selection.

Relevant source: [teaching visibility](../../../apps/web/app/globals.css:281),
[note visibility](../../../apps/web/app/globals.css:971),
[no-JavaScript override](../../../apps/web/app/worlds/[slug]/[module]/[lesson]/noscript-reveal.tsx:40),
[step selection](../../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx:1184).

This requires rendered-content inspection. It does not establish cloaking, and
the raw count of roughly 1,800 words does not establish 1,800 useful visible
words. Preserve the shared story-first lesson layout. Avoid bot-only copies or
a redesign based on the earlier diagnosis.

## Original findings and local fixes

| Priority | Original finding                                                                                          | Current local implementation and remaining verification                                                                                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Both video sitemap entries omitted `content_loc` and `player_loc`.                                        | The watch-page entry now takes `content_loc` from its VideoObject. Secondary course trailers stay off the video sitemap. Local tests check XML and media paths. Deployed assets and Search Console remain unverified. |
| P1       | `/learn` rendered no video element before interaction or a six-second timer.                              | The initial response now includes the poster-backed player. Local SSR/player tests preserve captions, reduced motion, Save-Data and delayed playback. Browser playback verification remains pending.                  |
| P1       | Session tracking ran before first-time consent and missed later acceptance.                               | Tested consent-aware visible intervals, withdrawal/reacceptance and hide/resume. Withdrawal discards the interval without an event. No pre-consent behavior is replayed. Live SDK delivery remains unverified.        |
| P1       | Pricing tracking missed late consent and labeled ordinary navigation `source=direct`.                     | Pricing/paywall effects now wait for analytics readiness. Tested `entryContext` separates page context from acquisition. Kit behavior remains independent. Account verification is pending.                           |
| P1       | Guide lesson links lacked CTA events and guide identifiers.                                               | Existing tracking now carries guide ID, canonical lesson target and placement. Local handoff tests pass. Subsequent actual attempts require live measurement.                                                         |
| P1       | Performance gates allowed LCP 11.5 seconds, CLS 0.35 and TTI 14 seconds, and omitted guides/free lessons. | Representative guide and free-lesson URLs now join Lighthouse CI. The measured editor-payload reduction is recorded below. Runtime/field measurements and justified budget changes remain pending.                      |
| P2       | Default free lessons lacked sibling/next-lesson anchors in initial HTML.                                  | Local server-rendered free-module footer links improve discovery while preserving gating, story and answers. Production rendered-link checks remain pending.                                                          |
| P2       | Lesson breadcrumbs passed through module redirects.                                                       | Breadcrumbs now link directly to the course overview. Module shims remain for existing prerequisite links. No extra module pages or paid stubs were added.                                                            |
| P2       | `GUIDES[0]` and a repeated hardcoded hub summary coupled articles to array order.                         | A slug lookup and per-guide summaries now support the three public guides. Local registry/content checks pass.                                                                                                        |
| P2       | Campaign assets used a separate host without a clear canonical owner.                                     | The published campaign host remains the owner. Source canonical now matches its OG URL. That host returned 200 while the main-domain mirror returned 404. Campaign release remains pending.                           |

Google requires a video sitemap to provide a media URL or player URL. Its video
guidance also says that discovery must not depend on user actions.
[Video sitemap reference](https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps),
[video discovery guidance](https://developers.google.com/search/docs/appearance/video).

Source references for measurement findings:
[session effect](../../../apps/web/app/components/analytics-provider.tsx:100),
[capture guard](../../../apps/web/lib/posthog.ts:90),
[pricing event](../../../apps/web/app/pricing/pricing-analytics.tsx:20),
[guide handoff](../../../apps/web/app/guides/tensorflow-js-reshape-vs-transpose/page.tsx:256),
[performance limits](../../../.github/lighthouse-budget.json:5).

No current Core Web Vitals measurement was obtained. The public PageSpeed API
returned HTTP 429. Historical scores and the existence of a passing CI budget
cannot establish current performance. PostHog's static SDK import and the root
authentication/support shell are candidates to measure on editorial routes.
The November 10 source used a dynamic exercise component, but its build still
included editor code in initial lesson scripts. The November 11 follow-up below
fixes that dependency boundary. Runtime and field measurements remain pending.

### November 10 compiled payload baseline

An isolated production build with placeholder services was served locally.
The inventory sums each unique initial script file and compresses each file
with gzip. These are compiled-byte observations, separate from browser
transfers, execution costs, loading speed and Core Web Vitals.

| Route | Initial scripts | Raw bytes | Gzip bytes |
| --- | --- | --- | --- |
| `/guides` | 17 | 1,417,920 | 442,332 |
| `/guides/tensorflow-js-reshape-vs-transpose` | 18 | 1,427,733 | 446,058 |
| `/worlds/deep-orbit/foundations/tensor-shapes` | 26 | 2,940,239 | 931,671 |

Both editor chunks appeared as ordinary async script tags in the document head,
outside templates. The source imported the exercise-data provider through the
UI barrel, whose exercise module statically imports Sandpack and editor
extensions. The synchronous lesson client graph also retained the chunks.
ExerciseBrief already imports the light context directly.

Three bounded candidates changed the exercise import boundary, the server provider
import, then package-import optimization. None reduced that set or its bytes:
lesson gzip grew by 436, 947 and 951 bytes respectively. All experimental
runtime/config changes were removed.

### November 11 public editor boundary

The full source trace found one eager edge to the heavy exercise module: the
shared UI barrel exported both Exercise and its data provider from that module.
A small public adapter now loads the existing implementation with React.lazy.
The barrel exports the data provider from its existing light context module.
The editor, grading, story and lesson access behavior remain intact.

An exact before/after comparison used fresh isolated production builds with
the same source outside this boundary. Both sampled lessons had these results:

| Metric | Before | After | Reduction |
| --- | --- | --- | --- |
| Initial script URLs | 26 | 24 | 2 |
| Raw script bytes | 2,940,251 | 2,136,036 | 804,215 (27.35%) |
| Summed gzip bytes | 931,675 | 670,486 | 261,189 (28.03%) |

The samples were introduction-to-tensors and tensor-shapes. The homepage,
guide hub, all three guides and `/learn` were byte-identical controls.
The source trace now finds no eager path to the heavy exercise module,
Sandpack or CodeMirror. Editor chunks are absent from initial script and
preload tags. The deferred chunks exist and return HTTP 200.

The production build generated 104 pages. Web/UI typechecks, targeted lint and
282 tests passed. The existing corpus suite skipped 65 cases. The new public
entry test verifies that importing ordinary UI and rendering the data provider
does not evaluate editor modules. Mounting Exercise then loads the actual
implementation with mocked editor/grader services and preserves run callbacks,
snapshots, lifecycle events, result rendering and saved-code restoration.
HTTP checks cover ordinary and Challenge-entry lesson responses and navigation.

Browser access still failed on November 11. These observations establish a
smaller compiled initial payload. They do not establish browser transfer,
Challenge interaction with real Sandpack, loading speed or Core Web Vitals.

Google's current good-experience targets are LCP within 2.5 seconds, INP below
200 milliseconds, and CLS below 0.1. A matching lab value does not establish
field performance. [Core Web Vitals reference](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Commercial intent and differentiation

The reshape guide answers a real technical question and demonstrates the
teaching method. A person fixing an API issue may already know ML and may have
no interest in a course. Its commercial value remains a hypothesis until the
handoff and subsequent learning activity can be measured.

Current first-party alternatives include Google's
[TensorFlow.js learning curriculum](https://www.tensorflow.org/resources/learn-ml/basics-of-tensorflow-for-js-development)
and a [JavaScript-specific course with application projects](https://master.dev/courses/tensorflow-js/).
These establish that JavaScript, browser execution and projects already exist
elsewhere. They do not establish competitor rankings, market share, or demand.

Tensorcraft should demonstrate its particular combination: a continuous story,
graded code, explicit limits to analogies, inspected mistakes, and a connected
path through data preparation, training, evaluation and deployment. The useful
question is why this learning method and sequence justify the purchase.

The strongest underused evidence already exists in
[CourseProjectPreview](../../../apps/web/app/components/course-project-preview.tsx:4).
The independent project uses 2,056 recorded measurements, compares a rule with a
trained model, and exposes a validation case where both fail. The public fixture
includes attribution, artifact hashes, a reproduction command and limitations.
It is a maintainer demonstration, separate from learner work and quality
benchmarks. The original world-page disclosure remains. A separate
[public project case](../../../apps/web/app/guides/browser-machine-learning-project/page.tsx)
now explains the provenance, responsibilities and limitations. Its explorer
applies a threshold to the supplied score. It does not train another model.
Local checks verify the downloadable row, fixture hash and decisions.

The original comparison used a generic Coursera column, unsupported prices and
vague math labels. Its college-calculus prerequisite conflicted with the
[Machine Learning Specialization's prerequisites](https://www.coursera.org/specializations/machine-learning-introduction).
The local [comparison repair](../../../apps/web/app/compare/page.tsx) now names
TensorFlow.js resources, Charlie Gerard's course, fast.ai and Scrimba. It links
primary sources and compares published goals, prerequisites, runtimes and
projects. Visible review date and schema agree. Tests cover source links,
identity and course handoffs. The page claims no firsthand completion or
competitor outcomes.

## Account evidence and attribution

The next baseline should include Search Console queries, pages, countries,
devices and indexing reasons, plus rendered URL Inspection for representative
routes. Inspect overlapping homepage and `/learn` query coverage before calling
it cannibalization or changing either page's established purpose.

Use PostHog to examine consented landing cohorts, guide handoffs, actual
experiment submissions or exercise attempts, free-module completion, and
purchases. A mounted `lesson_started` event alone does not establish an attempt.
Search Console queries are aggregate data. They do not provide a reliable
query-to-individual-purchase join.

Internal blog links no longer add `utm_source=blog`. Guide/post identifiers
travel as event properties, and pricing records page context separately.
Original SDK acquisition attribution still needs account verification.
Payment records cover a different
population from consented browser analytics. Dividing all settled payments by
consented guide visits would produce a misleading conversion rate.

The owner confirmed on November 10 that the optional checkout-source question
stays disabled. This work does not activate it or change checkout privacy.

The owner chose integrations for account measurement. PostHog and OpenSEO were
available but still uninstalled at the November 11 check. Setup, property access and
verified account baselines remain pending. No account results were obtained.

Bing's AI Performance can show cited URLs and grounding queries. Its newer
Topics Portfolio beta can help plan coverage when a property has enough data.
Small sites may not see the feature. These directional aggregates do not prove
visits, purchase intent or sales.
[Bing Topics Portfolio](https://blogs.bing.com/webmaster/2026/10/introducing-topics-portfolio-beta-in-ai-performance/).

## Public credibility and distribution

About now links the project case, recorded fixture and checked worked guide.
The collective identity remains. These are technical examples, with no invented
learner outcomes or proof of production experience. Organization markup connects
identity records and supplies no underlying evidence.

An unpublished [distribution pack](../../marketing/seo-release-drafts.md)
contains canonical destinations, a complete DEV-style explanation and a curator
pitch. Its code matches the recorded decisions. Release URLs must return 200
before use. No outreach, publication or purchases occurred.

Google's AI-search guidance emphasizes useful original work and normal search
foundations. It does not require special AI markup or `llms.txt`.
[Google AI-search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

## Limits of the HTTP audit

The script remains useful as a smoke test. Its pass means only that its listed
checks passed:

- It seeds from the sitemap and does not follow internal links. It cannot
  establish click depth, find every broken navigation path, or detect all
  orphan pages.
- It records the robots.txt response and fetches with one custom user agent.
  It no longer simulates robots policies and cannot verify actual CDN treatment
  of verified bots.
- It parses JSON-LD but does not validate required search-feature properties,
  visible-content agreement, or video sitemap fields. Dedicated local tests
  cover the video XML repair separately.
- It uses a DOM parser without executing scripts or loading resources. It has
  no word-count or length heuristics and cannot establish rendered visibility,
  interaction quality or current performance.
- It has no account indexing data, field performance, query intent, external
  references, AI citations, or conversion evidence.
