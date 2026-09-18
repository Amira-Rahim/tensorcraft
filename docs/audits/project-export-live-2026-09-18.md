# Live project export verification

The production project export, identical retry, clean clone and standalone
browser checks passed on 2026-09-18 at 11:32 UTC. This closes the maintainer
verification of Q5's live API export path. Independent assessment and the
production folder-picker interaction remain separate checks.

## Published snapshot

The owner reconnected the existing account after the
[token renewal repair](github-token-renewal-2026-09-18.md). The test used the
authorized account and existing selected-repository installation. Production
destination preview returned the public `amirasalah/tensorcraft-deep-orbit`
repository, ID `1374285914`, on branch `main`.

Both preview and publication used `https://api.tensorcraft.app/api/github/project-export`.
The verification used temporary Supabase sessions without sending email or
creating a user. Only those sessions were revoked afterward; the owner's
browser sessions were preserved. Credentials were not saved in the evidence.

The [published project](https://github.com/amirasalah/tensorcraft-deep-orbit/tree/a5ef0441a6402708a907ba6454662f581b4c079f/projects/room-occupancy-v1/746afe575af1e51ff8d10e76d12cde36ad0ae6381f1b32ff9d9debc23fb2832a)
contains the labeled maintainer fixture:

- Commit: `a5ef0441a6402708a907ba6454662f581b4c079f`.
- Folder: `projects/room-occupancy-v1/746afe575af1e51ff8d10e76d12cde36ad0ae6381f1b32ff9d9debc23fb2832a`.
- 26 files, totaling 1,002,080 decoded bytes: source, locked dependencies,
  licensed data, experiment plan, report, five model artifacts and two runs.
- Fixture ZIP SHA-256:
  `a6ff7e4a5e737480a207e0f0f84774d264aa43eadd3a84c970ae3526e5f0e807`.

README and report identify this as an infrastructure test. It is not a learner
submission, independent score or recommended model. No application-repository
commit or push was made during verification.

## Results

| Check | Observed result |
| --- | --- |
| Production destination preview | HTTP 200; repository ID, owner, name and public visibility matched the existing destination. |
| Initial publication | HTTP 200, `alreadyPublished: false`; returned the snapshot commit above. |
| Identical retry | HTTP 200, `alreadyPublished: true`; same commit and unchanged branch head. |
| Existing repository content | All three prior files retained their blob IDs and file modes, including `foundations/create-a-tensor.ts`. |
| Published bytes | All 26 Git blobs matched the fixture bytes; the fresh clone also matched every file's SHA-256 and byte count. |
| Fresh installation | A new clone checked out the returned commit and passed `npm ci --ignore-scripts --no-audit --no-fund`. |
| Saved model reload | `npm run check` reproduced four saved scores within `1e-5` on TFJS 4.22.0's CPU backend. |
| Evaluation reproduction | Validation's 400 predictions and test's 456 predictions matched exactly, along with metrics, baseline, split summary, plan hash and artifact hashes. |
| Standalone browser | Chromium 151 loaded the cloned model on WebGL. All four displayed scores matched saved scores within `1e-5`; maximum difference was below `4.75e-7`. |
| Input and layout checks | Blank and Float32-overflow input produced no prediction. At 375px wide, the form and results had no horizontal overflow; screenshot inspected. |
| Runtime independence | No external browser requests or page errors. No training, source substitution or model replacement after cloning. All 26 original files remained unchanged. |

The first public GitHub ref read after publication still returned the previous
head, `cbca8764aab47c00f3f08d0b6b7c351148c9cc0c`. The verification stopped at
that assertion and retained the successful publication response. A fresh
uncached read confirmed the new head, and verification resumed using the same
fixture and recorded commit. The identical API retry created no further commit.
The original failed observation remains in the private evidence.

Private evidence is under
`learning-study-private/live-project-export-2026-09-18/`: `api-result.json`,
`api-publication-first.json`, `clone-result.json`, `browser-result.json` and
`cloned-app-mobile.png`. The earlier rejected credential attempt is retained
in `api-rejected-before-renewal.json`.

## Remaining checks

- The actual production course folder picker still needs an authenticated,
  entitled browser check. This pass tested the production API and the cloned
  standalone app; the picker has local component/browser coverage.
- Live automatic renewal remains unobserved until the new credential reaches
  its renewal window. The 121 targeted tests include simulated rotation and
  concurrency. Successful reconnection and fresh-token export do not test
  an expiry cycle.
- An independent reviewer must reproduce a learner's export and score it.
  Learners must explain failures and adapt their work. This fixture cannot
  establish educational effectiveness, course value or a 9/10 quality score.

Reviewer candidates, inquiry drafts and the frozen 216-artifact handoff are
ready. Nobody has been contacted or hired, and no independent scores or
learner observations have been collected.
