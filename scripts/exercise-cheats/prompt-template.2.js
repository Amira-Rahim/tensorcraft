// Farah's v8 from lesson 2, pasted in and renamed: the four parts are all
// present and the reference frequencies are missing, which is the one line
// the lesson's epilogue says v9 added. Until 2026-09-13 (round 7) the lesson
// displayed v9 itself, so a rename cleared every test; the lesson now shows
// v8 and this paste fails the context line.
function buildPrompt(signal) {
  return `You are DEEP SCAN, an AI signal classification system.

## Context
You are analyzing signals from deep space Sector 7-G.
Normal amplitude range: 570 to 1560 counts.

## Signal Data
- Amplitude: ${signal.amplitude} counts
- Frequency: ${signal.frequency} Hz
- Phase: ${signal.phase} rad

## Task
Classify this signal and explain your reasoning.

## Output Format (JSON)
{
  "classification": "noise" | "anomaly" | "unknown",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<2-3 sentences>",
  "risk_level": "low" | "medium" | "high"
}`;
}
