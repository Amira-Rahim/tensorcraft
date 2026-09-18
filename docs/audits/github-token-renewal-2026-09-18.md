# GitHub token renewal repair

The authorized live API check authenticated the existing test account on
2026-09-18 at 08:29 UTC. Production destination preview returned 401 with
`github_token_expired`: GitHub rejected the saved credential as expired or
revoked. The test stopped before publication. The temporary Supabase session
was revoked with local scope; existing browser sessions were not signed out.
No repository file or permission was changed.

## Confirmed defect and repair

The OAuth exchange returned a refresh token, but the callback saved only the
access token. It also discarded expiry information. GitHub documents an
eight-hour access-token lifetime and rotating refresh tokens for expiring
GitHub App authorizations. The failed response alone does not distinguish
expiration from revocation, but the missing renewal implementation is a
confirmed defect. See [GitHub's renewal contract](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens).

The callback now retains access/refresh tokens and both expiry times in one
encrypted value in the existing `profiles.github_token` column. New rotating
credentials require the encryption key. Existing encrypted single-token and
legacy plaintext rows remain readable. No schema migration is needed.

GitHub operations renew an expiring token before using it. A Redis lease
coordinates requests across API machines. Waiting requests read the renewed
value rather than consuming the same refresh token. A conditional database
write prevents a late renewal from undoing a disconnect or replacing a new
authorization. A lost successful database response is recovered by reading
the saved value. A failed database write retries persistence without consuming
the refresh token again. Persistent service failures return a retryable error;
expired refresh authorization asks the learner to reconnect.

Disconnect reads the access token without renewing it and clears the entire
pair. The legacy push route now decrypts credentials too. The status API checks
the credential with GitHub, so a rejected token is no longer reported as a
working connection by that endpoint. Settings has a Reconnect GitHub action
that starts authorization without first revoking the old connection. Its
existing connection badge still starts from the stored profile flag.

No expiration setting was disabled, no broader token substituted, and no
repository access was expanded. OAuth error bodies are excluded from renewal
errors because they can contain credentials.

## Validation

- 120 targeted tests passed across eight API/UI suites. The final route suite
  passed 37 tests after adding an integrated renewal-to-project-preview case,
  bringing the distinct covered cases to 121.
- Checks cover encrypted callback persistence, real helper wiring, token
  rotation, concurrent requests, lock failure, bounded waiting, disconnect
  races, failed/ambiguous persistence, expired authorization, sanitized OAuth
  errors and the Settings reconnect action.
- API and web type checks passed. API lint passed with nine existing warnings;
  changed Settings files passed lint. No new lint error was introduced.
- Production required-variable preflight passed.

These are automated checks with simulated external renewal responses. At the
time of deployment, the old row had no retained refresh token to recover and
required new GitHub authorization. The subsequent reconnect and live export
results are recorded below; a live expiry/renewal cycle remains unobserved.

## Release and remaining live checks

The repair is deployed:

- Fly release 32, image
  `registry.fly.io/tensorcraft-api:deployment-01M2STXX0BCHZ2Q09PQ0W6P0W5`.
  Both machines completed rollout. Health and readiness returned 200 at
  08:47 UTC, including `checks.db: ok`.
- Vercel [deployment dpl_3bJw26RAycdLk28JzSv8VekS86cY](https://vercel.com/amira-salahs-projects/tensorcraft/3bJw26RAycdLk28JzSv8VekS86cY)
  built successfully, passed its staged homepage check, and was promoted to
  `tensorcraft.app`.
- The isolated 1,969-file deployment snapshot has manifest SHA-256
  `86622dfb0b2ff873297af07e219c4b6b0cca47c4939beb1cc38e1d883dcb77be`,
  based on revision `95699ae2` plus uncommitted changes. No source-repository
  commit or push was made.
- An authenticated HTTP check of production Settings returned 200, and its
  deployed JavaScript contains the Reconnect GitHub action. The status API
  returned `connected: false` and `github_token_expired` for the old credential.
  The temporary verification session was revoked. This checks deployed
  responses and code delivery, not the browser OAuth interaction.

The owner reconnected the existing account at 11:26 UTC. Production project
preview and publication then returned 200. The live test published 26 files,
reused the same commit on identical retry and preserved the three existing
repository files. A fresh clone reproduced the saved model, validation/test
results and standalone browser predictions. See the
[live verification record](project-export-live-2026-09-18.md).

These requests used the newly authorized credential. Automatic renewal still
needs observation when that credential reaches its renewal window. The
production course folder-picker interaction also remains a separate check.

The codec change is backward compatible with old stored credentials. A
rollback to a build without this codec would not understand newly stored
rotating pairs, so a rollback must retain the credential reader or require
affected users to reconnect.

## Review handoff update

The two changed supporting records invalidate their previous source hashes;
four renewal implementation/test files were added to coverage. A new blank
handoff was frozen on 2026-09-18 with 216 artifacts and no independent scores.
The earlier archive is retained as a historical snapshot.

Current archive: `learning-study-private/deep-orbit-review-handoff-2026-09-18.zip`.
It contains 233 files, 1,176,676 bytes, with SHA-256
`54a7c8c7bfebab698eb9da55918176cc613d6376ae1a7c4312c9a952b8c73930`.
A clean extraction reports no source drift and acceptance `not_accepted`.
No reviewer outreach or enrollment was performed.
