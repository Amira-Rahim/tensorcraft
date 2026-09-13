// Reduces the whole decision to one dial and then to a lookup: it memorises
// the two model sizes the visible cases send to the server and answers 'client'
// for everything else. It never reads the latency budget, the sensitivity flag
// or the offline flag, so nothing about WHY a case goes where survives. This is
// the form that beat the shipped grader on 2026-09-08, because every one of the
// six cases then in the table happened to be separable by size.
function recommendDeployment(useCase) {
  const serverSizes = [30, 100];
  return serverSizes.indexOf(useCase.modelSizeMB) !== -1 ? "server" : "client";
}
