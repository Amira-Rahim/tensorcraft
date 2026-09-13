// Validates the RAW REPLY TEXT instead of the parsed object. Every field name
// it needs is somewhere in the reply, so every well-formed fixture clears it,
// and it asks nothing about the object it hands back. Feed it a model that
// writes "Reasoning: ..." in a sentence and leaves `reasoning` out of the
// JSON, and it returns an Analysis whose reasoning is undefined, having just
// certified that the field is there. A key count (keys.length !== 3) is the
// other version of the same mistake: both check the shape of the reply
// instead of the names of the fields.
async function analyzeSignal(prompt, apiCall) {
  const response = await apiCall(prompt);
  if (
    !response.includes("classification") ||
    !response.includes("confidence") ||
    !response.includes("reasoning")
  ) {
    throw new Error("Missing required fields");
  }
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");
  return JSON.parse(jsonMatch[0]);
}
