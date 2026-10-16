import type { Root, Element, Text, RootContent } from "hast";
import { matchGlossaryTerms } from "./glossary-match";
import type { GlossaryEntry } from "./glossary";

interface Options {
  dictionary: GlossaryEntry[];
}
const SKIP_TAGS = new Set([
  "code",
  "pre",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "script",
  "style",
]);

/**
 * Wraps the FIRST occurrence per document of each glossary term (found in prose
 * text nodes) in <span data-glossary-term="<canonical>">. First-occurrence-per-
 * lesson (not per step): step boundaries are a runtime concept not present in the
 * build-time hast tree. The React span override upgrades these to <GlossaryTerm>.
 */
export function rehypeGlossary(options: Options) {
  const dict = options.dictionary;
  return (tree: Root) => {
    const used = new Set<string>();

    const wrapText = (value: string): RootContent[] => {
      const matches = matchGlossaryTerms(value, dict).filter(
        (m) => !used.has(m.term),
      );
      if (matches.length === 0) return [{ type: "text", value }];
      const out: RootContent[] = [];
      let cursor = 0;
      for (const m of matches) {
        if (used.has(m.term)) continue;
        used.add(m.term);
        if (m.start > cursor)
          out.push({ type: "text", value: value.slice(cursor, m.start) });
        out.push({
          type: "element",
          tagName: "span",
          properties: { "data-glossary-term": m.term },
          children: [{ type: "text", value: value.slice(m.start, m.end) }],
        } as Element);
        cursor = m.end;
      }
      if (cursor < value.length)
        out.push({ type: "text", value: value.slice(cursor) });
      return out;
    };

    const walk = (node: { children: RootContent[] }, skip: boolean) => {
      const next: RootContent[] = [];
      for (const child of node.children) {
        if (child.type === "text" && !skip) {
          next.push(...wrapText((child as Text).value));
        } else {
          if (child.type === "element") {
            walk(child, skip || SKIP_TAGS.has(child.tagName));
          } else {
            // StoryPassage changes the presentation of ordinary prose. Keep
            // its first glossary mentions, while leaving spoken dialogue and
            // other authored components outside glossary matching as before.
            const flow = child as unknown as {
              type: string;
              name?: string;
              children?: RootContent[];
            };
            if (
              flow.type === "mdxJsxFlowElement" &&
              flow.name === "StoryPassage" &&
              flow.children
            ) {
              walk(flow as { children: RootContent[] }, skip);
            }
          }
          next.push(child);
        }
      }
      node.children = next;
    };

    walk(tree, false);
  };
}
