#!/usr/bin/env node
/** Scene prompts use the room plate and every depicted character's portrait. */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSceneBible, faceVisiblePrompt } from "./scene-prompts.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const argv = process.argv.slice(2);
const listOnly = argv.includes("--list");
const planOnly = argv.includes("--plan");
const all = argv.includes("--all");
const modules = argv.filter((argument) => !argument.startsWith("--"));
const entries = parseSceneBible(ROOT).filter(
  (entry) =>
    all ||
    listOnly ||
    planOnly ||
    modules.includes(entry.id.split("/")[0]) ||
    modules.includes(entry.id),
);

if (!entries.length) {
  console.error(
    "no entries selected; pass module names, --all, --list, or --plan",
  );
  process.exit(1);
}

if (listOnly) {
  const byLocation = {};
  for (const entry of entries)
    byLocation[entry.location] = (byLocation[entry.location] ?? 0) + 1;
  console.log(
    `${entries.length} entries parsed with canonical character references`,
  );
  console.log("by master plate:", byLocation);
  process.exit(0);
}

if (planOnly) {
  console.log(
    JSON.stringify(
      entries.map((entry) => ({
        id: entry.id,
        assetId: entry.assetId,
        refs: [
          `docs/art-refs/deep-orbit/masters/${entry.location}.png`,
          ...entry.refs,
        ],
        prompt: faceVisiblePrompt(entry, {
          referenceType: "location master reference",
        }),
      })),
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log(`generating ${entries.length} scene(s)`);
let succeeded = 0;
for (const entry of entries) {
  const refs = [
    `docs/art-refs/deep-orbit/masters/${entry.location}.png`,
    ...entry.refs,
  ];
  const missing = refs.find((ref) => !fs.existsSync(path.join(ROOT, ref)));
  if (missing) {
    console.error(`${entry.id}: missing reference ${missing}`);
    process.exitCode = 1;
    continue;
  }
  const args = [
    "scripts/art/generate.mjs",
    "--provider",
    "fal",
    "--phase",
    "scenes",
    "--id",
    entry.assetId.replace("/", "__"),
    ...refs.flatMap((ref) => ["--ref", ref]),
    "--count",
    "1",
    "--size",
    "1536x1024",
    "--prompt",
    faceVisiblePrompt(entry, { referenceType: "location master reference" }),
  ];
  process.stdout.write(`${entry.id}: `);
  try {
    const output = execFileSync("node", args, { cwd: ROOT, encoding: "utf8" });
    process.stdout.write(output.trim().split("\n").pop().trim() + "\n");
    succeeded++;
  } catch (error) {
    process.stdout.write(
      `FAILED ${String(error.stderr ?? "")
        .trim()
        .slice(0, 140)}\n`,
    );
    process.exitCode = 1;
  }
}
console.log(`${succeeded}/${entries.length} generated`);
