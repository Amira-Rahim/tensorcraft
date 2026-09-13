# Post-Launch Backlog (canonical)

**This file is the single source of truth for every task deferred to after V1
launch.** Created 2026-07-21 by consolidating `v2-polish-backlog.md`,
`dev-plan.md` §9d/§10d/§10e/§10f, `v2-beat-expansion-plan.md`,
`email-retention-sequences.md`, the growth roadmap task lists
(`roadmap.md` Horizons 1-3), and Claude memory entries.

**Rule:** when postponing any work, add a checkbox line HERE (with its gate and
a link to the detail spec if one exists). Detail specs stay in their own files;
this doc is the index of record. Deferred mentions surviving elsewhere
(`dev-plan.md`, audit ledgers) are historical and non-authoritative.

---

## Benchmarks: when each item becomes real

Added 2026-08-23. Every item below has a TRIGGER, not just an existence. The
reason is concrete: a load-test entry kept surfacing in status recaps as
though it were pending, when nothing about it was due until traffic was being
bought. An item with no trigger reads as permanently overdue, and a list of
permanently overdue items gets skimmed.

Where a benchmark restates a decision the owner already made, it says so. No
new milestones were invented for this.

| Tag | Trigger | Meaning |
|---|---|---|
| **B0** | Deploy day | Do while shipping the current build, or immediately after |
| **B1** | First paying customer | Real money and real customer data now exist |
| **B2** | First real users (beta) | You have people to email, and outages someone notices |
| **B3** | 200 users | World-2 gate: world 1 launched, 200 users, data collected (owner decision 2026-07-25) |
| **B4** | 500 users | LLC formation gate (owner decision 2026-08-23) |
| **B5** | When you buy traffic | Ad spend or a public launch push, not a quiet beta |
| **B6** | When EU/UK sales open | Requires the entity, VAT/OSS registration, and Art. 27 reps |
| **B7** | ~10k users | Scale debt: things that are fine until they are not |
| **B8** | The 100k arc | Only if you decide that is the business (see the honest ceiling) |
| **B9** | No trigger | Opportunistic. Do it when you are already in that file for another reason |

**Items already marked `[x]` carry no benchmark.** They are the record of what
was done and why, kept because the reasoning is what makes the open items
intelligible.

### Where the open items land

**B0, deploy day.** Verify the 059 rename end to end with a signed-in session,
including the check for onboarding answers dropped between 2026-08-18 and
08-20. Settle whether the 046 Custom Access Token hook is enabled.

**B0, found AND FIXED 2026-08-25: `support@tensorcraft.app` could not
receive mail.** Verified by DNS, not inferred: `dig MX tensorcraft.app`
returned zero records, so the domain had no inbound mail path at all. Not a
missing mailbox, a missing mail server. Every message a user sent to that
address bounced, and the bounce went to the SENDER, so the silence looked
exactly like nobody needing help.

**Resolved** by enabling Cloudflare Email Routing, forwarding
`support@tensorcraft.app` to the operator inbox. MX now resolves to
`route1/2/3.mx.cloudflare.net` on the authoritative server and on public
resolvers. Delivery confirmed by test message.

**Send-as CONFIGURED 2026-08-25** through Resend SMTP, so replies leave as
`support@tensorcraft.app` rather than the operator's personal address, which
is what the identity-privacy directive requires. Verified by headers on a test
message: `mailed-by: send.tensorcraft.app`, `signed-by: tensorcraft.app`, so
DKIM aligns to the domain. Both directions of the mailbox now work.

**Still open, small:**

1. **Spam filing.** Forwarded mail from a new domain lands in Spam by default.
   A support address that silently files itself away is the same failure as no
   support address. Needs a mail rule pinning `support@tensorcraft.app` out of
   Spam, plus a label.
2. **Set send-as as the DEFAULT reply address.** A per-message switch that has
   to be remembered is a personal address in a customer's inbox on the first
   day it is forgotten.
3. **Brand casing in the send-as display name.** Set it to `Tensorcraft`. The
   repo uses that spelling 147 times and `TensorCraft` zero times, and all four
   transactional `from` names are `Tensorcraft <...>`. A receipt from one
   spelling and a support reply from another reads as two senders.

**Gotcha for whoever tests this next:** the domain is `tensorcraft.app`.
`tensorcraft.com` is a DIFFERENT owner's parked domain on Google nameservers
with no MX, so test mail sent there bounces and proves nothing. A test round
on 2026-08-25 was lost to exactly that typo.

The address is advertised on surfaces where a bounce is expensive:

- `app/terms/page.tsx:96`, the refund mechanism itself: "Refunds are available
  within 5 days of purchase, no questions asked: email support@tensorcraft.app".
  A customer who cannot reach that address cannot exercise a refund right the
  terms grant them.
- `app/dashboard/purchase-success/pending-poller.tsx:87`, the "I paid and it
  is still pending" mailto, with subject and body prefilled. This is precisely
  the path a buyer takes immediately before opening a card dispute.
- `app/pricing/payment-error.tsx:33`, shown when a payment fails.
- `app/settings/settings-form.tsx:991` and `:1090`, the fallbacks when GDPR
  export or account deletion fail. Deletion requests carry a 30 day legal
  clock that starts when the user sends, not when we notice.

Also `app/about/page.tsx`, `public/llms.txt`, `public/.well-known/ai-plugin.json`.

**Fix, about 5 minutes and free: Cloudflare Email Routing.** The domain is
already on Cloudflare nameservers (`dylan`/`thea.ns.cloudflare.com`), so
enabling Email Routing adds the MX records and forwards
`support@tensorcraft.app` to the operator's personal inbox. Senders only ever
see the brand address, which is what keeps the operator identity private, so
this is strictly better than editing the address out of the UI. No code change
on any of the surfaces above.

Do NOT resolve this by putting a personal address in the app: owner directive
2026-08-25, and it conflicts with the standing identity-privacy rule.

Note `SUPPORT_EMAIL` is set on Fly and its value is unreadable (Fly secrets are
write only). If it also points at an address that cannot receive, operator mail
was silently going nowhere too. `OPERATOR_ALERT_EMAIL` was set 2026-08-25 and
takes precedence, so that path is now correct regardless.

**B0, found 2026-08-24: "Connect GitHub" is a dead button in production.**
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and `GITHUB_CALLBACK_URL` are unset
on Fly, so `POST /api/github/connect` returns a 500 with "GitHub App is not
configured on this server" (`apps/api/src/routes/github.ts:121`). The route
fails honestly rather than crashing, which is why nothing surfaced it. The
problem is that three web surfaces invite the click anyway: the Settings form,
`app/components/github-nudge-toast.tsx`, which actively prompts for it, and
`/about`. A user who follows the nudge gets an error, and the nudge is the
product asking them to.

Either register the GitHub OAuth App and set the three secrets, or hide the
nudge and the Settings control until it exists. Registering is the smaller
job: GitHub, Settings, Developer settings, OAuth Apps, callback
`https://api.tensorcraft.app/api/github/callback`. Note that token encryption
(`GITHUB_TOKEN_ENC_KEY`, set 2026-08-24) protects this column already, so
nothing further is needed on that side once the flow works.

**B1, first paying customer.** **Set up the external uptime monitor and the
Sentry alert rules first, both are free and take 15 minutes together**, exact
steps in `docs/observability.md`. Operator alerts on purchases, refunds and
chargebacks now send themselves over Resend, and synthetic checks run every 6
hours, but neither replaces a monitor polling from outside our own
infrastructure. Optionally set `OPERATOR_ALERT_EMAIL` so those alerts do not land in the
support inbox alongside user mail; both consumers fall back to `SUPPORT_EMAIL`,
which is already deployed, so this is a routing preference and not a gap.
Then: Verify backups and run one restore drill, now
that losing data means losing someone's purchase.
~~Set `GITHUB_TOKEN_ENC_KEY`~~ **DONE 2026-08-24.** Stand up external uptime monitoring:
this is the failure mode that let the API certificate expire unnoticed for
weeks in July. Confirm US home-state sales tax with an advisor.

**B2, first real users.** All four Kit items, starting with the credentials
that currently 401, since nothing else in that chain can work first. Sentry
alert rules. PostHog and Plausible. `API_URL` and `ADMIN_API_KEY` so the
unsubscribe relay stops being inert. `SENTRY_AUTH_TOKEN` so production stack
traces are readable. A virtual business address, which the digest sender now
refuses to send without. The Discord, if you want one.

**B3, 200 users.** Everything in "Data-gated content work" and the world-2
launch sprint. Both were already gated on exactly this number.

**B4, 500 users.** Form the US LLC, then the entity name, postal address and
jurisdiction in terms and privacy, the Art. 27 representatives, controller
identity, the DPAs, and the EAA microenterprise confirmation. Every one of
these is blocked on an entity existing, which is why they cluster.

~~Also here: upgrade Vercel to Pro~~ **DONE, verified 2026-08-24: the team
scope `amira-salahs-projects` is on Pro.** The Hobby commercial-use conflict
is closed rather than accepted, and it is no longer bundled with formation.
GOTCHA for anyone re-checking: the plan lives on the TEAM, so the Vercel API
`/v2/user` reports `hobby` even while the owning team is Pro. Query
`/v2/teams`. Pro also unlocks Log Drains, queryable Observability logs, and
anomaly plus usage Alerts; see `docs/observability.md` Task 5.

**B5, when you buy traffic.** The load test. The success-metrics dashboard.
Product Hunt, the X account, the blog batch, email domain warmup and
Postmaster, cloud-cost alerts, the Upstash plan re-check, and the
indexable-words rendering decision. None of these pay for themselves during a
quiet beta.

**B6, when EU/UK sales open.** TRIGGERED 2026-08-31: the geo-gate is removed
(owner decision), so the rest of this bundle is now due, not deferred: Stripe
Tax setup and the `STRIPE_TAX_ENABLED` flip, non-Union OSS registration,
separate UK VAT registration, and the Stripe invoice half of the receipt.
See the dated Tier 1-LEGAL entry.

**B7, ~10k users.** Section 9, scale debt, unchanged. Plus the API bundling
question from the Fly config entry: transpiling TypeScript at container start
is a startup-latency cost that only matters once cold starts are frequent.

**B9, no trigger.** Supabase query timeouts. The CSP nonce plumbing. The
mobile axe run. Remaining security mediums (waitlist rate limiting, the
`cf-connecting-ip` origin lock). Dropping the counterfactual debris. The
lockfile install command and gating Vercel deploys on CI. Polish, section 4.

### Section defaults

For the original topical sections, the dominant benchmark is: **1** B2 ·
**2** B2 (recurring) · **3** B3 · **4** B9 · **5** B3 · **6** B8 · **7** B7/B9
· **8** B8 · **9** B7. The moved tier sections are mixed and are itemized
above rather than defaulted.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done

Everything in this file is V2 (post-launch). There is no V3 tier; former
"V3+" items are folded into the sections below like everything else.

Status convention (aligned with `docs/audits/launch-blockers-history-2026-08-23.md` at its 2026-08-20
reconcile): `[ ]` is work doable in this repo, `[ ] (OPERATOR)` is work that
cannot be done or verified from a checkout (a third-party dashboard, a
billing plan, a signature, production database state), and `[x]` means
verified against the repo, not "a previous session said so".

Not tracked here (pre-launch, one document): ALL pre-launch work lives in
`docs/audits/launch-blockers-history-2026-08-23.md` - code defects (Tier 1/2), pending operator
migrations (037-040), and the operator + distribution setup moved there
2026-07-22 (Tier 1-OPS). Full findings register:
`docs/audits/full-audit-2026-07-21.md`. (The "91 Dependabot alerts" note in
memory was refuted by that audit: `pnpm audit` clean.)

---

## 1. Operator + external service setup

> **MOVED OUT 2026-07-22:** everything measurement/email/reach-shaped
> (PostHog + event verification, metrics dashboard + alerts, Kit lifecycle
> setup + retention automations, Sentry alerting, Plausible, Google Search
> Console, Product Hunt upcoming page, first blog batch + audience-track
> start; second pass same day: Twitter/X account creation + pricing
> FAQPage JSON-LD) is pre-launch work and now lives in
> `docs/audits/launch-blockers-history-2026-08-23.md` "Tier 1-OPS". Launch-traffic data is
> unrepeatable; those were mis-filed here. Remaining below = genuinely
> post-launch.

- [ ] Search Console reindex request after the next deploy (added
  2026-08-25): the /learn result still serves a pre-rebrand snippet
  (the old "...developer's guide" wording, www host). Inspect `/` and
  `/learn` in GSC and hit Request Indexing so Google picks up the
  rewritten /learn meta description and shows the site name
  "Tensorcraft" instead of the bare domain (signals: WebSite JSON-LD,
  og:site_name, application-name; gated by
  `apps/web/app/layout.test.tsx`).
- [ ] PPP (Purchasing Power Parity) indicator on pricing page.
- [ ] Payment plans (installments): evaluate Klarna/Afterpay.
- [ ] Review prompt at certificate issuance + collect beta quotes: the
  build task that produces the third-party proof the two items below
  consume (`roadmap.md` §2 P3 kept this half when "name the teacher" was
  rejected).
- [ ] Social proof on landing page once real user counts exist.
- [ ] Pricing-page JSON-LD AggregateRating once reviews exist.
- [ ] Testimonials on landing/pricing once real users exist.
- [ ] Compliance polish (audit register §2 P2, triaged 2026-07-22): consent
  granularity/versioning/expiry (CNIL ~6mo); equalize Accept vs
  "Essential only" salience; banner names only PostHog (add Plausible +
  Vercel Analytics); gate Sentry session replay behind consent
  (`replaysOnErrorSampleRate: 1.0` exceeds strictly-necessary); disclose
  the `tc_world` cookie; align the under-16s claim with reality or add an
  age gate.
- [x] ~~14-day refund guarantee badge on pricing cards~~ - already shipped
  (Horizon 0 P3, 2026-07-21: badge exists and was moved above the tier
  grid). Stale item caught 2026-07-22.
- Note: a second stale item ("Sentry integration", claimed console-stub) was
  dropped - Sentry capture is already wired (launch-blockers R2-5); the
  real remaining work is alert rules, tracked in Tier 1-OPS.

## 2. Ongoing operations cadence

- [ ] Weekly metrics review: completion rates, hint dependency, time-on-page,
  conversion.
- [ ] Cohort analysis: performance by difficulty, world, learner background.
- [ ] Content maintenance cycle: monthly review analytics + optimize 2-3
  lessons; quarterly character/narrative consistency audit; biannually full
  curriculum technical-accuracy + bridge-consistency audit.
- [ ] Analytics-driven content QA thresholds: lesson completion beginner ≥75%
  / intermediate ≥60% / advanced ≥45%; exercise pass ≥70% within 3 attempts
  (content review if <50%); hint dependency ≤40% of completions (>60%
  triggers exercise redesign); scroll depth ≥75%; story-skip >40% in any
  module flags narrative redesign.
- [ ] Respond to beta feedback + community Discord questions.
  **Blocked on the Discord existing.** Moved here from
  `docs/audits/launch-blockers-history-2026-08-23.md` 2026-08-23 (owner: postpone until after launch).
  Nothing in `apps/web` references Discord and the site footer carries only
  four links (`apps/web/app/components/site-footer.tsx`). When you want it:
  create the server, channels and rules, then send the invite link and the
  repo half is a footer link plus a snapshot update. It was only ever on the
  launch list because this cadence line assumed a server already existed.
- [ ] Plan V1.0 scope (Deep Orbit Modules 6-11).
- [ ] Re-audit cadence: run the multi-agent quality audit after each major
  content sprint; index audits in `docs/audits/README.md` (index still TODO).
- [ ] Priority/effort pass over this backlog: sections (§4 especially) have
  grown into unordered mixes of 1-line fixes and 20-day features; rank
  within each section (impact × effort) so the index stays navigable
  (added 2026-07-22).
- [ ] Quality-rubric maintenance: extend `docs/quality-rubric.md` before
  shipping any new content pattern.

## 3. Data-gated content work

- [ ] **Re-test `PRICING.single` at $79** (gate: 200 paying users, the same
  threshold as the world-2 gate). Deliberately NOT raised on 2026-08-09 when
  63 scene plates and 16 portraits shipped: art is a quality signal, not a
  scope signal, marginal cost was ~$5, and nobody had paid anything yet, so a
  raise would have stacked a second unvalidated guess on the 2026-06-20 raise
  from $49. Distribution is the binding constraint; a raise tightens it.
  Revisit only on real conversion data. Reasoning:
  `docs/superpowers/specs/2026-08-09-pricing-reevaluation-design.md`.
- [ ] **Restore the bundle surfaces when world 2 launches.** Scope grew on
  2026-08-14 (owner directive, screenshot feedback on /pricing): future
  product plans are not shown to users anywhere, so every user-visible trace
  of the bundle ladder was removed, not just the dead CTAs. Self-healing off
  `LAUNCHED_WORLDS` with no edit: the tier cards, and the JSON-LD offers in
  `apps/web/app/pricing/pricing-jsonld.ts` (gated tiers are now filtered out
  of the catalog entirely; each reappears once enough worlds have launched
  to fill it - a pinned test in `pricing-jsonld.test.tsx` fails at that
  moment as a reminder to walk this list). Manual steps:
  - `BundleRoadmap` ("Listed, not sold." strip) was DELETED, component and
    test; recover from git history before 2026-08-14 if wanted, or decide
    the grown tier grid covers it.
  - `metadata` in `apps/web/app/pricing/page.tsx`: title flattened from
    "From $0 to $159" to "Free Preview, $59 per World"; descriptions dropped
    their bundle clause on 2026-08-09.
  - Pricing hero paragraph dropped "bundle a few, or all five worlds"
    (2026-08-09).
  - FAQ "Is Tensorcraft free?" (`apps/web/app/faq-data.ts`) dropped the
    ship-in-waves and bundle-discount sentences; "Can I learn ML with
    JavaScript?" dropped the CV/NLP-worlds-in-development clause.
  - /compare cost row dropped the all-five price; capstone row dropped
    "four in the pipeline".
- [ ] **BossBeat expansion** (6 ranked beats, one per dormant module).
  Gate: ~100 real lesson completions so placement follows observed drop-off.
  Detail spec + non-negotiable quality gates:
  `docs/v2-beat-expansion-plan.md`.
- **GT LATER cohort** (gate: 1000 users; designs preserved in
  `~/.claude/plans/do-you-think-game-reactive-hennessy.md`):
  - [ ] #2 Team layer (opt-in): teams/team_members/leadership_log + invite
    codes + opt-in public boards (~10-14d).
  - [ ] #10 Shared team bandit (hard dep on #2, ~5-7d).
  - [ ] #4 Adversarial pair mode: Realtime split-screen Sandpack (~14-20d).
  - [ ] #7 Mentor ghost mode: anonymous decision-distribution overlay
    (~8-12d).
  - [ ] #14 Capstone auction (Vickrey; needs auction lesson first, ~14-18d).
  - [ ] #8 Trade-the-bridge gifting (~3-5d).
  - [ ] #9 Public capstone gallery at /gallery (~5-8d).
- **GT items deferred within the NOW cohort:**
  - [ ] #5 Branching quizzes (high authoring tax, ~14-20d full curriculum).
  - [ ] #12 Reputation currency (SP cosmetic only; re-evaluate when LATER
    opens).
  - [ ] #17 Branching world epilogues (~6-8d).
  - [ ] #16 Voice-actor character cards ($$$$ recurring; defer).
  - [ ] #18 Character-perspective re-render (3-4x MDX cost; defer).

## 4. Polish (editorial, models, features)

- [ ] **Module map design passes (2026-08-29 audit, deferred).** The four
  defect fixes from the audit shipped same day (mobile teaser overlap,
  Start-vs-Continue CTA, header stats modes, price-once locked rows, crew
  strip hidden when the trailer band renders). Deferred design work, in
  priority order:
  1. Make the map read as a route: the connector between module rows is a
     1x8px sliver nobody sees. A continuous full-height spine with waypoint
     nodes, filled to the learner's position, would encode "you are here,
     this far to a deployed model". Keep it a neutral border-token hairline
     with nodes, structural like the pane dividers; the left accent bar ban
     still applies to colored edges glued to cards.
  2. Type hierarchy in the list: module titles (14px) match lesson titles
     and sit 2px above their descriptions, while the 16px lesson ordinal is
     the largest type in each card. One step up for module titles, ordinals
     demoted to muted 12px.
  3. Trailer resting affordance: the only play cue is a 12px mono caption
     on a 900px poster. A centered play glyph on hover/focus keeps the
     restraint. Decide with WORLD_TRAILER_PLAYED data.
  4. Mobile: lesson titles truncate at 390px (56px ordinal panel + chevron
     leave ~200px). Consider dropping the ordinal panel or the chevron on
     small screens.
- [ ] **/learn v5 video-first (2026-08-27), supersedes the v4 store page.**
  The owner's Flow/Veo trailer (72s, Epidemic "ES_Slipping" bed) shipped
  to `public/media/learn-trailer*`; the page is now trailer hero ->
  crew line -> close CTAs. Video SEO: VideoObject JSON-LD + sitemap
  `videos` entry. Store-page components deleted (git history keeps
  them). 2026-08-31 (owner request): the collapsible "About this video"
  transcript block was removed too, so the H1 + two intro paragraphs are
  the page's whole indexable text layer now. Watch GSC after deploy: the
  owner accepted the thin-content tradeoff twice; the previously
  documented lever ("expand the transcript block") no longer exists, so
  if the "javascript machine learning" cluster slips, bring the owner
  options rather than restoring removed sections unprompted.
  Original v4 record follows for history:
- [x] **/learn v4 trailer + store page (2026-08-25).** Owner rulings: the
  page video is a produced movie trailer in game-trailer grammar (title
  cards + licensed music, no voiceover), and /learn is rebuilt in
  store-page grammar: trailer hero (asset-gated: `trailer-hero.tsx` mounts
  only when `public/media/learn-trailer.mp4` exists; hero loop fetches
  after interaction/idle so it never enters the Lighthouse trace),
  screenshots strip from shipped scene art (`screenshot-strip.tsx`, thumbs
  via `scripts/marketing/make-learn-shots.mjs`), About + the one public
  bridge, Play-the-demo band, the module-map contents, crew interlude,
  requirements box, coming-soon strip, FAQ. Trailer pipeline at
  `scripts/marketing/tour-video/` (spec.yaml storyboard, local sharp title
  cards, Runway gen4.5 beats, review gate, ffmpeg assemble; verified API
  facts and costs in the spec comments, ~$10-25 one-time).
  **Owner-gated to finish the trailer:** `brew install ffmpeg`; Runway dev
  credits (`RUNWAYML_API_SECRET` in .env.art); licensed music file in
  `art-src/tour-video/music/`; re-run
  `scripts/marketing/capture-lesson-walkthrough.mjs` and re-time the
  capture trim windows in spec.yaml; then generate -> review/approve ->
  assemble. Analytics: `learn_trailer_played` (loop/full) +
  `free_lesson_cta_clicked` (learn_hero / learn_start_free /
  learn_footer). Three older follow-ups:
  1. **Phase 2 video band.** `scripts/marketing/capture-lesson-walkthrough.mjs`
     records a walkthrough of the free first lesson (Playwright `recordVideo`,
     webm + poster into `apps/web/public/media/`). Owner reviews the cut, then
     the "Watch a lesson" band lands on /learn as a native
     `<video preload="none" poster controls>` (click-to-play, zero bytes
     against the audited load) and the /learn visual baselines are re-minted.
     An externally produced video can replace the file at the same path later.
  2. **Adopt `FreeLessonCtaTracker` beyond /learn.** The landing hero, landing
     final CTA, bridge-preview section, and /pricing footer all link the free
     lesson untracked. Wrap them in
     `apps/web/app/components/free-lesson-cta-tracker.tsx` and widen the
     event's `source` union in `apps/web/lib/analytics-events.ts` as surfaces
     adopt it.
  3. [ ] (OPERATOR) **Request GSC re-indexing of /learn after the redesign
     deploys** (Search Console URL inspection, "Request indexing"). Already
     queued as an open operator leftover in
     `docs/audits/content-editorial-audit-2026-08-19.md`; the redesign makes
     it urgent enough to track here. Watch the "javascript machine learning"
     cluster position afterward.
  4. **World-page trailer band (LIVE 2026-08-29, assets shipped).**
     `/worlds/deep-orbit` gained a click-to-play trailer band for
     prospects (`world-trailer-panel.tsx`; purchasers see no marketing,
     prospects with progress get it below the map). Final assets shipped:
     `public/media/deep-orbit-trailer.mp4` (88s, 23.4MB, CRF 20 faststart
     re-encode of the owner's cut) + `-poster.webp` (crew-walk frame,
     71KB). Resolver: `apps/web/lib/world-trailer.ts`; bump its
     `uploadDate`/duration if the film is ever replaced. Placement note:
     the band mounts BELOW the crew strip, not above it; above, it pushed
     the tc-on-art header/cast off the backdrop plate and their dark veil
     failed AA on the light scheme (269 axe hits). Baselines reminted +
     verified, axe green both schemes, worlds/reflow/mobile e2e green.
     Follow-up: move BOTH trailer mp4s (learn ~46MB, world 23.4MB) out of
     `public/` to Vercel Blob or a CDN bucket; committed video doubles
     repo weight and egress rides every watch. Only a URL swap in
     `world-trailer.ts`/`trailer-hero.tsx` is needed.

- [ ] **Pre-lesson copy audit: open rulings (2026-08-19).** The audit at
  `docs/audits/prelesson-copy-audit-2026-08-19.md` applied all 54 FIX and
  3 CUT items the same day. Six groups were deliberately left alone
  because they conflict with copy the owner authored or approved, and
  each needs a ruling before anyone edits it:
  1. ~~The five "Where X ..." world taglines.~~ **RULED 2026-08-20:
     KEEP, unchanged.** Owner decision; do not reopen.
  2. **PARTLY RULED 2026-08-20.** Coming-soon pages keep their story
     copy (status boards, plot-paragraph heroes, capstone system names,
     character dossiers): they exist to sell story worlds. Already
     fixed on 2026-08-20: the waitlist buttons now say "Join the
     waitlist", and the meta description + JSON-LD state what the
     course is. STILL OPEN, one item: the renamed syllabus headings
     ("The 11 Sectors", "5 Protocols per Sector") are the one place
     these pages state their actual shape, so renaming them to modules
     and lessons costs little story and buys the most clarity. Owner
     call.
  3. ~~/paywall's "Module 1 is done" premise.~~ **WITHDRAWN 2026-08-20:
     the finding was wrong.** /paywall is `robots: noindex, nofollow`
     and every link into it is authenticated and gated on having
     finished the free module, so the premise is true for everyone who
     can reach it. Becomes live again only if /paywall is ever used as
     a public campaign destination.
  4. ~~"ship in waves"~~ **DONE 2026-08-20**: replaced with the literal
     "no release dates yet" on all three surfaces.
  5. The sr-only keyword h2 on the landing page and the keyword list in
     the sitewide metadata: SEO-driven by design, heard as copy by
     screen-reader users.
  6. ~~Legal enumerations naming product surfaces.~~ **DONE
     2026-08-20**: /terms defines a world at first use; /privacy spells
     out streaks and glosses arena challenges. Snapshots updated.
  7. ~~Module descriptions.~~ **DONE 2026-08-20** via the recommended
     option: a required plain-language `summary` field on every
     built-world module, rendered by the module map and the /pricing
     curriculum preview, with the story `description` untouched for
     in-course use. Gated by
     `packages/content/__tests__/module-summary-prelesson.test.ts`.
  Also outstanding, operator-side: the Kit email subject lines ("Your
  Tensorcraft week.", "You shipped {world}.") live in the Kit dashboard,
  outside this repo.

- [ ] **Dashboard per-panel progressive disclosure (considered, not built,
  2026-08-16).** The first-run mission dispatch covers zero-activity
  accounts only; an account with one completed lesson gets the full
  dashboard back, zeroed panels included (heatmap with one cell, 0/N
  bridges, empty patch slots). Per-panel gating (each instrument hidden
  until it has data) was the alternative the owner passed on; the
  boundary is recorded in
  `docs/superpowers/specs/2026-08-16-first-run-dashboard-design.md`.
  Revisit if early-account retention data shows the near-empty full
  dashboard hurts.
- [ ] **DISPATCH inbox, removed 2026-08-14 (owner call: not needed now).**
  Deleted: `/inbox` route + `inbox-view`, `lib/dispatch-client.ts`, the
  Inbox nav links + unread badge (both navs), the web and API milestone
  producer hooks, and `apps/api` `routes/dispatch.ts` + `lib/dispatch.ts`.
  Kept: the `DispatchTease` capstone story block (renders in-lesson, links
  to the next world, never depended on the inbox) and the DB layer:
  `dispatch_messages` plus its RPCs (migrations 029/036/039) stay applied
  in prod with pre-removal rows, and the account-erasure table list still
  covers the table. Restore path: revert the 2026-08-14 removal commit;
  the producer dedups by subject, so missed milestones refire on the next
  completion in the same module. If the removal becomes permanent, ship a
  drop migration for the table + RPCs (operator step, destroys user rows).
- [x] **Em-dash sweep, repo-wide - DONE 2026-08-15** (same day the owner's
  blanket U+2014 ban landed at the top of `CLAUDE.md`; this item was
  originally the 2026-08-12 slop-audit sweep of dev-facing code comments
  only). 3,692 literal em dashes removed across ~310 tracked files: internal
  docs, code comments, SQL migration comments (version-tracked, not
  content-hashed, so safe), scripts, config, and `llms.txt`.
  Behavior-bearing detector code now uses escape forms instead of the glyph:
  the slop-lexicon regex, quiz.tsx's "- correct" suffix stripper, three
  `not.toContain` guards, and the signal-ward text-cleaning lesson (its
  `&mdash;` example now normalizes to a plain hyphen, matching the lesson's
  own smart-quotes-to-ASCII arc). Zero-hit state is CI-enforced by
  `packages/content/__tests__/em-dash-ban.test.ts` (runs in the plain
  `pnpm test` job). Verified: unit battery 190 files green, typecheck 10/10.
  Follow-up RESOLVED same day: `pnpm format:check` had been failing on 484
  files of pre-existing drift. Root cause was scope, not style: prettier was
  scanning the authored content corpus (275 lesson MDX + 183 exercise
  yamls, where its rewrap would reflow dialogue and defeat the line-based
  slop gate), velite build output, and the vendored minified tfjs bundle.
  `.prettierignore` now excludes those three (see its comments), the ~20
  genuinely unformatted code files (scripts/, probe.mjs, supabase client.ts,
  web tsconfig) were formatted, lint-staged gained `js,mjs` coverage, and CI
  gained a "Format check" step in the test job.
- [ ] **sequence-models/01 (signal-ward) order-vs-word coherence bug**: the
  lesson claims "same words, different order" for an example pair that
  differs by a word ("denied" vs "reported"); its own BoW vectors differ.
  Load-bearing for the quiz framing; needs a content rewrite when the
  signal-ward launch sprint runs (see `docs/audits/ai-slop-audit-2026-08-12.md`).

- [ ] **Light-mode follow-ups** (deferred from the 2026-07-23 rollout; context
  in `docs/dev-plan.md` 2026-07-23 entry + `docs/superpowers/plans/2026-07-22-light-mode.md`):
  - [ ] Scheme toggle inside the lesson viewer (lesson pages are chromeless -
    no site nav - so today learners flip scheme from other pages or the OS;
    candidate spot: the lesson ChromeBar).
  - [ ] Scheme toggle inside the open mobile-nav drawer (overlay covers the
    top bar while open; duplicate the toggle next to the drawer's close button).
  - [ ] One-time Windows/Linux visual check of the nav toggle glyphs
    (◐ U+25D0 has no production precedent and sits outside the latin font
    subset; tofu risk on non-mac platforms).
  - [ ] `Ticker`/`TickerCanvas` appears to be dead code (no live importer,
    only a stale layout.test mock) - confirm and delete or re-mount.
  - [ ] Tighten `SceneCanvas`'s `rgbLight` from optional-with-fallback to a
    required dark/light tuple once all call sites are stable (a new consumer
    can currently omit it and silently render dark-only hues in light).
  - [ ] Optional: scope `transition-colors`/`transition-all` utilities to
    hover/focus states so the scheme flip is perfectly uniform (today ~186
    small chrome elements ease 150ms while surfaces snap - assessed fine).
  - [ ] Optional: client-sync `meta[name=world-color]` when the user's manual
    override disagrees with the OS (browser chrome color mismatch, cosmetic).

- [ ] **Story-voice Phase 4 spot-check editorial pass** (~3.5h): dump 702
  dialogue blocks, spot-check top 5 speakers against `docs/voice-guide.md`,
  edit ~20 outliers per character, re-run velite + build.
- [ ] **Studio-one VAE real-data retraining** (~3h): tiny CelebA subset fixes
  posterior collapse; architecture unchanged.
- [ ] **Capstone real-data retraining, all 5 worlds** (~10h total): Deep
  Orbit DEEP SCAN (LIGO / Kaggle audio anomaly), Neon SENTINEL (CIFAR-10),
  Signal DIAGNOSTIC-ONE (MIMIC-III + ClinicalBERT), Nova STUDIO-ONE (CelebA),
  Terra METEOR (ERCOT).
- **Slice C leftovers (game-theory spine):**
  - [ ] SHAP cross-link in `<StrategyThread>`: the SHAP lesson
    (extras/ethics-responsibility/03-model-interpretability) was removed
    with /extras on 2026-08-15 (see §"/extras removal" below). Doing this
    now means restoring the lesson from commit `0b5ec6d` and placing it in
    a launched world.
  - [ ] Auction lesson (Terra Grid, Vickrey; JS-to-ML bridge: CSS specificity wars).
  - [ ] Stackelberg reframe of adversarial patches (Neon Protocol).
  - [ ] RLHF preference-learning reframe (Signal Ward).
  - [ ] Email nudge for streak-at-risk (Resend template + cron at
    `last_lesson_completed_at + 24h` when streak ≥3 and `email_alerts`).
  - [ ] PWA / push notifications (no manifest.json / service worker today).
  - [ ] Capstone leaderboard (opt-in, Kaggle-style holdout; needs hosting +
    cheating mitigations).
  - [ ] Commitment device at checkout (finish-by date, opt-in nudges).
  - [ ] Cohort starts (synchronized start dates, world-mate pairing).
  - [ ] Thompson-sampling scheduler upgrade (after a Bayesian intuition
    lesson exists; keeps self-reference parity).
- [ ] **Tensorcraft Pulse** (content freshness via scraping): /pulse feed +
  in-lesson `<Currents>` + /admin/signals. ~$5/mo, ~3-5d. Plan:
  `docs/superpowers/plans/2026-05-03-tensorcraft-pulse.md` (status DEFERRED;
  reactivate by flipping plan header + plan-document-reviewer + Task 0.1).
- [ ] Capstone v2 with multi-model ensembles.
- **Character personas follow-ups** (avatars shipped 2026-06-15 as monogram /
  AI-glyph placeholders via `CharacterAvatar`; bible + prompts:
  `docs/character-bible.md`):
  - [x] **Character animation stream** (SHIPPED 2026-08-05): expression
    crossfade + entrance + talking scanline via `AnimatedAvatar`, ARIA as a
    live procedural waveform (`AriaWaveformAvatar` on SceneCanvas, 4 states),
    `expression="..."` Dialogue annotations gated by
    `packages/content/src/expressions.test.ts` against the manifest
    `expressions` field. Motion rules recorded in `docs/ui-ux-notes.md` 5.3.
    Also shipped art-agnostic **scene portrait slots** (`ScenePortrait`,
    Briefing establishing shot as a playback beat + the 7 epilogue variants;
    paths `public/scenes/<world>/<module>/<lesson>[-epilogue].webp`, alt from
    `scene.portraitAlt` / `scene.epiloguePortraitAlt` frontmatter).
  - [x] **Real cel-shaded art, Deep Orbit** (SHIPPED 2026-08-09): all 20
    portraits (5 characters x neutral + 3 expressions, ARIA included as an
    abstract voice-orb glyph)
    live at `apps/web/public/characters/deep-orbit/`, 22-31 KB each. Made
    with FLUX.2 [pro] via fal.ai through `scripts/art/generate.mjs` +
    `scripts/art/ingest.mjs`; approved canons kept as regeneration anchors
    in `docs/art-refs/deep-orbit/`. Gates 0/A/B cleared; production log and
    the prompt rules the gates taught (age markers, framing, no-text) are in
    `docs/character-bible.md`. Other worlds remain gated on world launch.
  - [x] **Scene portrait art** (SHIPPED 2026-08-09): all 63 scenes (56
    briefings + 7 epilogues) live at `apps/web/public/scenes/deep-orbit/`,
    median 116 KB webp. Four approved location master plates at
    `docs/art-refs/deep-orbit/masters/` are the reference for every scene, so
    each set stays itself across the corpus. Alt text is in lesson
    frontmatter. Gates C and D cleared; `docs/scene-bible.md` holds the
    entries, the production log and the prompt rules the gates taught.
  - [ ] **Decide the location-plate canon** (found 2026-09-04 by
    pixel-matching): the shipped
    `apps/web/public/locations/deep-orbit/{bridge,engineering,lab}.webp`
    derive from the newer `art-src/masters` candidates, not from the
    committed `docs/art-refs/deep-orbit/masters/` anchors that every scene
    and the lesson-video prompts use as their reference (`ingest.mjs`
    `newest()` sorts candidates by name, so a re-run keeps shipping the
    newer ones). Either promote the shipped renders to the anchors or
    re-ingest the plates from the anchors; until then the app's bridge and
    the Veo ingredient are different renders of the same room.
  - [x] Content pass annotating `expression="..."` on high-value Dialogue
    blocks (SHIPPED 2026-08-15): 45 annotations across the 176-tag corpus
    (~1 in 4; sparse by rule), stage direction as the primary signal. The
    gate now also pins that at least one annotation exists, so a stripping
    sweep fails loudly.
  - [x] **Art expansion spine** (SHIPPED 2026-08-15, spec
    `docs/superpowers/specs/2026-08-15-art-expansion-spine-design.md`):
    the three orphaned location plates wired (`surfacePlateSrc`: dashboard
    sidebar station feed, auth left-pane ground + scrim, purchase-success
    confirmed state); learner avatar on the certificate share page
    (initials monogram fallback); OG cards composite the world's hero
    plate (`ingest.mjs og` emits JPEG derivatives - satori does not decode
    WebP dependably) with a `cert` kind for certificate shares; **11
    mission patches + world seal** (`docs/patch-bible.md`, `ModulePatch`
    earned-only on dashboard/module map/capstone/certificate, all-or-none
    coverage gate in `packages/content`). Canons in
    `docs/art-refs/deep-orbit/patches/`. Generation ~$1 FLUX.2 [pro].
  - [x] **Art round 2** (SHIPPED 2026-08-15, spec
    `docs/superpowers/specs/2026-08-15-art-round-2-design.md`): onboarding
    Ready step grounds on the bridge plate (ArtPlate gained the `fallback`
    prop so the ◎ glyph returns on failure); /worlds hero card takes the
    plate-under-canvas composite with the five-worlds `tc-art-scrim` +
    `tc-on-art` treatment (a bg-colored scrim failed light scheme at
    review); dashboard `PatchCollection` panel (earned patches at 48px,
    dashed slots for unearned launched modules); new auxiliary `adrift`
    master on the 404 and route-error pages.
  - [x] **Module-complete award moment** (SHIPPED 2026-08-15, spec
    `docs/superpowers/specs/2026-08-15-patch-award-moment-design.md`): the
    Consequence step reveals the module's mission patch the session its
    last remaining lesson completes. No new queries: a pure
    `completesModule` predicate merges the server-truth `lessons` prop
    with local guest records inside the completion effect's
    `enteredThisSession` guard (R3-7), so restored mounts never re-award
    and free-module guests get the moment too. Eyebrow uses
    `terms(world).module` ("SECTOR COMPLETE" on deep-orbit). E2e covers
    the guest path end to end.
  - [ ] The other 20 character sheets (Neon / Signal / Nova / Terra) +
    world wiring + their scene art: gated on those worlds launching (see §5).
- **Audit-parked UX + a11y** (flagged "parked on post-launch backlog" in
  `pre-launch-checklist.md` Rounds 11-12 but never filed until 2026-07-22;
  a third item, "HintPanel coverage 3/56", was dropped as stale - Run #7
  regenerated 77 hint ladders on 2026-07-16):
  - [ ] Sandpack offline fallback for the exercise editor.
  - [ ] Arrow-key support in exercises.
  - [ ] Touch-target sweep to ≥44×44 (per `docs/audits/accessibility-audit-2026-04-20.md`;
    verify current state first - the 2026-07-15 per-step axe gates do not
    check target size).
  - [ ] User-menu focus trap + focus restoration.
  - [ ] A11y medium/low sweep (audit register §5, triaged 2026-07-22):
    tell keyboard users Escape exits the editor (Tab indents); make the
    screenshot dropzone keyboard-operable; `tabIndex={0}` on overflowing
    code blocks; announce step *completion* in the step bar (visited state
    is colour-only, `title` swallowed by `aria-label`); `role="alert"` +
    `aria-invalid`/`aria-describedby` on auth errors (`aria-invalid`
    appears zero times in the codebase); onboarding `<main>`; fix
    `role="tabpanel"` placed on `<main>` in settings; label the second
    `<nav>`s; real arrow-key/Escape handling for `role="menu"` in
    user-menu; stop hiding "Best Value"/"Available Now" behind
    `aria-hidden`; enlarge the 15.5s-scene Skip control; 15px/12px inputs
    to ≥16px (iOS zoom); report-issue panel clips at `left:-60px` @320px.
- [ ] DISPATCH milestone producer uses strict `=== count` and silently
  stops firing when orphan/renamed lesson rows overshoot the count -
  the board-clear payoff never arrives. Use `>=` like
  `certificates.ts:137`.
- [ ] DISPATCH weekly-intel cron: the milestone producer shipped 2026-07-13
  but the *weekly* push (#13's premise) has no scheduler - pick pg_cron or
  a Vercel Scheduled Function (explicitly deferred in
  `docs/gt-narrative-polish-checklist.md`, never filed until 2026-07-22).
  Same for the dispatch-messages email mirror via Resend.
- [ ] Counterfactual data layer: migration 031 + `counterfactual-client.ts`
  still collect choices but the `/log/rewind` surface was cut 2026-06-01 -
  data accrues that nothing reads. Build a surface (#3's payoff) or stop
  collecting; GDPR minimization argues against hoarding it
  (added 2026-07-22).
- [ ] Reconcile `docs/gt-narrative-polish-checklist.md` open items against
  Runs 6-8 - verify what's done, fold survivors here, mark the checklist
  historical.
- [ ] Verify R0-R4 structural-variety closure: the
  copy-humanization-reaudit plan (2026-06-10) was likely absorbed by Run 7
  cadence work + Run 8 endorsement, but never formally ticked off. Check
  `docs/audits/copy-humanization-reaudit-2026-06-10.md`; fold any
  survivors here.
- **Low leverage, skip-flagged unless metrics argue otherwise:**
  - [ ] Bridge per-framework variants (Vue/Angular/Svelte, ~5h).
  - [ ] Quiz coverage expansion past current 24% (diminishing returns).

## 5. World launch sprints (V1 = Deep Orbit only)

- [ ] Neon Protocol, Signal Ward, Nova Canvas, Terra Grid: full curriculum
  content per world (each its own launch sprint; scope doc:
  `docs/launch-scope.md`).
- [ ] Per-world GT narrative launch content (DISPATCH, boss beats, cameos)
  for each new world, outlined in the GT plan file.
- [ ] World-specific glossary terms for unlaunched worlds.
- [ ] Per-world Kit purchase sequences (5x `KIT_TAG_PURCHASED_{WORLD}` + 5
  sequences) if per-world email marketing becomes worth it.
- **World-2 launch prerequisites** (dormant until a second world sells):
  - [ ] **Restore /journey.** Removed 2026-08-15 (owner decision): with one
    live world the page rendered near-identical content to /worlds, so the
    catalog is the single five-worlds surface until the arc framing has two
    live worlds to show. Restore from commit `152f2c8`:
    - `apps/web/app/journey/` (page.tsx, journey-ring.tsx + test, error.tsx)
      and `apps/web/lib/journey-progress.ts` + its test. The shared journey
      model (`packages/shared/src/journey.ts`) was NOT removed; it still
      feeds dispatch-tease and strategy-thread.
    - Drop the temporary `/journey` → `/worlds` redirect in
      `apps/web/next.config.ts` (deliberately 307, safe to remove).
    - Re-add nav links (nav.tsx + mobile-nav.tsx), the sitemap entry, and
      the "Journey" row in the `e2e/accessibility.spec.ts` axe matrix.
    - Comments trimmed at removal (scene-by-slug.ts, world-cards-grid.tsx,
      entitlements.ts) can regain their journey-ring mentions.
    - Carried-over open item: the page metadata sold the finale-handoff arc
      but the on-page copy never did; write that pitch into the page at
      restore time or it converges with /worlds again. Design spec:
      `docs/superpowers/specs/2026-08-15-journey-ring-redesign.md`.
    - `journey_enrollment` stays in the schema; its `completed_at` writer
      lived in journey/page.tsx, so nothing records ring completion while
      the route is gone (harmless: the ring cannot close before all five
      worlds are live).
  - [ ] Purchase credit survives refund/dispute: upgrade pricing sums
    `partially_refunded` rows, so a disputed purchase still funds the
    bundle discount. Unreachable with one world; live the day world #2
    launches.
  - [ ] neon-protocol has 54 MDX files vs the 55 that
    `WORLD_CONTENT.comingSoonLessonsPerWorld` promises (`image-data` has
    4); add a test pinning coming-soon counts.
  - [ ] ~~PCA/SVD deep-dive~~ shipped early 2026-07-27 as shared
    `extras/math-deep-dive/08-eigenvectors-svd-compression`, then removed
    2026-08-15 with /extras (see §"/extras removal" below). The world-2
    slice is back to real authoring: when neon-protocol's
    feature-extraction module launches, restore the deep-dive from commit
    `0b5ec6d` into that world (the DerivationDrawer companion-link feature
    was also removed and would need rebuilding, or inline the derivation).

## 6. Big deferred bets

- [ ] **AI video scenes**: ACTIVATED for Deep Orbit 2026-08-31 (owner).
  Paste-ready Flow/Veo prompts for all 63 scenes (56 lessons + 7
  epilogues): `docs/video-scene-prompts-deep-orbit.md`. Integration design
  (`<VideoScene>` swap, captions, R2 CDN) still lives in
  `docs/future-ai-video-scenes.md`; its Runway/ElevenLabs generation stage
  and cost table are superseded. Remaining work tracked in the dated
  "Lesson video scenes follow-ups (2026-08-31)" section at the end of this
  file. Subsumes audio narration (video includes voice acting).
- [ ] **Audio narration fallback** (only if video stays too expensive):
  AI TTS, narrative steps only (Briefing + Consequence), one world first,
  auto-regeneration from MDX. Standalone narration was rejected for V1:
  interactive-first lesson model conflicts with passive audio, ~1,650
  segments to maintain, re-record on every MDX edit, >40% story-skip risk.
- [ ] **Team pricing** (design from enterprise demand data).
- [ ] **Team license management** (admin dashboard, seat assignment, progress
  reports).

## 7. Platform + infra deferrals

- [ ] **Web performance work + restore aspirational Lighthouse budgets.**
  Deferred 2026-08-24. The Lighthouse CI budgets had never passed (red
  since at least 2026-07-25), so they were ratcheted to that night's
  worst measurement plus ~25% headroom to turn the job into a working
  regression gate: interactive 14000ms, LCP 11500ms, CLS 0.35, script
  800KB, total 1150KB (`.github/lighthouse-budget.json`). Measured
  2026-08-24 on the throttled CI runner (simulated slow 4G, 4x CPU):
  `/` TTI 11.3s, LCP 9.1s, script 624KB, total 898KB, perf score 0.44;
  `/pricing` CLS 0.247 (the only page with real layout shift), TTI 5.1s;
  `/worlds` TTI 10.9s; `/learn` TTI 4.1s, perf 0.84. Accessibility,
  best-practices, and SEO all sit at 0.91-1.0 already. The perf work,
  when it becomes worth doing: landing-page script diet (624KB is the
  outlier; the other pages are ~370KB), the /pricing layout shift, then
  walk the budgets back down toward the old aspirational values (LCP
  2500, TTI 3500, CLS 0.1, script 500KB). Also removed then: the dead
  `assert` block in `.github/lighthouserc.json`; when the workflow
  passes `budgetPath`, the treosh action asserts only from the budget
  file, so those category minScores never fired (verified against the
  2026-07-25 and 2026-08-24 run logs, both of which would have failed
  `categories:performance >= 0.9`).

- [ ] **Drop the counterfactual debris.** Deferred from
  `docs/audits/launch-blockers-history-2026-08-23.md` 2026-08-23: the table is empty and harmless, and
  a pending migration blocks the API deploy gate, so this waits until the
  launch deploy is out. The feature's client was deleted in 24d45e4;
  `counterfactual_choices` was verified at **0 rows** in production on
  2026-08-23. When you do it, in one transaction-wrapped migration:

  ```sql
  -- Drop by ARGUMENT TYPES, not parameter names: 058 renamed the params
  -- (p_theme_id to p_world_id) but function identity is name + arg types.
  drop function if exists public.record_counterfactual(text, text, text, int, int);
  drop function if exists public.get_counterfactual(text);
  drop table if exists public.counterfactual_choices cascade;
  ```

  Then remove `"counterfactual_choices"` from the export table list in
  `apps/api/src/routes/profiles.ts` and regenerate
  `packages/supabase/src/types.ts` from the live database. Ship the code
  change with or before the migration, or the GDPR export queries a table
  that no longer exists.


- [ ] **Remove the two one-release API shims from migration 059.** Added
  2026-08-18 so an old client could not break against the renamed columns,
  and deliberately scoped to a single release. Both are still deployed
  (Fly v18, 2026-08-20): `apps/api/src/routes/onboarding.ts` maps
  `fe_background` / `fe_experience_years` onto their `js_*` names when the
  new keys are absent, and `apps/api/src/routes/skill-events.ts` rewrites
  an incoming `fe_integration` axis to `js_integration`. Earliest safe
  removal is roughly 2026-08-27, one release after the migration landed;
  taking them out sooner defeats the purpose they were added for. Delete
  both blocks plus their tests, then redeploy the API. No migration and no
  web change. Filed here rather than in `docs/audits/launch-blockers-history-2026-08-23.md` because it is
  post-deploy cleanup, not a release gate: leaving the shims in place is
  harmless, only untidy.

- [ ] Visual gate is blind to the entire landing hero (found 2026-08-22
  while re-minting baselines after a hero subhead rewrite). Both
  `e2e/visual/key-pages.spec.ts` and `e2e/visual/responsive.spec.ts`
  mask `page.locator("canvas")`. On `/` the first match is the hero's
  ParticleField, which is `absolute inset-0` inside a `min-h-screen`
  section, so the magenta mask covers the headline, subhead, both CTAs,
  and the demo panel. Measured on the freshly minted
  `landing-1440-chromium-darwin.png`, the hero band is 100% magenta.
  What proves the gate cannot see hero copy: rewriting the subhead from
  four rendered lines down to three left 5 of the 6 landing baselines
  byte-identical to HEAD. Only `landing-320` moved, and only because the
  total page height changed. This is the same failure the responsive
  spec's own comment records for /pricing's AmbientBackground on
  2026-08-09; the landing page was never re-checked. The mask is not
  simply removable: ParticleField seeds particle positions with
  `Math.random()` (`packages/ui/src/effects/particle-field.tsx:38-43`),
  so even its reduced-motion static frame differs between runs. Fix
  shape: hide ParticleField at capture time in
  `e2e/visual/screenshot.css` (that file already exists, for the
  dev-overlay badge) and narrow the mask to the world-card canvases,
  then re-mint the landing baselines.

- [ ] Privacy deferrals from the 2026-08-16 policy audit
  (`docs/audits/privacy-policy-audit-2026-08-16.md`; the shipped fixes
  are listed there too):
  - OWNER: /privacy §1 names "Tensorcraft" as controller with no legal
    identity behind it (owner removed the placeholder 2026-08-16,
    entity/name decision pending; GDPR Art. 13(1)(a) gap stands until
    a legal entity or sole-trader name plus registered address is
    added; JSX comment in §1 marks the spot). Also confirm the
    `privacy@tensorcraft.app` mailbox actually receives mail, and
    confirm the Supabase project region so §7 (transfers) can name it.
  - Encrypt `profiles.github_token` at rest (plaintext since migration
    011; a DB leak leaks live GitHub tokens).
  - Propagate account deletion to PostHog persons via their API, and
    one-time-scrub existing person properties: `identify()` sent the
    account email until 2026-08-16, so persons created before then
    still carry it EU-side.
  - Legacy waitlist rows auto-subscribed under the pre-050 default
    (`subscribed = true` without an affirmative opt-in): re-consent
    campaign or purge; owner decision.
  - Certificate share pages: add `robots: noindex` (name + avatar are
    public to anyone with the link; policy §2 now discloses this).
  - `tc_world` personalization cookie is set by middleware before any
    consent interaction; disclosed in policy §6 as functional, revisit
    if counsel wants it consent-gated.
  - Terms lawyer pass (factual fixes shipped 2026-08-16, these need
    counsel): governing-law/jurisdiction clause; termination/suspension
    clause so §7 Acceptable Use has a consequence; statutory-rights
    carve-out on the §8 liability exclusion (EU/UK consumers); §5 IP
    claim should except vendored open-source (tfjs, Apache-2.0);
    cross-link the privacy policy; add an explicit terms-acceptance
    step for guest checkout (guest buyers currently never click
    through acceptance).
- [ ] Effects test-infra hardening deferred from the 2026-08-15
  signal-lock review (pricing curriculum cinematic): (a) capture
  `globalAlpha` in the recording-canvas style snapshots; deferred because
  it changes the `RecordedStyles` shape and invalidates every golden
  style SHA (a deliberate re-goldening exercise, fresh off the
  arch-sensitivity canonicalization). Until then the crossfade alpha
  channel in `signal-lock.ts` is covered by geometry tests only. (b) Lock
  `RING_RADII` (signal-lock.ts) against `ORBIT_RINGS` (orbit-canvas.tsx)
  drift, which likely means exporting the radii or extracting a shared
  scene-math module for the duplicated `hash()`/`wash()` helpers while
  there. (c) `hexToRgb` now has eight copies across apps/web (a canonical
  export exists in `packages/worlds/src/wcag.ts`); consolidate as one
  sweep.
- [ ] Real background job queue (Upstash QStash / Fly Machines cron) for
  large digest backlogs; deferred until job-queue infra is chosen.
- [ ] Integration / visual-regression / perf test suites against real
  Supabase + Stripe prod + GitHub API (deferred to beta;
  `docs/visual-regression.md`).
- [ ] Exercise-runner timeout vs TFJS download: the 1.47 MB TFJS bundle
  downloads inside the runner's 10s timeout, so a slow-connection
  learner's first "Run Tests" fails as "Timed out after 10 seconds",
  misattributed to their own code. Preload before arming the timer, or
  exclude download time from it.
- [ ] Test-infra debt (2026-07-21 audit structural notes): e2e `webServer`
  allowance is 30s against measured 19-154s cold compiles, so the a11y
  gate fails open and Worlds / Pricing / all six lesson steps can skip
  verification silently; Firefox has zero automated coverage; the three
  WebKit projects run the mobile smoke suite only; no `browserslist`
  (floors in `docs/browser-support.md` unenforced); `metadata.test.ts`
  reads exported objects in isolation with zero `generateMetadata`
  coverage. Also fix e2e viewport truth: `mobile.spec.ts` claims iPhone SE
  is 375×667 but Playwright's device is 320×568, leaving 375px - the most
  common real iPhone width - covered by no project; `reflow.spec.ts`
  passes while the report panel is clipped (its own `overflowX:hidden`
  masks it). Register's structural close: make gates fail **closed** and
  test resolved behaviour at real viewports.
- [ ] CI/CD gating debt (audit §4): no branch protection or required
  checks - Vercel deploys on push regardless of failing tests/e2e/lint
  (`eslint.ignoreDuringBuilds: true`); the only real gate is bypassable
  husky pre-push; `pnpm audit`, `format:check`, and migration drift absent
  from CI; no Dependabot/Renovate config to surface the next CVE; no API
  deploy workflow (`fly deploy` manual, web/API version skew unmonitored).
- [ ] Security hardening, low tier (audit §1, grouped): `achievements`
  self-insert of any badge; 30s JWT-cache life for revoked tokens;
  auth-callback `allowedHosts` falls through to `origin` instead of
  rejecting; validate `module_id`/`exercise_slug` before the GitHub path;
  webhook amount mismatch logs but still grants; logger redact list misses
  `github_token` and only reaches depth 1; unsubscribe token in query
  string; `avatar_url` validation is dead code (settings writes via
  PostgREST; add a DB CHECK or route through the API).
- [ ] Data-integrity P2 cluster (audit §3, grouped): client-supplied
  `completed_at` corrupts the heatmap on skewed clocks; guest replay
  collapses multi-day study into one streak call; DISPATCH dedup TOCTOU
  (duplicate inbox message, cosmetic); `/certificates/[id]` still 404s on
  non-ok HTTP during outages; delete `lesson-progress.tsx` dead code
  (carries two live bugs); frontend bypasses `POST /api/progress` and all
  its validation; `cache.ts` has bare Redis calls and zero callers; stop
  describing `cert_hash` as verifiable (no verification endpoint).
- [ ] Migration hygiene retrofit (audit §3): 17 of 40 migrations
  non-idempotent, none wrapped in BEGIN/COMMIT, rollback SQL covers 3 of
  40, no down-migrations. Retrofit as part of adopting real migration
  tooling.
- [ ] Code Hike scrollytelling (§7c, post-V0.5; Shiki shipped instead).
- [ ] `LossLandscape` component (atmospheric-only; revisit post-V1).
- [ ] `ActivityHeatmap` component (post-V0.5).
- [ ] Remove deprecated `<Quiz>` + `<KeyTakeaways>` MDX components once all
  worlds are migrated off them.
- **Audit-parked email + pipeline resilience** (pre-launch-checklist Rounds
  11-12, filed here 2026-07-22):
  - [ ] Refund-comms email (transactional template when a refund is issued).
  - [ ] News-scrape failure alerts.
  - [ ] Newsletter retry queue.
  - [ ] Fix post-unsubscribe re-signup being blocked by the unique
    constraint.
  - [ ] Plausible + PostHog consolidation (both ship today; pick one once
    launch data shows which earns its keep).
- [ ] i18n.
- [ ] TFJS major upgrade.
- [ ] npm-publishable `@tensorcraft/bridges` (blocked by `workspace:*` dep;
  needs tsup/rollup `noExternal`). Re-verified 2026-08-20, and the blocker
  is real: `packages/bridges-public/package.json` declares
  `"@tensorcraft/shared": "workspace:*"` and `src/index.ts` only
  re-exports from it, so the built `dist/index.js` is 802 bytes of
  re-export with no bridge data in it. `@tensorcraft/shared` is
  `private: true` at version `0.0.0` and 404s on the registry, so
  publishing today yields a package that installs and then throws
  `Cannot find module '@tensorcraft/shared'` on first import. The
  workspace-protocol rewrite pnpm does at publish time does not help: it
  rewrites to `0.0.0`, which is equally unpublished.
  Fix is a bundling step (tsup or rollup with the shared package marked
  `noExternal`) so the 51 bridges are inlined and the package has zero
  runtime dependencies, then `npm pack --dry-run` should show a
  substantially larger `dist/index.js`. Also note `@tensorcraft/bridges`
  has never been published at all (registry 404), so this is a first
  release rather than a version bump, and the name is unclaimed.
  Version, README, and description were corrected to 51 on 2026-08-19/20
  and are publish-ready; only the packaging is not.

## 8. Growth roadmap (100k paying users)

Strategy, arithmetic, and gating rationale live in `docs/roadmap.md` (detail
doc); the work items are indexed here. Gate order is a hard precondition
chain: Gate 1 denominator (widen ICP + more worlds) → Gate 2 LTV (recurring
revenue) → Gate 3 proof (funnel data, produced by Horizon 0) → Gate 4
catalog breadth (enterprise procurement). Horizon 0 shipped 2026-07-21; its
still-open defects are launch blockers (`docs/audits/launch-blockers-history-2026-08-23.md`), not
post-launch work.

### Horizon 1: fix the economics (0-9 months)

- [x] Widen ICP to JavaScript developers: copy, SEO metadata, schema
  identifiers (migration 059: js_background / js_experience_years /
  js_integration; fe_framework dropped), docs, and the content noun pass
  all shipped 2026-08-18.
- [x] Remaining from the ICP widening: the browser-anchored bridge triage
  ran 2026-08-19 across all five worlds plus the canonical registry
  (`packages/shared/src/bridges.ts`). Roughly 30 anchors swapped to Node or
  runtime-neutral JS, 6 dual-framed, the rest kept as near-universal or
  perceptual with reasons recorded; every swap carries freshly written
  `breaks` and no tier changed. Results in
  docs/audits/content-editorial-audit-2026-08-19.md; the in-dialogue
  frontend mentions went with it. (`Framework` union still typed for
  `variants` when multi-framework returns.)
- [ ] Launch more of the 4 built-but-gated worlds (overlaps §5 world
  sprints; this is the Gate 1 dependency).
- [ ] Authoring scaffold `scripts/new-lesson.mjs` (no generator exists;
  authoring velocity is the volume bottleneck).
- [ ] All-access subscription (~$15-25/mo) alongside one-time:
  `subscriptions` table + persisted `stripe_customer_id`, real
  `entitlements` table replacing ad-hoc `purchases.world_ids` derivation,
  `mode:"subscription"` checkout, `customer.subscription.*` /
  `invoice.paid` / `invoice.payment_failed` webhooks + dunning, billing
  management UI. Money-touching: full TDD + Stripe test-mode e2e before any
  live charge.
- [ ] Subscription content cadence: decide + publish the release rhythm
  before selling all-access - a static catalog churns a $15-25/mo sub
  immediately; the cadence decision re-orders §5 world sprints
  (added 2026-07-22).
- [ ] Subscription grandfathering: define the migration story for existing
  one-time buyers (credit / discount / grandfather) before the plan page
  ships - getting this wrong publicly is a trust incident
  (added 2026-07-22).
- [ ] Re-enable guest checkout behind the full hardening list: guest-safe
  success page, ownership + upgrade-credit checks (email field, no inbox
  round-trip), guest fallback in both `async_payment_*` webhook handlers,
  unique index on `lower(profiles.email)`, anon (not service-role) client
  for the OTP send, real unmocked `guest-account.ts` tests. The endpoint
  exists but nothing routes to it - disabled 2026-07-21 after review found
  3 post-charge defects (defect record: `roadmap.md` §2 P2). Money-touching:
  same TDD bar as the subscription work.
- [ ] Re-evaluate merchant-of-record at subscription launch, or when EU /
  international mix makes OSS VAT filing a real operating cost: compare
  Paddle (5% + 50¢, B2B invoicing) and Polar (~4% + 40¢) against Stripe
  Managed Payments (6.4% + 30¢) - not Lemon Squeezy (maintenance mode
  since the 2024 Stripe acquisition). Decision + fee analysis:
  `docs/roadmap.md` §4.
- [ ] Growth instrumentation: activation metric, referral/virality events,
  cohort-LTV dashboards (current taxonomy has zero virality events).
- Exit: LTV > 3x CAC provable; ads viable on warm traffic; ≥3 worlds live.

### Horizon 2: build reach (9-24 months)

- [ ] Viral competition arena (FREE, monetize via funnel, not arena
  paywall): public no-auth weekly challenge, `challenges` /
  `arena_submissions` / `leaderboard` tables, ranking service, arena result
  cards, referral loop, public profiles.
  **Write-model bone LAID (2026-07-24, migration 048):** `arena_submissions`
  exists, **service-role-write-only** (self-read RLS, no client write policy),
  so scores cannot be forged. **Correction (scalability re-audit 2026-07-24):**
  it is NOT true that "scoring infra already exists" - today's grading is
  CLIENT-authoritative and forgeable, and the cert stack proves payment not
  skill. The real remaining bones + the exact design are in
  `docs/arena-scoring-contract.md`: server-authoritative re-scoring against a
  hidden hold-out (A-F1), a hardened sandbox for the exec path (A-F2, do NOT
  reuse `WORKER_BODY_STRING`), an RNG-seeding/determinism convention (A-F3),
  plus the public top-N leaderboard `SECURITY DEFINER` RPC.
  Ships WITH: moderation + report flow + anti-cheat + ToS update - public
  no-auth UGC (usernames, code, leaderboards) griefs on day one without
  them; also update `product-plan.md`'s stale $29/yr arena pricing (free
  arena decided in roadmap) when this starts (added 2026-07-22).
- [ ] Rebuild the public `/bridges` catalog (51-bridge dataset lives in
  `packages/shared/src/bridges.ts`, rendered nowhere public since the
  2026-05-05 revert).
- [ ] Flip sitemap from throttled "core" to "full"; scale blog from single
  post via the existing news→lesson matching pipeline.
- Exit: viral coefficient K measurable and trending > 0.5; arena → signup →
  paid instrumented.

### Horizon 3: enterprise seats (24-48 months; ~60% of the target count)

- [ ] Orgs + members + invitations; org-scoped roles
  (`billing_owner | manager | learner`) replacing flat `user | admin`.
- [ ] Seat-quantity Stripe billing with proration.
- [ ] Team progress dashboard.
- [ ] SSO/SCIM + procurement table stakes (SOC2, invoicing, DPA).
- Sequenced last deliberately: behind Gate 3 (buyers demand completion
  data) and Gate 4 (single narrow path fails procurement).

**Parallel track, starts immediately (not code):** audience building /
distribution. Longest lead time in the whole plan; do not sequence it after
platform work.

## 9. Scale debt (before ~10k users)

Moved from `docs/audits/launch-blockers-history-2026-08-23.md` Tier 3 on 2026-07-22: that tier is
post-launch by its own definition ("not before launch"), user-count-gated
like §3. Last two items were prose-only findings (launch-blockers R2-5)
with no checkbox anywhere until now.

- [ ] `skill_events` partitions end **2027-04-01**;
  `ensure_skill_events_partitions()` has zero callers and inserts are
  fire-and-forget, so expiry fails silently and the skill genome dies
  unnoticed. Wire a scheduled caller + alert.
- [ ] Six `auth.getUser()` round-trips per authenticated page view; no
  `React.cache()` anywhere in the repo.
- [ ] All 22 RLS policies use unwrapped `auth.uid()` (Supabase's documented
  #1 RLS performance anti-pattern; wrap as `(select auth.uid())`).
- [ ] Missing `(user_id, attempted_at DESC)` index on `exercise_attempts`;
  re-add the `skill_axis` index silently dropped in the `013` partition
  swap.
- [ ] Landing ships ~249 kB gzipped of TFJS eagerly.
- [ ] Co-locate API + DB: Fly runs `iad`, Supabase `eu-west-1` (contrary to
  `infrastructure.md`); every API→DB query crosses the Atlantic.
- [ ] Health check gates Fly liveness on a DB query, so a Supabase blip
  kills the whole API fleet; separate readiness from liveness / fail open
  (its `count: exact` is also a permanent ~20 seq scans/min on profiles).
- [ ] Lesson route is SSR, not SSG: `cookies()` opts every lesson view out
  of static generation (0 of 56 prerendered; the "edge cache" comment in
  `page.tsx:28-32` is false), so each view pays full SSR + auth
  round-trips. Audit calls it the largest single infra item at 5-10k
  users.
- [ ] `exercise_attempts` unbounded: 100KB `submitted_code`, no dedup, no
  retention policy; ~6MB/min achievable per user. Add retention + size
  caps.

## /extras removal (2026-08-15)

Owner decision, executed 2026-08-15: the /extras surface and its content were
removed in full. Plan + execution ledger:
`docs/superpowers/plans/2026-08-15-extras-removal.md`.

**What was removed**

- Routes: `/extras` index + `/extras/[module]/[lesson]` (24 indexed URLs, now
  404; sitemap entries dropped, no redirects, matching the blog-post
  precedent).
- Content: `packages/content/content/extras/` - 23 lessons across 4 modules
  (math-deep-dive 8, classical-ml 5, ethics-responsibility 5, python-bridge
  5), their 4 module.yaml files and 23 exercise YAMLs (with hint ladders).
- Links: site-footer "Extras" link, the /pricing free-tier "23 bonus
  deep-dive lessons" bullet, and the 13 DerivationDrawer companion links in
  deep-orbit lessons. The drawer `companionSlug`/`companionHref` props were
  removed from `@tensorcraft/ui` (drawers keep their inline derivations).
- Pins/constants: `EXTRAS_LESSON_COUNT` (deleted),
  `EXERCISE_CONTENT.liveExercises` 88 → 65, Gate B hint-case pin 79 → 56,
  `BUILT_WORLD_DIRS` back to `["deep-orbit"]`.

**Consequences accepted**

- Free tier is Module 1 (5 lessons) only.
- The §4.10 roadmap-response marketing asset is BLOCKED (its topic map used
  the deep-dive track as its spine; see `docs/marketing-plan.md`).
- Curriculum no longer covers classical ML, ethics, math derivations, or the
  Python bridge anywhere.

**Restore pointer**

Everything exists at commit `0b5ec6d` (last commit before removal):
`git show 0b5ec6d:packages/content/content/extras/...` or
`git checkout 0b5ec6d -- packages/content/content/extras`. Restoring content
into a world also needs the count pins above walked forward and, for
companion links, the drawer link feature rebuilt.

---

# Moved out of launch-blockers (2026-08-23)

The owner set a harder bar for `docs/audits/launch-blockers-history-2026-08-23.md`: an item belongs
there only if the app cannot be BETA TESTED without it, where beta means real
money from US buyers, geo-gated, before the LLC exists. 41 of 44 open items
failed that bar and moved here **with their full text, evidence and status
markers unchanged**. Nothing was rewritten on the way across, so an entry that
says FIXED or DONE still means exactly what it meant there.

Reading order note: these sections kept their original tier headings, so
"Tier 1-OPS" and "Tier 1-LEGAL" below no longer imply launch-gating. They
describe what the work is, not when it is due.

## Tier 1-OPS - Operator + distribution setup, do before flipping live

Moved from `docs/post-launch-backlog.md` 2026-07-22. Not code defects:
measurement, email, and reach infrastructure whose value is multiplied by
launch traffic. Launch-day data is unrepeatable, and historical funnel data
has already been written off once (see above) - do not launch dark again.

- [x] **Migration 060 APPLIED to production 2026-08-23, and the waitlist
  bug is fixed at the database level.** Verified directly, not assumed:
  `chk_waitlist_source` now reads
  `length(source) between 1 and 64 and source ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
  and `chk_waitlist_world_id` now includes `'all'`. Ledger reads 60/60 and
  `pnpm migrate:status` exits 0, so the `deploy-api.yml` zero-pending gate is
  clear again.
  **What this means in practice:** every capture surface on the site can now
  write a row. The pre-apply state was captured first and confirmed the
  diagnosis exactly, so this was a real defect and not a theoretical one.
  **What it fixes is a live bug, not new-feature scaffolding.** 009 declared
  `chk_waitlist_source` as an enum allowing only
  ('landing','pricing','blog','referral','social'). Every capture surface
  built since passes something else: `world-selection` (newsletter modal),
  `free-module-end` (guest email capture), `coming-soon-hero` and
  `coming-soon-footer` (the coming-soon pages). The newsletter modal also
  passes `world_id` "all", which 041's CHECK rejects too. `submitWaitlist`
  returns "error" instead of throwing, by design, so every one of those
  submissions has been failing silently behind a generic error message, with
  nothing logged and nothing alerting.
  **Why this is launch-gating:** the coming-soon pages are the ONLY waitlist
  entry point for four of the five worlds, and the launch plan depends on
  mailing that list. Production currently holds ONE waitlist row, from
  2026-03-27, source `landing`, which is the only source the constraint ever
  allowed. Traffic has been near zero so the absence of rows is not proof on
  its own, but the constraint analysis is deterministic and 009/041 are both
  in the applied ledger with no later migration dropping either.
  060 replaces the enum with a shape check (lowercase kebab-case, 64 chars),
  the same call 041 deliberately made for email, so a new capture surface
  never again needs a migration to work.
- [x] **Migration ledger verified IN SYNC at 59/59 for 001-059.** Closed
  2026-08-20 by running the check instead of reasoning about it.
  Superseded in part 2026-08-23 by the 060 entry above: the ledger was
  genuinely in sync when checked, and a new migration has been added since. `node
  scripts/migration-status.mjs` reported `files on disk : 59`,
  `applied (ledger): 59`, "IN SYNC, every file is applied, no orphan ledger
  rows", exit 0. **Nothing is pending**, so 058 and 059 are both live in
  production and the zero-pending gate in `deploy-api.yml` passes.
  **The premise that this needed an operator was wrong:** `apps/api/.env`
  carries both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, so the ledger
  is checkable from a normal checkout. Anyone re-verifying can run
  `set -a; eval "$(grep -E '^(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=' apps/api/.env)"; set +a; pnpm migrate:status`.
  Original text retained as the record of why the target moved:
  Reconciled 2026-08-20: this entry used to say
  "apply 058, ledger will read 58/58". That target is now stale. The repo
  has **59** migrations on disk (001..059); `059_rename_fe_identifiers_to_js`
  landed with the 2026-08-18 JavaScript rebrand and carries the same
  apply-before-you-deploy ordering rule 058 does, and the app code at HEAD
  already reads BOTH renames (`world_progress`/`p_world_id` in
  `apps/web/lib/progress.ts` and `apps/api/src/routes/profiles.ts`;
  `js_background`/`js_integration` in `apps/api/src/routes/onboarding.ts`
  and `apps/web/app/onboarding/page.tsx`). A pre-058 or pre-059 database
  therefore errors at runtime.
  **How to check:** `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpm
  migrate:status`, expect IN SYNC 59/59. Without credentials the script
  exits 0 in OFFLINE mode and tells you nothing, which is why this cannot
  be closed from a checkout.
  Repo side is ready and already gated: the `migrations` job in
  `.github/workflows/ci.yml` and
  `.github/workflows/deploy-api.yml:48` both run `migrate:status`, and type
  parity is done (`packages/supabase/src/types.ts` defines `world_progress`
  and contains zero `theme` identifiers).
- [ ] (OPERATOR) **Verify the 059 rename end to end with a signed-in
  session.** Migration 059 was applied 2026-08-20 and the API redeployed
  (Fly v18) the same day, but the two behaviors it touched have only been
  checked at the infrastructure layer (ledger IN SYNC 59/59,
  `/api/health/ready` reports `db: ok`, CI green). Neither has been
  exercised as a user, because both need an authenticated session:
  (1) complete an onboarding and confirm the JavaScript-background and
  years-of-experience answers persist, which is what the deployed-old-API
  window was silently discarding; (2) download a GDPR export from settings
  and confirm it returns `js_background` and `js_experience_years`, the
  endpoint that would have 500'd between the migration and the API deploy.
  Also worth one query while signed into Supabase: profiles with
  `onboarding_completed = true` and a null `js_background` created between
  2026-08-18 and 2026-08-20 are learners whose answers the old API dropped.
  Expected to be zero or near-zero at current traffic.
- [ ] (OPERATOR) **PostHog:** create the EU project, set
  `NEXT_PUBLIC_POSTHOG_KEY` (web `.env.local` + Vercel), then walk the
  event checklist in `docs/analytics-verification.md`. Free tier = 1M
  events/month.
  Repo side is wired and fails soft: `apps/web/lib/posthog.ts:25` only
  initializes when the key is present, and `apps/web/lib/env.ts:38` warns
  "product analytics OFF" when it is not.
  Stale count corrected 2026-08-20: this entry said "the 10 events".
  `docs/analytics-verification.md` documents 20, and
  `apps/web/lib/analytics-events.ts` defines about 25.
- [ ] (OPERATOR) **Success-metrics dashboard + alerts** in PostHog: lesson completion
  (target ≥60%), paid conversion (3%), NPS (≥40), 7-day retention (≥30%),
  30-day retention (≥15%), avg time per lesson, hint dependency, paywall
  conversion. At minimum, payment-failure alerting live before real money
  flows.
- [ ] (OPERATOR) **Kit (ConvertKit) lifecycle setup.** Code side is complete
  and verified 2026-08-20: the client (`apps/api/src/lib/kit.ts`), every tag
  lookup (`apps/api/src/routes/email-tags.ts:8-19`,
  `preferences.ts:98,109`, `payments.ts:873,1196`), the fail-closed bounce
  webhook (`webhooks.ts:50-54`, rejects everything while
  `KIT_WEBHOOK_SECRET` is unset, and that var is in the API's `PROD_REQUIRED`
  list so production refuses to boot without it), and all names documented in
  `apps/api/.env.example:47-72`. Everything below is dashboard and secret
  work. Manually create the Form + the
  seven lifecycle Tags in the Kit dashboard (`signed_up`, `onboarded`,
  `first_lesson`, `capstone`, `purchased`, `email_alerts`, `weekly_digest`),
  then set `KIT_FORM_ID` + `KIT_TAG_SIGNED_UP` / `KIT_TAG_ONBOARDED` /
  `KIT_TAG_FIRST_LESSON` / `KIT_TAG_CAPSTONE` / `KIT_TAG_PURCHASED` /
  `KIT_TAG_EMAIL_ALERTS` / `KIT_TAG_WEEKLY_DIGEST` env vars (numeric tag
  IDs). **API keys are NOT usable, see the entry directly below.** Also set `KIT_WEBHOOK_SECRET` and
  register the bounce webhook per `docs/email-setup.md` §3, plus
  `KIT_TAG_PAYWALL_HIT` / `KIT_TAG_MODULE_1_COMPLETE` (R2-7 made
  missing-tag skips recoverable, but sequences cannot fire on tags that do
  not exist). Purchase is a single world-agnostic tag in V1 (per-world
  sequences: `post-launch-backlog.md` §5). Without this, purchases succeed
  but subscribers are never tagged and no lifecycle email fires - including
  ~~the purchase receipt flagged in R2-4~~ (**no longer true as of
  2026-08-23**: the receipt is sent over Resend and does not depend on Kit,
  see Tier 1-LEGAL. What is still lost while Kit is unconfigured is lifecycle
  tagging and every sequence that keys off it). Templates must follow
  `docs/email-templates.md`.
- [ ] (OPERATOR) **Kit credentials fail auth, and the client may target a
  retired API base. BLOCKS both Kit entries above.** Found 2026-08-20 by
  probing the live API with the stored credentials, not by reading config.
  Three findings, each verified:
  1. **Both stored keys 401.** `KIT_API_KEY` and `KIT_API_SECRET` from
     `apps/api/.env` were tried against Kit v4
     (`GET https://api.kit.com/v4/tags`, header `X-Kit-Api-Key`): both
     return `401 {"errors":["The API key is invalid"]}`. The v3 secret
     endpoint (`GET /v3/account?api_secret=...`) returns
     `401 {"error":"Authorization Failed"}`.
  2. **The client points at a base URL that now redirects.**
     `apps/api/src/lib/kit.ts:6` hardcodes
     `https://api.convertkit.com/v3`. `GET /v3/tags?api_key=...` answers
     `302`. ConvertKit rebranded to Kit and moved to `api.kit.com/v4`, so
     the version question has to be settled, not just the credential.
  3. **No tag IDs exist in production.** `flyctl secrets list -a
     tensorcraft-api` shows exactly one Kit variable deployed,
     `KIT_WEBHOOK_SECRET`. None of the nine `KIT_TAG_*` vars the code reads
     are set on the host.
  Combined effect, and why this is a launch blocker rather than a chore:
  `/api/email` answers `{ ok: true, skipped: true }` when a tag var is
  unset (R2-7), so every lifecycle tag call has been succeeding loudly and
  doing nothing. The failure is invisible from logs, dashboards, and the
  app. Purchases, onboarding, first lesson and capstone all currently tag
  nobody.
  **Narrowed 2026-08-23:** the purchase RECEIPT no longer depends on this.
  It was rebuilt on Resend precisely because these credentials are dead, so a
  buyer now gets the legally expected artifact even with Kit dark. What
  remains lost here is lifecycle tagging and the retention sequences keyed to
  it, which is a marketing outage rather than a compliance one.
  Order of work: regenerate a key in the Kit dashboard; decide v3 versus a
  port to v4 (`kit.ts` is the only caller); set the key plus the nine
  `KIT_TAG_*` IDs as Fly secrets; then re-verify with a real tag call
  before trusting either entry above. Do NOT mark those done on dashboard
  state alone: this entry existed as "API keys already configured" and was
  wrong.
- [ ] (OPERATOR) **Kit retention automations** A/B/C per
  `docs/email-retention-sequences.md`. Copy drafted, code side live;
  dashboard work only. The sequences target exactly the launch cohort
  (signed up / stalled / finished free tier). Blocked by the credential
  entry above: an automation cannot fire on a tag that is never applied.
- [ ] (OPERATOR) **Sentry alerting.** Capture is real and verified in both
  apps (`apps/api/src/lib/sentry.ts` + `middleware/sentry.ts`; web's three
  `sentry.*.config.ts` loaded via `instrumentation.ts:14-18`), but alert
  rules have no repo representation at all. Create the three rules specified
  at `pre-launch-checklist.md` §B10 in each Sentry project.
- [ ] (OPERATOR) **Plausible:** add site `tensorcraft.app`, set
  `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in Vercel. ~EUR 9/mo. The script component
  (`apps/web/app/components/plausible-script.tsx:8`) is already conditional
  on the var. Note `apps/web/.env.example:26` carries a template default,
  which is NOT evidence the Vercel env is set.
- [x] **Google Search Console: verified.** Closed 2026-08-20. A real
  performance baseline was pulled on 2026-08-17 (3 months: 6 clicks, 549
  impressions, average position 51), which is impossible without a verified
  property. Verification used a method that leaves no repo artifact: there
  is no `verification.google` key in `apps/web/app/layout.tsx` metadata.
  Remaining GSC work (resubmit the sitemap, request indexing) is ordinary
  SEO operations, tracked in `docs/post-launch-backlog.md`, not a launch
  blocker.
- [ ] (OPERATOR) **Product Hunt "upcoming" page** - follower capture only works
  pre-launch.
- [ ] (OPERATOR) **Twitter/X account @tensorcraft** - create now (posting cadence can
  wait). Launch execution (`dev-plan.md` §10b) announces on Twitter/X, so
  the account must predate launch; also removes handle-squatting risk. The
  old "DEFERRED to V1.0" note contradicted §10b and is resolved in favor of
  pre-launch (2026-07-22).
- [x] **FAQPage JSON-LD on `/pricing`** - **DONE 2026-07-25**: FaqSection
  now emits the FAQPage markup itself, so `/` and `/pricing` both carry it,
  and the sitewide copy was removed from the root layout (wrong-page
  markup, same class as the Course dedup).
- [ ] **Distribution head start:** write + publish the first blog batch and
  begin the audience track. `roadmap.md` §7: longest lead time in the plan,
  runs in parallel, starts before the code is ready.
  Verified 2026-08-20: infrastructure is DONE and content is ZERO.
  `packages/content/content/blog/` holds only `.gitkeep`, while the whole
  render path is built and waiting (`apps/web/app/blog/page.tsx` branches on
  `posts.length === 0`, `blog/[slug]/page.tsx` and `blog/rss.xml/route.ts`
  both exist). This is a writing task, not an engineering one.
- [x] **Ledger, secrets and health all re-confirmed.** Closed 2026-08-20.
  Every claim this entry makes except the 046 auth hook now has direct
  evidence. The 037-055 batch is covered by the verified IN SYNC 59/59 at
  the top of this tier. `gh secret list` shows `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` (both 2026-07-25) alongside `FLY_API_TOKEN`,
  so the fail-closed `migrations` CI job has what it needs. Both health
  endpoints answer live: `/api/health` returns static ok, and
  `/api/health/ready` returns `checks.db: ok`, which independently proves
  the deployed API can reach the database.
  The 046 hook is split into its own entry below, being the one claim here
  that only a dashboard can settle. Original text follows.
  **Apply the pending migrations - claimed DONE 2026-07-25 (ops-deploy session):** 037-055 applied to production in order; `pnpm migrate:status` = IN SYNC 55/55; GitHub secrets set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FLY_API_TOKEN); `deploy-api.yml` ran green; `/api/health` + `/api/health/ready` both 200. ~~Remaining sub-step: enable the 046 Custom Access Token hook in the Supabase Auth dashboard (middleware falls back safely meanwhile).~~ 046 hook ENABLED in the Supabase dashboard 2026-07-25 (ops-deploy session); ledger now IN SYNC **57/57** after 056/057 (entries below). Original text retained below for the record.
- [ ] (OPERATOR) **Settle whether the 046 Custom Access Token hook is
  enabled.** Split out 2026-08-20 from the entry above, which is where the
  contradiction lives: that entry says the hook was enabled in the Supabase
  dashboard on 2026-07-25, while the struck entry further down still lists
  enabling it as an open step. Neither the repo nor the database can settle
  it, because it is Supabase Auth configuration rather than schema, and it
  is the only sub-claim in the ops-deploy entry left unproven. Check
  Authentication, Hooks in the Supabase dashboard, then correct whichever
  entry is wrong. Consequence if it is off: middleware falls back safely,
  so this is a correctness-of-record question, not an outage risk.
- [x] **Migration 056 is applied.** Closed 2026-08-20 by the verified
  ledger: 56 appears in `schema_migrations`, and the run reported no
  pending files and no orphan rows, so the migration executed against
  production. That matters because the account-deletion endpoint is live
  (`apps/api/src/routes/profiles.ts:351`) and its own comment says 056 MUST
  ship first, otherwise every deletion erases VAT records the law requires
  you to keep.
  **Upgraded from ledger-inference to direct proof 2026-08-23:** a
  `pg_constraint` query over `DATABASE_URL` returns
  `purchases_user_id_fkey` with `confdeltype = 'n'`, which is SET NULL. So
  the FK rule is confirmed in the live database, not merely inferred from
  the migration having run, and the account-deletion endpoint is safe to
  ship: erasing an account unlinks its purchases instead of deleting the VAT
  records the law requires you to keep. Original text follows.
  **Apply migration 056 - claimed DONE 2026-07-25:** applied to production via
  the same Node `pg` procedure as 037-055; pre/post state verified in
  `pg_constraint` (delete rule CASCADE → SET NULL, `user_id` now nullable,
  still references `profiles`); `pnpm migrate:status` = IN SYNC 56/56, so
  the deploy-api.yml gate passes again. The deletion endpoint is now safe
  to deploy. Original text: purchases FK → ON DELETE SET NULL so tax
  records survive account deletion - with the old cascade, deleting an
  account erases VAT records the law requires you to keep.
- [ ] ~~**Apply the pending migrations in order - BEFORE the next API deploy.**~~
  The `schema_migrations` ledger now EXISTS (migration 042 built it +
  backfilled 001–041), so this is no longer "establish a ledger" - run
  `pnpm migrate:status`, then apply each PENDING file in numeric order via the
  runbook. Pending as of 2026-07-25: **037–051** (049 clamps
  stripe_customer_id, R3-5; 050 flips the waitlist consent default,
  Tier 1-LEGAL; 051 adds the dispute-won restoration RPC + 038 escape
  hatch, run-2 F2). ~~None of 045–048 is
  launch-blocking on its own~~ - **superseded by R3-2: 047 must be applied
  before the current `payments.ts` ships or every purchase 500s post-charge.**
  046 additionally carries its own operator step (enable the Custom Access
  Token hook in the Supabase dashboard; middleware falls back safely while it
  is off). ~~Wire `pnpm migrate:status` into CI~~ - CI job added 2026-07-25;
  needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as GitHub Actions
  secrets or it stays red (fail-closed by design, R3-9).
- [x] **Vercel is on Pro, verified 2026-08-24** (team scope
  `amira-salahs-projects`). Closes this entirely. Original text: Hobby prohibits
  commercial use; selling a $50-225 product on it is a ToS/takedown risk
  before it is a cost one (R2-5). Still recorded as Hobby in the repo at
  `docs/infrastructure.md:45` and in the cost table at `:202`; the
  authoritative source is the Vercel billing dashboard. After upgrading,
  update both lines.
- [ ] (OPERATOR) **Make Vercel installs honor the lockfile.** Moved here
  2026-08-20 from the "VERCEL BUILD FAILURE (2026-08-14)" section, where it
  was the only live item under a heading that reads as resolved. Set the
  install command to `pnpm install --frozen-lockfile`; until then every
  deploy re-resolves caret ranges and can compile against dependencies CI
  never tested, which is exactly what broke the 2026-08-14 build. The code
  half is done (`apps/web/app/admin/digest/actions.ts` types its update
  payload as `NewsItemUpdate`, which compiles under both supabase-js
  versions).
  Worth considering instead: there is no `vercel.json` in the repo, so this
  setting lives only in the dashboard and can drift silently. Committing a
  `vercel.json` with `installCommand` would put it under version control.
  Not done here because a wrong value breaks every deploy; owner call.
- [~] **Gate Vercel deploys on CI. Code side DONE 2026-08-20; one operator
  step remains.** Moved here 2026-08-20 from the "CI RED CLEARED
  (2026-08-14)" section, where it was one prose sentence under a heading
  that reads as fully resolved. A green `main` does not by itself prevent
  the next deploy-before-CI incident, which is the same class of failure as
  the 2026-08-12 outage where the web app auto-deployed before its
  migration was applied. **It recurred on 2026-08-18**: migration 059
  shipped with the code that needed it, CI went red on the drift check and
  stayed red, and Vercel deployed anyway, so production ran new code on an
  old schema for two days.
  - [x] `vercel.json` added at the repo root with an `ignoreCommand` that
    runs `scripts/migration-status.mjs` and SKIPS the deploy when the
    ledger is behind. Exit-code mapping and the reasoning are documented in
    `docs/migration-runbook.md` ("Deploy gating"). Note the inversion: for
    an `ignoreCommand`, exit 0 means skip and non-zero means build. Drift
    (status exit 1) skips; in-sync (0) and cred/connection failure (2) both
    build, so a missing env var cannot brick every deploy including the one
    that fixes it. CI stays the fail-closed gate.
  - [x] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present in the
    Vercel project env: both Sensitive, scoped to Production and Preview,
    added 2026-05-03. Confirmed 2026-08-23 from the Environment Variables
    page. The gate has the credentials it needs.
  - [x] Root Directory question settled: it is `apps/web`, NOT the repo
    root. Vercel reads the repo-root `vercel.json` but runs the
    `ignoreCommand` with cwd `apps/web`, so the path is
    `../../scripts/migration-status.mjs` and the file stays at the root.
    Both facts are now pinned by
    `packages/content/__tests__/vercel-ignore-command.test.ts`. When
    testing this gate by hand, `cd apps/web` first: run from the repo root
    and the script path fails to resolve, node exits 1, the wrapper reads
    that as drift, and it looks like the gate cancels every deploy. That
    false alarm is easy to hit.
  - [x] Gate output is no longer piped to `/dev/null` (2026-08-23), so the
    migration-status verdict appears in the build log. Without it the gate
    was unverifiable and undebuggable from Vercel's side. The script prints
    counts and version numbers only, never secrets.
  - [ ] (OPERATOR) **Confirm the gate is actually live by reading one build
    log.** This is the last unverified assumption in the whole mechanism:
    whether Vercel's Ignored Build Step receives project environment
    variables at all. Open the next deployment's log and look for the
    `Migration status` summary. If it shows `files on disk : NN` and
    `applied (ledger): NN`, the gate is real. If it instead prints the
    offline "Set the env vars to diff against the live ledger" message, the
    vars are not reaching that step and the gate is decorative, passing
    every deploy regardless of schema state.
- [ ] (OPERATOR) **Env-var hygiene: three settings remain, all outside the
  repo.** Verified 2026-08-20: every code and doc sub-item below is genuinely
  done (`apps/api/src/env.ts` three tiers boot-called at `index.ts:123`;
  `apps/web/lib/env.ts` mirrored through `instrumentation.ts`, unit-tested).
  What is left: (1) `SENTRY_AUTH_TOKEN` in Vercel, absent means minified
  production stack traces; (2) `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  in the Vercel **production** environment, which is a hard launch gate now
  that the boot assertion refuses to start production without them; (3)
  `APP_URL` on Fly; (4) **added 2026-08-23: `API_URL` and `ADMIN_API_KEY` in
  the Vercel server environment**, which the email-link unsubscribe relay
  needs in order to tell Kit about an opt-out. `API_URL` must NOT be
  `NEXT_PUBLIC_`, since it is paired with a secret, and `ADMIN_API_KEY` must
  match the API's value exactly or the relay is rejected 401. Both are
  documented in `apps/web/.env.example`. Unset is safe but inert: the local
  opt-out still applies and Kit is simply not told. Historical detail follows.
  (audit §4; doc side CLOSED 2026-07-25 - remaining
  work is the startup assertion + operator settings): ~~document
  `STRIPE_TAX_ENABLED`~~ (now in `.env.example` + deployment-guide, with
  prerequisites); ~~remove dead GitHub App vars~~ (gone from `.env.example`,
  deployment-guide, pre-launch-checklist); ~~fix Upstash docs~~ (all three
  docs now state the silent-degradation truth); ~~CERT_SIGNING_SECRET in
  deployment-guide~~ (added); ~~CORS_ALLOWED_ORIGINS straggler~~ (fixed);
  ~~KIT_TAG_PAYWALL_HIT / MODULE_1_COMPLETE in .env.example~~ (added);
  ~~rate-limit 60-vs-120 doc split~~ (all docs now say 60, the code truth).
  ~~STILL OPEN: add a startup env assertion (`env.ts`/zod)~~ **Code side
  DONE 2026-08-11:** API had `apps/api/src/env.ts` since the R3 wave
  (three tiers, boot-called, deploy-preflight diffs its exported lists);
  web now mirrors it in `apps/web/lib/env.ts` wired through
  `instrumentation.ts` (nodejs runtime, skips the build phase, keys the
  prod tier off `VERCEL_ENV` so previews stay bootable; unit-tested).
  REMAINING (operator): set `SENTRY_AUTH_TOKEN` (absent → production stack
  traces minified), `SUPABASE_URL` + service key on **Vercel** (RFC 8058
  one-click unsubscribe throws unset - Gmail/Yahoo bulk rules; the boot
  assertion now refuses to start production without them), and `APP_URL`
  on Fly (guest email falls back to the production domain rather than a
  broken link, but the explicit var is still correct).
- [ ] (OPERATOR) **Upstash plan check.** This entry's arithmetic is stale:
  it assumed 5-6 Redis commands per API request. The 2026-08-17 limiter
  rewrite cut that to 2 commands per request (fixed window via
  `@upstash/ratelimit`, blocked subjects served from an ephemeral cache),
  and `/api/health` is now exempt from the limiter entirely, which was the
  probe traffic that consumed most of the quota. Free tier headroom is
  therefore roughly 250k requests/month, not 1,700/day, and the owner has
  deferred payment until traffic justifies it. Re-check the console before
  a launch spike rather than treating this as a hard blocker.
  Code fails closed in production: `apps/api/src/env.ts:42-43` puts both
  Upstash vars in `PROD_REQUIRED`.
- [ ] (OPERATOR) **Email domain warmup + Postmaster.** Doc conflict found
  2026-08-20 and still unresolved: this entry says register Postmaster
  Tools pre-launch, while `docs/email-setup.md:153` defers it ("worth doing
  post-V1 once volume > 5k/day"). Pick one and make both docs agree. No
  warmup schedule exists anywhere in the repo. DNS auth is in place with
  DMARC at `p=none` (`docs/dns-records.md:31`).
  §10b plans a launch-week blast
  to 500 waitlist users from a domain that has never bulk-sent - cold
  domain + burst = spam folder at the worst moment. Ramp sends gradually
  over the preceding weeks; register Google Postmaster Tools (added
  2026-07-22).
- [ ] (OPERATOR) **Cloud-cost alerts.** Configure billing/usage alerts on Vercel
  (bandwidth), Supabase (egress/compute), Fly, PostHog (1M-event
  overage), Upstash. One viral spike currently produces a surprise bill
  with zero warning (added 2026-07-22).
- [x] **Migration + runbook safety: closed, and the 019 sub-item was
  MISFRAMED.** Closed 2026-08-20. 057 is applied (verified ledger, 59/59),
  and the runbook/refund concern is genuinely superseded by 051's
  `restore_purchase_after_dispute`.
  **Read this before acting on the previous wording, which was dangerous.**
  It said to check `pg_proc` and "drop it with the correct signature if
  present". Do not. `public.get_shared_certificate(uuid)` is live **by
  design**: migration 019 creates it and grants execute to `anon` on
  purpose (`019_certificates.sql:99`), migration 039 lists it as a reviewed
  SECURITY DEFINER RPC, `CONVENTIONS.md:85` documents it as the canonical
  cross-user read pattern, and it is the read path behind
  `GET /api/certificates/:id` (`apps/api/src/routes/certificates.ts:225`)
  and the public `/certificates/[id]` share pages. Dropping it would break
  the most-shared surface in the product. 019 is applied and intended to
  stay applied, so a function it created being present is correct, not a
  finding.
  **The real defect was one line of rollback SQL, and it is now FIXED:**
  `docs/pre-launch-checklist.md:671` said
  `drop function if exists public.get_shared_certificate(text) cascade;`.
  No such overload exists, so `if exists` made it a silent no-op and a
  genuine 019 rollback would have left the function behind pointing at a
  table the next line drops. Corrected to `(uuid)`. This was only ever a
  rollback-path bug, never a live exposure, which is why no later migration
  "fixes" it and why there was nothing to find in `pg_proc`.
  Original text follows.
  **Migration + runbook safety** - claimed closed 2026-07-25: `skill_events_old`
  VERIFIED still existing in production with ZERO rows (PostgREST probe);
  **migration 057** drops it - APPLIED to production 2026-07-26 (table
  re-verified 0 rows immediately before drop; ledger IN SYNC 57/57;
  deploy gate green). The 019 rollback-signature and
  runbook-vs-038 items were superseded earlier: the ledger (042) replaced
  the rollback-SQL page as the source of truth, and migration 051's
  `restore_purchase_after_dispute` is the sanctioned repair path the old
  runbook SQL lacked. Original text below for the record.

> Historical, superseded by the entry above (2026-08-20): ~~**Migration +
> runbook safety** (do with the ledger reconcile):~~
> verify `skill_events_old` was actually dropped (013's DROP is commented
> out - production may carry a full duplicate); fix the 019 rollback
> signature mismatch (`(text)` vs `(p_id uuid)` - it silently succeeds
> leaving the anon-callable function live); reconcile the incident
> runbook's refund-window SQL with migration 038's terminal-status
> trigger, which silently ignores the corrective update.

- [ ] (OPERATOR) **Verify backups + run one restore drill.** Re-verified
  2026-08-20 and the gap is exactly as described: `docs/infrastructure.md`
  contains zero hits for backup, PITR, or restore across all 254 lines, so
  the file this entry says to write the result into still has no such
  section. The only backup prose in the repo is generic advice at
  `docs/deployment-guide.md:167`, which assumes a Supabase Pro plan while
  `docs/infrastructure.md:45` records the web tier as Hobby; the Supabase
  tier is stated nowhere.
  Confirm the plan includes daily backups and note the PITR window, restore
  into a scratch project once, then write the tier, retention window, drill
  date and result into `docs/infrastructure.md`.

## Tier 1-LEGAL - advisor + compliance actions before selling in the EU/UK

Action list for the R2-4 findings (R2-4 stays as the findings record;
flagging exposure, not legal advice).

> **DECISION (owner, 2026-08-23): the entity will be a US LLC. Formation
> is deferred, so the decision is made but the entity does not exist yet.**
> That answers the question this tier funnelled through, and it changes the
> tax math rather than merely filling in a blank. Still flagging exposure,
> not giving legal advice: an advisor should confirm all of the below.
>
> **What US establishment settles.** The seller is established OUTSIDE the
> EU and outside the UK, which removes the threshold cushion the entries
> below were written assuming might exist:
>
> - The **EUR 10,000 threshold does not apply**. It is available only to
>   EU-established sellers. For a US seller, EU VAT on digital services is
>   due at the buyer's rate from the **first** B2C sale.
> - The registration route is the **non-Union OSS scheme**, not Union OSS.
> - **The UK is separate and also has no threshold** for non-UK-established
>   sellers. UK VAT is due from the first consumer sale. Two registrations,
>   not one.
> - **GDPR Art. 27 (EU representative) and UK GDPR Art. 27 (UK
>   representative) become live requirements**, not open questions, unless
>   the narrow Art. 27(2) exemption applies. Selling accounts that store
>   progress over time reads as regular rather than occasional processing,
>   so do not assume the exemption. Both are paid appointments.
> - US side: state economic nexus, home state first, the rest on crossing
>   thresholds. This is what Stripe Tax is good at.
>
> **What formation still gates, and the cost of deferring it.** The
> published entity name, the postal address, the controller identity, which
> entity signs the DPAs, and the EAA microenterprise thresholds (headcount
> and turnover of an entity that does not exist yet).
>
> **The deferral collides with a standing owner directive, and this is the
> part worth deciding deliberately.** Identity stays private is an explicit
> rule for this project. A US LLC is precisely the mechanism that satisfies
> it: the LLC name and a registered agent or virtual business address are
> what get published, so the consumer-disclosure requirements are met
> without exposing a personal name or home address. Selling BEFORE
> formation inverts that. A sole proprietor's required disclosures point at
> the individual, so the choice becomes publishing personal details or
> shipping legal pages that stay non-compliant. Forming the LLC is not
> merely paperwork ahead of launch, it is the thing that keeps the identity
> private once money changes hands.
>
> **Sequencing consequence.** Because a US seller gets no threshold cushion
> in either the EU or the UK, **geo-gating EU and UK checkout at launch is
> now the cheaper opening move**, not the fallback. It defers two VAT
> registrations and two Art. 27 appointments until volume justifies them.
> It does not exist in code today (see the entry below), so choosing it is
> a small build, not a config flip. Stripe account ownership is the other
> sequencing item: revenue taken before formation lands on an individual
> and has to be migrated to the LLC afterwards.
>
> Original note, now answered: every open item in this tier funnelled
> through ONE unmade decision, the establishment country and legal entity.
> It blocked the postal address, the controller identity, the Art. 27
> question, the choice of advisor and OSS registration, and the EAA
> microenterprise thresholds.
>
> ---
>
> **LAUNCH SEQUENCING (owner, 2026-08-23): ship and sell BEFORE the LLC
> exists. The LLC gets formed only once 500 users prove real market need.**
> Same shape as the world-2 gate: validate first, spend second. The concern
> below was raised and the owner reaffirmed the plan, so this is the
> recorded decision, not an open question. What follows is how to keep its
> cost bounded.
>
> **Geo-gating fixes exactly one of the two problems.** The distinction
> decides most of this tier, so it is worth stating precisely:
>
> - **VAT is triggered by a supply for consideration.** Blocking EU and UK
>   **checkout** therefore removes the EU/UK VAT exposure completely, and
>   with it non-Union OSS, the separate UK registration, and the tax half of
>   the advisor engagement. Those all move behind the 500-user gate.
> - **GDPR is triggered by OFFERING services to EU data subjects, free
>   included.** It applies the moment an EU visitor signs up for the free
>   module. Geo-gating checkout does NOT remove it. Art. 13 controller
>   identity, the Art. 27 representatives, and the privacy-page gaps all
>   stay live during validation.
>
> The only way to escape GDPR would be blocking EU/UK from the whole site,
> which would defeat the validation goal outright, since the free module is
> the top of exactly the funnel the 500-user gate measures. So it is not on
> the table.
>
> **ACCEPTED RISK, recorded rather than hidden.** Selling before formation
> means the controller is a natural person. This project will publish a
> trading name plus a mailbox address and will not name that person, which
> is what most indie operators do and which is NOT strictly complete under
> Art. 13(1)(a). The owner has weighed that against the identity-private
> directive and chosen it deliberately. Trigger to close: LLC formation at
> the 500-user gate. Do not silently re-open this as a finding; it is a
> decision with a known cost and a named exit.
>
> **How to bound the exposure while validating:**
>
> 1. **Geo-gate checkout for EU/UK, and CAPTURE the blocked demand instead
>    of just refusing it.** That converts lost revenue into a measurable
>    EU/UK paid-demand list, which is precisely the evidence the 500-user
>    gate is supposed to weigh. Refusing silently throws that away.
> 2. **Get a virtual business address now.** It satisfies CAN-SPAM for the
>    already-live digest and gives a publishable address that is not a home
>    address. It does not depend on formation and becomes the LLC's address
>    later.
> 3. **Keep free signups global.** No VAT is triggered, and signups are the
>    validation metric.
> 4. **Merchant of record is the unlock AT the gate, not now.** `roadmap.md`
>    §4's re-evaluate trigger is arguably met already, since OSS filing is
>    not merely costly without an entity, it is impractical. But the same
>    section's warning stands: the money path is deep and freshly hardened,
>    and switching rails pre-launch is risk with no launch upside. An MoR
>    would also put the MoR's identity on the invoice rather than a natural
>    person, which is why it is the right conversation to have once the
>    entity question is live again.

- [ ] (OPERATOR, NOW URGENT) **EU/UK purchases OPENED 2026-08-31: the
  geo-gate is removed from code by owner decision.** Every layer of the
  2026-08-23 gate is deleted: the middleware cookie, the `/pricing`
  RegionNotice with its email capture, both API `region_unavailable`
  refusals, the webhook billing-country backstop, and the synthetic-check
  403 probe. EU/UK visitors can complete checkout the moment this deploys,
  which makes the obligations this tier deferred live from the FIRST EU/UK
  sale:
  1. Configure Stripe Tax in the dashboard (origin address, product tax
     code, registrations), then flip `STRIPE_TAX_ENABLED`. Until that flip,
     EU/UK sales settle with NO VAT collected while the liability accrues
     at the buyer's local rate.
  2. Non-Union OSS registration plus the separate UK VAT registration.
  3. Art. 27 representatives (EU and UK) per the advisor entry below.
  4. The `region-blocked` waitlist rows were promised exactly one email
     when purchases open; send it.
  5. Retire any Sentry alert built on `payments.geo-backstop`; the source
     no longer exists and the alert can never fire again.

- [ ] (OPERATOR) **Engage a US advisor, and pick the launch market scope.**
  Rewritten 2026-08-23 now that the entity is decided (US LLC). Two things
  to settle, and they are separable:
  (a) **Market scope at launch.** Sell to EU/UK from day one, which means
  non-Union OSS plus a UK VAT registration plus two Art. 27
  representatives before the first sale, or geo-gate EU/UK checkout and
  defer all four until volume justifies them. For a US seller with no
  threshold cushion in either market, the geo-gate is the cheaper opening
  move.
  (b) **The advisor.** A US CPA or tax counsel who has actually handled
  non-Union OSS and UK VAT for a US seller of digital services, not a
  generalist. Fee analysis: `roadmap.md` §4.
  Note geo-gating does not exist in code: the checkout path has no country
  restriction, so choosing it means writing it. Scope it as billing-country
  detection at checkout plus an explanatory state on `/pricing`, and expect
  it to need its own test coverage on the money path.
- [ ] (OPERATOR) **Tax handling: code is written but switched OFF.**
  Verified 2026-08-20. `taxSessionParams()`
  (`apps/api/src/routes/payments.ts:47-53`) wires `automatic_tax`,
  `tax_id_collection` and `invoice_creation` (`billing_address_collection`
  was hoisted OUT of that helper on 2026-08-23 so the buyer's country is
  captured whether or not the tax flag is on),
  and is spread into both checkout sessions (`:282`, `:426`). But it returns
  `{}` unless `STRIPE_TAX_ENABLED === "true"` (`:48`), and that var ships
  empty (`apps/api/.env.example:17`). **At repo defaults, zero tax is
  collected**, so the R2-4 exposure is live even though the code exists.
  **Rescoped 2026-08-23 by the launch-before-LLC decision.** With EU/UK
  checkout geo-gated, EU VAT and OSS drop out of the launch path entirely,
  so this entry is no longer blocked on OSS registration.
  **But US-only is not tax-free, and that is the trap in this rescope.**
  Digital-goods taxability varies by state, and home-state nexus applies
  from the first sale with no threshold to hide behind, so whether tax is
  owed depends on which state the owner sells from. Confirm that with the
  US advisor before assuming the flag can stay off. If the home state taxes
  digital products, the sequence is unchanged in shape: Stripe dashboard Tax
  setup, then register in that one state, then set `STRIPE_TAX_ENABLED=true`
  and redeploy. The 0.5% Stripe Tax fee on a single-state registration is
  the cheap version of this problem.
  Original remaining work, for when EU/UK opens at the gate:
  Stripe-dashboard Tax setup, OSS registration, then set
  `STRIPE_TAX_ENABLED=true` and redeploy.
  **Migration 047 is confirmed applied** (2026-08-20, ledger IN SYNC 59/59),
  so one hazard is formally retired: R3-2 warned that deploying the current
  `payments.ts` before 047 would 500 every `checkout.session.completed`
  upsert and leave customers charged with no access. The tax columns exist
  in production, so flipping the flag is now a dashboard and redeploy step
  with no ordering trap in front of it.
- [x] Refund terms - **RESOLVED in code 2026-07-25 (wave 3):** the
  20%-accessed condition is dropped from terms/pricing/FAQ; refunds are an
  unconditional 14 days via support@. Advisor sanity-check remains part of
  the general terms review, but no waiver mechanism is needed anymore.
- [ ] (OPERATOR) **Form the US LLC. GATED: at 500 users with proven market
  need, per the owner decision of 2026-08-23, NOT before launch.** Added as
  its own entry because the decision and the formation are different things
  and only the first is done. What downstream work needs from it: the registered
  legal name, a registered agent or virtual business address that is safe
  to publish, an EIN, a business bank account, and the Stripe account moved
  to or opened under the entity. Until it exists, five entries below cannot
  close, and any sale made in the meantime is made by an individual, with
  the disclosure consequences described in the decision note above.
  When the gate opens, revisit merchant-of-record at the same time: the two
  decisions interact (see item 4 of the decision note).
- [ ] **EU/UK checkout geo-gate: CODE DONE 2026-08-23, three steps left.**
  Built after the owner chose to gate rather than sell into the EU/UK or
  switch to a merchant of record.
  **Shipped in this working tree (all tested, all suites green: api 268,
  web 620, shared 45, content 413, typecheck 10/10):**
  (a) `billing_address_collection: "required"` hoisted OUT of
  `taxSessionParams()` so the buyer's country is captured whether or not the
  tax flag is on (2 tests).
  (b) `VAT_GATED_COUNTRIES` + `isVatGatedCountry()` in `@tensorcraft/shared`,
  the 27 EU states plus GB, failing OPEN on an absent or `XX` country
  (6 tests).
  (c) API refuses `/checkout` and `/guest-checkout` with 403
  `region_unavailable` when Cloudflare's `CF-IPCountry` is gated, asserting
  no Stripe session is created, since a created session is a payable link
  (4 tests).
  (d) `RegionNotice` on `/pricing` replacing the buy button with an
  explanation plus email capture against source `region-blocked` (4 tests),
  fed by a middleware cookie so the statically rendered page stays static
  (5 tests).
  **What is left:**
  1. ~~Apply migration 060~~ **DONE 2026-08-23** (see Tier 1-OPS). The
     capture writes `region-blocked`, which the new shape constraint accepts,
     so the notice will record blocked demand as soon as the code deploys.
  2. **Deploy both halves.** The API gate is the enforcement and the web
     cookie is only presentation, so shipping the web half alone leaves
     purchases open.
  3. ~~Add the webhook backstop~~ **DONE 2026-08-23.** The webhook now reads
     `customer_details.address.country` on settle and captures a Sentry event
     when it is a gated region, since the edge gate is defeated by a VPN and
     Stripe's billing country is the one piece of ground truth. It flags and
     does not act: the money has already moved, and auto-refunding on a
     billing address is a worse failure than a human reviewing a rare event.
     The purchase is recorded either way, because withholding access from
     someone who paid is the bigger error. 3 tests. Original text: check
     `customer_details.address.country` on `checkout.session.completed` and
     flag or refund what slipped through a VPN. Deliberately deferred as the
     hardened layer; the country is now always collected, so no further
     change is needed to enable it.
  ~~Also add the country restriction to `/terms`~~ **DONE 2026-08-23:** §4
  Purchases now states that purchases are available to US buyers only, and
  that EU and UK visitors can still create a free account, read the free
  module, and ask to be told when paid access opens. That last clause is what
  makes the notice's email capture honest rather than a dead end.
  **Original scoping note, and the blocker it named, now fixed:**
  `billing_address_collection: "required"` currently sits INSIDE
  `taxSessionParams()` (`apps/api/src/routes/payments.ts:47-55`), which
  returns `{}` while `STRIPE_TAX_ENABLED` is unset. So today Stripe collects
  no billing country at all, and a geo-gate has nothing to verify against
  after the fact. Hoist `billing_address_collection` out of the tax-gated
  block so it applies unconditionally. That is a one-line change on the
  money path and needs its own test.
  **Then three layers, because an IP check alone is not enough:**
  (1) UI: the web layer knows the country from Vercel's
  `x-vercel-ip-country` (middleware already runs), so render an
  explanatory state instead of the buy button, and capture an email against
  a `region_blocked` source so the demand is measured.
  (2) API: refuse session creation for EU/UK, since the Fly host has no geo
  header of its own and must not trust a client-supplied country.
  (3) Webhook: check `customer_details.address.country` on
  `checkout.session.completed` and flag or refund anything that slipped
  through. VPN traffic makes this a real path, not a theoretical one.
  Add the country restriction to `/terms` in the same change.
- [ ] (OPERATOR) **Get a virtual business address or PO box.** New
  2026-08-23. Independent of LLC formation and unblocks the CAN-SPAM
  postal-address entry below for the digest that is already sending. A USPS
  PO box or a commercial mail-receiving agency address is acceptable for
  CAN-SPAM. This is also the address that goes on `/terms` and `/privacy`
  under the trading name, which is what keeps a home address off the site.
- [ ] **Legal entity + address still open; JURISDICTION DONE 2026-08-23.**
  Terms now carries a governing-law section (§11): Delaware law, Delaware
  courts, with an explicit carve-out stating it does not remove the mandatory
  protections of EU and UK consumer law, which a choice-of-law clause cannot
  waive. Covered by `e2e/legal.spec.ts`.
  Still open and blocked on the LLC and the mailbox: the published entity
  name and the postal address. The accepted-risk note above already settles
  what goes in the meantime (trading name, no natural person named).
  Original text follows. Re-verified 2026-08-20 and still fully open.
  `apps/web/app/terms/page.tsx` has no entity, no address and no
  governing-law section anywhere in its ten sections;
  `apps/web/app/privacy/page.tsx:55-59` carries an explicit code comment
  marking the GDPR Art. 13(1)(a) hole and names only bare "Tensorcraft".
  This is the blocking decision described above.
- [ ] **Send a real receipt/invoice on purchase. RECEIPT BUILT 2026-08-23,
  needs deploying; the invoice half is still open.**
  Built on **Resend, deliberately not Kit**: Kit's credentials 401 (see
  Tier 1-OPS), and a receipt is the legally expected artifact of a payment,
  so it must not sit behind an integration that is currently dark. Resend was
  already wired and sending (digest, issue notifications).
  `sendPurchaseReceipt` (`apps/api/src/lib/email.ts`) inspects Resend's
  `{data, error}` result rather than assuming a throw (the F1 lesson), bounds
  its own wait so a hung mailer cannot hold the Stripe webhook past its
  timeout, and never throws. Wired into BOTH settle paths inside the existing
  dedupe guard, so it inherits the two-layer dedupe instead of inventing a
  third: the sync path and `async_payment_succeeded`, the latter being where
  delayed methods (SEPA, bank debit) settle. 10 tests.
  **Two defects found while building it, both fixed:** the buyer's email was
  looked up INSIDE the Kit try block, so a Kit failure (the current state)
  would have skipped the receipt too; and the webhook 500'd when the receipt
  rejected, turning a successful payment into a Stripe retry. The lookup is
  now shared and each sender has its own failure domain, and the call site is
  guarded independently of the helper's contract.
  **Also worth knowing:** `async_payment_succeeded` had NO test coverage at
  all before this, and the admin-client `profiles` mock returned a bare null,
  which had made both the receipt and the pre-existing Kit tag unreachable in
  tests. Both fixed.
  **Remaining:** deploy the API, and decide the invoice half, which is
  unreachable while `STRIPE_TAX_ENABLED` is unset. Original text follows.
  Verified 2026-08-20: still fully open. The only purchase-time email action is a Kit tag
  (`apps/api/src/routes/payments.ts:873-875` and the async duplicate at
  `:1196-1198`); no receipt email template exists anywhere
  (`apps/api/src/lib/email.ts` sends issue notifications only). The
  on-screen receipt at `apps/web/app/dashboard/purchase-success/page.tsx`
  is not an email. Two independent halves: the Kit receipt automation
  (dashboard, Tier 1-OPS) and the Stripe invoice half, which is unreachable
  while `STRIPE_TAX_ENABLED` is unset.
- [ ] (OPERATOR) **Postal address: PLUMBING BUILT AND FAIL-CLOSED
  2026-08-23, waiting only on the address itself.** The owner deferred
  acquiring one. That is safe because the digest has NO scheduled trigger:
  the weekly cron only scrapes news for curation, and a human sends from
  /admin/digest, so nothing has gone out without an address.
  Rather than leave a trap for whoever clicks send first,
  `sendDigestNewsletter` now **refuses to send** when
  `NEWSLETTER_POSTAL_ADDRESS` is unset, returning
  `blockedReason: "missing_postal_address"`. Dry runs still work, since they
  mail nobody. When set, the value renders in both the plaintext and HTML
  footers. 3 tests.
  **This cannot affect selling**: the guard lives in the digest sender only.
  The purchase receipt is a separate function and is transactional, so
  CAN-SPAM's address requirement does not apply to it.
  **To close:** a PO box or virtual mailbox (neither needs the LLC, and
  neither exposes a home address), then set the env var. Original text
  follows. Verified
  2026-08-20: the plaintext footer is one unsubscribe line
  (`apps/api/src/lib/newsletter.ts:119`) and the HTML footer is
  read-on-web plus unsubscribe (`:167-171`). No postal-address constant or
  env var exists anywhere in the repo to inject.
  **Unblocked 2026-08-23:** this no longer waits on the entity. It waits
  only on the virtual mailbox entry above, since CAN-SPAM accepts a PO box
  or a commercial mail-receiving agency address and does not require a
  registered company. Once the address exists this is a small repo change:
  add the constant plus an env var, inject into both the plaintext and HTML
  footers, and cover it with a test. The digest is already sending, so this
  is live non-compliance today rather than a pre-launch task.
- [x] Waitlist consent fix (code) - **DONE 2026-07-25.** Migration 050 flips
  the column default to false; `submitWaitlist` takes an explicit
  `subscribeToDigest` flag that only the newsletter modal passes, so the
  digest sender's `subscribed = true` filter now selects exactly the
  consented set. OPERATOR DECISION remains: whether to un-enroll the
  pre-050 auto-enrolled rows (one-line SQL in the migration header).
  **Two things found 2026-08-20 that make this urgent rather than tidy.**
  (1) No surface anywhere passes `subscribeToDigest: true` (verified across
  all three callers, and stated in the docstring at
  `apps/web/lib/waitlist.ts:19-29`). So the digest's recipient set today is
  *exactly and only* the pre-050 auto-enrolled legacy rows: the weekly
  digest currently mails the non-consented cohort and nobody else, and the
  Settings toggle cannot add anyone to it. (2) The remediation SQL in the
  050 header is stale: it filters `source not in ('theme-selection')`, but
  migration 058 renamed theme to world and the live call site now writes
  `"world-selection"` (`apps/web/app/worlds/newsletter-modal.tsx:50`).
  Running it as written would not match the rows you intend.
- [x] Self-serve account deletion (code) - **BUILT 2026-07-25.**
  `POST /api/profiles/delete` (typed-DELETE confirmation, ESP cleanup,
  waitlist rows removed by email, auth user deleted) + real Settings flow.
  **Requires migration 056** (purchases FK → ON DELETE SET NULL) so tax
  records survive erasure unlinked (Art. 17(3)(b)) - **056 APPLIED to
  production 2026-07-25** (same session-day as the build; ledger IN SYNC
  56/56), so this is clear to ship.
- [x] GDPR data export (code) - **BUILT 2026-07-25.**
  `GET /api/profiles/export` returns a JSON attachment (account + all 12
  user tables + waitlist rows by email; the GitHub token is disclosed but
  never exported - it is a live credential); Settings has the download
  button. Re-verified 2026-08-20: the loop now covers **14** tables, not 12
  (`arena_submissions` and `issues` were added 2026-08-16).
  STILL OPEN, both confirmed still missing: the DSAR runbook with its
  30-day clock does not exist anywhere (the only "DSAR" hits in the repo are
  this entry and the original finding), and the contact address is now split
  three ways rather than two: `privacy@` on /privacy, `legal@` on /terms,
  and `support@` in the Settings deletion and export flows.
- [x] Vercel Analytics consent gating (code) - **DONE 2026-07-25.**
  `ConsentGatedVercelAnalytics` renders nothing pre-consent and drops
  queued events via `beforeSend` after a withdrawal.
- [x] Consent withdrawal path (code) - **DONE 2026-07-25.** Sitewide
  "Cookie settings" footer control clears the consent key, re-shows the
  banner, and flips every consent gate off in-tab (Art. 7(3)).
- [ ] **Privacy-page Art. 13 gaps: 4 of 6 closed by the 2026-08-16 rewrite,
  3 still open.** Re-verified line by line 2026-08-20.
  CLOSED: lawful basis per purpose (§3), international transfers with
  DPF/SCC safeguards (§7), complaint right (§10).
  **Waitlist retention CLOSED 2026-08-23** (owner approved the default):
  §9 now states waitlist and newsletter emails are kept until unsubscribe or
  24 months without engagement, whichever comes first.
  STILL OPEN: controller identity (no longer an open question as of
  2026-08-23, just gated on LLC formation: the controller is the LLC);
  **Art. 27 EU/UK representative**, which the policy does not mention at
  all and which US establishment turns from a question into a requirement,
  in both the EU and the UK, unless the narrow Art. 27(2) exemption is
  confirmed to apply (do not assume it does, and note the geo-gate option
  above avoids both appointments); and **waitlist retention**, which §2 collects but §9 never gives a
  period for.
  Also open and narrower than the original wording: §7 names US-processing
  providers generically but does not name Supabase, so "EU personal data on
  US-hosted Supabase" is only addressed in the abstract. Confirm the
  Supabase project region and name it.
- [ ] **Sub-processor list + DPAs: the list is done, no DPA is signed.**
  Re-verified 2026-08-20. The list half is CLOSED: /privacy §5 now
  enumerates twelve processors including Resend (correctly described as the
  digest sender) and Vercel. The DPA half is untouched: all six boxes in
  the "DPA execution checklist" at `docs/privacy-compliance.md:87-101` are
  unchecked, the processor table marks "DPA required: Yes" for all ten, and
  no executed-DPA artifact exists in the repo. One checklist line there
  ("Add PostHog + Sentry to the privacy Sub-processors section") is in fact
  already done and can be ticked now.
- [ ] (OPERATOR) **Confirm (don't assume) the EAA microenterprise
  exemption** with the advisor - the accessibility-statement obligation has
  applied to e-commerce since 2025-06-28. Verified 2026-08-20: no
  accessibility statement page or route exists. Note the exemption turns on
  headcount and turnover of a legal entity that does not exist yet, and
  that the repo's a11y coverage is desktop-chromium only, so a conformance
  claim is not currently evidenced.
- [x] **Guest-checkout copy corrected 2026-08-23.** Both pages described a
  flow the product does not offer. /terms §3 now says purchases require an
  account, and /privacy §2 drops the "if you buy without an account we create
  one" sentence. Snapshots updated. Original finding follows.
  Found 2026-08-20 during the
  reconcile, not previously tracked: /privacy §2 and /terms §3 both
  describe guest checkout as a live flow, but it is disabled
  (`apps/web/app/pricing/checkout-button.tsx:66-83`: the endpoint exists on
  the API but nothing routes to it). Shipped legal copy should not describe
  a flow the product does not offer.
- [ ] **Privacy-page data-inventory update (R3-8): mostly closed, one real
  gap left.** Re-verified 2026-08-20.
  DONE: billing country + VAT id are disclosed (§2); arena `submitted_code`
  is disclosed and covered by the §9 learning-data rule; the "30-day
  removal" versus ten-year VAT retention conflict is resolved in copy (§9
  carries the carve-out) and genuinely implemented in code
  (`apps/api/src/routes/profiles.ts:346-349` with migration 056's
  `on delete set null`).
  ~~STILL OPEN: `stripe_customer_id` is stored and returned in the data
  export but disclosed nowhere~~ **CLOSED 2026-08-23:** /privacy §2 now
  discloses "the customer reference Stripe assigns you", described in plain
  terms rather than by column name. Separately, the ten-year figure is currently an assertion in
  shipped copy with no jurisdiction behind it; the advisor should confirm
  it for the eventual establishment country.
- [x] **GitHub integration disclosure (R3-8)** - terms side **DONE
  2026-07-25**: new Terms §6 "GitHub Integration" (public-by-default
  repos, token storage + removal on disconnect, code ownership);
  consent-moment disclosures were already added in wave 3.
  Re-verified 2026-08-20: the overclaiming "industry-standard OAuth 2.0 /
  PKCE" line is GONE from the rewritten policy, which now makes no security
  claim about the token. STILL OPEN underneath it: `profiles.github_token`
  is stored plaintext and is browser-readable through the row-level RLS
  policy (Tier 2 encryption item), and neither /privacy nor /terms §6 tells
  the user the token is unencrypted.

---

## Tier 2 - Fix in week 1, before spending real money on ads

Not launch blockers. Each one wastes acquisition spend if left.

> **Reconciled 2026-08-20.** Before this pass every entry in this tier was a
> prose bullet, so a reader building a worklist from `- [ ]` saw none of it.
> All entries are now checkboxes. Four were verified DONE and one was found
> to be describing a feature that already shipped; the rest were re-verified
> against current code and several had their sub-items corrected.

- [ ] **First lesson auto-play: AFFORDANCE FIXED 2026-08-23, scene kept by owner decision.** The complaint was never the story, it was being trapped in it. Fixed: Skip is now a real control ("Skip intro", `text-xs`, 44px min target, `--tc-border-interactive` which clears 3:1) instead of a 10px label on a decorative border; and a learner who skips once is not auto-played at again, remembered in `localStorage` through `lib/script-preference.ts`. Every storage access is guarded, because this API throws SecurityError when site data is blocked and an unguarded read once white-screened the whole site. "Replay scene" still exists, so the scene is never unreachable. 5 tests. **Still open:** the scene itself is unchanged at ~15.5s for a first-time visitor, which is a deliberate product call, not an oversight. Original finding: the page is functionally blank during playback, escapable only via a `text-[10px]` "Skip" control. This is the activation moment for the entire product, and it is the destination of the landing page's primary CTA. Re-verified 2026-08-20: `lesson-steps.tsx:1357` still auto-plays on first visit, per-beat hold is 800-3200ms so 6-8 beats lands in the 15s band, and the Skip control is still `text-[10px]`. The only other escape is `prefers-reduced-motion`.
- [x] **Guest email capture: SHIPPED.** Corrected 2026-08-20; this entry said "no email capture for guests anywhere in the free module", which is no longer true. `guest-email-capture.tsx` renders for guests only and is mounted in the lesson flow behind `isFreeModule` (`lesson-steps.tsx:1757`). Rows land with `subscribed` false per migration 050, so capture does not imply digest consent.
- [x] **Mobile editor type: CLOSED 2026-08-23, 16px shipped WITH the scroller focus fix. B9.** Both Sandpack themes now set 16px (clears the iOS auto-zoom threshold), and the Exercise component makes `.cm-scroller` keyboard-reachable. Root cause of the earlier failure, found in the packages themselves: CodeMirror's constructor sets `scrollDOM.tabIndex = -1`, and Sandpack additionally sets `tabindex="-1"` on the contenteditable surface (its keyboard pattern is Tab to the wrapper, Enter to enter the editor), so once the 16px type overflowed the 400px box the scroller was a scrollable region with nothing focusable inside it: axe `scrollable-region-focusable`, serious, both schemes. A MutationObserver-backed effect in `packages/ui/src/mdx/exercise.tsx` overwrites the scroller to `tabindex="0"` with `role="group"` and an aria-label, and re-applies when Sandpack recreates the editor (theme swaps). Browser-verified locally: both Challenge-step axe audits pass, and `e2e/exercise-run.spec.ts` ("Exercise editor keyboard access") now pins the attribute contract so a Sandpack or CodeMirror upgrade that drops it fails by name, not only in the axe sweep.
  **History:** the first attempt (same day) shipped the size bump alone and was reverted when CI caught the axe violation; no local test could, because it needs a real browser to lay out. Still open in this area: no axe run at any mobile viewport, and all non-axe e2e is dark-only via the global `colorScheme: "dark"` pin. Original finding:
  **Mobile: code editor sets 13px type**, below the iOS 16px auto-zoom threshold. Re-verified 2026-08-20: still `size: "13px"` in BOTH Sandpack themes (`packages/ui/src/mdx/exercise.tsx:174` dark, `:205` light). Also still true: no axe run at any mobile viewport (`e2e/accessibility.spec.ts` runs only in the chromium project, which excludes the mobile specs), and all non-axe e2e is dark-only via the global `colorScheme: "dark"` pin (`playwright.config.ts:32`). **Corrected:** the "no mobile affordance past the exercise gate" clause is stale, the mobile pane toggle exists (`lesson-steps.tsx:820`).
- [ ] **Indexability: the CLOAKING half is FIXED 2026-08-23, the word-count half is a design question.**
  **Fixed:** the lesson body shipped at `opacity: 0` and `display: none` because the scene rules hide content while `[data-script-state="playing"]` and first-visit SSR ships in exactly that state, so a client that never runs JS never saw it revealed. `NoscriptReveal` now emits a `<noscript>` override in the initial HTML. 4 tests, run through the SERVER renderer on purpose: React drops `<noscript>` children on a client render, so a normal RTL test would have passed against an empty element and proved nothing.
  **Not fixed, and deliberately not faked:** only the current step is in the DOM, so the page carries roughly 100 words even after JS runs. The obvious workarounds are worse than the problem. Server-rendering all six steps hidden with `display: none` gets them discounted anyway, and a crawler-only text block is cloaking, which is the thing we just fixed. The real fix is a rendering decision about whether free-module lessons present their full prose, and it wants an owner call rather than a patch. Original finding:
  **Lessons ship ~100 indexable words** (only the current step is in the DOM) and require JS to render at all, with no `<noscript>`. Re-verified 2026-08-20: zero `noscript` anywhere in `apps/web`, and exactly one of six steps renders because `currentStep` is client state. Large organic-acquisition loss for a content-led product.
- [x] **SEO/metadata + funnel polish: ALL FOUR now closed**, the last one ("Continue M1" pointing backwards) on 2026-08-23. Original entry: **SEO/metadata + funnel polish: ONE sub-item left of four.** Re-verified 2026-08-20 and this entry was badly out of date. **Now fixed and struck:** the og:url shallow-merge drop (all four surfaces, world detail / lesson / `/learn` / capstone, now declare full `openGraph` and their own `twitter` block); the `PreOrder` emission (gated bundles are filtered out of the catalog entirely, `PreOrder` survives only in a comment and a negative test); and both "duplicate `Course` JSON-LD" and "`price: 59` in two places" are **not reproducible** (the launched and coming-soon Course emitters are mutually exclusive because the page early-returns, and the price has a single source in `packages/shared/src/constants.ts:101`).
  ~~Still genuinely open: a guest who finishes module 1 sees "Continue M1" pointing backwards~~ **FIXED 2026-08-23, and the diagnosis in this entry was wrong.** It was not a precedence problem. It was a PARTIAL state: `activeModule` matched module 1 because its STATUS was still `active`, while `activeLesson` was undefined because every lesson inside it was complete. The label branch tested only `activeModule` (so "Continue M1"), the href branch tested both, fell through, and landed on the module root. A second guard hid it further: `completedModuleCount > 0` counts module STATUS, which reads zero in exactly this state, so the paywall branch could not fire even once `!activeModule` was satisfied. Fix: the CTA logic moved to `apps/web/app/worlds/[slug]/continue-cta.ts` (same extraction pattern as `course-jsonld.ts`, so it is testable outside a server component), "active" now requires a module to still have a remaining lesson, and the progress guard keys off completed LESSONS rather than module status. 6 tests, including the paywall case and a guard that a purchaser is never routed to buy what they own.
- [ ] **Load test before ad spend** (gap found 2026-07-22 - no audit dimension
  covered it): nobody has ever pushed the payment path, the SSR lesson
  route, or the Stripe webhook handler under concurrency. Gates 2/3
  explicitly precede buying traffic; measure before spending.
- [x] **Support workflow: WRITTEN 2026-08-23.** `docs/support-runbook.md` covers the response-time target, refund processing (including that the terms are unconditional 14 days and that the webhook handles the status change, so never touch the database), the dispute and chargeback evidence workflow with the `restore_purchase_after_dispute` trap on a won dispute, access problems, privacy requests and their 30-day clock, and the known escalation traps. Original finding: **Support workflow** (2026-07-22): support@ is a mailbox, not a process.
  Re-verified 2026-08-20: `docs/` contains a digest runbook and a migration
  runbook, and nothing for support or refunds.
  Write the refund-processing runbook (exact Stripe steps), the
  chargeback-evidence workflow, and a response-time target before launch
  week fills the inbox.
- [x] ~~Story-skip instrumentation missing~~ - **DONE 2026-07-25**, re-verified 2026-08-20:
  `script_skipped` fires from the Skip control with exactly the four
  documented fields (`lesson-steps.tsx:1406-1414`), and is covered by a test.
  The ">40% skip triggers narrative redesign" rule is computable from day 1.
- [ ] (OPERATOR) **Uptime monitoring + status page.** Re-verified 2026-08-20,
  and this is the single most consequential gap in this tier: it is the
  failure mode that let the API certificate expire unnoticed for weeks in
  July, killing every browser-to-API call.
  What exists: `/api/health` (liveness, static JSON) and `/api/health/ready`
  (readiness, real DB check, 503 on failure), correctly split at
  `apps/api/src/routes/health.ts`. What does NOT exist: any external
  observer. Both current probes are self-probes from inside the host
  (`apps/api/fly.toml` `[checks.health]` every 10s, and a Dockerfile
  `HEALTHCHECK` hitting localhost), which is exactly the case that cannot
  report down-and-silent. No workflow pings a URL on a schedule, and no
  status page route exists.
  Cheap to close: `/api/health` is already exempt from rate limiting
  (`apps/api/src/middleware/rate-limit.ts:95`), so an external monitor can
  poll it freely. Point one at the web root, at
  `https://api.tensorcraft.app/api/health/ready`, and at the Stripe webhook
  path. Sentry alert rules (Tier 1-OPS) cover errors, not silence.
- [ ] **Mobile/a11y residuals.** Re-verified 2026-08-20. Confirmed FIXED and struck: `pending-poller` (its `role="status"` region is always mounted) and the `--tc-border-interactive` token, which exists in both schemes and is in real use. **BOTH CLOSED 2026-08-23.**
  (a) The challenge-passed banner no longer mounts `role="status"` with its own content. Extracted to `challenge-passed-banner.tsx` (same pattern as `continue-cta.ts`, so it is testable outside the 1800-line lesson component): the live region is always mounted and only its TEXT changes, while the visual banner stays conditional, since an empty bordered box would be nonsense to sighted users. Splitting the two is what lets both audiences get the right thing. 5 tests.
  (b) The three named interactive controls now carry `border-interactive` instead of the decorative `border-border`: the landing final CTA, the scheme toggle, and the poller's support link. The nav snapshot was updated deliberately.
  **Note for the next e2e run:** this changes real pixels on the landing page and in the nav, so the Playwright visual baselines will need re-minting. Unit and snapshot tests are green; the visual baselines were not re-minted here because that needs a browser run.
  **Still open:** the unselected picker toggle was NOT changed. `checkout-button.tsx:167` is a DISABLED control, and disabled controls are exempt from WCAG 1.4.11, so recolouring it would be wrong rather than merely unnecessary. If the entry meant a different toggle, it needs a specific selector. The 3.99-4.23:1 overlay-contrast claim needs a rendered run and could not be settled by reading. 13px editor type and mobile axe are in the bullet above.
- [ ] **Security mediums from the audit register.** Re-verified 2026-08-20; one improved, three unchanged, one unverifiable.
  - **Rate-limit bypass: reduced, NOT closed, and the code comment overstates it.** Identity is now keyed first off a hash of the bearer token, which cannot be spoofed by rotating a header. But the anonymous fallback still reads `cf-connecting-ip` first with **no Fly origin lock** (`apps/api/src/middleware/rate-limit.ts:124`), so unauthenticated traffic hitting the Fly hostname directly with a rotated header still mints unlimited buckets. The comment at `:113-115` describes the bypass in the past tense; correct it along with the fix.
  - **CSP: comment CORRECTED 2026-08-23, and "removable" splits three ways.** The old comment blamed both directives on "Next.js hydration", which made the line look immovable. Accurate now: `script-src 'unsafe-eval'` is genuinely required (PostHog's loader evaluates at runtime). `script-src 'unsafe-inline'` is NOT a Next.js requirement, Next supports nonces; it is there because we have no nonce plumbing, which needs middleware to mint a per-request nonce and MUST be verified in a real browser, since getting it wrong blocks every inline script and white-screens the site. **`style-src 'unsafe-inline'` is effectively required and is the part this entry wrongly implied was removable:** the codebase styles heavily through inline `style={{ ... }}` attributes, which that directive governs, so removing it unstyles the product. Left in place deliberately rather than guessed at.
  - ~~`POST /api/github/token` still accepts any caller-supplied token~~ **FIXED 2026-08-23, route kept rather than deleted.** Deleting it was not actually a live option: Supabase exposes `provider_token` only at GitHub sign-in and never stores it, so the web session listener posting it here is the only way the product can ever hold that token. The route is now bound to the caller against two independent sources, in order of authority: the caller's GitHub auth identity (which they cannot forge), then the login already stored on their profile, so an account connected to one GitHub user cannot be re-pointed at another. Mismatch answers 403 and writes nothing. Both lookups are read defensively and a first connection with no prior identity is still allowed, so an unexpected provider metadata shape cannot lock legitimate users out of connecting. Matching is case-insensitive, since GitHub logins are.
    **Second bug found by the test written for the first:** `getGitHubUsername` THROWS on a 401 rather than returning null, and the route did not catch it, so posting an expired or revoked token answered 500 instead of the 400 the route intends. Also fixed. 6 tests, two of which fail against the old code by returning 200 where a 403 belongs.
  - **Waitlist has no route-scoped limiter and no captcha.** It falls back to the global 60/min keyed on the spoofable anonymous identity above.
  - ~~skill_events child-partition RLS check: still not run~~ **RUN 2026-08-23, clean on two independent grounds.** Probed live with the ANON key, which is the actual threat model: `skill_events` (parent) answers 200 with **0 rows**, so RLS is enforced rather than bypassed; and the child partitions are not reachable through PostgREST at all, answering `PGRST205 Could not find the table` because partition children are not in its schema cache. An anonymous HTTP client therefore cannot read them by either route. Worth keeping as a note: this was verifiable in one read-only query the whole time, and had been carried as open since 2026-07-22.
- [ ] (OPERATOR) **Unsubscribe propagation: BOTH DIRECTIONS BUILT
  2026-08-23. Needs two Vercel env vars to take effect.**
  **Outbound (we tell Kit) is built via option 1**, the owner's choice: the
  web handlers flip `waitlist.subscribed` as before, then relay the address
  to a new `POST /api/email/unsubscribe` on the API, which owns the Kit
  client. The relay is strictly best effort and runs AFTER the flip, so it
  can never turn a successful unsubscribe into the non-2xx that mail
  providers retry, and it no-ops quietly when unconfigured. The endpoint is
  guarded by `ADMIN_API_KEY` (the check was extracted to
  `apps/api/src/lib/admin-auth.ts` and is now shared with the admin routes
  rather than duplicated) and answers identically whether or not Kit knows
  the address, so it cannot be used to enumerate subscribers. 13 tests.
  **OPERATOR STEP: set `API_URL` and `ADMIN_API_KEY` in the Vercel server
  environment** (documented in `apps/web/.env.example`). Until then the relay
  is inert and Kit is simply not told, which is the same position as before,
  not a regression.
  Note the signed-in Settings toggle never needed this: it already
  reconciles Kit tags through `routes/preferences.ts`.
  Original entry follows.
  **Inbound (Kit tells us) is fixed.** The `/api/webhooks/kit-bounce` handler
  used to only log. It now suppresses locally on unsubscribe, complaint,
  bounce or cancelled: `waitlist.subscribed` to false and
  `profiles.weekly_digest` / `email_alerts` to false, matched with `ilike`
  because Kit echoes the subscriber's own casing and a casing mismatch
  between these two tables has bitten this project before. Writes are best
  effort and never 500, since a retry carries no new information and Kit
  would hammer a database that is not answering. Event matching is
  deliberately loose: over-matching costs someone a newsletter they can
  resubscribe to, under-matching means mailing someone who reported us as
  spam. 6 tests.
  **Outbound (we tell Kit) is NOT a code gap, it is a routing choice.** The
  signed-in settings toggle already reconciles Kit tags correctly in
  `apps/api/src/routes/preferences.ts`. What does not reach Kit is the
  EMAIL-LINK unsubscribe, and both handlers for it live in `apps/web`
  (`unsubscribe/one-click/route.ts` and `unsubscribe/page.tsx`) while the Kit
  client and its secrets live in `apps/api`. Three ways to close it, none
  free:
  1. Web calls a new internal API endpoint, best effort after the DB flip.
     Needs `API_URL` + `ADMIN_API_KEY` on Vercel. Keeps RFC 8058 reliability
     intact because the DB flip still happens first.
  2. Web calls Kit directly. Needs `KIT_API_SECRET` on Vercel and duplicates
     the Kit base URL, which is exactly the drift that produced the waitlist
     constraint bug.
  3. Move the unsubscribe endpoint into the API, where the mailer already
     lives. Architecturally cleanest, but it changes the `List-Unsubscribe`
     target on a Gmail and Yahoo compliance path, so it wants its own
     deliberate change window.
  Recommendation: option 1. Original finding follows.
  Core defect CONFIRMED open in both directions 2026-08-20, but two clauses of this entry were stale and are corrected here: `unsubscribeFromAll()` is **not** dead code (account deletion calls it), and a Kit webhook **does** exist (`apps/api/src/routes/webhooks.ts:49`, shared-secret guarded). What is actually broken: the two unsubscribe handlers only flip `waitlist.subscribed` in Supabase and never call `unsubscribeFromAll`; and the kit-bounce handler only logs, performing zero database writes, so a Kit-side unsubscribe or complaint never flips anything. Once the Tier 1-OPS retention automations go live, an unsubscribed address keeps receiving sequence emails. Wire both directions.
- [ ] **No server-side timeouts on Kit, Resend, or Supabase queries.** Re-verified 2026-08-20 by grepping every `AbortSignal.timeout` in the repo: there are exactly 8, all in the GitHub lib. ~~Kit's single `kitFetch` wrapper has no signal~~ **CLOSED 2026-08-23: `kitFetch` now carries `AbortSignal.timeout(10_000)`**, so every Kit call is bounded at one place rather than per call site. 10s rather than the GitHub lib's 15s because the sharpest caller is a webhook handler Stripe will re-deliver if held. This was latent only because the stored credentials 401 instantly; repairing them turns these into real network calls, which is why the bound went in first. 4 tests, three of which are regression guards on the existing swallow-and-return-null behaviour. The purchase-receipt send is also bounded (`withTimeout` in `apps/api/src/lib/email.ts`, 5s). **Resend CLOSED 2026-08-23:** `withTimeout` was extracted to `apps/api/src/lib/with-timeout.ts` and now bounds the digest send and the issue notification as well as the receipt, all at 10s. Both sit on paths where hanging is worse than failing: the digest holds an admin request open, and the webhook gets re-delivered. ~~Still open: no Supabase query has a timeout~~ **CLOSED 2026-08-24: bounded at the two client factories in `packages/supabase/src/server.ts` via a custom `fetch`, so it covers every existing query and every future one. 10s, chosen against the Stripe webhook, the sharpest caller. A caller-supplied signal still wins. 5 tests.** That one is a broad mechanical sweep (`.abortSignal()` on every query) rather than a single wrapper, so it was not attempted here. Upstash has a partial mitigation (a 2s SDK-level timeout on the rate limiter only). The sharpest case is confirmed and worth noting precisely: `apps/api/src/routes/payments.ts:872-875` **awaits** two Kit calls inline in the Stripe webhook handler even though the comment above them says fire-and-forget, so a hung Kit connection stalls the webhook. Re-delivery is fully deduped via the `payment_events` ledger, so the cost is retry noise and delayed fulfilment rather than double-firing. Client-side, seven call sites still bypass `apiFetch` and its 10s abort (settings x4, onboarding, report-issue, capstone).
- [x] **Error-boundary copy: FIXED 2026-08-23.** A transient Supabase fault
  arrives carrying a Postgres SQLSTATE the message map did not recognise, so
  it fell through to `unknown`: "Something went wrong on our end. Try again or
  contact support." A new `service_unavailable` message now covers SQLSTATE
  class 08 (connection exception) plus 53300, 57P01, 57P03 and 57014, and it
  tells the reader to retry instead of writing in. Matched on exact
  five-character SQLSTATEs so an unrelated string beginning "08" cannot be
  mistaken for one. 5 tests. Original finding:
  **Error-boundary copy misattributes DB faults** - a paying customer during a 2s Supabase blip reads "Lesson failed to load / something went wrong on our end" as a content bug. Re-verified 2026-08-20: a DB throw carries no code the message map recognizes, so it falls through to the generic "our end" string, and six sibling boundaries share the pattern.
- [ ] **Fly config drift: machine size FIXED, and the Dockerfile half was MISDIAGNOSED.** 2026-08-23.
  **Fixed:** `apps/api/fly.toml` now declares `[[vm]] size = "shared-cpu-1x", memory = "256mb"`, so the number the Dockerfile already assumes (it caps the V8 heap at 200MB, "80% of a 256MB container") and `docs/infrastructure.md` already quotes is finally declared somewhere rather than asserted in two places and owned by neither.
  **Also fixed:** the image ran `pnpm build`, producing a full `tsc` emit the runner stage never copied. Swapped to `typecheck`, the same tsc invocation with `--noEmit`: identical failure gate, no output nobody consumes. And `package.json`'s `start` script said `node dist/index.js`, which does not run at all; it now matches production.
  **The misdiagnosis:** this entry read the `tsx` runtime as sloppiness. It is structural. The workspace packages export raw TypeScript (`packages/shared/package.json`: `"exports": {".": "./src/index.ts"}`), which plain node cannot load, and apps/api's own emit uses extensionless relative imports that fail ESM resolution. **Verified empirically 2026-08-23: `node dist/index.js` exits 1 with `ERR_MODULE_NOT_FOUND`.** Changing the CMD as this entry implied would have taken the API down on the next deploy.
  **Still open, now correctly scoped:** TypeScript IS transpiled at container start, on the payment path, and closing that is a project rather than a line. Either the workspace packages build to JS and apps/api gains import extensions, or the API is bundled to a single file at build time. Neither is verifiable without a container build, so neither was attempted here.
- [x] ~~Rate limit is 60/min in code, 120/min in both docs~~ - **reconciled 2026-07-25**, re-verified 2026-08-20: code is 60 and all five docs say 60, with no surviving 120 claim. Raising the actual limit remains a product decision if multi-tab 429s show up. **New drift found in passing:** `docs/infrastructure.md:149` still describes a sliding-window algorithm using sorted sets, but the limiter was rewritten to `Ratelimit.fixedWindow` on 2026-08-17. Correct that line.
- [x] **Opacity-dimmed text: the four "below floor" sites were FALSE POSITIVES, checked 2026-08-23.** Every one turned out not to be a text-contrast failure. Three (`auth-form.tsx` x2, `pricing/page.tsx`) are `decoration-text-muted/*`, the underline DECORATION colour on links whose text is full opacity, which 1.4.3 does not govern. The fourth (`pricing-tiers.tsx:72`) is a DISABLED control, which is explicitly exempt. The census that flagged them matched on the alpha pattern without distinguishing text colour from decoration colour or disabled state.
  Not nothing, though: a `/30` underline is the affordance marking those as links at all, so the three decoration alphas were raised to `/60`. Original finding: Re-censused 2026-08-20: **29** alpha-dimmed text sites, and **4 are below the claimed /65 floor** (`components/auth-form.tsx:339` and `:346` at `/30`; `pricing/pricing-tiers.tsx:72` and `pricing/page.tsx:135` at `/40`). The cited fixes do check out (no "Notify me" or ticker `/40` survives). Either re-census and correct the number, or document those four as exempt-class with the reason. The measured 4.96-11.4:1 range needs a rendered run.
- [x] **Lesson body `opacity:0` cloaking: FIXED 2026-08-23** by `NoscriptReveal` (see the indexability entry above). Original finding:
  **Lesson body ships in HTML at `opacity:0`** until JS stamps the beat state - cloaking-adjacent on the primary organic surface (compounds the ~100-indexable-words item above). Re-verified 2026-08-20: `globals.css:323-336` hides unshown beats and sets instructional content to `display: none` while playing, and the file's own comment states that first-visit SSR HTML starts in "playing", so JS is required to reveal the page.
- [ ] **Small UX/cleanup: one item left.** Re-verified 2026-08-20. Now also fixed and struck: ~~broken admin link `admin/digest` → `/learn/...`~~ (now points at `/worlds/...`, with a code comment naming this exact defect), alongside the previously struck root-404 CTA and `.gitignore` items. **Counterfactual debris: DOCUMENTED AS DORMANT 2026-08-23**, which is the second option this entry offered, chosen deliberately. Verified against production: `counterfactual_choices` holds **0 rows**, so dropping it is safe whenever you want it gone. It is deferred because authoring the migration now would leave a PENDING migration, and `deploy-api.yml` gates on zero pending, so purely cosmetic cleanup would block the deploy that carries the receipt and the geo-gate. Nothing about the table costs anything while it sits there: it is empty, its RLS policy is intact, and its presence in the GDPR export list just yields an empty array. Moved to `docs/post-launch-backlog.md` with the exact drop, including the two RPCs, which must be dropped by ARGUMENT TYPES rather than parameter names since 058 renamed the parameters.
- [x] (OPERATOR) **`github_token`: ENCRYPTED AT REST 2026-08-23. LIVE 2026-08-24.**
  AES-256-GCM with a fresh IV per write, authenticated so tampering is detected rather than silently decrypting to garbage. `apps/api/src/lib/token-crypto.ts`, wired at both write sites and all three read sites in `github.ts`. 9 tests.
  **Backwards compatible by design:** the stored envelope (`v1:iv:tag:ct`) is self-identifying, so rows written before this keep working until they are rewritten. Without that, every already-connected account would break the moment this deploys.
  **Degrades honestly:** with no key set it stores plaintext and warns, rather than refusing to store and breaking GitHub sign-in while the variable is still unset. An envelope it cannot open returns null, never the envelope itself, because returning it would send ciphertext to GitHub as a bearer token.
  ~~**OPERATOR STEP: set `GITHUB_TOKEN_ENC_KEY` on Fly**~~ **DONE 2026-08-24**: set from `openssl rand -base64 32`, rolling restart across both machines, health check green through Cloudflare. Key length is not load bearing because `token-crypto.ts:39` SHA-256 hashes whatever it is given into a 32 byte key, so the `-base64 48` in `apps/api/.env.example` is a suggestion rather than a requirement. Tokens written from now on are encrypted; rows written before stay plaintext until rewritten, by design. **Losing the key is recoverable, not catastrophic:** `token-crypto.ts:98` treats an unopenable envelope as disconnected, so the worst case is affected users reconnecting GitHub. No backup of the key is required.
  **On the second half, "block direct column reads":** encryption substantially retires it. A browser `select("github_token")` now returns ciphertext, not a credential. A column-level REVOKE would additionally need care, because the API reads that column through the AUTHENTICATED role on some paths, so revoking would break the product as well as the attacker. Not attempted; the migration would also leave a pending entry blocking the deploy gate.
- [x] ~~Money-path hardening (R3-4)~~ - **all six DONE 2026-07-25** (payments.test.ts 41/41). Partially re-verified 2026-08-20: the sub-claim other entries lean on, webhook dedupe via the `payment_events` ledger, checks out in code and migration 053. The 41/41 figure was not re-run.
- [x] **Journey/new-surface hardening (R3-6/R3-7): both "still open" items are now closed.** Re-verified 2026-08-20. The lesson editor is genuinely single-mount, not CSS-only: `lesson-shell.tsx:22-31` states the pane is single-mount by contract and takes `paneOpenOnMobile`, and the second copy is gone from the caller. The `/journey` `getUser()` nit is moot because the route no longer exists (consolidated into `/worlds` on 2026-08-15). **Note the concern migrated rather than vanished:** `apps/web/app/worlds/page.tsx:110` does a per-request `getUser()` and that file exports no `revalidate`, so the same crawl-cost characteristic now applies to `/worlds`. Tracked as a nit, not a blocker.
- [x] ~~CI hardening (R3-9)~~ - **DONE 2026-07-25**, code side re-verified 2026-08-20: WebKit is installed in CI, and the `migrations` job runs unconditionally and is fail-closed by design. The operator half (adding the two Supabase secrets to GitHub) is external and is tracked in Tier 1-OPS; until they exist the job fails on every push, deliberately.
- [x] ~~No `immutable` cache headers on `/vendor` or `/models`~~ - **stale entry; shipped 2026-07-21**, re-verified 2026-08-20 against `next.config.ts:106-126` (both paths carry `public, max-age=31536000, immutable`).
- [x] ~~Kit automations still unbuilt~~ - promoted to Tier 1-OPS above (2026-07-22). Note the dependency: the unsubscribe gap above becomes user-visible the moment those automations go live.

---

## Pricing re-price follow-ups (2026-08-31)

Source: `docs/audits/pricing-audit-2026-08-31.md` (the re-price decision
record and the trust/content/platform sweeps behind it). Ladder is now
$50 / $90 / $135 / $225 (bundles flat 10% off retail, owner pick). The
audit's verdict: $50 is the correct list price; trust, not price, is the
binding constraint.

- [x] **B0: re-mint the visual baselines for the $50 price text.** Done
  2026-09-02: the price-text drift was already absorbed by an earlier
  mint (a pre-mint check run passed 28/30), and all 30 chromium baselines
  were force-re-minted (`--update-snapshots=all`) to also pick up the
  cookie-banner copy change from the Plausible removal, which sat under
  the 0.001 tolerance on tall pages. Verified with a clean check run
  (30/30) plus a per-pixel old-vs-new diff of all 24 changed PNGs: every
  visible delta is the banner text band, except a theme-toggle
  micro-shift on auth (reproducible) and 97 px of canvas-edge
  antialiasing on worlds-index.
- [x] **B0: terms still say purchases are US-only.** Fixed 2026-09-02:
  the US-only paragraph at `apps/web/app/terms/page.tsx:98-103` is
  deleted, and the matching stale answer in `docs/support-runbook.md`
  ("I cannot buy from here.") now points support at Stripe decline codes
  instead of the removed geo-gate. The standing caveat still holds:
  STRIPE_TAX_ENABLED is off, so EU sales collect no VAT until Stripe Tax
  is configured (Tier 1-LEGAL).
- [ ] **B0: fix `public/llms.txt` overclaims.** It ships publicly and says
  55 lessons / ~22 hours / 295 exercises / "Module 1 of every world is
  free"; disk says 56 lessons, ~29 hours (matches the FAQ), 65 live
  exercises (300 authored), and one launched world. It is a hand-written
  file with no CI pin, unlike every rendered surface; consider pinning it
  to `WORLD_CONTENT` / `EXERCISE_CONTENT` the way the pages are.
- [ ] **B5: checkout trust microcopy.** Nothing at the buy button says
  where the card data goes. Add "Secure checkout via Stripe" plus a
  one-line refund restatement at `CheckoutButton`, and an
  instant-access-after-payment line. (The 5-day badge sits at the top of
  /pricing only.)
- [ ] **B5: make /about and /compare reachable on the buying path.**
  /about (the only page answering "who made this?") has exactly one
  inbound link in the app, from /compare; /compare is footer-only.
  Neither is in the nav.
- [ ] **B3: depth pass on module 2 (`neural-networks`).** Thinnest module
  in the shipped world (~1,087 words/lesson vs the 1,537 average, 1
  derivation drawer, shortest exercises) and it is the first thing a
  buyer sees after paying. Gate on early refund/completion data pointing
  at it.
- [ ] **B9 (owner call first): module summary jargon sweep.** The owner
  flagged the `neural-networks` summary ("Build a classifier one piece at
  a time...") as assuming knowledge the cold JS-engineer audience lacks
  (classifier, activation). Assessment delivered 2026-08-31: spend the
  first clause defining the payoff in the reader's terms. If the owner
  approves a rewrite, sweep the other module summaries for the same
  pattern. These summaries survived the 2026-08-19/20 pre-lesson audits,
  so this reopens a judgment call, not a defect.

**Owner-decision records from the audit, documented, not scheduled:**
the refund window (5 days, cut from 14 on 2026-08-23) is shorter than the
course's own 29 stated hours, and for a product with no testimonials the
window is the trust substitute; extending it is the cheapest
willingness-to-pay lever available, and it reverses a recent owner
decision, so it is owner-only. Naming a person remains rejected
(roadmap §2 P3, identity-privacy rule); the audit records anonymity as
the largest single suppressor of the price that can be charged, without
reopening the ruling.

## Lesson video scenes follow-ups (2026-08-31)

Source: `docs/video-scene-prompts-deep-orbit.md` (paste-ready Flow/Veo
prompts, 56 lessons + 7 epilogues) and the revised
`docs/future-ai-video-scenes.md` status header. Owner decision 2026-08-31:
all written lesson scenes become video scenes, Deep Orbit first, one
10-second clip per lesson, the trailer/learn-film pipeline, the cast ON
CAMERA with faces and expressions (owner ruling 2026-08-31, emotional
connection; the still-art silhouette law stays still-only).

- [ ] (OPERATOR) **Generate the 42 launch clips in Flow** (not 63: the
  2026-09-04 value audit in the prompts doc's Generation plan cut 10
  entries and deferred 11 past launch; the doc's Status lines mark
  them, and every verdict passed a full three-lens adversarial vote).
  RESEQUENCED by owner ruling 2026-09-04 (recorded in the audit doc):
  the launch ships WITH video, so generation starts now in the rebased
  batch order (pilots → module 1 + E1 launch-blocking → modules 2-3 →
  spine → rest) instead of waiting on a pre-clip baseline. The baseline
  kit becomes the launch-window read against the absolute gates (skip
  under 40%, survival floor, completion; conversion recorded, never
  gated at this n).
- [x] **Briefing clip player SHIPPED 2026-09-05** (launch-scoped, all
  contract points): `scene-clip.tsx` renders the silent clip in the
  story slot with the scene still as poster; manifest-gated
  (`apps/web/lib/scene-clips.manifest.ts`, generated by
  `scripts/video/ingest-scene-clips.mjs`) with text-reveal fallback
  everywhere else; honors skip memory + reduced motion (poster + manual
  play); media errors fall back to the still; holdback dial via
  `NEXT_PUBLIC_CLIP_HOLDBACK` (0..1 share of browsers held on the text
  Briefing, sticky per browser, default 0); `briefingVariant` tags the
  script/step events and two new events (`scene_clip_played`/
  `scene_clip_completed`) measure playback; the baseline script splits
  by variant. Operator loop: export raw take as
  `<module>__<lesson>.mp4` → run the ingest script (normalizes to 10.0s
  silent 720p, size-budgeted) → eyeball the normalized file → commit
  the manifest. Prompt helper: `node scripts/video/scene-prompt.mjs
  <id> | --list`. STILL OPEN before real hosting: point --base-url at
  Blob/R2 and upload (until then --publish-local serves from public/,
  the same stopgap as the trailer mp4s in §4). One 8s Veo pass per scene extended to 10s, character + master
  ingredients per the entry's Refs line (3 max), strip native audio. Character identity comes from
  the film: refs are frames cut from the owner's trailer export,
  installed at docs/art-refs/deep-orbit/video-refs/ (flat portraits are
  fallback only; the global-block cast text is transcribed from the
  footage). Face-locking order first, before any batch: 2.5 (Mirza),
  7.2 (Farah), 3.2 (Nazari), 6.4 (Demir); each approved best frame
  becomes that character's reference everywhere after. Sets stay on the
  location masters (the film has no lab, engineering, or dashboard
  set). Rejection rules (identity drift, de-aging, lip movement, camera
  looks, invented crew) and the reroll budget are in the prompts doc.
- [ ] **Comp pass for kit signatures** on flagged entries: alert signal,
  ambiguous reading, interval arc, AI ring states come from the trailer's
  motion-graphics kit, never from Veo, before any clip ships.
- [ ] **Owner review gate per batch**, same as the still-scene pipeline
  (Gate D pattern): eyeball every take against the reject list before
  ingest; no auto-approve.
- [ ] **Build the integration** from `docs/future-ai-video-scenes.md`:
  `<VideoScene>` MDX component with the text fallback, caption timing
  from the existing Dialogue text, lesson schema fields, hosting (R2 or
  Vercel Blob; the backlog §4 item moving the two trailer mp4s off
  `public/` should land first and this follows its choice), Velite
  manifest validation, and tests per the doc's file list.
- [ ] **Accessibility**: captions on by default where the clip replaces
  read text; `prefers-reduced-motion` gets the existing still scene, not
  autoplaying video.
- [ ] **Other worlds** repeat this per world at launch (their scene bibles
  and masters do not exist yet; each world needs its Gate C masters
  first).

## Production log review follow-ups (2026-09-02)

Source: a ~3-hour Vercel log-drain CSV reviewed 2026-09-02. Verdict: no
5xx, no incidents; ~95% of volume is the three BetterStack uptime
monitors (HEAD to /, /pricing, /blog every 5 minutes) plus crawlers.
Real human traffic in the window: 2-3 visitors, one of whom walked
/pricing to the free intro-to-tensors lesson. The one defect found, the
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset; traffic analytics is OFF`
warning firing on live renders, was resolved the same day by removing
the Plausible integration entirely (never wired in prod, redundant with
consent-gated Vercel Web Analytics, confirmed live via its beacon, and
PostHog). Removal touched the component, layout mount, env guard, CSP,
privacy policy, cookie banner, terms of the processor list, and docs.

- [ ] (OPERATOR) **B9: dedupe the BetterStack log drain.** Every request
  line lands 2-4 times in the drain: the proxy line appears to be
  delivered under both the `edge` and `external` sources, on top of the
  separate `lambda` line. Narrow the drain's sources (drop `external` or
  `edge`, keep `lambda`), then confirm in Live tail that one HEAD probe
  produces one proxy line. The drain API calls, ids, and the
  15-competing-drains history are in `docs/observability.md` §Log
  Drains. Cosmetic, but it doubles the volume against the capped free
  tier and makes every future log review noisier.
- [ ] (OPERATOR) **B9: downsize Vercel function memory.** Functions run
  at 2048 MB while peak observed usage is ~293 MB (REPORT lines,
  2026-09-02 window). Flip the project's Function Memory setting in the
  Vercel dashboard to the 1024 MB tier; GB-hour billing halves whenever
  traffic arrives. Dashboard only, on purpose: a `vercel.json`
  `functions` block with a glob that matches nothing hard-fails the
  deploy, and this project already has deploy-gate history
  (`vercel_project_settings_deploy_gate`).

## Lesson-format re-audit follow-ups (2026-09-04)

Source: the re-audit section of
`docs/audits/lesson-format-audit-2026-09-04.md`. The blocking defects it
found were fixed the same evening; these are the items it deliberately
left open.

- [ ] (OWNER CALL) **The Code step is thin for the 42 drawer-less
  lessons**: one framing sentence over code the learner just read
  inline on Concept. Options the audit surfaced: fold to five steps, or
  give the step unique content (per-lesson code annotations, a
  trace-through). Data first: read the Code step's dwell and skip-over
  rates once the baseline runs.
- [ ] **Mastery gate is measured, not enforced**: Show Solution then Run
  Tests still opens the gate and still emits full-weight exercise_pass
  skill events with solutionViewed unchecked. Decide whether earned-pass
  filtering stays analytics-only or gates the genome weighting.
- [ ] **Spaced repetition absent** (flagged twice by learning-science
  passes): no re-surfacing of RecallPrompts across a 56-lesson course.
  Big bet; belongs with the habit-mechanics discussion in §6.
- [ ] **SEO: teaching bodies are display:none to crawlers** on the
  free-module lessons the sitemap markets (the partition cemented what
  was previously a 15s timing window). Check GSC indexing of the five
  free lessons post-deploy; if degraded, server-render the teaching body
  for bots or add a static transcript surface.
- [x] (2026-09-05: all four drawers moved above ## Challenge in content) **Challenge-zone DerivationDrawers render on no step** (4 lessons,
  pre-existing hole the partition did not open): drawers placed after
  "## Challenge" are component-gated off every step. Either move them
  above the Challenge heading in content or extend the partition with a
  zone-aware drawer home.
- [ ] **Dwell is raw wall time**: prevStepMs includes idle/hidden-tab
  time; add a visibility-pause if dwell tails look poisoned in the
  baseline.

## Content quality audit follow-ups (2026-09-05)

Source: `docs/audits/content-quality-audit-2026-09-05.md` (every Deep
Orbit lesson and exercise read end to end; overall B+, foundations track
A-, LLM module B). Nothing was edited during the audit. Items carry the
audit's finding IDs. All B9 unless marked; the Tier 1 items are worth
doing before the next content push because they change what a finisher
can explain.

- [x] **T1.1 No exercise trains a classifier and reads held-out
  accuracy.** `training-loop-exercise` fits a linear unit on four rows;
  `deep-scan-eval` evaluates an untrained model by its own admission.
  Add one exercise in module 3 or 7 (the seeded calm/flagged clusters
  from training-loop/04 are a ready dataset) that trains, evaluates on
  a held-out slice, and grades on reading the train-vs-test gap.
- [x] **T1.2 Module 9 never connects the LLM to module 8's attention.**
  No "attention", no next-token framing, "token" only in a recap
  bullet. One section in llm-integration/01 (next-token prediction,
  tokens, temperature as softmax sharpening) pointing back at
  advanced-time-series/01.
- [x] **T1.3 Attention is permutation-invariant; positional encoding
  never mentioned** (no lesson contains "positional" or
  "permutation"). One paragraph in advanced-time-series/01 or /02, and
  a line saying the hybrid keeps order only because the LSTM encoder is
  still in front.
- [x] **T1.4 What a hidden layer computes is never stated**
  (neural-networks/03 line 49 says "finds patterns"). Two sentences: a
  dense layer is N lesson-1 neurons reading the same inputs; the next
  layer's neurons read those N outputs.
- [x] **T1.5 Logits vs probabilities never reconciled**:
  `tf.losses.sigmoidCrossEntropy` on logits (training-loop/01 line 68,
  /03) vs `loss: 'binaryCrossentropy'` on sigmoid outputs (/04 line
  66). One paragraph plus glossary entries for logit, hyperparameter,
  regularization, validation split, confusion matrix.
- [x] **T1.6 Batch size framed only as memory in foundations/04** (line
  101); add a forward pointer that 32 is also a gradient-noise decision
  (module 3 drawer already explains it).
- [x] **T2.1 Farah contradiction on LSTM memory**:
  recurrent-networks/03 line 59 ("carry the first step at full strength
  all the way to the last") vs advanced-time-series/01 line 46 ("cannot
  hold step 4 at full strength"). Soften one.
- [x] **T2.2 The three input features have two names**: "band energy,
  spectral stability, phase coherence" (training-loop/04 line 69) vs
  "amplitude, frequency, phase" (browser-runtimes/04, signal-processing/04,
  recurrent-networks/05). Pick the second; it is used five times.
- [x] (decided 2026-09-05: keep five classes and teach the head) **T2.3 Classifier becomes five-class inside one
  sentence** (optimization-edge/02 line 46); capstone model card then
  documents five classes. Either stay binary throughout or give the
  widening an honest paragraph naming softmax and categorical
  cross-entropy.
- [x] **T2.4 Which model deployed**: browser-runtimes/03 lines 71-73
  prints a 16/8/1 (209-param) summary; module 3 trained 32/16/1 (673).
  Print the 673 summary or say "bench copy".
- [x] (decided 2026-09-05: left unresolved, ARIA notes the sign) **T2.5 Finale explains the untrained
  0.998 with a random projection** (capstone/05 line 302); random init
  has no preferred sign, and ARIA said so in neural-networks/05. Leave
  it unresolved like the 73.4 coincidence, or have ARIA decline to
  close it.
- [x] **T2.6 Model card input contract** (capstone/04 line 132,
  "normalized to [-1, 1]") matches no normalization taught.
- [x] **T3.1 Narrative bookkeeping paragraphs**: signal-processing/04
  line 44 (94 to 78 retcon), recurrent-networks/05 line 125 (47 steps vs
  47 minutes), optimization-edge/02 line 46 (two ledgers), capstone/05
  line 302. Decide each number once upstream; delete the patch.
- [x] **T3.2 Prose in code blocks**: anomaly-detection/01 line 139,
  advanced-time-series/05 line 123, recurrent-networks/02 line 146,
  advanced-time-series/03 line 83 (trustHeuristic placeholder),
  capstone/05 line 239 (60-line console.log finale). Move to prose or
  make them run.
- [~] **T3.3 Overlap** (done 2026-09-05 except the readback rule's third telling, left as reinforcement): advanced-time-series/01 and /02 teach the same
  heatmap with the same step-4/step-77 example; /03 repeats module 6's
  multi-step loop; readback benchmarking rule taught in full three
  times; `create-sequences` and `sliding-window` are the same exercise;
  precision/recall introduced from scratch in module 7 after module 3's
  drawer.
- [x] **T3.4 Time estimates padded in modules 9-11** (each exactly 130
  min; 44-81 words/min vs 100-147 in modules 1, 5, 6). Halve them or
  raise the early ones; re-mint any baseline showing minutes.
- [x] **Tier 4 nits** (do when in the file): training-loop/04 line 72
  "pure noise would sit at 0.693 forever" is wrong (it memorizes);
  signal-processing/04 line 86 atan2 "phase" unexplained;
  neural-networks/02 line 87 ReLU "where speed matters";
  foundations/01 line 141 DISPATCH uses batch dims before lesson 2;
  anomaly-detection/02 bottleneck reason lives only in the hint;
  anomaly-detection/05 line 127 vote count labelled confidence;
  llm-integration/02 line 53 git-log analogy; training-loop/01 line 110
  recall answer is 90 words; recurrent-networks/02 line 108 trains on
  random labels with no warning.
- [ ] **Exercise mix** (2026-09-05: deep-scan-eval, sliding-window, generate-report rewritten; the rest still open): 16 of 65 are type-the-config or join-the-strings
  (list in the audit); the nine incident exercises ship their full
  recipe in starter comments. Worst in modules 9 and 11. Consider one
  harder exercise per module that removes the recipe.
  SUPERSEDED 2026-09-12 by measurement (`node scripts/report-starter-dictation.mjs --flagged`):
  the incident drills are mostly the CLEAN pattern, and the recipes concentrate in the
  capstone (8 of 8 starters flagged) and the recurrent-networks and foundations starters.
  Now tracked by the starter-dictation gate; the de-recipe pass landed 2026-09-12
  (0 of 65 starters dictate) and was blind-verified the same day (see "Item 2" below).
- [x] (moved above the Challenge heading 2026-09-05) Cross-reference: the four DerivationDrawers after "## Challenge"
  from the 2026-09-04 re-audit are training-loop/03 (chain rule),
  signal-processing/02, /03, /05. The chain-rule walk is the most
  important derivation in the world and currently renders on no step.
- [ ] (B0) **Re-mint visual baselines after the 2026-09-05 re-pace**:
  per-module minutes on world-deep-orbit and pricing, and the FAQ
  "about 27 hours" line on landing and pricing, all changed
  (`course-jsonld.ts` is PT27H). e2e was not run in the remediation
  session. Remediation record: the "Remediation, 2026-09-05" section of
  `docs/audits/content-quality-audit-2026-09-05.md`.

## Content quality re-audit follow-ups (2026-09-06)

Source: `docs/audits/content-quality-reaudit-2026-09-06.md`, a fresh-eyes
re-read of all 56 Deep Orbit lessons one day after the 2026-09-05
remediation. Three regressions the remediation introduced (R1 module 8
lesson 2 scorer ordering, R2 module 9 lesson 1 token count, R3 module 3
lesson 5 "spectrogram review" before spectrograms exist) were FIXED in
the same session; gates green. Grade holds at A-. Open items below.

- [ ] **N1 Validation vs test never distinguished.** Module 1 splits
  train/validation, module 3 lesson 4 tunes on validationSplit, lesson 5
  reports a held-out slice, capstone/04 says 80/10/10, and no lesson
  says the tuning number and the reported number must be different
  sets. One paragraph in training-loop/05.
- [ ] **N2 Early stopping is never called a regularizer.** One sentence
  after the early-stopping block in training-loop/04; one clause in
  lesson 5's overfitting fix list.
- [ ] **N3 training-loop/02 epilogue vs /03 premise**: lesson 2 runs
  4,000 descent steps on the network overnight (loss 0.31, so not the
  toy); lesson 3 opens with Demir unable to differentiate 673 weights.
  Reframe lesson 3's opener as a check on the autograd black box; keeps
  the cost lesson and the discovery tag.
- [ ] **N4 training-loop/03 chain-rule drawer** derives with squared
  error and shows the sigmoid factor lesson 1 proved cross-entropy
  cancels, without comment. One closing sentence.
- [ ] **N5 capstone/05 debts paragraph** grew to ~230 words under the
  T2.5 fix; halve it.
- [ ] **N6 Prose-in-code blocks missed on 2026-09-05**:
  signal-processing/03 window-tradeoff.ts, recurrent-networks/02
  rnn-unrolled.ts.
- [ ] **N7 foundations/04** explains shuffling (needs the per-batch
  update) one section before it introduces the per-batch update.
- [ ] **Tier 4 nits**: neural-networks/03 "2,369 on a 64-unit stage" is
  64/32/1; neural-networks/02 recap triad "fast, simple, and effective"
  and objective promises three activations for a ReLU-only exercise;
  training-loop/01 objective promises BCE for an MSE exercise;
  foundations/04 recall answer still says "learn sequence rather than
  patterns"; foundations/02 uses "batch" before defining it;
  neural-networks/02 raw outputs of -11 and 600 after module 1
  normalized everything; capstone/03 and /04 say zeroCrossings where
  every other lesson says frequency; optimization-edge/01 feeds an
  embedding layer a float [80, 11] tensor; browser-only anchors without
  a Node gloss (useEffect in foundations/01 and browser-runtimes/04,
  "In your React component" in browser-runtimes/03, CSS grid in
  foundations/02); foundations/01 "backend" three lessons before it is
  defined.

## Content quality ultra-audit follow-ups (2026-09-06)

Source: `docs/audits/content-quality-ultra-audit-2026-09-06.md`, a
multi-agent fresh-eyes audit of all 56 Deep Orbit lessons and 65
exercises. 44 module readers (four lenses per module) plus 4
cross-module trackers produced 753 raw findings; merging cut them to
275; adversarial refutation dropped about half. Nothing was edited.

**Grade of record: B+ overall, and every one of the 11 modules medians
at B+ across its four independent readings.** The 2026-09-05 audit and
the 2026-09-06 re-audit both said A-. Both were mine, both re-read files
I had just edited, and both graded the prose while treating exercises
and runnable claims as background. Treat B+ as the current grade and the
two A- verdicts as superseded.

The dominant theme is not slop (exactly one slop finding survived) and
not padding (the earlier sweeps worked). It is claims that outrun the
page: text stating mechanisms it does not demonstrate, and graders
certifying skills they do not test.

Eleven claims were settled by running code against TensorFlow.js 4.22.0
rather than by reading. All eleven confirmed the finding. Details and
numbers are in the audit's "What I checked by running it" section. Note
that three OTHER items, which I wrote up from reading alone before their
verifiers finished, were then refuted; see the withdrawal list below.

## The 76 mediums: fixed (2026-09-07)

Eleven editors, one per module, each required to confirm the defect still
existed before touching it and to measure any number it wrote. 77 items
handled: **69 fixed, 7 already resolved by earlier sweeps, 1 blocked.**
64 claim enumerations reported and 27 hand-offs raised.

All gates green: content 414/414, exercises 65/65 with starters and
cheats, web contract 20/20, interval canon byte-identical, zero em
dashes in any tracked file.

The confirm-first rule paid for itself: seven of the 76 had already been
closed as side effects of the retrieval-surface pass or the high-finding
fixes, so those editors reported and moved on instead of re-editing
correct text.

### The one blocked item is an owner decision

- [ ] **`browser-runtimes/03-model-loading.mdx:75` prints a
  `model.summary()` for a model the product does not ship.** The lesson
  prints the 673-parameter DEEP SCAN stack, 128 / 528 / 17. The asset
  actually served from `apps/web/public/models/deep-scan/` is a
  16 / 8 / 1 network totalling 209 parameters in an 836-byte
  `weights.bin`, and `docs/capstone-models.md` records it as
  `deep-scan-v1`. Both were verified by parsing the served asset and by
  rebuilding the canon network in TensorFlow.js.
  Two ways out, and they are not equivalent. Shipping a real
  673-parameter asset keeps the lesson and the 673 canon that runs
  through modules 2, 3 and 4, but it replaces a live product asset that
  the landing demo also loads. Changing the printed summary to 209 keeps
  the product untouched and puts the lesson at odds with that canon. The
  editor built a deployable 673-parameter pair but correctly declined to
  install it, because `apps/web/` was outside its ownership. Your call.

### Hand-offs from this batch

11 land on Deep Orbit files or the glossary and are queued for
routing. 6 land in the unlaunched worlds (signal-ward,
neon-protocol) and join the inherited-claim list below rather than being
fixed now.

## The six high regressions: fixed, every number measured (2026-09-07)

All nine items closed, the six high regressions plus the three defects
that had been edited into a different wrong statement. Four editors, one
per owning file, with a rule that no number may be written unless it was
observed and the command reported. All gates green: content 414/414,
exercises 65/65 with starters and cheats, web 20/20, canon
byte-identical, zero em dashes anywhere in the repo's own files.

The measurement standard is what made the difference, so it is worth
recording what it looked like:

- The capstone editor pulled the deploy action's own source to settle
  whether it waits for GitHub Pages. It does not: there is no such input
  and no polling code, and the only push path returns on `git push`.
  Then it built a local origin that flips artifacts after a delay and
  showed the no-wait smoke test grading the PREVIOUS build. It also
  found that two different artifacts had identical byte length (836) and
  different digests, which is why the fix identifies bytes by digest
  rather than by size. And it demonstrated that
  `tf.loadLayersModel` does not check the HTTP status of a weight shard:
  a 404 page of the right length loads as a model and predicts a
  constant, so "the model loaded" was never evidence of a good deploy.
- The 42 MB claim turned out to sit on twelve surfaces, all inside the
  capstone, including a GRADED assertion in `write-model-card.yaml`.
  Module 10 says the weight file is 85 MB on disk and 42 MB is the
  gzipped download; all twelve now say that.
- The backend fallback claim was reproduced before rewriting: register a
  throwing backend above a working one and the engine settles on the
  next working registered backend, not on cpu.
- The training lesson's overfitting run was measured rather than
  asserted, which is what exposed it in the first place.

## The 12 high findings: fixed, then verified (2026-09-07)

Seven editors fixed the 12 remaining high-severity findings, and found
three more surfaces of the same claims along the way, so 15 were closed.
Then seven blind readers checked the result. All gates green throughout:
content 414/414, exercises 65/65 with starters and cheats, web 20/20,
interval canon byte-identical, zero em dashes.

**9 of the 12 are closed and the replacement text is true.** The
anomaly-detection pair is worth noting as the standard to aim for: the
reader reproduced every number in the rewritten threshold argument
(2,618 readings a day, 183 flags a week at a 1% rate, the 99.98th
percentile the two-alert budget really implies) and confirmed the
ensemble's coupling claim by tracing all three detectors to the same
amplitude channel in code.

**3 were edited into a different wrong statement, and 6 high regressions
came with them.** Three of the six are new false claims my own batch
introduced:

- [ ] **`optimization-edge/05-webgpu-acceleration.mdx:103`** now claims
  a failed backend leaves the engine on cpu. Measured: register a
  throwing backend above a working one and `tf.ready()` settles on the
  next working REGISTERED backend, not cpu.
- [ ] **`training-loop/04-training-loop.mdx:138` and `:250`** rest on a
  run that does not exist. The reader measured the clean 100-row block
  16 times: training loss lands at 0.0001 to 0.0005 and validation loss
  does not turn upward near epoch 97, so the 500-epoch run is the best
  generalizing model in the lesson rather than the one labelled
  MEMORIZING.
- [ ] **`capstone/05-launch.mdx:175`** was not brought along by module
  10's 42 MB reframing and now contradicts it: module 10 says the weight
  file is 85 MB and 42 MB is the gzipped download, the capstone still
  calls the shipped weights 42 MB.
- [ ] **`glossary.ts:754`** still says pruning removes weights and makes
  a model smaller and faster, which lesson 03 was corrected to deny
  twice ("Pruning deletes nothing").
- [ ] **`capstone/02-ci-cd-pipeline.mdx:183`** asserts the smoke test
  measures the new deployment; the step it describes curls a URL that
  GitHub Pages has not finished propagating.
- [ ] Plus 20 medium regressions, 31 places a corrected claim survives
  elsewhere, and 14 rubric violations.

**Five consecutive fix batches have now introduced high-severity
problems that only blind readers caught: 6, 7, 5, 2, and 6.** The rate
is not falling. Treat fix-verify-correct as the unit of work and never
quote a batch without its verification.

## Step 1 correction pass (2026-09-07)

The fresh readers' findings are applied. Thirteen editors, one per owning
file group, 116 edits. Then six file owners judged the cross-file
hand-offs those editors raised, applying 8 of 14 and rejecting 6 with
reasons. All gates green after both: content 413/413, exercises 65/65
with all 8 cheats still rejected, web contract 20/20, interval canon
byte-identical, zero em dashes.

**The enumeration rule worked.** Editors were required to grep every
world plus the glossary for each claim, write down every surface, and
report the list before editing. They produced detailed per-claim surface
inventories and 35 hand-offs for files they did not own. Compare that to
the previous batch, which was told to "sweep" and left 31 gaps.

**Owners rejecting hand-offs is the other half of it.** Six were
declined on inspection: one quoted text that no longer exists, one
misread a line that says "floats" rather than "weights", and one would
have left both of a lesson's recall prompts drilling the same
discrimination. A hand-off from someone who does not own the file is a
lead, not an instruction.

### Inherited claims in the unlaunched worlds, NOT fixed

The enumeration found that other worlds carry Deep Orbit's corrected
claims. Those worlds are unlaunched, so this was left out of scope
deliberately rather than missed. Fix them before any of these ships.

- [ ] packages/content/content/terra-grid/edge-deployment/03-runtime-environments.mdx:20 and :49 (also :38, :46, :51, :162). CLAIM: the same op-gap claim in TFLite/ONNX/Core ML terms ("an unsupported op does not run slowly, it fails the load. So targeting a runtime starts with an op-set audit rather than 
- [ ] /Users/amira.salah/Desktop/tensorcraft/packages/content/content/signal-ward/transformers-bert/05-medis-mistake.mdx:65. Claim: "the model's attention weights didn't give it enough importance." This reads the weights as causal importance, the exact claim retired in deep-orbit. Should say the weight on
- [ ] /Users/amira.salah/Desktop/tensorcraft/packages/content/content/signal-ward/attention-mechanisms/04-attention-visualization.mdx:13 (concept.explanation). Claim: "Attention weights can be visualized as heatmaps, revealing which words the model connects." "Revealing which words the model connects" out
- [ ] /Users/amira.salah/Desktop/tensorcraft/packages/content/content/terra-grid/capstone/01-system-architecture-review.mdx:157 :: KeyTakeaways bullet 2 states the unconditional fallback rule as a general principle: "Every component needs a defined fallback strategy: the system must degrade gracefully". T
- [ ] /Users/amira.salah/Desktop/tensorcraft/packages/content/content/neon-protocol/capstone/01-system-architecture.mdx:52 :: LearningObjectives objective 4 promises "Map failure modes and design graceful degradation for each stage", i.e. a fallback for every stage without exception. Same shape as the dee
- [ ] /Users/amira.salah/Desktop/tensorcraft/packages/content/content/terra-grid/mlops-pipelines/05-automated-retraining.mdx:73. Claim: `return driftScore > 0.3` picks a drift threshold with no derivation shown. This is terra-grid's own detector, not the Deep Orbit claim I corrected, so it is not a sweep 
- [ ] packages/content/content/nova-canvas/creative-deployment/03-caching-precomputation.mdx:125 :: CLAIM: `console.log('Cache HIT: 0ms generation')`. Same defect class as the fake annotation removed from deep-orbit 04-caching-strategies.mdx:130: a printed latency the code cannot produce. A Map lookup plu
- [ ] packages/content/content/nova-canvas/creative-deployment/03-caching-precomputation.mdx:201 :: CLAIM (KeyTakeaway 2): "LRU eviction ensures the cache holds the most relevant outputs without unbounded growth". LRU holds the most recently USED entries, which is a proxy for relevance and not the same th
- [ ] packages/content/content/nova-canvas/creative-deployment/03-caching-precomputation.mdx:201 :: CLAIM (KeyTakeaway 3): "Pre-computing popular outputs during off-peak hours eliminates generation latency for common requests". "Eliminates" overclaims: pre-computation removes the generation cost, not the 
- [ ] /Users/amira.salah/Desktop/tensorcraft/packages/content/content/terra-grid/quantization/01-number-formats.mdx:81 :: Claim/pattern: the same slogan formula I removed from my own file, inside a code-block comment: '// BYTES_PER_ELEMENT is 4 and 1. That ratio is the whole trick.' Rubric section 1 (slog
- [ ] /Users/amira.salah/Desktop/tensorcraft/packages/content/content/nova-canvas/creative-deployment/04-concurrent-users.mdx:25 :: Claim/pattern: same formula, in a hint: 'GenerationQueue(maxConcurrent: 4) is the whole trick: 4 inferences run, everyone else holds a live WebSocket and a queue position'. R

## Step 1 fresh-reader verification (2026-09-07)

Eleven readers, one per module, told only the defects originally reported
there and never what had been changed. They read the current files, ran
code to check claims, and independently swept the whole world for
siblings of every corrected claim.

**55 of 57 defects are closed and the new statements check out.** No em
dashes anywhere. Interval canon unchanged.

**What the pass caught, and this is why it runs:**

- **2 high regressions.** `foundations/03-tensor-operations.mdx:126` still
  asserts, verbatim in the body, the claim that was corrected in the
  recap 22 lines below it: every layer is matMul plus bias, which is
  false for the conv and recurrent layers this course teaches later. And
  `training-loop/exercises/mse-loss.yaml:4` now states and GRADES a new
  loss-selection rule as an unconditional layer-type rule, which is
  false outside binary classification and is refuted later in the same
  world. The second one is a false claim that step 1 introduced.
- **25 medium regressions**, spread across every module, most in
  llm-integration.
- **6 defects not properly closed**: two in training-loop, two in
  recurrent-networks, one in anomaly-detection, one in capstone. Four of
  those were edited but now state something untrue.
- **31 sweep gaps.** The editors were told to sweep the world for
  sibling surfaces and mostly did, but the readers found 31 places a
  corrected claim still lives. The instructive ones: the glossary's
  "ensemble" entry still carries the pre-edit claim that pooling beats
  any single member; `advanced-time-series/01` and `/02` keep the
  causal-importance reading of attention weights that was corrected
  elsewhere; and one gap is in a DIFFERENT WORLD, `nova-canvas`, which
  carries the corrected autoencoder objective verbatim.
- **55 rubric violations** in new or adjacent prose.

- [ ] **Run the correction pass.** Order: the 2 high regressions, then
  the 6 unclosed defects, then the 31 sweep gaps (per claim, not per
  file), then the 25 mediums, then the rubric list.
- [ ] **The sweep instruction needs teeth.** Telling an editor to sweep
  produced a 31-gap miss rate. The reliable version is what the readers
  did: grep for the claim, enumerate every surface, and report the list
  before editing. Consider making that the required first step of any
  claim fix.
- [ ] **Other worlds inherit these claims.** nova-canvas is unlaunched
  and already carries at least one corrected Deep Orbit claim. A claim
  fix should sweep `packages/content/content/` entirely, not just
  `deep-orbit/`.

## Round 4 remediation, steps 1 to 3 (2026-09-07)

Three things were asked for and done in order. All gates green after
each: content 413/413, exercises 65/65, web contract 20/20, pulse
interval canon byte-identical, zero em dashes in project files.

### Step 1: retrieval surfaces now agree with their bodies

Fifty seven findings across 39 files, fixed by eleven editors with one
module each and exclusive file ownership. 136 edits. Every editor swept
the whole world for siblings of the claim it corrected, which is how the
last three rounds failed, and the sweeps paid: one found that the
promise "we lean on tidy() in every lesson that touches real data" is
false in eight modules, and that the finding's own suggested wording
would have been wrong too.

Highlights: module 1's recall answer and recap bullet no longer give a
false reason for shuffling before batching; the first definition of a
tensor no longer claims tensors carry gradients; feature and label are
now defined at first use and in the glossary, with xs and ys named.

### Step 2: the profiling grader hole is closed

My own regression. Last night's fix rejected a solution that measures
nothing and reports zero; a solution that called predict the right
number of times and returned numbers memorised from the lesson prose
still passed 4 of 4. The grader now hands the solution two mocks whose
costs differ sixfold and requires the reported averages to differ, so no
constant can satisfy both. Real solution passes, cheat rejected.

### Step 3: five weak graders hardened, cheat-first

Each of build-spectrogram, apply-window, prompt-template, prune-weights
and quantize-weights had a cheat written FIRST, proven to pass the
shipped tests, and only then a discriminating test built to stop it.
Twenty five tests added in total. Every cheat passed before and fails
now, and every real solution still passes.

I had doubted the prune-weights finding, because the specific cheat it
described does not pass. It was right anyway: a different ignorant
solution did pass, and the editor found it.

### The durable part: a cheat gate

`scripts/exercise-cheats/<slug>.js` holds a deliberately ignorant
solution per exercise, and `node scripts/validate-exercises.mjs --cheats`
fails the build if any of them passes every test. Eight are registered
and all eight are rejected. The default validator path is unchanged, so
nothing slows down.

- [ ] **Turn the cheat gate on in CI**, next to `--starters`. It is
  opt-in today, which is the same shape as the problem it was built to
  catch.
- [ ] **Write cheats for the remaining 57 exercises.** Eight of 65 are
  covered. The rule worth adopting: an exercise is not finished until a
  solution that understands nothing fails it.

### Found while verifying, and NOT fixed: the em dash gate has a blind spot

`docs/audits/fresh-eyes-evaluation-2026-07-13.md` is tracked and contains
137 literal em dashes, and the repo-wide ban reports zero. The file holds
one stray NUL byte, so git classifies it as binary, and the gate greps
with `-I`, which skips binary files. One accidental byte makes a tracked
text file invisible to a ban CI reports as clean.

- [ ] Decide the two halves separately. The gate should refuse to skip a
  tracked file with a text extension that git thinks is binary, rather
  than passing silently. Whether a July audit record should then be
  rewritten to satisfy a ban adopted in August is a call about
  historical documents, so I left the file alone.

## Content quality audit round 4 (2026-09-07)

Source: `docs/audits/content-quality-audit-round4-2026-09-07.md`. 49
blind readers on Opus, none shown any earlier audit or told what had
been edited, produced 701 raw findings; merging cut them to 165 (capped
at 15 per module, roughly 230 dropped); adversarial skeptics refuted 14.
151 stand: 32 high, 119 medium.

**Grade of record stays B+.** Ten modules median B+, training-loop is now
A-. In eight of eleven modules the lowest of the four letters is the
exercise reader, and the exercise reader produced both C grades.

**The 20 Tier 1 fixes HELD.** Not one came back and no reader
rediscovered any of them. Two graders that used to pass a do-nothing
solution now reject one. What this round found is a layer underneath.

**Read the count with care.** This round's skeptics refuted 8.5% against
last round's 89%, because last round was too strict (65 of its kills had
a dissenting skeptic). The list is longer and less filtered by design.
Nine findings carry a recorded dissent.

### The three themes

- [ ] **Retrieval surfaces contradict correct bodies.** A body explains a
  mechanism right and the RecallPrompt, recap bullet, objective or hint
  states it wrong. These are the surfaces built for recall, so they are
  what a learner keeps. Start here: `foundations/04:146` and `:152` give
  a false reason for shuffling before batching that the body gets right
  at line 99; `training-loop/04:29` says weights update once per epoch
  and its own drawer contradicts it 156 lines later;
  `training-loop/05:143` states overfitting as a bare inequality, which
  flags every healthy model; `signal-processing/05:214` says Hamming
  tapers to zero when its own formula gives 0.08.
- [ ] **Six exercise graders are beaten by solutions showing no
  understanding**, each executed to prove it: `profile-model` (mine, see
  below), `build-spectrogram` (an STFT that never advances in time),
  `apply-window` (a boxcar with two samples zeroed), `prompt-template`
  (bare substring checks), `prune-weights` (sparsity read as keep
  fraction), `quantize-weights` (never rounds). This is the exercise-mix
  project arriving with named instances.
- [ ] **Three basics named and never taught**: feature and label (used in
  code the learner writes, absent from every lesson and from the
  glossary), MAE (an objective, a recap bullet and a capability line in
  module 6, never expanded), and attention's learned projections (module
  8 teaches Q, K and V as the raw hidden states and never says a real
  head learns three matrices).

### My own regression, confirmed by execution

- [ ] **`optimization-edge/exercises/profile-model.yaml` is still
  beatable.** Last night's fix closed the cheat that measures nothing and
  reports zero. A solution that calls predict runs+1 times and returns
  the numbers memorised from the lesson prose still passes 4 of 4. I ran
  it. The timing assertion needs to compare against the mock's known
  cost rather than a floor.

The full 32 high and 119 medium findings, with file and line, are in the
audit document. Roughly 230 lower-severity findings were dropped by the
merge cap and are recoverable from the run journal.

### VISUAL BASELINES 2026-09-07: GREEN, 30/30, and a CI gap

Ran the visual suite for the first time since the September 5th re-pace.
All 30 baselines match, in both schemes, so the re-mint that has been
carried as an open item since then is NOT needed. Closing it.

- [ ] **The visual suite never runs in CI.** All three specs under
  `e2e/visual/` are gated on `RUN_VISUAL=1`, and nothing sets it, so
  every CI run skips 30 tests and reports green. A visual regression can
  therefore ship unnoticed; the baselines only protect anything when
  someone remembers to run them by hand. Either set `RUN_VISUAL=1` in
  the e2e job or drop the gate, which was added while the baselines were
  still being generated and has outlived its reason.

### E2E RUN 2026-09-07: GREEN, 132/132

First end-to-end run since the 2026-09-04 lesson-format work. Two tests
were broken, both by that work rather than by any content change, and
both are fixed. The suite now passes 132 of 132 with retries disabled.
Only two spec files changed; no content and no app code.

- `e2e/script-playback.spec.ts`: the locator `/skip/i` matched two
  buttons once "Skip to the challenge" shipped. Now names "Skip intro".
- `e2e/worlds.spec.ts`: the glossary click test took the first term in
  DOM order, which the step partition renders at zero size inside a
  hidden paragraph. Measured: three prose containers, six terms, one
  visible. Now takes the first visible term, and waits for the visible
  set to stop changing, because glossary buttons are injected on the
  client and the partition lands after them.

To run it the way CI does, which is not what the local config does by
default: build the web app with the placeholder env from ci.yml, then
run with CI=1 and PW_PORT set to a free port, since the local config
otherwise starts `next dev` and port 3000 is usually taken.

- [ ] **Worth a look, not a test bug.** The lesson page renders two
  identical `.lesson-prose` containers, both 2616 pixels tall, so the
  prose sits in the DOM twice. Nothing fails because of it and it is
  invisible to a reader, but it doubles the prose payload on every
  lesson page. Check `lesson-steps.tsx` and `lesson-content.tsx`.

### BATCH TWO APPLIED 2026-09-06 (all 20 Tier 1 items now closed)

The remaining seven Tier 1 items are done, plus the owner's three
decisions. All gates green after every pass: content 413/413, exercises
65/65, web contract 20/20, and all twenty pinned pulse-interval mentions
byte-identical.

OWNER DECISIONS APPLIED
- The 0249 profile ran on the WASM fallback, so 45 to 15 ms is WebGL
  restored and 15 to 5 ms is the WebGPU swap. Recorded where the 45 ms is
  established.
- The quantization trade stays and is named a choice. No accuracy number
  changed anywhere.
- The ONNX verdict follows model size. The benchmark now holds the
  backend constant and the character's decision follows the measurement.

WHAT VERIFICATION COST AND BOUGHT. Four passes, each checked by fresh
readers told only the original defect. Pass 1 introduced 6 high
problems, pass 2 introduced 7, pass 3 introduced 5. Every one was caught
before it shipped. Highlights of what the readers caught:
- I put a FALSE FACT in a fix instruction: Glorot sizes by fan-average in
  TensorFlow.js, not fan-in. Measured on real kernels to settle it.
- My own ONNX fix re-introduced the exact contamination the lesson
  forbids, by leaving TensorFlow.js backend init outside the timed region
  while ONNX paid it inside.
- The backend decision collided with a 6x ratio established in module 4.
  Reconciled honestly: the 6x came from a bare matmul, and end-to-end
  gain is bounded below kernel gain. That is now taught.
- A correction claimed a full-archive shuffle buffer reproduces the
  opening crash. Measured, it peaks at 57,500 tensors, four orders of
  magnitude off. Replaced with the real reason (the buffer must fill
  before the first batch yields).

THE LESSON THAT CHANGES METHOD. Fixes were applied per file, and the
final sweep proved that a corrected claim survives in OTHER lessons. The
Kalman claim lived on in module 8 lesson 5's body, dialogue and epilogue
and in the capstone's console output; the feedforward claim in a module
description a learner reads before any lesson; the validation-versus-test
rule was being broken in module 7's threshold sweep, which tuned on the
test set. A closing pass fixed those by sweeping PER CLAIM across all 56
lessons. Do it that way from the start next time.

STILL OPEN after batch two, none blocking, all in module 10 or 11 unless
noted:
- [ ] `optimization-edge/02:63`: a five-class 94.2 is presented as
  comparable to a binary 94. Chance moves from 50 to 20 percent, so it is
  a new baseline rather than the next rung of the 78 to 87 ladder.
- [ ] `optimization-edge/03:139`: the 512 MB fit is credited to pruning,
  but lesson 2 already cleared the budget at 85 MB, and the line still
  reads file size as memory footprint.
- [ ] `optimization-edge/03:93`: the 80 percent build's accuracy is the
  pruning-only figure applied to a build whose size requires quantization
  too.
- [ ] `optimization-edge/03:174`: the module says why the crew did not
  exempt the classifier from quantization, but not from pruning.
- [ ] `optimization-edge/01:171`: promises the 45 ms and 112 ms survive
  into module 11. Neither appears there.
- [ ] `capstone/04:120`: the model card is titled as the classifier and
  reports 42 MB, which is the whole bundle. Collapses the two ledgers
  module 10 spent a lesson separating.
- [ ] `capstone/02:225`: the CI gate sets a 50 MB and 20 ms cap, then
  passes an artifact its own log identifies as 340 MB and 45 ms.
- [ ] `capstone/exercises/launch-rehearsal.yaml`: the identity probe has
  weights [[1],[0],[0]] and no bias, so a solution that never calls
  predict passes, and two of the three normalization channels are never
  observed by any test.
- [ ] The Tier 2 and Tier 3 lists in the audit, roughly 60 medium and 40
  low, are largely untouched.
- [ ] The exercise mix remains the largest single lever on the grade.

### BATCH ONE APPLIED 2026-09-06 (13 of the 20, plus the profile-model grader)

Fixed and verified: T1.1 broadcasting, T1.2 shuffle buffer, T1.3 tensor
leak, T1.4 weight initialization, T1.5 validation versus test, T1.6 ONNX
cross-runtime, T1.9 aliasing, T1.10 overlap rule, T1.11 compute-fft
grader, T1.13 feedforward framing, T1.16 Kalman attribution, T1.20
file-size-as-memory, T1.23 finale, and the profile-model grader. Their
checkboxes below are ticked.

Still open from Tier 1: T1.7 benchmark confound, T1.8 confidence
contradiction, T1.12 fft-features grader, T1.14 LLM stage validation,
T1.15 drift detector, T1.19 quantization economics. (T1.17
weighted-ensemble closed 2026-09-06.)

Verification, and it mattered. Fourteen editors applied the fixes, then
fourteen fresh readers who were told only the original defect checked
the current files. They found 6 high and 20 medium problems in that
first pass, including one where the instruction itself was wrong: the
text claimed Glorot sizes the draw by fan-in, and TensorFlow.js 4.22.0
dense actually defaults to VarianceScaling with mode fanAvg (measured:
kernel [3, 32] observed sd 0.218 against fanAvg's 0.239 and fan-in's
0.577). Three other fixes were incomplete, leaving the false claim alive
in a LessonRecap bullet, a frontmatter breaks string, and the third line
of a code comment whose first two lines had been corrected. A second
pass of 13 correctors applied 36 further edits. All gates green after:
content 413/413, exercises 65/65, web contract 20/20, interval canon
intact in every pinned file.

Both fixed graders were checked by running a cheating solution against
them. compute-fft: the shortcut that returns the raw bin index now fails
1 of 5 (it passed 4 of 4 before). profile-model: the solution reporting
avgInferenceMs 0 with no warmup and no readback now fails 2 of 4.

RESIDUALS from batch one, none blocking:
- [ ] `optimization-edge/05` line 152: the 45 ms to 15 ms half of the
  speedup still has no cause the module can support. The module never
  names the backend the 45 ms baseline ran on, so closing this needs a
  story decision (was the 0249 profile on the WASM fallback?) rather
  than an edit. OWNER DECISION.
- [ ] `foundations/04` line 161: the epilogue's "numTensors hold steady
  at 70" matches no pipeline in the file. Measured on the lesson's own
  code: 202 while streaming through the shuffle buffer, 2 for the split
  pipelines. Pick one or drop the number.
- [ ] `foundations/03` youCanNow does not name broadcasting, though the
  objectives and recap now do.
- [ ] `foundations/04` line 99 says "a sliding window of that size" and
  the antecedent was removed by the correction.
- [ ] `glossary.ts`: the aliasing entry is 51 words and broadcasting is
  33, against a file median of 17. The file's header calls for one or
  two plain sentences.
- [ ] `neural-networks/05`: five surfaces still say "weights" where they
  mean all 673 parameters, now that the body distinguishes the 624 drawn
  connection weights from the 49 zeroed biases.
- [ ] Found while editing, different world: Neon Protocol
  `03-performance-budgets.mdx` and `04-webgl-acceleration.mdx` time
  `model.predict()` with no readback inside the clock, the same defect
  the Deep Orbit profiling lesson calls fiction. That world is
  unlaunched, so it is not urgent, but it will need the same fix.

### Tier 1, wrong beliefs and missing basics (20 items)

Wrong mechanisms a learner carries out of the world:
- [x] **T1.9 `signal-processing/02:149`** teaches that above Nyquist is
  invisible; measured, a 73.4 Hz tone at 128 Hz plants a peak of
  magnitude 49 in bin 55. The recap says "aliases" and the term is
  defined nowhere in the course.
- [x] **T1.10 `signal-processing/05:144`, 148, recap 215** say every
  sample gets full weight in at least one window; measured with the
  lesson's own Hann window the worst interior sample reaches 0.512. The
  drawer already states the correct COLA property.
- [x] **T1.2 `foundations/04:99`** says `shuffle(100)` makes every batch
  a fair sample of the archive; measured span is about 371 readings of
  an in-order stream, roughly 3.4 hours of one day.
- [x] **T1.15 `advanced-time-series/03:63`** feeds the 100-step rollout
  to the drift detector; run on a pure stationary sine the lesson's own
  detector reports drift at magnitude 2.84 (one-step-ahead: 1.13).
- [x] **T1.16 `advanced-time-series/04:125`** credits the 1D filter with
  tracking the drift at a sixth of a second per day; its own run slopes
  at 0.092 and ends 0.44 behind. Only the collapsed drawer admits it.
- [x] **T1.13 `recurrent-networks/01:70`** blames "feedforward"; measured,
  a dense layer over the flattened window scores 100% on an order-only
  task while a true per-step model scores chance. Two graders reject
  Flatten+Dense with no lesson saying why.
- [x] **T1.20 `optimization-edge/05:153`** treats file size as runtime
  memory; by the module's own mechanics the weights are 340 MB after
  load either way, and the load-peak arithmetic is never given.
- [x] **T1.6 `browser-runtimes/05:21`** says an ONNX model runs in TF.js
  and PyTorch. Neither executes ONNX, and lesson 6 says so.
- [x] **T1.7 `browser-runtimes/05:183`** turns a backend-vs-runtime
  confound into a runtime selection rule, breaking the lesson's own
  measurement rule two sections earlier.
- [x] **T1.23 `capstone/05:288`** (CONTESTED, 2 of 3 skeptics refuted)
  explains the untrained 0.998 by saying any projection throws 7741 to a
  far end; measured, 300 fresh inits with the default initializer span
  0.397 to 0.631. The refuters argue the sentence scopes its claim to
  raw sensor space and that hand-picked weights would saturate; neither
  rescues it, because the network only ever sees the normalized
  [0.5, 0.5, 0.5] and the story's draws were random. THIS SENTENCE WAS
  INTRODUCED BY THE 2026-09-05 REMEDIATION (T2.5) and should be cut,
  restoring the unresolved debt the owner ruling asked for. Supersedes
  N5.

Graders that certify what they do not test:
- [x] **T1.11 `signal-processing/exercises/compute-fft.yaml`**: all four
  tests use length == sampleRate, so a solution returning the raw bin
  index passes 4/4 (verified by running it).
- [x] **T1.8 `browser-runtimes/exercises/inference-pipeline.yaml`**
  grades the raw sigmoid as confidence, the definition the lesson body
  calls wrong twice. Pick one and make body, hints, solution and tests
  agree.
- [x] **T1.12 `signal-processing/exercises/fft-features.yaml`** grades
  sorting by magnitude, which the lesson forbids, while the Challenge,
  nudge and youCanNow describe fixed-bin extraction nothing grades.
- [x] **T1.17 `advanced-time-series/exercises/weighted-ensemble.yaml`**
  was copyable from the function printed in the lesson body, and the
  instructions pointed at it. Regraded 2026-09-06 as
  `ensembleGain(members, actual)`: per-member MAE, ensemble MAE, and
  whether the blend beat its best member, with a shared-offset test that
  ties and a strong-member test that loses. The lesson's
  `evaluateEnsemble` block (the giveaway) is gone; `weightedEnsemble`
  stays and no longer overlaps the exercise.
- [x] **profile-model** (`optimization-edge`): a solution reporting
  `avgInferenceMs: 0` with no timing, warmup or readback passes 4/4
  (verified). It rehearses the exact pattern lesson 1 calls fiction.

Basics named and never taught:
- [x] **T1.1 broadcasting** (`foundations/02:22` and recap): two
  mentions, no definition anywhere, no glossary entry, then required by
  code in lessons 3 and 5.
- [x] **T1.4 weight initialization** (`neural-networks/05:49`): no
  symmetry breaking, no Glorot, no `kernelInitializer` anywhere, though
  five lessons and the 7741 mystery lean on "random weights".
- [x] **T1.5 validation versus test** (`training-loop/05:59`). Same as
  N1, still open, now graded high.
- [x] **T1.14 `llm-integration/05:179`**: validating between stages is
  asserted in bridge, recap, RecallPrompt and youCanNow, and shown in
  no code.
- [x] **T1.19 quantization economics** (`optimization-edge/02:46`): the
  megabytes come from the language component and the accuracy points
  come from the sub-megabyte classifier, so the 2.4 points were a choice
  (exempt the classifier) rather than a price. Selective quantization is
  never mentioned.
- [x] **T1.3 tensor leak** (`foundations/04:126`): the split generator
  leaks two tensors per skipped reading (measured 1,600 per 1,000
  readings) in the module that teaches leak detection, and the epilogue
  claims memory held flat.

### Withdrawn (drafted, then refuted)

Three items were in the first draft of this list and did not survive
verification. Recorded so nobody acts on the earlier draft.

- `optimization-edge/01:137` model identity: refuted 3-0. The two-ledger
  split IS stated, at `optimization-edge/02:46` and
  `llm-integration/05:197`. Only the narrower T1.19 survives.
- `optimization-edge/04:146` cache TTL: refuted 2-1. The key is a
  rounded hash, so one entry serves a quantization bucket and drift does
  change which member is typical. Residual: the recap omits the model
  version the bridge and the incident exercise teach.
- `capstone/04:186` runbook: refuted 3-0. The holdout score moves with
  the deployed artifact and the saved statistics, and this module's own
  CI beat turns on exactly that (stale artifact 94.2 vs shipping 91.8).
  Residual: the module never says production accuracy needs production
  labels, which is now a Tier 2 item.

### Tier 2 and Tier 3

About 60 medium and 40 low findings, listed by module in the audit
document. Several share a file with a Tier 1 item, so batch them by
file. Highlights: module 3's central mechanism (early stopping on the
validation curve) has no exercise anywhere; module 2's five exercises
are all transcriptions with the answer in the guidance hint; module 4's
shipped model asset is a 209-parameter network where the lesson prints
673; module 6 runs two window-labeling conventions without naming
either; MAE is never defined.

### Superseded and confirmed from earlier rounds

- N1 (validation vs test) confirmed and promoted to Tier 1 as T1.5.
- N2 (early stopping as a regularizer) confirmed, and widened: no lesson
  or exercise anywhere shows dropout or L2 despite the recall answer
  naming both.
- N5 (capstone debts paragraph length) superseded by T1.23: the problem
  is not the length, it is that the mechanism is wrong.
- The remaining N3, N4, N6, N7 and Tier 4 items from the 2026-09-06
  re-audit were not re-derived by this pass and stay open above.

### Method note for next time

Every reader in this pass was blind to my earlier audits, and every
finding faced skeptics prompted to refute it. That combination is what
surfaced the layer my own third read had stopped seeing. Do not grade
content you have just edited without an independent reader, and settle
runnable claims by running them.

## Settled canon: the DEEP SCAN feature contract (2026-09-08)

Four audit rounds kept producing findings that were really one
unresolved question: what scale is a DEEP SCAN feature on? Settled here
so it stops being relitigated per module.

1. A capture is 64 samples. Three features are extracted from it.
2. Raw units: amplitude in ADC counts, 0 to 2048, and the hull sensors
   saturate at 2048. Frequency is a zero-crossing count over the
   64-sample window, 0 to 63. Phase is radians, -PI to PI. Stated at
   `browser-runtimes/04-inference-pipeline.mdx:63-70`,
   `recurrent-networks/05-sequence-prediction.mdx:103-110` and
   `advanced-time-series/03-forecasting.mdx:64-71`, and asserted by two
   graders (`browser-runtimes/exercises/inference-pipeline.yaml:63,:68`
   use 1536/2048 = 0.75 and 512/2048 = 0.25). Load bearing, do not
   change it.
3. The browser classifier (modules 2 to 4) min-max normalizes with those
   ranges, so a normalized amplitude cannot exceed 1.00.
4. The sequence models (modules 6 and 8) work in raw counts clamped to
   the same limits; module 6 z-scores per channel for the model while
   keeping the limits in raw space.
5. The normalized amplitude baseline is mean 0.52, std 0.15, p5 0.28,
   p95 0.76. The largest reachable normalized amplitude is 1.00, which
   is 3.2 sigma.
6. Sample 7741's individual dials all read normal. Its tell is the
   73.4 Hz tone, absent from the known-natural set (5, 12, 23, 47 Hz).
7. No surface may print a normalized amplitude above 1.00, and no
   surface may mix a normalized amplitude with a raw frequency or phase
   inside one triple.

The amplitude `1.82` violated rule 7 in four files and additionally
violated canon 6 in `llm-integration`, where it gave the flagship
anomaly an abnormal amplitude and so destroyed the reason 7741 matters.
It was reverse-engineered to make 8.7 sigma fall out of the 0.52/0.15
baseline, which is why it survived four audits: the arithmetic checks
out, the physics does not.

## Round-4 remediation: final state (2026-09-08)

Closed this pass: the 11 high regressions and 13 unclosed defects from
the medium verification (21 fixed, 1 blocked, 2 reports refuted on
measurement), plus both previously unrouted items. The autoencoder
training trace at `anomaly-detection/02-autoencoders.mdx:110` printed an
epoch-0 loss of 0.097510, which no data scale in the module produces;
measured on tfjs 4.22.0 the z-normalized epoch-0 loss is 0.94 to 1.01
across seeds, and the trace now carries a measured run whose tail
(0.001161) also agrees with lesson 3's stated ~0.001 normal error, which
the old tail (0.000647) did not.

### Open owner decision

`browser-runtimes/03-model-loading.mdx` prints a 673-parameter
`model.summary()` for the canon 3 -> 32 -> 16 -> 1 network, but the
asset actually served at `apps/web/public/models/deep-scan/` is
3 -> 16 -> 8 -> 1: 209 parameters, 836-byte `weights.bin`. Two ways out,
and it needs the owner:

- Ship a real 673-parameter pair. An editor built and verified a
  deployable one but correctly declined to install it, because the
  landing demo loads that asset, so this changes a live product surface.
- Change the printed summary to 209. Contradicts the 673 canon in
  modules 2, 3 and 4.

Note the capstone deliberately calls the 209-parameter network "the
bench copy" (`capstone/exercises/export-model-artifact.yaml`), so 209 is
canon for the bench copy and 673 for DEEP SCAN itself. Only the served
asset is ambiguous.

### Still open, deliberately

- Cheat coverage: 20 of 65 exercises have a cheat file. Seven more are
  in flight; the remaining 38 are unwritten.
- `RUN_VISUAL=1` is unset in CI, so all 30 visual tests are skipped
  there. They pass locally 30/30.
- About 230 low-severity round-4 findings were dropped by the merge cap.
  Recoverable from the workflow run journal.
- 11-plus inherited-claim items in the four unlaunched worlds
  (nova-canvas, terra-grid, signal-ward, neon-protocol), which took
  their claims from Deep Orbit before the corrections landed.
- The exercise rebuild. The exercise reader was the lowest of the four
  lens grades in 8 of 11 modules and both C grades came from it, so it
  is the layer holding the grade at B+.

## Round-5 blind verification: the 40 low findings (2026-09-08)

Eleven blind readers measured 602 claims across the eleven Deep Orbit
modules and confirmed 215 load-bearing claims TRUE. The 17 high and 33
medium findings were remediated the same day. These 40 lows were not,
and each one carries the reader's own measurement.

### advanced-time-series

- `advanced-time-series/02-temporal-attention.mdx:166` "match" is the wrong verb, and it lands one sentence after "Read the two sums together: 1.000 and 1.000", where match did mean equal values. Only the shapes match; the pooled values are substantially different, which is the entire hazard the paragraph is describing. The trailing "by shape" is the on
- `advanced-time-series/02-temporal-attention.mdx:63` The conclusion is right and both named ops really do reject SymbolicTensors, but neither is what fires. The forward pass as written reaches `scores.squeeze([2])` first (line 76), and SymbolicTensor has no tensor methods, so the failure a learner actually sees is `TypeError: scores.squeeze is not a f
- `advanced-time-series/05-ensemble-methods.mdx:182` "the main driver" is a ranking the lesson never establishes and its own retrieval surface contradicts. The RecallPrompt 22 lines below (line 174) lists three co-equal sources: "different architectures, random seeds, or subsets of data". The lesson body at line 150 then says the attention member runs
- `advanced-time-series/02-temporal-attention.mdx:25` The step-to-second equivalence is correct but module 8 never states it, and the same lesson puts "the 64-sample capture" (line 124, line 130) on the page beside "80-step window". A reader who assumes one step is one capture gets 0.25 s per step, which makes 73 steps 18.25 s and turns the frontmatter
- `advanced-time-series/05-ensemble-methods.mdx:126` Neither annotated line is what the code prints. The values are correct, but they are shown pre-formatted to three decimals, which also conceals a float artifact in the very number a checking reader would recompute. In a module whose selling point is numbers a reader can verify, an annotated console.

### anomaly-detection

- `anomaly-detection/05-the-anomaly.mdx:163` Module 4's preprocess takes the already-extracted triple ({ amplitude, frequency, phase }), not a capture. A capture is 64 raw samples (canon 1), so passing one returns [NaN, NaN, NaN] and the statistical detector silently never fires (NaN > 3 is false). The line needs the extraction step first, or 
- `anomaly-detection/05-the-anomaly.mdx:172` The field is votes/3, a normalized ratio in [0,1], not a count: with 3 votes it is 1, with 2 votes 0.6666..., which is exactly the probability shape the lesson warns against. Four retrieval surfaces describe a count the code never produces, and the lesson's own DetectionResult does not expose `votes
- `anomaly-detection/04-threshold-tuning.mdx:149` The same lesson's sweep reports recall on that slice, so it must contain labeled anomalies; the slice cannot be 2,880 calm readings. Reconciling the table with the percentile line requires roughly 230 anomalies in it, leaving about 2,650 calm rows. Either say '2,880-row validation slice' or name the
- `anomaly-detection/01-normal-vs-anomalous.mdx:124` Same defect as 05:149, three lines before the paragraph that refutes it: the code comment calls 3.2 the ceiling, and :127 then gives 3.5 sigma for a dead channel at 0.00. The verdict (true) and the 3.2 value are both right; only 'the ceiling' is wrong, and it needs scoping to the top of the scale.
- `anomaly-detection/01-normal-vs-anomalous.mdx:127` 0.00 is 3.4667 sigma, which rounds to 3.5 but is not 3.5, and the diagnostic boundary inherits the rounding: the physical maximum is 3.4667, so anything above 3.4667 already proves a units bug, while the stated rule only fires past 3.5 and leaves a dead band (3.47 to 3.50) where a real units bug pas
- `anomaly-detection/exercises/build-autoencoder.yaml:34` The grader asserts layer count, units, output shape, loss name and that an optimizer exists, but never the activations or the optimizer identity. A fully linear stack compiled with sgd passes, i.e. a model with no nonlinearity anywhere, which cannot learn anything a PCA projection could not. One ass
- `anomaly-detection/exercises/detect-anomaly.yaml:16` The suite never observes tf, so a plain-JS solution that never touches tensors passes every case under a heading that certifies tensor arithmetic. The z-score concept itself IS graded (the registered cheat is correctly rejected), so this is a mislabeled describe rather than a hole in the pedagogy: e

### browser-runtimes

- `browser-runtimes/06-transformers-js.mdx:99` This one printed score does not reproduce on any runtime path I could build, while every other number in the same two blocks does. The label (POSITIVE) is right; the value is 0.013 to 0.031 too high. Everything around it verified exactly, which is what makes this one look hand-edited rather than mea
- `browser-runtimes/04-inference-pipeline.mdx:66` The numbers are right but the course's two different 64s are never distinguished, and this is the surface where the second one first appears. Module 1 taught 64 as CHANNELS (foundations/02, /03, /04); this line introduces 64 as SAMPLES in a 0.25 s window with no note that these are different axes of
- `browser-runtimes/01-why-the-browser.mdx:92` Every latency the module goes on to measure for this model falls below the floor of the range the first lesson makes learners memorise, so the retrieval surfaces teach a number the module then contradicts four times over. The 5-50ms band is a generic figure, but it is presented as this dashboard's b
- `browser-runtimes/module.yaml:19` Stale and false on both counts. In deep-orbit, module 4 IS this module (module.yaml order: 4) and module 5 is signal-processing, which is written, shipped, and listed as a prerequisite by modules 6 through 11. There is no CNN module in deep-orbit at all (convolutional-neural-networks belongs to neon

### capstone

- `capstone/exercises/classify-anomaly.yaml:190` The zero-hour z is 37.3, not 36. The companion figures in the same comment are exact (the spread ratio is 20.08x and the noisy-window z is 1.833), so a reader who checks the third number is the one who finds it wrong.
- `capstone/exercises/classify-anomaly.yaml:62` Module 7's locked autoencoder cutoff is 0.010 (anomaly-detection/04:26 "The cutoff goes to 0.010"; 05:65 "still uses last lesson's locked cutoff of 0.010"; ensemble-detector.yaml passes 0.010 in all six of its cases). 0.005 is module 7's highest NORMAL reconstruction error (03:89 "Normal, max error:
- `capstone/03-monitoring.mdx:104` The raw frequency feature in this very vector (named `zeroCrossings` twelve lines below, at :180) is a zero-crossing count over the 64-sample window, capped at 63, and the 73.4 Hz line reads 37 of them. So no raw value of 73 can appear in the array, and a reader who takes the number literally learns
- `capstone/05-launch.mdx:248` Raw samples are ADC counts (amplitude 0 to 2048, saturating at 2048), so a benchmark that feeds values in [-1, 1] is off the declared domain by three orders of magnitude and looks like already-normalized data, in a course whose recurring bug class is exactly that confusion (browser-runtimes/04's man
- `capstone/02-ci-cd-pipeline.mdx:374` Read as written, it puts three things in the digest. The workflow it summarizes hashes one: `sha256sum models/deep-scan-v1/weights.bin` (:165), and validate-model.ts re-derives that digest from the weight shards alone (:245-257), never from the topology or the specs. The lesson's own point (a pin on

### foundations

- `foundations/exercises/add-tensors.yaml:25` The grader accepts the exact thing this lesson exists to argue against. The lesson's bridge breaks text (03-tensor-operations.mdx:25) is 'Array.map runs JavaScript per element on the CPU. tf.add operates on whole tensors with hardware-accelerated kernels', and the recap (:146) repeats it. A submissi
- `foundations/02-tensor-shapes.mdx:48` The lesson never shows or names a sequence shape. 'sequence' appears in the body twice (lines 89 and 134) and both times means 'the flat sequence of values' in memory, a different concept. The body's shape catalogue (line 54) is a grid [3,4], a list [10], and an image batch [32,224,224,3]; the [450,
- `foundations/04-data-loading.mdx:63` The exercise this lesson hands the learner 88 lines later uses the same identifier at a different width. batch-data.yaml:4 says readSample(i) 'returns { features: number[2], label: number }', its starter and solution use features: [i, i * 2], and its tests assert xs shapes of [4, 2]. The body's own 
- `foundations/exercises/batch-data.yaml:50` A full-size shuffle buffer also reads 16 before the first batch, so the assertion cannot tell eager loading from a full shuffle. A learner who submits a genuinely lazy generator with shuffle(16) (the fair-sampling option the lesson body itself discusses at 04-data-loading.mdx:105) fails a test named

### llm-integration

- `llm-integration/02-prompt-engineering.mdx:92` The arithmetic is right, but the profile described (z-gate clears it, every dial normal, 73.4 Hz is the only tell) is canon 6's identikit for sample 7741, and module 3 pins that reading's normalized triple at 0.5 on all three features while claiming uniqueness twice: training-loop/05:120 'sample 774
- `llm-integration/exercises/generate-report.yaml:81` The season's pulse interval is a monotonic countdown pinned per module by packages/content/__tests__/interval-canon.test.ts. At module 9 the canon live readings are 63.1 s (llm-integration/01), 62.0 s (llm-integration/05) and 61.2 s (rag-pipeline.yaml). 31 seconds belongs to the module-11 era (the t

### neural-networks

- `neural-networks/module.yaml:5` ARIA's rule set names a great deal else in the module's own text. 02:127 has ARIA checking reading 7741 "against all 14,202 of my rules" with "10,106 classification rules", and 02:130 files the note "between two routine humidity alerts" -- humidity alerts are rules firing on something other than the
- `neural-networks/module.yaml:6` The module never produces a model that sorts anything. Its last lesson is explicit: 05:49 "the number is meaningless", 05:25 "Nothing has been trained yet", 04:70 "~0.5 (random, untrained)". Measured, the assembled network answers 0.5 to everything and cannot separate any two inputs. The description

### optimization-edge

- `optimization-edge/01-model-profiling.mdx:172` The transcript right-aligns the percentage column, but the template literal at line 160 (` ${layer.name.padEnd(14)}${layer.params.toLocaleString().padStart(12)} ${share.toFixed(1)}%`) always emits exactly two spaces before the share, so the real output has one space fewer on this row. The other two 
- `optimization-edge/01-model-profiling.mdx:171` No integer unit count gives a Dense layer 68,000,000 parameters behind a 256-dim embedding. A Dense reading the embedding directly (or after a global pool) has (256+1)*units parameters; after a Flatten over 80 tokens it has (80*256+1)*units. Neither 257 nor 20,481 divides 68,000,000. The embedding r
- `optimization-edge/04-caching-strategies.mdx:133` Overstated by three orders of magnitude. Even the whole hit path (dataSync, round, join, lookup) is 20x cheaper than 0.01 ms. The derived 27.0 is unaffected, so this is only a credibility leak in a module whose selling point is numbers a reader can check; 'well under a microsecond' would be honest.
- `optimization-edge/02-quantization.mdx:48` Cross-entropy is the NEGATIVE log of that probability. As written the quantity is at most zero and would be maximized, not minimized. Module 3, the lesson this points at, carries the sign explicitly, so the pointer contradicts its target.
- `optimization-edge/03-pruning.mdx:183` The lesson's own table two screens earlier says the 255 MB (340 to 85) was bought with 1.2 points by quantization alone, and that the second 1.2 points bought zero disk megabytes: 'uint8: 85 MB ... 93.0%' and 'uint8, pruned 60%: 85 MB ... 91.8%' (lines 141 and 143). The pruning pass bought 28 MB on 

### recurrent-networks

- `recurrent-networks/02-simple-rnns.mdx:152` Story canon puts the interval at 73.4 seconds through module 7 (docs/story-style-bible.md: "every 73.4 seconds when first measured (signal-processing)"; the interval-canon gate pins 73.4 for signal-processing/03 and anomaly-detection/05, and the 73.4 Hz / 73.4 s digit coincidence is a protected cano
- `recurrent-networks/01-sequences-matter.mdx:32` The hint is a verbatim excerpt of the AUTHORED solutionCode, but the exercise ships through velite's tsToJs() transpile, so the solution the learner is shown reads `const xs = []; const ys = [];` and `function makeWindows(data, windowSize, stride)`. The hint therefore quotes type annotations that ap

### signal-processing

- `signal-processing/exercises/fft-features.yaml:40` The signal is called archive data, but its peak amplitude is 1.4672, while the canonical raw amplitude feature is in ADC counts on 0 to 2048 with hull sensors saturating at 2048 (browser-runtimes/04:63-70, asserted by that module's grader at :63 and :68). The exercise's first returned feature is tha
- `signal-processing/01-time-vs-frequency.mdx:100` 30 Hz is neither in the course's catalogued natural set (5, 12, 23, 47 Hz, fixed 26 lines later at :115-119 and again at 02:161) nor the canonical anomaly (73.4 Hz). Labelling a 30 Hz line "the anomaly?" in the lesson that introduces the frequency view plants an association the next code block and t

### training-loop

- `training-loop/05-evaluating-deep-scan.mdx:133` The signal-1 median reproduces exactly; the signal-2 median does not. Two independent 400-rerun samples of the exact pipeline (lesson 4's seeded 100-row block, 50 epochs, batchSize 32, validationSplit 0.2, then predict on the three newSignals rows) put the signal-2 median at 10.18 and 9.76 percent, 
- `training-loop/04-training-loop.mdx:143` The direction is right, the magnitude is not. Re-fitting the already-trained model on the flipped labels halts at a median of 58 epochs out of the 500 budget, against a median of about 97 for the fresh network: sooner by roughly 40 percent, not 'almost immediately'. Only 1 of 10 runs halted anywhere


## Round-5 blind verification: outcome (2026-09-08)

Eleven blind readers, one per Deep Orbit module, each told nothing about
what had been edited and required to produce a measurement for every
finding. They measured 602 claims, confirmed 215 load-bearing claims
true, found zero em dashes in all eleven modules, and reported 17 high,
33 medium and 40 low findings. All 17 highs and all 33 mediums were
remediated the same day (51 fixed, 1 blocked). The lows are listed above.

The 17 highs fell into three groups, and the shape of the split is the
useful part:

- **3 were regressions from that same day's fixes.** The clearest one:
  after `llm-integration/02` gave sample 7741 a normal amplitude of 0.61,
  the lesson's Epilogue still credited "one added line, the normal
  amplitude range" as the thing that made the model succeed. With 1.82
  that line was load bearing, because 1.82 sat outside the band. With
  0.61 the band 0.1 to 1.0 admits every amplitude the sensors can
  produce, so the story no longer worked. Changing a number can
  invalidate a narrative built on it, several files away.
- **8 were graders beaten by no-understanding solutions**, including
  `llm-client`, which already carried a registered cheat file. Closing
  one cheat is not closing the cheat space.
- **6 were pre-existing content errors** no earlier round had caught,
  the two sharpest being `training-loop/02-gradient-descent.mdx:81`,
  which called a lerp factor of 1.5 a failure mode when measurement
  shows it converges about a thousand times closer than the lesson's own
  0.1 in the same twelve frames (divergence needs a factor above 2), and
  `llm-integration/05-multi-model-systems.mdx:95`, whose flagship code
  block fed one array to a `[null,3]` classifier and a `[null,11]`
  autoencoder, so no input length could run it.

Cheat coverage went from 20 to 43 of 65 exercises in one day.

### Blocked, needs a coordinated re-mint

`training-loop`'s seeded synthetic generators put 3 of 50 calm-frequency
samples above 1.00 (max 1.0387, which is 65 zero crossings against a 63
ceiling), 1 amplitude sample at -0.0597 and 2 negative phase samples.
The load-bearing ceiling is intact: no amplitude sample exceeds 1.00, so
the feature contract is not breached. The fix is a `clipByValue` at four
code sites, which changes the seeded data and so invalidates the 94.0
accuracy and the 0.518 that four files in modules 3, 4, 9 and 11 quote.
Whoever does it has to re-mint those two numbers across all four in one
pass.

## Exercise-layer coverage plan (owner-approved 2026-09-08, in progress)

The round-5 audit graded the exercise layer C across all 11 modules (17 D,
33 C, 14 B, 1 A, no A+) and found 12 lesson mechanisms that no exercise
makes the learner perform. The owner approved the plan below. Exercise
counts stay pinned at 65: 12 rewrites happen in place on the exercise
already attached to the right lesson, and only 3 exercises are retired.

### Done

- [x] `training-loop-exercise` rewritten for EARLY STOPPING, the most-cited
      gap (a stated learning objective of `training-loop/04` with no
      exercise anywhere in the course; `earlyStopping`, `val_loss`,
      `validationSplit`, `patience` and `callbacks` had 0 hits across all
      65 exercises). The learner now fits with a 500-epoch upper bound, a
      20% held-out split and `earlyStopping({ monitor: 'val_loss',
      patience: 5 })`, then writes `diagnose(trainLosses, valLosses)`.
      Graded on mechanism, not recital: the halt must sit exactly
      `patience` epochs past the best validation score, which is a fact
      only a real callback run produces. Measured on 8 runs, that offset
      was 5 every time on halts from epoch 79 to 113.
      Two measurement notes worth keeping:
      - The `diagnose` window is the last 10 epochs against the 10 before
        them, NOT thirds. Measured at the halt, a thirds window still
        reads the curve as falling 28% to 54%, because the steep early
        drop is inside the average. A plateau at the END of a run is only
        visible in a recent window.
      - A first version asserted the verdict on the run's own curves and
        was FLAKY: over 24 runs the recent-window change ran -15.84% to
        -0.47%, median -4.62%, straddling the 5% boundary, so 11 of 24
        read `still-learning` and 13 read `plateau`. The test now applies
        the rule independently and compares, which grades `diagnose`
        against a real curve without inheriting its variance. A 5-run
        sample had shown only -1.7% to -4.1% and was pure luck.

### Status 2026-09-12: 16 of 17 items landed

All 12 in-place rewrites are done, plus 1 of the 3 retirements and both
lead-in fixes. Gates green throughout: exercises 65/65 with 65 CHEAT-OK,
content 482/482, packages/ui 322, apps/web 217, format clean, zero em
dashes, 0 of 65 guidance hints dictating, 65 exercises and 65 cheat files.

Two deviations from the approved plan, both deliberate and both reported:

1. `incident-baseline-drift` was REWRITTEN IN PLACE rather than retired.
   The retirement was approved on the grounds that its decision rule
   appears in no lesson, and that is confirmed: it graded
   `driftMagnitude < 0.5` and `> 1.0` as cutoffs, and neither number is
   anywhere in the lesson. But deleting it also deleted the drift
   scenario, which is lesson 1's own epilogue. Instead the scenario stays
   and the untaught cutoffs are gone, replaced by the mechanism the
   lesson DOES teach and no exercise performed: rate times volume. Lesson
   1's own RecallPrompt states it ("P(|Z| > 3) is approximately 0.0027;
   multiplied by 100,000 readings that is ~270 false-positive flags").
   The learner now computes what the live baseline costs per day against
   what the 3-sigma rule promised. Measured fixtures: a shifted world
   fires 105 a day against a promise of 7 with the spread steady at
   1.01x, and a NOISIER world fires 517 a day (74x the promise) with the
   spread at 2.25x. That second case is the point: the alert count alone
   says roll forward, and rolling forward would widen the gate by more
   than half and quiet the detector. The registered cheat does the
   arithmetic correctly and ignores the spread: CHEAT-OK, cleared 4,
   rejected by 1.
2. `incident-false-alarm-storm` was HARDENED IN PLACE by its module owner
   rather than retired, before that agent was killed. Its cost-asymmetry
   replacement was NOT built. This is the one plan item still open.

Note for whoever picks it up: retiring a slug also breaks the calibration
pin in `packages/content/__tests__/guidance-hint-dictation.test.ts`, whose
VERIFIED_NON_DICTATIONS list is a historical set from the 2026-09-08
verification. `incident-checker-down` was removed from it when that
retirement landed, with the reason recorded in place.

### Remaining rewrites, in place, no exercise retired

- [ ] `build-autoencoder`: fit on clean normals and on 15%-contaminated
      normals, grade the ORDERING of reconstruction error (the module's
      own "KEY INSIGHT", currently never exercised: it adds four layers
      and compiles, never calling `fit`).
- [ ] `time-vs-frequency`: compute both spectra from the lesson's own two
      `generateSignal` calls; today it is nine lines of plain JS over four
      number arrays with no transform and no tensor.
- [ ] `build-rnn`: hand-run the reducer the lesson displays. Today a
      1-unit RNN certifies as the specified 16.
- [ ] `predict-next`: multi-step rollout with clamping to `LIMITS`.
- [ ] `find-threshold`: add a fixture where the recall maximizer and the
      F1 maximizer disagree, and assert the returned threshold.
- [ ] `build-layer`: return `{ model, predictedParams }` checked against
      `countParams()` at two input widths.
- [ ] `prune-weights`: prune a real model at 30/60/80% and assert the rare
      class degrades faster than the common one.
- [ ] `onnx-comparison`: the head-to-head the lesson promises; today it
      never imports `tf`.
- [ ] `simple-network`: cover compile-vs-train (predict before training,
      assert it pins near 0.5).
- [ ] `load-pretrained-pipeline`: force a task-name choice.
- [ ] `gpu-backend`: backend selection with the measured fallback ladder.
- [ ] `create-sequences`: fold in the rank-3 tensor. `tensor3d` has 0 hits
      across all 65 solutions, yet `[batch, timeSteps, features]` is
      module 6 lesson 1's entire point. Costs no slot.

### The 3 retirements

`EXERCISE_CONTENT` pins the COUNT (65), not the slugs, so a retirement is
one YAML out and one in. Each of these three hands over a numbered recipe
and grades whether it was typed back, and their decision rules appear in
no lesson at all.

- [ ] `incident-false-alarm-storm` becomes the cost-asymmetry threshold
      exercise.
- [ ] `incident-baseline-drift` becomes percentile-to-alert-count
      arithmetic (module 7 lesson 4's own numbers: 1% of 2,618 daily
      readings is 26 flags; two-a-week needs the 99.98th percentile).
- [ ] `incident-checker-down` becomes the RAG retrieve half.

### Two lead-in sentences, not exercise changes

`pruning.mdx` and `spectrograms.mdx` promise work their exercise does not
contain. Flagged specifically as a video risk: the narrator says one thing
and the screen shows another.

## Round 6 (2026-09-12): grade B+, binding constraint moved, item 1 closed

47 blind readers, one finding per measurement: 534 findings, 1,169
confirmations. Per-lens medians: claims A-, lesson body B+, writing B+,
exercise B. Cross-cutting: continuity A-, video readiness A-,
completeness B. Verification of the 105 highs: 95 reproduced, 1
refuted, 34 still high after severity correction, 183 overstatements.

Item 1 (practice-track gap) closed and independently measured:
`model.fit()` in 3 -> 7 solutions, recurrent layers 0 -> 4, training
now in modules 2, 3, 6, 7, 8 and 11. `llm-integration` stays at 0 of 6
touching `tf` on purpose; its mechanisms are JavaScript work.

Also landed this pass: the early-stopping grader's fabrication hole
(anti-fabrication assertion on `optimizer.iterations`), the stale
Challenge lead-in above it, `docs/capstone-models.md` byte count
de-pinned, and the `deep-scan` asset re-calibrated so sample 7741's
canon input scores 0.518 (trainer: `scripts/train-deep-scan-model.mjs`).

Open, in priority order: 2) nine graders with fixed-literal fixtures;
3) three lesson contradictions; 4) hint ladder is per lesson while nine
lessons gate on several exercises, and `boss-beat.tsx:76` auto-selects
on a 30 s timer; 5) "supervised" named once in 56 lessons, no cumulative
retrieval; 6) `who-this-is-for.tsx:67` "no video track" (owner call),
`foundations/04` is the only lesson without a bridge.

### Harness: the TypeScript stripper ate words inside learner strings (fixed 2026-09-12)

Both copies of the stripper (`scripts/lib/strip-typescript.mjs`,
`packages/ui/src/mdx/strip-typescript.ts`) ran every regex over the whole
source, so the `as Type` assertion regex deleted "as JSON" from inside a
prompt string and "as anomalous" from "the reading as anomalous". A learner
writing module 9's output request in natural English failed with no hint
why. Both copies now mask string, template, regex and comment contents
before the pipeline runs and restore them after; `${ }` inside a template
is still stripped as code. Pinned by
`packages/ui/src/mdx/strip-typescript-literals.test.ts` on both copies,
alongside the existing 66-case corpus parity test.

## Item-1 batch, blind-verified (2026-09-12): 12 open highs

Seven blind readers over the six modules item 1 touched plus harness parity.
Grades: recurrent-networks A-, advanced-time-series A-, optimization-edge B+,
anomaly-detection B, capstone B, llm-integration B, harness parity B. All 65
exercises agree across both harnesses (0 pass/fail, 0 test-name
disagreements). Five of the 17 highs were fixed the same day (the
TypeScript stripper eating words inside learner strings, two regressions in
`incident-baseline-drift`, the `build-autoencoder` nested-model fairness
defect, and null-result noise). The 12 below are open, each with the
reader's measurement in the run journal.

- `advanced-time-series/01-beyond-lstm.mdx:90` The third and fourth arguments are transposeA and transposeB and they are never explained anywhere in the shipped course. The audience is a JS engineer who was taught transpose() as a standalone op in foundations/03 and has never met matMul's positional boolea
- `advanced-time-series/02-temporal-attention.mdx:101` This paragraph exists to remove ambiguity and it introduces the module's worst one. Every other surface in the module and the course calls this gap 73.4 seconds (01:189 'the gap between hotspots measures 73.4 seconds', 03:219 'a pulse every 73.4 seconds', 04:1
- `capstone/02-ci-cd-pipeline.mdx:336` The same file path carries three different sizes inside one module. capstone/04-documentation.mdx:145 states weightBytes: 2,692 with the comment 'measured off weights.bin, not estimated', and 04:166-172 explicitly separates the classifier's own weight file fro
- `capstone/exercises/ci-cd-gate.yaml:125` The grader only ever presents an ALL-unlabeled batch. A gate that filters ungraded rows out of the denominator answers 0 there and passes, while on a partially-stripped holdout it reports a green gate on a batch nobody measured. That is the same failure the te
- `capstone/exercises/classify-anomaly.yaml:195` The season finale's stated point is that the sigma is measured from reading.window. No fixture can tell a measured sigma from the lesson-1 baseline constants, because the only second window the grader supplies (calmNight) is far tighter yet carries a reading t
- `capstone/exercises/verify-deployment.yaml:114` The ALL-checks contract is never tested. The only failing fixture is 1-of-2, which is not a majority either, so a runner that verifies a deployment whenever MORE THAN HALF the checks pass clears the whole grader. The 2-of-3 case that separates the two rules is
- `packages/ui/src/mdx/exercise-corpus.test.ts:6` The transport is indeed the only code difference, but the RUNTIME differs in a way that matters: TFJS selects its backend from the environment, and neither validation harness has the environment the learner has. tfjs 4.22 registers webgl at priority 2 gated on
- `llm-integration/02-prompt-engineering.mdx:92` The same paragraph (and the code block above it at :69 and :77) gives this reading as frequency 73.4 Hz and phase 0.23 rad, and the previous paragraph says the prompt reports raw units for values the classifier saw normalized. Under the settled feature contrac
- `llm-integration/03-rag-for-signals.mdx:29` Lesson 3 ships two exercises (retrieve-signals at :165, rag-pipeline at :169) and one hint ladder, and the whole ladder is written for the SECOND one. retrieve-signals is the first exercise on the page, is marked intermediate at 12 estimated minutes, and asks 
- `optimization-edge/03-pruning.mdx:99` The lesson and its own exercise teach opposite mechanisms for the same event. The lesson's ladder has the aggregate falling 94.2 to 87.5 at 80% sparsity and attributes that fall to the common classes (:97 "Whatever you can watch falling in that column is the c
- `optimization-edge/exercises/inference-cache.yaml:92` This is the only test that checks key design, and it only rules out keys that reduce the vector to one number. A submission that keeps every value, rounds them correctly, and joins them with NO separator passes all seven tests while merging distinct signals: [
- `optimization-edge/exercises/profile-model.yaml:161` The grader can be beaten by a submission that reports the FASTEST of the timed calls as avgInferenceMs. It keeps the warmup outside the loop, awaits the readback inside the clock, gets the MB arithmetic right and walks every layer, so it clears every discrimin

### Backend divergence: learners run on webgl, both harnesses run cpu (documented 2026-09-12, not fixable in node)

In a browser Worker `WorkerGlobalScope` is defined, so tfjs registers the
webgl backend and the learner's float arithmetic runs there. The CI vm
harness and the node worker in `exercise-corpus.test.ts` register cpu only.
The two harnesses agree with each other on every exercise; neither can
reproduce the learner's backend. Standing rule, now stated in the corpus
test header: a grader that trains a model asserts integers and offsets, or
tolerances at least 10x the measured cpu error. Anything tighter is a
webgl-only flake no gate will catch. Revisit only if a headless-webgl
runner becomes available in CI.

## Item-1 verification highs: all 12 closed (2026-09-12)

Eleven fixed by four module owners working from the verifiers' own
measurements; the twelfth (learners run on webgl, both harnesses run cpu)
is documented in `exercise-corpus.test.ts` and above, since node cannot
reproduce the learner's backend. Notable: `advanced-time-series` now says
the spike-to-shift gap is 74 steps, matching module 6's 74-step dependency
(it said 73, the only surface that did); the capstone's CI log and launch
manifest now name the 340/85 MB language bundle as
`models/report-lang-v1/` and keep `models/deep-scan-v1/` for the
2,692-byte classifier; five capstone surfaces that called the optimization
sprint "module 9" now say module 10; three `optimization-edge` surfaces
that put the bundle's size on "the weight file" now say the bundle's weight
files; `training-loop/05` no longer claims 7741 sits at exactly 0.5 on all
three dials (0.5, 0.58, 0.54). Gates: content 482, exercises 65/65 with 65
CHEAT-OK, ui 334, 0 of 65 hints dictate, interval canon unchanged.

### Logged, out of scope (unlaunched worlds)

Same majority-rule hole as `verify-deployment`, measured by the capstone
owner: `signal-ward/capstone/exercises/deploy-diagnostic-one.yaml:88-118`.
Same "all checks pass" contract, grep only, not measured:
`terra-grid/capstone/exercises/global-launch.yaml:100`,
`neon-protocol/capstone/exercises/validate-system.yaml:26`.

## Item 2 (2026-09-12/13): starter de-recipe, blind-verified, 23 highs closed

The starter dictation gate landed (`packages/content/__tests__/starter-dictation.test.ts`,
`scripts/lib/starter-dictation.mjs`, `scripts/report-starter-dictation.mjs`), the
de-recipe pass took 31 flagged starters to 0 of 65, and twelve blind readers (one
per module plus a cross-cutting "starter opened cold" lens over all 65) then
verified the batch by execution: fairness submissions written from the
instructions alone, untouched starters, ten runs of every stochastic solution,
every registered cheat, one fresh attack per grader, and every load-bearing
number in the prose. 163 findings, 241 claims confirmed true, 23 high, 76
medium, 64 low. Grades: foundations A-, neural-networks A-, signal-processing
A-, recurrent-networks A-, advanced-time-series A-, optimization-edge A-,
training-loop B+, browser-runtimes B+, anomaly-detection B+, llm-integration B+,
cold-starter lens B+, capstone B. The de-recipe itself held everywhere: no
starter earns a test, 60 of 65 instructions-only submissions passed first time,
and the five that did not were the fairness holes below.

**All 23 highs closed the same day, each proven by re-running the reader's
own probe:**

- Seven graded contracts lived only inside a TypeScript interface that
  `velite.config.ts`'s tsToJs strips before the learner sees the starter
  (browser-ml-tradeoffs, load-model, tfjs-setup, llm-client, profile-model,
  write-model-card, verify-deployment, model-pipeline's dangling
  "PipelineResult the starter declares"). The instructions now name every
  graded field. New durable gate `graded-contract-visible.test.ts` reads the
  DELIVERED starter and fails any graded interface field that no learner
  surface names (two input-only fields pinned with reasons).
- The instructions pane rendered the raw string in one `<p>`: newlines
  collapsed, backticks printed, and three pseudo-code return contracts with
  `//` comments became run-ons. `packages/ui/src/mdx/instruction-text.tsx`
  (paragraphs, lists, indented code, inline code; six unit tests) now renders
  instructions and, since 2026-09-13, the guidance hints in `hint-panel.tsx`.
- Sample 7741's normalized triple is 0.50 / 0.59 / 0.54, not 0.5 on all
  three (37 zero crossings of 63 is the 73.4 Hz tone; 0.500 would be 63 Hz).
  `neural-networks/02`, `training-loop/05`, the landing demo and both
  classifier assets now carry the exact triple: the 673-parameter asset was
  retrained (soft label 0.6222, prints 0.518) and the preview asset
  fine-tuned in place by the new `scripts/finetune-deep-scan-preview.mjs`
  (0.5127, so the demo still rounds to the story's "fifty-one percent").
  Re-measured on 1,200 lesson-4 retrains the exact triple sits MORE squarely
  on the fence (median 49.7, 517 of 1,200 inside 45 to 55); 20,000 untrained
  builds are quoted as rounded figures because exact counts move run to run.
- The capstone quoted the module-3 classifier (673 params, 2,692 bytes) on a
  model card that lists eleven features and five classes. Ten sites now say
  997 parameters and 3,988 bytes, `/models/deep-scan-v1` is rebuilt as that
  network by the new `scripts/build-deep-scan-v1.mjs` so "measured off
  weights.bin" is true, and the card now separates `inferenceMs` (0.035, the
  classifier alone) from `pipelineMs` (5 on WebGPU, 15 on WebGL, what the
  monitor times) the way it already separated the two sizes.
- Graders beaten by a reader's probe and hardened cheat-first, each with the
  authored message the probe now prints: time-vs-frequency (a dead-channel
  fixture; direction-only comparison rejected), incident-baseline-drift
  (promisedPerDay pinned at a second volume; a constant 7 rejected),
  llm-client (field names inside the JSON block as other keys' values; a
  string search over the block rejected), normalize-data (tensors OR arrays
  accepted with an authored message; a correct array-returning and a
  number-returning submission both pass now), training-loop-exercise (batch
  size read off `history.params` with the row count pinned at 80; a
  batchSize-16 submission passes 3 of 3, the fabricated-trace cheat still
  fails), forward-pass (the linear activation the grader recomputes is now
  stated), fft-features (band endpoints stated inclusive).
- Facts corrected by measurement: `training-loop/01`'s ln 2 epilogue (200
  fresh builds open between 0.60 and 0.82, thirty round to 0.69, none print
  0.6931: the first two digits are arithmetic, the last two the seed);
  `recurrent-networks/03`'s LSTM drill (epochs 60, held-out accuracy at
  coin-flip in every run, held-out loss up in eight of ten);
  `browser-runtimes/02`'s backend ladder (wasm above cpu, try/catch because
  an unregistered name throws while a failing registered backend resolves
  false); `optimization-edge/02`'s converter flag (the value is optional and
  the bare flag covers every weight); `advanced-time-series/02`'s last
  "step 77"; the ONNX session stubs in both harnesses now expose
  `inputNames`/`outputNames` so the lesson-faithful form passes.

**140 medium and low findings fixed by eleven module-exclusive editors, 17
skipped with reasons** (already fixed by hand, out of module, or structural:
one hint ladder per lesson, harness affordances, the shared gate calibration).
Notable editor work: build-layer's false claim about its grader corrected;
implement-neuron guards a plain-number return; incident-missed-anomaly gained
guards and a ranked return; batch-data's instructions de-recipeed; every
stated interval in training-loop widened to the reader's 40-run
re-measurement; predict-next's normalization statistics made physical.

**Harness lessons recorded in memory:** the validator grades
`packages/content/.velite/exercises.json`, so a YAML edit is untested until
`pnpm run build:content` runs (several earlier "green" per-slug runs had
certified stale text); six concurrent opus readers stall the API and the
harness restarts a stalled agent from zero at the next main-loop transition
(run readers at concurrency 3, stay in-turn on a Monitor).

**Gates on the final tree (2026-09-13):** content 561 of 561 (34 files, incl.
the new graded-contract gate), exercises 65 of 65, starters 65 with no
STARTER-CREDIT line, cheats 65 CHEAT-OK on four consecutive runs, ui 101
(corpus parity 65 of 65 with the stub change), web demo and boss-beat 11,
prettier clean on every changed file, zero em dashes, interval canon
unchanged. One full `--cheats` run earlier reported 64 of 65 with no failing
line captured (the grep kept only cheat verdicts); ten further full passes,
six plain and four `--cheats`, were 65 of 65 each, so it is a stochastic
solution flake below 1 in 650 that has not reproduced. If CI ever prints it,
the line will name the exercise; the stochastic set is the 34 slugs in
`scripts/exercise-cheats/` that train or draw random numbers. ~224 files
uncommitted (the owner commits).

## Item 2 verified twice (2026-09-13): the fix batch blind-read, 16 highs closed, 128 more fixes

The 23-high plus 140-medium/low batch from item 2 was itself blind-verified the
next morning: eleven module readers plus a cross-cutting lens over the retrieval
surfaces (objectives, youCanNow, recaps, RecallPrompts, the 65 hint ladders, the
65 Challenge lead-ins), told only that everything in front of them had been
edited in the last 24 hours. 142 findings, 250 claims confirmed true, 16 high,
57 medium, 69 low. Grades moved: eight A- (foundations, training-loop,
browser-runtimes, signal-processing, recurrent-networks, anomaly-detection,
advanced-time-series, optimization-edge), three B+ (neural-networks,
llm-integration, capstone), retrieval-surfaces lens B+. Before the batch the same
modules read six A-, four B+ and a B.

**The 16 highs, all closed by hand and proven by the reader's own probe.** Six
were regressions from the batch itself, which is why it was read: the sgd
sentence in `training-loop/04` pointed at the retired exercise; the ln 2
epilogue in `training-loop/01` contradicted itself (Farah now writes the
coin-flip mark, not the run's number); the LSTM drill's held-out band in
`recurrent-networks/03` could be broken in one rerun (now 0.30 to 0.80, landing
near a coin flip, with the twenty-row reason); `signal-processing/03` still
called the relabelled test tone 10 Hz (it is 20); `anomaly-detection/03`'s
solution rung had lost `tf.tidy` and failed its own grader (now the whole class,
a real multi-line block); `capstone/03`'s guidance rung lost its conditional
frame and ordered the wrong algorithm, and its solution rung lacked the
empty-window guard. The rest were pre-existing and load-bearing:
`neural-networks/03`'s depth demo collapsed one run in eight at 8 hidden units
(now 16, measured 0 of 60, prose re-based); the module named the positive class
three ways (now stated once in lesson 2, with both calibration tones above 0.5
explained as hand-picked weights); `foundations/05` gave the name "preview build"
to two models; `browser-runtimes/05` paired `ort.min.js` with the wrong wasm
binary (measured on a fresh npm pack of onnxruntime-web 1.29.0: that build fetches
the 27.8 MB / 6.6 MB jsep binary); `advanced-time-series/02` called module 6's
74-step dependency its window; `llm-integration/03`'s prompt promised any number
in a row while the checker admits four readings; `incident-false-alarm-storm`
graded two input fields no learner surface named; the cross lens caught
`training-loop/04`'s youCanNow promising the epoch-count habit the lesson
retires and `foundations/05`'s recap turning "keep it off open-ended streams"
into a rule the shipped classifier breaks.

**128 medium and low findings fixed by eleven module-exclusive editors, 13
skipped with reasons** (already fixed, out of module, structural). The two
cross-module leftovers were done by hand: the foundations recaps now say once
each that "capture" and "channel" carry two referents in this course.

**Gates on the final tree (2026-09-13 11:16):** content 561 of 561, exercises
65 of 65 twice, starters 65 with no STARTER-CREDIT line, cheats 65 CHEAT-OK
twice, ui 405 of 405 (32 files, corpus parity on), web 730 of 730 (113 files),
prettier clean on every changed file, zero em dashes, interval canon unchanged.
84 files changed since the last commit (the owner commits).

**What the second reading says about the method.** The batch-verification
loop converges: 23 highs became 16, of which 6 were the batch's own; 140
mediums and lows became 128 with most of the second set on the one surface the
first set did not target (the closing youCanNow line, which nine lessons
still overstate against their grader and the editors have now rewritten). The
two words doing double duty ("capture", "channel") and the 5 ms / 15 ms pair
that two different calls land on (module 10's bundle benchmark and the
capstone's classify() pipeline) are now stated on their pages rather than left
for the reader to reconcile.

### Deferred from item 2 (structural, logged here only)

- Keep type declarations in the delivered starter (make tsToJs preserve
  `interface`/`type` blocks, or score the transpiled starter in the dictation
  gate). The graded-contract gate covers the fairness half; the pedagogy half
  (a learner seeing the declared shape in the editor) is an owner call.
- A pre-test throw in the runner should name the step it came from
  (`create-a-tensor`, `classify-anomaly`): a harness affordance in
  `packages/ui/src/mdx/exercise-runner.ts`, all 65 exercises.
- build-layer's grader cannot tell arithmetic from a probe model's
  `countParams()` without observing model construction (harness affordance).
- Retire the starter gate's frozen `--band` evidence only if a new calibration
  set is measured; the anomaly-detection editor declined to re-pin the 0.32
  limit and that was right.
- rag-pipeline's "61.2 seconds" versus lesson 1's 63.1 and lesson 5's 62.0 is
  CI-pinned per file (interval canon) and needs an owner ruling on which
  interval the season's clock reads at that point.

### Held for the owner (plan item 4, structural)

`apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx:561-563`
renders one HintPanel from `lesson.hints` regardless of exercise count, and
`packages/content/velite.config.ts:179-225` gives exercises no hints field,
so a lesson carrying two exercises can never ladder both. Nine lessons do.
