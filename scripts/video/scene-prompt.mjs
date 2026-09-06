#!/usr/bin/env node
/**
 * Flow prompt helper: prints one entry from
 * docs/video-scene-prompts-deep-orbit.md as a ready-to-paste block
 * (global style block + the scene prompt) plus the resolved ingredient
 * file paths, so a Flow session never involves hand-copying from the
 * doc.
 *
 * Usage:
 *   node scripts/video/scene-prompt.mjs 2.5      # one entry
 *   node scripts/video/scene-prompt.mjs E1
 *   node scripts/video/scene-prompt.mjs --list   # generate-now queue
 *
 * stdout is EXACTLY the one prompt to share with Flow (laws + staged
 * cast sheets + scene action, one self-contained block); metadata and
 * ingredient paths go to stderr. So:
 *   node scripts/video/scene-prompt.mjs 2.5 | pbcopy
 * copies the single Flow prompt while the ingredient checklist still
 * prints in the terminal.
 */

import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;
const DOC = join(ROOT, "docs/video-scene-prompts-deep-orbit.md");
const PORTRAITS = join(ROOT, "docs/art-refs/deep-orbit");
const VIDEO_REFS = join(ROOT, "docs/art-refs/deep-orbit/video-refs");
const MASTERS = join(ROOT, "docs/art-refs/deep-orbit/masters");

// Face-lock pilots carry their video-ref motion anchor in the third
// ingredient slot (doc: "Face-locking order").
const PILOTS = new Set(["2.5", "7.2", "3.2", "6.4"]);

const src = readFileSync(DOC, "utf8");

function globalBlock() {
  // The block is the blockquote under "## Global style block".
  const section = src.split("## Global style block")[1];
  const lines = [];
  for (const line of section.split("\n")) {
    if (line.startsWith("> ")) lines.push(line.slice(2));
    else if (line.startsWith(">")) lines.push(line.slice(1).trim());
    else if (lines.length > 0 && line.trim() === "") break;
  }
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

function castSheets() {
  // "#### <slug>" headers each followed by one blockquote, under
  // "## Cast sheets"; the section ends at the next "## " heading.
  const section = src.split("## Cast sheets")[1].split("\n## ")[0];
  const sheets = {};
  const re = /^#### ([a-z-]+)\n\n((?:>.*\n?)+)/gm;
  let m;
  while ((m = re.exec(section)) !== null) {
    sheets[m[1]] = m[2]
      .split("\n")
      .map((l) => l.replace(/^> ?/, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return sheets;
}

function sheetsFor(entry) {
  // Only the staged characters: a sheet for an absent character invites
  // the generator to add them (doc: "Cast sheets").
  const sheets = castSheets();
  const slugs = (entry.refs || "")
    .replace(/\(.*\)$/, "")
    .split("+")
    .map((r) => r.trim())
    .filter((r) => r && !r.startsWith("masters/") && sheets[r]);
  const stagesAria =
    /\(d\)/.test(entry.kit || "") || /\bAI\b/.test(entry.prompt || "");
  if (stagesAria && !slugs.includes("aria")) slugs.push("aria");
  return slugs.map((s) => sheets[s]);
}

function entries() {
  const out = [];
  // $(?![\s\S]) = true end-of-string: with the m flag a bare $ matches
  // every line end and truncates each entry to its first bullet.
  const re =
    /^#### ([\d.E]+[\d]*) ([\w/-]+)\n([\s\S]*?)(?=\n#### |\n## |$(?![\s\S]))/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, id, key, body] = m;
    const field = (name) => {
      const fm = new RegExp(`^- ${name}: (.*)$`, "m").exec(body);
      return fm ? fm[1].trim() : null;
    };
    out.push({
      id,
      key,
      status: field("Status"),
      message: field("Message"),
      refs: field("Refs"),
      kit: field("Kit"),
      prompt: field("Prompt"),
    });
  }
  return out;
}

function resolveRefs(entry) {
  if (!entry.refs) return [];
  const mark = (path, note = "") =>
    `${existsSync(path) ? "  " : "!!"} ${path}${note}`;
  const out = [];
  for (const r of entry.refs
    .replace(/\(.*\)$/, "")
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (r.startsWith("masters/")) {
      out.push(mark(join(MASTERS, `${r.slice("masters/".length)}.png`)));
    } else {
      // Canonical portrait = identity ingredient (owner baseline
      // 2026-09-04); pilots also attach the video-ref motion anchor.
      out.push(mark(join(PORTRAITS, `${r}.png`)));
      if (PILOTS.has(entry.id)) {
        out.push(mark(join(VIDEO_REFS, `${r}.png`), "  (motion anchor)"));
      }
    }
  }
  return out;
}

const all = entries();
const arg = process.argv[2];

if (!arg || arg === "--list") {
  // The rebased launch-first queue (owner ruling 2026-09-04).
  const pilots = ["2.5", "7.2", "3.2", "6.4"];
  const launch = ["1.1", "1.2", "1.3", "1.4", "1.5", "E1"];
  const queue = [...pilots, ...launch];
  console.log("Generate-now queue (pilots, then the launch-blocking batch):\n");
  for (const id of queue) {
    const e = all.find((x) => x.id === id);
    if (e)
      console.log(`  ${e.status ? "SKIP" : "  "} ${e.id.padEnd(4)} ${e.key}`);
  }
  console.log(
    "\nThen modules 2-3, spine, rest per the doc's batch order. Run with an id (e.g. 2.5) for its paste block.",
  );
  process.exit(0);
}

const entry = all.find((e) => e.id === arg);
if (!entry) {
  console.error(`No entry "${arg}". Try --list.`);
  process.exit(1);
}

if (entry.status) {
  console.error(`STOP: ${entry.id} carries a Status line: ${entry.status}`);
  process.exit(1);
}

console.error(`# ${entry.id} ${entry.key}`);
console.error(`# Message: ${entry.message}`);
if (entry.kit) console.error(`# Kit (comp in post): ${entry.kit}`);
console.error(`#\n# Ingredients (attach in Flow; !! = file missing):`);
for (const line of resolveRefs(entry)) console.error(`#${line}`);
console.error(
  `#\n# Settings: 16:9, one 8s Veo pass, extend to 10.0s. Strip audio.`,
);
console.error(`# The single Flow prompt follows on stdout:\n`);
console.log(`${globalBlock()}\n`);
for (const sheet of sheetsFor(entry)) console.log(`${sheet}\n`);
console.log(entry.prompt);
