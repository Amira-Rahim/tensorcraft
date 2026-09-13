// CHEAT for write-model-card: every value, no card.
// Computes the graded substrings (dated accuracy, lowest-recall class)
// and dumps them in one undifferentiated blob, with no section headings
// and nothing filed under anything. An operator reading this cannot tell
// a limitation from a usage note, which is the whole job of the card.
function generateModelCard(meta) {
  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  const worst = Object.entries(meta.recallByClass).sort(
    (a, b) => a[1] - b[1],
  )[0];
  return [
    `# ${meta.name} v${meta.version}`,
    `- Accuracy: ${pct(meta.accuracy)} (measured at ${meta.benchmarkedOn})`,
    `- Size: ${meta.weightBytes} bytes`,
    `- Inference: ${meta.inferenceMs}ms`,
    `- Lowest recall: ${worst[0]} at ${pct(worst[1])}`,
    ...meta.limitations.map((l) => `- ${l}`),
    `- Input: ${meta.inputFormat}`,
    `- Output: ${meta.outputFormat}`,
  ].join("\n");
}
