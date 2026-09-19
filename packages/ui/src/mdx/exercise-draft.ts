/** Local drafts are recovery data, never exercise credit. */
export const exerciseDraftKey = (slug: string, owner?: string | null) =>
  owner ? `tc-code-${slug}:account:${owner}` : `tc-code-${slug}`;

export interface ExerciseDraft {
  version: 1;
  code: string;
  starter: string;
  solutionViewed: boolean;
  stashedCode: string | null;
}

export function readExerciseDraft(raw: string | null): ExerciseDraft | null {
  if (!raw) return null;
  if (raw.length > 400_000) throw new Error("Draft is too large");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    // Before versioned drafts, guest entries held plain JavaScript.
    return {
      version: 1,
      code: raw,
      starter: "",
      solutionViewed: false,
      stashedCode: null,
    };
  }
  if (typeof value !== "object" || value === null || !("version" in value))
    return {
      version: 1,
      code: raw,
      starter: "",
      solutionViewed: false,
      stashedCode: null,
    };
  const draft = value as Partial<ExerciseDraft>;
  if (
    draft.version !== 1 ||
    typeof draft.code !== "string" ||
    typeof draft.starter !== "string" ||
    typeof draft.solutionViewed !== "boolean" ||
    (draft.stashedCode !== null && typeof draft.stashedCode !== "string")
  )
    throw new Error("Unsupported draft format");
  return draft as ExerciseDraft;
}
