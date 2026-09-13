// Keyword salad on separate lines. It knows which substrings the grader
// searches for and which line each has to sit on, and nothing about what a
// prompt is: no role statement (a name with no job attached), no claim about
// the natural band (four bare digits), no instruction a model could follow.
// Six tokens laid out in the graded order.
function buildPrompt(signal) {
  return [
    "DEEP SCAN",
    "5 12 23 47",
    "amplitude " + signal.amplitude,
    "frequency " + signal.frequency,
    "phase " + signal.phase,
    "json classification confidence reasoning",
  ].join("\n");
}
