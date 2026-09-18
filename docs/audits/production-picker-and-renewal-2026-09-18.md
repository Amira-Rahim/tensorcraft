# Production folder picker and token-expiry observation

Status at 12:53 UTC on 2026-09-18: the production folder-picker test passed,
and all temporary QA records were removed. Natural token-expiry observation
remains scheduled and has not passed yet.

## Production browser access

The native browser-control bridge still failed to start. The owner approved
an isolated Playwright browser using the existing accounts. No personal
Chrome profile, saved browser credential or cookie database was read.

The account selected by the owner authenticated successfully with a temporary
Supabase session. Opening the production capstone redirected to
`/pricing?locked=deep-orbit&module=capstone`. The page contained no project
folder input. A read-only check confirmed no purchase entitlement and no
GitHub connection on that account. The temporary session was revoked with
local scope; existing sessions were preserved.

The earlier GitHub-connected account also had no purchase entitlement or
completed records for the prerequisite module. Production enforces both
conditions before rendering the capstone. The owner approved the temporary
QA setup below, and the test used that existing connected account.

The approved QA setup used:

- One $0 access record with plan ID `qa-folder-picker-2026-09-18`, no Stripe
  session or payment intent, on the existing GitHub-connected account.
- Five temporary prerequisite records with no scores or attempts.
- A real production browser test: directory selection, excluded-file preview,
  destination preview, confirmation, publication, identical retry and mobile
  layout. Auth, content rendering and API responses are not mocked.
- Cleanup restricted to the six preassigned test-row IDs, plus local-scope
  revocation of the temporary authentication session. No lesson completion or
  certificate action is part of the test.

The first run stopped because the cookie-consent banner covered the navigation
button. Cleanup passed. The test was updated to choose Essential only before
navigation; no application code change was needed.

The second run passed at 12:52:34 UTC:

| Check | Observed result |
| --- | --- |
| Production lesson | Real sign-in and server-side access checks rendered the capstone; the test used its Skip to the challenge button. |
| Directory input | Clicking the production input opened Chromium's file chooser; selecting the directory supplied 28 files. |
| Local preview | Exactly 26 fixture files appeared. The `.env` and `node_modules` placeholders were excluded. Selection made no export API request. |
| Destination preview | The live API returned 200 for the existing public `amirasalah/tensorcraft-deep-orbit` repository. The page disclosed public visibility. |
| Confirmation | Publish was disabled until the checkbox was selected. Success cleared confirmation and disabled publication again. |
| Publication and retry | Both production POSTs returned 200 with `alreadyPublished: true`, reusing the previously verified fixture snapshot. The success link matched the returned URL. |
| Payload and repository | All 26 uploaded files matched the original byte counts and SHA-256 hashes. The branch stayed at `a5ef0441a6402708a907ba6454662f581b4c079f`; no new commit was created. |
| Mobile and runtime | No horizontal page overflow at 375px and no page-level JavaScript errors. The project panel screenshot was inspected. |
| Cleanup | All six test-row IDs were removed and the temporary sign-in session was revoked. A separate read confirmed purchase and prerequisite data exactly matched the original empty baselines, with the GitHub connection preserved. |

The access and prerequisite records were explicitly labeled test setup in the
private plan and evidence. They do not establish a customer purchase, payment
verification or learner achievement. Both attempts restored their temporary
data, and existing browser sessions were preserved.

Evidence and the verification scripts are under `learning-study-private/`:
`check-production-capstone-access.mjs`, `verify-production-folder-picker.mjs`
and `live-project-export-2026-09-18/{production-capstone-access.json,folder-picker-qa-plan.json}`.
The same evidence directory contains `folder-picker-result.json`,
`folder-picker-first-attempt.json`, `folder-picker-cleanup.json` and
`production-folder-picker-mobile.png`.

## Natural token expiry

Read-only inspection on the existing Fly machine confirmed the newly stored
credential is encrypted and includes a refresh token. Credentials remain on
Fly. Only boolean checks and timestamps leave the machine.

- Access-token expiry: **2026-09-18 19:26:11 UTC**, or **21:26:11 Berlin time**.
- Refresh-token expiry: **2027-03-18 11:26:11 UTC**.
- First eligible observation: **19:28:11 UTC / 21:28:11 Berlin**, allowing two
  minutes after natural expiry. The scheduler checks its local clock once per
  minute and makes no remote request before that time.

The remote worker will confirm GitHub rejects the old token with 401, then
call the real production destination-preview endpoint with a fresh temporary
Supabase user session. Passing requires both access and refresh tokens to
change in encrypted storage, the expiry to advance, and a second API request
to succeed without rotating again. It makes no repository writes and does not
alter the token's expiry metadata. Temporary-session cleanup is part of the
pass condition.

A live preflight already authenticated, received production HTTP 200 and
revoked its temporary session. The stored GitHub credential remained unchanged.
An early invocation of the observation mode returned `not_due` without an
authenticated API request. Four isolated scheduler checks passed: early-run
suppression, successful-result recording before cleanup, deferral when another
request renews first, and a bounded connection-failure retry limit.

The observer is installed as the local LaunchAgent
`app.tensorcraft.verify-github-renewal-20260918`. Its initial scheduled run
exited successfully. The initial Desktop-based installation was rejected by
macOS background-file access; the installed job is a standalone package under
`~/Library/Application Support/Tensorcraft/renewal-verification-20260918/`.
It needs this Mac online with the existing Fly login. If asleep, observation
can resume after waking. The job stops after a result or after its 24-hour
deadline and removes its LaunchAgent registration and plist.

The installed job writes `live-project-export-2026-09-18/renewal-watch.json`
and, when observed, `renewal-result.json` beneath that Application Support
directory. The repository's private `renewal-scheduled-job.json` records the
exact installed paths. A different credential observed before the scheduled
request defers the check to that credential's expiry; it is not counted as a
successful observed renewal.

At the recorded status time, the job is `waiting_for_expiry`, with zero
observations. Preflight success is not evidence of renewal after expiry.


## Observed result, 2026-09-18 at 19:28 UTC

The previously scheduled observer completed successfully at 19:28:50 UTC
(21:28:50 Berlin). The expired GitHub token returned 401. The production
preview request returned 200 and rotated both encrypted access and refresh
credentials with an advanced expiry. A second request returned 200 and reused
the refreshed credential. Expiry metadata was not modified, no repository
writes occurred, and the temporary Supabase session was revoked. The scheduler
recorded `passed`; its plist has been removed.

See the [redacted result](github-token-renewal-observed-2026-09-18.json).
This closes the natural-expiry observation gap described above. Earlier
waiting/preflight notes are retained as the history of this check.
