#!/usr/bin/env node
/**
 * Gate C driver: the four Deep Orbit location master plates
 * (docs/scene-bible.md, "Location canon"). These are the reference images
 * every per-lesson scene is generated against, which is what keeps the
 * Bridge the same Bridge across 24 scenes, so they are produced and approved
 * before any scene work starts.
 *
 * Dashboard Station is derived image-to-image from the APPROVED Bridge plate
 * rather than generated from scratch: it is a corner of the bridge and has to
 * agree with its set dressing.
 *
 * Usage:
 *   node scripts/art/masters.mjs bridge lab engineering   # text-to-image
 *   node scripts/art/masters.mjs dashboard-station        # needs the approved
 *                                                         # bridge plate at
 *                                                         # docs/art-refs/deep-orbit/masters/bridge.png
 *   node scripts/art/masters.mjs --count 2 lab
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** Quoted from the scene bible's shared scene style token, plus the no-text
    rule the character gates taught. */
const TOKEN =
  " cel-shaded cartoon illustration, clean bold linework, flat shading with " +
  "one soft key light, slightly stylized proportions, wide cinematic " +
  "environment framing, near-black space beyond the viewports, green #6BAA8A " +
  "interface glow and rim light, warm brass #A89060 metal trim, cohesive " +
  "series look, not photorealistic, absolutely no text, lettering, numerals " +
  "or logos anywhere in frame, screens show only waveforms charts and glyphs.";

const MASTERS = {
  bridge: {
    prompt:
      "Empty bridge of a survey starship seen head on and symmetric looking " +
      "forward down the deck, two-tier command deck, angular forward " +
      "viewports wrapping the upper frame onto a near-black starfield, " +
      "central holographic table dead center casting green light up onto " +
      "surrounding consoles, raised aft command station behind it with a " +
      "brass chronometer mounted at eye line, port-side comms alcove with " +
      "stacked signal boards, brass trim on rails and console edges, " +
      "lived-in and precise with worn scuffed deck plates, duty lighting, " +
      "no crew.",
  },
  lab: {
    prompt:
      "Empty starship signal-analysis lab shot from the corridor-side " +
      "corner, long workbench with brass instruments crossing the " +
      "foreground, wall-sized holographic whiteboard facing camera covered " +
      "in glowing green curves and glyphs mid-derivation, floor to ceiling " +
      "glass wall grazing the right edge onto a dim corridor, telemetry " +
      "displays showing waveforms, a spectrograph column throwing slow green " +
      "ripples, labeled sample racks and ordered instruments, one coffee " +
      "ring on the bench, working light, no crew.",
  },
  engineering: {
    prompt:
      "Empty starship engineering bay seen from the bay entrance looking in, " +
      "tool wall on the left with every tool shadow-outlined in its place, " +
      "heavy coolant conduits crossing the ceiling, a dark decommissioned " +
      "computer cabinet with a half-open panel standing in the aft shadow, " +
      "diagnostics bay center under hanging work lights, deck plates " +
      "polished by use, nothing out of place, worn but not grimy, warm work " +
      "lighting with green display glow, no crew.",
  },
  // Auxiliary plate, not a scene reference: the 404/error pages' "adrift"
  // shot (docs/scene-bible.md, Auxiliary plates). No crew, no station: the
  // page copy says the route is lost; the art says how far.
  adrift: {
    prompt:
      "A single small survey probe adrift alone in open space, seen from a " +
      "distance so it sits small in the frame, a slack tether line floating " +
      "loose beside it, one faint green running light, vast empty starfield " +
      "all around, no planet, no station, deep negative space, quiet and " +
      "still.",
  },
  "dashboard-station": {
    ref: "docs/art-refs/deep-orbit/masters/bridge.png",
    prompt:
      "Same starship bridge, same set dressing, same materials and palette " +
      "as the reference image. Push the camera into the tight monitoring " +
      "alcove on the aft rail: three stacked dashboard monitors showing " +
      "glowing green charts, gauges and rolling waveforms, a single chair, a " +
      "mug clamped to the desk, the rest of the bridge soft and blurred " +
      "beyond, duty lighting, no crew.",
  },
};

const argv = process.argv.slice(2);
let count = "1";
const names = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--count") count = argv[++i];
  else names.push(argv[i]);
}
const targets = names.length ? names : Object.keys(MASTERS);

for (const name of targets) {
  const spec = MASTERS[name];
  if (!spec) {
    console.error(`unknown master '${name}'`);
    process.exitCode = 1;
    continue;
  }
  if (spec.ref && !fs.existsSync(path.join(ROOT, spec.ref))) {
    console.error(
      `${name}: needs the approved bridge plate at ${spec.ref} first (Gate C)`,
    );
    process.exitCode = 1;
    continue;
  }
  for (let n = 1; n <= Number(count); n++) {
    const args = [
      "scripts/art/generate.mjs",
      "--provider",
      "fal",
      "--phase",
      "masters",
      "--id",
      name,
      "--count",
      "1",
      "--size",
      "1536x1024",
      "--prompt",
      spec.prompt + TOKEN,
      ...(spec.ref ? ["--ref", spec.ref] : []),
    ];
    process.stdout.write(`${name} ${n}/${count}: `);
    try {
      const out = execFileSync("node", args, { cwd: ROOT, encoding: "utf8" });
      process.stdout.write(out.trim().split("\n").pop().trim() + "\n");
    } catch (err) {
      process.stdout.write(
        `FAILED ${(err.stderr || "").trim().slice(0, 140)}\n`,
      );
      process.exitCode = 1;
    }
  }
}
