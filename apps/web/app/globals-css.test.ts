import { describe, it, expect, beforeAll } from "vitest";
import { compile, compileAst } from "tailwindcss";
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

const TYPOGRAPHY_UTILITIES = [
  "mb-0",
  "mt-0",
  "space-y-2",
  "space-y-3",
  "text-sm",
  "leading-relaxed",
  "font-normal",
  "no-underline",
  "p-0",
  "whitespace-pre",
  "overflow-x-auto",
];

type CssNode = Parameters<typeof compileAst>[0][number];
type CompiledRule = {
  selector: string;
  layer: string | null;
  declarations: Record<string, string | undefined>;
};

function compiledRules(
  nodes: CssNode[],
  layer: string | null = null,
): CompiledRule[] {
  return nodes.flatMap((node): CompiledRule[] => {
    if (node.kind === "rule") {
      return [
        {
          selector: node.selector.replace(/\s+/g, " ").trim(),
          layer,
          declarations: Object.fromEntries(
            node.nodes
              .filter((child) => child.kind === "declaration")
              .map((child) => [child.property, child.value]),
          ),
        },
        ...compiledRules(node.nodes, layer),
      ];
    }
    if ("nodes" in node) {
      return compiledRules(
        node.nodes,
        node.kind === "at-rule" && node.name === "@layer" ? node.params : layer,
      );
    }
    return [];
  });
}

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
  let rules: CompiledRule[];

  beforeAll(async () => {
    const globals = fs.readFileSync(path.join(appDir, "globals.css"), "utf8");
    const compiler = await compile(globals, {
      base: appDir,
      loadStylesheet,
      loadModule: async (id: string) => {
        throw new Error(`globals.css should not load JS modules (got ${id})`);
      },
    });
    built = compiler.build([...CANDIDATES, ...TYPOGRAPHY_UTILITIES]);
    // Build the same imported CSS as an AST so these checks inspect the
    // actual cascade layers, including shared lesson component styles.
    const astCompiler = await compileAst(
      ["./globals.css", "./components/lesson-visuals/lesson-visuals.css"].map(
        (stylesheet) => ({
          kind: "at-rule",
          name: "@import",
          params: JSON.stringify(stylesheet),
          nodes: [],
        }),
      ),
      { base: appDir, loadStylesheet },
    );
    rules = compiledRules(
      astCompiler.build([...CANDIDATES, ...TYPOGRAPHY_UTILITIES]),
    );
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

  it.each([
    ".lesson-prose p",
    ".lesson-prose h2",
    ".lesson-prose h3",
    ".lesson-prose ul, .lesson-prose ol",
    ".lesson-prose li",
    ".lesson-prose strong",
    ".lesson-prose a",
    ".lesson-prose :not(pre) > code",
    ".lesson-prose .learning-experiment p",
    ".lesson-prose .learning-experiment > p",
    ".lesson-prose .learning-experiment h3",
  ])("lets authored utilities override the %s prose default", (selector) => {
    const defaults = rules.filter((rule) => rule.selector === selector);
    expect(defaults.length).toBeGreaterThan(0);
    expect(defaults.every((rule) => rule.layer === "components")).toBe(true);
    expect(built).toContain("@layer theme, base, components, utilities;");
  });

  it.each(TYPOGRAPHY_UTILITIES)(
    "keeps .%s in the later utilities layer",
    (candidate) => {
      expect(
        rules.some(
          (rule) =>
            rule.selector.includes(`.${candidate}`) &&
            rule.layer === "utilities",
        ),
      ).toBe(true);
    },
  );

  it("retains prose spacing and readable type when no utility replaces them", () => {
    const declarations = (selector: string) =>
      rules
        .filter((rule) => rule.selector === selector)
        .map((rule) => rule.declarations);
    expect(declarations(".lesson-prose p")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "margin-bottom": "1.5em",
          "line-height": "1.8",
          "font-size": "1rem",
        }),
        expect.objectContaining({ "font-size": "1.125rem" }),
      ]),
    );
    expect(declarations(".lesson-prose h2")).toContainEqual(
      expect.objectContaining({
        "margin-top": "2.5em",
        "margin-bottom": "0.75em",
      }),
    );
    expect(declarations(".lesson-prose ul, .lesson-prose ol")).toContainEqual(
      expect.objectContaining({
        "margin-bottom": "1.5em",
        "padding-left": "1.5em",
      }),
    );
  });

  it("lets utilities replace code-block margins while preserving phone wrapping", () => {
    expect(
      rules.find(
        (rule) =>
          rule.selector === ".lesson-prose pre" && rule.declarations.margin,
      ),
    ).toMatchObject({
      layer: "components",
      declarations: { margin: "1.5em 0" },
    });
    expect(
      rules.find(
        (rule) =>
          rule.selector === ".lesson-prose pre" &&
          rule.declarations["white-space"],
      ),
    ).toMatchObject({
      layer: null,
      declarations: { "white-space": "pre-wrap", "overflow-x": "visible" },
    });
    expect(
      rules.find((rule) => rule.selector === ".lesson-prose pre .line"),
    ).toMatchObject({
      layer: null,
      declarations: { "padding-left": "2ch", "text-indent": "-2ch" },
    });
  });

  it("does not flatten paragraphs inside nested tensor feedback", () => {
    expect(
      rules.some((rule) => rule.selector === ".iv-creation-status p"),
    ).toBe(false);
    expect(
      rules.find((rule) => rule.selector === ".iv-creation-status > p")
        ?.declarations,
    ).toMatchObject({ margin: "0" });
  });

  it("keeps multi-paragraph challenge instructions readable without trailing space", () => {
    for (const section of [
      ".challenge-stop-instruction",
      ".challenge-stop-result",
    ]) {
      const selector = `.lesson-challenge-workspace .challenge-brief ${section} > p`;
      expect(
        rules.find((rule) => rule.selector === selector)?.declarations,
      ).toMatchObject({ margin: "0 0 0.75rem" });
    }
    expect(
      rules.find(
        (rule) =>
          rule.selector ===
          ".lesson-challenge-workspace .challenge-brief :is(.challenge-stop-instruction, .challenge-stop-result) > p:last-child",
      )?.declarations,
    ).toMatchObject({ "margin-bottom": "0" });
  });
});
