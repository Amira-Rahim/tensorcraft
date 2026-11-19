"""Build the allowlisted, standalone maintainer reproduction download."""

import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "scripts/fixtures/room-evidence-package"
OUTPUT = ROOT / "apps/web/public/evidence/room-project-v1"
ARCHIVE = OUTPUT.with_suffix(".zip")
PACKAGE_ROOT = "room-project-evidence-v1"

# Include only the example's reproduction chain. Never recurse through the
# application, curriculum, repository history or an installed dependency folder.
FILES = {
    "README.md": TEMPLATE / "README.md",
    "NOTICE.md": TEMPLATE / "NOTICE.md",
    "LICENSE": ROOT / "LICENSE",
    "package.json": TEMPLATE / "package.json",
    "package-lock.json": TEMPLATE / "package-lock.json",
    "verify.mjs": TEMPLATE / "verify.mjs",
    "reproduce.mjs": TEMPLATE / "reproduce.mjs",
    "reference-preview.json": ROOT
    / "apps/web/public/assignments/room-project-preview.json",
    "room-training-reference-v1.json": ROOT
    / "apps/web/public/assignments/room-training-reference-v1.json",
    "scripts/check-room-project.mjs": ROOT / "scripts/check-room-project.mjs",
    "scripts/fixtures/room-project/train.mjs": ROOT
    / "scripts/fixtures/room-project/train.mjs",
    "scripts/build-room-project-preview.mjs": ROOT
    / "scripts/build-room-project-preview.mjs",
    "apps/web/public/assignments/room-occupancy-v1.zip": ROOT
    / "apps/web/public/assignments/room-occupancy-v1.zip",
}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def content():
    files = {name: path.read_bytes() for name, path in FILES.items()}
    manifest = {
        "kind": "maintainer_reproduction_export",
        "version": 1,
        "scope": "Supplied room-project integration evidence and separate learner starter.",
        "browserChecks": "Not implied by numerical reproduction. Run separately.",
        "sourceNotice": "MPL 2.0 applies to reproduction code. Starter and data retain their separate notices. This is not an application-wide licensing inventory.",
        "files": [
            {
                "path": name,
                "bytes": len(data),
                "sha256": sha256(data),
                "source": str(FILES[name].relative_to(ROOT)),
            }
            for name, data in sorted(files.items())
        ],
    }
    files["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    return files


def archive_bytes(files):
    from io import BytesIO

    output = BytesIO()
    with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
        for name, data in sorted(files.items()):
            info = ZipInfo(f"{PACKAGE_ROOT}/{name}", (2026, 11, 14, 0, 0, 0))
            info.external_attr = 0o644 << 16
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, data)
    return output.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    files = content()
    existing = {
        str(path.relative_to(OUTPUT))
        for path in OUTPUT.rglob("*")
        if path.is_file()
    }
    unexpected = existing - files.keys()
    if unexpected:
        raise SystemExit(f"Refusing unexpected export files: {sorted(unexpected)}")
    if args.check:
        if existing != files.keys():
            raise SystemExit("Export file allowlist differs. Rebuild the package.")
        for name, data in files.items():
            if (OUTPUT / name).read_bytes() != data:
                raise SystemExit(f"Export changed or stale: {name}")
        if not ARCHIVE.exists():
            raise SystemExit("Export archive is missing.")
        with ZipFile(ARCHIVE) as archive:
            names = {f"{PACKAGE_ROOT}/{name}" for name in files}
            if set(archive.namelist()) != names or len(archive.namelist()) != len(names):
                raise SystemExit("Export archive allowlist changed.")
            for name, data in files.items():
                entry = f"{PACKAGE_ROOT}/{name}"
                info = archive.getinfo(entry)
                if (
                    archive.read(entry) != data
                    or info.date_time != (2026, 11, 14, 0, 0, 0)
                    or info.external_attr != 0o644 << 16
                ):
                    raise SystemExit(f"Export archive changed or stale: {name}")
        print(f"Verified {len(files)} allowlisted export files and archive.")
        return
    archive = archive_bytes(files)
    for name, data in files.items():
        target = OUTPUT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    ARCHIVE.write_bytes(archive)
    print(
        json.dumps(
            {
                "directory": str(OUTPUT.relative_to(ROOT)),
                "archive": str(ARCHIVE.relative_to(ROOT)),
                "files": len(files),
                "archiveSha256": sha256(archive),
            }
        )
    )


if __name__ == "__main__":
    main()
