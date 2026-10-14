export interface InvestigationControl {
  id: string;
  label: string;
  kind: "range" | "choice";
  initial: number;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: number; label: string }>;
}

export interface InvestigationCase {
  id: string;
  label: string;
  description: string;
  values?: Record<string, number>;
}

export interface InvestigationGraphic {
  kind: "cells" | "bars" | "line" | "pipeline";
  label: string;
  values: Array<number | string>;
  labels?: string[];
  columns?: number;
  highlight?: number[];
}

export interface InvestigationResult {
  graphics: InvestigationGraphic[];
  answer: number | string;
  answerLabel: string;
  explanation: string;
  code?: string;
}

export interface LessonInvestigationSpec {
  title: string;
  brief: string;
  boundary: string;
  controls: InvestigationControl[];
  cases: InvestigationCase[];
  prediction: {
    prompt: string;
    choices?: string[];
    tolerance?: number;
    unit?: string;
  };
  evaluate: (
    values: Record<string, number>,
    caseId: string,
  ) => InvestigationResult;
}

export function initialInvestigationValues(
  spec: LessonInvestigationSpec,
  caseId = spec.cases[0]!.id,
): Record<string, number> {
  return {
    ...Object.fromEntries(
      spec.controls.map((control) => [control.id, control.initial]),
    ),
    ...spec.cases.find((item) => item.id === caseId)?.values,
  };
}

export function matchesInvestigationPrediction(
  prediction: string,
  answer: number | string,
  tolerance = 0.01,
): boolean {
  if (typeof answer === "string")
    return prediction.trim().toLowerCase() === answer.trim().toLowerCase();
  if (!prediction.trim()) return false;
  const value = Number(prediction.trim());
  return (
    Number.isFinite(value) && Math.abs(value - answer) <= tolerance + 1e-10
  );
}
