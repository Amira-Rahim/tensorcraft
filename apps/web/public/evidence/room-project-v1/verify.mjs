// SPDX-License-Identifier: MPL-2.0
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
const manifest = JSON.parse(
  await readFile(new URL("manifest.json", import.meta.url), "utf8"),
);
assert.equal(manifest.kind, "maintainer_reproduction_export");
assert.equal(manifest.version, 1);
assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0);
const names = new Set();
for (const file of manifest.files) {
  assert.equal(typeof file.path, "string");
  assert.ok(!names.has(file.path), "Duplicate manifest path");
  names.add(file.path);
  const path = resolve(root, file.path);
  assert.ok(
    path.startsWith(resolve(root) + sep),
    "Manifest path escaped package",
  );
  const bytes = await readFile(path);
  assert.equal(bytes.length, file.bytes, `Size changed: ${file.path}`);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    file.sha256,
    `File changed: ${file.path}`,
  );
}
console.log(`Verified ${manifest.files.length} exported files.`);
