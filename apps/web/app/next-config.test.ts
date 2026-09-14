import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Guard the way Next.js loads next.config.ts.
//
// Next transpiles the TypeScript config to CommonJS with SWC and evaluates
// it through Node's CommonJS wrapper, a function whose parameters are
// `exports`, `require`, `module`, `__filename` and `__dirname`. A top-level
// `const` or `let` with one of those names re-declares a parameter, which
// is a SyntaxError inside that wrapper. Next 15 hid the problem by
// compiling the config to ES5, which turns `const` into `var`, and `var`
// may shadow a parameter. Next 16 compiles for the running Node version
// instead, so the `const` survives, the CommonJS compile fails, and Node's
// module-format detection retries the file as ESM, which then dies with
// "exports is not defined in ES module scope". That message blames
// "type": "module" and sends people toward the wrong fix. Dependabot PR
// #38 (next 15.5.24 to 16.3.4) went red on it in 2026-09.
//
// The config is written as an ES module, so the file itself never sees
// those names; any local binding using one of them must pick another name.

const appDir = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(appDir, "../next.config.ts");

const WRAPPER_PARAMS = [
  "exports",
  "require",
  "module",
  "__filename",
  "__dirname",
];

const TOP_LEVEL_DECLARATION = new RegExp(
  `^(?:export\\s+)?(?:const|let|var|function|class)\\s+(${WRAPPER_PARAMS.join("|")})\\b`,
);

describe("next.config.ts", () => {
  it("declares no top-level binding named after a CommonJS wrapper parameter", () => {
    const lines = fs.readFileSync(configPath, "utf8").split("\n");
    const offenders = lines
      .map((line, index) => {
        const match = TOP_LEVEL_DECLARATION.exec(line);
        return match ? `line ${index + 1}: ${match[1]}` : null;
      })
      .filter((hit): hit is string => hit !== null);
    expect(offenders).toEqual([]);
  });
});
