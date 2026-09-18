# Project export deployment and reviewer preparation

Date: 2026-09-17. Production checks completed at 21:23 UTC.

Follow-up on 2026-09-18: the authorized API test reached GitHub but the saved
credential was rejected. A confirmed missing-refresh-token defect was repaired
and deployed. After the owner reconnected, live publication, identical retry,
clean-clone evaluation and standalone browser predictions passed. See the
[live verification record](project-export-live-2026-09-18.md) and
[renewal repair and current release](github-token-renewal-2026-09-18.md).

The API and web changes are deployed. Health, database readiness, public
browser checks and the downloadable project pass. The new authenticated
project publication and clean-clone check remained open at the end of the
September 17 pass because browser access to the owner's visible Chrome session
was unavailable. No live project snapshot was published during that pass.
Earlier exercise-save and repository-creation results do
not establish that this new project endpoint works end to end.

## Deployed source

Deployment used an isolated copy of the working tree at base revision
`95699ae26f8067a268d2e0ddc364833f3e292362`, including the uncommitted project
export and study patch. No application-repository commit or push was made.
Environment files, Git metadata and private study records were excluded.

The 1,961-file source snapshot has SHA-256
`111669c1f3a848234ec5562f8703f92e96dc9a9029e938f22ba5d5f4688dbd0b`.
This identifies the sorted path/file-hash manifest, not a Git commit.
Reviewer candidate documents and this deployment report were written after
that snapshot and were not part of the deployed build.

| Surface | Released artifact | Verification |
| --- | --- | --- |
| Fly API | Release 31, image `registry.fly.io/tensorcraft-api:deployment-01M2RKBJQA6D2TWHNHG282PW2P` | Both machines updated and healthy; `/api/health` and `/api/health/ready` returned 200, with `checks.db: ok`. |
| Vercel web | [Deployment dpl_AFuc3Yce5mJYUBxYN7fkPBCLJjVM](https://vercel.com/amira-salahs-projects/tensorcraft/AFuc3Yce5mJYUBxYN7fkPBCLJjVM) | Build completed, staged assets checked, then promoted to `tensorcraft.app`. |
| Production database | 61 of 61 migrations applied | Read-only migration status was in sync. No migration was applied in this pass. |

The Fly required-secret preflight passed. The older installed Vercel CLI was
rejected by its API before deployment; the successful build and promotion
used `npx --yes vercel@59.20.0`. This did not change repository dependencies
or the globally installed CLI.

Previous artifacts retained for rollback:

- API: `registry.fly.io/tensorcraft-api:deployment-01M2QK5ZXDBWDYXX4V4FHCBNVV`
  (release 30).
- Web: `dpl_6wyh3MJQKXbVmSZYRayPPgLshTjB`,
  `https://tensorcraft-1rjbshxrv-amira-salahs-projects.vercel.app`.

## Production checks

- The home page, Deep Orbit module map and free Introduction to Tensors
  lesson loaded in Chromium without page-level JavaScript errors. A guest
  opening the capstone was redirected to the paid-course offer. The displayed
  launch price remained $50.
- The free lesson had no horizontal overflow at a 375px viewport. This is a
  focused browser smoke check, not a complete responsive or accessibility audit.
- The public project ZIP and README returned 200. The ZIP matched the local
  verified bundle byte for byte: SHA-256
  `2764155a3a1bb36bf6b81ac38cd480e8c5e2164fcfac6f948ea1af8fa979ef00`.
- Both methods on `/api/github/project-export` rejected missing credentials
  with 401. Real browser requests from `tensorcraft.app` carrying an invalid
  bearer credential also received readable 401 responses. The POST preflight
  allowed authorization, content type and the three PostHog tracing headers,
  including credentialed requests. These checks establish routing, CORS and
  rejection behavior; they do not establish successful authenticated export.
- A clean extraction of the deployed ZIP passed `npm ci`. The separate
  maintainer training fixture produced real model artifacts and passed
  `npm run check` plus validation and test evaluation. The fixture is labeled
  as an infrastructure test and is not a learner result or a recommended model.

The local implementation checks are recorded in
[project export and study evidence](project-export-and-study-2026-09-17.md).
The course review manifest still has 121 partial whole-artifact records and
91 supporting records. Its hash check passed; that is coverage bookkeeping,
not independent educational approval.

## Live GitHub check outstanding at deployment

The steps below subsequently passed through the authorized API path on
2026-09-18. The production folder-picker interaction subsequently passed at
12:52 UTC with owner-approved temporary QA records, all removed afterward.
See the [browser results](production-picker-and-renewal-2026-09-18.md).

Correction on 2026-09-18: the debugging connection on port 9222 belongs to a
separate headless Chrome instance. Its sign-in page does not establish the
state of the owner's visible Chrome session. The earlier instruction to
sign into that supposedly visible tab was incorrect. Native browser access
failed to start, including after a tool reset, and no extension browser was
available. No password or token has been requested in chat.

A read-only account check found that the newly supplied email belongs to a
different Tensorcraft account without a GitHub connection. The previously
verified account retains the `amirasalah` connection. The owner was asked
whether to use that existing account for API-only verification or wait for
access to the visible browser. At that point, no new session had been minted
and no repository write had been attempted. A public GitHub read confirmed that the repository
still has three files, no project snapshot, and head
`cbca8764aab47c00f3f08d0b6b7c351148c9cc0c`.

After an authenticated path is available:

1. Capture the existing exercise tree and preview the connected destination.
   Confirm `amirasalah/tensorcraft-deep-orbit` and its actual visibility.
2. Publish the labeled maintainer fixture through the production endpoint,
   using the existing selected-repository installation. Record the returned
   snapshot URL, folder and commit.
3. Repeat the exact export and verify reuse without another commit. Confirm
   the existing exercise files were preserved.
4. Clone the published commit into a new folder. Compare every published file
   with the selected fixture, install from the lockfile, run artifact and
   evaluation checks, and reproduce browser predictions without substituting
   source or model files after cloning.

Do not close Q5's live verification gate until these steps succeed. A browser
test of the actual folder picker additionally needs course access; do not
grant an artificial purchase to make that check pass.

## Independent reviewers

The owner requested candidate research. The
[shortlist](../learning-study/reviewer-candidates-2026-09-17.md) recommends
first inquiries to Gant Laborde/Infinite Red for ML review and James N. Brook
for editorial review, with two alternatives. Published qualifications and
contact routes are linked there. Availability, fees and independence remain
unconfirmed. [Inquiry drafts](../learning-study/reviewer-outreach-drafts.md)
are ready; nobody has been contacted or hired.

A frozen handoff is available locally at
`learning-study-private/deep-orbit-review-handoff-2026-09-17.zip`: 229 files,
1,162,290 bytes, SHA-256
`eb70206b5a021785adc57dcb7d5a6d89053fb8cdaa65f5e657994f516e3e42ed`.
It contains all 212 review artifacts, relevant instructions and blank review
records. A clean extraction passed the summary check with no source drift
and acceptance `not_accepted`. No reviewer scores, learner observations,
customer data or production credentials were included. The archive has not
been sent externally.

Named-recipient outreach, a fee/deadline agreement, completed independent
reviews and the learner pilot remain open. Preparing the packet does not
establish a 9/10 course, $70 value or learner ROI.
