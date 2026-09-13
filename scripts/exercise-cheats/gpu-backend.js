// Calls setBackend and then throws its answer away. This is the submission
// the lesson's `if` exists to stop: it treats "the call did not throw" as
// "the backend is running", so a registered backend that fails to start is
// reported as the one in use. In a browser that is the 0249 dashboard, where
// the page says webgl and every inference runs on the wasm fallback.
//
// It handles the OTHER failure mode correctly, which is what makes it worth
// keeping here: an unregistered name does throw, so the catch moves past it
// and the forgotten-import case comes out right. Half a contract passes half
// the ladder.
async function initBestBackend(preference, runtime) {
  for (const name of preference) {
    try {
      await runtime.setBackend(name);
      await runtime.ready();
      return name;
    } catch {
      // not registered, try the next one
    }
  }
  await runtime.ready();
  return runtime.getBackend();
}
