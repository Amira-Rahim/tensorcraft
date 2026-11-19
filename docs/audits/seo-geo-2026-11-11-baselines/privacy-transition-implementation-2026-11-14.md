# Public evidence and repository privacy preparation

November 14, 2026. This record covers P01-P05 and preparation for P07 in the
pre-private SEO/GEO work plan. No repository visibility, license, account
permission, deployment or publication changed. Outreach remains paused.

## Implemented reproduction boundary

The versioned export uses an explicit file allowlist. It includes the current
integration runner, exact maintainer fixture, preview builder, separate
learner starter ZIP, locked runner dependencies, MPL text, scoped material
notices, recorded references and file hashes. It excludes application history,
course lessons, accounts, credentials and unrelated application source.

The same-origin paths prepared for release are:

| Public path | Purpose |
| --- | --- |
| `/evidence/room-project-v1.zip` | Complete standalone reproduction download. |
| `/evidence/room-project-v1/README.md` | Requirements, numerical commands, separate browser instructions and limitations. |
| `/evidence/room-project-v1/manifest.json` | Versioned allowlist, original source paths, file sizes and SHA-256 values. |
| `/evidence/room-project-v1/NOTICE.md` | Notices scoped to this example export. |
| `/evidence/room-project-v1/LICENSE` | Unchanged MPL 2.0 text. |
| `/evidence/room-project-v1/scripts/check-room-project.mjs` | Existing integration runner with explicit `--node-only` support. |
| `/evidence/room-project-v1/scripts/fixtures/room-project/train.mjs` | Unchanged supplied fixture, separate from learner starter code. |
| `/evidence/room-project-v1/scripts/build-room-project-preview.mjs` | Preview builder with an optional output path. |
| `/evidence/room-project-v1/room-training-reference-v1.json` | Supplied five-epoch browser-demo reference for comparison. |

`python3 scripts/package-room-evidence.py` creates the directory and ZIP.
`--check` rejects stale bytes, unexpected export files and an archive that no
longer matches the allowlisted sources. Fixed archive entry dates make an
unchanged export deterministic. The generated directory is excluded from
Prettier, so formatting occurs in source templates before packaging.

The package installs exactly `@playwright/test` 1.64.1 through its included
lockfile. Its numerical command uses no browser. The runner creates a fresh
starter directory, installs locked TensorFlow.js 4.22.0 dependencies and runs
real fitting, export, reload and paired evaluation. It also rejects overlapping
splits, preprocessing leakage and a corrupt model artifact.

The learner starter remains its original 19-file package. Its training task
is unimplemented and it contains no fitted solution. The supplied maintainer
fixture sits outside that starter. The wrapper compares reproduced hashes and
the recorded mistake, then checks validation metrics against the separately
versioned browser-demo reference.

## Source and material inventory

This is an implementation inventory, not a new licensing decision. The
existing [LICENSING.md](../../../LICENSING.md) explicitly applies MPL 2.0 to
Tensorcraft-owned code, lessons, exercises, solutions and original supporting
assets, subject to earlier grants and third-party notices. The
[README](../../../README.md) and public Terms repeat that scope.

| Source or material | Current stated terms and exposure | Remaining decision or verification |
| --- | --- | --- |
| Main application and supporting packages | Tensorcraft-owned material uses MPL 2.0. `apps/web` mixes browser and server modules. | Build a delivered-file/source map before deciding future source availability. Directory names alone do not establish distribution scope. |
| Course lessons, exercises and solutions | Existing licensing notes include these under MPL. The public repository currently exposes their source. Application purchase checks separately gate paid lesson bodies. | Preserve existing grants. Verify anonymous HTTP/RSC/prefetch/chunk boundaries independently of repository access. |
| Original scene and other supporting assets | Existing licensing notes include original supporting assets. Files under the public directory remain downloadable from the site. | Decide deliberate public media scope. Repository privacy cannot make still-public site assets private. |
| Public bridges package | Earlier MIT terms remain recorded in package metadata and README. | Preserve those notices and earlier permissions. |
| Room Occupancy starter code and writing | CC0-1.0 in the starter's `CODE-LICENSE.txt`. | Preserve the separate learner download and its notices. |
| Room Occupancy recorded data | CC BY 4.0 in `DATA-LICENSE.md`, with source DOI, archive hash and modification record. | Retain attribution, sampling details and the unstated timestamp timezone. |
| Build Triage original data and starter | Existing CC0-1.0 notice. | Preserve it as a separate earlier grant. |
| Vendored TensorFlow.js browser runtime | Apache 2.0 text and existing Google copyright header. | Keep its notices and dependency identity. |
| Installed dependencies and optional downloaded model | Their own licenses and model notices apply. | Keep them separate from Tensorcraft-owned licensing claims. |
| New reproduction wrapper and copied integration code | MPL 2.0 with unchanged root license text. Starter/data notices remain inside the separate embedded archive. | This limited export does not settle all application-wide source-access requirements. |

Mozilla's [MPL FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/) distinguishes
server functionality from delivered browser code and treats minified
JavaScript as executable form. Scope the existing covered material before
changing notices or relying on private access as a source-availability policy.
This work changes no existing grant or legal statement.

The public Terms currently link to the whole application repository for its
license and material notices. The demo-only `NOTICE.md` above is not a complete
replacement for that application-wide statement. Its future destination
remains open until the source-access inventory and owner decision are complete.

GitHub's [visibility documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)
states that existing public forks remain public after a repository becomes
private. Repository visibility also does not revoke copies already obtained.

## Executed verification

A clean extracted export reproduced the existing reference using Node
26.10.0, TensorFlow.js 4.22.0 and its CPU backend. It used no main application
checkout and launched no browser.

| Validation outcome on 400 readings | Light rule | Model, five epochs |
| --- | ---: | ---: |
| Correct occupied | 61 | 60 |
| False alarms | 36 | 20 |
| Correct empty | 303 | 319 |
| Missed occupancy | 0 | 1 |
| Accuracy | 91% | 94.75% |
| Illustrative cost, false alarm 1 and miss 4 | 36 | 24 |

The selected validation mistake remains `datatest2.txt:1193`, model score
`0.6562567353248596`. All four model artifact hashes and the fixture source
hash matched the recorded reference. Recorded execution times differ between
runs and are not model identity fields.

The integration fixture exercises final-period evaluation as a software path
check. That does not turn it into independent quality evidence. The browser
demo's separate reference keeps the last 456 readings outside displayed
training/validation metrics. Neither supplied result is a learner outcome.

Three packaging tests pass. They check the archive against served files and
source hashes, preserve the unimplemented 19-file starter and its notices,
and reject changed source or a manifest path that escapes the package.

Reproduction commands from the repository root:

```sh
python3 scripts/package-room-evidence.py
python3 scripts/package-room-evidence.py --check
python3 scripts/package-room-evidence.test.py
```

Browser parity, input interaction and playback are separate checks. The
package documents the full browser runner, but this implementation verification
did not execute it. No numerical pass is reported as browser QA.

## Private-repository transition runbook

These are preparation gates. They do not authorize changing visibility or
granting account permissions.

1. Freeze the intended revision and finish the application source/license
   availability decision. Preserve existing notices and permissions.
2. Rebuild and verify the allowlisted export from that revision. Inspect the
   ZIP and test its numerical reproduction without a repository checkout.
3. Verify released guide anchors, fixture commands, source and notice links
   anonymously. The export must be live before repository-dependent links
   become inaccessible. Complete the application-wide notice destination.
4. Confirm Vercel's existing GitHub installation can access the intended
   private repository. Record a nonproduction build and its migration gate.
   Source inspection alone cannot establish the account's access.
5. Confirm required GitHub checks, branch rules and scheduled workflows remain
   available. Existing workflows use authenticated `actions/checkout`.
6. Confirm Fly deployment and its existing API migration preflight retain
   their intended credentials and permissions. Keep secret values out of logs.
7. Verify synthetic checks, partitions, news and digest jobs after transition.
   Their existing token references do not establish future account behavior.
8. Recheck public pages, free lessons, demo assets and source/notices without
   a GitHub session. Separately verify paid body and solution boundaries.
9. Run the bounded link and canonical checks against the deployed website.
   Record the deploy revision, changed URLs and recrawl decisions.
10. Keep outreach paused until the owner confirms repository privacy. Any
    later reviewer contact or publication needs its applicable instruction.

## Recrawl assessment

The packaging scripts, tests and internal inventory alone change no public
HTML. The release changes guide evidence links and its recorded reproduction
instructions. `/guides/browser-machine-learning-project` needs a targeted
recrawl assessment after those changes appear in production. The new evidence
files need working anonymous links, not a bulk indexing submission.

No production request is claimed for these local-only assets. Other changed
public pages require their own assessment by the integrating agent.
