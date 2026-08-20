# Pre-Lesson Copy Audit, 2026-08-19

Rule audited (owner directive, 2026-08-16, recorded during the first-run
dashboard copy round): on any surface a first-time visitor sees before
starting lesson 1, every line must pass two questions: "would a person
write this?" and "does a stranger parse it in one pass with zero product
or story context?" Literal values beat editorial phrasing. A tease or
gamified stat that needs explaining is cut, not reworded. Key:value
telemetry lines passed the owner's bar; free-floating fragments did not.

Method: two independent sweeps. (1) A lexicon sweep that built the story
vocabulary from docs/story-style-bible.md, docs/character-bible.md,
docs/patch-bible.md, and packages/worlds/src, then searched every
pre-lesson surface for it. (2) A full judgment read of each pre-lesson
surface line by line. Scope: landing and its components, /about, /learn,
/pricing, /compare, /paywall, /onboarding, /auth, /worlds index, live
world detail, coming-soon pages, first-run dashboard, 404/error pages,
metadata (SEO, OG, JSON-LD), and pre-lesson emails. Excluded: lesson
content in packages/content (except strings a pre-lesson component
renders), post-activity dashboard states, admin.

Fixed the same day, before this audit ran: the landing hero paragraph
(story-free rewrite), the DeepScanDemo framing caption ("the story's
ship" cut), and the hero eyebrow / stat line / trust line (removed by
the owner directly).

Not findings, previously approved: the first-run dashboard's key:value
telemetry values ("LOCATION: ARCHIMEDES · MONITORING STATION", "SIGNAL:
INCOMING FROM SECTOR 7-G") and "Streak: 0" passed the owner's bar in the
2026-08-16 round and are listed here only for completeness
(apps/web/app/dashboard/first-run-view.tsx:23-24, 72).

Dispositions used below: FIX (clear violation or bug), CUT (tease whose
reveal belongs later), DECIDE (conflicts with other owner-authored
copy or a deliberate design; needs a ruling), BORDERLINE (parses for
most strangers; listed so nothing is silently dropped).

## 1. Factual and claim bugs (fix regardless of the copy rule)

- FIX apps/web/app/layout.tsx:38, sitewide meta description: "Covers
  TensorFlow JS, Transformers.js, LSTMs, CNNs, and transformer
  tutorials." apps/web/app/faq-data.ts:11 states "CNNs and full
  transformer architectures are not covered." The sitewide SEO
  description is false. It is also a keyword list, not a sentence.
- FIX apps/web/app/compare/page.tsx:65-66: "KL divergence in the math
  companion (ELBO, DDPM with future worlds)". Advertises unshipped
  product, which the 2026-08-14 future-plans sweep removed everywhere
  else; this cell was missed. ELBO and DDPM are also undefined.
- FIX apps/web/app/pricing/pricing-tiers.tsx:346: "Get Single →". The
  internal plan id surfaced as a button label; nobody writes this.
- FIX apps/web/app/worlds/world-cards-grid.tsx:256-263: "11 mod · 56
  lessons". "mod" is not a word a person writes.
- ~~DECIDE apps/web/app/paywall/page.tsx:26, 92, 98, 250: the "Module 1
  is done" premise.~~ **WITHDRAWN 2026-08-20, the finding was wrong.**
  The sweep asserted /paywall is "a documented direct landing target for
  email/social campaigns"; that claim is unsupported. Verified: the page
  sets `robots: { index: false, follow: false }`, and every link into it
  is authenticated and gated on having finished the free module
  (worlds/[slug]/page.tsx:263 and :425 require
  `completedModuleCount > 0 && !hasPurchased && nextLockedModule`;
  dashboard/page.tsx:278 requires `modIndex > 0 && !purchased`). The
  only doc references are analytics event definitions and dev-plan
  history, not campaign copy. So the premise is true for everyone who
  can reach the page, and no change is needed. If /paywall is ever used
  as a public campaign destination, this finding becomes live again.

## 2. Story vocabulary on pre-lesson surfaces (clear rule hits)

### Onboarding (apps/web/app/onboarding/page.tsx), the worst surface

- FIX :490 "MISSION BRIEFING" (eyebrow of screen 1).
- FIX :492-495 "Welcome Aboard / the Archimedes" (first heading a new
  account sees names a ship the reader has never heard of).
- FIX :474 "11 modules aboard the Archimedes" (Story-Driven card).
- FIX :547 "CREW ASSESSMENT" (label on a background-questions form).
- FIX :553-555 "Advanced and expert crew get the math derivations..."
  ("crew" recasts the user as a fictional role mid-form).
- FIX :689 "MISSION OBJECTIVE" (label over a goal radio group).
- FIX :695 "This tells us which bridges and future worlds to build
  next." ("bridges" and "worlds" undefined here; also names unshipped
  product, same directive as the /compare hit above).
- FIX :759 summary row label "World" / value "Deep Orbit (live now)",
  the exact bare-stat-label pattern the owner flagged on the first-run
  dashboard, reproduced in the onboarding summary.
- FIX :803-804 "Your first mission: understand what a tensor is..."
  ("mission" is deep-orbit's renamed lesson unit; rest of the line is
  clean).
- CUT :784 "LAUNCH SEQUENCE" (story framing on the summary step).
- BORDERLINE :440 "Begin Briefing →" (mission vocabulary on the
  primary button of screen 1).
- BORDERLINE :800 "All Systems Go" (parses as idiom).
- BORDERLINE :450 "Start Deep Orbit →" (world name on the submit
  button; the summary row above at least names it).
- BORDERLINE :481 "Train a working classifier by module 3"
  ("classifier" undefined).

### First-run dashboard (apps/web/app/dashboard/first-run-view.tsx)

- FIX :64 with :214: `Start First ${lessonTerm} →` resolves to "Start
  First Mission →" for deep-orbit via the manifest terminology. The
  primary CTA renames the one word the screen most needs literal. The
  rest of the component conforms to the 2026-08-16 rewrite.
- BORDERLINE :72 "Streak" as a bare gamified stat label (value "0" is
  correctly literal; owner saw this component in the 08-16 round).
- BORDERLINE :73 stat label renders "DEEP ORBIT" (the in-file comment
  avoids the internal word "world" but substitutes a story name equally
  unexplained before lesson 1).

### Deep Orbit module map, the last page before lesson 1

(apps/web/app/worlds/[slug]/page.tsx, module-map-client.tsx,
world-cast.tsx)

- FIX page.tsx:35 meta description = the manifest's plot paragraph:
  "Research vessel Archimedes has entered an uncharted nebula. The
  ship's AI is failing. Build DEEP SCAN, a deep-space signal
  classifier." Every noun requires the story; this is the search
  snippet. Same string in course-jsonld.ts:18 and
  packages/worlds/src/deep-orbit.ts:9.
- FIX module-map-client.tsx:421-423, 496: lesson kickers render canon
  geography ("Archimedes, Bridge", "Archimedes, Lab") or "Mission 01"
  as the label a stranger reads to size up a lesson.
- FIX module-map-client.tsx:531-540: truncated `lesson.narrative`
  loglines quote five character names and the ship ("Dr. Farah analyzes
  the dimensional structure...", "Commander Mirza orders all sensor
  data normalized before the deep scan begins.") on the guest-visible
  map. Render-site finding; the strings live in content frontmatter.
- FIX module-map-client.tsx:197, 293: aria-labels substitute story
  terminology ("Sector 1: ...", "0 of 5 Missions complete");
  screen-reader users lose the words "module" and "lesson" entirely.
- CUT module-map-client.tsx:545-555, 567-573: the bare "X → Y" bridge
  badge and the "{n} bridge" count chip; gamified counts of an
  undefined unit, the reveal belongs in the lesson.
- FIX page.tsx:325-327 "Pick up where you left off." addresses a
  returning learner on the page every first-time CTA lands on.
- FIX page.tsx:331-336: "Active Now" / "Avg Score" render "–" on a
  zero-activity visit; the rule's own example says the literal 0 (or
  removing the row) beats a glyph.
- BORDERLINE world-cast.tsx:42-44, 54-62: "The crew" heading plus the
  five-character roster ("ARIA / Ship AI", "Chief Nazari / Skeptic")
  on a pre-purchase page that never establishes the course is
  story-driven.
- FIX page.tsx:419-421: source of the terminology propagation into the
  map (see section 3).
- BORDERLINE page.tsx:316 eyebrow "Deep Orbit · 11 MODULES" (world
  name bare, though this page is the world's own detail page).

### Landing page

- FIX apps/web/app/components/landing-hero.tsx:90 and the default in
  apps/web/app/components/mdx/deep-scan-demo.tsx:120: headerLabel
  "DEEP SCAN · live inference · running in your tab" / "DEEP SCAN ·
  preview build · live inference". The in-fiction system name sits
  above the demo with nothing saying what DEEP SCAN is. (Separate from
  the framing-caption fix that landed today.)
- FIX apps/web/app/page.tsx:69 "Live signals classified normal or
  anomalous by an autoencoder + LSTM ensemble you build yourself."
  ("autoencoder + LSTM ensemble" is exactly the vocabulary the
  audience is defined as not yet having; "live signals" is the
  season's story noun.)
- BORDERLINE page.tsx:73 "Real-time inference..." ("inference"
  undefined; WebGL/client-side fine).
- BORDERLINE page.tsx:77 "...able to explain every layer."
  (presumes neural-network layers.)
- BORDERLINE page.tsx:129-131 final CTA headline "Bridge / the gap."
  (parses as the idiom; the bridge section above makes the product
  reading live).
- BORDERLINE page.tsx:22-26 sr-only h2 is a keyword list read aloud to
  screen-reader users as real copy.
- BORDERLINE landing-hero.tsx:68 "Run Your First Tensor (Free) →" and
  bridge-preview-section.tsx:139 "Write your first tensor, free →"
  ("tensor" is the taught term with no gloss in reach).
- BORDERLINE mdx/deep-scan-demo.tsx:212 "sample 7741" (canon anomaly
  id; reads as a generic row id to a stranger).

### Pre-lesson emails

- FIX docs/email-retention-sequences.md:17 subject "Module 1 is free.
  The pager is already on." (second clause is story vocabulary sent to
  someone who has never opened a lesson).
- FIX apps/api/src/lib/newsletter.ts:102, 161, 164 and
  apps/web/app/unsubscribe/page.tsx:48, 69: "The Bridge" as the
  newsletter's name reaches waitlist subscribers who have never seen
  the mechanic; the digest h1 never connects the name, and the
  unsubscribe confirmation has no gloss at all (:69 gets "the weekly
  digest stops" one line late; :48 gets nothing).
- BORDERLINE docs/email-templates.md:90 subject "Your first lesson
  awaits." ("awaits" is editorial where "Module 1 is open" is
  literal).
- DECIDE docs/email-templates.md, per-event Kit copy ("Your
  Tensorcraft week." with "bridges learned, streak" body goal; "You
  shipped {world}."): lives in the Kit dashboard, outside a code fix,
  inside the rule's blast radius. Needs an operator pass in Kit.

## 3. Systemic source: manifest terminology overrides

packages/worlds/src/*.ts `terminology` (lesson→Mission / Protocol /
Procedure / Session / Operation; module→Sector / Ward / Gallery /
Station) leaks into pre-lesson UI wherever a surface renders
`world.terminology`:

- coming-soon-stub.tsx:194 "The 11 Sectors" / "The 11 Wards" /
  "The 11 Galleries" / "The 11 Stations" (syllabus heading).
- coming-soon-stub.tsx:200-201 "5 Protocols per Sector" / "5
  Procedures per Ward" (the one line that exists to state course
  shape; both nouns renamed).
- module-map-client.tsx aria-labels and kickers (section 2).
- first-run-view.tsx:214 "Start First Mission →" (section 2).
- onboarding/page.tsx:803 "Your first mission" (section 2).
- guest-module-banner.tsx:55, 61-64 "Sector 1 complete..."
  (borderline on scope: shown only after the guest finishes module 1).

Root-cause option: pre-lesson surfaces render the literal words
"module" and "lesson"; terminology overrides stay for in-lesson
surfaces where the story has been introduced.

## 4. Product vocabulary without a gloss ("world", "bridge", world names)

The product's own unit names are not story vocabulary, but the rule's
second question still fails wherever they appear with no definition in
reach. Grouped by exposure:

### 4a. Context-free surfaces (SEO, share cards, JSON-LD, errors), FIX

No page context exists to introduce anything here; these need
plain-language rewrites.

- apps/web/app/pricing/page.tsx:21-22 title/description "$59 per
  World"; :28, 35, 41 OG/Twitter "Buy a World. Keep It Forever.";
  :29, 42 descriptions; :32, 44 OG-image params (rendered into the
  share image); :58 OfferCatalog description.
- apps/web/app/pricing/pricing-jsonld.ts:35-60 ("Single world",
  "Two-world bundle", "All five worlds...", plus "Module 1 of Deep
  Orbit free"). Note: if the bundle-ladder entries here also predate
  the 2026-08-14 future-plans sweep, they are a second missed cell of
  that directive; verify against the sweep's scope.
- apps/web/app/worlds/page.tsx:17, 19, 28, 30, 35, 37: "Deep Orbit is
  live, 4 more coming", "Five worlds, one live", OG-image params; the
  description glosses only Deep Orbit, the other four names are bare.
- apps/web/app/about/page.tsx:11-12 meta description "the bridge-tier
  method" (defined on the page, not in the snippet); :54 JSON-LD
  "...the first of 5 planned worlds."
- apps/web/app/terms/page.tsx:7 meta description "one-time world
  purchases".
- apps/web/app/paywall/page.tsx:26 title (also section 1).
- apps/web/app/worlds/[slug]/not-found.tsx:9, 12, 22 "404 · WORLD NOT
  FOUND" / "World not found" / "Browse worlds" and
  apps/web/lib/error-messages.ts:13 "This lesson or world doesn't
  exist." (reachable from any bad link).

### 4b. On-page uses far from any gloss, FIX or gloss at first use

- apps/web/app/faq-data.ts:11 "The launched world covers neural
  networks, LSTMs, signal processing, and attention." (undefined
  "world" plus undefined acronyms in the answer to the site's most
  basic question); :30-31 "How long does Deep Orbit take?"; :35 "the
  live world... The full world costs $59" (names, never defines).
- apps/web/app/learn/page.tsx:74-76, 96, 117, 142, 173 ("the live
  world", "each world culminates...", "Module 1 of Deep Orbit",
  "4 more worlds ship in waves:", "See All 5 Worlds →").
- apps/web/app/pricing/pricing-tiers.tsx:235-236 ("bridges" as a bare
  feature noun), :290 "one world · lifetime access", :298 "Single
  World", :301-302, :330 "pick 1 world", :344 disabledReason "Select a
  world above" (the explanation a blocked buyer reads).
- apps/web/app/pricing/curriculum-preview.tsx:41 "What's in a World",
  :44, :127 (Deep Orbit bare).
- apps/web/app/compare/page.tsx:58 "Identity / structural / intuition
  labels + breaks" (three tier names and "breaks" as a noun, undefined
  in a table cell; the explanation exists only at :149), :81 "(one
  world live today)", :88 "$59 per world".
- apps/web/app/components/nav.tsx:82 and mobile-nav.tsx:10 "Worlds"
  as the bare global nav label.
- apps/web/app/worlds/world-cards-grid.tsx:98 "New worlds, launch
  discounts." and newsletter-modal.tsx:103 (modal carries no
  definition of its own).
- apps/web/app/paywall/page.tsx:101-104 "You've seen the bridge...
  layers, backprop, signal processing, recurrent networks" (the page
  never defines the mechanic; "backprop"/"recurrent networks"
  undefined), who-this-is-for.tsx:45 ("tensors") and :68 (Deep Orbit
  bare), commit-trail.tsx:37 (repo name carries the world slug,
  presented as a literal artifact string), :59-61 "by the capstone...
  the exact format the push pipeline writes" ("push pipeline" is
  internal vocabulary; "capstone" near-structural).
- apps/web/app/privacy/page.tsx:91 "streaks... arena challenges"
  (product surfaces a first-time reader has never seen; legal-accuracy
  tension, see section 5), :238-239 tc_world cookie row (partially
  self-describing).
- apps/web/app/terms/page.tsx:94-95 "World purchases are one-time
  payments..." (the legally operative sentence uses the undefined unit
  twice), :119 "creates a repository... per world".

### 4c. Introduced in place, BORDERLINE, acceptable as-is

- five-worlds-section.tsx:131, 147: "CHOOSE YOUR WORLD" / "Five
  Worlds" (defined three lines later by "Five story universes"; the
  eyebrow still lands first).
- bridge-preview-section.tsx:42, 128: "THE BRIDGE SYSTEM" and the
  "bridge:" key (the h2 and the two-column JS/ML panel define the
  mechanic in place; the key is jargon-as-key rather than telemetry).
- pricing/page.tsx:100-102 ("Each world is a separate ML
  specialization" is a working definition).
- worlds/page.tsx:81-89 ("Five ML specializations, each told through
  its own story universe" glosses the heading).
- about/page.tsx:111 with the definition arriving at :122-124.
- learn/page.tsx:81 ("bridges: {n} analogies map ML concepts to
  JavaScript concepts" is self-defining).
- pricing-tiers.tsx:242 "JS-to-ML bridges" (prefix self-introduces);
  :246 "Illustrated scenes" (a stranger cannot tell if a scene is art,
  a lesson, or a beat).

## 5. Owner-authored copy in conflict with the newer rule, DECIDE

These are rule hits, but the copy was deliberately authored or
approved by the owner, in some cases after significant iteration. They
need a ruling, not a silent fix.

- ~~World taglines, the "Where X ..." pattern~~ **RULED 2026-08-20:
  KEEP, unchanged.** Owner decision. The five taglines stay exactly as
  written ("Where signals guide you through the unknown", "Where AI
  watches the city", "Where language saves lives", "Where AI learns to
  imagine", "Where models meet the real world") on all three pre-lesson
  surfaces (five-worlds-section.tsx:168-170, world-cards-grid.tsx:249,
  coming-soon-stub.tsx:155). Do not reopen this in a future audit: the
  pattern is deliberate and postdates nothing that overrides it.
- The coming-soon pages' story-forward design (2026-07-19 redesign):
  statusBoard org/status lines ("NEURALCORE HQ · SURVEILLANCE GRID",
  "200 CAMERAS DARK · REBUILD PENDING", coming-soon-stub.tsx:133-140
  via packages/worlds/src manifests), plot-paragraph hero and meta
  description (:162, :91), in-fiction waitlist CTA labels "Get the
  signal" / "Get paged" / "Save my invite" / "Put me on call" (:172,
  :447; a stranger cannot tell the button joins a waitlist), "{n} in
  the full rebuild" (:204), capstone system names ("Capstone: Protocol
  Sentinel", :246), in-fiction module statuses "Online · Free" /
  "Finale" / "Pending" (:258, "Online" also contradicts the page's own
  coming-soon claim), "The cast" with `c.personality` writing-room
  notes (:366-416; note world-cast.tsx:57-58 deliberately dropped
  `personality` for the live world, this surface still renders it, and
  :416 renders bare names "+ Lin, NEON"), unlaunched-world character
  rosters (:393-405), "to $333K / yr" floating axis fragment (:321).
  These pages exist to sell story worlds, and memory records
  coming-soon as the one sanctioned exception for future-product
  display. Ruling needed: exempt coming-soon from the pre-lesson bar
  as a story showcase, or bring it to the bar. If exempted, the meta
  description and JSON-LD (:91) should still be rewritten: search
  snippets reach strangers with zero framing.
- "ship in waves" (five-worlds-section.tsx:152-153, worlds/page.tsx:
  86-87, learn/page.tsx:142): editorial phrasing standing in for the
  literal "no dates announced". Repeated house phrase, so a ruling
  beats piecemeal edits.
- sr-only keyword h2 (page.tsx:22-26) and the layout keyword list:
  SEO-driven by design; screen-reader users hear them as copy. Ruling:
  accept the SEO tradeoff or rewrite as sentences.
- Legal enumerations naming product surfaces (privacy:91, terms:94-95):
  accuracy requires naming them; a defining clause ("world, a
  purchasable course track") would satisfy both.

## Counts

Unique findings after deduplication across both sweeps: 96.
By disposition: 54 FIX, 3 CUT, 6 DECIDE (5 groups), 33 BORDERLINE.
Root causes: 5 of the worst clusters trace to packages/worlds/src
manifest strings (taglines, plot descriptions, terminology overrides,
statusBoard, ctaLabels) rendered onto pre-lesson surfaces.

## Recommended order

1. Section 1 factual bugs (layout.tsx description is live and false).
2. Onboarding, first-run CTA, and the Deep Orbit module map: the
   highest-traffic pre-lesson surfaces with the clearest violations.
3. The two DECIDE rulings (taglines, coming-soon exemption) before
   touching anything they cover.
4. The systemic fixes: literal module/lesson on pre-lesson surfaces,
   plain-language metadata rewrites, a gloss convention for "world" at
   first use per surface.

Ledger authored from two subagent sweeps, spot-verified against source
on 2026-08-19.

## Applied (2026-08-19, same day, owner instruction "apply the fixes everywhere")

All FIX and CUT items above were applied, with these deviations and
discoveries:

- The bundle offers in pricing-jsonld.ts turned out to be filtered by
  `LAUNCHED_WORLDS` before publishing (only launched tiers emit), so
  they were never user-visible; the bundle rows of that finding were a
  config-level false positive. Only the published "Single world" offer
  was renamed ("Full course").
- Kept on purpose, covered by an on-page gloss: the nav "Worlds" label
  (renaming it is an IA change, and /worlds introduces the term),
  pricing tier internals ("Single World", "pick 1 world", "Select a
  world above", "one world · lifetime access"; the pricing hero defines
  the unit), and the /worlds grid newsletter heading. Policy applied:
  context-free surfaces (SEO, OG, JSON-LD, 404, emails) use plain
  words; on-page copy may keep "world" after the page glosses it.
- The DeepScanDemo default headerLabel ("DEEP SCAN · preview build")
  stays: it renders only inside lesson MDX where the story is
  established. The landing override is now "LIVE DEMO · running in
  your tab".
- Onboarding eyebrows became a plain set (WELCOME / ABOUT YOU / YOUR
  GOAL / READY) rather than cutting LAUNCH SEQUENCE's slot, keeping the
  four-step layout intact. "Begin Briefing →" was fixed despite its
  borderline mark: with MISSION BRIEFING gone, the button's referent
  dangled.
- The live-world meta description and Course JSON-LD now compose plain
  copy from manifest fields; the manifest's story description still
  serves the coming-soon surfaces pending the section 5 ruling.

Verification (final state at end of session): 1757 unit tests pass
(5 assertions updated to the new copy: first-run CTA x2, JSON-LD offer
name x2, pricing CTA x1; 2 new tests added pinning the DeepScanDemo
framing caption as story-free); 112 e2e pass with `--workers=1` and
zero failures; all 30 axe audits pass in both schemes; all 28 visual
baselines pass after 18 were re-minted (landing, pricing, worlds index,
paywall, deep-orbit map, both responsive sets); `turbo typecheck` passes
across 10 packages; eslint and prettier clean.

Still open: the section 5 DECIDE rulings, and the Kit email subject
lines (operator task outside this repo).

## Second pass applied 2026-08-20 (owner: "Go")

Four remaining fixes plus the module-summary mechanism, all shipped:

1. **Waitlist buttons.** All four coming-soon CTAs now read "Join the
   waitlist" (were "Get the signal", "Get paged", "Save my invite", "Put
   me on call"). A visitor could not tell those joined a waitlist, which
   made it a conversion defect on pages whose only job is email capture.
   `WorldPreview.ctaLabel` stays per-world so a future world can vary it;
   its doc comment now records why the in-fiction labels went.
2. **Coming-soon metadata.** The page keeps its story copy, ruled
   exempt. Its `<meta name="description">` and Course JSON-LD now state
   what the course is and that it is unreleased, because a search
   snippet reaches a stranger with no page around it.
3. **"ship in waves"** replaced with the literal fact on all three
   surfaces (/learn, /worlds, landing five-worlds section): the other
   four have no release dates yet.
4. **Legal defining clauses.** /terms now opens the purchase section
   with "A world is one complete course track, such as Deep Orbit".
   /privacy replaces the bare "streaks" with "your run of consecutive
   active days" and glosses "arena challenges" in place. Both snapshot
   tests updated; no compliance doc mirrors those sentences (the other
   "streaks" references in docs are database schema, not prose).

5. **Module summaries (option 2, the recommended one).** Every
   `module.yaml` in a built world now carries a required `summary`: one
   plain sentence, no story vocabulary. `description` is untouched and
   still serves in-course surfaces. The module map
   (worlds/[slug]/page.tsx) and the /pricing curriculum preview now read
   `summary`. Verified on the live page: "Board the Archimedes with 64
   channels of telemetry" no longer appears anywhere in the module map's
   HTML, and the plain line renders in its place.

   New gate: `packages/content/__tests__/module-summary-prelesson.test.ts`
   requires a quoted one-line `summary` on every built-world module,
   rejects a story-lexicon hit inside it, and caps length. Scoped to
   `BUILT_STORY_WORLDS` to match the velite schema, so unlaunched worlds
   are exempt until they launch. The gate was confirmed to actually fail
   by injecting "Board the Archimedes and meet the crew" into module 1,
   which it caught on both "Archimedes" and "the crew".

The 11 summaries as shipped are in the module.yaml files; they are
one sentence each, name what you build, and use the FE anchors the
lessons already lean on (Float32Array, reducers, cache expiry).

### Superseded: the module-description ruling below

Both sweeps missed this one; it surfaced when the applied module map was
checked against the live page. Every module description in
`packages/content/content/deep-orbit/*/module.yaml` is story prose, and
it renders on two pre-lesson surfaces: the module map
(module-map-client.tsx:271, visible for module 1, which is expanded by
default for guests) and the /pricing curriculum preview
(curriculum-preview.tsx:104, visible pre-purchase for all 11).

Examples as they render today:

- foundations: "Board the Archimedes with 64 channels of telemetry and
  no idea what is in them." Note "64 channels" is one of the exact
  phrases the owner flagged in the 2026-08-16 round.
- neural-networks: "ARIA's rules can name two calibration tones and
  nothing else."
- training-loop: "Train the DEEP SCAN signal classifier ... Farah stays
  behind with the one archived reading it will not commit on."
- capstone: "It ends at 0157 on a single bridge console: a hot canary
  over one live pulse ..."

This was left alone deliberately. It is the same class of decision as
the world taglines in section 5: the text is owner-authored prose held
to the story style bible, it is the module's canonical description
across surfaces, and rewriting all 11 would strip the story from the
product's own curriculum listing. Options, cheapest first:

1. Keep the descriptions and stop rendering them pre-lesson (the module
   map and curriculum preview show module title + lesson count only).
2. Add a second plain-language `summary` field per module for
   pre-lesson surfaces, keeping `description` for in-course use.
3. Rewrite all 11 descriptions story-free (loses the story hook on
   /pricing, which is also a sales surface).

Recommendation: option 2. It satisfies the rule without deleting
owner-authored prose, and /pricing keeps a sellable line.

### Two pre-existing e2e bugs found and fixed while verifying

Both were confirmed pre-existing by restoring the pre-change files and
watching them fail identically, so neither was caused by this work.

- `e2e/worlds.spec.ts` "shows module list with correct order" asserted
  `/training loop/i`, but module 3 has been titled "Training: Loss,
  Gradients & Optimization" since the content was first built. The only
  "The Training Loop" on the page is a lesson title inside module 3,
  which stays collapsed for guests, so the assertion matched nothing.
  Now asserts `/training:/i`, preserving the test's intent.
- `e2e/accessibility.spec.ts` failed the light-mode landing audit on a
  color-contrast violation. The cause was sampling, not color: the
  settle helper waited 800ms, while the hero's demo panel animates for
  0.9s after a 0.25s delay, so axe measured a partly transparent
  element and computed a blended foreground (4.19:1 and 4.25:1 on
  different runs, both under the 4.5:1 AA threshold). Dark mode passed
  because primary-on-surface has more headroom there. The settle wait is
  now 1600ms and all 30 audits pass, which also confirms the palette
  itself clears AA at rest.

### The visual gate cannot see a one-line copy edit on a tall page

Noticed on 2026-08-20 while re-minting: the landing baselines came back
byte-identical after "ship in waves" was replaced, even though the two
strings render at the same spot. The gate was then proved to work by
swapping that line for a long sentinel string, which failed both landing
tests immediately. So the region IS captured; the ordinary edit simply
falls under the threshold.

The arithmetic: the landing capture is 1280x4861, about 6.2 million
pixels, and `maxDiffPixelRatio` is 0.001. One line of 15px body text is
roughly 5,000 changed pixels, near 0.08 percent, comfortably under the
0.1 percent gate. Anything that does not reflow the page is invisible to
this suite.

Practical consequence: do not treat a green visual run as evidence that
copy changed correctly. Verify copy by reading the rendered HTML (`curl
| grep`), which is what caught the RSC payload leak the same week. The
visual suite is for layout and palette regressions, and it does that
job. Tightening the tolerance is not obviously right either, since these
full-page captures are exactly where anti-aliasing noise accumulates;
scoping a per-section screenshot would be the real fix if copy ever
needs pixel coverage.

Also worth recording for whoever runs these next: the full e2e suite at
default parallelism produces 3 to 4 rotating false failures per run on
this machine (a different set each time) because the dev server
cold-compiles under load. `--workers=1` is the honest signal. Separately,
a long-lived dev server across repeated Playwright runs corrupts
`.next/server/vendor-chunks` and starts serving 500s (it surfaced here as
a 500 on /worlds/deep-orbit); the repo's `predev` script clears it, so
restart the server rather than debugging the page.

### Payload cleanup applied alongside the map fixes

`worlds/[slug]/page.tsx` no longer sends `sceneLocation`, `narrative`,
`bridgeJs` or `bridgeMl` to ModuleMapClient. Removing the rendering
alone left the story text sitting in the page's serialized RSC payload,
where it is still in the HTML source of a pre-lesson page. Verified
gone: the only remaining story strings in that page's source are the
module description above and the deliberately-kept cast section.
