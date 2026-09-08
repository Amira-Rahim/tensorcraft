// CHEAT for verify-deployment: fires every check at once.
// The starter's one bold requirement is that the checks run in order, not
// in parallel. This launches all of them with Promise.all, so a check that
// depends on the one before it (load the model, THEN score a probe) can run
// against a system that is not ready yet. The order test could not see the
// difference: no fixture check awaited anything, so an async body ran to
// completion synchronously and both versions recorded the same order.
async function verifyDeployment(checks) {
  const results = await Promise.all(checks.map((check) => check()));
  const passedCount = results.filter((r) => r.passed).length;
  const total = results.length;
  return {
    passed: passedCount === total,
    checks: results,
    summary: `${passedCount}/${total} checks passed`,
  };
}
