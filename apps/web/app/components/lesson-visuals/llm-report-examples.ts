// Supplied callback replies for the report-client exercise, without an LLM call.
export const REPLY_VARIANTS = [
  { classification: "anomaly", confidence: 0.95, reasoning: "High amplitude" },
  {
    classification: "noise",
    confidence: 0,
    reasoning: "No supported anomaly claim",
  },
  {
    classification: "anomaly",
    confidence: "0.95",
    reasoning: "High amplitude",
  },
  { classification: "anomaly", confidence: 0.95 },
  { classification: "alien", confidence: 0.95, reasoning: "High amplitude" },
  { classification: "unknown", confidence: 0.1, reasoning: "   " },
] as const;
export function replyExample(index: number, wrapped = false) {
  const json =
    index === 6 ? '{"classification":' : JSON.stringify(REPLY_VARIANTS[index]);
  return wrapped ? `Supplied reply follows.\n${json}\nEnd of reply.` : json;
}
export function inspectReply(raw: string) {
  const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? null;
  let parsed: Record<string, unknown> | null = null;
  let parseError = "";
  try {
    if (json === null) throw Error("No complete JSON object found");
    parsed = JSON.parse(json);
  } catch {
    parseError = "The located text is not a complete JSON object";
  }
  const checks = [
    {
      field: "classification",
      valid:
        typeof parsed?.classification === "string" &&
        ["noise", "anomaly", "unknown"].includes(parsed.classification),
      rule: "noise, anomaly, or unknown",
    },
    {
      field: "confidence",
      valid:
        typeof parsed?.confidence === "number" &&
        Number.isFinite(parsed.confidence) &&
        parsed.confidence >= 0 &&
        parsed.confidence <= 1,
      rule: "finite number from 0 through 1, including zero",
    },
    {
      field: "reasoning",
      valid:
        typeof parsed?.reasoning === "string" &&
        parsed.reasoning.trim().length > 0,
      rule: "string containing a non-whitespace character",
    },
  ];
  return {
    json,
    parsed,
    parseError,
    checks,
    accepted: !parseError && checks.every((check) => check.valid),
  };
}
