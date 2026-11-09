import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { planSceneIngest } from "./ingest.mjs";
import { IDENTITY_CONTRACT } from "./scene-identity-contract.mjs";

const INDEX =
  "docs/art-refs/deep-orbit/face-visible-scenes-2026-11-06/approved-scenes.json";

function fixture(t) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "tensorcraft-art-ingest-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, text) => {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
    return full;
  };
  const lesson = (filename, slug) =>
    write(
      `packages/content/content/deep-orbit/${filename}`,
      `---\nslug: ${slug}\ntitle: Test scene\n---\nLesson body.\n`,
    );
  const approved = (scenes) => write(INDEX, JSON.stringify({ scenes }));
  const entry = (id, source) => ({
    id,
    source,
    destination: `apps/web/public/scenes/deep-orbit/${id}.webp`,
  });
  return { root, write, lesson, approved, entry };
}

test("approved scenes resolve the MDX runtime slug instead of its filename", (t) => {
  const f = fixture(t);
  f.lesson(
    "advanced-time-series/05-ensemble-methods.mdx",
    "time-series-ensemble-methods",
  );
  const source = "art-src/scenes/approved-ensemble.png";
  f.write(source, "selected source");
  const id = "advanced-time-series/time-series-ensemble-methods";
  f.approved([f.entry(id, source)]);
  const plan = planSceneIngest(f.root, { approvedIndex: INDEX });
  assert.equal(plan.sources.length, 1);
  assert.equal(plan.sources[0].id, id);
  assert.equal(
    plan.sources[0].destination,
    `apps/web/public/scenes/deep-orbit/${id}.webp`,
  );
  assert.deepEqual(plan.missing, []);

  f.approved([f.entry("advanced-time-series/ensemble-methods", source)]);
  assert.throws(
    () => planSceneIngest(f.root, { approvedIndex: INDEX }),
    /matches no runtime lesson slug/,
  );
});

test("an explicit approved source wins over every later candidate", (t) => {
  const f = fixture(t);
  f.lesson(
    "foundations/01-introduction-to-tensors.mdx",
    "introduction-to-tensors",
  );
  const id = "foundations/introduction-to-tensors";
  const source = "art-src/scenes/selected-scene.png";
  f.write(source, "approved visible faces");
  f.write(
    "art-src/scenes/foundations__introduction-to-tensors-openai-2099.png",
    "rejected candidate",
  );
  f.write(
    "art-src/scenes/foundations__introduction-to-tensors-fal-2000.png",
    "old shadows",
  );
  f.approved([f.entry(id, source)]);
  const plan = planSceneIngest(f.root, { approvedIndex: INDEX });
  assert.equal(plan.sources.length, 1);
  assert.equal(plan.sources[0].source, path.join(f.root, source));
  assert.equal(plan.sources[0].approved, true);
  assert.equal(
    fs.readFileSync(path.join(f.root, source), "utf8"),
    "approved visible faces",
  );
});

test("a missing approved source aborts instead of restoring legacy shadows", (t) => {
  const f = fixture(t);
  f.lesson(
    "foundations/01-introduction-to-tensors.mdx",
    "introduction-to-tensors",
  );
  f.write(
    "art-src/scenes/foundations__introduction-to-tensors-fal-2000.png",
    "old shadows",
  );
  f.approved([
    f.entry(
      "foundations/introduction-to-tensors",
      "art-src/scenes/missing.png",
    ),
  ]);
  assert.throws(
    () => planSceneIngest(f.root, { approvedIndex: INDEX }),
    /Approved scene 'foundations\/introduction-to-tensors' is missing source.*Scene ingest aborted/,
  );
});

test("unindexed scenes keep one legacy candidate while approved scenes stay fixed", (t) => {
  const f = fixture(t);
  f.lesson(
    "foundations/01-introduction-to-tensors.mdx",
    "introduction-to-tensors",
  );
  f.lesson("foundations/02-tensor-shapes.mdx", "tensor-shapes");
  const approvedSource = "art-src/scenes/selected-introduction.png";
  f.write(approvedSource, "approved");
  f.approved([f.entry("foundations/introduction-to-tensors", approvedSource)]);
  f.write(
    "art-src/scenes/foundations__tensor-shapes-openai-2020.png",
    "older legacy",
  );
  const latest = "art-src/scenes/foundations__tensor-shapes-openai-2021.png";
  f.write(latest, "latest legacy");
  const plan = planSceneIngest(f.root, { approvedIndex: INDEX });
  assert.equal(plan.sources.length, 2);
  assert.equal(
    plan.sources.find((scene) => scene.id === "foundations/tensor-shapes")
      .source,
    path.join(f.root, latest),
  );
  assert.equal(
    plan.sources.find((scene) => scene.approved).source,
    path.join(f.root, approvedSource),
  );
});

test("duplicate approvals and destinations for another scene fail before ingest", (t) => {
  const f = fixture(t);
  f.lesson(
    "foundations/01-introduction-to-tensors.mdx",
    "introduction-to-tensors",
  );
  const source = "art-src/scenes/selected.png";
  f.write(source, "approved");
  const entry = f.entry("foundations/introduction-to-tensors", source);
  f.approved([entry, entry]);
  assert.throws(
    () => planSceneIngest(f.root, { approvedIndex: INDEX }),
    /duplicate approved scene/,
  );
  f.approved([
    { ...entry, destination: "apps/web/public/scenes/deep-orbit/wrong.webp" },
  ]);
  assert.throws(
    () => planSceneIngest(f.root, { approvedIndex: INDEX }),
    /invalid destination/,
  );
});

test("indexed scenes ignore superseded staging names without reporting missing art", (t) => {
  const f = fixture(t);
  f.lesson(
    "advanced-time-series/05-ensemble-methods.mdx",
    "time-series-ensemble-methods",
  );
  const source = "art-src/scenes/selected-ensemble.png";
  f.write(source, "approved");
  f.approved([
    f.entry("advanced-time-series/time-series-ensemble-methods", source),
  ]);
  f.write(
    "art-src/scenes/advanced-time-series__ensemble-methods-fal-2000.png",
    "old alias",
  );
  f.write(
    "art-src/scenes/advanced-time-series__time-series-ensemble-methods-face-visible-2026.png",
    "superseded staging name",
  );
  const plan = planSceneIngest(f.root, { approvedIndex: INDEX });
  assert.equal(plan.sources.length, 1);
  assert.deepEqual(plan.missing, []);
});

test("an approved briefing does not suppress an unindexed epilogue", (t) => {
  const f = fixture(t);
  f.lesson("neural-networks/01-first-neuron.mdx", "first-neuron");
  const source = "art-src/scenes/selected-neuron.png";
  f.write(source, "approved briefing");
  f.approved([f.entry("neural-networks/first-neuron", source)]);
  f.write(
    "art-src/scenes/neural-networks__first-neuron-epilogue-fal-2000.png",
    "legacy epilogue",
  );
  const plan = planSceneIngest(f.root, { approvedIndex: INDEX });
  assert.equal(plan.sources.length, 2);
  assert.equal(
    plan.sources.find((scene) => !scene.approved).id,
    "neural-networks/first-neuron-epilogue",
  );
});

test("identity approvals cover every section and exclude unreviewed candidates", (t) => {
  const f = fixture(t);
  f.lesson(
    "foundations/01-introduction-to-tensors.mdx",
    "introduction-to-tensors",
  );
  const hash = (s) => createHash("sha256").update(s).digest("hex");
  const characters = {};
  for (const name of [
    "commander-mirza",
    "dr-farah",
    "chief-nazari",
    "ensign-demir",
  ]) {
    const reference = `docs/art-refs/deep-orbit/${name}.png`;
    f.write(reference, name);
    characters[name] = { reference, sha256: hash(name) };
  }
  f.write(IDENTITY_CONTRACT, JSON.stringify({ characters }));
  const scenes = ["", "-concept", "-challenge", "-takeaways", "-epilogue"].map(
    (suffix) => {
      const id = `foundations/introduction-to-tensors${suffix}`;
      const source = `art-src/scenes/selected${suffix}.png`;
      f.write(source, `reviewed ${suffix}`);
      return {
        ...f.entry(id, source),
        identityStatus: "approved",
        cast: ["ensign-demir"],
        identityReferences: [
          {
            path: characters["ensign-demir"].reference,
            sha256: hash("ensign-demir"),
          },
        ],
        sourceSha256: hash(`reviewed ${suffix}`),
        webpSha256: hash(`webp ${suffix}`),
        webpQuality: 84,
        webpEffort: 6,
        resizeFit: "fill",
      };
    },
  );
  f.lesson("foundations/02-tensor-shapes.mdx", "tensor-shapes");
  f.write(
    "art-src/scenes/foundations__tensor-shapes-openai-2099.png",
    "unreviewed face",
  );
  const index = "docs/art-refs/deep-orbit/approved-scene-art.json";
  f.write(index, JSON.stringify({ identityReviewRequired: true, scenes }));
  const plan = planSceneIngest(f.root);
  assert.equal(plan.sources.length, 5);
  assert.equal(plan.sources[1].spec.quality, 84);
  assert.equal(plan.sources[1].spec.expectedHash, scenes[1].webpSha256);
  f.write(scenes[1].source, "later image with a different face");
  assert.throws(
    () => planSceneIngest(f.root),
    /source differs from the reviewed image/,
  );
  f.write(scenes[1].source, "reviewed -concept");
  scenes[1].identityStatus = "pending";
  f.write(index, JSON.stringify({ identityReviewRequired: true, scenes }));
  assert.throws(
    () => planSceneIngest(f.root),
    /missing character identity approval/,
  );
});

test("default ingest cannot fall back when the strict registry is missing", (t) => {
  const f = fixture(t);
  f.lesson("foundations/01-test.mdx", "test");
  const source = "art-src/scenes/foundations__test-openai-2099.png";
  f.write(source, "unreviewed newer face");
  f.approved([f.entry("foundations/test", source)]);
  assert.throws(
    () => planSceneIngest(f.root),
    /Missing strict scene approval registry/,
  );
  assert.equal(
    planSceneIngest(f.root, { approvedIndex: INDEX }).sources.length,
    1,
  );
});

test("default ingest rejects a registry with identity enforcement disabled", (t) => {
  const f = fixture(t);
  f.lesson("foundations/01-test.mdx", "test");
  f.write(
    "docs/art-refs/deep-orbit/approved-scene-art.json",
    JSON.stringify({ scenes: [] }),
  );
  assert.throws(
    () => planSceneIngest(f.root),
    /must require character identity review/,
  );
});
