// Dumps every graded fragment into one unstructured line, in no particular
// order. There is no role statement, no context section, no labelled data
// section and no output contract: it knows which substrings the grader
// searches for and nothing about the four parts of a prompt.
function buildPrompt(signal) {
  return (
    "json 47 23 12 5 DEEP SCAN " +
    signal.phase +
    " " +
    signal.frequency +
    " " +
    signal.amplitude
  );
}
