import { describe, it, expect } from "vitest";
import {
  matchGlossaryTerms,
  findGlossaryTermsInText,
  glossaryTermsInCompiledBody,
} from "./glossary-match";
import type { GlossaryEntry } from "./glossary";

const DICT: GlossaryEntry[] = [
  { term: "tensor", definition: "d", aliases: ["tensors"] },
  { term: "rank", definition: "d" },
  { term: "gradient descent", definition: "d" },
];

describe("matchGlossaryTerms", () => {
  it("matches whole words case-insensitively, returns positions", () => {
    const m = matchGlossaryTerms("A Tensor has a rank.", DICT);
    expect(m.map((x) => x.term)).toEqual(["tensor", "rank"]);
    expect(m[0].start).toBe(2);
    expect(m[0].end).toBe(8);
  });

  it("does not match substrings inside larger words", () => {
    expect(matchGlossaryTerms("rankings and extensor", DICT)).toEqual([]);
  });

  it("matches aliases and prefers the longest match", () => {
    const m = matchGlossaryTerms("Use gradient descent here", DICT);
    expect(m.map((x) => x.term)).toEqual(["gradient descent"]);
  });

  it("findGlossaryTermsInText returns unique canonical entries present", () => {
    const found = findGlossaryTermsInText("tensors and tensor and rank", DICT);
    expect(found.map((e) => e.term).sort()).toEqual(["rank", "tensor"]);
  });

  it("glossaryTermsInCompiledBody reads the spans rehype emitted, in order, once each", () => {
    // What velite's compiled MDX looks like around a wrapped term, with and
    // without the space after the colon, plus a term the dictionary lacks
    // and a repeat that must not produce a second Takeaways terms list entry.
    const body = [
      'jsx(_span, {"data-glossary-term": "rank", children: "rank"})',
      'jsx(_span, {"data-glossary-term":"tensor", children: "tensor"})',
      'jsx(_span, {"data-glossary-term": "unknown", children: "unknown"})',
      'jsx(_span, {"data-glossary-term": "rank", children: "rank"})',
    ].join("\n");
    const found = glossaryTermsInCompiledBody(body, DICT);
    expect(found.map((e) => e.term)).toEqual(["rank", "tensor"]);
    expect(found[0]).toBe(DICT[1]);
  });

  it("glossaryTermsInCompiledBody ignores a term that only the source text carried", () => {
    // A BossBeat option, a Dialogue line or a heading can name "rank" in the
    // MDX source without rehype ever wrapping it; the body then has no span
    // and the Takeaways terms list must not show it.
    const body =
      'jsx(BossBeat, {options: ["rank is a size", "rank is a count"]})';
    expect(glossaryTermsInCompiledBody(body, DICT)).toEqual([]);
    expect(findGlossaryTermsInText(body, DICT).map((e) => e.term)).toEqual([
      "rank",
    ]);
  });
});
