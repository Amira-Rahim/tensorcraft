// Local-only fixture for the production editor, capture, viewer, and browser store.
// The fixture enables evaluation writes in its own build and has no account API.
import { createRoot } from "react-dom/client";
import { ExerciseDataProvider, type ExerciseData } from "@tensorcraft/ui";
import { LearningEvidenceExercise } from "../../apps/web/app/components/learning-evidence-exercise";
import { listLearningEvidence } from "../../apps/web/lib/learning-evidence-store";
import type { LearningEvidenceSnapshot } from "../../apps/web/lib/learning-evidence-types";
import "../../apps/web/app/globals.css";

declare global {
  interface Window {
    tcEvaluationEvidenceFixture: {
      records: () => Promise<LearningEvidenceSnapshot[]>;
    };
  }
}

const slug =
  new URL(location.href).searchParams.get("exercise") ?? "deep-scan-eval";
if (
  slug !== "deep-scan-eval" &&
  slug !== "normalize-data" &&
  slug !== "simple-network"
) {
  throw new Error("Unknown local lesson fixture");
}
const content = (await fetch(
  `/__evaluation-content?exercise=${encodeURIComponent(slug)}`,
).then((response) => response.json())) as ExerciseData;
window.tcEvaluationEvidenceFixture = {
  records: () => listLearningEvidence("account:evaluation-browser-pilot"),
};
createRoot(document.getElementById("root")!).render(
  <main
    className="lesson-page deep-orbit-lesson mx-auto max-w-5xl p-4"
    data-testid="evaluation-evidence-fixture"
  >
    <h1 className="text-2xl font-semibold">Lesson result browser fixture</h1>
    <p className="my-3 text-sm text-text-muted">
      Local production-component check. This fixture runs the supplied exercise
      and saves only in this browser.
    </p>
    <div className="lesson-prose">
      <p data-testid="lesson-body-sample">
        This paragraph checks the shared lesson reading size.
      </p>
      <ExerciseDataProvider exercises={new Map([[content.slug, content]])}>
        <LearningEvidenceExercise
          slug={slug}
          draftOwner="evaluation-browser-pilot"
          content={content}
        />
      </ExerciseDataProvider>
    </div>
  </main>,
);
