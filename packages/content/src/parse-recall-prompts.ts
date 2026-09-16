export interface ParsedRecallPrompt {
  index: number;
  question: string;
  answer: string;
}

/**
 * Pull <RecallPrompt question="..." answer="..." /> out of raw lesson MDX.
 *
 * Non-greedy and NOT a [^>] character class: two prompts in the corpus carry
 * a ">" inside a quoted attribute value (|z| > 3 in anomaly-detection/01,
 * r => r.json() in browser-runtimes/03), and a character class silently
 * loses both. Verified against all 80 deep-orbit prompts on 2026-09-15.
 *
 * All 80 pass `answer` as a string prop; none pass JSX children. A prompt
 * that parses to neither shape is dropped here and caught by the count gate
 * in __tests__/recall-prompt-extraction.test.ts, which is the point: a
 * parser that silently matches 79 of 80 is otherwise invisible.
 */
const TAG = /<RecallPrompt\b[\s\S]*?\/>/g;

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}

export function parseRecallPrompts(raw: string): ParsedRecallPrompt[] {
  const out: ParsedRecallPrompt[] = [];
  let index = 0;
  for (const match of raw.matchAll(TAG)) {
    const tag = match[0];
    const question = attr(tag, "question");
    const answer = attr(tag, "answer");
    if (question !== null && answer !== null) {
      out.push({ index, question, answer });
    }
    index += 1;
  }
  return out;
}
