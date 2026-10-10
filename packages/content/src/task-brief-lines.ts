/**
 * Build-time line numbers for a challenge brief (spec 2026-10-10, section 5
 * item 10). The editor shows the TRANSPILED starter, and tsToJs drops blank
 * lines, so the YAML's own line numbers are wrong. Velite runs this on the
 * built starter and fails the build unless every step's target is declared
 * exactly once, still holding its placeholder.
 */
// Relative on purpose (spec section 5 item 1): velite bundles its config
// with esbuild and leaves bare package imports to Node, which cannot load
// @tensorcraft/shared's extensionless re-exports. A relative import is
// bundled. turbo.json hashes this file for build:content.
import { scanStops, type StopSpec } from "../../shared/src/scan-stops";

export type BriefLines<Step extends StopSpec> =
  | { ok: true; steps: Array<Step & { line: number }> }
  | { ok: false; errors: string[] };

export function taskBriefLines<Step extends StopSpec>(
  starterCode: string,
  steps: readonly Step[],
): BriefLines<Step> {
  const scans = scanStops(starterCode.split("\n"), steps);
  const errors: string[] = [];
  scans.forEach((scan, index) => {
    const { target, placeholder = "null" } = steps[index];
    const name = `taskBrief step ${index + 1} (${target})`;
    if (scan.matches !== 1) {
      errors.push(
        `${name}: the built starter must declare it exactly once; found ${scan.matches}.`,
      );
    } else if (scan.state !== "waiting") {
      errors.push(`${name}: its starter declaration must hold ${placeholder}.`);
    }
  });
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    steps: steps.map((step, index) => ({
      ...step,
      line: scans[index].line as number,
    })),
  };
}
