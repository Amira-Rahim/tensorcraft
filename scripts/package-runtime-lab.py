"""Package an explicit file list, never browser profiles or downloaded models."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
files = {
    'README.md': 'scripts/fixtures/runtime-lab-package/README.md',
    'package.json': 'scripts/fixtures/runtime-lab-package/package.json',
    'package-lock.json': 'scripts/fixtures/runtime-lab-package/package-lock.json',
    'scripts/check-runtime-lab.mjs': 'scripts/check-runtime-lab.mjs',
    'scripts/check-model-deployment.mjs': 'scripts/check-model-deployment.mjs',
    'models/deep-scan/model.json': 'apps/web/public/models/deep-scan/model.json',
    'models/deep-scan/weights.bin': 'apps/web/public/models/deep-scan/weights.bin',
}
for name in ['artifact.mjs', 'browser.js', 'converter-requirements.txt',
             'export-onnx.mjs', 'index.html', 'pretrained-files.json']:
    files['scripts/runtime-lab/' + name] = 'scripts/runtime-lab/' + name

destination = root / 'apps/web/public/assignments/browser-runtime-lab-v1.zip'
with ZipFile(destination, 'w', compression=ZIP_DEFLATED) as archive:
    for destination_name, source in sorted(files.items()):
        info = ZipInfo('browser-runtime-lab-v1/' + destination_name, (2026, 9, 18, 0, 0, 0))
        info.external_attr = 0o644 << 16
        info.compress_type = ZIP_DEFLATED
        archive.writestr(info, (root / source).read_bytes())
print('Packaged browser-runtime-lab-v1.zip')
