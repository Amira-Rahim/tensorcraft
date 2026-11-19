/* global self, importScripts, fetch, crypto, TextDecoder */
let running = false;

self.onmessage = async (event) => {
  if (running) return;
  running = true;
  self.postMessage({ type: "loading", stage: "resources" });
  try {
    const epochs = event.data?.epochs ?? 5;
    if (![1, 5, 15].includes(epochs)) {
      throw new Error("Choose 1, 5 or 15 training epochs.");
    }
    if (!self.tf) importScripts("/vendor/tfjs-4.22.0.min.js");
    if (self.tf?.version?.tfjs !== "4.22.0") {
      throw new Error("The expected TensorFlow.js runtime could not load.");
    }
    const { runRoomTraining, ROOM_DATA_SHA256 } =
      await import("/demos/room-training.mjs");
    const response = await fetch("/assignments/room-occupancy-v1/data.json");
    if (!response.ok)
      throw new Error("The room readings could not load. Try again.");
    const bytes = await response.arrayBuffer();
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    )
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
    if (hash !== ROOM_DATA_SHA256) {
      throw new Error(
        "The room data changed. Reload the page before trying again.",
      );
    }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    self.postMessage({ type: "loading", stage: "training" });
    const result = await runRoomTraining(self.tf, data, {
      epochs,
      onEpoch: (progress) =>
        self.postMessage({ type: "progress", ...progress }),
    });
    self.postMessage({ type: "result", result });
  } catch (error) {
    self.postMessage({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "Training could not finish. Try again.",
    });
  } finally {
    running = false;
  }
};
