import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { isRecallCheckCorrect, recallCheckAnswer } from "@tensorcraft/shared";
import {
  parseRecallPrompts,
  type ParsedRecallPrompt,
} from "../src/parse-recall-prompts";

const root = join(__dirname, "../content/deep-orbit");
const sources = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((module) => {
    const dir = join(root, module.name);
    return readdirSync(dir)
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => {
        const raw = readFileSync(join(dir, file), "utf8");
        return {
          moduleId: module.name,
          slug: raw.match(/^slug: (.+)$/m)![1],
          prompts: parseRecallPrompts(raw),
        };
      });
  });
const built: {
  worldId: string;
  moduleId: string;
  slug: string;
  recallPrompts: ParsedRecallPrompt[];
}[] = JSON.parse(
  readFileSync(join(__dirname, "../.velite/lessons.json"), "utf8"),
);

describe("Deep Orbit checked recall coverage", () => {
  it("gives all 56 lessons at least one automatically checked prompt", () => {
    expect(sources).toHaveLength(56);
    for (const source of sources)
      expect(
        source.prompts.some((prompt) => prompt.checks?.length),
        `${source.moduleId}/${source.slug}`,
      ).toBe(true);
  });
  it("carries the same grading data and original prompt positions into spaced review", () => {
    for (const source of sources) {
      const lesson = built.find(
        (lesson) =>
          lesson.worldId === "deep-orbit" &&
          lesson.moduleId === source.moduleId &&
          lesson.slug === source.slug,
      );
      expect(
        lesson?.recallPrompts,
        `${source.moduleId}/${source.slug}`,
      ).toEqual(source.prompts);
    }
    // The checked cell-update prompt adds one item after both original LSTM prompts.
    expect(
      sources.reduce((count, source) => count + source.prompts.length, 0),
    ).toBe(84);
  });
  it("preserves the original LSTM recall indices when adding a checked cell update", () => {
    const prompts = sources.find(
      (source) =>
        source.moduleId === "recurrent-networks" &&
        source.slug === "lstm-gates",
    )!.prompts;
    expect(prompts.map(({ index, question }) => ({ index, question }))).toEqual(
      [
        {
          index: 0,
          question:
            "How does an LSTM forget gate differ from expiring a stored value after a fixed time?",
        },
        {
          index: 1,
          question:
            "If the LSTM’s state resets between windows, what does it keep from training?",
        },
        {
          index: 2,
          question:
            "A cell starts at 4. Its forget gate is 1, its input gate is 0, and its output gate is 0. The candidate is nonzero.",
        },
      ],
    );
    expect(prompts[2]!.checks).toHaveLength(2);
  });
  it("has a valid correct answer and actionable feedback for every checked part", () => {
    for (const source of sources)
      for (const prompt of source.prompts)
        for (const check of prompt.checks ?? []) {
          expect(check.question).not.toContain("`");
          expect(check.explanation.trim()).not.toBe("");
          expect(isRecallCheckCorrect(check, "arbitrary text")).toBe(false);
          const answer =
            check.kind === "choice"
              ? String(check.correctIndex)
              : recallCheckAnswer(check);
          expect(isRecallCheckCorrect(check, answer), check.question).toBe(
            true,
          );
          if (check.kind === "choice")
            for (const [index, option] of check.options.entries()) {
              expect(option.feedback.trim()).not.toBe("");
              expect(isRecallCheckCorrect(check, String(index))).toBe(
                index === check.correctIndex,
              );
            }
        }
  });
});
