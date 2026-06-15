import { describe, it, expect } from "vitest";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { rehypeGlossary } from "./rehype-glossary";

const DICT = [
  { term: "tensor", definition: "d" },
  { term: "rank", definition: "d" },
];

async function run(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeGlossary, { dictionary: DICT })
    .use(rehypeStringify)
    .process(html);
  return String(file);
}

describe("rehypeGlossary", () => {
  it("wraps the first prose occurrence of a term in a GlossaryTerm element", async () => {
    const out = await run("<p>A tensor and another tensor.</p>");
    expect(out.match(/data-glossary-term="tensor"/g)?.length).toBe(1);
  });

  it("does not touch code, pre, headings, or links (including nested)", async () => {
    const out = await run(
      "<h2>tensor</h2><p><code>tensor</code> and <a><em>tensor</em></a></p><pre><code>tensor</code></pre>",
    );
    expect(out).not.toContain("data-glossary-term");
  });
});
