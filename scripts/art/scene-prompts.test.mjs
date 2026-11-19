import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseSceneBible,
  faceVisiblePrompt,
  visibleStaging,
} from "./scene-prompts.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const scenes = parseSceneBible(root);

test("every canonical scene has identity references for its exact named cast", () => {
  assert.equal(scenes.length, 63);
  for (const scene of scenes) {
    assert.ok(scene.characters.length > 0, scene.id);
    assert.equal(scene.characters.length, scene.refs.length, scene.id);
    for (const ref of scene.refs)
      assert.ok(fs.existsSync(path.join(root, ref)), ref);
    assert.ok(
      fs.existsSync(
        path.join(
          root,
          `apps/web/public/scenes/deep-orbit/${scene.assetId}.webp`,
        ),
      ),
      scene.assetId,
    );
  }
});

test("the network scene casts only the canonical mature commander", () => {
  const scene = scenes.find(
    (entry) => entry.id === "neural-networks/building-a-network",
  );
  assert.deepEqual(scene.refs, [
    "docs/art-refs/deep-orbit/commander-mirza.png",
  ]);
  const prompt = faceVisiblePrompt(scene);
  assert.match(prompt, /EXACTLY 1 human character: Commander Mirza/);
  assert.match(prompt, /Black woman aged 52/);
  assert.match(prompt, /readable facial lighting/);
});

test("the finale has four humans and keeps ARIA abstract", () => {
  const scene = scenes.find((entry) => entry.id === "capstone/launch-epilogue");
  assert.equal(scene.characters.length, 4);
  assert.equal(scene.hasAria, true);
  assert.match(
    faceVisiblePrompt(scene),
    /ARIA is present only as an abstract green waveform/,
  );
});

test("the ensemble scene uses its actual runtime slug", () => {
  const scene = scenes.find(
    (entry) => entry.id === "advanced-time-series/ensemble-methods",
  );
  assert.equal(
    scene.assetId,
    "advanced-time-series/time-series-ensemble-methods",
  );
});

test("historical staging cannot request hidden character faces", () => {
  const text = visibleStaging(
    "two small rim-lit silhouettes, faces averted, from behind",
  );
  assert.doesNotMatch(text, /silhouettes|faces averted|from behind/);
  assert.match(text, /visible faces|faces clearly visible/);
});
