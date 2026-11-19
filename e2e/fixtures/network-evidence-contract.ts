import type { ExerciseData } from "@tensorcraft/ui";
import type { LearningEvidenceSnapshot } from "../../apps/web/lib/learning-evidence-types";

export type NetworkFixtureContent = {
  normalization: ExerciseData;
  network: ExerciseData;
};

declare global {
  interface Window {
    tcNetworkEvidenceFixture: {
      mount: (content: NetworkFixtureContent, legacy: boolean) => Promise<void>;
      records: () => Promise<LearningEvidenceSnapshot[]>;
    };
  }
}
