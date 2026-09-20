import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The learner downloads under apps/web/public/assignments are zips built by
// scripts/package-*.py from the folders served next to them. lint-staged
// once reformatted a folder after its zip was packaged, so learners got a
// download that differed from the files the lesson links (audit 2026-09-20).
// Byte equality between each zip entry and its served file is the gate.
const here = path.dirname(fileURLToPath(import.meta.url));
const assignments = path.resolve(here, "../../../apps/web/public/assignments");
const archives: Array<[zip: string, folder: string]> = [
  ["build-triage-v1.zip", "build-triage-v1"],
  ["room-occupancy-v1.zip", "room-occupancy-v1"],
];

describe("learner download archives match their served folders", () => {
  for (const [zip, folder] of archives) {
    it(`${zip} carries the same bytes as ${folder}/`, () => {
      const zipPath = path.join(assignments, zip);
      const entries = execFileSync("unzip", ["-Z1", zipPath], {
        encoding: "utf8",
      })
        .split("\n")
        .filter((entry) => entry && !entry.endsWith("/"));
      expect(entries.length).toBeGreaterThan(0);
      const stale: string[] = [];
      for (const entry of entries) {
        expect(entry.startsWith(`${folder}/`)).toBe(true);
        const served = fs.readFileSync(path.join(assignments, entry));
        const packaged = execFileSync("unzip", ["-p", zipPath, entry]);
        if (!packaged.equals(served)) stale.push(entry);
      }
      expect(
        stale,
        `Entries that differ between ${zip} and the served folder; ` +
          `re-run the packager under scripts/ after editing the folder`,
      ).toEqual([]);
    });
  }
});
