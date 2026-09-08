// Reduces the whole decision to one dial: model size, with the threshold set
// to 30MB because that is the number in the middle of the test table. It never
// reads the latency budget, the sensitivity flag or the offline flag, so it
// gets every case right where size happens to agree with the real reason, and
// it sends a 40MB sensitive-data model to the server, which is the one thing
// the lesson says must stay on the device.
function recommendDeployment(useCase) {
  return useCase.modelSizeMB >= 30 ? "server" : "client";
}
