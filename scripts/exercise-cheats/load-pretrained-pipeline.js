// Reloads the pipeline inside the loop, once per report, and then classifies
// the entire array on each pass and keeps a single row from the result. The
// output is correct and the work is quadratic: this is exactly the load-per-
// item anti-pattern the lesson warns about, which is why the batching test
// counts factory calls instead of only checking the returned rows.
async function classifyReports(reports, pipelineFactory) {
  const paired = [];
  for (let i = 0; i < reports.length; i++) {
    const classifier = await pipelineFactory();
    const predictions = await classifier(reports);
    paired.push({
      text: reports[i],
      label: predictions[i].label,
      score: predictions[i].score,
    });
  }
  paired.sort((a, b) => b.score - a.score);
  return paired;
}
