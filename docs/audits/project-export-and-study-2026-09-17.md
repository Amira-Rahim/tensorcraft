# Project export and independent study preparation

Date: 2026-09-17. Base revision: `95699ae2`, with this local patch.
Scope: Q5 automatic project publication and Q6 review/pilot preparation.
This record contains implementation evidence. No independent reviewer or
learner outcome is claimed, and it does not establish a 9/10 course or $70 ROI.

Follow-up: the patch is now deployed. Production checks, reviewer preparation
and the still-open authenticated publish/clone check are recorded in the
[deployment evidence](project-export-deployment-2026-09-17.md). The local-only
statements below describe this earlier implementation pass.

## Project publication

The independent-project panel now reads a selected local folder and previews
its file list before contacting the export API. The destination preview reads
the connected learner's existing `tensorcraft-deep-orbit` repository, including
its visibility. Publishing requires a separate explicit checkbox and action.
The service does not create a repository or broaden installation access.

The upload includes the supplied source/data/license files, model artifacts,
validation/test JSON runs and optional flat JavaScript/JSON helpers in `src/`.
The shared contract rejects unknown paths, duplicates, missing required files,
invalid base64 and requests above 100 files or 4 MiB decoded. HTTP requests
have a 6 MiB limit for base64 overhead; other normal routes retain 1 MiB.
Dependencies, Git metadata and `.env` files are excluded before being read by
the folder reader. Learner-authored code/report contents still need review
before publication, especially for a public repository.

The API requires a verified Supabase session and decrypts the stored GitHub
token server-side. It uses the stored username and fixed repository name.
It checks repository identity/visibility against the preview. No uploaded
contents or upstream response bodies are logged by the new route.

Files go into `projects/room-occupancy-v1/<content hash>/`. New versions keep
earlier snapshots. Text retains its UTF-8 bytes; binary weights use a base64
Git blob. One tree and commit publish the complete selection. A non-forced
branch update preserves concurrent work; if the branch advances, the service
rebuilds on the newer head. Repeated identical submissions reuse the snapshot,
including after an ambiguous client timeout. An edited snapshot, conflicting
parent path, truncated tree, empty repository or rejected branch update
produces a visible error. Earlier exercise files remain in the base tree.

The API design follows GitHub's documented [tree creation](https://docs.github.com/en/rest/git/trees#create-a-tree),
[binary blob creation](https://docs.github.com/en/rest/git/blobs#create-a-blob)
and [reference updates](https://docs.github.com/en/rest/git/refs#update-a-reference).
Tests exercise the implementation with simulated GitHub responses. A real
GitHub account publication through this new endpoint has not been performed.

The learner brief documents publication, limits, snapshot sharing and manual
ZIP fallback. The download packager now uses an explicit list of authored
files so an incidental top-level file cannot enter the starter bundle.

## Independent review and pilot

The [study packet](../learning-study/README.md) contains separate subject and
editorial procedures, five anchored course categories, project scoring
instructions, three concept task forms and facilitator answer anchors. It
requires conflict disclosures, evidence per score, clean project execution,
an error explanation and a fresh adaptation. Value and market reach remain
outside the expert course score.

The pilot retains Q6's 12-20 learner cohort and original diagnostic thresholds.
The protocol records help, first attempts, effort, withdrawals/confusion,
seven-day checks and 30-day use. Proposed workload is explicitly an unvalidated
estimate that must be settled before enrollment. Consent contact, retention,
compensation and dates are required before records enter collecting state.

`scripts/learning-study.mjs` prepares blank private records from current
source hashes and summarizes completed records. It reports counts with
percentages, enrolled and submitted denominators, missing observations,
assistance, JS-background counts and late responses. Zero denominators are
unknown. A high project score with a blocker cannot pass. Open observation
windows and incomplete independent coverage cannot be accepted. Source drift
and missing review coverage invalidate acceptance. Human judgments and the
truth of supplied evidence still require human inspection.

## Local verification

- 924 tests passed in the broader 39-file content, GitHub, project/UI and study
  run. A subsequent 38-test focused run passed, covering an authenticated
  upload above 1 MiB with an encrypted test credential and the study summary
  changes. The seven study tests also passed after manifest
  preparation. Workspace typechecking passed all 10 tasks; API typechecking
  passed again after the final route test. Formatting and diff checks passed.
- GitHub tests cover exact text/binary bytes, atomic ref updates, retained
  exercise files, repeat submissions, concurrent commits, branch rejection,
  visibility changes, revoked access and rejected paths/sizes.
- Clean download extraction and `npm ci` succeeded. A separate maintainer
  fixture trained a real model outside the repo. Node reload matched four
  saved predictions within 1e-5; Chromium matched them too. Invalid input,
  missing/corrupt weights and restore behavior passed with no external
  inference requests. This fixture is excluded from the learner download.
- The production React component/reader uploaded 26 files from that trained
  folder to a mocked API boundary. Every uploaded byte matched its original;
  `.env` and dependencies were excluded, and preview/consent were required.
  Decision records and download checks also passed. Desktop and 375px layouts
  had no horizontal overflow; the mobile rendering was inspected. The Vite
  harness still reports the existing CSS import-order warning.
- Study fixtures test missing data, attrition, blockers, reveals, delayed
  timing, review independence, source drift and open-window rejection.
  Synthetic participants exist only inside tests and are never study results.
  Blank local review/pilot sheets were generated in the ignored
  `learning-study-private/` folder: 212 artifacts, zero participants, no source
  drift and both summaries explicitly `not_accepted`.

The review-manifest check also found pre-existing stale supporting-file
hashes in the starting checkout. Those hashes are recorded as invalidated
and needing recheck, rather than silently inheriting prior approval. Changed
files verified by this patch get focused local evidence. All 121 Deep Orbit
whole-artifact statuses remain partial.

Reproduce:

```sh
python3 scripts/package-room-project.py
node scripts/check-room-project.mjs
# Use the clean project path printed by the previous command:
node scripts/check-decisions-browser.mjs --project /path/to/room-occupancy-v1
node scripts/learning-study.mjs prepare learning-study-private
node scripts/learning-study.mjs summarize learning-study-private/review.json
node scripts/learning-study.mjs summarize learning-study-private/pilot.json
node scripts/check-content-review.mjs
```

## Open evidence gates

Deploy the reviewed change, publish a real completed project using the
existing selected-repository installation, and reproduce it from a clean
clone. Then obtain the independent reviews and learner observations in the
packet. Recruitment, enrollment and actual session/follow-up records are not
completed by preparing instructions or running maintainer fixtures. Actual
ONNX/cache/converter/hosted paths, story consequences, pricing evidence and
acquisition evidence remain in the canonical backlog under their own gates.
No deployment, invitations or live repository writes were performed here.
