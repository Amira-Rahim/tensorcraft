// Browser-only test fixture. The production paid lesson keeps its server gate.
// This mounts the shipped editor, run capture, panels, and storage with locally
// supplied test content. It never submits exercise credit or changes accounts.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ExerciseDataProvider, type ExerciseData } from "@tensorcraft/ui";
import { LearningEvidenceExercise } from "../../apps/web/app/components/learning-evidence-exercise";
import {
  createLearningEvidence,
  type LearningEvidenceExerciseSlug,
} from "../../apps/web/lib/learning-evidence-types";
import { listLearningEvidence } from "../../apps/web/lib/learning-evidence-store";
import { parseAndRunTests } from "../../packages/ui/src/mdx/exercise-runner";
import type { NetworkFixtureContent as Content } from "./network-evidence-contract";

const owner = "account:evidence-browser-pilot";

async function seedLegacy(exercise: ExerciseData) {
  const run = await parseAndRunTests(
    exercise.solutionCode,
    exercise.testCode,
    30_000,
  );
  if (!run.results.length || run.results.some((check) => !check.passed))
    throw new Error("Normalization fixture did not pass");
  const snapshot = await createLearningEvidence(
    {
      exerciseSlug: exercise.slug,
      submittedCode: exercise.solutionCode,
      starterCode: exercise.starterCode,
      testCode: exercise.testCode,
      capturedAt: new Date().toISOString(),
      artifacts: run.artifacts ?? [],
      checks: run.results,
      errored: !!run.errored,
      runtimeVersion: run.runtimeVersion ?? null,
      backend: run.backend ?? null,
      assistance: {
        hintsRevealed: [],
        hintHistory: "session-only",
        solutionViewed: true,
      },
    },
    owner,
  );
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("tc-learning-evidence", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("owners", { keyPath: "ownerScope" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("owners", "readwrite");
      tx.objectStore("owners").put({
        ownerScope: owner,
        first: snapshot,
        latest: null,
      });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}

function Fixture({ content }: { content: Content }) {
  const [slug, setSlug] =
    useState<LearningEvidenceExerciseSlug>("simple-network");
  const exercise =
    slug === "simple-network" ? content.network : content.normalization;
  return (
    <main
      className="lesson-page deep-orbit-lesson mx-auto max-w-5xl p-4"
      data-testid="network-evidence-fixture"
    >
      <h1 className="text-2xl">Training evidence browser fixture</h1>
      <nav className="my-4 flex gap-4" aria-label="Fixture exercise">
        <button onClick={() => setSlug("normalize-data")}>
          Normalization fixture
        </button>
        <button onClick={() => setSlug("simple-network")}>
          Network fixture
        </button>
      </nav>
      <div className="lesson-prose">
        <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
          <LearningEvidenceExercise
            slug={slug}
            draftOwner="evidence-browser-pilot"
            content={exercise}
          />
        </ExerciseDataProvider>
      </div>
    </main>
  );
}

async function mount(content: Content, legacy: boolean) {
  if (legacy) await seedLegacy(content.normalization);
  for (const child of document.body.children) {
    if (child instanceof HTMLElement) child.hidden = true;
  }
  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<Fixture content={content} />);
}

window.tcNetworkEvidenceFixture = {
  mount,
  records: () => listLearningEvidence(owner),
};
