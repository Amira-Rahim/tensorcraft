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

**B6, when EU/UK sales open.** Stripe Tax setup and the `STRIPE_TAX_ENABLED`
flip, non-Union OSS registration, separate UK VAT registration, removing the
geo-gate, and the Stripe invoice half of the receipt.

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

- [ ] **/learn v5 video-first (2026-08-27), supersedes the v4 store page.**
  The owner's Flow/Veo trailer (72s, Epidemic "ES_Slipping" bed) shipped
  to `public/media/learn-trailer*`; the page is now trailer hero ->
  crew line -> collapsible "About this video" transcript -> close CTAs.
  Video SEO: VideoObject JSON-LD + sitemap `videos` entry + the visible
  transcript block. Store-page components deleted (git history keeps
  them). Watch GSC after deploy: the owner accepted the thin-content
  tradeoff; if the "javascript machine learning" cluster slips, the
  lever is expanding the transcript block, not restoring sections.
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

- [ ] **AI video scenes** (post-V1, one-time ~$540-1,140 via Runway Gen-3/4 +
  ElevenLabs). Full design spec: `docs/future-ai-video-scenes.md`. Key
  decisions made: stylized/animated, 5-15s clips, R2 CDN, `<VideoScene>`
  swap, build-time generation. Revisit when world sales can fund it or AI
  video drops below ~$0.25/clip. Subsumes audio narration (video includes
  voice acting).
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
  commercial use; selling a $59-159 product on it is a ToS/takedown risk
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
