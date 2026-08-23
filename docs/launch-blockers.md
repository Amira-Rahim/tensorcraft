# Launch blockers

**What must be true before the app can be beta tested with real money from US
buyers, geo-gated, before the LLC exists.** Nothing else belongs in this file.

Everything deferred lives in `docs/post-launch-backlog.md`, tagged with the
benchmark that triggers it. The audit history that produced this list, and the
record of what was fixed, is in
`docs/audits/launch-blockers-history-2026-08-23.md`.

**Deployed 2026-08-23.** API via the `Deploy API` workflow (green, migration
gate passed, Fly secret check passed) and web via Vercel. Verified live rather
than assumed: `/api/health/ready` reports `db: ok`; a live Checkout Session
carries `billing_address_collection: required` while `automatic_tax.enabled`
is false, a combination only the new code produces; and `/terms` and
`/privacy` serve the new governing-law, US-only, retention and disclosure
copy with both stale guest-checkout claims gone.

The **EU/UK geo-gate is verified in production**: DE, GB and FR each answer
403 `region_unavailable` with no Stripe session created. Caveat worth keeping:
that test had to be run against the Fly origin directly, because Cloudflare
overwrites `CF-IPCountry` and a spoofed header never reaches the app through
the edge. That is the gate's security property working, and it also means the
gate is only as strong as the origin lock, which does not exist yet (tracked
in the backlog under security mediums). The webhook billing-country backstop
catches anything that slips through.

---

- [ ] (OPERATOR) **Decide Vercel Hobby: upgrade, or accept the risk in
  writing.** Flagged honestly because it is the one item that does not cleanly
  pass the bar. The app FUNCTIONS on Hobby, so strictly it is not a "cannot
  beta test without". But Hobby prohibits commercial use and you are charging
  $59 to $159, so it is a terms and takedown risk for the duration of the
  beta. It stays here as a decision rather than a task: upgrade, or record the
  acceptance the way the pre-LLC legal exposure was recorded.
