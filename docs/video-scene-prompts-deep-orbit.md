# Deep Orbit Lesson Video Scenes: Flow/Veo Generation Prompts

Written 2026-08-31. One 10-second video per lesson, 56 lessons, plus the 7
distinct-location epilogue scenes. Each entry is a paste-ready Google Flow
prompt in the same grammar as the Deep Orbit trailer production script and
the /learn film. This document is the handover artifact: an operator with
Flow open and the reference assets on disk needs nothing else. Not every
entry gets generated: the Generation plan section below splits the 63
into 42 to generate now, 11 deferred past launch, and 10 cut.

Companions, in order of authority:

- `docs/scene-bible.md` holds each scene's location canon, camera canon,
  light state, and moment. The prompts here are motion versions of those
  entries and must not contradict location or moment canon. Its
  silhouette law governs the STILL scene art only; for video the owner
  ruling below overrides it.
- `docs/character-bible.md` holds the cast: appearance, age markers,
  props, and each character's canonical expression set. For video, the
  cast's on-screen look is transcribed from the shipped trailer footage
  (the owner-approved film); where the film and the bible's wording
  differ, the film wins.
- `docs/story-style-bible.md` holds story canon (numbers, arc,
  registers). Its one-direct-address rule has no in-lesson exemption: no
  character ever looks into the camera in these videos.
- `docs/future-ai-video-scenes.md` holds the product integration design
  (`<VideoScene>` component, captions, CDN). This document revises its
  generation stage: Google Flow/Veo instead of Runway, one 10-second clip
  per scene instead of several short beats.

## Decisions and rulings

1. **One video per lesson, filming the briefing scene.** The briefing is
   the lesson's written scene (the slugline plus opening dialogue); its
   Moment in the scene bible is the message the 10 seconds must deliver.
   The 7 epilogues that move to their own location get their own section
   at the end.
2. **OWNER RULING (2026-08-31): faces, not silhouettes.** The learner's
   emotional connection to the story and cast is the point of this
   product update, so lesson videos stage the characters on camera with
   readable faces and expressions, the trailer's character pipeline.
   This overrides the still-pipeline silhouette default for video; the
   still scene art and its law are unchanged. Consequences: character
   references ride along as ingredients (identity is never regenerated
   from text alone), the face-locking generation order below applies,
   and every entry carries an emotional beat from the character bible's
   expression sets. OWNER BASELINE (2026-09-04): the canonical portraits
   at `docs/art-refs/deep-orbit/<slug>.png` plus the shipped film are
   the reference and baseline for every generation. The cast text is the
   forensic sheet section below, transcribed to the hair from those
   portraits and cross-checked against the film; the identity
   ingredients are the same portraits, with the film-derived stills in
   `video-refs/` riding along as motion anchors where a slot is free. A
   text description that disagrees with its reference image makes Veo
   split the difference and identity drifts, so sheet, portrait, and
   take must always agree.
3. **Silent deliverable.** Trailer audio policy: strip Veo's native audio
   from every take, reject takes with lip movement. Characters emote
   without speaking; the written dialogue stays on the page, and caption
   timing is the integration doc's job.
4. **No direct address.** The trailer's look-into-camera was a marketing
   exemption. In-lesson, a camera look is a second direct address and is
   rejected on sight.

## Generation plan (value audit, 2026-09-04)

An 89-agent value audit (12 module judges, a cross-clip redundancy
sweep, a story-arc and conversion sweep, then a three-lens adversarial
vote on all 25 cut/defer candidates) settled which entries earn a clip.
The test behind every verdict: a clip earns generation when the motion
itself teaches (something transforms, converges, fails, or arrives on
screen) or a character beat exists only in time; it does not when the
clip would be the approved still plus ambient flicker.

- **Generate now: 42 entries** (every entry without a Status line). The
  free tier is fully covered: all five module 1 briefings plus E1, the
  last story beat a free user sees before the paywall.
- **Deferred past launch: 11** (3.5, 5.1, 6.3, 8.4, 8.5, 9.1, 9.3,
  10.1, 10.4, 11.2, E3), each marked in place with the reason. Worth
  having eventually; none is launch-critical, and most re-stage a kept
  clip's room and animation.
- **Cut: 10** (2.1, 3.1, 4.2, 4.6, 5.4, 7.1, 8.2, 9.2, 10.3, E6). Do
  not generate: the still art and written scene already deliver these.
  Prompts stay in the doc, so reversing a cut is deleting one Status
  line.
- **Batch order (OWNER RULING 2026-09-04: the launch ships WITH video,
  superseding the audit's baseline-first sequencing)**: face-lock pilots
  (2.5, 7.2, 3.2, 6.4) → module 1 plus E1 (LAUNCH-BLOCKING: the entire
  free-tier surface) → modules 2-3 keeps (a launch-week buyer's first
  paid hours) → the arc spine (5.3, 6.5, E4, E5, 7.5, 8.3, 11.5, E7) →
  remaining keeps; the deferred list stays post-launch backfill. Partial
  coverage is safe by design: the in-lesson player must fall back to the
  text reveal wherever a clip is missing or unapproved, so the launch
  can go out the moment module 1 + E1 clear review.
- **Motif transfer**: 1.5 and E1 both animated the ringed outlier, so
  the reveal now belongs to E1 alone and 1.5 ends on the converged band
  (entry edited accordingly). 7.3's towering-bar chart reappearing in
  E5 is deliberate: the same chart, hours later, when ARIA asks about
  it.
- **Verification**: every candidate got its full three-lens adversarial
  vote (the ten votes that first hit an API limit were rerun to
  completion). The votes overturned four judge verdicts, all kept or
  promoted here: 1.3 (the free tier must be complete), 3.4 (ten seconds
  of a falling loss curve is exactly the trust-watching the lesson
  teaches), E1 (3-0: with 1.5 ending withheld, E1 is the payoff, not a
  duplicate), and 11.4 (1-3: one lesson before the course's climactic
  launch scene in a capstone buyers binge, the designed answering shot
  to 2.4's mentor beat, and among the cheapest clips on the slate). E3's
  defer and E6's cut were upheld 3-0.

## Flow run settings

- **Pass length**: one 8-second Veo pass per scene, one continuous shot.
  Extend in Flow (or hold the final frame in the edit) to land the
  10.0-second deliverable. Write the event to land around seconds 5 to 8
  so the extension carries the settle, not the action.
- **Aspect**: 16:9.
- **Ingredients**: exactly what the entry's `Refs` line names, three
  maximum (trailer law). Character slugs resolve to the canonical
  portraits at `docs/art-refs/deep-orbit/<slug>.png` (owner baseline
  2026-09-04, and the exact art the dialogue avatars render beside the
  clip). The film-derived stills in
  `docs/art-refs/deep-orbit/video-refs/<slug>.png`, cut from the
  owner-approved trailer export, are motion anchors: attach one in the
  spare third slot on the four face-lock pilots, and reach for
  `crew-lineup.png` (all four in one clean frame) or `aria-scope.png`
  (the AI's scope) when a scene needs an angle the portrait does not
  cover. Masters from `docs/art-refs/deep-orbit/masters/`. A scene that
  needs three character refs carries its set in the prompt instead of a
  master (trailer scene 8 precedent); those entries restate the set
  dressing.
- **Sets stay on the masters.** The film invented its own bridge (a
  domed room with a wall clock) and contains no lab, engineering bay,
  or dashboard alcove at all, so the approved location masters remain
  the only complete set canon, and the in-app scene art already uses
  them. Characters and render style follow the film; rooms follow the
  masters. If the owner ever prefers the film's bridge for bridge
  scenes, swap that one ingredient for a trailer set frame; nothing
  else changes.
- **Face-locking order (generate these four first)**: 2.5 (Mirza alone),
  7.2 (Farah alone), 3.2 (Nazari alone), 6.4 (Demir alone), each seeded
  with that character's portrait plus its video-ref motion anchor plus
  the set master, the full three-slot budget. These four pilots confirm
  the portrait faces survive the master-set ingredient in motion before
  anything is batched;
  approve one take per character and promote its best frame to that
  character's working reference for every later scene (trailer note 1).
- **Audio**: strip native audio from every take.
- **Reject a take when**: any readable mark appears on any surface; a
  face drifts from its video reference (a different person, or a
  de-aged one: Mirza keeps her lined face and silvered hair, Nazari her
  lined face and gray-streaked hair); any lip movement; any character
  looking into the camera; invented crew beyond the staged cast; any
  blue or cyan glow (the world glows green `#6BAA8A` and brass `#A89060`
  only); a cut or scene transition; a kit signature drawn wrong (below).
- **Expect rerolls.** The still pipeline averaged one reroll in six;
  faces raise that. The trailer's hardest asks were exactly these:
  budget the most rerolls for multi-character scenes and hold the line
  on identity.

## Kit signatures (comped, never generated)

Carried over from the trailer's motion-graphics kit: a shape that must
match across scenes is comped in post, because Veo redraws it differently
every take. Entries flag their kit elements; generate the named screen dim
and let the comp carry the content. For a draft pass Veo may improvise
them; before anything ships, the comped version replaces the improvisation.

- **(a) Alert signal**: the jagged double-spiked anomaly waveform, one
  shape everywhere it appears.
- **(b) Ambiguous reading**: the near-flat, almost-normal trace (sample
  7741's signature). Never confuse it with (a).
- **(c) Interval arc**: the tightening pulse-interval arc.
- **(d) AI ring**: the oscilloscope trace inside its large brass-ringed
  circular scope (as rendered in the film; see
  `video-refs/aria-scope.png`), with its four states (calm ripple, one
  tall spike, flat line, agitated scatter).

## Global style block

Paste this ahead of every scene prompt, then the cast sheets (next
section) for exactly the characters the scene stages. The prompt helper
(`node scripts/video/scene-prompt.mjs <id>`) assembles all of it
automatically.

> cel-shaded cartoon illustration, clean bold linework, flat shading with
> one soft key light, slightly stylized proportions, cinematic framing,
> near-black space beyond the viewports, green #6BAA8A interface glow and
> rim light, warm brass #A89060 metal trim, cohesive series look, not
> photorealistic. Every scene happens on or around one survey starship,
> the Archimedes, deep in a dark green nebula. One continuous shot, slow
> deliberate camera, no cuts. Every figure is edged with a thin
> pale-green rim-light outline against the dark, the world's signature
> glow. No letters, no words, no numerals, no abbreviations, no labels
> anywhere in any frame; screens show only waveforms, charts, gauges,
> heatmaps, and abstract glyphs, never text and never faces; any watch,
> gauge, or dial face is plain with no markings. No dialogue, no
> narration, no lip movement; characters emote silently and never look
> into the camera. No crew beyond the named cast. The only non-palette
> accent allowed is a single red-orange status lamp where a scene names
> one.

## Cast sheets (forensic, from the canonical portraits)

Transcribed strand-by-strand from the canonical portrait art at
`docs/art-refs/deep-orbit/<slug>.png` (the same art the dialogue avatars
render directly beside the clip on the lesson page) and cross-checked
against the shipped film. Where the film's takes drift from the
portraits (Mirza's coat cut varies take to take), the PORTRAITS win:
they are what the learner sees next to the video every day. Paste only
the sheets for the characters the scene's Refs line stages; a sheet for
an absent character invites the generator to add them.

#### commander-mirza

> COMMANDER MIRZA, a calm Black woman in her early fifties: deep brown
> skin; a very short natural buzz cut, near-black at the crown and
> heavily silvered white at the temples and above the ears, with a
> crisp rounded hairline; thin arched dark brows, one fractionally
> raised; warm dark-brown eyes with fine crow's feet and soft under-eye
> lines; a composed closed-lip near-smile with smile lines at the
> cheeks; small round gold stud earrings in both ears. She wears a
> charcoal stand-collar uniform jacket: the collar edged in gold piping
> over a black band and closed at the throat with a single gold toggle;
> black shoulder panels with gold-trimmed epaulettes each bearing two
> short gold bars; a thin green accent line along the black sleeve
> seams; one blank horizontal brass nameplate bar on her chest; and
> centered below it a round brass pocket-watch chronometer with a
> riveted bezel, a small winding crown at the top, and a plain white
> face with no markings.

#### dr-farah

> DR. FARAH, an olive-skinned astrophysicist in her thirties drawn with
> a youthful open face: very large expressive dark-brown eyes with fine
> lashes, a small nose, soft smile lines, and a warm closed-lip smile;
> a tiny white stud earring. Her espresso-brown wavy hair parts softly
> off-center, sweeps back over the ears in thick glossy locks with
> loose face-framing strands at both temples, and gathers into a low
> loose ponytail whose waves fall forward over one shoulder, the hair
> catching faint green sheen highlights. Over one eye sits a
> translucent pale-green augmented-reality lens, a rounded-square pane
> of glowing glass with faint tick marks at its edges, through which
> that eye reads luminous green while the other stays natural brown.
> She wears a light warm-gray lab coat with notched lapels, open over a
> ribbed slate-gray mock-turtleneck, flat blue-gray lanyard straps
> running down both lapels, a small round silver pin on one lapel, and
> a small hexagonal teal crest patch on one upper sleeve. She gestures
> with a glowing green stylus.

#### chief-nazari

> CHIEF NAZARI, a weathered engineer in her late forties: tan olive
> skin with a deeply lined face, a horizontal forehead crease, crow's
> feet, strong nose-to-mouth lines, and a set jaw; straight dark brows
> over deep-set dark-brown eyes; lips pressed level. Her dark-brown
> hair is side-parted and swept back off the forehead in glossy banded
> strands, falling just past the jaw to her shoulders where the
> slightly wavy ends flip outward, a few loose strands escaping at the
> temples. She wears a scuffed sage-gray work jacket zipped to the
> sternum over a dark blue-gray crew tee: a tall standing collar with a
> darker olive edge band, a chunky gunmetal zipper, darker olive yoke
> stripes across both shoulders, a slanted flapped chest pocket on one
> side and a blank light-gray rectangular patch on the other, a small
> shoulder patch bearing two amber bars, a flapped utility pocket on
> one forearm, visible dashed stitch seams, and thin scratch scuffs
> across the fabric. She carries a small multitool.

#### ensign-demir

> ENSIGN DEMIR, an eager comms officer in his mid-twenties: light warm
> skin with faint freckles across the nose and cheekbones; large warm
> brown eyes under thick straight dark brows; a friendly closed-mouth
> smile; light stubble tracing the jaw, upper lip, and chin, sparse on
> the cheeks. His dark chocolate-brown hair is cut short and faded at
> the sides with a full textured quiff swept up and back, a few
> separated strands dropping onto his forehead. Over one ear he wears a
> chunky gunmetal over-ear comms earpiece with a glowing teal ring at
> its hub. He wears a slate blue-gray zip crew jacket with a tall open
> collar over a matching tee: visible raglan seam stitching, faint
> scuff lines, a small strap of three dark utility loops on one upper
> arm, and on his chest a pale circular crest bearing a simple
> triangular starburst emblem. He carries a green-glowing wrist
> terminal whose pale light uplights his jaw.

#### aria

> The ship's AI appears only as an instrument, never a face or body: a
> large circular scope set into a dark console, its outer rim a fine
> faceted gold wireframe fading from warm gold at the top to green at
> the bottom, inside it a brass ring of fine tick marks with longer
> cardinal ticks, and across the center a single luminous off-white
> oscilloscope trace, flat at both edges with a symmetric burst of
> peaks around one tall central spike, glowing softly against the
> black.

## Module 1 · Foundations: Tensors & Data

#### 1.1 foundations/introduction-to-tensors
- Message: Every hand-written rule has failed against the stream; treating it as structured data is the first move that gets traction.
- Refs: commander-mirza + ensign-demir + masters/bridge
- Kit: (d) AI ring on the alcove screen
- Prompt: Mid-wide on the two-tier bridge in even duty light, drifting slowly toward the central holographic table, which throws up a tall churning column of unstructured noise glyphs that never settles. On a small alcove screen the AI's waveform ripples in a tight agitated scatter. Commander Mirza stands on the raised tier watching the column, composed and level while the light churns, then turns her head toward the comms alcove and lifts her chin, giving a silent order. Ensign Demir turns from his console to meet it, alert and eager, wrist terminal glowing. In the last seconds the base of the noise column locks into a faint ordered lattice of rows and columns.

#### 1.2 foundations/tensor-shapes
- Message: The flat stream hides a layout; the right split turns a ribbon of numbers into a grid with meaning.
- Refs: dr-farah + masters/lab
- Prompt: Mid shot in the signal lab in working light, the holographic whiteboard dominant, camera easing in. A long flat data ribbon stretches across the board while candidate grid partitions sketch themselves over it, flicker, and dissolve, one after another; telemetry displays beside it repeat the same waveform at two nested scales. Dr. Farah stands close to the board, absorbed, eyes tracking each failed split, stylus raised. When the final partition holds and the ribbon folds into a clean lattice of rows and columns, her face opens into wide-eyed delight, the AR lens glinting, and she leans in toward the settled grid as the displays pulse once in agreement.

#### 1.3 foundations/tensor-operations
- Message: Sixty-four raw channels crashed the console mid-operation; the math has to run clean at sensor speed.
- Refs: chief-nazari + ensign-demir + masters/bridge
- Prompt: Mid shot on the bridge in alert light with agitated display scatter, camera pushing in slowly on one main console. Sixty-four stacked channel traces scroll fast, then stutter and snarl together into a single garbled knot glyph as the screen freezes mid-scroll. Ensign Demir sits at the console, eyes wide and overwhelmed, hands hovering uselessly over the keys, wrist terminal glowing. Chief Nazari leans in over his shoulder with her multitool in hand, one brow up, unimpressed, studying the frozen knot the way she studies anything that claims to be clever. The knot pulses slowly, unresolved, between them.

#### 1.4 foundations/data-loading
- Message: Loading the whole archive at once kills the machine; the memory gauge tops out mid-climb and everything stops.
- Refs: ensign-demir + masters/engineering
- Kit: (d) AI ring on the side screen
- Prompt: From the engineering bay entrance in incident light, a single red-orange status lamp burning over the diagnostics bay, camera pushing in slowly. On the main diagnostic display a rising curve climbs steadily while a plain memory gauge beside it fills toward the top. The curve cuts off mid-climb; the gauge pins full and the display's ambient flicker dies. On a side screen the AI's waveform stutters and freezes flat. Ensign Demir sits slumped at the bay under the red lamp, shoulders down, staring at the dead screen with the hollowed-out look of someone whose overnight run just took the ship's diagnostics down with it.

#### 1.5 foundations/normalization
- Message: Four sensor feeds at wildly different scales squeeze smoothly onto one shared band.
- Refs: commander-mirza + dr-farah + masters/bridge
- Prompt: Wide on the bridge holo table in duty light, camera drifting in. The table projects four sensor traces at wildly mismatched amplitudes, one towering, one nearly flat. Over the shot they compress smoothly into one narrow shared band, the towering trace shrinking and the flat one rising until all four breathe together as one signal. Commander Mirza watches from the raised tier, level, the smallest approving ease entering her face as the chaos resolves. Dr. Farah stands at the table edge, stylus mid-gesture, tracking the convergence with sharp professional pleasure. Ensign Demir is a smaller figure seen from behind at the far edge, wrist terminal glowing. The shot ends on the settled band, calm and uniform. (The ringed outlier reveal belongs to this lesson's epilogue clip, E1.)

## Module 2 · Neural Networks: Layers & Architecture

#### 2.1 neural-networks/first-neuron
- Status: CUT (value audit 2026-09-04): the still and text deliver it, and Farah's whiteboard-delight beat already ships free-tier in 1.2 with the same room, blocking, and expression.
- Message: Two clean labeled tones and one jagged stranger; the smallest thing that can learn is a single node.
- Refs: dr-farah + masters/lab
- Kit: (a) alert signal, the jagged third trace
- Prompt: Bench-level mid shot from the corridor-side corner in working light, camera settling to a stop. Telemetry shows two clean steady waveforms pulsing side by side and a third jagged trace apart from them. On the whiteboard a diagram draws itself in: three input lines converging into one circled node, stroke by stroke. Dr. Farah traces the node with her glowing stylus, and as the last stroke closes the circle her face lights with the wide-eyed grin of a discovery, the AR lens catching the glow: the smallest thing that can learn, sketched between the two honest tones and the stranger that defeats every rule.

#### 2.2 neural-networks/activation-functions
- Message: Raw scores come out unbounded; a squashing curve turns them into decisions.
- Refs: chief-nazari + ensign-demir + masters/bridge
- Prompt: Mid shot toward the port-side comms alcove in duty light, camera locked. A stacked signal board carries two bars at absurdly mismatched heights, one towering, one sunk below its baseline, above a small S-curve glyph. Chief Nazari jabs her multitool toward the board, jaw set, demanding a yes or a no from it. Ensign Demir sits at the alcove console, wrist terminal glowing, watching anxiously. The two bars slide down through the S-curve and re-emerge as two small dots resting near opposite ends of one short rail; Demir's face flips from lost to lit, the click of a concept landing, while Nazari holds her raised brow, giving the settled board nothing yet.

#### 2.3 neural-networks/layers-and-architecture
- Message: One neuron cannot carry sixty-four channels; the system gets built in stages, and every stage has a cost that gets counted.
- Refs: chief-nazari + masters/engineering
- Prompt: From the bay entrance in mixed work light and green display glow, camera pushing in slowly. Over the diagnostics bay a hologram assembles itself: three narrowing layer blocks link left to right, one at a time, into a single output node, a small tally glyph brightening beneath each block as it lands. Chief Nazari stands before it with arms crossed, multitool in fist, guarded and evaluating, counting the cost of every stage. As the finished diagram begins to rotate, her eyes leave it for one beat to rest on the dark decommissioned cabinet with its half-open panel in the aft shadow, something older than doubt crossing her face, then return.

#### 2.4 neural-networks/forward-pass
- Message: Data flows the whole way through the network, stage by stage, and the run only counts when you can watch it fail and recover.
- Refs: dr-farah + ensign-demir + masters/bridge
- Prompt: Wide on a nearly idle bridge, most consoles dark, one station lit, camera locked. The forward display holds a halted pipeline diagram, its first block outlined and detached from the incoming data ribbon. Ensign Demir hunches at the live console, jaw tight with focus, rerunning the demo that died on stage this morning, wrist terminal glowing. Dr. Farah stands behind him, stylus folded in her arms, stern and patient, watching him work rather than rescuing him. The detached block slides into place, the ribbon connects, and a pulse of light runs the pipeline end to end; Demir straightens with a breaking grin, and Farah allows the smallest tilt of approval.

#### 2.5 neural-networks/building-a-network
- Message: The full classifier stands assembled and compiled, ready to train; its weights are still random numbers.
- Refs: commander-mirza + masters/bridge
- Prompt: Wide duty-light shot on the bridge, camera drifting slowly toward the holo table. The table projects a complete three-stage network schematic, slowly rotating, ringed at its base by plain ready-state gauges that fill and hold one by one. Commander Mirza stands alone on the raised tier, one hand resting beside her brass chronometer, composed, her steady gaze following the schematic's turn. When the last gauge fills she does not move; only the smallest warm half-smile arrives, the look of a commander whose order came back built, and the schematic keeps rotating in the quiet, lit and waiting for training.

## Module 3 · Training: Loss, Gradients & Optimization

#### 3.1 training-loop/loss-functions
- Status: CUT (value audit 2026-09-04): the only real motion (a dot descending a curve) is 3.2's beat one lesson later, done better.
- Message: Wrongness becomes one measurable number: the gap between what the network said and what was true.
- Refs: dr-farah + masters/lab
- Prompt: Late-light lab, a single bench lamp against display glow, camera locked. The whiteboard holds one clean parabola over faint derivation glyphs. On a telemetry display two markers sit on a plain probability rail with a bracket spanning the gap between them. Dr. Farah stands at the bench sighting along her raised stylus like a surveyor, absorbed, eyes unfocused into the abstraction. One marker slides toward the other and the bracket tightens; on the whiteboard a bright dot descends the parabola in step. Her mouth sets with quiet satisfaction as the gap narrows without closing: wrongness, finally, with a number on it.

#### 3.2 training-loop/gradient-descent
- Message: The slope under the current weights says which way to move; every downhill step gets smaller as the bottom nears.
- Refs: chief-nazari + masters/engineering
- Prompt: Mid shot from the bay entrance in warm work light under the hanging lamps, camera locked. The diagnostics display shows a bowl-shaped curve. A bright dot descends it in discrete steps, each visibly shorter than the last, leaving a brief fading mark at every landing. Chief Nazari stands before the display turning her multitool over in one hand, head tilted, guarded, tracking the slope like she is auditing it. As the dot settles at the bottom of the bowl and pulses gently, the multitool goes still in her hand, and she studies the settled dot a beat longer than she needs to.

#### 3.3 training-loop/backpropagation
- Message: Measuring 673 parameters one nudge at a time takes thirty hours; one backward sweep gets every answer at once.
- Refs: ensign-demir + masters/engineering
- Kit: (d) AI ring on the adjacent screen
- Prompt: Close shot into the diagnostics bay in green diagnostic wash, camera locked. The main display crawls through a vast grid of parameter cells, lighting one cell at a time along a thin arc of progress, achingly slow. Ensign Demir sags at the console, hollow-eyed at the pace, wrist terminal glowing against his slack hand. On an adjacent screen the AI's waveform holds a calm ripple, then lifts into a single tall spike; at that instant a wave of light sweeps backward across the entire grid and every cell fills at once. Demir jolts upright, staring, exhaustion knocked clean into wide-eyed disbelief.

#### 3.4 training-loop/training-loop
- Message: The loop runs itself now; the loss falls epoch after epoch, and watching is how trust gets earned.
- Refs: ensign-demir + masters/engineering
- Prompt: Wide from the bay entrance with the hanging lamps dimmed, the room lit mostly by its own displays, camera pushing in very slowly. The main diagnostic screen carries a long loss curve stepping steadily downward past rows of small epoch tick glyphs, each new step landing on a slow regular beat. Ensign Demir stands well back from the console with his arms folded, wrist terminal glowing faintly, calm in a way he has not been before: not the eagerness of the early weeks, but the level, watchful focus of someone deciding whether to trust a machine with a job he used to do by hand. The curve keeps falling, tick after tick.

#### 3.5 training-loop/evaluating-deep-scan
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): real motion but little attachment payoff, and the blocking shadows 2.5.
- Message: Signals the network has never seen get the first honest word on whether it works.
- Refs: commander-mirza + masters/bridge
- Prompt: Close shot onto the holo table and raised tier in even duty light, camera drifting in slowly. The table projects a glowing two-by-two grid of verdict cells flanked by steady plain gauges, above a strip of fresh unfamiliar waveforms. One waveform at a time slides up into the grid, and a cell pulses as each lands, the tally building corner by corner. Commander Mirza stands alone at the command station, one hand near her brass chronometer, her face level and unreadable, the deliberate neutrality of a commander who asked for real numbers and intends to believe whatever the grid says, not whatever the room hopes.

## Module 4 · Browser ML Runtimes

#### 4.1 browser-runtimes/why-the-browser
- Message: The classifier runs where the data lives, in the dashboard itself, or it does not ship.
- Refs: chief-nazari + ensign-demir + masters/bridge
- Prompt: Mid-wide on the bridge in duty light, camera locked. The holo table streams a live looping signal trace. A forward display holds a schematic of a signal path splitting toward a far node and a near node; the far branch dims while the near branch brightens. Chief Nazari points her multitool at a dark aft-rail dashboard console holding only an empty chart grid, jaw set, immovable: it runs there or it does not run. Ensign Demir stands beside her lit by his wrist terminal, glancing doubtfully between the powerful holo table and the humble dark console. In the final seconds the dark console flickers awake into a faint grid glow.

#### 4.2 browser-runtimes/tensorflow-js-setup
- Status: CUT (value audit 2026-09-04): a static bar comparison the still already shows, in a near-rerun of 2.2's alcove blocking.
- Message: The same matrix math runs thirty times apart across backends; check which engine actually loaded.
- Refs: ensign-demir + chief-nazari + masters/bridge
- Prompt: Close on a single bridge console in duty light, console glow dominant, camera locked. The screen builds three timing bars one after another, sharply different heights, beside a small readiness glyph pulsing unevenly. Ensign Demir sits with his wrist terminal glowing over the keys; at the third bar his eyebrows go up, startled that the same math can land that far apart. Chief Nazari stands at his shoulder with her multitool, one brow raised, unsurprised, the look of a woman who has never once trusted a default. The two tall bars dim, the shortest brightens, and the readiness glyph settles into one slow steady pulse.

#### 4.3 browser-runtimes/model-loading
- Message: A trained model is not one file; it ships as a manifest that fans out into binary weight shards.
- Refs: ensign-demir + masters/dashboard-station
- Prompt: Tight alcove shot on the three stacked monitors, duty light with the bridge blurred beyond, camera locked. The top monitor is blank except one hollow alert glyph pulsing slowly. The middle monitor animates a single block fanning out into a row of small shard blocks, which then stream one by one into a receiving column. The bottom monitor rolls untouched telemetry. Ensign Demir sits alone in the chair, head tilted at the blank screen, puzzled, mug clamped beside him. As the last shard lands, the alert glyph clears, a faint waveform begins to draw, and his puzzlement breaks into a small self-deprecating grin: not one file, then.

#### 4.4 browser-runtimes/inference-pipeline
- Message: One reading per second flows through the model live, and every second of it quietly costs memory that someone must give back.
- Refs: ensign-demir + chief-nazari + masters/bridge
- Prompt: Mid shot on the bridge in duty light with a live animated feel, camera locked. Forward displays stream a rolling ticker of small green pulses, one landing each second, broken once by a single brass-amber tick; on the holo table a rolling waveform blooms a fresh reading on the same beat. Low on one display a small plain gauge creeps upward, slow and steady, never pausing. Ensign Demir sits at his console, bright and alert, savoring the live stream he built. Chief Nazari watches from behind the rail with arms crossed over her multitool, but her eyes are not on the pulses: they are locked on the creeping gauge.

#### 4.5 browser-runtimes/onnx-runtime-web
- Message: Two runtimes race under identical load, and the paired dials settle on numbers, not opinions.
- Refs: chief-nazari + ensign-demir + masters/engineering
- Prompt: From the bay entrance in diagnostic light with green display wash, camera locked. The diagnostics displays split into two side-by-side benchmark traces racing left to right, a pair of plain gauge dials beneath them ticking apart. Midway, one trace stumbles flat for a beat while the other runs on; Chief Nazari's multitool snaps up to point at the stumble the instant it happens, her expression all vindicated skepticism: that is why we race them. Ensign Demir sits lower at the bench, wrist terminal glowing, watching the dials with the sober focus of someone updating an opinion in real time as both traces finish unequal.

#### 4.6 browser-runtimes/transformers-js
- Status: CUT (value audit 2026-09-04): a three-step glyph sequence the still with arrows delivers, plus avoidable kit (a) comp cost.
- Message: A pretrained pipeline runs whole: download, load, answer, with no training loop and no labeled data.
- Refs: ensign-demir + chief-nazari + masters/lab
- Kit: (a) alert signal in the spectrograph column
- Prompt: Wide in the lab in working light, camera locked. On a small bench screen a tidy three-step pipeline glyph lights left to right: a download arrow fills, feeds a box that pulses once, feeds a plain gauge whose needle swings and settles. The loop repeats, effortless. Ensign Demir sits at the bench lit by his wrist terminal, faintly indignant relief on his face: all that training, and this one just downloads. Chief Nazari stands by the glass wall, multitool at her belt, mouth not quite a smile, dry as ever. Across the room the tall spectrograph column keeps rippling with the stubborn jagged waveform, untouched by any of it.

## Module 5 · Signal Processing

#### 5.1 signal-processing/time-vs-frequency
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): 5.3 carries this module's pattern-repeats beat better.
- Message: The same slow swell breathes inside both captures, weeks apart; a different view of the signal could finally name it.
- Refs: dr-farah + ensign-demir + masters/lab
- Prompt: Mid shot across the workbench in working light, camera drifting in slowly. Two telemetry frames sit side by side, each playing the same noisy trace with the same slow breathing swell inside it, rising and falling in step. Dr. Farah raises her glowing stylus toward the paired frames, eyes narrowed with intent curiosity, the hunter's stillness of a scientist closing on a pattern. Ensign Demir leans in beside her, wrist terminal glowing, his gaze jumping between the two frames as the swells crest together twice, perfectly synchronized; on the second crest both frames pulse a soft ring of highlight, and the two of them go very still.

#### 5.2 signal-processing/fourier-transform
- Message: One tangled wave is really a stack of pure tones; the transform projects every signal onto the same fixed set of them.
- Refs: dr-farah + ensign-demir + masters/lab
- Prompt: Wide in the lab in morning working light, whiteboard glow dominant, camera locked. On the holographic whiteboard one tangled wave splits upward into a stack of clean sine curves of different heights, one peeling off at a time until the tangle is gone and only the ordered stack remains, gently oscillating. Dr. Farah conducts the split with her stylus, delighted, all wide-eyed animation, this is her favorite thing in the universe. Ensign Demir sits at the workbench watching the tangle come apart, brow furrowed, then slowly clearing, a man watching a chord separate into notes he can finally count.

#### 5.3 signal-processing/spectrograms
- Message: One transform says what frequencies exist; painting them across time says when, and the streak repeats on a schedule.
- Refs: dr-farah + ensign-demir + masters/lab
- Prompt: Close push toward the lab's telemetry wall in working light. The main display builds a waterfall heatmap column by column, steadily, left to right. A bright streak appears in one band, vanishes, then recurs at the same height after the same gap, three appearances across the shot, evenly spaced. Dr. Farah and Ensign Demir stand close beneath the display in profile, faces lit by its glow. On the second streak Demir's eyes widen; on the third, he turns to Farah, and she is already looking at him, absorbed and certain: it keeps a schedule. Neither says a word as the next column draws.

#### 5.4 signal-processing/fft-as-features
- Status: CUT (value audit 2026-09-04): one hand stroke over a static chart at three-character reroll cost.
- Message: Before any compute gets spent, the predicted number goes on the board, where it can be wrong in public.
- Refs: ensign-demir + chief-nazari + dr-farah (set carried by prompt)
- Prompt: The engineering bay: tool wall with shadow-outlined tools, hanging work lamps over the diagnostics bay, a dark half-open cabinet in the aft shadow, warm light under green display wash. The diagnostics display holds a comparison chart with one bar filled and one empty and waiting, beside a row of small frequency-bin glyphs. Ensign Demir reaches up and draws a single short plain stroke on a small slate board, jaw set, committing his number by hand. Chief Nazari watches with arms crossed, one brow up, satisfied that the guess now has a price. Dr. Farah studies Demir rather than the board, measuring the reasoning, as the empty bar pulses faintly, unfilled.

#### 5.5 signal-processing/windowing-and-overlap
- Message: Hard-edged slicing smears energy across the whole spectrum; a tapered window gives the clean peak back.
- Refs: dr-farah + chief-nazari + ensign-demir (set carried by prompt)
- Prompt: The signal lab late: a single bench lamp against display glow, holographic whiteboard dark, the glass wall onto the dim corridor, spectrograph column barely rippling. A telemetry display holds two spectra side by side, one smeared across every bin, one a single clean narrow peak. Between them a small window shape with hard square edges softens into a smooth taper; the smeared spectrum collapses inward, bin by bin, into a matching clean peak. Dr. Farah traces the taper with her stylus, precise and unhurried. Chief Nazari stands with arms crossed, multitool glinting, the weary set of her jaw carrying eighty lost minutes. Ensign Demir watches the smear vanish, chastened, focused.

## Module 6 · Recurrent Networks

#### 6.1 recurrent-networks/sequences-matter
- Message: A rhythm spread across dozens of steps is invisible to a model that only ever sees one frozen snapshot.
- Refs: dr-farah + ensign-demir + masters/lab
- Prompt: Wide in the lab in working light, camera locked. The holographic whiteboard shows a long repeating wave sliding steadily leftward beneath a row of bracketed overlapping windows, its rhythm plain in motion. Apart from the stream, one lone snapshot frame floats frozen, holding a single motionless slice of the same wave. Dr. Farah follows the moving wave with her stylus, intent, then taps the frozen frame with a look of gentle accusation: this is all your network sees. Ensign Demir opens his mouth to offer an analogy, catches her sidelong glance, and closes it again, filing the thought, as the living stream pulses on and the snapshot dims.

#### 6.2 recurrent-networks/simple-rnns
- Message: The cell's output loops back into its own input, so the same value in no longer means the same answer out.
- Refs: ensign-demir + dr-farah + masters/engineering
- Prompt: Mid shot from the bay entrance under warm end-of-shift work lamps, camera locked. The diagnostics display holds a small cell diagram whose output arrow curls back into its own input, a soft pulse of light circling the loop again and again. Beside it an identical input glyph feeds the cell three times, and three stepped output marks light one at a time, each at a different height. Ensign Demir hunches at the console tracing the loop with one finger, brow knotted, his tidy expectations visibly breaking. Dr. Farah points past his shoulder at the third, tallest mark, precise and unsentimental: same input, different answer, and that is the point.

#### 6.3 recurrent-networks/lstm-gates
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): the flatline centerpiece is static by design, in the most expensive clip type (three character refs).
- Message: Two hundred epochs and the loss never moved; the fix is gates that choose what the cell keeps and what it forgets.
- Refs: ensign-demir + chief-nazari + dr-farah (set carried by prompt)
- Prompt: The engineering bay in green diagnostic wash: tool wall, hanging lamps, the dark half-open cabinet in the aft shadow. The central display holds one long dead-flat curve stretched over an agitated signal trace writhing beneath it; the flat line never moves once. Ensign Demir slumps at the bay, wrecked by the overnight run, staring at the flatline. Chief Nazari stands over him with arms crossed and multitool in fist, grimly unsurprised. Then Dr. Farah strides in at the frame's edge holding up a small tablet glowing with a compact diagram of three tiny valve glyphs, and her face is bright, already past the failure: she walked in carrying the fix.

#### 6.4 recurrent-networks/sliding-windows
- Message: A fixed window stepping along the endless stream manufactures a training sample at every position.
- Refs: ensign-demir + masters/bridge
- Prompt: Mid shot into the port-side comms alcove in duty light, the holo table quiet behind, camera locked. The alcove's stacked signal boards show one long unbroken stream trace. A bright bracket clamps around a span of it, lifts a copy that drops into a neat stack below, steps forward one notch, and clamps again, a steady manufacturing rhythm, the stack growing taller with each pass. Ensign Demir sits alone at the alcove, wrist terminal glowing, and his face carries the late-course look: calm, locked on, quietly pleased, a man watching a machine mint training data out of an endless feed and knowing exactly why it works.

#### 6.5 recurrent-networks/sequence-prediction
- Message: The model draws the next reading before it arrives, and puts a time on the anomaly's return.
- Refs: ensign-demir + dr-farah + masters/bridge
- Kit: (c) interval arc on the side pane
- Prompt: Wide on the bridge in duty light, the viewport band a strip of near-black starfield, camera drifting toward the holo table. The table projects a live signal trace drawing steadily toward a vertical time marker; as it reaches the marker, a ghosted continuation draws itself ahead of the data, out to a distant faint spike outline that pulses slowly, not yet real. On a small side pane an arc sweeps toward a far tick. Ensign Demir leans in, lips parting, caught between thrill and disbelief. Beside him Dr. Farah watches the ghost spike with a stillness that is not delight at all: if the timing is predictable, this is not noise. Her expression tips from wonder toward gravity.

## Module 7 · Anomaly Detection

#### 7.1 anomaly-detection/normal-vs-anomalous
- Status: CUT (value audit 2026-09-04): the motion is two traces dimming; the still stages the same argument identically.
- Message: Three alerts, two of them noise; before anyone gets woken again, "anomalous" needs a number.
- Refs: chief-nazari + dr-farah + commander-mirza (set carried by prompt)
- Prompt: The two-tier bridge in duty light: viewport band onto near-black starfield, central holo table, raised command tier behind it. The table projects three signal traces; two dim slowly to embers while one stays bright and keeps pulsing. On a forward display a calm bell-curve band glows, the bright trace's marker drifting out toward its thin far tail. Chief Nazari faces the table with her multitool jabbed toward the dimmed pair, jaw tight, a week of wasted call-outs in her stance. Dr. Farah's stylus is raised but her face is honest and uneasy: her model was never taught to say none of the above. Above them Commander Mirza watches from the tier, level, letting the argument run.

#### 7.2 anomaly-detection/autoencoders
- Message: Squeeze normal signals through a bottleneck and rebuild them; whatever comes back mangled is anomalous by definition.
- Refs: dr-farah + masters/lab
- Prompt: Mid shot from the corridor-side corner with the whiteboard wall facing camera, working light, whiteboard glow dominant, camera easing in. The board carries an hourglass network diagram, wide layer bands pinched to two small nodes and widening again. A clean waveform enters the wide left side, thins as it squeezes through the two-node pinch, and re-emerges nearly identical, settling beside its original; the cycle repeats with a second waveform. Dr. Farah works alone at the board, stylus mid-stroke trailing a faint holo line, utterly absorbed, mouthing nothing, eyes alive; when the second reconstruction lands clean she rocks back on her heels with a satisfied, conspiratorial half-grin at her own idea.

#### 7.3 anomaly-detection/reconstruction-error
- Message: The anomaly comes back from the bottleneck mangled, its error twelve times anything normal.
- Refs: dr-farah + ensign-demir + masters/lab
- Prompt: Closer shot tight on the workbench displays in discovery light, every display lit at once, camera locked. The main telemetry screen holds a clean input waveform above an empty band; the reconstruction draws in beneath it, warping badly away from the original. On a side panel a row of low error bars stands even, then one new bar shoots upward to tower over the rest, holding a slow pulse. Ensign Demir leans in, wrist terminal glowing, breaking into the grin of a pattern recognized, already half-turned to pitch his analogy. Dr. Farah's brow arches in the same instant, challenge ready: her eyes stay on the towering bar, asking it a harder question than he is.

#### 7.4 anomaly-detection/threshold-tuning
- Message: Where the line sits decides which alerts fire; too low buries the crew, too high misses the real one.
- Refs: chief-nazari + dr-farah + masters/bridge
- Prompt: Mid shot on the bridge in weary duty light, camera locked. Forward displays scatter with fourteen small alert blips. On the holo table a vertical threshold line slides slowly across a smooth error-distribution curve; as it moves, the blips dim in groups, twelve fading to embers, until only two still burn. Chief Nazari leans on the table's edge, multitool set down beside her hand, exhausted around the eyes and utterly resolute: she personally chased all fourteen. Dr. Farah gestures with her stylus at the two survivors, concern plain on her face, as the sliding line slows and trembles in place between too many and too few, committing to neither.

#### 7.5 anomaly-detection/the-anomaly
- Message: The loudest alert the system has ever fired, two detectors in agreement and the third, the one that reads amplitude alone, staying quiet, and it matches nothing known.
- Refs: commander-mirza + dr-farah + chief-nazari (set carried by prompt; Demir foreground from behind)
- Kit: (a) alert signal on the forward display
- Prompt: The two-tier bridge in alert light, deep shadow and agitated display scatter, camera pushing in slowly past Ensign Demir, seen close from behind at the table's near edge, wrist terminal glowing, his stillness framing the shot. The forward display towers with a jagged double-spiked waveform repeating over a comb of evenly spaced frequency teeth; two of the three small detector panes on the table flash agreement one after another and hold lit while the third stays dark. Commander Mirza has come down from her tier, brow drawn, chronometer catching the glow. Dr. Farah's stylus hangs lowered, her face open with awe and unease in equal measure. Chief Nazari stares at the spike with the rare haunted flicker of a woman who cleared the calibration twice and believes the machine anyway.

## Module 8 · Advanced Time-Series

#### 8.1 advanced-time-series/beyond-lstm
- Message: The warning sat at step four all along, diluted to nothing by step eighty; attention wires any two moments directly together.
- Refs: dr-farah + ensign-demir + masters/lab
- Prompt: Tight shot over the workbench in working light, camera locked. A bench display holds one long eighty-step trace: a tiny ripple near its start, a large pulse near its end. Dr. Farah closes a hand-drawn holo circle around the tiny ripple, stroke by stroke, her face sober, none of her usual brightness: this one arrived early and they missed the warning. Ensign Demir stands beside her studying the circled ripple, jaw tight, doing the arithmetic of 208 seconds. Then a thin bright thread draws itself from the circled ripple straight to the far pulse, arcing over everything between, both endpoints glowing in step, and Farah's eyes come back to life: a direct connection.

#### 8.2 advanced-time-series/temporal-attention
- Status: CUT (value audit 2026-09-04): the end state equals the approved still; the joined-far-points visual lives in 8.1.
- Message: The model shows its work: a heat band lighting exactly the two moments that mattered, seventy-three steps apart.
- Refs: ensign-demir + masters/bridge
- Kit: (c) interval arc joining the hotspots
- Prompt: Close on the central holo table in duty light, consoles soft in the background, camera drifting in. The holo projects a waveform with a flat heat band running beneath it. The band warms unevenly, colors rising and falling, then settles into exactly two glowing hotspots far apart, everything between them cooling to dark, and a measured arc draws from one to the other and holds. Ensign Demir leans over the table alone, wrist terminal lit, and his face does something quiet and complicated: the model is showing him its reasoning, drawn as geometry, and he looks less like a man reading a chart than one being answered.

#### 8.3 advanced-time-series/forecasting
- Message: The forecast runs ahead of the data into a widening cone, and inside it the pulse keeps its rhythm; predictable means structured, and structured means sent.
- Refs: dr-farah + commander-mirza + masters/bridge
- Prompt: Wide on the bridge in after-hours light, consoles dimmed, starlight dominant through the viewport band, camera locked. The holo table glows low, projecting a signal trace that runs forward past the live edge into a forecast cone that widens with distance; inside it a faint pulse walks forward dead-center, beat after beat, keeping its rhythm as the bounds spread. Dr. Farah stands at the table speaking with her eyes alone, hushed, shaken at the edge of her own logic. On the raised tier Commander Mirza looks not at the cone but at Farah, and finishes the thought with a slow, grave nod. Neither moves again under the starlight.

#### 8.4 advanced-time-series/kalman-filters
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): same bench, same pair, same curve-draws-itself animation as 8.1.
- Message: Trust the prediction, correct it with the noisy measurement, and let the blend decide how much of each; the third curve threads what the first two cannot.
- Refs: ensign-demir + dr-farah + masters/lab
- Prompt: Mid shot across the workbench in working light, the spectrograph column rippling, camera locked. A bench display plots a descending scatter of interval marks, threaded by two smoothing curves: one dragging low behind the drift, one jittering with every noisy mark. Ensign Demir sits at the bench gesturing at each curve in turn, frustrated, asking the display for something between. Behind him Dr. Farah's face carries the particular pleasure of a teacher hearing a student specify an invention he cannot name yet. A third curve draws itself between the two, hugging the drift without the jitter, and Demir turns to her, catching the look.

#### 8.5 advanced-time-series/ensemble-methods
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): the gauges-climbing correlation is the only motion-native content.
- Message: Three forecasters vote and the blend beats any one of them, but every member runs on every input, and the cost triples with the confidence.
- Refs: ensign-demir + dr-farah + masters/engineering
- Prompt: Mid-close shot at the diagnostics bay from the entrance, warm hanging work lamps, camera locked. Three stacked displays each animate a differently shaped prediction trace running in parallel; on a fourth display the three braid into a single steadier line. Beneath the stack three small plain load gauges rise together in step, climbing as the braid tightens. Ensign Demir gestures at the braided line, eager, sold on the vote. Dr. Farah's stylus rises past him to point at the three climbing gauges instead, her expression arch and precise: agreement is lovely, and every member bills for every question. Demir's eagerness deflates into a rueful nod as the gauges keep climbing.

## Module 9 · LLM Integration

#### 9.1 llm-integration/llms-for-science
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): a modest ledger beat; the still can show the flagged page on the rail.
- Message: The report can draft itself while the window counts down, but every generated claim gets a ledger line and a price.
- Refs: dr-farah + chief-nazari + masters/bridge
- Prompt: Wide on the bridge in duty light, camera locked. Above the holo table hangs a green countdown ring, already partly spent. Beneath it, stacked page-outline glyphs assemble row by row, filling with abstract glyph lines. One page flashes brass-amber mid-assembly and slides sideways onto a small side rail, marked and set apart. Dr. Farah gestures through the pitch with her stylus, animated, selling speed with the window closing. Chief Nazari watches from the raised tier with arms crossed over her multitool, unmoved until the amber page slides aside; then she nods once at the rail, and only the rail: the ledger is her price, and she just watched it get paid.

#### 9.2 llm-integration/prompt-engineering
- Status: CUT (value audit 2026-09-04): the no-text law reduces it to a smear-versus-crisp contrast the still delivers.
- Message: Nothing about the model changed between the useless answer and the precise one; only the words in did.
- Refs: dr-farah + ensign-demir + masters/lab
- Prompt: Mid shot at the whiteboard in working light, camera locked. The board is split: on the left a sparse lone block of glyphs, on the right a dense structured column of four stacked glyph sections. The sparse side emits a thin gray drifting smear that dissipates before it forms anything; the dense side emits a crisp bright ordered stream that holds its shape all the way across. Dr. Farah marks the dense column section by section with her stylus, brisk and precise, unembarrassed by the failed attempt she pinned herself. Ensign Demir leans over the workbench comparing the two outputs, wrist terminal glowing, nodding slowly as the same machine behaves like two different machines.

#### 9.3 llm-integration/rag-for-signals
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): motion adds only the ordering; the retrieval picture reads from the still.
- Message: Retrieve first, then generate: the model only knows what the pipeline hands it.
- Refs: dr-farah + ensign-demir + masters/lab
- Prompt: Mid shot in the lab with the spectrograph column rippling, working light, camera locked. Telemetry displays show rows of archive glyphs; a handful brighten, detach, and funnel along a bright green arrow into a framed panel, one glowing row visibly traveling the arrow's length. The panel pulses as each row lands, then emits a clean steady output stream from its far side. Dr. Farah traces the retrieval arrow with her stylus, methodical, building the pipeline stage by stage in the air. Ensign Demir watches the rows flow, wrist terminal lit, his face doing the familiar arithmetic of mapping it onto something he already knows, alert and slightly suspicious of his own analogy.

#### 9.4 llm-integration/report-generation
- Message: Generate and validate one section at a time, and cut what fails validation rather than ship a guess.
- Refs: dr-farah + masters/lab
- Prompt: Mid shot in the lab in late light, a single bench lamp against display glow, camera locked. The whiteboard holds six stacked section frames. One by one each frame fills with abstract glyph rows and earns a small check glyph beside it, a steady production line. The fifth frame's check flickers, fails to light, and the whole frame dims and collapses out of the stack, the frames below sliding up to close the gap. Dr. Farah sits alone at the workbench, stylus paused mid-air, tired around the eyes with hours left before the window. She watches the section die without flinching, then gives the shortened report a single approving nod: smaller and true.

#### 9.5 llm-integration/multi-model-systems
- Message: Four specialists chained end to end, with the expensive stage gated shut unless the detector votes anomaly, running all night with nobody watching.
- Refs: ensign-demir + masters/bridge
- Prompt: Wide on the bridge in after-hours light, consoles dimmed, starlight through the viewport band, camera drifting in very slowly. The holo table chains four glowing stage glyphs from a raw waveform on the left to a page outline on the right. A pulse of light travels the chain: the first run, dim, exits early at a small gate glyph before the final stage; the second run flashes alert-bright, the gate opens, and the pulse runs the full length to light the page outline. Ensign Demir sits alone in the port-side comms alcove, wrist terminal casting the only warm glow, calm and proprietary, a builder watching his system work the night shift without him.

## Module 10 · Optimization & Edge

#### 10.1 optimization-edge/model-profiling
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): a strong beat that re-shoots 1.4's incident scene almost frame for frame; backfill it.
- Message: The replay shows exactly how the dashboard died: free memory to zero, one frame stuttering to a stop, the cleanest capture in nine days gone.
- Refs: chief-nazari + ensign-demir + masters/engineering
- Kit: (d) AI ring on the side screen
- Prompt: Wide from the bay entrance in incident light, a single red-orange status lamp burning over the diagnostics bay, camera locked. The engineering board replays the failure in slow motion: a falling memory line descends toward zero while beside it a display frame stutters, tears, and freezes mid-draw; when the line touches bottom, the board goes still. On a side screen the AI's waveform holds a steady neutral ripple. Chief Nazari stands before the board, multitool hanging unused at her side, and she is not angry; she is quiet, which is worse. Ensign Demir stands a step back, hollowed out, watching his own crash under the red lamp, his wrist terminal dim.

#### 10.2 optimization-edge/quantization
- Message: One byte per weight instead of four collapses the file, and the accuracy it costs concentrates in the class that can least afford it.
- Refs: chief-nazari + ensign-demir + masters/engineering
- Prompt: Mid shot from the bay entrance in warm work light under the hanging lamps, camera locked. A diagnostics display shows four stacked blocks compressing smoothly into a single block a quarter their height; beside it a smooth bar distribution snaps onto coarse stepped levels, fine detail gone in one motion. On a second pane five plain class glyphs glow evenly; as the snap lands, four hold bright and one slowly dims. Chief Nazari stands squared at the board, decisive, multitool pocketed: the cut is made. Behind her Ensign Demir works his glowing wrist terminal, then stops, eyes caught by the one dimming glyph, unease arriving right on schedule.

#### 10.3 optimization-edge/pruning
- Status: CUT (value audit 2026-09-04): near-still solo scene; the load-bearing strand flicker is too subtle for Veo to land.
- Message: Half the weights sit within a hair of zero, but hidden assumptions live in that half; find them before signing the cut.
- Refs: ensign-demir + masters/engineering
- Prompt: Close shot from the bay entrance angled into the diagnostics bay, late and quiet under one hanging lamp, camera locked. One display carries a bar histogram with a tall central spike and thin tails. A second pane shows a branching diagram with most strands faded to faint outlines: group by group the faint strands detach and drift off the pane, and the structure holds its shape without them. Ensign Demir leans on one hand in the work chair, wrist terminal glowing, wearing the wary, deliberate focus of a reviewer who came to sign and started reading instead. One remaining bright strand flickers, twice; his eyes narrow, and he straightens out of his lean.

#### 10.4 optimization-edge/caching-strategies
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): teaches well in motion but re-stages 4.3's alcove exactly; backfill it.
- Message: The same signature classified 214 times paid for 214 model runs; one remembered answer covers all but the first.
- Refs: ensign-demir + masters/dashboard-station
- Prompt: Tight alcove shot on the stacked monitors in late lighting, the bridge dimmed beyond, camera locked. The top two monitors scroll a long column of identical repeated waveform snippets, one after another after another. One snippet brightens, lifts out of the column, and locks into a small frame pinned at the top; from then on each arriving duplicate flicks against the pinned frame and passes without lighting anything else. On the bottom monitor a plain load gauge sinks from busy to nearly idle. Ensign Demir leans back in the chair with his mug lifted, wrist terminal glow catching his sleeve, and a small rueful smile crosses his face: he has seen this exact waste before, in another life, in another list.

#### 10.5 optimization-edge/webgpu-acceleration
- Message: Stop smuggling matrix math through a pipeline built for triangles; run it on compute cells built for the job, and watch the latency fall.
- Refs: chief-nazari + ensign-demir + masters/bridge
- Prompt: Close-mid shot centered on the holo table in duty light, table glow dominant, camera locked. The hologram shows a dense wireframe of triangles; patch by patch the triangles dissolve into a clean regular grid of glowing compute cells, the geometry simplifying as it transforms. Behind, a console trace steps sharply downward, twice, and holds at the lower level. Chief Nazari taps the table's edge with her multitool in a slow rhythm, eyes on the falling trace, hungry for the last of the latency. Ensign Demir stands opposite, wrist terminal glowing, bright-faced and quick, framing the idea with his hands as the final triangles disappear into the grid between them.

## Module 11 · Capstone: Deploy DEEP SCAN

#### 11.1 capstone/system-architecture
- Message: Ten modules of separate pieces become one system, on hardware with a fatality on its record, while the pulse interval keeps falling.
- Refs: commander-mirza + ensign-demir + masters/bridge
- Kit: (c) interval arc on the forward display
- Prompt: Full-width shot on the bridge in duty light, camera locked. The forward display carries a single slow pulse waveform above a large plain arc that sweeps once, unhurried. On the holo table five component blocks assemble one at a time into a linked chain, each clicking into line until a single connected system hangs complete, slowly rotating. Commander Mirza stands squared on the raised tier beside her chronometer, jaw set, the order already given. Below, Ensign Demir raises his glowing wrist terminal toward the finished projection, and he is not the overwhelmed ensign of module one: he is presenting, steady, and she lets him.

#### 11.2 capstone/ci-cd-pipeline
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04): the backward-trace reveal is real, but still plus text deliver most of the point.
- Message: Every gate shows green, but green against what: the artifact the pipeline blessed is not proven to be the artifact that ships.
- Refs: chief-nazari + ensign-demir + masters/engineering
- Prompt: From the bay entrance under green diagnostic wash, camera drifting in slowly. The diagnostics screen holds a pipeline graph of nodes, each lighting a calm green check glyph in sequence, everything passing. Ensign Demir waits a step behind with the quiet pride of a man whose branch is all green. Chief Nazari leans into the screen with her multitool, ignoring every check, and traces the graph backward until a slow highlight reveals a thin tether from one mid-pipeline node to a separate storage-drum glyph sitting apart in the dark; the tether pulses brass-amber, twice. Demir's pride drains into understanding as she taps the drum, not the checks, without a word.

#### 11.3 capstone/monitoring
- Message: The failures that never throw: confidence decaying, latency creeping, inputs drifting away from the data the model learned on.
- Refs: ensign-demir + masters/engineering
- Kit: (d) AI ring on the side screen
- Prompt: From the bay entrance with the hanging work lamps low and green display glow rising, camera locked. The diagnostics screens stream three live monitor traces: a confidence line sloping down so gently it barely reads, a latency band slowly thickening, and two overlapping distribution curves sliding apart, each drift almost imperceptible frame to frame and unmistakable across the shot; by the end the two curves no longer overlap at all. On a side screen the AI's waveform holds a calm ripple. Ensign Demir moves along the bay wiring display to display, wrist terminal lit, methodical and unhurried, building tripwires for failures that will never announce themselves, the dead cabinet dark in the aft shadow behind him.

#### 11.4 capstone/documentation
- Message: The handover: enough of the system on the wall that someone else could run it tomorrow.
- Refs: dr-farah + ensign-demir + masters/lab
- Prompt: Mid shot in the lab in working light, camera locked. The holographic whiteboard assembles itself panel by panel into an ordered wall: a small network diagram, rows of short glyph bars, a column of small gauge tiles, and last an arrowed flow of steps drawing itself corner to corner, each panel clicking into place with a soft pulse. Ensign Demir writes at the workbench, wrist terminal lit, absorbed in the unglamorous work and doing it anyway. Dr. Farah stands by the glass wall with her stylus folded in crossed arms, watching him rather than the wall, her question already asked; when the final panel lands she gives him a small, level nod: now it survives you.

#### 11.5 capstone/launch
- Message: Nothing is left on the checklist; a hand rests over the deploy control as the pulse counts down to the cleanest window of the night.
- Refs: ensign-demir + commander-mirza + chief-nazari (set carried by prompt)
- Prompt: The two-tier bridge under tight duty lighting, every console lit: viewport band, central holo table, raised command tier, camera pushing in very slowly. The table projects a pulse ring sweeping down beside a deployment arc holding steady at ready. Ensign Demir stands at the table and lowers one hand until it hovers just above a single glowing control, and the hand does not shake; his face is the finished version of the eager kid from module one, focused, breathing slow. Commander Mirza stands on the tier beside her chronometer, composed, her stillness the permission. Chief Nazari waits at the rail with her multitool holstered and nothing left on her list, which for her is a kind of blessing. The ring completes its sweep and flares; the hand stays hovering as the shot ends.

## Epilogue scenes

The seven epilogues that move to their own staging, from the scene bible's
`-epilogue` entries; the product renders these on the Consequence step,
after the exercise. The value audit found the season's strongest motion
beats here, so five are in the launch plan (E1, E2, E4, E5, E7), not
optional extras; E3 is deferred and E6 cut (see the Generation plan).

#### E1 foundations/normalization-epilogue
- Message: The feeds settle onto one scale and the bridge goes calm, except one sample that still refuses to look like the others.
- Refs: ensign-demir + dr-farah + masters/bridge
- Kit: (b) ambiguous reading, the ringed trace
- Prompt: Camera push toward the bridge's forward display wall in duty light. Every display settles as its feed aligns to a single calm shared scale, panel after panel smoothing into agreement. One panel does not: a lone near-flat trace inside a thin ring sits beside a plain verdict gauge whose needle trembles exactly at its midpoint, refusing to commit. Ensign Demir and Dr. Farah stand at the rail in profile, faces lit by the wall. Demir's eyes sweep the calmed displays with satisfaction; Farah's stay fixed on the one ringed panel, curious and faintly troubled, the look of a scientist choosing to flag a thing rather than delete it.

#### E2 neural-networks/first-neuron-epilogue
- Message: Two output traces holding steadily apart, twenty minutes without a crossover, watched a little longer than anyone would admit.
- Refs: chief-nazari + masters/bridge (galley one-off: derive brass fittings and palette)
- Prompt: A ship's galley counter in low after-hours light, brass fittings and mugs on a rail, one spare monitor bolted above the counter, camera locked in a close shot down the counter. On the monitor two flat green traces run side by side, holding steadily apart, never touching, tick after tick. Chief Nazari enters carrying a mug, multitool at her belt, meaning to walk past. She pauses beneath the monitor. Her guarded face does not change, but she stays, and stays, watching the traces hold their separation, and something in the set of her shoulders softens by exactly one degree before she turns and walks on, leaving the monitor running to no one.

#### E3 training-loop/loss-functions-epilogue
- Status: DEFERRED PAST LAUNCH (value audit 2026-09-04, upheld 3-0 on the vote rerun): motion adds only the writing ritual; the number itself can never appear on film.
- Message: The network's opening score goes on the glass in marker: the exact loss of knowing nothing at all, and it stays until the number moves.
- Refs: dr-farah + ensign-demir + masters/lab (sanctioned glass-wall reverse)
- Prompt: The one sanctioned reverse angle: looking through the lab's glass wall from the dim corridor, lab displays glowing beyond, camera drifting in very slowly. Dr. Farah finishes a short mirror-reversed handwritten squiggle with no readable letters, small on the glass at eye height, caps the marker with ceremony, and lowers it, her face carrying the gravity of a ribbon-cutting in reverse: this is the score of knowing nothing, dated and owned. Ensign Demir stands beside her looking at the mark, sobered, understanding that nothing counts until that number moves. Neither speaks; the push ends framing the small squiggle against the glow with the two of them behind it.

#### E4 recurrent-networks/sequence-prediction-epilogue
- Message: The forecast said forty-seven minutes; the real spike walks onto the display and lands inside the drawn outline.
- Refs: ensign-demir + dr-farah + masters/bridge
- Kit: (a) alert signal, the arriving spike and its ghost outline
- Prompt: Camera push toward the bridge's forward display wall, consoles dimmed so the display glow dominates, a handful of crew figures standing at the bottom of frame with their backs to camera, all facing the wall. The main screen carries a long flat trace running steadily toward a ghosted spike outline drawn ahead of the data, waiting. The live trace reaches the outline and the real spike rises exactly inside it, edge matching edge, then completes and runs on. As it lands, Ensign Demir and Dr. Farah turn to each other in profile, faces caught in the display glow, his open astonishment meeting her grave certainty, and nobody in the room says anything at all.

#### E5 anomaly-detection/reconstruction-error-epilogue
- Message: One feature carries nearly the whole error, and the ship's old rule-based mind asks, unprompted, for its own score.
- Refs: ensign-demir + masters/bridge
- Kit: (d) AI ring, ripple to single tall spike
- Prompt: Camera push toward the forward display wall in after-hours light, consoles dimmed. The main display holds a bar chart of low even glyph-marked bars with one bar towering alone, pulsing slowly. On a smaller side screen the AI's waveform holds a calm even ripple, then lifts into a single clean tall spike and stays there, holding its question. Ensign Demir stands below the wall and turns his face up toward the side screen, wrist terminal glowing, and his expression is not triumph at the towering bar; it is the unsettled stillness of a man who has just been asked something personal by a machine, in an empty room, after hours.

#### E6 llm-integration/rag-for-signals-epilogue
- Status: CUT (value audit 2026-09-04, upheld 3-0 on the vote rerun): a count comparison the still and text deliver at a glance; the still and written scene carry the 17-on-14 overrun.
- Message: The answer came back fluent, cited, and wrong: seventeen claims standing on fourteen retrieved rows.
- Refs: ensign-demir + chief-nazari + masters/bridge
- Prompt: Camera push toward the bridge's forward display wall in duty light. The main display splits in two: an upper context panel holding fourteen bright row glyphs, and a lower answer panel where tally glyphs assemble one at a time, matching the rows above, then continuing past them; the last three land with no row to stand on and pulse brass-amber. Chief Nazari points up at the overrun, jaw set, grievance vindicated in real time: fluent is not the same as true. Ensign Demir sits at the console below, eyes moving from her hand to the three orphaned glyphs, jaw tightening as the demo he was proud of teaches him its real lesson.

#### E7 capstone/launch-epilogue
- Message: The classification lands on every display at once: the signal answers in the ship's own harmonics, from 4.2 light-years out, and the interval keeps falling.
- Refs: commander-mirza + ensign-demir + masters/bridge
- Kit: (d) AI ring pulsing in step with the main-wall waveform
- Prompt: The series-finale wide: camera pushing from deep in the bridge toward the forward display wall with the whole deck in frame. Display after display lights with the same repeating waveform until every screen carries it, beating in unison, beside one steadily climbing curve. At the comms alcove Ensign Demir stands lit by the screens, awe overtaking his face as the AI's waveform on his alcove display pulses in exact step with the wall. Nearest the viewport band Commander Mirza stands in three-quarter profile, silvered hair catching the glow, utterly still, reading the mirrored signal like a message addressed to her ship. Two more crew stand motionless at their stations in the wash of light. The shared beat quickens, twice, before the shot ends with every screen in rhythm.
