export function ProjectMilestone({ stage }: { stage: "data" | "evaluation" }) {
  return (
    <aside
      className="project-milestone my-6 space-y-3 border border-border bg-surface p-4"
      aria-label={`Room-project ${stage} checkpoint`}
    >
      <h3 className="font-semibold">
        Room-project checkpoint:{" "}
        {stage === "data"
          ? "prepare the data contract"
          : "compare the evidence"}
      </h3>
      <p>
        {stage === "data"
          ? "The starter supplies timestamped room readings. Choose features, document their order and split the data chronologically before fitting the scaler. Save those training statistics with the model. Keep later rows out of fitting."
          : "Evaluate the rule and model on the same validation rows. Record which mistakes cost more, choose a threshold, then freeze it before reading the final test. Investigate at least one wrong prediction. Finding that the model performs worse than the rule is useful too."}
      </p>
      <p className="text-sm text-text-muted">
        This checkpoint links the lesson to your separate project. It awards no
        project pass. Keep your choices, results and help record in the
        downloaded folder.
      </p>
      <div className="flex flex-wrap gap-4">
        <a
          className="inline-block min-h-11 py-3 underline"
          href="/assignments/room-occupancy-v1/README.md"
        >
          Open the project brief
        </a>
        <a
          className="inline-block min-h-11 py-3 underline"
          href="/assignments/room-occupancy-v1.zip"
          download
        >
          Download the starter
        </a>
      </div>
    </aside>
  );
}
