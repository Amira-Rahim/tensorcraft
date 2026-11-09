import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { buildSceneApprovalIndex } from "./sync-scene-approvals.mjs";
import { scenePhaseCoverage } from "./scene-phase-coverage.mjs";
import { IDENTITY_CONTRACT } from "./scene-identity-contract.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const EVIDENCE =
  "docs/art-refs/deep-orbit/art-direction-2026-11-06/root/identity-approved.json";
function fixture(t) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "tensorcraft-scene-approval-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value) => {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(
      path.join(root, name),
      typeof value === "string" ? value : JSON.stringify(value),
    );
  };
  const characters = {};
  for (const name of [
    "commander-mirza",
    "dr-farah",
    "chief-nazari",
    "ensign-demir",
  ]) {
    const reference = `docs/art-refs/deep-orbit/${name}.png`;
    write(reference, name);
    characters[name] = { reference, sha256: hash(name) };
  }
  write(IDENTITY_CONTRACT, { characters });
  const row = {
    id: "foundations/test",
    phase: "briefing",
    identityStatus: "approved",
    status: "identity-approved",
    cast: ["ensign-demir"],
    identityReferences: [characters["ensign-demir"].reference],
    source: "art-src/scenes/foundations__test-openai-20261107.png",
    destination: "apps/web/public/scenes/deep-orbit/foundations/test.webp",
    sourceSha256: hash("reviewed source"),
    webpSha256: hash("reviewed webp"),
    webpQuality: 80,
    webpEffort: 4,
    resizeFit: "cover",
    proofPaths: ["docs/proof.png"],
  };
  write(row.source, "reviewed source");
  write(row.destination, "reviewed webp");
  write("docs/proof.png", "face comparison proof");
  write(
    "packages/content/content/deep-orbit/foundations/01-test.mdx",
    "---\nslug: test\n---\nStory\n",
  );
  write("apps/web/lib/lesson-scene-art.manifest.json", {
    "deep-orbit/foundations/test": {
      briefing: {
        src: "/scenes/deep-orbit/foundations/test.webp",
        alt: "Demir reads the output.",
      },
    },
  });
  const approve = () => write(EVIDENCE, [row]);
  approve();
  return { root, write, row, approve, characters };
}

test("a stale status alias cannot override an explicit identity hold", (t) => {
  const f = fixture(t);
  for (const status of ["withheld", "rejected", "pending", null]) {
    f.row.identityStatus = status;
    f.approve();
    assert.throws(
      () => buildSceneApprovalIndex(f.root),
      /missing strict identity approval/,
    );
  }
});

test("bare reference paths are bound to the pre-generation contract hash", (t) => {
  const f = fixture(t);
  const result = buildSceneApprovalIndex(f.root);
  assert.equal(
    result.index.scenes[0].identityReferences[0].sha256,
    hash("ensign-demir"),
  );
  f.write(f.characters["ensign-demir"].reference, "different face");
  assert.throws(
    () => buildSceneApprovalIndex(f.root),
    /canonical portrait differs from identity contract/,
  );
});

test("original image evidence survives removal of disposable previews", (t) => {
  const f = fixture(t);
  f.row.evidenceKind = "original-images";
  f.row.proofPaths = [
    f.row.source,
    f.row.destination,
    f.characters["ensign-demir"].reference,
  ];
  f.approve();
  fs.unlinkSync(path.join(f.root, "docs/proof.png"));
  const { index } = buildSceneApprovalIndex(f.root);
  assert.equal(index.scenes[0].evidenceKind, "original-images");
  assert.deepEqual(index.scenes[0].proofPaths, f.row.proofPaths);
  f.write(f.row.source, "unreviewed replacement");
  assert.throws(
    () => buildSceneApprovalIndex(f.root),
    /approved source or runtime image has changed/,
  );
});

test("every declared cast member needs its own canonical anchor", (t) => {
  const f = fixture(t);
  f.row.cast.push("dr-farah");
  f.approve();
  assert.throws(
    () => buildSceneApprovalIndex(f.root),
    /dr-farah: cast member has no canonical portrait/,
  );
  f.row.cast = ["unknown-character"];
  f.approve();
  assert.throws(
    () => buildSceneApprovalIndex(f.root),
    /unknown-character: cast member has no canonical portrait/,
  );
});

test("an anchorless scene requires an explicit empty cast", (t) => {
  const f = fixture(t);
  delete f.row.cast;
  f.row.identityReferences = [];
  f.approve();
  assert.throws(
    () => buildSceneApprovalIndex(f.root),
    /missing canonical identity references or explicit empty cast/,
  );
  f.row.cast = [];
  f.approve();
  assert.deepEqual(buildSceneApprovalIndex(f.root).index.scenes[0].cast, []);
});

test("an empty cast cannot conceal a supplied human identity reference", (t) => {
  const f = fixture(t);
  f.row.cast = [];
  f.approve();
  assert.throws(
    () => buildSceneApprovalIndex(f.root),
    /ensign-demir: canonical portrait reference is absent from declared cast/,
  );
});

test("coverage invalidates approval when an anchor changes after consolidation", (t) => {
  const f = fixture(t);
  const { index } = buildSceneApprovalIndex(f.root);
  f.write("docs/art-refs/deep-orbit/approved-scene-art.json", index);
  assert.equal(scenePhaseCoverage(f.root).identityApproved, 1);
  f.write(f.characters["ensign-demir"].reference, "different face");
  const report = scenePhaseCoverage(f.root);
  assert.equal(report.identityApproved, 0);
  assert.ok(
    report.errors.some((error) =>
      error.includes("canonical portrait differs from identity contract"),
    ),
  );
});

test("coverage rejects a registry whose cast no longer has anchor coverage", (t) => {
  const f = fixture(t);
  const { index } = buildSceneApprovalIndex(f.root);
  index.scenes[0].cast.push("dr-farah");
  f.write("docs/art-refs/deep-orbit/approved-scene-art.json", index);
  const report = scenePhaseCoverage(f.root);
  assert.equal(report.identityApproved, 0);
  assert.ok(
    report.errors.some((error) =>
      error.includes("dr-farah: cast member has no canonical portrait"),
    ),
  );
});

test("checkout coverage verifies shipped art without ignored PNG staging", (t) => {
  const f = fixture(t);
  const { index } = buildSceneApprovalIndex(f.root);
  f.write("docs/art-refs/deep-orbit/approved-scene-art.json", index);
  fs.unlinkSync(path.join(f.root, f.row.source));
  const checkout = scenePhaseCoverage(f.root);
  assert.equal(checkout.identityApproved, 1);
  assert.deepEqual(checkout.errors, []);
  assert.ok(
    scenePhaseCoverage(f.root, { requireSources: true }).errors.some((error) =>
      error.includes("approved source is missing"),
    ),
  );
  f.write(f.row.source, "an unreviewed replacement");
  assert.ok(
    scenePhaseCoverage(f.root).errors.some((error) =>
      error.includes("source differs from identity approval"),
    ),
  );
});

test("coverage cannot disable the canonical review gate in registry metadata", (t) => {
  const f = fixture(t);
  const { index } = buildSceneApprovalIndex(f.root);
  index.identityReviewRequired = false;
  f.write("docs/art-refs/deep-orbit/approved-scene-art.json", index);
  const report = scenePhaseCoverage(f.root);
  assert.equal(report.identityApproved, 0);
  assert.ok(
    report.errors.includes(
      "Scene registry must require character identity review",
    ),
  );
});

test("coverage fails when the approval registry is absent or omits a shipped image", (t) => {
  const f = fixture(t);
  const missing = scenePhaseCoverage(f.root);
  assert.ok(missing.errors.includes("Missing strict scene approval registry"));
  f.write("docs/art-refs/deep-orbit/approved-scene-art.json", {
    identityReviewRequired: true,
    scenes: [],
  });
  assert.ok(
    scenePhaseCoverage(f.root).errors.some((error) =>
      error.includes("missing character identity approval"),
    ),
  );
});

test("sync rejects an approval for a scene absent from the content", (t) => {
  const f = fixture(t);
  f.row.id = "unknown-module/nonexistent-lesson";
  f.approve();
  assert.throws(() => buildSceneApprovalIndex(f.root), /unknown lesson scene/);
});

test("sync rejects a valid lesson mapped to another runtime file", (t) => {
  const f = fixture(t);
  f.row.destination =
    "apps/web/public/scenes/deep-orbit/foundations/wrong.webp";
  f.write(f.row.destination, "reviewed webp");
  f.approve();
  assert.throws(
    () => buildSceneApprovalIndex(f.root),
    /destination must belong to this lesson phase/,
  );
});

test("completion requires every content phase, not an arbitrary record count", (t) => {
  const f = fixture(t);
  const partial = buildSceneApprovalIndex(f.root);
  assert.equal(partial.index.expectedSceneCount, 5);
  assert.equal(partial.index.complete, false);
  assert.throws(
    () => buildSceneApprovalIndex(f.root, { requireComplete: true }),
    /1\/5 scenes/,
  );
  const rows = [f.row];
  for (const phase of ["concept", "challenge", "takeaways", "epilogue"]) {
    const row = {
      ...f.row,
      phase,
      destination: `apps/web/public/scenes/deep-orbit/foundations/test-${phase}.webp`,
    };
    f.write(row.destination, "reviewed webp");
    rows.push(row);
  }
  f.write(EVIDENCE, rows);
  f.write("apps/web/lib/lesson-scene-art.manifest.json", {
    "deep-orbit/foundations/test": Object.fromEntries(
      rows.map((row) => [
        row.phase,
        {
          src: row.destination.replace("apps/web/public", ""),
          alt: "Demir inspects the display.",
        },
      ]),
    ),
  });
  assert.equal(
    buildSceneApprovalIndex(f.root, { requireComplete: true }).index.complete,
    true,
  );
});
