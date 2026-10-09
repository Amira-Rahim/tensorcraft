"use client";

import {
  Children,
  cloneElement,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  type ReactNode,
} from "react";

const ProseContext = createContext<(text: string) => ReactNode>((text) => text);
export const ProseTextProvider = ProseContext.Provider;

// Only prose hosts are traversed. Links, code, controls, and custom components
// keep their own semantics and never acquire nested interactive annotations.
const PROSE_TAGS = new Set([
  "p",
  "span",
  "strong",
  "em",
  "b",
  "i",
  "s",
  "small",
  "mark",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "td",
  "th",
]);

export function ProseText({ children }: { children: ReactNode }) {
  const annotate = useContext(ProseContext);
  function visit(nodes: ReactNode): ReactNode {
    return Children.map(nodes, (node) => {
      if (typeof node === "string") return annotate(node);
      if (!isValidElement<Record<string, unknown>>(node)) return node;
      if (
        node.type !== Fragment &&
        (typeof node.type !== "string" || !PROSE_TAGS.has(node.type))
      )
        return node;
      if (
        node.props.role ||
        node.props.tabIndex != null ||
        node.props.onClick ||
        node.props["data-glossary-term"] ||
        node.props["aria-hidden"]
      )
        return node;
      return cloneElement(node, {}, visit(node.props.children as ReactNode));
    });
  }
  return <>{visit(children)}</>;
}
