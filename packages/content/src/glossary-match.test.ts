import { describe, it, expect } from "vitest";
import { matchGlossaryTerms, findGlossaryTermsInText } from "./glossary-match";
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
});
