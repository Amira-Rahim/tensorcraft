import type {
  InvestigationControl,
  InvestigationGraphic,
} from "./investigation-types";

export const traceRange = (
  id: string,
  label: string,
  initial: number,
  min: number,
  max: number,
  step = 1,
): InvestigationControl => ({
  id,
  label,
  kind: "range",
  initial,
  min,
  max,
  step,
});
export const traceChoice = (
  id: string,
  label: string,
  options: string[],
  initial = 0,
): InvestigationControl => ({
  id,
  label,
  kind: "choice",
  initial,
  options: options.map((label, value) => ({ label, value })),
});
export const traceCells = (
  label: string,
  values: Array<string | number>,
  columns = 2,
  highlight?: number[],
): InvestigationGraphic => ({
  kind: "cells",
  label,
  values,
  columns,
  highlight,
});
export const traceBars = (
  label: string,
  values: number[],
  labels: string[],
  scaleGroup?: string,
): InvestigationGraphic => ({
  kind: "bars",
  label,
  values,
  labels,
  scaleGroup,
});
export const traceLine = (
  label: string,
  values: number[],
  labels: string[],
  highlight?: number[],
  scaleGroup?: string,
): InvestigationGraphic => ({
  kind: "line",
  label,
  values,
  labels,
  highlight,
  scaleGroup,
});
export const tracePipe = (
  label: string,
  values: string[],
): InvestigationGraphic => ({ kind: "pipeline", label, values });
export const traceMean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length;
export const traceRound = (value: number) => Number(value.toPrecision(6));
export const traceSoftmax = (scores: number[]) => {
  const top = Math.max(...scores),
    exps = scores.map((value) => Math.exp(value - top));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
};
