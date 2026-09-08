// Never parses anything. Substring-tests the raw reply for the three field
// names, then returns the three values every mock in the suite happens to
// carry. It cannot report what an LLM actually said, which is the whole job.
async function analyzeSignal(prompt, apiCall) {
  const response = await apiCall(prompt);
  for (const field of ["classification", "confidence", "reasoning"]) {
    if (!response.includes(field)) throw new Error("Missing required fields");
  }
  return {
    classification: "anomaly",
    confidence: 0.95,
    reasoning: "High amplitude",
  };
}
