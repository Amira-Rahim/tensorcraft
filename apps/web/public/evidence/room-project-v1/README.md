# Room-project reproduction package

This package reproduces Tensorcraft's supplied five-epoch room-occupancy
experiment. It contains the source, a separate learner starter, recorded
reference and file hashes needed to check that example without cloning the
application repository.

The maintainer experiment checks the project's integration. It is not a
learner submission, a recommended model or evidence of course effectiveness.

## Requirements

- Node.js 22 or later, npm and the `unzip` command.
- Network access for the initial locked dependency installations.
- A writable temporary directory. The scripts create a fresh project there.

## Numerical reproduction

Extract the archive, open its `room-project-evidence-v1` directory and run:

```sh
node verify.mjs
npm ci --ignore-scripts --no-audit --no-fund
npm run reproduce
```

Verification checks the exported files against `manifest.json`. Reproduction
then installs the starter's locked TensorFlow.js 4.22.0 dependency, trains the
fixed CPU model, reloads its saved artifacts and evaluates both policies.
It checks overlap and preprocessing-leakage rejection, the cost arithmetic
and corrupt-artifact rejection. It compares the generated validation preview
with the supplied reference, including the fixture and artifact hashes.
It also compares the paired validation metrics with the separately versioned
browser-demo reference.

The command prints the clean project directory and generated preview path.
Recorded times identify individual runs and are expected to differ.

The integration runner exercises validation and final-period evaluation to
check both code paths. These supplied maintainer results are not an independent
test of model quality. The public browser demonstration reserves its final
456 rows outside its displayed training and validation metrics.

## Browser verification

The numerical command does not run a browser or verify browser interaction.
The complete original runner is included for a separate browser check:

```sh
npx playwright install chromium
npm run check:browser
```

That command repeats the clean numerical lifecycle and then checks browser
prediction parity, invalid input, missing and corrupt artifacts, local-only
requests and a narrow viewport. A browser run needs its own result record.
Passing the numerical command alone does not establish those checks.

## Package contents and source

`manifest.json` identifies every exported file and its SHA-256. The package
uses an explicit allowlist and contains no application repository history,
accounts, credentials, course lesson bodies or unrelated application source.

- `scripts/check-room-project.mjs`: integration runner, with an explicit
  `--node-only` mode.
- `scripts/fixtures/room-project/train.mjs`: supplied maintainer experiment.
- `scripts/build-room-project-preview.mjs`: preview builder, which verifies
  source and artifact hashes before selecting a real shared mistake.
- `reference-preview.json`: the previously recorded supplied mistake and
  artifact identity.
- `room-training-reference-v1.json`: the supplied browser demonstration's
  versioned five-epoch validation comparison. It identifies that demo's
  method, data and runtime, with its final-period limitation.
- `apps/web/public/assignments/room-occupancy-v1.zip`: the separate learner
  starter. Its authored `train.mjs` remains unimplemented and it contains no
  trained solution artifacts.

`verify.mjs` checks package integrity. Hashes identify this release, but they
do not authenticate an archive obtained from an untrusted source. Download
the package from Tensorcraft's canonical website.

## License and limitations

The reproduction scripts and package wrapper use MPL 2.0. See `LICENSE` and
`NOTICE.md`. The starter's original code and project writing use CC0-1.0.
The recorded dataset uses CC BY 4.0, and dependency licenses still apply.
The starter archive retains those notices and its data modification record.

This limited example export does not determine the licensing or required
source access for the rest of Tensorcraft. It makes no promise that a private
application repository can retract earlier rights or copies.
