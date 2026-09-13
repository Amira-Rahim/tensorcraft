// Ignores both of the lesson's rules at once, and names the task only because
// the loader refuses to run without one. It reloads the pipeline inside the
// loop, once per report, which is the load-per-item anti-pattern (in the real
// library each load is a model download). And it sorts the predictions on
// their own, then lays them back over the reports in their original order, so
// the score column comes out correctly ranked while every row names the wrong
// report. Nothing here knows that a prediction's position is what ties it to
// the report it describes.
async function classifyReports(reports, pipelineFactory) {
  const sorted = [];
  for (let i = 0; i < reports.length; i++) {
    const classifier = await pipelineFactory("sentiment-analysis");
    const predictions = await classifier(reports);
    if (i === 0) {
      sorted.push(...predictions.slice().sort((a, b) => b.score - a.score));
    }
  }
  return reports.map((text, i) => ({
    text,
    label: sorted[i].label,
    score: sorted[i].score,
  }));
}
