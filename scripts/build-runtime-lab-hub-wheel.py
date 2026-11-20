"""Rebuild the runtime lab's TensorFlow Hub wheel from verified upstream bytes."""
import base64
import csv
import hashlib
from io import BytesIO, StringIO
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile, ZipInfo

VERSION = "0.16.1+tensorcraft.1"
UPSTREAM_INFO = "tensorflow_hub-0.16.1.dist-info"
INFO = f"tensorflow_hub-{VERSION}.dist-info"
WHEEL_URL = (
    "https://files.pythonhosted.org/packages/e5/50/"
    "00dba77925bf2a0a1e45d7bcf8a69a1d2534fb4bb277d9010bd148d2235e/"
    "tensorflow_hub-0.16.1-py2.py3-none-any.whl"
)
LICENSE_URL = (
    "https://raw.githubusercontent.com/tensorflow/hub/"
    "ff72e25fef44bd67d5c14fb5328aa44e303e3404/tensorflow_hub/LICENSE"
)


def download(url, expected_sha256):
    with urlopen(url, timeout=30) as response:
        data = response.read()
    if hashlib.sha256(data).hexdigest() != expected_sha256:
        raise ValueError(f"SHA-256 mismatch for {url}")
    return data


def main():
    upstream = download(
        WHEEL_URL, "e10c184b3d08daeafada11ffea2dd46781725b6bef01fad1f74d6634ad05311f"
    )
    with ZipFile(BytesIO(upstream)) as wheel:
        files = {
            name.replace(UPSTREAM_INFO, INFO): wheel.read(name)
            for name in wheel.namelist()
            if name != f"{UPSTREAM_INFO}/RECORD"
        }
    files[f"{INFO}/LICENSE.txt"] = download(
        LICENSE_URL, "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30"
    )

    # Upstream proposed the version parser change in tensorflow/hub#935.
    init = files["tensorflow_hub/__init__.py"]
    start = init.index(b"  from pkg_resources import parse_version")
    end = init.index(b"  required_tensorflow_version", start)
    files["tensorflow_hub/__init__.py"] = (
        init[:start]
        + b"  # Tensorcraft changed the version check to use packaging (tensorflow/hub#935).\n"
        + b"  from packaging.version import parse as parse_version\n\n"
        + init[end:]
    )
    files["tensorflow_hub/version.py"] = files["tensorflow_hub/version.py"].replace(
        b'__version__ = "0.16.1"',
        f'# Tensorcraft added the local build version.\n__version__ = "{VERSION}"'.encode(),
    )
    files[f"{INFO}/METADATA"] = files[f"{INFO}/METADATA"].replace(
        b"\nVersion: 0.16.1\n", f"\nVersion: {VERSION}\n".encode()
    ).replace(b"Requires-Dist: numpy", b"Requires-Dist: packaging\nRequires-Dist: numpy")
    files[f"{INFO}/WHEEL"] = (
        b"Wheel-Version: 1.0\nGenerator: build-runtime-lab-hub-wheel.py\n"
        b"Root-Is-Purelib: true\nTag: py3-none-any\n"
    )

    record = StringIO(newline="")
    rows = csv.writer(record, lineterminator="\n")
    for name, data in sorted(files.items()):
        digest = base64.urlsafe_b64encode(hashlib.sha256(data).digest())
        rows.writerow([name, "sha256=" + digest.rstrip(b"=").decode(), len(data)])
    rows.writerow([f"{INFO}/RECORD", "", ""])
    files[f"{INFO}/RECORD"] = record.getvalue().encode()

    output = BytesIO()
    with ZipFile(output, "w") as wheel:
        for name, data in files.items():
            # ZipInfo defaults to a fixed timestamp and uncompressed storage.
            info = ZipInfo(name)
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            wheel.writestr(info, data)
    wheels = Path(__file__).parent / "runtime-lab" / "wheels"
    wheels.mkdir(exist_ok=True)
    target = wheels / f"tensorflow_hub-{VERSION}-py3-none-any.whl"
    target.write_bytes(output.getvalue())
    print(target)


if __name__ == "__main__":
    main()
