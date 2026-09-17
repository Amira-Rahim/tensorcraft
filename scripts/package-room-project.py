"""Package only authored project files; omit installed deps and generated work."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1] / 'apps/web/public/assignments'
source = root / 'room-occupancy-v1'
with ZipFile(root / 'room-occupancy-v1.zip', 'w', compression=ZIP_DEFLATED) as z:
    for p in sorted(source.iterdir()):
        if not p.is_file() or p.name.startswith('.DS_'): continue
        info = ZipInfo('room-occupancy-v1/' + p.name, (2026, 9, 17, 0, 0, 0))
        info.external_attr = 0o644 << 16
        info.compress_type = ZIP_DEFLATED
        z.writestr(info, p.read_bytes())
print('Packaged room-occupancy-v1.zip')
