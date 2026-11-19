import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  readCanonicalIdentity,
  resolveIdentityReferences,
} from "./scene-identity-contract.mjs";

// Consolidate human-reviewed batches without treating generation as approval.
export function buildSceneApprovalIndex(
  root,
  { requireComplete = false } = {},
) {
  const base = "docs/art-refs/deep-orbit/art-direction-2026-11-06";
  const phases = ["briefing", "concept", "challenge", "takeaways", "epilogue"];
  const full = (file) => path.resolve(root, file);
  const read = (file) => JSON.parse(fs.readFileSync(full(file), "utf8"));
  const hash = (file) =>
    createHash("sha256")
      .update(fs.readFileSync(full(file)))
      .digest("hex");
  const relative = (file) =>
    path.isAbsolute(file) ? path.relative(root, file) : file;
  const canonical = readCanonicalIdentity(root);
  const expected = new Map();
  const content = full("packages/content/content/deep-orbit");
  for (const module of fs.readdirSync(content, { withFileTypes: true })) {
    if (!module.isDirectory()) continue;
    for (const file of fs.readdirSync(path.join(content, module.name))) {
      if (!file.endsWith(".mdx")) continue;
      const text = fs.readFileSync(
        path.join(content, module.name, file),
        "utf8",
      );
      const slug = text.match(/^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1];
      if (!slug) throw new Error(`Missing slug in ${module.name}/${file}`);
      for (const phase of phases) {
        const id = `${module.name}/${slug}${phase === "briefing" ? "" : `-${phase}`}`;
        if (expected.has(id)) throw new Error(`Duplicate content scene: ${id}`);
        expected.set(id, `apps/web/public/scenes/deep-orbit/${id}.webp`);
      }
    }
  }
  const manifestFile = "apps/web/lib/lesson-scene-art.manifest.json";
  const manifest = read(manifestFile);
  const scenes = [];
  for (const batch of [
    "root",
    "early-modules",
    "signal-repairs",
    "late-modules",
    "optimization-modules",
  ]) {
    const evidence = `${base}/${batch}/identity-approved.json`;
    if (!fs.existsSync(full(evidence))) continue;
    const data = read(evidence);
    const rows = Array.isArray(data)
      ? data
      : Object.entries(data).flatMap(([key, values]) =>
          Object.entries(values).map(([phase, value]) => ({
            ...value,
            key,
            phase,
          })),
        );
    const fragmentFile = `${base}/${batch}/${batch === "signal-repairs" ? "manifest-entries.json" : "manifest-fragment.json"}`;
    const fragment = fs.existsSync(full(fragmentFile))
      ? read(fragmentFile)
      : {};
    for (const row of rows) {
      if (
        row.identityStatus !== undefined
          ? row.identityStatus !== "approved"
          : row.status !== "identity-approved"
      )
        throw new Error(`${evidence}: missing strict identity approval`);
      const lesson = (row.id ?? row.key).replace(/^deep-orbit\//, "");
      if (!phases.includes(row.phase))
        throw new Error(`${lesson}: invalid phase`);
      const id = `${lesson}${row.phase === "briefing" ? "" : `-${row.phase}`}`;
      const source = relative(row.source);
      const destination = row.destination ?? row.output;
      if (!expected.has(id)) throw new Error(`${id}: unknown lesson scene`);
      if (destination !== expected.get(id))
        throw new Error(`${id}: destination must belong to this lesson phase`);
      const sourceSha256 = row.sourceSha256;
      const webpSha256 = row.webpSha256 ?? row.outputSha256;
      if (hash(source) !== sourceSha256 || hash(destination) !== webpSha256)
        throw new Error(`${id}: approved source or runtime image has changed`);
      const { cast, identityReferences } = resolveIdentityReferences(
        root,
        row,
        canonical,
      );
      const proofs = row.proofPaths ??
        row.faceProofs ?? [row.faceProof ?? row.proofSheet];
      const proofPaths = proofs
        .filter(Boolean)
        .map((proof) =>
          relative(
            typeof proof === "string" ? proof : (proof.path ?? proof.proof),
          ),
        );
      if (
        !proofPaths.length ||
        proofPaths.some((file) => !fs.existsSync(full(file)))
      )
        throw new Error(`${id}: missing review proof`);
      const scene = {
        id,
        lesson,
        phase: row.phase,
        source,
        destination,
        sourceSha256,
        webpSha256,
        webpQuality: row.webpQuality ?? row.quality,
        webpEffort:
          row.webpEffort ?? row.effort ?? (batch === "root" ? 6 : undefined),
        resizeFit:
          row.resizeFit ?? row.fit ?? (batch === "root" ? "fill" : undefined),
        dimensions: [1536, 1024],
        identityStatus: "approved",
        evidenceKind: row.evidenceKind ?? "comparison-previews",
        cast,
        identityReferences,
        proofPaths,
        evidence,
      };
      if (
        !Number.isInteger(scene.webpQuality) ||
        !Number.isInteger(scene.webpEffort) ||
        !scene.resizeFit
      )
        throw new Error(`${id}: missing exact output encoding`);
      scenes.push(scene);
      const key = `deep-orbit/${lesson}`;
      const entry = fragment[key]?.[row.phase];
      if (entry) {
        manifest[key] ??= {};
        manifest[key][row.phase] = entry;
      }
      if (
        manifest[key]?.[row.phase]?.src !==
        destination.replace("apps/web/public", "")
      )
        throw new Error(`${id}: missing matching runtime manifest entry`);
    }
  }
  scenes.sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(scenes.map((scene) => scene.id)).size !== scenes.length)
    throw new Error("Duplicate approved scene");
  const complete = scenes.length === expected.size;
  if (requireComplete && !complete)
    throw new Error(
      `${scenes.length}/${expected.size} scenes have strict identity approval`,
    );
  const index = {
    date: "2026-11-07",
    identityReviewRequired: true,
    complete,
    expectedSceneCount: expected.size,
    canonical,
    scenes,
  };
  return { index, manifest };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = process.cwd();
  const { index, manifest } = buildSceneApprovalIndex(root, {
    requireComplete: process.argv.includes("--require-complete"),
  });
  fs.writeFileSync(
    path.join(root, "docs/art-refs/deep-orbit/approved-scene-art.json"),
    JSON.stringify(index, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(root, "apps/web/lib/lesson-scene-art.manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    `${index.scenes.length}/${index.expectedSceneCount} reviewed scenes indexed${index.complete ? ", complete" : ", rollout in progress"}.`,
  );
}
