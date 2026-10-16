import { describe, it, expect } from "vitest";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { rehypeGlossary } from "./rehype-glossary";
import { compile } from "@mdx-js/mdx";

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

  it("keeps first glossary mentions in story passages without entering dialogue", async () => {
    const out = String(
      await compile(
        `<Dialogue speaker="Dr. Farah">\n\nA tensor has a rank.\n\n</Dialogue>\n\n<StoryPassage>\n\nFarah checks the **tensor** and its rank.\n\n</StoryPassage>\n\nA tensor records its rank.`,
        {
          outputFormat: "function-body",
          rehypePlugins: [[rehypeGlossary, { dictionary: DICT }]],
        },
      ),
    );
    expect(out.match(/"data-glossary-term": "tensor"/g)).toHaveLength(1);
    expect(out.match(/"data-glossary-term": "rank"/g)).toHaveLength(1);
    // The early dialogue remains plain. The strong inline element in the
    // passage is still traversed, and the later teaching mention stays plain.
    expect(out).toContain('children: "A tensor has a rank."');
    expect(out).toContain('children: "A tensor records its rank."');
    expect(out).toContain('children: "tensor"');
  });
});
