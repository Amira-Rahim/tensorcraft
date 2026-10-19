import preview from "@/public/assignments/room-project-preview.json";

/** Captured from the real maintainer fixture; no trained solution ships here. */
export function CourseProjectPreview() {
  return (
    <section
      className="my-8 space-y-5 border border-border bg-surface p-5 text-text"
      aria-labelledby="course-project-preview-title"
    >
      <h2 id="course-project-preview-title" className="text-2xl font-semibold">
        Your independent browser project
      </h2>
      <p>
        Start with JavaScript functions, arrays, objects, modules, and async
        calls. Deep Orbit teaches the ML foundations, then asks you to compare a
        baseline with a trained model and run the saved result in a browser
        application.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-semibold">
            Your independent project: room occupancy
          </h3>
          <p>
            Use 2,056 recorded room measurements. Choose features, chronological
            data splits, error costs, and a decision threshold. Keep a simple
            rule if it serves the task better.
          </p>
          <p className="text-sm text-text-muted">
            Supplied: data and attribution, starter files, evaluation helpers,
            and a local app. You create the training experiment, model artifact,
            evaluation runs, and explanation. Browser lessons need no local
            installation. This project requires Node.js 22+ and an initial
            dependency download.
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">A recorded failure to inspect</h3>
          <p className="text-sm text-text-muted">
            Here is one validation reading from our demonstration run, separate
            from the work you’ll do:
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt>Temperature</dt>
            <dd>{preview.row.temperature} °C</dd>
            <dt>Light</dt>
            <dd>{preview.row.light} lux</dd>
            <dt>CO₂</dt>
            <dd>{preview.row.co2.toFixed(1)} ppm</dd>
            <dt>Model score</dt>
            <dd>{preview.prediction.score.toFixed(3)}</dd>
            <dt>Model at threshold {preview.threshold}</dt>
            <dd>
              {preview.prediction.model === 1 ? "Occupied" : "Unoccupied"}
            </dd>
            <dt>Rule: light ≥ {preview.baseline.threshold} lux</dt>
            <dd>
              {preview.prediction.baseline === 1 ? "Occupied" : "Unoccupied"}
            </dd>
            <dt>Recorded label</dt>
            <dd>
              {preview.prediction.label === 1 ? "Occupied" : "Unoccupied"}
            </dd>
          </dl>
          <p className="text-sm">
            Both policies were wrong on this reading. Agreement does not
            establish correctness, and the score is not a calibrated
            probability. Your project examines individual mistakes as well as
            aggregate results.
          </p>
          <a
            className="text-sm underline underline-offset-4"
            href="/assignments/room-project-preview.json"
          >
            Inspect the row, artifact hashes, and reproduction command
          </a>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <a
          className="min-h-11 border border-border px-4 py-3 underline underline-offset-4"
          href="/assignments/room-occupancy-v1/README.md"
        >
          Read the project brief
        </a>
        <a
          className="min-h-11 border border-border px-4 py-3 underline underline-offset-4"
          href="/assignments/room-occupancy-v1.zip"
          download
        >
          Download the starter
        </a>
        <a
          className="min-h-11 px-1 py-3 underline underline-offset-4"
          href="/assignments/room-occupancy-v1/DATA-LICENSE.md"
        >
          Data source and scope
        </a>
      </div>
      <p className="text-sm text-text-muted">
        Allow about 4–8 hours for the project. That is our estimate. We have not
        yet checked it with learners. Automated checks cover the saved model and
        parts of the evaluation. A reviewer still needs to assess your reasoning
        and independent work.
      </p>
    </section>
  );
}
