import { createHash } from "node:crypto";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function identifyArtifact(manifestBytes, shards) {
  return sha256(
    JSON.stringify({
      manifest: sha256(manifestBytes),
      shards: shards.map(({ path, bytes }) => ({
        path,
        sha256: sha256(bytes),
      })),
    }),
  );
}

// Fetch once, verify once, then load these exact bytes. A later URL read could
// otherwise score different weights during a deployment transition.
export async function fetchArtifact(url, expectedFingerprint) {
  const manifestUrl = new URL(url);
  const get = async (address) => {
    const response = await fetch(address, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok)
      throw Error(`Artifact HTTP ${response.status}: ${address}`);
    return Buffer.from(await response.arrayBuffer());
  };
  const manifestBytes = await get(manifestUrl);
  const manifest = JSON.parse(manifestBytes);
  if (
    manifest.format !== "layers-model" ||
    !manifest.modelTopology ||
    !Array.isArray(manifest.weightsManifest) ||
    !manifest.weightsManifest.length
  )
    throw Error("Invalid LayersModel manifest");
  const shards = [];
  const base = new URL(".", manifestUrl);
  for (const group of manifest.weightsManifest) {
    if (
      !Array.isArray(group.paths) ||
      !group.paths.length ||
      !Array.isArray(group.weights)
    )
      throw Error("Invalid weight group");
    for (const path of group.paths) {
      const resolved = new URL(path, base);
      if (
        resolved.origin !== base.origin ||
        !resolved.pathname.startsWith(base.pathname) ||
        /[?#]/.test(path)
      )
        throw Error("Weight shard must stay in the artifact directory");
      shards.push({ path, bytes: await get(resolved) });
    }
  }
  const fingerprint = identifyArtifact(manifestBytes, shards);
  if (fingerprint !== expectedFingerprint)
    throw Error("Artifact fingerprint mismatch");
  const weights = Buffer.concat(shards.map((s) => s.bytes));
  return {
    fingerprint,
    artifacts: {
      modelTopology: manifest.modelTopology,
      weightSpecs: manifest.weightsManifest.flatMap((g) => g.weights),
      weightData: weights.buffer.slice(
        weights.byteOffset,
        weights.byteOffset + weights.byteLength,
      ),
    },
  };
}
