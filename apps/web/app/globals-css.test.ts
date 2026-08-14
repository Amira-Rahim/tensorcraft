import { describe, it, expect, beforeAll } from "vitest";
import { compile } from "tailwindcss";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Compile globals.css with the real Tailwind v4 compiler and assert the
// colour utilities the app is built on actually generate.
//
// Why output, not source text: on 2026-08-12 the repo-wide theme→world
// rename swept Tailwind's own `@theme` directive along with product
// vocabulary, turning it into `@world`. Tailwind treats an unknown at-rule
// as passthrough CSS, not an error: the token text still appeared in the
// shipped stylesheet (inside an inert block browsers ignore) while every
// `bg-surface` / `text-primary` / `border-border` utility silently vanished
// from the build. Nothing else catches that class of break: jsdom component
// tests see class strings, never compiled CSS, and visual baselines
// regenerated after the break faithfully encode the broken page. So this
// test asks the compiler itself.
//
// No fs scanning is involved: `compile()` builds only the candidate classes
// we pass, so the test stays fast and needs no @source resolution.

const appDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(appDir, "..");
const repoRoot = path.resolve(webRoot, "../..");

// One representative per token family in the @theme block. If a family's
// registration breaks, its member here goes missing and names the family.
const CANDIDATES = [
  "bg-page",
  "bg-surface",
  "bg-surface-raised",
  "bg-primary",
  "text-primary",
  "text-on-primary",
  "text-text-primary",
  "text-text-muted",
  "text-accent",
  "text-success",
  "text-error",
  "border-border",
  "border-interactive",
  "font-mono",
  "font-sans",
];

async function loadStylesheet(id: string, base: string) {
  // Mirrors the resolution the real build performs through node/PostCSS:
  // the bare `tailwindcss` import maps to the package's index.css, package
  // subpaths resolve from node_modules, and everything else (including
  // Tailwind's own internal `./theme.css` etc.) is importer-relative.
  let file: string;
  if (id === "tailwindcss") {
    file = path.join(webRoot, "node_modules/tailwindcss/index.css");
  } else if (id.startsWith("tailwindcss/")) {
    file = path.join(webRoot, "node_modules", id);
  } else if (id === "@tensorcraft/worlds/css/worlds.css") {
    file = path.join(repoRoot, "packages/worlds/src/css/worlds.css");
  } else {
    file = path.resolve(base, id);
  }
  return {
    path: file,
    base: path.dirname(file),
    content: fs.readFileSync(file, "utf8"),
  };
}

describe("globals.css compiles the app's colour utilities", () => {
  let built: string;

  beforeAll(async () => {
    const globals = fs.readFileSync(path.join(appDir, "globals.css"), "utf8");
    const compiler = await compile(globals, {
      base: appDir,
      loadStylesheet,
      loadModule: async (id: string) => {
        throw new Error(`globals.css should not load JS modules (got ${id})`);
      },
    });
    built = compiler.build([...CANDIDATES]);
  });

  it.each(CANDIDATES)("generates .%s", (candidate) => {
    const rule = new RegExp(`\\.${candidate}\\s*\\{`);
    expect(built).toMatch(rule);
  });

  it("registers the design tokens with Tailwind (@theme, not passthrough)", () => {
    // The tokens must land in :root as registered theme variables. When the
    // directive is misspelled they survive as raw text inside an unknown
    // at-rule, so presence of the var alone is not enough; the at-rule
    // itself must be gone from the output.
    expect(built).toContain("--color-primary: var(--tc-primary)");
    expect(built).not.toMatch(/@world\s*\{/);
  });
});
