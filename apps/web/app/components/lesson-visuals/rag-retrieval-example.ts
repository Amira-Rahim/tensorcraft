// These are the supplied checks in retrieve-signals.yaml, not archive captures.
export const RETRIEVAL_EXAMPLE_NOW = Date.parse("2149-06-01T00:00:00Z");
export const RETRIEVAL_EXAMPLE_QUERIES = [
  "what did the array log overnight",
  "anomalous signals in Band-7 from the last 72 hours",
  "signals in Band-3",
] as const;

function row(id: string, band = "7", classification = "anomaly", hoursAgo = 1) {
  return {
    id,
    timestamp: new Date(
      RETRIEVAL_EXAMPLE_NOW - hoursAgo * 3600000,
    ).toISOString(),
    band,
    classification,
    confidence: 0.91,
    amplitude: 1024,
    frequency: classification === "noise" ? 23 : 73.4,
    anomalyScore: 0.8,
  };
}

export function ragRetrievalExample(caseId: string) {
  return caseId === "capped"
    ? Array.from({ length: 40 }, (_, i) => ({
        ...row(`row-${i}`, i % 4 === 3 ? "3" : "7"),
        anomalyScore: ((i * 13) % 40) / 100,
      }))
    : [
        row("wrong-band", "3"),
        row("wrong-class", "7", "noise"),
        row("too-old", "7", "anomaly", 80),
        row("keeper"),
      ];
}
