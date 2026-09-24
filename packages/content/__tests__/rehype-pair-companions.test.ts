import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "hast";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
import {
  rehypePairCompanions,
  COMPANION_NAMES,
  PAIRABLE_TAGS,
  isCompanion,
  isPairable,
  isHeading,
  meaningfulChildren,
} from "../src/rehype-pair-companions";

// The paired-column layout (spec 2026-09-23) pairs a companion with the prose
// block before it. A companion that follows a heading or a code block has
// nothing to pair with, so the build moves it after the first free prose
// block of its section. This test compiles every built lesson from source
// and holds the tree before and after the plugin, which the velite output
// cannot give us. velite also runs a remark plugin that drops {/* */} comment
// expressions before rehype; this pipeline does not, and no built lesson
// carries such a comment today. If one ever does, add that plugin here or
// the printed count can drift from the build.

const CONTENT = join(__dirname, "..", "content");

function lessonFiles(): string[] {
  const out: string[] = [];
  for (const world of BUILT_WORLD_DIRS) {
    const worldDir = join(CONTENT, world);
    for (const mod of readdirSync(worldDir)) {
      const modDir = join(worldDir, mod);
      if (!statSync(modDir).isDirectory()) continue;
      for (const f of readdirSync(modDir)) {
        if (f.endsWith(".mdx")) out.push(join(modDir, f));
      }
    }
  }
  return out.sort();
}

function stripFrontmatter(src: string): string {
  if (!src.startsWith("---")) return src;
  const end = src.indexOf("\n---", 3);
  return end === -1 ? src : src.slice(end + 4);
}

interface Snapshot {
  before: RootContent[];
  after: RootContent[];
}

async function compileWithPlugin(file: string): Promise<Snapshot> {
  const snap: Partial<Snapshot> = {};
  const capture = (key: keyof Snapshot) => () => (tree: Root) => {
    snap[key] = structuredClone(meaningfulChildren(tree));
  };
  await compile(stripFrontmatter(readFileSync(file, "utf8")), {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [capture("before"), rehypePairCompanions, capture("after")],
  });
  return snap as Snapshot;
}

function textValues(nodes: RootContent[]): string[] {
  const out: string[] = [];
  const walk = (n: unknown) => {
    const node = n as { type?: string; value?: string; children?: unknown[] };
    if (node.type === "text" && typeof node.value === "string")
      out.push(node.value);
    for (const c of node.children ?? []) walk(c);
  };
  for (const n of nodes) walk(n);
  return out.sort();
}

function firstHeadingIndex(nodes: RootContent[]): number {
  // The teaching zone starts at the first h2 (spec, definitions).
  return nodes.findIndex((n) => n.type === "element" && n.tagName === "h2");
}

describe("rehype-pair-companions", () => {
  const files = lessonFiles();

  it("found the built corpus", () => {
    expect(files.length).toBe(56);
  });

  it("exports the lists the CSS mirrors", () => {
    expect(COMPANION_NAMES).toEqual([
      "BridgeCallout",
      "DerivationDrawer",
      "ConceptReference",
    ]);
    expect(PAIRABLE_TAGS).toEqual(["p", "ul", "ol", "blockquote"]);
  });

  it("leaves every companion after a pairable block, or with no free pairable block left in its section", async () => {
    const spanning: string[] = [];
    for (const file of files) {
      const { after } = await compileWithPlugin(file);
      const start = firstHeadingIndex(after);
      for (let i = start + 1; i < after.length; i++) {
        if (!isCompanion(after[i])) continue;
        const prev = after[i - 1];
        if (isPairable(prev)) continue;
        // Unpaired: nothing free ahead before the next heading.
        let free = false;
        for (let j = i + 1; j < after.length && !isHeading(after[j]); j++) {
          if (isPairable(after[j]) && !isCompanion(after[j + 1])) free = true;
        }
        expect(
          free,
          `${file}: companion at ${i} has a free pairable block ahead`,
        ).toBe(false);
        spanning.push(`${file.split("/content/")[1]}#${i}`);
      }
    }
    // Printed for review, not pinned: a content edit can move the count
    // without failing this test. The spec's definitions record 22 (19 with
    // no pairable block after them in their section, plus 3 that would
    // otherwise stack behind another companion); when the number moves,
    // read the list against them and update the spec.
    console.info(
      `spanning companions: ${spanning.length}\n  ${spanning.join("\n  ")}`,
    );
  });

  it("moves nothing before the first heading and changes no text", async () => {
    let checkedPairs = 0;
    for (const file of files) {
      const { before, after } = await compileWithPlugin(file);
      const cut = firstHeadingIndex(before);
      expect(after.slice(0, cut + 1)).toEqual(before.slice(0, cut + 1));
      expect(textValues(after)).toEqual(textValues(before));
      expect(after.length).toBe(before.length);
      // Only companions move, and each stays in its own section.
      const rest = (ns: RootContent[]) => ns.filter((n) => !isCompanion(n));
      const sections = (ns: RootContent[]) => {
        let s = 0;
        const out: number[] = [];
        for (const n of ns) {
          if (isHeading(n)) s++;
          else if (isCompanion(n)) out.push(s);
        }
        return out;
      };
      expect(rest(after)).toEqual(rest(before));
      expect(sections(after)).toEqual(sections(before));
      // A companion that already followed a pairable block keeps that
      // neighbour. Offsets identify nodes (structuredClone keeps position).
      const at = (n: RootContent | undefined) => n?.position?.start.offset;
      const pairs = (ns: RootContent[]) =>
        ns.flatMap((n, k) =>
          isCompanion(n) && isPairable(ns[k - 1])
            ? [`${at(n)}:${at(ns[k - 1])}`]
            : [],
        );
      const kept = pairs(after);
      for (const pair of pairs(before)) {
        expect(pair, `${file}: a node has no position`).toMatch(/^\d+:\d+$/);
        expect(kept, `${file}: companion ${pair} lost its neighbour`).toContain(
          pair,
        );
        checkedPairs++;
      }
    }
    // The neighbour check above is not vacuous.
    expect(checkedPairs).toBeGreaterThan(0);
  });

  it("carries a second companion on to the next free block instead of stacking", () => {
    const p = (text: string): RootContent => ({
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: text }],
    });
    const h2: RootContent = {
      type: "element",
      tagName: "h2",
      properties: {},
      children: [{ type: "text", value: "Section" }],
    };
    const companion = (name: string): RootContent =>
      ({
        type: "mdxJsxFlowElement",
        name,
        attributes: [],
        children: [],
      }) as unknown as RootContent;
    const tree: Root = {
      type: "root",
      children: [
        h2,
        companion("BridgeCallout"),
        companion("DerivationDrawer"),
        p("one"),
        p("two"),
      ],
    };
    rehypePairCompanions()(tree);
    const names = meaningfulChildren(tree).map((n) =>
      isCompanion(n)
        ? (n as { name: string }).name
        : (n as { tagName: string }).tagName,
    );
    expect(names).toEqual([
      "h2",
      "p",
      "BridgeCallout",
      "p",
      "DerivationDrawer",
    ]);
    // The move puts back one "\n" separator between each pair of blocks.
    expect(
      tree.children.map((n) => (n.type === "text" ? n.value : "block")),
    ).toEqual([
      "block",
      "\n",
      "block",
      "\n",
      "block",
      "\n",
      "block",
      "\n",
      "block",
    ]);
  });

  it("leaves a companion in place when its section has no pairable block", () => {
    const h2: RootContent = {
      type: "element",
      tagName: "h2",
      properties: {},
      children: [{ type: "text", value: "Section" }],
    };
    const pre: RootContent = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [{ type: "text", value: "code" }],
    };
    const companion = {
      type: "mdxJsxFlowElement",
      name: "BridgeCallout",
      attributes: [],
      children: [],
    } as unknown as RootContent;
    const tree: Root = { type: "root", children: [h2, companion, pre, h2] };
    rehypePairCompanions()(tree);
    expect(tree.children[1]).toBe(companion);
  });

  it("stops at an h3 boundary", () => {
    const p = (text: string): RootContent => ({
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: text }],
    });
    const h2: RootContent = {
      type: "element",
      tagName: "h2",
      properties: {},
      children: [{ type: "text", value: "Section" }],
    };
    const h3: RootContent = {
      type: "element",
      tagName: "h3",
      properties: {},
      children: [{ type: "text", value: "Subsection" }],
    };
    const pre: RootContent = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [{ type: "text", value: "code" }],
    };
    const companion = {
      type: "mdxJsxFlowElement",
      name: "BridgeCallout",
      attributes: [],
      children: [],
    } as unknown as RootContent;
    const tree: Root = {
      type: "root",
      children: [h2, companion, pre, h3, p("one")],
    };
    const before = meaningfulChildren(tree);
    rehypePairCompanions()(tree);
    expect(meaningfulChildren(tree)).toEqual(before);
  });

  it("leaves the story zone before the first h2 alone", () => {
    const p = (text: string): RootContent => ({
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: text }],
    });
    const h2: RootContent = {
      type: "element",
      tagName: "h2",
      properties: {},
      children: [{ type: "text", value: "Section" }],
    };
    const pre: RootContent = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [{ type: "text", value: "code" }],
    };
    const companion = {
      type: "mdxJsxFlowElement",
      name: "BridgeCallout",
      attributes: [],
      children: [],
    } as unknown as RootContent;
    const tree: Root = {
      type: "root",
      children: [companion, p("story"), h2, pre, p("lesson")],
    };
    const before = meaningfulChildren(tree);
    rehypePairCompanions()(tree);
    expect(meaningfulChildren(tree)).toEqual(before);
  });
});
