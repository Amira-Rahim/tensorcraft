#!/usr/bin/env node
/**
 * Gate D driver: per-lesson scene portraits, generated from the entries in
 * docs/scene-bible.md against the approved location master plates.
 *
 * The bible is the source of prompts, not this script: entries are parsed out
 * of it so a prompt edit in the doc is the only place a change has to happen.
 * Every scene passes its location's approved plate as a reference image, which
 * is what keeps the Bridge the same Bridge across 24 scenes.
 *
 * Usage:
 *   node scripts/art/scenes.mjs --list                  # parse only, no spend
 *   node scripts/art/scenes.mjs foundations             # one module
 *   node scripts/art/scenes.mjs foundations neural-networks
 *   node scripts/art/scenes.mjs --all
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BIBLE = path.join(ROOT, "docs/scene-bible.md");
const MASTERS = "docs/art-refs/deep-orbit/masters";

/**
 * The bible's shared scene style token, with the no-text ban spelled out the
 * way Gate C proved is necessary (the short clause let lettering through).
 */
const TOKEN =
  " cel-shaded cartoon illustration, clean bold linework, flat shading with " +
  "one soft key light, slightly stylized proportions, wide cinematic " +
  "environment framing, near-black space beyond the viewports, green #6BAA8A " +
  "interface glow and rim light, warm brass #A89060 metal trim, cohesive " +
  "series look, not photorealistic.";

/** Hold the set: the plate is the reference, the moment is the variable. */
const PRESERVE =
  "Keep the same room, same set dressing, same camera angle, same materials " +
  "and same palette as the reference image. Do not redesign the set. ";

/**
 * Trailing laws, stated last because recency carries weight and these two
 * are the ones the Gate D pilot proved cannot be left implicit.
 *
 * SILHOUETTE: the bible's original "small rim-lit silhouette" wording
 * produced fully lit, fully invented people. A named character with no
 * character reference gets invented from scratch, and the invention broke
 * canon (Commander Mirza, a Black woman of 52, rendered as a white man in a
 * business suit). Forcing flat featureless black shapes means no scene can
 * assert an identity at all, so no scene can assert a wrong one. Faces live
 * in the dialogue avatars directly below the image.
 *
 * NOTEXT: scenes carry far more screen area than portraits, and every
 * display is an invitation to invent lettering ("WEMORY R1LD", "FIOLL
 * MEMORY"). The ban has to enumerate the failure modes and explicitly
 * forbid faces on screens, which is how ARIA's waveform became a cartoon
 * face in the pilot.
 */
// Phrasing note (2026-08-09): an earlier version of this clause said "solid
// black fill, zero skin tone" and fal's content checker rejected a prompt
// outright, reading the wording as race-coded. Describing the LIGHTING
// (unlit, backlit, in shadow) instead of the fill colour gets the identical
// render with no filter risk.
const SILHOUETTE =
  " Every person in this image appears ONLY as an unlit shadow shape: a " +
  "featureless dark outline with no visible features and no discernible " +
  "detail of any kind, like a shape cut from shadow. Each figure is small, " +
  "at most one fifth of the image height, seen from behind or in profile, " +
  "backlit by the room's glow so the form reads as pure shadow against the " +
  "light. Never draw a lit or detailed human face.";

const NOTEXT =
  " Screens, holograms and signage show ONLY wordless waveforms, charts, " +
  "dials, grids and abstract shapes. There must be no letters, no words, no " +
  "abbreviations, no numerals, no labels, no captions and no marks " +
  "resembling writing anywhere in the image, and never a face or a person " +
  "displayed on any screen.";

/**
 * Character names are stripped before the prompt is sent. Two reasons, both
 * measured in the Gate D pilot: a proper noun on a screen gets DRAWN (the
 * intro scene rendered "ARIA" in large letters), and a named person invites
 * a rendered face that contradicts the canon portraits. Once every figure is
 * a flat black cutout, the name carries no information the image can use, so
 * roles replace them. Order matters: full names before bare surnames.
 */
const ANONYMIZE = [
  // "rim-lit" fights the backlit-cutout law and wins often enough to matter:
  // it is an instruction to light the figure, which is how a lit face gets in.
  [/\brim-lit\b\s*/g, ""],
  [/ARIA(?:'s)? waveform/gi, "an oscilloscope waveform"],
  [/\bARIA\b/g, "the ship AI's waveform display"],
  [/Commander Mirza|Mirza/g, "a commanding officer figure"],
  // Not "a scientist figure": that reliably draws a bright white lab coat,
  // and a white garment physically cannot render as a shadow, so the
  // silhouette law loses every time. Role-neutral wording keeps the figure
  // dark.
  [/Dr\.? Farah|Farah/g, "a crew figure"],
  [/Chief Nazari|Nazari/g, "an engineer figure"],
  [/Ensign Demir|Demir/g, "a junior crew figure"],
  // Entries whose SUBJECT is a document invite lettering no ban survives:
  // "prompt diagrams" and "bullet rows" are requests for text in all but
  // name. Restate them as the shapes they should render as.
  [/prompt diagrams?/gi, "structured block diagrams"],
  [/bullet rows/gi, "rows of short horizontal dashes"],
  [/documentation card/gi, "structured layout of framed panels"],
  [/marker scrawl/gi, "short handwritten squiggle with no readable letters"],
];

function anonymize(text) {
  return ANONYMIZE.reduce((acc, [re, to]) => acc.replace(re, to), text);
}

function parseBible() {
  const src = fs.readFileSync(BIBLE, "utf8");
  const entries = [];
  // Entries look like:  #### <module>/<lesson>[-epilogue]
  // followed by bullet lines including "- Prompt: [ref: masters/x] ..."
  const blocks = src.split(/^#### /m).slice(1);
  for (const block of blocks) {
    const id = block.split("\n")[0].trim();
    if (id.startsWith("<")) continue; // the format template
    const prompt = block.match(/^- Prompt:\s*(.+)$/m)?.[1]?.trim();
    const alt = block.match(/^- Alt:\s*(.+)$/m)?.[1]?.trim();
    if (!prompt) {
      console.error(`${id}: no Prompt line, skipped`);
      continue;
    }
    const refName = prompt.match(/^\[ref:\s*masters\/([a-z-]+)\]/)?.[1];
    if (!refName) {
      console.error(`${id}: prompt has no [ref: masters/...] tag, skipped`);
      continue;
    }
    const body = prompt
      .replace(/^\[ref:\s*masters\/[a-z-]+\]\s*/, "")
      .replace(/\.?\s*\+ scene style token\.?$/, "");
    entries.push({ id, refName, body: anonymize(body), alt });
  }
  return entries;
}

const argv = process.argv.slice(2);
const listOnly = argv.includes("--list");
const all = argv.includes("--all");
const modules = argv.filter((a) => !a.startsWith("--"));

const entries = parseBible().filter((e) => {
  if (all || listOnly) return true;
  // Accept a module name or an exact "module/lesson" id, so a review pass can
  // reroll individual scenes without regenerating their whole module.
  return modules.includes(e.id.split("/")[0]) || modules.includes(e.id);
});

if (!entries.length) {
  console.error("no entries selected; pass module names, --all, or --list");
  process.exit(1);
}

if (listOnly) {
  const byRef = {};
  for (const e of entries) byRef[e.refName] = (byRef[e.refName] ?? 0) + 1;
  console.log(`${entries.length} entries parsed`);
  console.log("by master plate:", byRef);
  const noAlt = entries.filter((e) => !e.alt).map((e) => e.id);
  if (noAlt.length) console.log("missing alt text:", noAlt);
  process.exit(0);
}

console.log(`generating ${entries.length} scene(s)\n`);
let ok = 0;
for (const entry of entries) {
  const ref = path.join(MASTERS, `${entry.refName}.png`);
  if (!fs.existsSync(path.join(ROOT, ref))) {
    console.log(`${entry.id}: FAILED missing master plate ${ref}`);
    process.exitCode = 1;
    continue;
  }
  // ingest.mjs maps "<module>__<lesson>" back to a real lesson id.
  const stem = entry.id.replace("/", "__");
  const args = [
    "scripts/art/generate.mjs",
    "--provider", "fal",
    "--phase", "scenes",
    "--id", stem,
    "--ref", ref,
    "--count", "1",
    "--size", "1536x1024",
    "--prompt", PRESERVE + entry.body + TOKEN + SILHOUETTE + NOTEXT,
  ];
  process.stdout.write(`${entry.id}: `);
  try {
    const out = execFileSync("node", args, { cwd: ROOT, encoding: "utf8" });
    process.stdout.write(out.trim().split("\n").pop().trim() + "\n");
    ok++;
  } catch (err) {
    process.stdout.write(`FAILED ${(err.stderr || "").trim().slice(0, 140)}\n`);
    process.exitCode = 1;
  }
}
console.log(`\n${ok}/${entries.length} generated`);
