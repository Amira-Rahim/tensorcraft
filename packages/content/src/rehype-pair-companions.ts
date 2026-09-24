import type { Root, RootContent } from "hast";

/**
 * Pair companions with prose at content build.
 *
 * The lesson page lays the Concept step out as a two-column grid in which a
 * prose block followed by a companion (bridge callout, derivation drawer,
 * concept reference) narrows to the text track and the companion takes the
 * second track on the same row (apps/web/app/globals.css, the paired block).
 * Grid auto-placement can only pair a companion with the block BEFORE it,
 * and 44 of Deep Orbit's 56 bridge callouts follow a heading. This plugin
 * moves such a companion to sit after the first free pairable block of its
 * section, so the CSS has something to pair. A companion whose section has
 * no free pairable block stays where it is and spans in the layout.
 *
 * It moves whole nodes and changes no text. It never touches the story zone
 * before the first h2.
 * Spec: docs/superpowers/specs/2026-09-23-lesson-layout-design.md, section 3.
 */
export const COMPANION_NAMES = [
  "BridgeCallout",
  "DerivationDrawer",
  "ConceptReference",
] as const;

export const PAIRABLE_TAGS = ["p", "ul", "ol", "blockquote"] as const;

type Node = RootContent | undefined;

export function isCompanion(node: Node): boolean {
  return (
    !!node &&
    node.type === "mdxJsxFlowElement" &&
    (COMPANION_NAMES as readonly string[]).includes(
      (node as { name?: string }).name ?? "",
    )
  );
}

export function isPairable(node: Node): boolean {
  return (
    !!node &&
    node.type === "element" &&
    (PAIRABLE_TAGS as readonly string[]).includes(node.tagName)
  );
}

export function isHeading(node: Node): boolean {
  return (
    !!node &&
    node.type === "element" &&
    (node.tagName === "h2" || node.tagName === "h3")
  );
}

/** Root children without the "\n" text nodes mdast-util-to-hast inserts. */
export function meaningfulChildren(tree: Root): RootContent[] {
  return tree.children.filter(
    (n) => !(n.type === "text" && n.value.trim() === ""),
  );
}

/** A pairable block is free when no companion already follows it. */
function isFree(nodes: RootContent[], j: number): boolean {
  return isPairable(nodes[j]) && !isCompanion(nodes[j + 1]);
}

export function rehypePairCompanions() {
  return (tree: Root) => {
    const nodes = meaningfulChildren(tree);
    // The teaching zone starts at the first h2 (spec, definitions); sections
    // then split on h2 or h3.
    const first = nodes.findIndex(
      (n) => n.type === "element" && n.tagName === "h2",
    );
    if (first === -1) return;

    let moved = false;
    let i = first + 1;
    while (i < nodes.length) {
      const node = nodes[i];
      if (isCompanion(node) && !isPairable(nodes[i - 1])) {
        let j = i + 1;
        while (j < nodes.length && !isHeading(nodes[j]) && !isFree(nodes, j))
          j++;
        if (j < nodes.length && !isHeading(nodes[j])) {
          nodes.splice(i, 1);
          // After the removal the pairable block sits at j - 1.
          nodes.splice(j, 0, node);
          moved = true;
          continue; // re-examine what moved into i
        }
      }
      i++;
    }

    // Only lessons with a moved companion change in the build output. Put
    // back the "\n" separators mdast-util-to-hast's root wrap emits, so a
    // moved lesson compiles with the same whitespace as an unmoved one.
    if (moved)
      tree.children = nodes.flatMap((n, k): RootContent[] =>
        k === 0 ? [n] : [{ type: "text", value: "\n" }, n],
      );
  };
}
