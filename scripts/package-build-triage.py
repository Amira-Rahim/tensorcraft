"""Produce the learner download with stable file order, timestamps and permissions."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
folder = root / 'apps/web/public/assignments/build-triage-v1'
with ZipFile(folder.with_suffix('.zip'), 'w', compression=ZIP_DEFLATED) as archive:
    for name in ['LICENSE.txt', 'README.md', 'data.json', 'package.json', 'starter.mjs']:
        info = ZipInfo(f'build-triage-v1/{name}', date_time=(2026, 9, 17, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, (folder / name).read_bytes())
print('Packaged build-triage-v1.zip')
