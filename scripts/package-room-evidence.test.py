"""Check the standalone export boundary and integrity verification."""

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from zipfile import ZipFile
from io import BytesIO

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "apps/web/public/evidence/room-project-v1"
ARCHIVE = EXPORT.with_suffix(".zip")


class RoomEvidencePackageTest(unittest.TestCase):
    def test_export_is_current_and_archive_matches_each_served_file(self):
        subprocess.run(
            ["python3", str(ROOT / "scripts/package-room-evidence.py"), "--check"],
            check=True,
            capture_output=True,
        )
        manifest = json.loads((EXPORT / "manifest.json").read_text())
        self.assertEqual(manifest["kind"], "maintainer_reproduction_export")
        names = {row["path"] for row in manifest["files"]} | {"manifest.json"}
        with ZipFile(ARCHIVE) as archive:
            prefix = "room-project-evidence-v1/"
            self.assertEqual(set(archive.namelist()), {prefix + p for p in names})
            for name in names:
                self.assertEqual(archive.read(prefix + name), (EXPORT / name).read_bytes())
        for row in manifest["files"]:
            data = (EXPORT / row["path"]).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(), row["sha256"])
            self.assertEqual(data, (ROOT / row["source"]).read_bytes())

    def test_archive_retains_the_unimplemented_starter_and_its_notices(self):
        starter = EXPORT / "apps/web/public/assignments/room-occupancy-v1.zip"
        with ZipFile(BytesIO(starter.read_bytes())) as archive:
            names = archive.namelist()
            self.assertEqual(len(names), 19)
            self.assertFalse(any("/model/" in name or "/node_modules/" in name for name in names))
            self.assertIn("room-occupancy-v1/CODE-LICENSE.txt", names)
            self.assertIn("room-occupancy-v1/DATA-LICENSE.md", names)
            self.assertIn(b"Implement your experiment", archive.read("room-occupancy-v1/train.mjs"))
        exported = json.loads((EXPORT / "manifest.json").read_text())["files"]
        for row in exported:
            self.assertFalse(row["path"].startswith(("packages/", "docs/", ".git/")))
            self.assertNotIn("node_modules", Path(row["path"]).parts)
            self.assertNotIn(".env", Path(row["path"]).parts)

    def test_verifier_rejects_changed_source_and_an_escaping_manifest_path(self):
        with tempfile.TemporaryDirectory(prefix="room-evidence-check-") as temp:
            target = Path(temp) / "package"
            shutil.copytree(EXPORT, target)
            verify = ["node", "verify.mjs"]
            good = subprocess.run(verify, cwd=target, capture_output=True, text=True)
            self.assertEqual(good.returncode, 0, good.stderr)
            fixture = target / "scripts/fixtures/room-project/train.mjs"
            fixture.write_bytes(fixture.read_bytes() + b"\n// changed\n")
            changed = subprocess.run(verify, cwd=target, capture_output=True, text=True)
            self.assertNotEqual(changed.returncode, 0)
            self.assertIn("changed: scripts/fixtures/room-project/train.mjs", changed.stderr)
            manifest_path = target / "manifest.json"
            manifest = json.loads(manifest_path.read_text())
            manifest["files"][0]["path"] = "../outside.txt"
            manifest_path.write_text(json.dumps(manifest))
            escaped = subprocess.run(verify, cwd=target, capture_output=True, text=True)
            self.assertNotEqual(escaped.returncode, 0)
            self.assertIn("Manifest path escaped package", escaped.stderr)


if __name__ == "__main__":
    unittest.main()
