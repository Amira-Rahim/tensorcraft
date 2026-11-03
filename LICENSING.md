# Tensorcraft licensing

Tensorcraft-owned code and course content in this repository are available
under the Mozilla Public License 2.0. The root [LICENSE](LICENSE) contains
the unchanged license text. This includes lessons, exercises, solutions,
and original supporting assets, subject to the existing notices below.

## Existing licenses and third-party material

The MPL grant does not remove permissions already granted under another
license. Preserve the notices that accompany these materials:

| Material                                                                | Existing terms | Location                                                                                                                          |
| ----------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Public JavaScript-to-ML bridges package                                 | MIT            | [Package metadata](packages/bridges-public/package.json) and [README](packages/bridges-public/README.md)                          |
| Build Triage original dataset and starter material                      | CC0 1.0        | [License notice](apps/web/public/assignments/build-triage-v1/LICENSE.txt)                                                         |
| Room Occupancy original starter code and project writing                | CC0 1.0        | [Code notice](apps/web/public/assignments/room-occupancy-v1/CODE-LICENSE.txt)                                                     |
| Room Occupancy source dataset and the included subset                   | CC BY 4.0      | [Attribution and changes](apps/web/public/assignments/room-occupancy-v1/DATA-LICENSE.md)                                          |
| Vendored TensorFlow.js 4.22.0 browser bundle, copyright 2024 Google LLC | Apache 2.0     | [License](apps/web/public/vendor/LICENSE-tensorflowjs.txt) and the existing header in `apps/web/public/vendor/tfjs-4.22.0.min.js` |

Third-party dependencies retain their own licenses. Their source and license
notices accompany the installed packages. Installing a dependency does not
make it Tensorcraft-owned material.

The optional runtime lab downloads a third-party pretrained DistilBERT model.
Its [README](scripts/fixtures/runtime-lab-package/README.md) links to the
model source and licensing information. The download is separate from the
model assets shipped in this repository.

The MPL does not grant rights to contributors' trademarks, service marks,
or logos. See section 2.3 of the license.
