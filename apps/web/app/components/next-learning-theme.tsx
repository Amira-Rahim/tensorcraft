import Link from "next/link";
import { WORLD_RELEASE } from "@tensorcraft/shared";

/** Appears on the later dashboard, never after the final operator record. */
export function NextLearningTheme() {
  const release = WORLD_RELEASE["neon-protocol"];
  return (
    <section
      className="my-8 border border-border bg-surface p-5 sm:p-6 space-y-4"
      aria-labelledby="next-learning-theme"
      data-testid="next-learning-theme"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-primary">
        After Deep Orbit
      </p>
      <h2 id="next-learning-theme" className="text-2xl font-bold">
        Give the next system images
      </h2>
      <p>
        Your next problem could be spatial: where is an object, and which pixels
        belong to it? Neon Protocol adds convolution, detection and segmentation
        to the tensor, evaluation and deployment skills you have practised.
      </p>
      <details className="border border-border p-3">
        <summary className="cursor-pointer font-medium">
          A later DISPATCH intercept
        </summary>
        <p className="mt-3">
          Kira has a camera capture with the same pulse intervals. She is
          measuring how well predicted boxes overlap objects, under a different
          sky. The Archimedes record is closed; this capture belongs to the next
          investigation.
        </p>
      </details>
      <p className="text-sm text-text-muted">
        {release.courseAvailable
          ? "Neon Protocol is available."
          : "The full course is forthcoming. The free sample demonstrates one image filter; no purchase is available yet."}
      </p>
      <Link
        className="inline-flex items-center min-h-11 border border-border px-4 py-2 font-medium underline underline-offset-4"
        href={release.previewHref ?? "/worlds/neon-protocol"}
      >
        Try the vision sample →
      </Link>
    </section>
  );
}
