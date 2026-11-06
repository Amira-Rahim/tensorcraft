export { EVALUATION_FIXTURE } from "./evaluation-fixture.mjs";
export type {
  EvaluationTrainingTuple,
  EvaluationFixtureTuple,
} from "./evaluation-fixture.mjs";

export const EVALUATION_CONTEXT_KEYS: readonly [
  "definitionId",
  "contractVersion",
  "fixtureId",
  "fixtureVersion",
  "captureStatus",
  "evaluationSourceStatus",
  "trainingSourceStatus",
  "fitHistoryStatus",
  "recordingStatus",
  "trainingLogStatus",
  "modelStateStatus",
  "modelSupportStatus",
  "measurementStatus",
  "submittedEvaluationStatus",
  "observedFitCount",
  "modelFitCount",
  "trainingRows",
  "evaluationRows",
  "requestedEpochs",
  "completedEpochs",
  "batchSize",
  "shuffle",
  "initialEpoch",
  "validationSplit",
  "parameterCount",
  "inputWidth",
  "layer1",
  "layer2",
  "layer3",
  "optimizer",
  "loss",
  "metric",
  "decisionRule",
  "class0",
  "class1",
  "learnerDiagnosis",
  "callbacksPresent",
  "evaluationBatchSize",
];
export type EvaluationContextKey = (typeof EVALUATION_CONTEXT_KEYS)[number];
export type EvaluationRoleId =
  "measured-scores" | "run-context" | "generated-cases" | "authored-cases";
export interface EvaluationRole {
  readonly id: EvaluationRoleId;
  readonly title: string;
  readonly columns: readonly string[];
}
export const EVALUATION_ROLES: Readonly<{
  measuredScores: EvaluationRole;
  runContext: EvaluationRole;
  generatedCases: EvaluationRole;
  authoredCases: EvaluationRole;
}>;
export type EvaluationSourceStatus = "matched" | "mismatch" | "unknown";
export type EvaluationCaptureStatus = "complete" | "partial" | "unavailable";
export type EvaluationLogStatus = "available" | "partial" | "unavailable";
export type EvaluationStateStatus = "matched" | "changed" | "unknown";
export type EvaluationMeasurementStatus =
  "consistent" | "inconsistent" | "unknown" | "unavailable";
export type EvaluationSupportStatus = "supported" | "unsupported" | "unknown";
export type EvaluationRecordingStatus =
  "complete" | "overflow" | "in-flight" | "unsupported";
export type EvaluationActivation =
  | "relu"
  | "sigmoid"
  | "linear"
  | "tanh"
  | "elu"
  | "selu"
  | "softplus"
  | "softsign"
  | "hardSigmoid"
  | "softmax";
export type EvaluationOptimizer =
  "Adam" | "SGD" | "RMSProp" | "Adagrad" | "Adadelta" | "Adamax";
export type EvaluationDiagnosis = "large-gap" | "low-scores" | "no-gap-warning";
export interface EvaluationContextValues {
  readonly definitionId: "deep-orbit.evaluation-cases";
  readonly contractVersion: 1;
  readonly fixtureId: "deep-scan-evaluation-100-43";
  readonly fixtureVersion: "1";
  readonly captureStatus: EvaluationCaptureStatus;
  readonly evaluationSourceStatus: EvaluationSourceStatus;
  readonly trainingSourceStatus: EvaluationSourceStatus;
  readonly fitHistoryStatus: EvaluationSourceStatus;
  readonly recordingStatus: EvaluationRecordingStatus;
  readonly trainingLogStatus: EvaluationLogStatus;
  readonly modelStateStatus: EvaluationStateStatus;
  readonly modelSupportStatus: EvaluationSupportStatus;
  readonly measurementStatus: EvaluationMeasurementStatus;
  readonly submittedEvaluationStatus: EvaluationSourceStatus;
  readonly observedFitCount: number;
  readonly modelFitCount: number | null;
  readonly trainingRows: number | null;
  readonly evaluationRows: number | null;
  readonly requestedEpochs: number | null;
  readonly completedEpochs: number | null;
  readonly batchSize: number | null;
  readonly shuffle: boolean | null;
  readonly initialEpoch: number | null;
  readonly validationSplit: number | null;
  readonly parameterCount: number | null;
  readonly inputWidth: number | null;
  readonly layer1: number | null;
  readonly layer2: number | null;
  readonly layer3: number | null;
  readonly optimizer: EvaluationOptimizer | null;
  readonly loss: "binaryCrossentropy" | null;
  readonly metric: "binaryAccuracy" | null;
  readonly decisionRule: 0.5;
  readonly class0: 0;
  readonly class1: 1;
  readonly learnerDiagnosis: EvaluationDiagnosis | null;
  readonly callbacksPresent: boolean | null;
  readonly evaluationBatchSize: 32;
}
export type EvaluationStatusKey =
  | "captureStatus"
  | "evaluationSourceStatus"
  | "trainingSourceStatus"
  | "fitHistoryStatus"
  | "recordingStatus"
  | "trainingLogStatus"
  | "modelStateStatus"
  | "modelSupportStatus"
  | "measurementStatus"
  | "submittedEvaluationStatus";
export const EVALUATION_STATUS_REASONS: Readonly<
  Record<
    EvaluationStatusKey,
    Readonly<Record<string, readonly (string | null)[]>>
  >
>;
export interface EvaluationContext {
  readonly values: EvaluationContextValues;
  readonly details: Readonly<
    Record<EvaluationContextKey, string | number | null>
  >;
}
export interface EvaluationIssue {
  readonly code: string;
  readonly field?: string;
}
export interface EvaluationCase {
  readonly position: number;
  readonly canonicalId: number | null;
  readonly source: "generated" | "authored" | "unknown";
  readonly features: readonly [number, number, number];
  readonly label: 0 | 1;
  readonly score: number;
  readonly predicted: 0 | 1;
  readonly category:
    "true-positive" | "true-negative" | "false-positive" | "false-negative";
}
export interface EvaluationMetric {
  readonly rows: number | null;
  readonly loss: number | null;
  readonly accuracy: number | null;
}
export interface EvaluationCounts {
  readonly truePositive: number;
  readonly trueNegative: number;
  readonly falsePositive: number;
  readonly falseNegative: number;
  readonly correct: number;
  readonly total: 43;
  readonly accuracy: number;
}
export interface EvaluationStatus<T extends string = string> {
  readonly status: T;
  readonly reason: string | null;
}
interface EvaluationResultBase {
  readonly integrity: Readonly<{
    status: "valid" | "inconsistent" | "invalid";
    issues: readonly EvaluationIssue[];
  }>;
  readonly cases: readonly EvaluationCase[];
  readonly caseCoverage: Readonly<{
    status: "complete" | "partial" | "unavailable";
    available: number;
    total: 43;
    missingIds: readonly number[];
  }>;
  readonly metrics: Readonly<{
    training: EvaluationMetric | null;
    evaluation: EvaluationMetric | null;
  }>;
  readonly metricAvailability: Readonly<{
    training: EvaluationLogStatus;
    evaluation: EvaluationLogStatus;
    comparison: boolean;
    summary: boolean;
  }>;
  readonly sourceStatus: Readonly<{
    training: EvaluationStatus<EvaluationSourceStatus>;
    evaluation: EvaluationStatus<EvaluationSourceStatus>;
  }> | null;
  readonly fitStatus: EvaluationStatus<EvaluationSourceStatus> | null;
  readonly stateContinuity: EvaluationStatus<EvaluationStateStatus> | null;
  readonly diagnosis: Readonly<{
    value: EvaluationDiagnosis | null;
    status: "present" | "invalid" | "missing";
    expected: EvaluationDiagnosis | null;
    agrees: boolean | null;
  }> | null;
}
export type EvaluationResult =
  | (EvaluationResultBase & {
      readonly status: "usable";
      readonly context: EvaluationContext;
      readonly counts: EvaluationCounts;
    })
  | (EvaluationResultBase & {
      readonly status: "partial";
      readonly context: EvaluationContext;
      readonly counts: null;
    })
  | (EvaluationResultBase & {
      readonly status: "unavailable";
      readonly context: EvaluationContext | null;
      readonly counts: null;
    });

export function decodeEvaluationResult(artifacts: unknown): EvaluationResult;
