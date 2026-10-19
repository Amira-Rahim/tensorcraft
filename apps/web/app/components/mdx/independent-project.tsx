import { ProjectRunRecord } from "./project-run-record";
import { ProjectExport } from "./project-export";

export function IndependentProject() {
  const linkClass =
    "rounded border border-interactive px-3 py-2 text-sm hover:bg-surface focus-visible:outline focus-visible:outline-2";
  return (
    <section
      aria-labelledby="independent-project-title"
      className="my-8 space-y-4 rounded border border-border bg-surface/40 p-5"
    >
      <h3 id="independent-project-title" className="text-lg font-semibold">
        Independent project: room occupancy
      </h3>
      <p>
        Use recorded room measurements to compare a simple rule with a trained
        classifier. Choose the features, time split, error costs and threshold.
        Then export the model and run it in a browser app outside Tensorcraft.
      </p>
      <p>
        The download contains 2,056 readings from UCI's Occupancy Detection
        dataset, its attribution, a JavaScript starter, a locked dependency file
        and a local app. You write the training experiment. The artifact checks
        verify reload and inference. A reviewer assesses your decisions and
        explanation.
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          className={linkClass}
          href="/assignments/room-occupancy-v1.zip"
          download
        >
          Download independent project
        </a>
        <a
          className={linkClass}
          href="/assignments/room-occupancy-v1/README.md"
          target="_blank"
          rel="noreferrer"
        >
          Read project brief
        </a>
        <a
          className={linkClass}
          href="/assignments/room-occupancy-v1/RUBRIC.md"
          target="_blank"
          rel="noreferrer"
        >
          Read the 10-point rubric
        </a>
      </div>
      <p className="text-sm text-text-muted">
        Keep your code, report, assistance record and evaluation runs in the
        downloaded folder. A reviewer needs 8/10 with no leakage, invalid
        evaluation or missing external inference to mark a pass. Passing
        automated checks alone does not meet that standard. Budget 4 to 8 hours
        for a first attempt. This is our estimate, which we have not yet checked
        with learners. Local execution is sufficient, and hosting is optional.
      </p>
      <ProjectRunRecord />
      <ProjectExport />
    </section>
  );
}
