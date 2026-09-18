"""Package only authored project files; omit installed deps and generated work."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1] / 'apps/web/public/assignments'
source = root / 'room-occupancy-v1'
# Keep this list aligned with ROOM_PROJECT_FILES. Never package incidental
# top-level secrets, installed files or a maintainer's fitted experiment.
files = [
    '.gitignore', 'CODE-LICENSE.txt', 'DATA-LICENSE.md', 'README.md', 'RUBRIC.md',
    'app.mjs', 'artifact.mjs', 'check.mjs', 'data.json', 'evaluate.mjs',
    'evaluation.mjs', 'index.html', 'package-lock.json', 'package.json',
    'plan.json', 'preprocessing.mjs', 'report.md', 'serve.mjs', 'train.mjs',
]
with ZipFile(root / 'room-occupancy-v1.zip', 'w', compression=ZIP_DEFLATED) as z:
    for name in sorted(files):
        p = source / name
        info = ZipInfo('room-occupancy-v1/' + p.name, (2026, 9, 17, 0, 0, 0))
        info.external_attr = 0o644 << 16
        info.compress_type = ZIP_DEFLATED
        z.writestr(info, p.read_bytes())
print('Packaged room-occupancy-v1.zip')
