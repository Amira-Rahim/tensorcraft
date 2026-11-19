# Production guide and analytics verification

November 11, 2026. A native Chrome Incognito session exercised the live
guides hub, reshape guide and free tensor-shapes activity. PostHog confirmed
delivery of the resulting browser events. This is controlled internal testing,
with no account sign-in or purchase.

## Observed browser behavior

- The guides hub displayed its three guide links and the fresh consent banner.
- Accepting analytics dismissed the banner.
- Selecting sensor C at local moment 2 highlighted value 6 in both outputs.
  The explanation placed it at reshape row 3, column 1 and transpose row C,
  moment column 2. The desktop screenshot showed those matching cells.
- The guide's activity link opened the free tensor-shapes Concept section as
  a guest. The story scene, activity and free-module navigation remained visible.
- An intentionally incorrect prediction, `2, 20, 5, 8`, produced visible
  incorrect feedback and identified the first attempt as unassisted.
- Reloading retained that local practice record.

The session began at `/guides?tc_internal=1`. This marked its analytics as
internal without changing the owner's normal browser profile. The dedicated
browser host remained unavailable. Native control worked for these actions,
then shifted to another active Chrome window during DevTools inspection.
Further UI actions stopped to avoid interfering with that activity.

## Delivered events

The bounded query window is 11:52 through 11:56 UTC. The three events below
share one nonempty SDK session ID. The evidence stores aggregate checks,
without person or session identifiers.

| Event | UTC time | Verified payload |
| --- | --- | --- |
| `free_lesson_cta_clicked` | 11:53:54.853 | `source=guide`, `guideSlug=tensorflow-js-reshape-vs-transpose`, `placement=activity`, canonical tensor-shapes target |
| `lesson_started` | 11:53:55.835 | `lessonId=tensor-shapes` |
| `experiment_submitted` | 11:54:24.123 | `lessonId=tensor-shapes`, `correct=false`, `assisted=false` |

Each event carries `tc_internal=true`. Native PostHog trend queries return
one of each with test exclusions off, and zero of each with the existing
project exclusions on. The same window also contains the consent event and
four internal pageviews, including the reload.

[Exact query inputs and results](posthog/browser-guide-verification.json)
establish deployed guide-handoff, lesson-arrival and experiment-submission
delivery. They do not establish an external conversion rate or successful
learning. The attempted answer was deliberately incorrect.

## Remaining coverage

This check covers consent before lesson navigation. The separate local
lesson-arrival change still needs a release and a late-consent browser check.
No check established preconsent network silence, withdrawal, cross-tab
behavior, failed account-save recovery, signed-in account persistence or
server payment delivery. Mobile layout, the project-case threshold control,
trailer playback and Challenge editor behavior remain outside this session.

The four existing local lesson-arrival and guide-source follow-ups passed
independent review against commit `7e016d33`. Their focused run passed 138 tests
across seven files, plus web typechecking, formatting and diff checks.
No correction or removal was needed. They remain uncommitted.

The final isolated production build also passed with the local follow-ups and
video datetime correction. Its generated Learn HTML contains one VideoObject
with `uploadDate=2026-11-09T19:44:03Z`. The build used preview placeholders
without production credentials. This verifies build output, not deployment.

## Priorities from the observed evidence

1. Release the reviewed lesson-arrival and source-link changes together with
   the video datetime repair after the owner requests a commit and push.
2. The guide hub, three guides and Normalization now have confirmed Google
   indexing. The [indexing follow-up](openseo/indexing-followup.md#all-five-urls-indexed)
   preserves the earlier snapshots and the successful 12:41 UTC confirmation.
3. Complete the remaining browser and server-event checks before measuring a
   post-release external cohort. The historical population remains provisional.

OpenSEO now stores the established business facts, goals, writing rules and
ten key pages in its [project context](https://app.openseo.so/p/83d1f46c-c0d8-44ab-966e-e9a343691c44/context).
Target geography and competitors remain unconfirmed. No paid research,
recurring tracking, outreach or public report sharing was enabled.
