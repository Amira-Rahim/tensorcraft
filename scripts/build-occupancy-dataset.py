"""Build the teaching subset from the original UCI download. No model or split."""
import csv
import hashlib
import io
import json
from pathlib import Path
import sys
import zipfile

archive = Path(sys.argv[1])
rows = []
with zipfile.ZipFile(archive) as data:
    for name in sorted(data.namelist()):
        reader = csv.reader(io.StringIO(data.read(name).decode()))
        next(reader)  # Source header omits the row-ID column.
        for r in reader:
            rows.append(dict(id=f"{name}:{r[0]}", recordedAt=r[1],
                temperature=float(r[2]), humidity=float(r[3]), light=float(r[4]),
                co2=float(r[5]), humidityRatio=float(r[6]), occupied=int(r[7])))
rows.sort(key=lambda r: (r['recordedAt'], r['id']))
assert len(rows) == 20560
assert len({r['recordedAt'] for r in rows}) == len(rows)
result = dict(version='room-occupancy-v1', source='https://doi.org/10.24432/C5X01N',
    sourceArchiveSha256=hashlib.sha256(archive.read_bytes()).hexdigest(),
    license='CC-BY-4.0', transformation='Sort all 20560 rows by source timestamp; retain indices 0, 10, 20, ...; rename fields. No imputation, scaling or label changes.',
    timezone='Source timezone unspecified; recordedAt preserves source wall-clock text.',
    rows=rows[::10])
output = Path(__file__).resolve().parents[1] / 'apps/web/public/assignments/room-occupancy-v1/data.json'
output.write_text(json.dumps(result, separators=(',', ':'), ensure_ascii=False)+'\n')
print(f'Wrote {len(result["rows"])} rows; source SHA-256 {result["sourceArchiveSha256"]}')
