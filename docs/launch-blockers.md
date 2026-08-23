# Launch blockers

**What must be true before the app can be beta tested with real money from US
buyers, geo-gated, before the LLC exists.** Nothing else belongs in this file.

Everything deferred lives in `docs/post-launch-backlog.md`, tagged with the
benchmark that triggers it. The audit history that produced this list, and the
record of what was fixed, is in
`docs/audits/launch-blockers-history-2026-08-23.md`.

---

- [ ] (OPERATOR) **Deploy the API and the web app.** Everything built on
  2026-08-23 is inert until it ships: the EU/UK geo-gate (so EU and UK buyers
  can still purchase right now), billing-country capture, the purchase receipt
  (so buyers still get nothing after paying), the GitHub token binding fix and
  encryption, the digest fail-closed guard, the Kit timeout, the "Continue M1"
  fix, the no-JS reveal, the a11y live region, and the legal copy corrections.
  The migration ledger is IN SYNC at 60/60, so the `deploy-api.yml` zero-pending
  gate passes.
- [ ] (OPERATOR) **Decide Vercel Hobby: upgrade, or accept the risk in
  writing.** Flagged honestly because it is the one item that does not cleanly
  pass the bar. The app FUNCTIONS on Hobby, so strictly it is not a "cannot
  beta test without". But Hobby prohibits commercial use and you are charging
  $59 to $159, so it is a terms and takedown risk for the duration of the
  beta. It stays here as a decision rather than a task: upgrade, or record the
  acceptance the way the pre-LLC legal exposure was recorded.
