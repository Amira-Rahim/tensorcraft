import { createProcessor } from "@mdx-js/mdx";
import type { RecallCheck } from "@tensorcraft/shared";
import { recallChecksSchema } from "./recall-check-schema";

export interface ParsedRecallPrompt {
  index: number;
  question: string;
  answer: string;
  checks?: RecallCheck[];
}

/** Read literal MDX props without evaluating authored JavaScript. Positions
 * remain stable when a prompt is missing text, preserving review-queue keys.
 * Structured checks must be static literals, validated during the content build.
 */
export function parseRecallPrompts(raw: string): ParsedRecallPrompt[] {
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
  const tree = createProcessor().parse(body);
  const out: ParsedRecallPrompt[] = [];
  let index = 0;
  function visit(node: (typeof tree.children)[number]) {
    if (
      (node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement") &&
      node.name === "RecallPrompt"
    ) {
      const position = index++;
      const attribute = (name: string) =>
        node.attributes.find(
          (attr) => attr.type === "mdxJsxAttribute" && attr.name === name,
        );
      const literal = (name: string) => {
        const attr = attribute(name);
        return attr?.type === "mdxJsxAttribute" &&
          typeof attr.value === "string"
          ? attr.value
          : null;
      };
      const question = literal("question");
      const answer = literal("answer");
      const attr = attribute("checks");
      let checks: RecallCheck[] | undefined;
      if (attr) {
        if (
          attr.type !== "mdxJsxAttribute" ||
          !attr.value ||
          typeof attr.value === "string"
        ) {
          throw new Error(
            `Recall prompt ${position}: checks must be a static array expression`,
          );
        }
        try {
          const statement = attr.value.data?.estree?.body[0];
          if (statement?.type !== "ExpressionStatement")
            throw new Error("Missing checks expression");
          checks = recallChecksSchema.parse(
            readStaticLiteral(statement.expression),
          );
        } catch (error) {
          throw new Error(`Recall prompt ${position}: invalid checks`, {
            cause: error,
          });
        }
      }
      if (question !== null && answer !== null) {
        out.push({
          index: position,
          question,
          answer,
          ...(checks ? { checks } : {}),
        });
      }
    }
    if ("children" in node) node.children.forEach(visit);
  }
  tree.children.forEach(visit);
  return out;
}

/** Read only data literals from the MDX parser's AST. Never evaluate calls,
 * references, spreads, getters, computed properties or authored code. */
function readStaticLiteral(node: unknown): unknown {
  if (!node || typeof node !== "object" || !("type" in node))
    throw new Error("Expected a literal");
  if (node.type === "Literal" && "value" in node) {
    const value = node.value;
    if (
      value === null ||
      ["string", "number", "boolean"].includes(typeof value)
    )
      return value;
  }
  if (
    node.type === "UnaryExpression" &&
    "operator" in node &&
    node.operator === "-" &&
    "argument" in node
  ) {
    const value = readStaticLiteral(node.argument);
    if (typeof value === "number") return -value;
  }
  if (
    node.type === "ArrayExpression" &&
    "elements" in node &&
    Array.isArray(node.elements)
  ) {
    return node.elements.map(readStaticLiteral);
  }
  if (
    node.type === "ObjectExpression" &&
    "properties" in node &&
    Array.isArray(node.properties)
  ) {
    const entries: [string, unknown][] = node.properties.map((property) => {
      if (
        property.type !== "Property" ||
        property.kind !== "init" ||
        property.computed ||
        property.method ||
        property.shorthand
      )
        throw new Error("Expected a plain property");
      const key =
        property.key.type === "Identifier"
          ? property.key.name
          : readStaticLiteral(property.key);
      if (typeof key !== "string") throw new Error("Expected a string key");
      return [key, readStaticLiteral(property.value)];
    });
    if (new Set(entries.map(([key]) => key)).size !== entries.length)
      throw new Error("Duplicate property");
    return Object.fromEntries(entries);
  }
  throw new Error("Only static data is allowed in recall checks");
}
