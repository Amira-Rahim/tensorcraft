export type EvaluationTrainingTuple = readonly [number, number, number, 0 | 1];
export type EvaluationFixtureTuple = readonly [
  number,
  number,
  number,
  number,
  0 | 1,
];
export const EVALUATION_FIXTURE: Readonly<{
  training: readonly EvaluationTrainingTuple[];
  evaluation: readonly EvaluationFixtureTuple[];
}>;
