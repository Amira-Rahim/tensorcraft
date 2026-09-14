// Honours only the first name in the caller's order, then falls through the
// lesson's own literal list. Reads the boolean and throws correctly, so it
// looks right, and on the device that asks for wasm first it silently takes
// a GPU context the caller ordered last. Found by the round-7 exercise
// reader (2026-09-13): every fixture then let the first name succeed, so
// this cleared all eight tests. The order test now fails its first rung on
// purpose, and this ladder tries webgl where the caller said webgpu.
async function initBestBackend(preference, runtime) {
  const tryOne = async (name) => {
    try {
      return await runtime.setBackend(name);
    } catch {
      return false;
    }
  };
  if (await tryOne(preference[0])) {
    await runtime.ready();
    return preference[0];
  }
  for (const name of ["webgl", "wasm"]) {
    if (await tryOne(name)) {
      await runtime.ready();
      return name;
    }
  }
  await runtime.ready();
  return runtime.getBackend();
}
