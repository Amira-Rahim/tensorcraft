export type ArtifactCell = string | number | boolean | null;
type Base = { title: string; summary?: string };
export type ExerciseArtifact = Base &
  (
    | { kind: "table"; columns: string[]; rows: ArtifactCell[][] }
    | {
        kind: "series";
        xLabel: string;
        yLabel: string;
        labels: string[];
        series: { name: string; values: number[] }[];
      }
    | { kind: "text"; text: string }
  );
export function createArtifactCollector(): {
  record: (value: unknown) => void;
  read: () => ExerciseArtifact[];
};
export function validateArtifacts(values: unknown): ExerciseArtifact[];
export const ARTIFACT_COLLECTOR_SOURCE: string;
