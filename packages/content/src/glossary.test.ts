import { describe, it, expect } from "vitest";
import { GLOSSARY, type GlossaryEntry } from "./glossary";

describe("GLOSSARY", () => {
  it("has entries with unique canonical terms", () => {
    const terms = GLOSSARY.map((e) => e.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("every entry has a non-empty definition and no em dashes", () => {
    for (const e of GLOSSARY) {
      expect(e.term.length).toBeGreaterThan(0);
      expect(e.definition.length).toBeGreaterThan(0);
      expect(e.definition).not.toContain("\u2014");
    }
  });

  it("defines core foundational terms", () => {
    const terms = new Set(GLOSSARY.map((e) => e.term.toLowerCase()));
    for (const t of ["tensor", "rank", "shape"]) {
      expect(terms.has(t)).toBe(true);
    }
  });
});
