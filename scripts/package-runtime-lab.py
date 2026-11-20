"""Package an explicit file list, never browser profiles or downloaded models."""
import argparse
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
             'export-onnx.mjs', 'index.html', 'pretrained-files.json',
             'wheels/tensorflow_hub-0.16.1+tensorcraft.1-py3-none-any.whl']:
    files['scripts/runtime-lab/' + name] = 'scripts/runtime-lab/' + name

destination = root / 'apps/web/public/assignments/browser-runtime-lab-v1.zip'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument(
    '--check', action='store_true', help='Compare the archive with its sources.'
)
args = parser.parse_args()
entries = {
    f'{destination.stem}/{name}': (root / source).read_bytes()
    for name, source in sorted(files.items())
}

if args.check:
    with ZipFile(destination) as archive:
        if sorted(archive.namelist()) != sorted(entries):
            raise SystemExit(f'Rebuild {destination.name} to match the file list.')
        stale = [name for name, data in entries.items() if archive.read(name) != data]
        if stale:
            raise SystemExit('Rebuild the archive to update ' + ', '.join(stale))
    print(f'Verified {destination.name}')
else:
    with ZipFile(destination, 'w', compression=ZIP_DEFLATED) as archive:
        for name, data in entries.items():
            info = ZipInfo(name, (2026, 9, 18, 0, 0, 0))
            info.external_attr = 0o644 << 16
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, data)
    print(f'Packaged {destination.name}')
