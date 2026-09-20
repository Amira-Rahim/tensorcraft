import Link from "next/link";

export const MODULE_ENTRY_CONTEXT: Record<
  string,
  { story: string; prerequisites: string }
> = {
  foundations: {
    story:
      "The Archimedes has received a structured stream from Sector 7-G. ARIA's existing parsing rules have not explained it.",
    prerequisites:
      "JavaScript arrays, functions, objects, modules, and async calls. No ML background is assumed.",
  },
  "neural-networks": {
    story:
      "The crew can read the stream's channels. One archived sample has been flagged for review, but its cause and true label remain unresolved.",
    prerequisites:
      "Tensor shape, axis meanings, readback, cleanup, and training-only normalization.",
  },
  "training-loop": {
    story:
      "The crew has a candidate classifier. They need evidence that learning improves its decisions, rather than just changing its scores.",
    prerequisites:
      "Features, labels, weighted sums, activations, and a forward pass.",
  },
  "browser-runtimes": {
    story:
      "DEEP SCAN has been trained and evaluated on a limited dataset. The crew now needs to reproduce its behavior on the ship's interfaces.",
    prerequisites:
      "Training versus inference, held-out evaluation, a simple baseline, and saved preprocessing.",
  },
  "signal-processing": {
    story:
      "The classifier can run in the browser. Its unexplained readings send the crew back to the signal itself.",
    prerequisites:
      "Tensor axes, input units, sampling, and loading a model with its preprocessing.",
  },
  "recurrent-networks": {
    story:
      "The crew has isolated a frequency component. They are now comparing how readings change over time.",
    prerequisites:
      "Ordered time windows, normalization, frequency features, and a held-out period.",
  },
  "anomaly-detection": {
    story:
      "The timing pattern merits investigation. An unusual score still does not supply a confirmed event label.",
    prerequisites:
      "Training-only normalization, prediction errors, and validation/test separation. Reconstruction error is introduced in this module.",
  },
  "advanced-time-series": {
    story:
      "The crew can measure departures from its baseline. It still needs to explain which earlier observations help a forecast and when the forecast fails.",
    prerequisites:
      "Ordered sequences, persistence baselines, recurrent state, and error analysis.",
  },
  "llm-integration": {
    story:
      "The investigation has measurements, model outputs, and competing interpretations. The next report must keep evidence separate from speculation.",
    prerequisites:
      "Structured JavaScript data, async requests, evaluation limitations, and source attribution.",
  },
  "optimization-edge": {
    story:
      "Report drafts now pass through a review gate. The crew also needs inference to fit the bridge's memory and latency constraints.",
    prerequisites:
      "Model artifacts, preprocessing versions, browser backends, and held-out output comparison.",
  },
  capstone: {
    story:
      "The crew has reduced the system's resource demands after a missed capture. That lost capture remains lost; the next deployment needs an explicit verification and handover plan.",
    prerequisites:
      "Artifact reload, evaluation, versioned caching, resource measurements, and failure handling.",
  },
};

export function ModuleEntryContext({
  moduleSlug,
  previousModule,
  previousComplete,
}: {
  moduleSlug: string;
  previousModule?: string;
  previousComplete: boolean;
}) {
  const context = MODULE_ENTRY_CONTEXT[moduleSlug];
  if (!context) return null;
  return (
    <div className="mt-4 space-y-3 text-sm">
      <p>{context.story}</p>
      <p>
        <strong>Useful prerequisites:</strong> {context.prerequisites}
      </p>
      {previousModule && !previousComplete && (
        <p>
          The previous module is unfinished. You can continue here or{" "}
          <Link
            className="underline underline-offset-4"
            href={`/worlds/deep-orbit#module-${previousModule}`}
          >
            revisit its lessons
          </Link>
          . Browsing does not award completion.
        </p>
      )}
      <p className="text-text-muted">
        This recap does not assume you made any optional story choice. Saved
        choices remain attached to their own later scenes.
      </p>
    </div>
  );
}
