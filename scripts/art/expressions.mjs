#!/usr/bin/env node
/**
 * Gate B driver: generates every expression variant FROM its character's
 * approved canon portrait, so identity is inherited rather than re-rolled
 * (docs/character-bible.md, "Expression set" per sheet).
 *
 * Reference-based editing is the whole point: a variant generated from text
 * alone produces a different person wearing the same description. Each call
 * passes docs/art-refs/deep-orbit/<slug>.png as the reference and asks for
 * one changed thing.
 *
 * Usage: node scripts/art/expressions.mjs [slug ...]     (default: all four)
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/**
 * Expression copy is quoted from each sheet's Expression set line.
 *
 * `hold` restates the details the edit pass drops (Gate B, 2026-08-09): a
 * reference image carries bone structure but NOT age markers or small props,
 * so Mirza and Nazari de-aged in every variant and Farah's AR lens vanished
 * from all three. Anything that must survive the edit has to be named again
 * in the variant prompt, not assumed from the reference.
 */
const CAST = {
  "commander-mirza": {
    hold:
      "She is 52: keep the clear crow's feet at the outer eyes, the faint " +
      "lines from nose to mouth, and the silver at her temples exactly as " +
      "in the reference. Keep the brass chronometer at her chest.",
    states: {
      resolved: "jaw set, giving an order, decisive, mouth closed",
      concerned: "brow drawn, eyes lowered to a readout, worried focus",
      approving: "the smallest warm half-smile, quietly pleased",
    },
  },
  "dr-farah": {
    hold:
      "She is 38 with faint smile lines at the eyes. Keep the faint " +
      "augmented-reality lens glowing green over one eye, which must remain " +
      "visible in every variant, and keep her slate-grey lab jacket collar.",
    states: {
      delighted: "wide-eyed open grin, the delight of a discovery landing",
      absorbed:
        "eyes unfocused and looking past the viewer, thinking hard, not sad",
      shaken:
        "awe and unease together, lips slightly parted, unsettled but composed",
    },
  },
  "chief-nazari": {
    hold:
      "She is 48: keep the visibly lined face, crow's feet and set jaw " +
      "exactly as in the reference, and the gray streak in her dark hair.",
    states: {
      skeptical: "one brow raised, unconvinced, mouth set flat",
      "grudging-respect":
        "chin dipped in a small reluctant nod, mouth flat but eyes softened, " +
        "approval she will not say aloud, definitely not sadness",
      haunted:
        "outwardly composed with only a faint distant flicker behind the " +
        "eyes, jaw tight, absolutely no tears and no crying",
    },
  },
  "ensign-demir": {
    hold:
      "He is in his mid twenties with light uneven stubble. Keep the glowing " +
      "comms earpiece and the green underlight on his face.",
    states: {
      overwhelmed: "wide eyes, eyebrows up, slightly lost and out of his depth",
      breakthrough: "delighted grin, the moment a concept clicks",
      focused: "calm and locked on a problem, brows level, mouth closed",
    },
  },
  // ARIA is a glyph, not a person: her "expressions" are the shape of the
  // trace inside the ring, so the hold clause protects the ring furniture
  // and the state changes only the waveform. Never a face, ever.
  aria: {
    hold:
      "This is an abstract AI glyph with no face, no eyes, no body and no " +
      "humanoid form of any kind. Keep the concentric brass tick rings, the " +
      "faceted geometric outer ring and the green to brass rim exactly as in " +
      "the reference. Only the waveform trace inside the ring changes.",
    states: {
      emphasis:
        "the trace is calm and level except for one clean tall spike at the " +
        "centre, a single decisive peak",
      deadpan:
        "the trace is a perfectly flat straight horizontal line across the " +
        "ring, no peaks at all, absolute stillness",
      alarm:
        "the trace is a tight agitated scatter of many sharp jagged peaks " +
        "crowded across the whole width, urgent and unsettled",
    },
  },
};

/**
 * Hold everything except the face. The rim-light clause is explicit because
 * an unqualified "green rim light" drifts into a neon halo on edit passes,
 * which breaks the brutalist no-glow rule (docs/ui-ux-notes.md 5.3).
 */
const preserve =
  "Keep the same character, same face, same hair, same wardrobe, same head " +
  "size, same crop and same lighting as the reference image. Match the " +
  "reference's rim light exactly: a subtle thin green #6BAA8A edge, never a " +
  "bright glowing outline or halo. Change only the facial expression to: ";

const tail =
  ". cel-shaded cartoon illustration, clean bold linework, flat shading with " +
  "one soft key light, near-black background #1C1C1C, no text, lettering, " +
  "numerals or logos anywhere in frame.";

const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : Object.keys(CAST);

for (const slug of slugs) {
  const entry = CAST[slug];
  if (!entry) {
    console.error(`unknown slug '${slug}'`);
    process.exitCode = 1;
    continue;
  }
  for (const [expression, description] of Object.entries(entry.states)) {
    const args = [
      "scripts/art/generate.mjs",
      "--provider",
      "fal",
      "--phase",
      "expressions",
      "--id",
      `${slug}-${expression}`,
      "--ref",
      `docs/art-refs/deep-orbit/${slug}.png`,
      "--count",
      "1",
      "--size",
      "1024x1024",
      "--prompt",
      preserve + description + ". " + entry.hold + tail,
    ];
    process.stdout.write(`${slug}-${expression}: `);
    try {
      const out = execFileSync("node", args, { cwd: ROOT, encoding: "utf8" });
      process.stdout.write(out.trim().split("\n").pop().trim() + "\n");
    } catch (err) {
      process.stdout.write(
        `FAILED ${(err.stderr || "").trim().slice(0, 120)}\n`,
      );
      process.exitCode = 1;
    }
  }
}
