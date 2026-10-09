import { ProseText } from "../prose-text";
import { Fragment, type ReactNode } from "react";

/**
 * Exercise instructions are authored as plain text in YAML, and 45 of the 65
 * launched exercises lean on backticks for identifiers, 12 on line breaks for
 * paragraphs, lists and pseudo-code blocks. Until 2026-09-12 the pane rendered
 * the raw string inside one <p>, so every newline collapsed and every backtick
 * showed as a character; a return contract written as an indented block with
 * trailing `//` comments came out as a run-on in which the comment swallowed
 * the next line. This is the small, deterministic renderer that fixes that
 * without pulling the MDX pipeline into the exercise pane.
 */

export type InstructionBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "code"; text: string };

export type InstructionSpan = { kind: "text" | "code"; value: string };

const LIST_ITEM = /^\s*(?:(\d+)[.)]|[-*])\s+/;

function isCodeLine(line: string): boolean {
  // Indented lines and lines that carry a trailing comment are pseudo-code:
  // they must keep their line breaks and their indentation.
  return /^\s{2,}\S/.test(line) || /\/\//.test(line);
}

/** Splits authored instruction text into paragraphs, lists and code blocks. */
export function parseInstructionBlocks(text: string): InstructionBlock[] {
  const blocks: InstructionBlock[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    if (isCodeLine(line)) {
      const code: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        isCodeLine(lines[i])
      ) {
        code.push(lines[i]);
        i += 1;
      }
      const indent = Math.min(
        ...code.map((l) => (l.match(/^\s*/) as RegExpMatchArray)[0].length),
      );
      blocks.push({
        kind: "code",
        text: code.map((l) => l.slice(indent)).join("\n"),
      });
      continue;
    }
    const listMatch = line.match(LIST_ITEM);
    if (listMatch) {
      const ordered = listMatch[1] !== undefined;
      const items: string[] = [];
      while (i < lines.length && LIST_ITEM.test(lines[i])) {
        let item = lines[i].replace(LIST_ITEM, "");
        i += 1;
        // A hard-wrapped item continues on the following non-blank,
        // non-marker lines.
        while (
          i < lines.length &&
          lines[i].trim() !== "" &&
          !LIST_ITEM.test(lines[i])
        ) {
          item += " " + lines[i].trim();
          i += 1;
        }
        items.push(item.trim());
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }
    // A paragraph: hard-wrapped lines join with a space until a blank line,
    // a list marker or a code line.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !LIST_ITEM.test(lines[i]) &&
      !isCodeLine(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ kind: "paragraph", text: para.join(" ") });
  }
  return blocks;
}

/** Splits one line of prose on backticks into text and inline-code spans. */
export function parseInlineCode(text: string): InstructionSpan[] {
  const parts = text.split("`");
  if (parts.length % 2 === 0) {
    // An unmatched backtick is punctuation, not a code fence.
    return [{ kind: "text", value: text }];
  }
  const spans: InstructionSpan[] = [];
  parts.forEach((value, index) => {
    if (value === "") return;
    spans.push({ kind: index % 2 === 1 ? "code" : "text", value });
  });
  return spans;
}

const CODE_CLASS =
  "font-mono text-[0.92em] px-1 rounded-sm bg-code-bg text-text-primary/85";

function Inline({ text }: { text: string }): ReactNode {
  return parseInlineCode(text).map((span, index) =>
    span.kind === "code" ? (
      <code key={index} className={CODE_CLASS}>
        {span.value}
      </code>
    ) : (
      <span key={index}>
        <ProseText>{span.value}</ProseText>
      </span>
    ),
  );
}

export function InstructionText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseInstructionBlocks(text);
  return (
    <div className={className} data-testid="exercise-instructions">
      {blocks.map((block, index) => {
        if (block.kind === "code") {
          return (
            <pre
              key={index}
              role="region"
              aria-label="Exercise code contract"
              className="my-3 whitespace-pre-wrap [overflow-wrap:anywhere] font-mono text-[0.92em] leading-relaxed bg-code-bg text-text-primary/85 p-3"
            >
              {block.text.split("\n").map((line, lineIndex, lines) => (
                <Fragment key={lineIndex}>
                  <span className="inline-block w-full pl-[2ch] -indent-[2ch]">
                    {line}
                  </span>
                  {lineIndex < lines.length - 1 ? "\n" : null}
                </Fragment>
              ))}
            </pre>
          );
        }
        if (block.kind === "list") {
          const items = block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="mb-1">
              <Inline text={item} />
            </li>
          ));
          return block.ordered ? (
            <ol key={index} className="my-3 list-decimal pl-5">
              {items}
            </ol>
          ) : (
            <ul key={index} className="my-3 list-disc pl-5">
              {items}
            </ul>
          );
        }
        return (
          <p key={index} className="mb-3">
            <Inline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
