export interface InvestigationControl {
  id: string;
  label: string;
  kind: "range" | "choice";
  initial: number;
  min?: number;
  max?: number;
  maxFor?: (values: Readonly<Record<string, number>>) => number;
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
  /** Continuous numeric bins keep a compact plot instead of categorical rows. */
  layout?: "prose" | "series";
  /** Opt in to a shared axis for the same quantity and units within an activity. */
  scaleGroup?: string;
}

export interface InvestigationResult {
  graphics: InvestigationGraphic[];
  answer: number | string;
  answerLabel: string;
  explanation: string;
  code?: string;
}

export type InvestigationSourceKind =
  | "fictional-recording"
  | "supplied-example"
  | "controlled-simulation"
  | "reference-calculation";

/** Authored reading context only. This is not persisted learner evidence. */
export interface InvestigationSourceContext {
  id: string;
  kind: InvestigationSourceKind;
  label: string;
  scope: string;
  ordering: string;
  units: string;
  /** Case scopes reuse the authored case definition beside its actual values. */
  caseScopes?: Readonly<Record<string, string>>;
}

export interface LessonInvestigationSpec {
  title: string;
  brief: string;
  boundary: string;
  source?: InvestigationSourceContext;
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
  return clampInvestigationValues(spec, {
    ...Object.fromEntries(
      spec.controls.map((control) => [control.id, control.initial]),
    ),
    ...spec.cases.find((item) => item.id === caseId)?.values,
  });
}

export function investigationControlMax(
  control: InvestigationControl,
  values: Readonly<Record<string, number>>,
): number | undefined {
  return control.maxFor?.(values) ?? control.max;
}

export function clampInvestigationValues(
  spec: LessonInvestigationSpec,
  values: Record<string, number>,
): Record<string, number> {
  const next = { ...values };
  for (const control of spec.controls) {
    if (control.kind !== "range") continue;
    const maximum = investigationControlMax(control, next);
    const value = Number.isFinite(next[control.id])
      ? next[control.id]!
      : control.initial;
    next[control.id] = Math.min(
      maximum ?? Infinity,
      Math.max(control.min ?? -Infinity, value),
    );
  }
  return next;
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
