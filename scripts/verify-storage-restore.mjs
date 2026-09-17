#!/usr/bin/env node
// Read hosted Storage, restore into new private local buckets, compare bytes,
// then remove only the local drill buckets and temporary backup files.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";

const localFileIndex = process.argv.indexOf("--local-env-file");
assert.ok(
  localFileIndex >= 0,
  "Pass --local-env-file for the local restore target",
);
const localEnv = parseEnv(
  await readFile(process.argv[localFileIndex + 1], "utf8"),
);
const sourceUrl = new URL(process.env.SUPABASE_URL);
const targetUrl = new URL(localEnv.SUPABASE_URL);
assert.ok(
  ["localhost", "127.0.0.1", "[::1]"].includes(targetUrl.hostname),
  "The restore target must be a local Supabase instance",
);
assert.ok(["http:", "https:"].includes(targetUrl.protocol));
assert.ok(!targetUrl.username && !targetUrl.password);
assert.notEqual(
  sourceUrl.origin,
  targetUrl.origin,
  "Source and target must differ",
);
assert.ok(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  "Source service key is required",
);
assert.ok(localEnv.SUPABASE_SERVICE_ROLE_KEY, "Local service key is required");

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const source = createClient(
  sourceUrl.origin,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  options,
);
const target = createClient(
  targetUrl.origin,
  localEnv.SUPABASE_SERVICE_ROLE_KEY,
  options,
);
const backupDir = await mkdtemp(join(tmpdir(), "tensorcraft-storage-drill-"));
const created = [];
const manifest = [];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

function checked(result, operation) {
  if (result.error) {
    throw new Error(
      `${operation} failed (${result.error.statusCode ?? "unknown"})`,
    );
  }
  return result.data;
}

async function listObjects(storage, bucket, prefix = "") {
  const objects = [];
  for (let offset = 0; ; offset += 100) {
    const page = checked(
      await storage.from(bucket).list(prefix, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      }),
      "List Storage objects",
    );
    for (const entry of page) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) objects.push({ ...entry, path });
      else objects.push(...(await listObjects(storage, bucket, path)));
    }
    if (page.length < 100) return objects;
  }
}

try {
  const buckets = checked(await source.storage.listBuckets(), "List buckets");
  for (const bucket of buckets) {
    const objects = await listObjects(source.storage, bucket.id);
    const localBucket = `restore-drill-${randomUUID()}`;
    checked(
      await target.storage.createBucket(localBucket, { public: false }),
      "Create local recovery bucket",
    );
    const cleanup = { bucket: localBucket, paths: [] };
    created.push(cleanup);

    for (const object of objects) {
      const blob = checked(
        await source.storage.from(bucket.id).download(object.path),
        "Download source object",
      );
      const bytes = Buffer.from(await blob.arrayBuffer());
      const file = join(backupDir, `${manifest.length}.bin`);
      await writeFile(file, bytes, { mode: 0o600 });
      const entry = {
        bucket: bucket.id,
        path: object.path,
        contentType: blob.type || "application/octet-stream",
        bytes: bytes.length,
        sha256: digest(bytes),
      };
      manifest.push(entry);

      // Track the path before upload so cleanup also covers a lost response.
      cleanup.paths.push(object.path);
      checked(
        await target.storage
          .from(localBucket)
          .upload(object.path, await readFile(file), {
            contentType: entry.contentType,
            upsert: false,
          }),
        "Restore local object",
      );
      const restored = checked(
        await target.storage.from(localBucket).download(object.path),
        "Read restored object",
      );
      assert.equal(
        digest(Buffer.from(await restored.arrayBuffer())),
        entry.sha256,
      );
      assert.equal(restored.type, entry.contentType);
    }

    const after = await listObjects(source.storage, bucket.id);
    assert.deepEqual(
      after.map(({ path, id, updated_at }) => ({ path, id, updated_at })),
      objects.map(({ path, id, updated_at }) => ({ path, id, updated_at })),
      "Source objects changed during the drill; repeat verification",
    );
  }
  await writeFile(join(backupDir, "manifest.json"), JSON.stringify(manifest), {
    mode: 0o600,
  });
  console.log(
    JSON.stringify({
      restored: true,
      buckets: buckets.length,
      objects: manifest.length,
      bytes: manifest.reduce((sum, entry) => sum + entry.bytes, 0),
      allSha256AndContentTypesMatch: true,
      sourceModified: false,
    }),
  );
} finally {
  const cleanupErrors = [];
  for (const entry of created) {
    try {
      for (let offset = 0; offset < entry.paths.length; offset += 100) {
        checked(
          await target.storage
            .from(entry.bucket)
            .remove(entry.paths.slice(offset, offset + 100)),
          "Remove local recovery objects",
        );
      }
      checked(
        await target.storage.deleteBucket(entry.bucket),
        "Remove local recovery bucket",
      );
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  await rm(backupDir, { recursive: true, force: true });
  if (cleanupErrors.length)
    throw new AggregateError(cleanupErrors, "Local recovery cleanup failed");
  console.log("Local drill buckets and temporary backup files removed");
}
