// Audits the TTL and nothing else. currentVersion is accepted and never
// read, so the deploy that fired the pager invalidates nothing: a verdict
// cached five seconds ago by the model that has just been replaced comes
// back marked safe to serve. Freshness was the only rule the broken cache
// knew, and this is that cache shipped again as its own fix.
//
// A four-name lookup table on the entry key passed all five tests until
// 2026-09-08. The suite now reuses keys across cases and audits one batch
// twice under different current versions, so no table on the entry NAME can
// answer it. A table keyed on the whole argument tuple (entries,
// currentVersion, now, ttlSeconds) survived that, because every fixture in
// the suite was a literal. Closed 2026-09-12: the suite's last case builds
// ten entries and their expected buckets in one loop off Date.now(), so the
// tuple reads differently on every run. Measured that day, the tuple table
// returns an empty pair for the generated batch and the case rejects it.
// The audit's other submission, modelVersion compared with < instead of
// !==, IS caught: it serves v2 verdicts after a rollback, and the rollback
// test is there for exactly that.
function auditCache(entries, currentVersion, now, ttlSeconds) {
  const serve = [];
  const refresh = [];
  for (const e of entries) {
    (now - e.cachedAt > ttlSeconds ? refresh : serve).push(e.key);
  }
  return { serve, refresh };
}
