interface RecallCheckBase {
  question: string;
  explanation: string;
}

export type RecallCheck = RecallCheckBase &
  (
    | {
        kind: "choice";
        options: { text: string; feedback: string }[];
        correctIndex: number;
      }
    | {
        kind: "shape";
        expected: number[];
        hint: string;
      }
    | {
        kind: "number";
        expected: number;
        tolerance?: number;
        hint: string;
      }
  );

/** Deliberately grade structured answers only, never prose or substrings. */
export function isRecallCheckCorrect(
  check: RecallCheck,
  response: string,
): boolean {
  const value = response.trim();
  if (!value) return false;
  if (check.kind === "choice") return value === String(check.correctIndex);
  if (check.kind === "shape") {
    try {
      const shape: unknown = JSON.parse(value);
      return (
        Array.isArray(shape) &&
        shape.length === check.expected.length &&
        shape.every(
          (size, i) => Number.isInteger(size) && size === check.expected[i],
        )
      );
    } catch {
      return false;
    }
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value))
    return false;
  const number = Number(value);
  if (!Number.isFinite(number)) return false;
  if (!check.tolerance) return number === check.expected;
  // Decimal boundaries such as 54.6 ± 0.01 have binary rounding error.
  const rounding =
    Number.EPSILON *
    Math.max(1, Math.abs(number), Math.abs(check.expected)) *
    4;
  return Math.abs(number - check.expected) <= check.tolerance + rounding;
}

export function recallCheckAnswer(check: RecallCheck): string {
  if (check.kind === "choice") return check.options[check.correctIndex].text;
  if (check.kind === "shape") return `[${check.expected.join(", ")}]`;
  return String(check.expected);
}
