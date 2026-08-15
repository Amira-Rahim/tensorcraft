# Scene Bible: Deep Orbit

Single source of truth for the per-lesson scene portrait art (the
establishing shots rendered by `ScenePortrait` under each Briefing slugline
and on the 7 distinct-location Epilogues). Companion to
`docs/character-bible.md` and `docs/patch-bible.md` (module mission patches
+ world seal), same contract: **the prompts here are the contract.** Art may be regenerated at any time, but it must keep matching
each entry's location canon, moment and staging notes. Nothing here blocks a
build; until an image ships, the lesson renders exactly as it does today.

Asset convention (wired in code 2026-08-05):
`apps/web/public/scenes/deep-orbit/<module-slug>/<lesson-slug>.webp`,
epilogue variants `<lesson-slug>-epilogue.webp`. Ship size 1536x1024 webp
q80, budget 150 KB target / 200 KB hard cap per image
(`scripts/art/ingest.mjs` enforces). Alt text lands in the lesson
frontmatter as `scene.portraitAlt` / `scene.epiloguePortraitAlt`.

## Shared scene style token

Append verbatim to every scene prompt:

> cel-shaded cartoon illustration, clean bold linework, flat shading with
> one soft key light, slightly stylized proportions, wide cinematic
> environment framing, near-black space beyond the viewports, green #6BAA8A
> interface glow and rim light, warm brass #A89060 metal trim, cohesive
> series look, not photorealistic.

## Staging rules

1. **Silhouette rule (hard).** Characters occupy at most ~20% of frame
   height: faces averted, in shadow, or rim-lit silhouette. Identity is
   carried by silhouette, posture and signature prop (Mirza's brass
   chronometer, Farah's stylus and holo lines, Nazari's multitool, Demir's
   glowing wrist terminal, ARIA as her waveform on a screen). Face identity
   already lives in the adjacent dialogue avatars; a scene shot that needs
   a readable face is mis-staged. Several epilogues are pure
   environment/screen shots with no figures at all.
2. **Master-plate consistency.** Every scene generates with its location's
   approved master plate as a reference image so the Bridge stays the same
   Bridge across 24 scenes. Never invent new set dressing per lesson; vary
   camera distance, light state and what the displays show.
3. **Alt text** is authored with the prompt: 150 characters or less,
   present tense, describes the depicted moment plainly, no "image of",
   fictional names allowed.
4. **No text in frame.** Screens show waveforms, charts and glyphs, never
   readable words (generated text always artifacts).

## Location canon: master plates

Generate and approve these four first (Gate C); they are the reference
images for every per-lesson shot. Masters are also reusable as marketing /
world-page art.

**Shipped 2026-08-10.** All four ingest to
`apps/web/public/locations/deep-orbit/<location>.webp` via
`node scripts/art/ingest.mjs masters`, at the same 1536x1024 / 200 KB cap as
scenes (shipped at 99-130 KB). The Bridge plate is the ground of the landing
page's Five Worlds band and of the Deep Orbit world page backdrop; see
`docs/superpowers/specs/2026-08-09-art-marketing-surfaces-design.md`.

### Auxiliary plates

Page plates that are NOT scene references (no lesson generates against
them), produced through the same masters pipeline and shipped to the same
directory. One exists:

**`adrift`** (shipped 2026-08-15): a single small survey probe alone in
open space, slack tether floating loose, one faint green running light,
vast empty starfield, no planet, no station. Rendered on the 404 and
route-error pages (`surfacePlateSrc(world, "not-found" | "error")`); the
copy says the route is lost, the art says how far. Prompt in
`scripts/art/masters.mjs`; canon at
`docs/art-refs/deep-orbit/masters/adrift.png`.

Two things to know before regenerating them:

- `newest()` in the ingest script picks by name sort, which means the latest
  timestamp, not the approved plate. Masters are the only asset class with a
  human approval gate, so those two rules can silently disagree. Check each
  winner against its canon below before ingesting, and if the wrong file
  wins, rename the approved one rather than teaching the picker a second
  rule (it is shared with portraits and scenes, which have no such gate).
- Accepted deviation: the shipped `dashboard-station` plate shows five
  monitors where the prompt below says three. It reads correctly as the
  aft-rail alcove and it was the only candidate, so it was taken as-is.

### Bridge (`masters/bridge`)

- **Set** Two-tier command deck of the survey ship Archimedes. Forward
  band of angular viewports onto near-black starfield; center holo table
  throwing green light up onto surrounding consoles; Mirza's command
  station on the raised aft tier with a brass chronometer mounted at eye
  line; Demir's comms alcove port-side with a wrist-terminal dock and
  stacked signal boards. Brass trim on rails and console edges.
- **Camera canon** Centered and symmetric, looking forward down the deck:
  the viewport band wraps the upper frame, the holo table sits dead center
  throwing green upward, and the raised command tier with the chronometer
  spans behind it. Scene variation comes from camera distance (wide, mid,
  push) and light state, never from a new angle. Epilogue "main displays"
  shots are a push toward the forward display wall on the same axis.
  (Set at Gate 0, 2026-08-09: the approved master plate found this framing
  and it reads more like a bridge than the off-axis angle first written
  here. The plate is the reference for all 24 Bridge scenes, so the canon
  follows the art.)
- **Light states** duty (even green interface glow), alert (deeper shadow,
  agitated display scatter), after-hours (consoles dimmed, starlight
  dominant).
- **Do / Don't** Do keep it lived-in and precise: mugs, taped-up notes,
  worn deck plates. Don't add crew beyond the staged figures, don't make
  it a warship (no weapons stations), don't add readable text.
- **Master prompt** Empty bridge of a survey starship, two-tier command
  deck, angular forward viewports onto a near-black starfield, central
  holographic table casting green light, raised command station with a
  brass chronometer, port-side comms alcove with stacked signal boards,
  duty lighting, no crew. + scene style token

### Lab (`masters/lab`)

- **Set** Dr. Farah's signal analysis lab. Long workbench with brass
  instruments; wall-sized holographic whiteboard mid-derivation (glyphs
  and curves, never words); floor-to-ceiling glass wall on one side
  looking onto a corridor; telemetry displays showing waveforms; a
  spectrograph column throwing slow green ripples.
- **Camera canon** Shot from the corridor-side corner: glass wall grazes
  the right edge, whiteboard wall faces camera, workbench crosses the
  foreground. The "Lab, Glass Wall" epilogue reverses to look THROUGH the
  glass from the corridor, the only sanctioned reverse.
- **Light states** working (whiteboard glow dominant), late (single bench
  lamp + display glow), discovery (every display lit at once).
- **Do / Don't** Do keep Farah's precision visible: labeled sample racks,
  ordered instruments, one deliberate coffee ring. Don't clutter into a
  junk lab, don't show biological specimens (signals lab, not wet lab).
- **Master prompt** Empty starship signal-analysis lab, long workbench
  with brass instruments, wall-sized holographic whiteboard covered in
  glowing green curves and glyphs, glass wall onto a dim corridor,
  telemetry displays showing waveforms, working light, no crew. + scene
  style token

### Engineering (`masters/engineering`)

- **Set** Chief Nazari's engineering bay. Tool wall with every tool
  shadow-outlined in its place; heavy coolant conduits crossing the
  ceiling; a decommissioned rule-engine cabinet (dark, panel half open,
  the ghost of his last mission) against the aft wall; diagnostics bay
  with hanging work lights; deck plates polished by use.
- **Camera canon** Shot from the bay entrance looking in: tool wall left,
  diagnostics bay center, rule-engine cabinet visible in the aft shadow.
- **Light states** work (hanging lamps, warm-leaning), diagnostic (green
  display wash), incident (a single red-orange status lamp allowed, the
  only non-palette accent in the world).
- **Do / Don't** Do keep Nazari's discipline: nothing out of place, wear
  without mess. Don't make it grimy or sparks-flying; competence, not
  chaos.
- **Master prompt** Empty starship engineering bay, tool wall with
  shadow-outlined tools, heavy coolant conduits across the ceiling, a
  dark decommissioned computer cabinet with a half-open panel in the aft
  shadow, diagnostics bay under hanging work lights, warm work lighting
  with green display glow, no crew. + scene style token

### Dashboard Station (`masters/dashboard-station`)

- **Set** A tight monitoring alcove on the Bridge's aft rail: three
  stacked dashboard monitors (charts, gauges, rolling waveforms), one
  chair, a clamped mug. It is a corner OF the Bridge and must read as
  one.
- **Derivation** Generated image-to-image from the approved Bridge master
  (camera push into the aft-rail alcove), never from scratch.
- **Master prompt** Tight monitoring alcove on a starship bridge aft
  rail, three stacked dashboard monitors showing glowing green charts and
  gauges, single chair, clamped mug, bridge blurred beyond, duty
  lighting, no crew. + scene style token

### Epilogue one-offs

Mini-sets derived from the nearest master, not new locations:

- **Galley, Spare Monitor** (`training-loop/01`): ship's galley counter,
  brass fittings, mugs on a rail, one spare monitor bolted above the
  counter showing a green loss curve. Derive palette/trim from the Bridge
  master.
- **Lab, Glass Wall** (`foundations/05`): the sanctioned reverse angle
  through the Lab's glass wall.
- All Bridge display epilogues (`anomaly-detection/03`,
  `neural-networks/01`, `llm-integration/03`, `recurrent-networks/05`,
  `capstone/05`): camera pushes on the Bridge master's forward display
  wall; what the displays show is the storytelling.

## Per-lesson entries

Entry format (one per briefing scene; epilogue entries carry an
`-epilogue` suffix in the heading):

```text
#### <module>/<lesson-slug>
(lesson-slug is the runtime velite slug, with no NN- file prefix:
it is what the asset path and `scripts/art/ingest.mjs` validate against)
- Location / time: frontmatter verbatim
- Characters present: staged per the silhouette rule (or "none")
- Moment: 1-2 sentences, drafted from the briefing, user-reviewed
- Prompt: [ref: masters/<location>] staging + moment + scene style token
- Alt: 150 chars or less
- Status: pending | generated | approved | shipped (+ lineage note)
```

### foundations

#### foundations/introduction-to-tensors
- Location / time: Archimedes, Bridge (Six hours after first contact)
- Characters present: Commander Mirza (command tier, brass chronometer), Ensign Demir (comms alcove, glowing wrist terminal), ARIA (waveform on an alcove screen)
- Moment: Six hours after first contact, ARIA has thrown all 4,096 of her parsing rules at the Sector 7-G stream and every one has failed. Mirza turns the problem over to Demir, the one crew member who starts from data structures instead of rules.
- Prompt: [ref: masters/bridge] Wide shot from the port-forward quarter looking aft in duty lighting, the holo table throwing up a single tall column of unstructured noise glyphs while Mirza stands rim-lit at the raised command station beside the brass chronometer and Demir turns from the comms alcove with wrist terminal glowing, ARIA's waveform rippling on an alcove screen. + scene style token
- Alt: On the Archimedes bridge, Mirza and Demir face a holo column of unparsed signal noise while ARIA's waveform ripples on a side screen.
- Status: pending

#### foundations/tensor-shapes
- Location / time: Archimedes, Lab (no time)
- Characters present: Dr. Farah (stylus, holo lines)
- Moment: A sensor log has caught the stream repeating at two distinct scales, and Farah refuses to analyze a single value until she knows its dimensional layout. She hunts the grid, candidate row and column splits, that turns the flat sequence into structure.
- Prompt: [ref: masters/lab] Canonical wide shot from the corridor-side corner in working light, the holographic whiteboard dominant with candidate grid partitions sketched over a long flat data ribbon, telemetry displays repeating the same waveform at two nested scales, Farah a small rim-lit silhouette at the workbench with stylus raised toward a hovering holo lattice. + scene style token
- Alt: In the signal lab, Farah studies holo grids that carve a flat data ribbon into candidate layouts, the same waveform echoing at two scales.
- Status: pending

#### foundations/tensor-operations
- Location / time: Archimedes, Bridge (Second watch)
- Characters present: Chief Nazari (multitool), Ensign Demir (glowing wrist terminal)
- Moment: Demir's channel amplifier has crashed the main console with a matMul shape mismatch, sixty-four channels of raw signal going nowhere. Nazari wants the feeds cleaned, combined, and amplified at sensor speed, 983 thousand raw samples a minute.
- Prompt: [ref: masters/bridge] Mid shot from the port-forward quarter looking aft in alert light with agitated display scatter, a main console frozen mid-scroll with sixty-four stacked channel traces snarled into a garbled knot glyph, Nazari a rim-lit silhouette leaning over the console with multitool in hand while Demir hunches small at the seat, wrist terminal glowing. + scene style token
- Alt: Nazari leans over Demir's bridge console, where sixty-four channel traces have snarled into a frozen knot.
- Status: pending

#### foundations/data-loading
- Location / time: Archimedes, Engineering (Morning after the crash)
- Characters present: Ensign Demir (glowing wrist terminal), ARIA (waveform on a diagnostics screen)
- Moment: Demir's overnight fetch-everything loop died 19,204 readings into the 28,800-reading archive, forty gigabytes deep, and took ARIA's diagnostic queue down with it. The morning post-mortem turns one crashed array into the case for lazy, batched loading.
- Prompt: [ref: masters/engineering] Shot from the bay entrance in incident light with a single red-orange status lamp over the diagnostics bay, the main diagnostic display showing a memory gauge pinned full above a rising curve that cuts off mid-climb, Demir a small silhouette slumped at the bay with wrist terminal glowing, ARIA's waveform flickering on a side screen. + scene style token
- Alt: Under a red status lamp in engineering, Demir faces a diagnostic screen where a memory curve climbs and cuts off mid-rise.
- Status: pending

#### foundations/normalization
- Location / time: Archimedes, Bridge (no time)
- Characters present: Commander Mirza (command tier, brass chronometer), Ensign Demir (glowing wrist terminal), Dr. Farah (stylus)
- Moment: Mirza orders every sensor feed normalized to one scale before the deep scan: the thermal channel reads in the thirties while signal strength lives under one, and raw feeds would let temperature drown the story. Mid-job, the archive scroll stops on sample 7741, inside every baseline yet wrong on one scale out of four.
- Prompt: [ref: masters/bridge] Wide holo-table shot from the port-forward quarter looking aft in duty light, the table projecting four sensor traces at wildly mismatched amplitudes converging into one narrow shared band with a single archive glyph ringed and hovering apart, Mirza rim-lit on the raised tier by the chronometer while Demir and Farah stand small at the table edge, her stylus mid-gesture. + scene style token
- Alt: The bridge holo table squeezes four mismatched sensor traces onto one shared scale while a lone ringed sample hangs apart.
- Status: pending

#### foundations/normalization-epilogue
- Location / time: Bridge, Main Displays (no time)
- Characters present: Ensign Demir and Dr. Farah (small silhouettes at the rail, backs to camera)
- Moment: The normalized feeds go live and the bridge displays settle onto one scale, but sample 7741 still refuses to look like the others. Farah runs a preview classifier across the archive: five clean verdicts and one shrug stuck at the midpoint, and she flags the sample instead of deleting it.
- Prompt: [ref: masters/bridge] Camera push from the port-forward quarter toward the forward display wall in duty light, every display carrying feeds aligned to a single calm scale except one panel where a lone trace sits ringed beside a verdict gauge stuck at its midpoint, Demir and Farah tiny rim-lit silhouettes at the rail with their backs to camera. + scene style token
- Alt: Bridge displays settle onto one scale; one ringed sample sits beside a half-lit verdict gauge as Demir and Farah watch.
- Status: pending

### neural-networks

#### neural-networks/first-neuron
- Location / time: Archimedes, Lab (no time)
- Characters present: Dr. Farah (stylus, holo lines)
- Moment: The calibration bench plays the ship's two reference tones, the cleanest labeled data aboard, while the 7-G stream matches neither and defeats every fixed rule. Farah proposes the smallest thing that can learn: a single neuron, taught on the tones.
- Prompt: [ref: masters/lab] Bench-level mid shot from the corridor-side corner in working light with the spectrograph column rippling, telemetry showing two clean steady waveforms side by side and a third jagged trace apart from them, the whiteboard behind holding one circled node with three converging input lines, Farah a rim-lit silhouette at the bench tracing the node with her stylus. + scene style token
- Alt: At the lab bench, Farah sketches a single-node diagram while two clean reference tones and one jagged stranger glow on telemetry.
- Status: pending

#### neural-networks/first-neuron-epilogue
- Location / time: Galley, Spare Monitor (no time)
- Characters present: Chief Nazari (multitool at belt, mug in hand)
- Moment: The neuron's output runs on a spare monitor above the galley coffee machine, fed the two calibration tones on a loop: two level traces holding far apart, twenty minutes without a single crossover. Nazari watches longer than she would admit, weighing what sixty-four channels will cost, then takes a coffee with her.
- Prompt: [ref: masters/bridge] Galley one-off derived from the Bridge master's brass fittings and palette, close shot down the counter past mugs on a rail to one bolted spare monitor showing two flat green traces holding steadily apart, low after-hours light, Nazari a small rim-lit silhouette pausing beneath it with a mug, multitool at her belt. + scene style token
- Alt: In the dim galley, Nazari pauses with a mug under a spare monitor where two green traces hold steadily apart.
- Status: pending

#### neural-networks/activation-functions
- Location / time: Archimedes, Bridge (no time)
- Characters present: Chief Nazari (multitool), Ensign Demir (glowing wrist terminal)
- Moment: The neuron scored one reading at negative eleven and another at six hundred, and Nazari wants to know which one is a yes: the alert board takes yes or no, not "depends on the scale". The unbounded outputs need squashing into decisions.
- Prompt: [ref: masters/bridge] Mid shot from the port-forward quarter toward the port-side comms alcove in duty light, a stacked signal board carrying two bars at absurdly mismatched heights above a small S-curve glyph, Nazari a rim-lit silhouette jabbing the multitool toward the board while Demir sits small at the alcove console with wrist terminal glowing. + scene style token
- Alt: Nazari points her multitool at a bridge signal board where two bars tower at wildly different heights over an S-curve glyph.
- Status: pending

#### neural-networks/layers-and-architecture
- Location / time: Archimedes, Engineering (no time)
- Characters present: Chief Nazari (multitool)
- Moment: One neuron cleared two calibration tones, but the live stream is sixty-four channels and ARIA's false flags already cost nine crew-hours in a week. Nazari demands a system built in stages, with the parameter count quoted before anything else.
- Prompt: [ref: masters/engineering] Shot from the bay entrance in mixed work light and green display glow, a holo over the diagnostics bay showing three narrowing layer blocks linked left to right into a single output node with a tally glyph hovering beneath, Nazari a rim-lit silhouette with arms crossed and multitool in fist, the dark rule-engine cabinet half open in the aft shadow. + scene style token
- Alt: Nazari faces a holo of three narrowing layer blocks in the engineering bay, the dead rule-engine cabinet dark behind her.
- Status: pending

#### neural-networks/forward-pass
- Location / time: Archimedes, Bridge (After the 0940 demo)
- Characters present: Dr. Farah (stylus), Ensign Demir (glowing wrist terminal)
- Moment: The 0940 demo died on stage in front of Mirza, a shape mismatch from one missing batch dimension stalling the classifier at minute four. With the bridge cleared, Farah orders the forward pass run again, properly, wanting to watch the system fail and recover.
- Prompt: [ref: masters/bridge] Wide shot from the port-forward quarter looking aft with most consoles idle and only one station lit, the forward display holding a halted pipeline diagram with its first block outlined and detached from the incoming data ribbon, Demir hunched small at the live console with wrist terminal glowing while Farah stands rim-lit behind him, stylus folded in her arms. + scene style token
- Alt: On a nearly idle bridge, Farah watches over Demir as he reruns a stalled pipeline diagram whose first block sits detached.
- Status: pending

#### neural-networks/building-a-network
- Location / time: Archimedes, Bridge (no time)
- Characters present: Commander Mirza (command tier, brass chronometer)
- Moment: Mirza gives the order: assemble the full DEEP SCAN classifier and have it compiled and ready for training by end of watch. Layers, activations, optimizer and loss wired together, weights still random numbers, mostly.
- Prompt: [ref: masters/bridge] Wide duty-light shot from the port-forward quarter looking aft, the holo table projecting a complete three-stage network schematic slowly rotating with ready-state gauges ringed around its base, Mirza a lone rim-lit silhouette on the raised tier with a hand resting beside the brass chronometer. + scene style token
- Alt: A complete three-stage network schematic rotates over the bridge holo table while Mirza watches alone from the command tier.
- Status: pending

### training-loop

#### training-loop/loss-functions
- Location / time: Archimedes, Lab (no time)
- Characters present: Dr. Farah (stylus, holo lines)
- Moment: The new network predicts 0.52 for a signal whose true label is 1.0, and Farah wants wrongness made mathematical: a loss function that turns the gap between prediction and truth into one number the crew can drive down.
- Prompt: [ref: masters/lab] Late-light shot from the corridor-side corner with a single bench lamp and display glow, the whiteboard holding one clean parabola over derivation glyphs while a telemetry display shows two markers on a probability rail with a bracket spanning the gap between them, Farah a small rim-lit silhouette at the bench sighting along her stylus. + scene style token
- Alt: In the lamplit lab, Farah measures the gap between two markers on a probability rail beneath a whiteboard parabola.
- Status: pending

#### training-loop/loss-functions-epilogue
- Location / time: Lab, Glass Wall (no time)
- Characters present: Dr. Farah (marker raised), Ensign Demir (smaller silhouette beside her)
- Moment: Farah writes the network's opening loss on the lab's glass wall in marker, dated and initialed: the exact cross-entropy of a coin flip, the score of a network that knows nothing at all. Until that number moves, nobody claims the network has learned anything.
- Prompt: [ref: masters/lab] The sanctioned reverse angle looking through the glass wall from the dim corridor with lab displays glowing beyond, a short mirror-reversed marker scrawl small on the glass at eye height, Farah a rim-lit silhouette just inside with marker still raised and Demir a smaller shadow beside her. + scene style token
- Alt: Seen from the corridor, a small marker scrawl sits reversed on the lab glass; Farah stands inside, marker raised, Demir beside her.
- Status: pending

#### training-loop/gradient-descent
- Location / time: Archimedes, Engineering (no time)
- Characters present: Chief Nazari (multitool)
- Moment: The loss says the network is wrong; Nazari wants to know which knobs to turn, which weights go up, which go down, and by how much. The answer is the slope under the current weights, the same update every easing loop already runs.
- Prompt: [ref: masters/engineering] Mid shot from the bay entrance in warm work light under the hanging lamps, the diagnostics display showing a bowl-shaped curve with a bright dot descending it in discrete shrinking steps, Nazari a rim-lit silhouette before the display with multitool in hand, head tilted at the slope. + scene style token
- Alt: Nazari studies an engineering display where a bright dot walks down a bowl-shaped curve in shrinking steps.
- Status: pending

#### training-loop/backpropagation
- Location / time: Archimedes, Engineering (no time)
- Characters present: Ensign Demir (glowing wrist terminal), ARIA (waveform on an adjacent screen)
- Moment: Demir scales the nudge-and-rerun gradient method to all 673 parameters and pays the price on the rig: one full forward pass per parameter per step, 27 seconds a step, a run stretching past thirty hours. ARIA, watching, notes there is a procedure that gets all 673 derivatives in one backward sweep.
- Prompt: [ref: masters/engineering] Close shot into the diagnostics bay from the entrance in green diagnostic wash, the main display crawling through a vast grid of parameter cells with only a thin lit arc of progress, Demir a small rim-lit silhouette sagging at the console with wrist terminal glowing, ARIA's waveform steady on an adjacent screen. + scene style token
- Alt: Demir waits in the green-lit bay as a huge grid of parameter cells fills one by one, ARIA's waveform watching from a side screen.
- Status: pending

#### training-loop/training-loop
- Location / time: Archimedes, Engineering (The training run)
- Characters present: Ensign Demir (glowing wrist terminal)
- Moment: The number from the glass wall is finally moving: the training log ticks epoch by epoch as the loss slides from coin-flip 0.6931 into a steady fall. Demir has run the loop by hand twice this week; tonight model.fit runs it, and he watches to find out whether he trusts it.
- Prompt: [ref: masters/engineering] Wide shot from the bay entrance with hanging lamps dimmed and the room lit mostly by its own displays, the main diagnostic screen carrying a long loss curve stepping steadily downward past rows of epoch tick glyphs, Demir a small rim-lit silhouette standing back from the console with arms folded and wrist terminal glowing. + scene style token
- Alt: Demir stands back in the dim bay, watching a loss curve step steadily downward across the main engineering display.
- Status: pending

#### training-loop/evaluating-deep-scan
- Location / time: Archimedes, Bridge (Deployment review)
- Characters present: Commander Mirza (command tier, brass chronometer)
- Moment: Training is complete and Mirza convenes the deployment review with one demand: run the evaluation suite and bring real numbers on signals the network has never seen. Held-out data gets the first honest word on DEEP SCAN.
- Prompt: [ref: masters/bridge] Close shot from the port-forward quarter onto the holo table and raised tier in even duty light, the table projecting a glowing two-by-two grid of verdict cells flanked by steady gauges over a strip of fresh unseen waveforms, Mirza alone as a rim-lit silhouette at the command station with one hand near the brass chronometer. + scene style token
- Alt: Mirza stands alone at the command tier as the holo table shows a two-by-two verdict grid over a strip of new waveforms.
- Status: pending

### browser-runtimes

#### browser-runtimes/why-the-browser
- Location / time: Archimedes, Bridge (no time)
- Characters present: Chief Nazari (multitool), Ensign Demir (glowing wrist terminal)
- Moment: Nazari refuses to route signal data through a server on every reading: the classifier runs in the bridge dashboard or it does not ship. Demir wonders whether a dashboard tab can really carry a model trained on the engineering rig's GPU.
- Prompt: [ref: masters/bridge] Mid-wide shot from the port-forward quarter looking aft, duty lighting, one aft-rail dashboard console dark with only an empty chart grid while the holo table streams a live looping signal trace, a forward display schematic of a signal path glyph splitting toward a far node and a near node; Nazari a small rim-lit silhouette pointing at the dark console, Demir beside her lit by his wrist terminal. + scene style token
- Alt: Nazari points to a dark dashboard console with an empty chart grid while the bridge holo table streams a live signal trace.
- Status: pending

#### browser-runtimes/tensorflow-js-setup
- Location / time: Archimedes, Bridge (Benchmark pass)
- Characters present: Ensign Demir (glowing wrist terminal), Chief Nazari (multitool)
- Moment: Demir wires TensorFlow.js into the dashboard like any npm dependency, until the benchmark shows the same matrix multiply spread 30x across three backends and Nazari orders him to check which engine he actually landed on.
- Prompt: [ref: masters/bridge] Close shot from the port-forward quarter on a single bridge console, duty lighting with console glow dominant, its screen showing three timing bars of sharply different heights beside a small pulsing readiness glyph; Demir seated as a small silhouette with his wrist terminal glowing over the keys, Nazari standing at his shoulder in rim light, multitool in hand. + scene style token
- Alt: Demir sits at a bridge console showing three timing bars of very different heights while Nazari watches over his shoulder.
- Status: pending

#### browser-runtimes/model-loading
- Location / time: Bridge, Dashboard Station (no time)
- Characters present: Ensign Demir (glowing wrist terminal)
- Moment: First integration of the trained model into the dashboard and the console's first word is an error: Demir aimed the loader at a single file, and the 404 teaches him that a model ships as a manifest plus binary weight shards.
- Prompt: [ref: masters/dashboard-station] Tight alcove shot on the three stacked monitors, duty lighting with the bridge blurred beyond, the top monitor blank except one hollow alert glyph, the middle showing a diagram of a single block fanning out to a row of small shard blocks, the bottom rolling untouched telemetry; Demir alone in the chair as a small silhouette, head tilted at the blank screen, wrist terminal glowing beside the clamped mug. + scene style token
- Alt: Demir sits in the dashboard alcove before a blank monitor with a lone alert glyph and a diagram of one block fanning into shards.
- Status: pending

#### browser-runtimes/inference-pipeline
- Location / time: Archimedes, Bridge (Going live)
- Characters present: Ensign Demir (glowing wrist terminal), Chief Nazari (multitool)
- Moment: The signal feed goes live: one reading per second flows through the model and classifications stream across the dashboard, while Nazari reminds Demir that 86,400 undisposed tensors a day will kill the tab before shift change.
- Prompt: [ref: masters/bridge] Mid shot from the port-forward quarter looking aft, duty lighting with a live animated feel, forward displays streaming a rolling ticker of small green pulses broken by a single brass-amber tick, the holo table carrying a rolling waveform with a fresh reading blooming at its edge; Demir a small silhouette at his console with wrist terminal glowing, Nazari behind the rail watching the feed, arms crossed over her multitool. + scene style token
- Alt: Live classification pulses stream green across the bridge displays, one amber tick among them, as Demir and Nazari watch.
- Status: pending

#### browser-runtimes/onnx-runtime-web
- Location / time: Archimedes, Engineering (no time)
- Characters present: Chief Nazari (multitool), Ensign Demir (glowing wrist terminal)
- Moment: Nazari refuses to ship the first runtime they tried and orders a TF.js versus ONNX Runtime benchmark, cold start, sustained inference, memory, numbers not opinions, warning that a missing operator has no polyfill and fails at load.
- Prompt: [ref: masters/engineering] Shot from the bay entrance looking in, diagnostic light with green display wash, the diagnostics bay displays split into two side-by-side benchmark traces with paired gauge dials beneath them, the dark rule-engine cabinet holding the aft shadow; Nazari a small rim-lit silhouette at the diagnostics bay with her multitool raised mid-point, Demir seated lower at the bench with his wrist terminal glowing. + scene style token
- Alt: Two benchmark traces run side by side on the engineering diagnostics displays as Nazari and Demir compare runtimes.
- Status: pending

#### browser-runtimes/transformers-js
- Location / time: Archimedes, Lab (no time)
- Characters present: Ensign Demir (glowing wrist terminal), Chief Nazari (multitool)
- Moment: All the bridge wants is a sentiment flag on the crew's daily status reports, and Demir asks if he really has to train a model for that; Nazari's answer is a pretrained pipeline, no training loop, no labeled data, no GPU.
- Prompt: [ref: masters/lab] Wide shot from the corridor-side corner, working light, a small bench screen glowing with a tidy three-step pipeline glyph of a download arrow feeding a box feeding a gauge, while across the room the spectrograph column ripples with the stubborn anomaly waveform; Demir a small silhouette at the bench lit by his wrist terminal, Nazari in rim light by the glass wall with her multitool at her belt. + scene style token
- Alt: A tidy pipeline glyph glows on a lab bench screen while the spectrograph column ripples with the untamed anomaly signal.
- Status: pending

### signal-processing

#### signal-processing/time-vs-frequency
- Location / time: Archimedes, Lab (Archive playback)
- Characters present: Dr. Farah and Ensign Demir as small rim-lit silhouettes, faces averted (stylus; glowing wrist terminal)
- Moment: Farah drags her pinned first-week capture to the center of the display and puts the live plot beside it: the same slow breathing swell in both, still unnamed, and she proposes the frequency domain is the view that could finally explain it.
- Prompt: [ref: masters/lab] Mid shot from the corridor-side corner across the workbench, working light, two telemetry frames side by side each showing the same slow breathing swell inside a noisy trace, whiteboard curves dim beyond, Farah a small rim-lit silhouette raising her stylus toward the paired frames with Demir's silhouette beside her, wrist terminal glowing, both faces averted. + scene style token
- Alt: Two lab displays show the same slow swell in a noisy signal while two silhouetted crew compare the frames side by side.
- Status: pending

#### signal-processing/fourier-transform
- Location / time: Archimedes, Lab (Morning after the overnight transform)
- Characters present: Dr. Farah and Ensign Demir as small silhouettes, faces averted (stylus; glowing wrist terminal)
- Moment: Farah pitches the Fourier Transform as a chord: one sound that is really three notes, and when Demir reaches for keyframes she corrects him: the FFT projects every signal onto the same fixed basis of sinusoids, nothing authored, nothing learned.
- Prompt: [ref: masters/lab] Wide shot from the corridor-side corner, morning working light with the whiteboard glow dominant, the holographic whiteboard showing one tangled wave splitting into a stack of clean sine curves of different heights, spectrograph column rippling slowly, Farah a small silhouette gesturing at the board with her stylus while Demir sits at the workbench, both faces averted. + scene style token
- Alt: A lab whiteboard splits one tangled wave into a stack of clean sine curves as two silhouetted crew look on in morning light.
- Status: pending

#### signal-processing/spectrograms
- Location / time: Archimedes, Lab (no time)
- Characters present: Dr. Farah and Ensign Demir as small silhouettes from behind
- Moment: A single FFT cannot say when the anomaly appears, so Farah calls for a spectrogram, frequency content across time, and Demir's DevTools-waterfall mapping goes uncorrected because there is nothing to correct.
- Prompt: [ref: masters/lab] Close push toward the telemetry wall from the corridor-side corner, working light, the main display building a waterfall heatmap column by column with a bright streak recurring at regular gaps, whiteboard dim at the frame edge, Farah and Demir as two small silhouettes from behind at the bottom of frame, faces to the screen. + scene style token
- Alt: A waterfall heatmap grows column by column on a lab display, a bright streak repeating, as two silhouetted crew watch.
- Status: pending

#### signal-processing/fft-as-features
- Location / time: Archimedes, Engineering (no time)
- Characters present: Ensign Demir, Dr. Farah and Chief Nazari as small silhouettes, faces averted (glowing wrist terminal; stylus; multitool)
- Moment: Demir wants to feed FFT magnitude bins into the classifier; Farah recasts his "more information" as access, not information, and Nazari makes him commit a predicted accuracy to the board before a single cycle of compute is spent.
- Prompt: [ref: masters/engineering] Wide shot from the bay entrance, green diagnostic wash over the warm work lamps, the diagnostics display holding a two-bar comparison chart beside a row of small frequency-bin glyphs, three small silhouettes gathered at the bay, one chalking a mark on a slate board, Nazari's multitool at her belt, all faces averted. + scene style token
- Alt: Three silhouetted crew confer in an engineering bay as a display compares two accuracy bars and one figure marks a slate board.
- Status: pending

#### signal-processing/windowing-and-overlap
- Location / time: Archimedes, Lab (Late watch)
- Characters present: Ensign Demir, Dr. Farah and Chief Nazari as small silhouettes in the lamp glow, faces averted
- Moment: Demir's FFT smears energy across the whole spectrum from frequencies he knows are not real; Farah names it spectral leakage and prescribes tapered windows, while Nazari reports eighty minutes lost overnight standing down phantom contacts the smear filed as anomalies.
- Prompt: [ref: masters/lab] Mid shot from the corridor-side corner, late light, a single bench lamp and display glow with the whiteboard dark, the telemetry display holding two spectra side by side, one smeared across every bin and one a single clean narrow peak, three small silhouettes at the workbench, Nazari's arms crossed with her multitool glinting, all faces averted. + scene style token
- Alt: In a dim lab a display contrasts a smeared spectrum with one clean peak while three silhouetted crew confer on the late watch.
- Status: pending

### recurrent-networks

#### recurrent-networks/sequences-matter
- Location / time: Archimedes, Lab (no time)
- Characters present: Dr. Farah and Ensign Demir as small silhouettes, faces averted (stylus; glowing wrist terminal)
- Moment: Farah shows a rhythm repeating across dozens of time steps that the feedforward network, seeing one snapshot at a time, is structurally blind to; Demir reaches for his reducer analogy and is told to hold the thought until the next lesson.
- Prompt: [ref: masters/lab] Wide shot from the corridor-side corner, working light, the holographic whiteboard showing a long repeating wave sliced into bracketed overlapping windows with one lone snapshot frame floating apart from the stream, Farah a small silhouette at the board with her stylus while Demir watches from the workbench, both faces averted. + scene style token
- Alt: A lab whiteboard shows a repeating wave sliced into bracketed windows as two silhouetted crew study the rhythm.
- Status: pending

#### recurrent-networks/simple-rnns
- Location / time: Archimedes, Engineering (Before end of shift)
- Characters present: Ensign Demir and Dr. Farah as small silhouettes, faces averted (glowing wrist terminal; stylus)
- Moment: Demir hand-runs a single RNN cell at the diagnostics bay, three inputs through a tanh whose output loops back in, and the same 0.5 input scores two different outputs; Farah points at the last line as proof his reducer's guarantees are gone.
- Prompt: [ref: masters/engineering] Mid shot from the bay entrance, warm hanging work lamps at the end of shift, the diagnostics display showing a small cell diagram whose output arrow loops back into its own input beside three stepped output marks, Demir a small silhouette hunched at the console with his wrist terminal glowing while Farah's silhouette points past his shoulder, both faces averted. + scene style token
- Alt: At an engineering console a diagram loops a cell's output back into itself; a silhouetted ensign traces it as a scientist points.
- Status: pending

#### recurrent-networks/lstm-gates
- Location / time: Archimedes, Engineering (Morning after the flatline run)
- Characters present: Ensign Demir, Chief Nazari and Dr. Farah as small silhouettes, faces averted (glowing wrist terminal; multitool; tablet and stylus)
- Moment: Epoch 200 of 200 and the loss has not moved since the first hour; the overnight flatline is still on the display when Farah walks in with the fix already open on her tablet, gates, while Nazari demands reach and cost instead of analogies.
- Prompt: [ref: masters/engineering] Wide shot from the bay entrance, green diagnostic wash, the central display holding one long dead-flat curve above an agitated signal trace, Demir a slumped silhouette at the bay, Nazari arms crossed with her multitool, Farah entering at the frame edge with her tablet raised, all faces averted, the dark rule-engine cabinet in the aft shadow. + scene style token
- Alt: A dead flat training curve glows over an engineering bay; one silhouette slumps at the console as two others arrive.
- Status: pending

#### recurrent-networks/sliding-windows
- Location / time: Archimedes, Bridge (no time)
- Characters present: Ensign Demir as a small silhouette, face averted (glowing wrist terminal)
- Moment: Demir alone, turning the continuous feed into fixed 80-step inputs: slice, step forward one, slice again, a window that manufactures a sample at every position where his IntersectionObserver instinct only fired at thresholds.
- Prompt: [ref: masters/bridge] Mid shot from the port-forward quarter looking aft into the port-side comms alcove, duty lighting, the alcove's stacked signal boards showing one long unbroken stream trace with a bracket window repeated stepwise along its length, Demir a small lone silhouette at the alcove with his wrist terminal glowing, the holo table quiet behind him. + scene style token
- Alt: A silhouetted ensign at a bridge alcove watches a bracket step along an endless stream trace on the signal boards.
- Status: pending

#### recurrent-networks/sequence-prediction
- Location / time: Archimedes, Bridge (no time)
- Characters present: Ensign Demir and Dr. Farah as small rim-lit silhouettes, faces toward the holo (glowing wrist terminal; stylus)
- Moment: The LSTM calls the next reading within 3 percent and puts a number on the anomaly's return, 47 minutes out; Farah closes the loop: if the timing is predictable the signal has structure, and structure is not random noise.
- Prompt: [ref: masters/bridge] Wide shot from the port-forward quarter looking aft, duty lighting, the central holo table projecting a signal trace that continues past a time marker into a predicted spike drawn ahead of the data, viewports a band of near-black starfield on the left, Demir and Farah small rim-lit silhouettes at the table edge, faces turned to the holo. + scene style token
- Alt: A bridge holo table projects a signal trace forward to a predicted spike as two silhouetted crew lean in.
- Status: pending

#### recurrent-networks/sequence-prediction-epilogue
- Location / time: Bridge, Main Display (no time)
- Characters present: Commander Mirza, Dr. Farah, Ensign Demir and Chief Nazari as small crew silhouettes from behind, all facing the display wall
- Moment: The 47-minute forecast goes up at 2010 and by 2050 the whole bridge is watching anyway; Nazari kills the room audio, the trace holds flat through 47:00, and at 47:03 the spike walks onto the display exactly as drawn. Mirza orders the three seconds logged: ours or theirs.
- Prompt: [ref: masters/bridge] Camera push toward the forward display wall from the port-forward quarter, consoles dimmed so the display glow dominates, the main screen showing a long flat anomaly trace with a ghosted predicted spike outline and the real spike just arriving on top of it, a handful of small crew silhouettes at the bottom of frame, every face turned away toward the wall. + scene style token
- Alt: A bridge crew in silhouette faces the main display as a real spike lands exactly on a forecast trace's drawn outline.
- Status: pending

### anomaly-detection

#### anomaly-detection/normal-vs-anomalous
- Location / time: Archimedes, Bridge (no time)
- Characters present: Chief Nazari (multitool), Dr. Farah (stylus), Commander Mirza (command tier, brass chronometer)
- Moment: Third alert of the shift, after a loose cable and a cosmic ray, and Nazari demands a definition of "anomalous" in numbers before anyone wakes the Commander a fourth time. Farah admits the model was trained to recognize what things are, never to say "none of the above."
- Prompt: [ref: masters/bridge] Wide shot from the port-forward quarter looking aft, duty lighting, the holo table projecting one bright flagged signal trace beside two dimmed dismissed traces, a calm bell-curve band on a forward display; Nazari and Farah as small rim-lit silhouettes facing the table, her multitool at her belt and Farah's stylus raised, Mirza a smaller silhouette above on the command tier beside the brass chronometer. + scene style token
- Alt: Bridge crew silhouettes ring a holo table where one flagged signal trace glows beside two dimmed false alarms.
- Status: pending

#### anomaly-detection/autoencoders
- Location / time: Archimedes, Lab (no time)
- Characters present: Dr. Farah (stylus and holo lines)
- Moment: Z-scores have run out of road on the ship's high-dimensional signals, so Farah proposes an autoencoder: compress normal signals through a bottleneck and rebuild them, and whatever comes back mangled is anomalous by definition.
- Prompt: [ref: masters/lab] Shot from the corridor-side corner with the whiteboard wall facing camera, working light with whiteboard glow dominant, the holographic whiteboard carrying an hourglass network diagram of wide layer bands pinched to two small nodes and widening again, bench telemetry looping clean repeating waveforms; Farah alone as a small rim-lit silhouette at the board, stylus mid-stroke trailing holo lines. + scene style token
- Alt: Dr. Farah sketches an hourglass network on the lab whiteboard, wide layers pinched to a two-node bottleneck.
- Status: pending

#### anomaly-detection/reconstruction-error
- Location / time: Archimedes, Lab (no time)
- Characters present: Dr. Farah (stylus), Ensign Demir (glowing wrist terminal)
- Moment: Demir feeds the anomalous signal through the trained autoencoder and it comes back mangled at twelve times the normal error; he calls the score a git diff, and Farah challenges him to say which channel his diff claims changed.
- Prompt: [ref: masters/lab] Closer shot from the corridor-side corner tight on the workbench displays, discovery light with every display lit at once, the main telemetry screen pairing a clean input waveform above its warped reconstruction, a side panel with one error bar towering over a row of low ones; Demir a small silhouette leaning in with his wrist terminal glowing, Farah half turned beside him, stylus in hand. + scene style token
- Alt: Farah and Demir study a lab screen pairing a clean waveform with its mangled reconstruction beside one towering error bar.
- Status: pending

#### anomaly-detection/reconstruction-error-epilogue
- Location / time: Archimedes, Shared Display (no time)
- Characters present: Ensign Demir (glowing wrist terminal); ARIA as her waveform on a side screen
- Moment: Demir pins the per-feature error map to the shared display, one bar carrying nearly the whole error while everything else sits flat, when ARIA speaks up unprompted and asks to know her own reconstruction error.
- Prompt: [ref: masters/bridge] Camera push toward the forward display wall from the port-forward side, after-hours light with consoles dimmed, the main display carrying a bar chart of flat glyph-marked bars with a single bar towering alone, a smaller side screen lit by ARIA's speaking waveform; Demir a small rim-lit silhouette below the wall, face averted upward, wrist terminal glowing. + scene style token
- Alt: One bar towers over a flat error chart on the bridge display wall while ARIA's waveform flickers on a side screen above Demir.
- Status: pending

#### anomaly-detection/threshold-tuning
- Location / time: Archimedes, Bridge (After the fourteenth alert)
- Characters present: Chief Nazari (multitool), Dr. Farah (stylus)
- Moment: Fourteen flags in a week and twelve were cosmic background; Nazari, who checked every one herself, orders the threshold set so DEEP SCAN fires only on real anomalies, while Farah warns that setting it too high misses the genuine article.
- Prompt: [ref: masters/bridge] Mid shot from the port-forward quarter looking aft, weary duty lighting, forward displays scattered with fourteen small alert blips of which twelve are dimmed to embers, the holo table showing a threshold line sliding across an error distribution curve; Nazari a small rim-lit silhouette leaning on the table edge with her multitool set down beside her hand, Farah opposite gesturing with her stylus. + scene style token
- Alt: Nazari and Farah face a bridge holo table as fourteen alert blips scatter the displays, twelve dimmed to false alarms.
- Status: pending

#### anomaly-detection/the-anomaly
- Location / time: Archimedes, Bridge (The alert)
- Characters present: Commander Mirza (brass chronometer tier), Chief Nazari (multitool), Dr. Farah (stylus), Ensign Demir (glowing wrist terminal)
- Moment: The loudest alert DEEP SCAN has ever fired: the live feed spikes at twelve times baseline reconstruction error, Nazari has already cleared the sensor calibration twice, and all three detectors agree the 73.4 Hz component matches nothing known.
- Prompt: [ref: masters/bridge] Wide shot from the port-forward quarter looking aft, alert light state with deep shadow and agitated display scatter, the forward display towering with a jagged spike waveform over a repeating frequency comb, three small detector panes lit in agreement on the holo table; the four crew as small rim-lit silhouettes clustered at the table, Mirza down from the command tier, Nazari's multitool holstered, Farah's stylus lowered, Demir's wrist terminal glowing. + scene style token
- Alt: Under alert lighting four crew silhouettes cluster at the holo table as a jagged unknown signal towers on the forward display.
- Status: pending

### advanced-time-series

#### advanced-time-series/beyond-lstm
- Location / time: Archimedes, Lab (no time)
- Characters present: Dr. Farah and Ensign Demir as small silhouettes, faces averted (stylus mid-annotation; glowing wrist terminal)
- Moment: The first early arrival: the pulse came 208 seconds before the LSTM's call, and the post-mortem finds a precursor ripple at window position 4 that the architecture had diluted to nothing by step 80. Farah names the fix: attention, a direct connection between any two steps.
- Prompt: [ref: masters/lab] Tight shot over the workbench from the corridor-side corner, working light, a bench display holding one long eighty-step trace with a tiny ripple near its start circled in hand-drawn holo lines and a large pulse near its end, Farah a small silhouette with her stylus mid-annotation, Demir's silhouette beside her, both faces averted. + scene style token
- Alt: A silhouetted scientist circles a tiny early ripple on a long signal trace, far ahead of the pulse it foretold.
- Status: pending

#### advanced-time-series/temporal-attention
- Location / time: Archimedes, Bridge (no time)
- Characters present: Ensign Demir as a small lone silhouette, face averted (glowing wrist terminal)
- Moment: Demir reads the attention weights as a heatmap over time: two hot ranges, the amplitude spike at step 4 and the frequency shift at step 77, seventy-three steps apart, the interval drawn as geometry.
- Prompt: [ref: masters/bridge] Close shot on the central holo table from the port-forward quarter, duty lighting, the holo projecting a waveform with a heat band running beneath it, two glowing hotspots far apart joined by a measured arc, Demir a small lone silhouette leaning over the table with his wrist terminal lit, face averted, consoles soft in the background. + scene style token
- Alt: A lone silhouette studies a bridge holo where two glowing hotspots on a heat band flank a long stretch of signal.
- Status: pending

#### advanced-time-series/forecasting
- Location / time: Archimedes, Bridge (Third watch)
- Characters present: Dr. Farah and Commander Mirza as small silhouettes, faces averted (stylus; brass chronometer at her station)
- Moment: A hushed chain of logic on the third watch: Farah says if they can predict it, it has structure, and structure is not noise; Mirza finishes the sentence for her: then someone, or something, is sending it.
- Prompt: [ref: masters/bridge] Wide shot from the port-forward quarter looking aft, after-hours light with consoles dimmed and starlight dominant through the viewport band, the holo table low-glowing a forecast trace that fans forward into a widening cone, Mirza a small silhouette on the raised tier beside the brass chronometer with Farah below at the table, both faces averted. + scene style token
- Alt: Under starlight two silhouettes on a dim bridge weigh a holo forecast whose trace fans into a widening cone.
- Status: pending

#### advanced-time-series/kalman-filters
- Location / time: Archimedes, Lab (no time)
- Characters present: Ensign Demir and Dr. Farah as small silhouettes, faces averted (glowing wrist terminal; stylus)
- Moment: Eight days of pulse intervals wander, but only wander downhill; Demir's moving average either lags the drift or inherits the noise, and in asking for an alpha that adjusts itself he specifies the Kalman filter without knowing its name. Farah supplies it.
- Prompt: [ref: masters/lab] Mid shot across the workbench from the corridor-side corner, working light with the spectrograph column rippling, a bench display plotting a descending scatter of interval marks threaded by two smoothing curves, one trailing low behind the drift and one jittering with the noise, Demir a small silhouette at the bench with Farah's silhouette beyond, both faces averted. + scene style token
- Alt: On a lab display a descending scatter of interval marks carries two imperfect smoothing curves as two silhouettes confer.
- Status: pending

#### advanced-time-series/ensemble-methods
- Location / time: Archimedes, Engineering (no time)
- Characters present: Ensign Demir and Dr. Farah as small silhouettes, faces averted (glowing wrist terminal; stylus)
- Moment: Demir wants the LSTM, the attention model and the Kalman filter voting together; Farah agrees only after pricing it: every member fires on every input, so an ensemble multiplies compute per request instead of partitioning it.
- Prompt: [ref: masters/engineering] Mid-close shot at the diagnostics bay from the bay entrance, warm hanging work lamps, three stacked displays each carrying a differently shaped prediction trace with a fourth display braiding all three into a single line, the dark rule-engine cabinet in the aft shadow, Demir and Farah small silhouettes before the stack, his wrist terminal glowing, both faces averted. + scene style token
- Alt: Three engineering displays each show a different forecast trace that braids into one as two silhouettes weigh the cost.
- Status: pending

### llm-integration

#### llm-integration/llms-for-science
- Location / time: Archimedes, Bridge (Six hours to the transmission window)
- Characters present: Dr. Farah (stylus) and Chief Nazari (multitool), rim-lit silhouettes
- Moment: With one transmission window six hours out and 47 days of data behind them, Farah proposes drafting the Earth Command report with a language model, Copilot-style: it drafts, she verifies. Nazari agrees only with a ledger: every fabricated claim on the board, next to the minutes it cost to catch.
- Prompt: [ref: masters/bridge] Wide from the port-forward quarter looking aft under duty lighting, the holo table projecting a green countdown ring above stacked page-outline glyphs, Farah a small rim-lit silhouette gesturing at the projection with her stylus while Nazari's silhouette watches arms-crossed from the raised tier, multitool at her belt, brass chronometer glinting behind. + scene style token
- Alt: Farah pitches an AI-drafted report at the bridge holo table while Nazari watches from the command tier, a countdown ring glowing between them.
- Status: pending

#### llm-integration/prompt-engineering
- Location / time: Archimedes, Lab (Five hours to the window)
- Characters present: Dr. Farah (stylus) and Ensign Demir (wrist terminal), silhouettes
- Moment: Farah pins her failed prompt v1, "Analyze this signal data," beside its useless generic output and makes Demir name the four missing pieces before reading on: role, context, data, format. Nothing about the model changed between her useless prompt and her precise one; only the words did.
- Prompt: [ref: masters/lab] From the corridor-side corner in working light, the holographic whiteboard split into two prompt diagrams, one sparse lone block of glyphs beside one densely structured column, Farah a small silhouette marking the dense column with her stylus while Demir's rim-lit silhouette leans over the workbench, wrist terminal glowing. + scene style token
- Alt: Farah marks up a structured prompt diagram on the lab whiteboard while Demir reviews her failed first attempt from the workbench.
- Status: pending

#### llm-integration/rag-for-signals
- Location / time: Archimedes, Lab (Under four hours to the window)
- Characters present: Dr. Farah (stylus) and Ensign Demir (wrist terminal), back-to-camera silhouettes
- Moment: The model knows nothing about DEEP SCAN's signals, so Farah builds retrieval: pull the relevant Band-7 rows from the archive first, then inject them into the prompt. Demir maps it to Server Components, and the lesson lands on the one step with no equivalent: a component cannot contradict its props, a generator can.
- Prompt: [ref: masters/lab] From the corridor-side corner with the spectrograph column rippling, telemetry displays showing rows of archive glyphs funneling along a bright green arrow into a framed prompt panel, Farah and Demir small back-to-camera silhouettes at the workbench, her stylus raised toward the retrieval arrow, his wrist terminal lit. + scene style token
- Alt: Farah and Demir trace archive rows flowing into a prompt panel on the lab displays, building retrieval before generation.
- Status: pending

#### llm-integration/rag-for-signals-epilogue
- Location / time: Archimedes, Bridge (no time)
- Characters present: Ensign Demir (wrist terminal) and Chief Nazari (multitool), small silhouettes at the display wall
- Moment: Demir demos the pipeline on the bridge three hours before the window; Nazari asks for Band-7 anomalies from the last 72 hours, and the answer comes back fluent and cited with seventeen signals while the retrieved context printed above it holds fourteen. Demir's audit hour becomes a checker that catches two more.
- Prompt: [ref: masters/bridge] Camera push from the port-forward quarter toward the forward display wall under duty lighting, the main display split into a context panel of fourteen bright row glyphs above an answer panel whose tally glyphs overrun them, Demir a small silhouette at the console below while Nazari's rim-lit silhouette points up at the mismatch, multitool on her belt. + scene style token
- Alt: On the bridge display wall a generated answer overruns its retrieved context; Nazari points at the mismatch while Demir looks on.
- Status: pending

#### llm-integration/report-generation
- Location / time: Archimedes, Lab (The last hours before the window)
- Characters present: Dr. Farah alone, rim-lit silhouette
- Moment: Farah splits the Earth Command report into six sections, Executive Summary through Recommendations, generating and validating each one separately for quality control. Before the window opens she fixes the standing order for a late validator flag: cut the section rather than ship a guess under the report's letterhead.
- Prompt: [ref: masters/lab] From the corridor-side corner in the late light state, a single bench lamp against display glow, the whiteboard holding six stacked section frames of glyphs each with its own small check glyph beside it, Farah alone as a small rim-lit silhouette at the workbench, stylus paused over her notes. + scene style token
- Alt: Farah works alone in the late-lit lab, six report sections framed on the whiteboard, each one awaiting its own validation check.
- Status: pending

#### llm-integration/multi-model-systems
- Location / time: Archimedes, Bridge (After hours)
- Characters present: Ensign Demir alone (wrist terminal), silhouette
- Moment: Alone after hours, Demir wires the four specialists into one chain: classifier, autoencoder, LSTM, LLM reporter, with the expensive alert stage firing only when the detector votes anomaly. The goal is a DEEP SCAN pipeline that runs end-to-end with nobody awake to watch it.
- Prompt: [ref: masters/bridge] Wide from the port-forward quarter in the after-hours state, consoles dimmed and starlight dominant through the viewport band, the holo table chaining four glowing stage glyphs from a raw waveform to a page outline, Demir a lone small silhouette in the port-side comms alcove, face averted, wrist terminal casting the only warm glow. + scene style token
- Alt: Demir sits alone in the dimmed bridge comms alcove after hours while the holo table chains four models from raw waveform to report.
- Status: pending

### optimization-edge

#### optimization-edge/model-profiling
- Location / time: Archimedes, Engineering (Hours after the 0249 crash)
- Characters present: Chief Nazari (multitool), Ensign Demir (glowing wrist terminal); ARIA as her waveform on a side screen
- Moment: ARIA replays the crash at quarter speed on the engineering board: at 0249 the 340 MB model drove the free-memory line to zero and the dashboard died mid-frame, losing the cleanest capture in nine days. Nazari does not yell; she gives Demir the numbers instead.
- Prompt: [ref: masters/engineering] Wide shot from the bay entrance looking in, incident light with a single red-orange status lamp burning over the diagnostics bay, the engineering board replaying a falling memory line touching zero beside a frozen stuttered frame, ARIA's waveform steady on a small side screen; Nazari and Demir as small, still, rim-lit silhouettes before the board, her multitool hanging unused, his wrist terminal dim. + scene style token
- Alt: Under a lone red status lamp Nazari and Demir watch the engineering board replay a memory line falling to zero and freezing.
- Status: pending

#### optimization-edge/quantization
- Location / time: Archimedes, Engineering (no time)
- Characters present: Chief Nazari (multitool), Ensign Demir (glowing wrist terminal)
- Moment: Nazari's first cut is precision: store 85 million weights in one byte instead of four and the 340 MB file lands at 85, but she wants to know where the accuracy goes, whether the loss spreads evenly across five classes or concentrates in the rare one.
- Prompt: [ref: masters/engineering] Mid shot from the bay entrance, warm work lighting under the hanging lamps, a diagnostics display showing four stacked blocks shrinking to a single block beside a weight histogram snapping onto coarse quantized levels, a second pane holding five class glyphs with one dimming; Nazari a small rim-lit silhouette squared at the board with her multitool pocketed, Demir behind her working the sums on his glowing wrist terminal. + scene style token
- Alt: Nazari faces an engineering display where four stacked blocks shrink to one and a weight histogram snaps onto coarse levels.
- Status: pending

#### optimization-edge/pruning
- Location / time: Archimedes, Engineering (no time)
- Characters present: Ensign Demir (glowing wrist terminal)
- Moment: Directive 44-C lands on Demir's queue flagged for review: half the weights sit within 0.001 of zero and Nazari wants them gone by end of watch. Demir drafts a tree-shaking sign-off, then goes hunting for the three hidden assumptions before he signs it.
- Prompt: [ref: masters/engineering] Close shot from the bay entrance angled into the diagnostics bay, late and quiet under one hanging lamp, a single display carrying a bar histogram with a tall central spike and thin tails, a second pane showing a branching diagram with most strands faded to faint outlines; Demir alone in the work chair leaning on one hand, wrist terminal glowing. + scene style token
- Note: reworded 2026-08-09. The original phrasing ("weight histogram", "strands dimmed to ghosts", "chin on fist") was rejected outright by fal's content checker, three times, while the same scene passed with plainer wording. No creative content changed; if this entry is ever rewritten, avoid that vocabulary.
- Alt: Alone in the dim engineering bay Demir studies a weight histogram spiking at zero beside a mesh of mostly dimmed strands.
- Status: pending

#### optimization-edge/caching-strategies
- Location / time: Bridge, Dashboard Station (no time)
- Characters present: Ensign Demir (glowing wrist terminal)
- Moment: The inference log shows the same cosmic-background signature classified 214 times since midnight, 213 model runs paid for one answer, and Demir recognizes the shape from every list that ever re-rendered without a memo.
- Prompt: [ref: masters/dashboard-station] Tight alcove shot on the stacked monitors, late lighting with the bridge dimmed beyond, the top two monitors filled with a long column of identical repeated waveform snippets with one highlighted, the bottom monitor a nearly idle load gauge; Demir a small silhouette leaning back in the chair, mug lifted off its clamp, wrist terminal glow catching his sleeve. + scene style token
- Alt: In the dashboard alcove Demir leans back from monitors stacked with identical repeated waveform snippets, one highlighted.
- Status: pending

#### optimization-edge/webgpu-acceleration
- Location / time: Archimedes, Bridge (no time)
- Characters present: Chief Nazari (multitool), Ensign Demir (glowing wrist terminal)
- Moment: Nazari wants the last of the latency: WebGL smuggles tensor math through a graphics pipeline built for triangles, and WebGPU runs the matrices directly. Demir frames it as Web Workers versus the main thread, purpose-built for the actual workload.
- Prompt: [ref: masters/bridge] Close-mid shot from the port-forward quarter centered on the holo table, duty lighting with the table glow dominant, the hologram showing a wireframe of triangles dissolving into a clean grid of compute cells while a console trace behind steps sharply downward; Nazari and Demir as small rim-lit silhouettes on opposite sides of the table, her multitool tapping its edge, his wrist terminal glowing. + scene style token
- Alt: At the bridge holo table triangle wireframes dissolve into a clean compute grid while a console latency trace steps down.
- Status: pending

### capstone

#### capstone/system-architecture
- Location / time: Archimedes, Bridge (Final phase briefing)
- Characters present: Commander Mirza (brass chronometer at her station) and Ensign Demir (wrist terminal), silhouettes
- Moment: The main display reads pulse interval 47.0 seconds, down from 73.4 when the mission began; Mirza stands and orders ten modules of separate pieces assembled into one system. Demir lays out five typed pipeline stages that must run on the repaired 512 MB bridge dashboard, the box with one prior fatality on its record.
- Prompt: [ref: masters/bridge] Full-width shot from the port-forward quarter under duty lighting, the forward display carrying a single slow pulse waveform above a large interval arc, the holo table projecting five linked component blocks, Mirza a small upright silhouette on the raised tier beside the brass chronometer while Demir's silhouette stands at the table, wrist terminal raised toward the projection. + scene style token
- Alt: Mirza stands at the command tier as Demir projects five pipeline stages over the holo table, the pulse interval ticking on the main display.
- Status: pending

#### capstone/ci-cd-pipeline
- Location / time: Archimedes, Engineering (Merge request 47)
- Characters present: Chief Nazari (multitool) and Ensign Demir (wrist terminal), silhouettes
- Moment: Merge request 47: Demir's deploy workflow with three model gates, accuracy, latency, memory budget, all green on his branch. Nazari reviews files, not badges, and the flaw is not what the pipeline checks but what it checks against: a cache-restored model that may not be the artifact actually shipping.
- Prompt: [ref: masters/engineering] From the bay entrance looking in under the green diagnostic wash, the diagnostics bay screen showing a pipeline graph of green check glyphs with one node tethered aside to a separate storage-drum glyph, Nazari a small rim-lit silhouette leaning into the screen with her multitool in hand while Demir's silhouette waits a step behind, wrist terminal dimmed. + scene style token
- Alt: Nazari leans into the engineering diagnostics screen, tracing a green pipeline graph back to the cached model artifact it validates.
- Status: pending

#### capstone/monitoring
- Location / time: Archimedes, Engineering (Relay minus five days)
- Characters present: Ensign Demir (wrist terminal), silhouette; ARIA as her waveform on a side screen
- Moment: ARIA flags that 91.8% accuracy will not hold as this region's signals drift, so Demir instruments DEEP SCAN against the failures that never throw: confidence decay, latency creep, inputs walking away from the training distribution. The dashboard that died mid-frame at 0249 is the standing argument for all of it.
- Prompt: [ref: masters/engineering] From the bay entrance looking in with hanging work lamps low and green display glow rising, the diagnostics screens streaming live monitor traces, a confidence line, a latency band, and two distribution curves sliding apart, ARIA present only as her waveform on a side screen, Demir a small silhouette wiring the bay with his wrist terminal lit, the dead rule-engine cabinet dark in the aft shadow. + scene style token
- Alt: Demir wires monitoring traces across the engineering bay screens while ARIA's waveform watches from a side display, drift curves sliding apart.
- Status: pending

#### capstone/documentation
- Location / time: Archimedes, Lab (no time)
- Characters present: Dr. Farah (stylus) and Ensign Demir (wrist terminal), silhouettes
- Moment: Farah asks who operates DEEP SCAN if Demir is incapacitated tomorrow: could Nazari run it, Mirza read it, ARIA retrain it. Demir starts the handover, a Model Card, an API reference, and a runbook precise enough that a rule-based system could execute it without him.
- Prompt: [ref: masters/lab] From the corridor-side corner in working light, the whiteboard laid out as a documentation card of framed glyph blocks, bullet rows, and a small model diagram, Demir a small silhouette writing at the workbench with his wrist terminal lit while Farah's rim-lit silhouette stands by the glass wall, stylus folded in crossed arms. + scene style token
- Alt: Demir drafts the DEEP SCAN handover at the lab workbench, a model card taking shape on the whiteboard as Farah watches from the glass wall.
- Status: pending

#### capstone/launch
- Location / time: Archimedes, Bridge (Deployment)
- Characters present: Ensign Demir (wrist terminal), Commander Mirza (chronometer), Chief Nazari (multitool), silhouettes
- Moment: Nothing is left on Nazari's list after ten weeks; Mirza gives the order to deploy DEEP SCAN and classify the signal. Demir's finger rests on the deploy control while telemetry shows the anomaly pulsing every 30 seconds, the next pulse the cleanest classification window the bridge will get tonight.
- Prompt: [ref: masters/bridge] From the port-forward quarter under tight duty lighting with every console lit, the holo table projecting a pulse ring ticking down beside a deployment progress arc, Demir a small silhouette with one hand hovering over a single glowing control, Mirza's still silhouette on the raised tier by the brass chronometer and Nazari's at the rail below, multitool holstered. + scene style token
- Alt: Demir's hand hovers over the deploy control on the bridge, a pulse ring counting down on the holo table as Mirza and Nazari stand by.
- Status: pending

#### capstone/launch-epilogue
- Location / time: Bridge, All Displays (no time)
- Characters present: full crew as small dark silhouettes: Commander Mirza, Dr. Farah, Chief Nazari, Ensign Demir; ARIA as her waveform on the comms screen
- Moment: The classification lands on every display at once: the signal mirrors the ship's own harmonics from a source 4.2 light-years out, correlation 0.9987, and Nazari checks her calibration a fourth time while the pulse interval falls through 29.7 seconds. Nobody speaks until Mirza orders everything transmitted to Earth.
- Prompt: [ref: masters/bridge] The series finale wide, camera pushed from the port-forward quarter toward the forward display wall with the whole bridge in frame, every display lit with the same repeating waveform beside one climbing correlation curve, the crew as small dark silhouettes standing motionless, Mirza nearest the viewport band, Farah with her stylus lowered, Nazari at her console, Demir at the comms alcove where ARIA's waveform pulses in step with the anomaly on the main wall. + scene style token
- Alt: Every bridge display carries the same mirrored waveform as the whole crew stands in silhouette, watching the signal answer in their own harmonics.
- Status: pending

## Production log

- 2026-08-05: bible created; masters not yet generated; all entries pending.
- 2026-08-09: **Gate C passed.** All four location master plates approved and
  committed at `docs/art-refs/deep-orbit/masters/<location>.png`. Made with
  FLUX.2 [pro] via fal.ai through `scripts/art/masters.mjs`, which holds the
  master prompts. Dashboard Station was derived image-to-image from the
  approved Bridge plate, as specified. Every per-lesson scene must pass its
  location's plate as `--ref`; that is what holds the sets consistent.
  Notes: the Bridge plate is the one whose framing the camera canon above was
  rewritten to match. The Dashboard Station needed one reroll because the
  monitors grew invented lettering; the fix was naming the ban explicitly
  ("no letters, no words, no abbreviations, no numerals, no labels") rather
  than relying on the shared token's shorter no-text clause.

- 2026-08-09: **Gate D pilot (foundations) reshaped the staging rules.** The
  silhouette rule as originally written here was not survivable: "a small
  rim-lit silhouette" produced fully lit, fully invented people, and because
  a scene has no character reference the inventions broke canon outright
  (Commander Mirza rendered as a white man in a business suit; an instruction
  to show ARIA's waveform on a screen produced a cartoon face). Three fixes
  now live in `scripts/art/scenes.mjs` and apply to every entry, so the
  per-entry prompts below did not need rewriting:

  1. **Silhouette law**, appended last: every person is a flat pure black
     featureless cutout, no face, no skin tone, no clothing detail, at most
     one fifth of frame height, backlit. Identity cannot be asserted, so it
     cannot be asserted wrongly. Faces live in the dialogue avatars directly
     below the image.
  2. **No-text law**, appended last and enumerated. Scenes carry far more
     screen area than portraits and invent lettering readily ("WEMORY R1LD",
     "FIOLL MEMORY"). It also forbids faces on screens.
  3. **Anonymization** of the prompt body before sending: character names are
     replaced with roles, "ARIA" with an oscilloscope waveform, and the word
     "rim-lit" is stripped. Proper nouns get DRAWN as text (one scene
     rendered "ARIA" in large letters), and "rim-lit" is an instruction to
     light the figure, which is how a lit face gets in.

  The entries below keep their character names and staging language: they
  are the human-readable record of who the scene is about, and the driver
  translates them. Expect roughly one reroll in six even with all three laws
  applied; review each batch before ingest.

- 2026-08-09: **Gate D complete. All 63 scenes generated and shipped** to
  `apps/web/public/scenes/deep-orbit/`, 57 to 184 KB webp (median 116 KB,
  7.3 MB total, at most two load per lesson page and both lazy). Alt text
  from the entries below is now in lesson frontmatter as
  `scene.portraitAlt` / `scene.epiloguePortraitAlt` via
  `scripts/art/alt-text.mjs`. Review pass rerolled 9 of 63 (~14%).

  Two more prompt rules the review pass earned:

  - **Do not name a profession.** "A scientist figure" reliably draws a
    bright white lab coat, and a white garment cannot render as a shadow, so
    the silhouette law loses every time. Role-neutral wording keeps figures
    dark. Character names are mapped to neutral roles in
    `scripts/art/scenes.mjs`.
  - **Entries whose subject IS a document need their nouns restated.**
    "Prompt diagrams", "bullet rows" and "documentation card" are requests
    for text in all but name and no ban survives them; they are rewritten to
    the shapes they should render as.

  One entry (`optimization-edge/pruning`) was rejected outright by fal's
  content checker three times and is reworded in place, with a note on the
  entry. The checker also rejected an earlier phrasing of the silhouette law
  itself ("solid black fill, zero skin tone"), which is why that clause now
  describes lighting rather than fill colour.
- 2026-08-05: all 63 entries drafted (56 briefings + 7 epilogues) from the
  lesson MDX briefing zones; awaiting Gate C-prime user review. Canon note:
  Chief Nazari is a woman per the character bible; the manifest personality
  line in packages/worlds/src/deep-orbit.ts was corrected to match
  ("froze on her last mission").
