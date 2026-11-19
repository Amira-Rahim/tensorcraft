# Deep Orbit artwork audit

Date: 2026-11-06

The current art is much more personable, and several scenes already feel warm,
curious and enjoyable. The largest remaining opportunity is to make each image
express its own story action. A correct face and a handsome spacecraft room do
not automatically make the right scene.

This review covers every published Deep Orbit still: 63 lesson scenes,
20 portrait states, five location plates, eleven patches, one completion seal,
two social-card derivatives and the world-trailer poster. It also covers the
shared learn-page poster and samples all three relevant moving-media files.
That is 104 still images and three videos. All 56 complete lesson MDX files
were read, including their endings. Source anchors informed identity checks.
Equivalent source PNGs are not counted again as separate published artworks.

[Visual review](deep-orbit-artwork-2026-11-06/index.html) provides filters,
full-size artwork and a critique for each of the 107 assets.
[Structured audit](deep-orbit-artwork-2026-11-06/audit.json) contains the same
records. [Inventory](deep-orbit-artwork-2026-11-06/inventory.json) preserves the
reviewed asset hashes.

## Decisions

| Recommendation | Scene count | Meaning |
| --- | ---: | --- |
| Keep | 14 | The existing composition earns its slot. Optional polish can wait. |
| Refine | 46 | Preserve the useful crew and setting. Change the display, pose, focal point or expression. |
| Replace composition | 3 | The dominant action misses the scene and deserves a new composition. |
| Delete scene | 0 | Every current story slot has a purpose. |

These are editorial judgments, not measured learner outcomes. A keep can still
have a small improvement noted. A replace recommendation concerns the image,
not removal of the story or its place in the lesson. Severity describes a
finding. Priority can also reflect a separate problem with reusing an image
at the ending.

P1 covers concrete misleading meaning, identity failures and mismatched visual
states. P2 covers story specificity, character action and important ambiguity.
P3 covers optional polish and small-size clarity.

## The six first-priority scene corrections

1. **Normalization epilogue:** five green checks make classifier confidence
   look like verified correctness. The story explicitly leaves the review open.
   Preserve the friendly faces and replace the checks with score positions.
2. **Spectrograms:** bright streaks span much of the screen height. With the
   lesson's time-horizontal and frequency-vertical convention, this reads as
   broadband activity, rather than the intermittent narrow-band tone. Replace
   the screen with time-localized marks at one frequency band. The conventional
   plotting orientation is also shown in the
   [SciPy spectrogram documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.spectrogram.html).
3. **Windowing and overlap:** the apparent after-image is a needle-sharp peak.
   The lesson teaches the lower sidelobes and broader main lobe of the Hann
   comparison. Preserve the warm crew group and redraw the two spectra on
   comparable axes. This tradeoff is documented in
   [SciPy's spectral analysis guide](https://docs.scipy.org/doc/scipy/tutorial/signal.html#spectral-analysis).
4. **Kalman filters:** interpreting the orange line as the smoother, it sits
   below the falling measurements, suggesting a lead rather than the lesson's
   lag. The line has no legend, so that identification is an inference. Show
   the two histories with the intended lag and avoid implying known ground
   truth. The local lesson's numerical example is the decisive reference.
5. **Report generation:** six checked sections contradict the five sent and
   one withheld at the ending. The opening also looks fully approved before
   the learner does the review. Keep the warm Farah, but make the unresolved
   section visible and preserve the release distinction.
6. **Launch epilogue:** ARIA becomes a decorative spirograph on the right
   monitor. Restore her fixed ring and horizontal waveform. The crew's faces
   are useful and can stay. Improve the paired-harmonics focus and crop before
   paying for a completely new composition.

These do not require a wholesale regeneration of the scene library. A precise
screen edit can often preserve the best acting in an image. Generated art can
supply room, faces and gesture; authored vector or canvas graphics should carry
any diagram whose exact topology, axes or statuses matter. A narrative image
may simplify a result, but should preserve the mechanism and uncertainty.

## The three compositions worth replacing

- **Sequence-prediction epilogue:** the text earns a collective, breath-held
  watch. The picture reads as another discussion around a table. Stage the
  shared pause and where everybody looks.
- **The Anomaly:** the large generic jagged trace dominates the frame while
  the specific disagreement and comparison remain hard to read. A huge trace
  is an ambiguous cue, not proof of wrong numeric amplitude. Recompose around
  the actual checks and each crew member's response to them.
- **Monitoring:** plugging cables makes software instrumentation look like
  a hardware repair job. Show Demir tracing one unexpected metric to a clear
  monitoring question, with a readable test action and reaction.

Each replacement should be more enjoyable through discovery, interaction and
specificity. Neither exaggerated smiles nor larger warning lights solve the
underlying staging problem.

## Fun, warmth and character

The user explicitly requested a fun, engaging, lighthearted adventure. This is
a central criterion alongside story truth. Delight includes curiosity, dry wit,
competence and small human habits. A serious beat can still belong in an
inviting story. The Vanguard loss and the missed transmission should retain
their weight.

Strong examples to preserve include the friendly ensemble comparison, Demir's
coffee pause in caching, the playful simplicity of Transformers.js, and
Nazari's quiet cup in the first-neuron epilogue. The actual cast has enough
personality to make the work enjoyable.

The recurring weaknesses are more specific:

- Farah points while Demir rests his chin in multiple neighboring scenes.
  Tensor Shapes, Time vs Frequency, Spectrograms and Prompt Engineering make
  that repetition particularly visible. Let him manipulate, compare or catch
  something. Let her react to his work.
- Nazari often has folded arms even when a practical test or a small concession
  would tell us more. Her raised eyebrow and restrained approval are good
  comic tools. Repeated scolding makes the learning atmosphere harsher.
- Mirza's open-hand presentation appears in several otherwise different
  decisions. Show her choosing, pausing, checking a cost or making room for
  somebody else to act.
- Busy green monitors compete with the one result that matters. One legible
  visual question will usually make an image more engaging than another wall
  of glowing diagrams.
- Demir's errors should lead to investigation and growth. Repeated exhausted
  or chastened poses can make him seem permanently incompetent.

A useful scene brief names what one person is doing, what somebody else is
reacting to, and the question the viewer can notice. Give each composition
one memorable action. Vary wide room views, close shared work, reaction shots,
quiet object moments and occasional pauses. Preserve the warm brass and green
identity while letting faces, hands and one focal display carry the scene.

## Ending images and new artwork

The renderer reuses a briefing image in Consequence whenever
`scene.epilogueLocation` is absent. That means 49 of 56 endings currently reuse
an opening image. The rule follows a location change, although a new visual
state or character beat can matter in the same room. See
[lesson-steps.tsx](../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx#L2382).

I recommend eight additions, in two stages. The first three are compact,
matched consequence variants that correct a real state mismatch:

1. **Tensor Operations:** the stable coordinated ripple after the crash is
   fixed, with a small shared release of tension.
2. **Data Loading:** stable capacity and a completed archive read, with
   Demir's delayed fist pump and ARIA's dry timing response.
3. **Forward Pass:** Demir alone at the repaired input, showing quiet competence
   and retaining the provisional nature of the model's scores.

The next five offer strong character payoffs and visual variety:

4. **Backpropagation:** Nazari's stopwatch and Demir waiting through the slow
   comparison. This is specific workplace humor already present in the text.
5. **Fourier Transform:** Farah catches Demir's wrist at the unexpected fifth
   peak. Use surprise and shared curiosity, not panic.
6. **Windowing and Overlap:** Farah pins her first physical print beside the
   earlier record. The unusual paper choice makes a digital investigation human.
7. **Quantization:** Nazari sets the tool down and privately studies the raw
   pulses. A tiny softening of her face is an earned reward.
8. **System Architecture:** the little fallback box and ARIA's unchanged
   abstract presence. Her dry observation can be gently funny and touching.

Four later options remain documented: Farah's recognition at Evaluation,
ARIA's unsolicited ONNX log, the calibration-pattern comparison at The Anomaly,
and the uncertain ensemble extrapolations. Make these after the first eight
if the sequence still needs them. Do not add an image after the final
`operator_note: none` beat or visualize a resolved source for the signal.

[Ranked addition briefs](deep-orbit-artwork-2026-11-06/new-art-shortlist.json)
include timing, art direction and constraints. These recommendations do not
call for 49 new paintings or more filler between lesson sections.

## Deletion and supporting artwork

No published asset in the audited set is a verified orphan. Keep the existing
scene slots, useful room plates, complete portrait vocabulary and earned
patch collection. Replacement means retiring the superseded file once its new
version is ready. Repeated uses at an ending can change without deleting a
useful opening image.

Five portrait states have no authored Dialogue use in the current MDX:
Mirza concerned and approving, Farah shaken, Demir overwhelmed and ARIA alarm.
They complete useful emotional ranges and are small. Their absence from authored
dialogue alone does not justify deletion. The available warm expressions could
be used more deliberately at earned turns.

The clearest supporting-art defect is the Signal Processing patch's opaque
white corners. The unmasked image makes them visible on dark surfaces. Most
other badge changes are optional simplification at 28px, not teaching errors.
The two OG files are deliberate renderer derivatives, not wasted duplicates.

The trailer poster and character shots should eventually match the current
portrait anchors. The learn trailer contains visibly malformed generated code
and noticeable face, hair and complexion discontinuities in the command figure.
Its energy eruption reads as a more threatening event than the desired tone;
that is a tone judgment, not proof of an authored story event. The world trailer
contains useful warm exchanges worth borrowing. Preserve the owner-approved
films while preparing any targeted replacement or recut.

## Production causes and review method

Several scene-bible briefs lag behind the current lessons. Inference Pipeline
still carries a going-live premise while the MDX opens on cancellation cleanup.
Monitoring's older instructions mention an accuracy claim and wiring, while
the current lesson distinguishes unlabeled monitoring from accuracy. Reusing
those prompts unchanged would reproduce the mismatch.

Before new generation, reconcile each brief with the current opening, learner
task and ending. Name the exact cast, action, emotional turn, diagram meaning,
uncertainty and visual-state timing. Preserve canonical identity references.
Keep exact instructional labels and data in authored UI when they need to be
read or checked. Review the image at native size and a narrow content width,
then alongside its neighboring scenes and both story sections.

The audit individually inspected all 104 stills. Three agents read every full
lesson, with a second pass on disputed technical claims and the parent review
of critical images and the complete scene sequence. Portrait proofs compare
56px, 64px and 88px. Patch proofs compare 28px, 48px and 72px. Scene sequence
proofs show 300px thumbnails. These are controlled image-size comparisons,
not evidence of each actual live page's viewport layout.

The world trailer was sampled once per second across 88 seconds, the learn
trailer across 72 seconds, and its loop across 24 seconds. The saved sheets
record those samples. Audio, continuous motion and every intermediate video
frame were not reviewed. This cannot establish flash safety or performance in
real playback. The audit did not execute the lesson exercises or conduct
learner testing. All conclusions about warmth and engagement are informed
design judgments.

No product files or artwork were modified. Asset hashes and per-file coverage
were checked. The audit gallery was checked separately for filtering, image
loading, keyboard access and narrow-screen overflow.

## Every scene

The records below preserve positive findings as well as changes. Every scene
includes its current artwork, source lesson, intended beat, visible evidence,
character direction, small-screen or ending considerations, and deletion
recommendation.

### foundations/introduction-to-tensors

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/foundations/introduction-to-tensors.webp)

[Read the lesson](../../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx)

**What the scene needs to do.** Mirza asks Demir to begin investigating an unfamiliar signal. His immediate task is connecting twelve selected readings to a four-sensor chart.

**Emotional purpose.** An inviting first assignment, with curiosity and a manageable first step inside a much larger mystery.

**Visible evidence.** Mirza extends an open hand from the command tier while Demir looks toward her. A tall column of repeated waves and histogram shapes dominates the center. ARIA appears as a waveform on the left screen.

**What works.** The two human identities, uniforms and signature devices are recognizable. The open gesture and attentive exchange make the bridge feel welcoming. The starfield and familiar command tier establish the adventure without an emergency.

**Findings and changes.**

- Medium: The central spectacle does not show the current first task. The lesson starts with a flat list and a chart connection. The image instead gives the tallest object many already-organized waves and spectrum-like bars. Proposed change: Replace the tower with a modest selected-reading tray and an adjacent chart awaiting input. Keep exact values and labels in the authored interface.
- Low: The protagonists compete with too many equally bright instruments. The central tower, left ARIA ring and colored right display pull attention in three directions. Proposed change: Lower secondary display contrast and let Mirza, Demir and one task surface form the main triangle.

**Art direction.** Keep the wide bridge welcome. Bring the task to Demir’s working height and make Mirza’s gesture invite him into it. A short, visible queue of selected data makes the first job feel achievable.

**Warmth and engagement.** Preserve the easy eye contact and open invitation. Let Demir have the small, expectant smile of someone about to make a useful thing work.

**Use at the ending.** {"status": "partial", "observation": "The same Mirza-and-Demir bridge image returns after four chart lines appear and Demir sends the recording to Farah. Its abstract tower does not show that small completed result.", "recommendation": "Keep the establishing art if the actual chart stays prominent. Prefer a shared initial/final screen variant when revising the central display, without adding another full scene."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** Keep a dedicated opening illustration. It establishes both the ship and the relationship that makes the learning task personal.

**Additional artwork.** No extra opening or epilogue bitmap is needed. The learner’s actual four-line chart supplies the payoff.

### foundations/tensor-shapes

**Recommendation: refine. Priority: P2. Story fit: weak. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/foundations/tensor-shapes.webp)

[Read the lesson](../../packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx)

**What the scene needs to do.** Farah checks that Demir’s twelve readings become three rows of four, then four sensor rows in time order.

**Emotional purpose.** Pleasure in making an initially confusing arrangement click, with Farah as a curious collaborator.

**Visible evidence.** Farah points toward a floating polyhedron in front of a dense wall display. A decorative wave divides into two similar perspective grids. A large waveform and several circular instruments occupy most of the wall.

**What works.** Farah’s AR lens, tied hair and lab layer remain identifiable. The stylus supplies an active gesture. The brass bench instruments and green column clearly locate the scene in the lab.

**Findings and changes.**

- Medium: The main diagram leaves the arrangement problem unclear. A wave branches into two similar grids. That could be conceptual shape shorthand, but it does not visibly distinguish the current 3-by-4 arrangement from its 4-by-3 transpose. The polyhedron adds another competing concept. Proposed change: Replace the branch and polyhedron with one selected grid and its transposed arrangement, preserving the same twelve marked cells.
- Medium: The scene reads as a generic science lecture at small size. Farah is relatively small beside a huge busy display, and the point of her gesture is an ornamental object. Proposed change: Crop closer, reduce surrounding panels and give her gesture a clear destination in the selected data.

**Art direction.** Make this a small visual puzzle. Farah can turn a transparent grid panel while the same four sensor colors stay together. Draw exact grid geometry in a controlled vector layer, then keep her face and stylus integrated with it.

**Warmth and engagement.** Let Farah look delighted by a simple rearrangement, as if she is inviting the learner to spot the trick. Reduce the wall of intimidating instruments.

**Use at the ending.** {"status": "partial", "observation": "The ending shows Farah applying the arrangement to450 moments and64 sensors. A generic lab grouping image can bridge the moments, but the current ornamental grids do not show the discovery.", "recommendation": "A corrected grouping scene can serve both stages if it avoids presenting an exact full result. The actual output chart should carry the change in scale."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** The location and collaboration matter. Replace the misleading display treatment rather than removing the scene.

**Additional artwork.** The live chart already delivers the epilogue’s grouping payoff. A second static lab image would repeat it.

### foundations/tensor-operations

**Recommendation: keep. Priority: P2. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/foundations/tensor-operations.webp)

[Read the lesson](../../packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx)

**What the scene needs to do.** Demir’s wrong multiplication has stalled the sensor feed. Nazari needs a working amplifier before more readings arrive.

**Emotional purpose.** A recoverable, slightly comic mistake under practical pressure.

**Visible evidence.** Nazari leans across the console with a multitool and an emphatic expression. Demir has one hand in his hair and one on the controls. Behind them, many stacked traces sit under a large tangled line motif.

**What works.** This is a specific interaction rather than two people posing beside a graph. Their opposing postures carry both the mistake and Nazari’s impatience. Faces, age markers, earpiece, wrist terminal and workwear read well. The foreground makes the human exchange legible even when the background shrinks.

**Findings and changes.**

- Low: The knot can look like an attractive signal pattern instead of a stopped computation. The central tangle is symmetrical and bright, and the surrounding traces remain regular. There is little visual evidence of a failed connection. Proposed change: Use a small, clearly interrupted connector or stalled input slots on the working console. Keep the abstract knot subordinate.
- Low: Nazari’s anger is close to overpowering the joke. Her leaning posture, open mouth and knitted brows make the scene more scolding than the dry coffee-ration threat later in the lesson. Proposed change: Soften the mouth slightly and keep the precise, raised-brow impatience.
- High: The failure artwork is also reused after the successful fix. The epilogue says the amplifier works and Nazari notices a repeated coordinated ripple. Reusing a distressed Demir, confrontational Nazari and frozen knot visually restores the crash. Proposed change: Add an aftermath variant: a steady working console, a common ripple marked across several channels, Demir relieved and Nazari leaning in with interest. Keep the full64-channel claim in text or authored graphics.

**Art direction.** Retain the camera distance and action. If touching it again, clarify the stalled computation and keep the comedy directed at Demir’s wrong operation rather than his competence.

**Warmth and engagement.** Preserve the familiar debugging disaster and Nazari’s practical tools. A more deadpan look would make her formidable and funny without becoming hostile.

**Use at the ending.** {"status": "contradiction", "observation": "The epilogue says the amplifier works and Nazari notices a repeated coordinated ripple. Reusing a distressed Demir, confrontational Nazari and frozen knot visually restores the crash.", "recommendation": "Add an aftermath variant: a steady working console, a common ripple marked across several channels, Demir relieved and Nazari leaning in with interest. Keep the full64-channel claim in text or authored graphics."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** This scene earns its place through clear character action and a memorable failure. It should not be deleted.

**Additional artwork.** Add an aftermath variant: a steady working console, a common ripple marked across several channels, Demir relieved and Nazari leaning in with interest. Keep the full64-channel claim in text or authored graphics.

### foundations/data-loading

**Recommendation: refine. Priority: P2. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/foundations/data-loading.webp)

[Read the lesson](../../packages/content/content/deep-orbit/foundations/04-data-loading.mdx)

**What the scene needs to do.** Demir’s overnight fetch-everything array has exhausted memory and disrupted ARIA’s queue. The morning task is to rebuild it as a lazy loader.

**Emotional purpose.** Rueful embarrassment and a clear opportunity to recover.

**Visible evidence.** Demir slumps at the left of an engineering console, supporting his head. A large rising trace ends in a dashed drop to an X. A full segmented gauge and red overhead lamp signal trouble. ARIA’s ring watches from the right.

**What works.** The red lamp breaks the otherwise uniform green palette for a story reason. The full gauge and weary posture make the failure immediately understandable. ARIA has a separate visual presence, making the dry exchange feel like a conversation rather than invisible narration.

**Findings and changes.**

- Low: The last chart segment has an ambiguous meaning. The drawn line descends from its last point to the X. That could represent released memory after failure rather than a false measurement, but it does not clearly communicate the allocation failure while capacity is full. Proposed change: Use an interrupted trace at the capacity limit or a separate crash marker so the main failure reads without interpreting the dashed descent.
- Low: This weary pose repeats almost exactly in backpropagation. Both place Demir low left with his temple resting in one hand beside ARIA and a wall-sized display. Proposed change: Keep this first exhaustion pose, then give the later scene a different, more active form of impatience.
- High: The consequence step reuses a visibly broken state after the repair. The ending celebrates a completed read with steady memory and a small fist pump. The reused red-lamp image still shows exhaustion, full memory and a crash mark. Proposed change: Add a consequence variant with a bounded memory trace, cleared lamp and small victorious gesture. ARIA can remain deadpan, preserving the nine-second joke.

**Art direction.** Preserve the room, red lamp and visual punch line. Make the filled-memory state unambiguous and let Demir glance toward ARIA as though he has just heard her perfectly timed correction.

**Warmth and engagement.** Make the embarrassment brief and affectionate. A sideways look to the impossibly calm waveform can carry the humor without another comic prop.

**Use at the ending.** {"status": "contradiction", "observation": "The ending celebrates a completed read with steady memory and a small fist pump. The reused red-lamp image still shows exhaustion, full memory and a crash mark.", "recommendation": "Add a consequence variant with a bounded memory trace, cleared lamp and small victorious gesture. ARIA can remain deadpan, preserving the nine-second joke."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** The distinct color cue and consequences of a specific mistake justify the image.

**Additional artwork.** Add a consequence variant with a bounded memory trace, cleared lamp and small victorious gesture. ARIA can remain deadpan, preserving the nine-second joke.

### foundations/normalization

**Recommendation: refine. Priority: P2. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/foundations/normalization.webp)

[Read the lesson](../../packages/content/content/deep-orbit/foundations/05-normalization.mdx)

**What the scene needs to do.** Mirza orders comparable input scales. Farah and Demir prepare the feeds while a suspicious archived sample enters the story.

**Emotional purpose.** Collaborative problem solving that gives way to a small, intriguing exception.

**Visible evidence.** The three named humans lean or gesture toward a large horizontal display. Four input strips remain connected separately to four output strips. A gold ringed marker floats above the output area.

**What works.** The latest four-strip correction preserves separate feeds instead of visually merging them. That is an important improvement. Readable faces and the triangular grouping make the team feel engaged. The separate gold marker provides a useful mystery accent.

**Findings and changes.**

- Medium: The explicit before-and-after mapping does not clearly preserve waveform shape through scaling. The top input has a tall-pulse pattern, but its corresponding output has a different sequence of small irregular peaks. Since paired connectors invite a direct scaling comparison, this is more confusing than an unpaired atmospheric waveform. It is not a claim that the illustration must reproduce the lesson data exactly. Proposed change: Use exact scaled copies of each trace in a controlled diagram layer. Scaling can shift and resize a trace vertically, but it should preserve the sample sequence.
- Low: The anomalous sample lacks a clear link to one record. The ringed diamond hovers over a broad portion of the output bank, without a distinct selected row or position. Proposed change: Tie the marker to a clearly selected reading while keeping it separate from the feed connectors.

**Art direction.** Keep the sociable composition and Mirza’s concise direction. Make the scaled diagram trustworthy at a glance, then use a tiny pause in Farah’s stylus movement to introduce the exception.

**Warmth and engagement.** Keep the sense of the crew solving something together. Farah’s absorbed curiosity can make the anomalous marker feel like an invitation to investigate rather than a warning siren.

**Use at the ending.** {"status": "dedicated", "observation": "This lesson uses its separate normalization-epilogue illustration for the discovery.", "recommendation": "Keep the separate ending and fix its correctness-check iconography."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** This is an essential bridge from data preparation into the recurring mystery. Keep the scene.

**Additional artwork.** The existing epilogue already covers the separate discovery beat, so no additional illustration is needed here.

### foundations/normalization-epilogue

**Recommendation: refine. Priority: P1. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/foundations/normalization-epilogue.webp)

[Read the lesson](../../packages/content/content/deep-orbit/foundations/05-normalization.mdx)

**What the scene needs to do.** The scaled archive still contains sample7741. A preview classifier gives five more decisive scores and one boundary score, leaving the cause unresolved.

**Emotional purpose.** A small successful task opening into a curious question.

**Visible evidence.** Farah presents a tablet with five green checkmarked rows and one yellow highlighted row. Demir leans comfortably on the rail. A large screen repeats five simple traces and a central gauge.

**What works.** The six-row foreground composition gives this epilogue a clear focal point. The yellow final row is visible before any text is read. The crew’s warmth and casual posture are a welcome reward after the preparation work.

**Findings and changes.**

- High: Green checkmarks imply correctness that the preview has not established. The lesson explicitly says scores do not establish novelty or explain uncertainty. The tablet marks the first five rows as approved successes. Proposed change: Show position-on-scale indicators or unlabeled score bars instead of correctness checks. Reserve the gold emphasis for the unresolved selected row.
- Medium: The finished presentation is more settled than the story ending. Both characters smile while Farah points confidently at the yellow row. Neither appears to be examining a question. Proposed change: Keep the warmth, but turn their attention toward the selected record and give Farah a curious, slightly questioning brow.

**Art direction.** Preserve the approachable two-shot and tablet. Convert the screen language from five passes and one warning into six observations, one requiring another look. The highlight must not visually decide the sample’s true class.

**Warmth and engagement.** Aim for the pleasure of finding an interesting puzzle. A shared look between Farah and Demir can retain the friendly tone while keeping the answer open.

**Use at the ending.** {"status": "dedicated", "observation": "This file is a dedicated consequence illustration.", "recommendation": "Keep its separate narrative placement."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** Keep this earned epilogue. It is the first substantial visual handoff to the recurring unknown.

**Additional artwork.** No additional image is needed. This one already has the right narrative placement and manageable scope.

### neural-networks/first-neuron

**Recommendation: refine. Priority: P2. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/neural-networks/first-neuron.webp)

[Read the lesson](../../packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx)

**What the scene needs to do.** Farah starts with one weighted-sum calculation and known calibration tones before trusting anything on the unknown signal.

**Emotional purpose.** An encouraging first experiment that makes a sophisticated idea feel small enough to try.

**Visible evidence.** Farah sits at the bench, turns toward the viewer and points at three lines converging on one circular node. A waveform emerges from that node. A smooth top wave and jagged lower trace share the wall display.

**What works.** The inviting glance, seated posture and specific pointing action make Farah an approachable guide. The three-to-one structure is large and readable. The lab location and canonical portrait cues hold.

**Findings and changes.**

- Medium: The waveform output blurs one score with a sequence of scores. The central node directly emits a sine-like line, while the current exercise returns one scalar for one reading. A waveform could legitimately represent scores over multiple readings, but the image does not identify that temporal interpretation. Proposed change: End the neuron schematic in one output marker or a single score position. Keep both calibration tones in separate small input panels.
- Low: The two known tones and the stranger are not clearly separated from the computation. One of the smooth waves is visually attached to the neuron, while the jagged trace sits below it. Proposed change: Use three distinct signal cards, then connect only their extracted input features to the calculation.

**Art direction.** Keep Farah’s playful teaching pose and simple visual hierarchy. Make the distinction between a signal waveform and a scalar neuron output explicit through layout, with exact technical graphics authored outside the raster generator.

**Warmth and engagement.** Preserve the direct, knowing glance and the sense that Farah has found a wonderfully small experiment. Avoid turning it into a solemn wall lecture.

**Use at the ending.** {"status": "dedicated", "observation": "The galley image changes location and character for Nazari’s private reaction.", "recommendation": "Keep the dedicated epilogue. It is a strong example of a second image earning its place."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** The image gives the learner a friendly, concrete beginning to network construction. Keep it.

**Additional artwork.** The existing coffee-monitor epilogue supplies a distinct character payoff. A second concept illustration would be unnecessary.

### neural-networks/first-neuron-epilogue

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/neural-networks/first-neuron-epilogue.webp)

[Read the lesson](../../packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx)

**What the scene needs to do.** Nazari pauses off shift to watch the two calibration-tone outputs hold apart, then carries her coffee away while still questioning the full cost.

**Emotional purpose.** Quietly earned interest, with a restrained coffee-break joke and the first hint of trust.

**Visible evidence.** Nazari holds a plain mug under a screen showing two separate flat green traces. Hanging mugs establish the galley. Her gaze is directed to the monitor, and her expression softens without a broad grin.

**What works.** This is one of the most character-specific images in the opening modules. The mug, pause and attentive gaze tell a story without needing a complex display. The two constant output levels now match the text. The spare composition remains legible at reduced size. The warm brass lighting provides a useful rest between technical work scenes.

**Findings and changes.**

- Low: The monitor could be slightly less monumental. It occupies nearly half the frame and resembles a major installed display rather than a spare monitor above a coffee machine. Proposed change: If revisited, reduce it a little and include the edge of the coffee machine or a modest mounting bracket. Keep the same calm two-line read.

**Art direction.** Protect this scene’s restraint. The small off-duty action is the emotional point. Do not add dashboards, triumphant gestures or a large celebratory smile just to make it busier.

**Warmth and engagement.** Keep the almost-smile and reluctant extra minute of watching. The coffee ritual already supplies lighthearted personality without a gag forced into the frame.

**Use at the ending.** {"status": "dedicated", "observation": "This file is a dedicated consequence illustration.", "recommendation": "Keep its separate narrative placement."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** Do not delete. It brings variety, warmth and an earned change in Nazari’s attitude that the technical scenes cannot supply.

**Additional artwork.** No new artwork is required. This is the standard to use when deciding whether another epilogue deserves its own image.

### neural-networks/activation-functions

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/neural-networks/activation-functions.webp)

[Read the lesson](../../packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx)

**What the scene needs to do.** Nazari asks which raw score should trigger an alert. The lesson separates that rule from the hidden-layer ReLU function Farah needs next.

**Emotional purpose.** Practical skepticism with a little dry impatience, followed by an understandable distinction.

**Visible evidence.** Nazari points a multitool at one small negative bar and one larger positive bar. Demir looks up from the console. A gold wave-like glyph sits between screens, with numerous generic charts behind them.

**What works.** The raw positive and negative bars relate directly to Nazari’s opening question. The exchange has life: her pointing hand, hand-on-hip posture and his upward look provide a clear conversational rhythm.

**Findings and changes.**

- Medium: The art still frames the entire lesson around bounded output scores. The old scene brief emphasizes a sigmoid glyph. The current challenge implements ReLU for hidden layers and says alert thresholding is a separate setting. Proposed change: Retain the opening bars, but place a compact ReLU transfer sketch beside a visibly separate threshold control. Keep the distinction visually clear.
- Low: The gold emblem reads as a loose wave rather than a definite sigmoid curve. It has no axes or clear flat tails and could simply be a decorative signal badge. Proposed change: Remove that emblem or replace it with a controlled diagram that matches the intended operation.

**Art direction.** Keep the lively two-person staging. Use two clearly separated controls to give Nazari something precise to question, while the hidden-layer test becomes a small, graspable experiment.

**Warmth and engagement.** Keep the multitool pointer and Demir’s slightly sheepish attention. Make Nazari’s look a dry challenge rather than a reprimand.

**Use at the ending.** {"status": "partial", "observation": "The ending centers ARIA’s disagreement over7741 and both tones triggering the new rule. The reused Nazari-Demir bar discussion does not show that conflict, but does not depict a resolved outcome either.", "recommendation": "Use a small authored alert-list detail and an ARIA waveform beat with the epilogue. A second full bridge picture is lower priority."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** The character exchange earns a dedicated briefing image. Its technical focus needs updating, not removal.

**Additional artwork.** The epilogue’s conflicting alerts can appear in an authored interface detail. It does not require another full bridge illustration.

### neural-networks/layers-and-architecture

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: weak.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/neural-networks/layers-and-architecture.webp)

[Read the lesson](../../packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx)

**What the scene needs to do.** Nazari demands a staged network and a parameter quote after an unnecessarily large first design.

**Emotional purpose.** A practical engineering challenge with the dry humor of asking a model to earn every part.

**Visible evidence.** Nazari stands facing outward with folded arms and a multitool. Three narrowing blocks lead to a circular endpoint above her. A small ascending-bar symbol sits under the blocks, while a cabinet and many other monitors remain lit behind her.

**What works.** Nazari’s lined face and workwear are consistent. The engineering tool wall and pipes anchor the location. The large block diagram reads clearly as composition through stages.

**Findings and changes.**

- Medium: The central diagram can be read as three layers plus a fourth output stage. Three separate boxes precede a final circle, while the bridge model has two hidden layers and one output layer. Proposed change: Make the two hidden stages and output unit structurally explicit. Keep numeric counts in an authored overlay if needed.
- Medium: The parameter-budget story has become a generic crossed-arms portrait. The small bars do not communicate a quote, comparison or count. Nazari neither examines nor changes the design. Proposed change: Give her a physical parameter quote or a small comparison between the oversized rejected stack and the proposed one, with the latter clearly awaiting judgment.

**Art direction.** Move from a pose to a decision. Nazari can hold the absurdly long first quote beside a shorter revised one, with a single raised brow. Any readable numbers should be authored after generation.

**Warmth and engagement.** The discarded overlarge quote is a character-true visual joke. It makes parameter counting memorable while respecting Nazari’s concern for cost.

**Use at the ending.** {"status": "partial", "observation": "The ending pins the673-parameter quote to the engineering board. The existing folded-arms Nazari can read as waiting for proof, but the quote is absent.", "recommendation": "A physical quote artifact can make this scene work for both stages. Put the exact count and layer breakdown in authored text."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** Keep the engineering scene, but make its specific budget conflict visible. Deleting it would lose an important part of Nazari’s personality.

**Additional artwork.** The taped parameter quote can be an authored epilogue artifact rather than a second full raster scene.

### neural-networks/forward-pass

**Recommendation: refine. Priority: P2. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/neural-networks/forward-pass.webp)

[Read the lesson](../../packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx)

**What the scene needs to do.** After an embarrassing demo failure, Farah helps Demir repair the missing batch axis and rerun the model.

**Emotional purpose.** Supportive recovery and the satisfaction of locating one small, consequential mismatch.

**Visible evidence.** Demir thinks at the console with his hand under his chin. Farah stands behind him, smiling slightly with a stylus held across folded arms. A three-strand ribbon stops short of the first pipeline block, which has a red indicator.

**What works.** The gap before the first stage gives the eye a specific failure to inspect. The later blocks remain connected. Farah’s warmth prevents the failed demo from feeling punitive. Demir looks engaged rather than defeated. The cast and bridge identity are clear.

**Findings and changes.**

- Medium: The disconnected input does not yet show what is missing. The problem is a flat three-feature reading lacking its leading batch axis. The image instead suggests a physically disconnected cable or several empty ports. Proposed change: Show the same three-feature strip needing one enclosing row frame before it fits the first stage. Keep exact shape notation in the interface.
- Low: The center bridge clock has become a blank brass disc. The canonical bridge master and nearby scenes retain a functioning round clock at this position. Proposed change: Restore the established clock shell and simple hands during any future edit.
- High: The consequence step reuses a visibly broken state after the repair. The ending explicitly has Demir alone, the missing batch axis repaired and scores appearing. The reused image has Farah present and the input visibly disconnected. Proposed change: Add a matched aftermath variant with Demir alone and the input row properly enclosed and connected. Keep the scores visibly provisional rather than green approvals.

**Art direction.** Preserve the calm coaching scene. Make the mismatch a small visual puzzle the learner can recognize, with Farah inviting a second attempt rather than announcing the answer.

**Warmth and engagement.** Keep the gentle smile and the almost-solved posture. Let Demir’s slight upward glance toward Farah carry the relief of finding the bug.

**Use at the ending.** {"status": "contradiction", "observation": "The ending explicitly has Demir alone, the missing batch axis repaired and scores appearing. The reused image has Farah present and the input visibly disconnected.", "recommendation": "Add a matched aftermath variant with Demir alone and the input row properly enclosed and connected. Keep the scores visibly provisional rather than green approvals."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** The scene captures a necessary recovery beat and should remain.

**Additional artwork.** Add a matched aftermath variant with Demir alone and the input row properly enclosed and connected. Keep the scores visibly provisional rather than green approvals.

### neural-networks/building-a-network

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/neural-networks/building-a-network.webp)

[Read the lesson](../../packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx)

**What the scene needs to do.** Mirza orders the classifier assembled and configured for training by the end of watch. The result is an initialized system that still needs evidence.

**Emotional purpose.** A clear, achievable commissioning challenge and anticipation of making the pieces work together.

**Visible evidence.** A closely framed Mirza gestures outward from her chair. The foreground hologram has three input rectangles, a radial wheel of linked nodes and a radar-like output panel. Her face and blank chest chronometer are prominent.

**What works.** The corrected single-character cast and mature Mirza identity are strong. Her face stays clear at small display sizes. The open hand gives the order an inviting, purposeful tone, and the foreground task surface shares the frame with her.

**Findings and changes.**

- Medium: The dominant network icon does not clearly communicate the sequential classifier being assembled. The panel uses a radial wheel of linked nodes and a radar-like output. This may simply be a stylized network emblem, not a literal recurrent graph. It nevertheless makes the current dense-stage plan and single output score hard to recognize. Proposed change: Replace the wheel and radar with a simple input, hidden-stage and scalar-output composition that matches the bridge model. Show configuration readiness without implying learned competence.
- Low: Mirza repeats the same open-hand presentation used in the opening and normalization. Across the sequence, this makes distinct command decisions feel like the same pose with a new screen. Proposed change: Turn her gesture toward an unfinished configuration slot or the end-of-watch clock to make the deadline specific.

**Art direction.** Keep the excellent close character framing. Treat the hologram as a plan under review, with one clear remaining setup action. Use controlled diagrams rather than decorative network geometry.

**Warmth and engagement.** Give Mirza a small, confident challenge in her expression. An inviting deadline beat can feel adventurous without making her explain the model.

**Use at the ending.** {"status": "weak", "observation": "The ending changes from Mirza’s order to Farah comparing two random initializations with ARIA. Reusing Mirza beside a complete schematic misses the actual uncertainty and reproducibility beat.", "recommendation": "Prioritize an authored side-by-side run artifact showing saved initial states. If a new scene is commissioned later, use Farah removing alert colors while ARIA records the runs."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** This module-ending commission deserves artwork. Repair the technical centerpiece instead of replacing the whole character treatment.

**Additional artwork.** A separate Farah-and-ARIA score comparison could be an interface artifact in the ending. Another broad bridge meeting is unnecessary.

### training-loop/loss-functions

**Recommendation: keep. Priority: P3. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/training-loop/loss-functions.webp)

[Read the lesson](../../packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx)

**What the scene needs to do.** Farah asks how to measure the gap between a prediction and a known label so runs can be compared.

**Emotional purpose.** Attentive curiosity and the pleasure of turning a vague mistake into something inspectable.

**Visible evidence.** Farah leans toward a small instrument holding two bright points on a rail and a bracket between them. A large parabola occupies the wall above numerous other waveform and circular charts. Warm bench light separates her from the background.

**What works.** The foreground bracket makes comparison tactile and gives Farah a real action. Her engaged expression suits the lesson. The lamp and close bench activity vary the tone from the bridge command scenes. No gross anatomy or cast error is apparent.

**Findings and changes.**

- Medium: Background chart clutter weakens the simple comparison. Several unrelated waves, rings and crossing curves compete with the small two-point instrument. The image only needs one comparison and one supporting loss sketch. Proposed change: Darken or remove unrelated panels and enlarge the foreground bracket slightly.
- Low: The parabola may be read as the full loss story. The lesson compares MSE and binary cross-entropy. A single quadratic is appropriate to squared error but does not represent both objectives. Proposed change: Keep it visibly attached to the squared-error example or use a generic comparison view. Let the authored lesson explain the two losses precisely.

**Art direction.** Protect the hands-on laboratory feeling. A small exact diagram cleanup and simpler background would be enough. Keep uncertainty in the task rather than drawing a completed verdict.

**Warmth and engagement.** Keep Farah’s almost-playful concentration as she measures the gap. The brass instrument makes error measurement feel like an experiment the learner can join.

**Use at the ending.** {"status": "dedicated", "observation": "The glass-wall image changes camera position and action to record the baseline.", "recommendation": "Keep the separate epilogue and pair it with an accessible exact baseline record."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** The specific measuring action and warm lighting justify keeping this image.

**Additional artwork.** The glass-wall epilogue already gives the lesson a distinctive second visual beat. Additional art would be excessive.

### training-loop/loss-functions-epilogue

**Recommendation: keep. Priority: P3. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/training-loop/loss-functions-epilogue.webp)

[Read the lesson](../../packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx)

**What the scene needs to do.** Farah records the coin-flip loss baseline on the glass, leaving room for stronger comparisons and separate test results.

**Emotional purpose.** A modest shared milestone and a concrete promise to judge the future model honestly.

**Visible evidence.** Viewed through the lab glass, Farah holds a marker beside two equal-height bars. Demir watches with folded arms and a small smile. The warm frame and transparent pane separate the pair from the busy lab behind them.

**What works.** The reverse angle and marker action make this feel like a real end-of-watch ritual. It is a useful break from console-centered compositions. Both faces are clearly visible, and the relaxed expression makes learning feel collaborative. The equal bars provide a simple coin-flip visual shorthand.

**Findings and changes.**

- Medium: The recorded loss baseline itself is absent. Two equal bars suggest equal class probabilities, but the text’s enduring object is the written0.6931 baseline and space for a class-frequency baseline and held-out score. Proposed change: Keep the raster wordless, but pair it with a small authored baseline record beside the illustration. If revising the art, show deliberate blank spaces reserved on the glass.
- Low: The brightest background panel competes with the tiny glass marks. The large green display behind the bars makes the important new annotation less distinct. Proposed change: Lower that panel’s contrast and let the marker tip and fresh marks be the brightest local detail.

**Art direction.** Preserve this quiet, friendly scene. It should feel like a small ritual the crew will return to, not a victory announcement. Exact numbers belong in the accessible authored record.

**Warmth and engagement.** Keep the shared little smile and the satisfying act of making the first mark. Leave room on the glass for the next discovery.

**Use at the ending.** {"status": "dedicated", "observation": "This file is a dedicated consequence illustration.", "recommendation": "Keep its separate narrative placement."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** Do not delete. Its different camera angle, material gesture and shared warmth earn a separate epilogue image.

**Additional artwork.** No new bitmap is needed. An authored baseline card would complete the story meaning more accurately.

### training-loop/gradient-descent

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/training-loop/gradient-descent.webp)

[Read the lesson](../../packages/content/content/deep-orbit/training-loop/02-gradient-descent.mdx)

**What the scene needs to do.** Nazari asks which weights should change and by how much. The learner tests one gradient update before scaling to the remaining parameters.

**Emotional purpose.** Practical curiosity about a small mechanism that can do a large job.

**Visible evidence.** Nazari holds a multitool and looks toward a large bowl-shaped curve. Dots descend toward its bottom, shrinking both in spacing and visible size. Her other hand rests on her hip. The engineering tool wall fills the left background.

**What works.** The scalar descent picture matches the lesson’s simple quadratic example. The shrinking distances are readable. Nazari’s age, uniform and competence remain consistent, and the engineering location is unmistakable.

**Findings and changes.**

- Low: Shrinking marker sizes add an avoidable visual ambiguity. The dots become smaller toward the minimum. This may indicate emphasis or motion and does not prove a changing learning rate. Constant-size points would more clearly leave shrinking spacing to communicate the smaller updates. Proposed change: Keep marker size constant. Let horizontal step spacing and an optional tangent cue show why updates shrink.
- Medium: Nazari mostly poses beside the answer. The static hand-on-hip stance and already-finished descent sequence give little sense of testing a setting. Proposed change: Place her hand at one control and show a partial path, with the next move still under consideration.

**Art direction.** Turn the diagram into a small practical trial. One visible knob, one current point and a few earlier positions are enough. The lesson’s interactive trace can supply the exact calculations and alternate learning rates.

**Warmth and engagement.** Give Nazari the dry satisfaction of testing a mechanism herself. A slight raised brow toward the next point can make the math feel like a hands-on puzzle.

**Use at the ending.** {"status": "partial", "observation": "The ending adds Demir’s first update and ARIA’s unsolicited logging. Nazari beside a descent curve remains compatible, but misses the new AI behavior.", "recommendation": "Show the small unsolicited log entry in the authored epilogue. Another full engineering illustration would add less than that precise beat."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** Keep a visual setup for the scalar experiment. The pose and graphic need more purpose, not removal.

**Additional artwork.** ARIA’s unsolicited logging in the ending merits a small authored log insert or waveform beat. A new full-room illustration is not necessary.

### training-loop/backpropagation

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/training-loop/backpropagation.webp)

[Read the lesson](../../packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx)

**What the scene needs to do.** Demir is paying for a separate forward calculation for each parameter. ARIA has waited long enough to point out the efficient alternative.

**Emotional purpose.** Comic impatience at repeated work, followed by the prospect of a satisfying shortcut.

**Visible evidence.** Demir sits low left with his temple in one hand, almost repeating the data-loading pose. ARIA’s clear ring sits to the right. The wall contains dozens of fully lit miniature dashboards under a long arc, with only a small bright segment at the left.

**What works.** ARIA is clearly abstract and visually present as the second participant. Demir’s face and equipment remain recognizable. The overwhelming amount of displayed work provides a useful starting idea for the repeated-pass cost.

**Findings and changes.**

- Medium: The display does not make the slow per-parameter work legible. The cells contain unrelated waves and charts and almost all are lit. The small highlighted arc could be a progress marker, but it is unlabeled; treating it as an exact depiction of parameter 500 of 673 would overstate the evidence. The stronger issue is that neither the repetitive work nor the reason for waiting is clear. Proposed change: Replace the dashboard collage with a simple parameter-progress view consistent with the chosen moment. Show one current calculation and a long remaining or completed sequence without pretending each cell is a new plot.
- Medium: The staging repeats an earlier failure without showing Demir’s growth. The head-in-hand pose, left placement and ARIA screen echo data-loading closely. Proposed change: Have Demir turn toward ARIA with an incredulous look, finger paused over the repeated-run control. Keep visible impatience rather than defeat.

**Art direction.** Use the efficient-alternative setup as a visual joke. Simplify the work counter, retain ARIA’s calm trace, and let their contrasting reactions carry the scene. Restore a stronger engineering cue in this close crop.

**Warmth and engagement.** The best joke is ARIA watching an avoidable wait. Demir can look sideways at the waveform as though asking why she let him continue.

**Use at the ending.** {"status": "contradiction", "observation": "The ending has Nazari timing both methods after the learner has implemented the efficient one. The reused image returns to Demir looking defeated beside ARIA.", "recommendation": "Add the stopwatch epilogue scene. It changes the cast and turns the cost comparison into an earned character joke."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** Keep the briefing. It establishes the cost that makes the algorithm matter.

**Additional artwork.** Add a dedicated epilogue image of Nazari holding a stopwatch while Demir waits through the naive rerun. This changes the cast, delivers the joke and shows earned verification after the exercise.

### training-loop/training-loop

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/training-loop/training-loop.webp)

[Read the lesson](../../packages/content/content/deep-orbit/training-loop/04-training-loop.mdx)

**What the scene needs to do.** Demir lets model.fit repeat the updates, then learns to monitor validation and stop based on evidence rather than a guessed epoch budget.

**Emotional purpose.** The excitement of seeing the system learn, tempered by curiosity about whether that progress holds up.

**Visible evidence.** Demir stands with folded arms in a dark engineering bay, smiling slightly. A single smooth loss curve falls toward almost zero on the large display. Many smaller panels repeat generic charts around him.

**What works.** His calmer stance provides some progression from the earlier crashes. The darkened room gives the overnight run a distinct atmosphere. The large curve is easy to read as falling loss, and the engineering cues remain consistent.

**Findings and changes.**

- Medium: The single curve leaves out the monitoring decision central to the current lesson. The task compares training and validation histories before configuring early stopping. A single training descent is a legitimate conceptual illustration, but it does not show the disagreement or stopping question that gives this scene its meaning. Its near-zero endpoint is not treated as a fabricated measured result. Proposed change: Show separately identifiable training and validation traces. For a briefing, use an in-progress observation window rather than a completed success curve.
- Medium: The scene feels like a generic success poster. Demir’s folded arms and upward gaze do not engage with the evidence on the display. The many surrounding charts add scale but no decision. Proposed change: Give him an active comparison: checking two traces, marking a checkpoint, or catching the moment they stop improving together.

**Art direction.** Keep the nighttime satisfaction but make the monitoring decision central. Use distinct line styles as well as color, reserve exact values for the interface, and avoid drawing the same universally successful curve for every run.

**Warmth and engagement.** Show the small delight of a curve finally moving, followed by Demir noticing the second curve. A half-raised fist that pauses as he checks validation could make that tension warm and funny.

**Use at the ending.** {"status": "weak", "observation": "The ending tapes both curves above the console after validation-based stopping. The reused picture presents one clean training curve near zero.", "recommendation": "The main two-curve correction is essential. A matched completed-run screen variant or authored taped-curve artifact can handle the ending without an additional broad portrait."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** This is an important change from manual updates to a real run. Keep its illustration and correct what progress means.

**Additional artwork.** The taped pair of curves in the ending can be an authored result artifact. Another large engineering portrait would add little.

### training-loop/evaluating-deep-scan

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/training-loop/evaluating-deep-scan.webp)

[Read the lesson](../../packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx)

**What the scene needs to do.** Mirza requests results on unseen readings and evidence about mistakes before allowing a limited supervised prototype test.

**Emotional purpose.** A consequential review that still feels like an achievable next step, with curiosity about the cases the score hides.

**Visible evidence.** Mirza sits close to the viewer with a hand at her chronometer. Four equally glowing waveform panels form a two-by-two group on the foreground console, with dials around them. She looks outward rather than toward one case.

**What works.** Mirza is recognizable and mature, with an appropriately composed expression. The closer framing gives the review weight. The four-panel grouping and incoming trace leave space for a clear evaluation visual.

**Findings and changes.**

- Medium: The claimed verdict grid does not visually distinguish the four evaluation outcomes. The alt text calls this a two-by-two verdict grid, but the panels contain only waveforms. They could represent four cases rather than a literal confusion matrix. The lesson-specific distinction among detections, false alarms, calm cases and misses is therefore missing, not mathematically disproven. Proposed change: Make the display a deliberately authored category board or show a small set of reviewed cases with predicted and known status separated. Keep exact counts in the interface.
- Low: The uniform panels give little visual emphasis to uncertainty or exceptions. All panels glow equally green. Green is the general ship palette, so this does not establish that every case passed. Combined with the confident instrumentation and outward gaze, it still makes the review feel more settled than the text. Proposed change: Give one selected miss a restrained contrasting outline, and direct Mirza’s attention toward it. Do not reveal a final exercise score in the briefing.

**Art direction.** Make this a review of exceptions rather than a generic command portrait. Mirza can be calm and interested while asking for the case behind the aggregate number. Keep the current face and room.

**Warmth and engagement.** Preserve the composed warmth. Let the review feel like solving a puzzle together, and reserve Farah’s more playful, wondering curiosity for the new epilogue.

**Use at the ending.** {"status": "weak", "observation": "The ending belongs to Farah alone on the quiet bridge, recognizing7741 again. The reused image keeps Mirza and a general review console in view.", "recommendation": "Add a Farah ending scene or a close composition of her recognition and old calibration note. It should leave the cause open and feel curious rather than triumphant."}

**Small-screen read.** Static full-resolution review only. Face and primary diagram proportions informed narrow-screen recommendations; no fresh browser validation performed for this individual scene.

**Deletion decision.** The supervised-test decision needs a story image. Its missing evaluation meaning is a reason to refine it, not delete it.

**Additional artwork.** Add an epilogue close scene of Farah alone recognizing sample7741 beside her old sensor-calibration note. The current Mirza briefing cannot carry that private, curious return to the mystery.

### browser-runtimes/why-the-browser

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/browser-runtimes/why-the-browser.webp)

[Read the lesson](../../packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx)

**What the scene needs to do.** Nazari makes local browser inference a ship-availability requirement; Demir must build where the crew actually works.

**Emotional purpose.** Inviting practical challenge, with the rookie realizing that the ordinary dashboard can do consequential work.

**Visible evidence.** Demir sits at the left with a hand at his chin; Nazari stands at the right, one hand on her hip and the other indicating the dark console. Their visible faces, uniforms and ages read as the canonical pair. A small route schematic and a round waveform display establish the task without swallowing them. The empty console feels like something the learner will get to bring to life.

**What works.** Clear senior/junior relationship without faceless silhouettes. Warm brass and green light make a utilitarian bridge feel inhabitable. The large figures and single pointing gesture survive substantial downscaling.

**Findings and changes.**

- Low: The availability argument is less legible than the generic computer discussion. The distant route schematic is tiny; the pointed-at console is mostly empty. The text cares about surviving loss of the compute-bay link, not winning a latency race. Proposed change: If revisiting, give the local console an independent cached-model indicator and make the remote link visibly intermittent. Keep this schematic secondary.

**Art direction.** Retain the conversational composition and clear faces. A small, readable local-versus-remote route can sharpen the premise without turning the scene into a diagram.

**Warmth and engagement.** Give Demir a slight intrigued half-smile as he realizes the browser is the mission platform. Nazari can have dry certainty rather than a permanent reprimand.

**Use at the ending.** Acceptable reuse: the signed deployment order and console survey follow naturally from this same decision. It does not show the signature or oldest chair, but the unchanged image does not contradict them. A new epilogue is low value.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx:186](../../packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx#L186): Nazari signs the deployment order and writes 86,400 in the margin: one live dashboard reading every second, all day. The archive stores one row every 33 seconds, giving it 28,800 rows over eleven days. A server would need the link to the compute bay for every one of those 86,400 daily predictions. Each trip takes 180 milliseconds, which fits the time budget. Losing the link would stop predictions altogether. An outside download server is eleven light-minutes away.
- [packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx:192](../../packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx#L192): Demir opens a terminal and types `npm install`. The model is going to live where the crew lives. While the package downloads, he starts a survey of the ship's consoles, oldest chair first.

### browser-runtimes/tensorflow-js-setup

**Recommendation: keep. Priority: P3. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/browser-runtimes/tensorflow-js-setup.webp)

[Read the lesson](../../packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx)

**What the scene needs to do.** Demir thinks installation is routine; Nazari makes him measure which backend each actual crew console can run.

**Emotional purpose.** Affectionate professional skepticism, then earned competence.

**Visible evidence.** The seated Demir turns from three prominent benchmark bars toward Nazari, who holds her familiar multitool like a pointer. The close framing gives both faces readable reactions. The rising bars provide an immediate performance-comparison cue, and the hardware feels used rather than showroom clean. Nazari looms somewhat over him, so the scene can read as another scolding instead of a wry reality check.

**What works.** Memorable practical prop and recognizable character ages. A clear three-option comparison at image scale. The turn of Demir's head gives the conversation a small comic interruption.

**Findings and changes.**

- Low: Backend identity and device context are invisible. Three unlabeled bars communicate different speeds, but the scene cannot distinguish a fallback backend from a different station. The epilogue specifically contrasts five WebGL consoles with one WASM engineering panel. Proposed change: Use a small console/device badge beside each test and reserve exact backend names and timings for real interface text.
- Low: The same hierarchical staging repeats through the module. Nazari stands over a seated, interrupted Demir, a pattern repeated in several neighboring scenes. Proposed change: Keep her dry look but let Demir actively record the surprising result.

**Art direction.** Keep the intimate hardware-benchmark scene. Treat bars as schematic until real labels are rendered; do not encode an old 30-times claim from stale art direction.

**Warmth and engagement.** Aim for the familiar comedy of a developer saying the setup is done just before a fallback appears. A raised eyebrow and his rueful grin carry that without slapstick.

**Use at the ending.** Acceptable but incomplete reuse: the ending is a station survey and six-times comparison. The existing three-bar console scene covers the lesson, although it does not convey the six-station discovery. Reuse is preferable to another generic benchmark picture.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx:227](../../packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx#L227): Demir runs the backend check on every bridge station before he calls it done. Five consoles report `webgl`. The sixth (the engineering panel, oldest display on the ship) comes back `wasm`: 3.0 ms per matmul, compared with 0.5 on the bridge consoles.
- [packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx:230](../../packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx#L230): So the engineering chair runs that matmul six times slower than the helm. Log it. If anyone ever has to watch from that station, I want to know what they are missing and by how much.

### browser-runtimes/model-loading

**Recommendation: keep. Priority: P3. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/browser-runtimes/model-loading.webp)

[Read the lesson](../../packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx)

**What the scene needs to do.** Demir confronts a 404 and learns how a model manifest, weight shards and cached versions reach the browser.

**Emotional purpose.** An approachable debugging puzzle, followed by alertness about what actually shipped.

**Visible evidence.** Demir studies a vertical stack of monitors alone. A warning triangle above a central cube branching to smaller cubes makes the failed model-load problem immediately visible. A brass-colored secured mug and his chin-resting concentration add lived-in charm. The face is visible and youthful, with the canonical short hair and ear hardware. The tight workstation is distinct from the larger group briefings.

**What works.** Strong solo debugging identity. The manifest-and-shards visual matches the loader task conceptually. The mug gives the ship ordinary working-life warmth without hijacking the plot.

**Findings and changes.**

- Low: The error is generic rather than the specific wrong manifest URL. The large alert could mean missing weights, a bad model, or a network outage. The opening is a 404 during fetch. Proposed change: Keep the warning, but separate the manifest request from its downstream shard diagram; place the actual 404 in accessible UI text.
- Medium: Unchanged reuse misses the cache-version mistake at the ending. The epilogue compares notebook and dashboard scores from old versus new weights; the artwork still depicts a load failure at one workstation. Proposed change: A small version-comparison state or secondary paired-score panel would convey the new failure without commissioning another room scene.

**Art direction.** Preserve the solo portrait, mug and tangible console. If refreshed, make the loading stages and eventual cache version state intelligible with restrained overlays.

**Warmth and engagement.** Let Demir wear the mildly embarrassed recognition of having chased the wrong URL. His active finger finding the culprit would be livelier than another chin-rest pose.

**Use at the ending.** Weak reuse for the specific ending: a 404 and a successfully loaded stale model are different failures. Prefer a lightweight alternate display state, not a new standalone illustration.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx:300](../../packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx#L300): Farah notices that her notebook and the bridge dashboard give scores three percentage points apart for the same reading. The server received the retrained weights hours ago, but the dashboard kept loading its cached copy. Demir reused the cache key after the weights changed. For three hours and 10,800 readings, the bridge has used last week’s weights from `deep-scan-v1` in IndexedDB.
- [packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx:200](../../packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx#L200): // 'indexeddb://deep-scan-v2', and nothing reads the v1 entry after that.

### browser-runtimes/inference-pipeline

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/browser-runtimes/inference-pipeline.webp)

[Read the lesson](../../packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx)

**What the scene needs to do.** The live pipeline leaks tensors after cancellation; Demir must make preprocessing, prediction, readback and cleanup reliable before replaying the archive.

**Emotional purpose.** The satisfaction of a working instrument earned by careful debugging.

**Visible evidence.** Demir works at the left console while Nazari stands behind him with crossed arms. A central green trace ends in a bright amber point; another small status strip contains one amber event. Faces are clear and there is a friendly sense of operational success. Nothing visible suggests accumulating resources, an interrupted readback or the particular cleanup bug now driving the opening.

**What works.** The amber event makes a readable bridge-dashboard payoff. Good face visibility and credible workstation use. The image suits the eventual archive replay better than many generic technical illustrations.

**Findings and changes.**

- Medium: The briefing illustrates a later successful pipeline, not the current cancellation leak. The opening now concerns an output surviving canceled asynchronous readback; the picture shows normal monitoring and an isolated flagged event. Proposed change: At briefing, show a canceled request and a small stack of retained tensors on one relevant display, with Demir catching the growth. Keep the archive event for the consequence state.
- Low: Nazari is again a crossed-arm observer. Her posture contributes little beyond inspection already repeated in setup and later lessons. Proposed change: Have her check the stabilization log while Demir owns the fix.

**Art direction.** Retain faces and working bridge, but create two modest screen states: leak investigation and steady-count replay. Keep the technical overlay explicit enough to be educational.

**Warmth and engagement.** Make the pleasure of finally flat resource usage visible in a small shared grin. For the opening, use a recognizably absurd pile of lingering resource tiles rather than grim alarm lighting.

**Use at the ending.** Good reuse for the ending: the amber archive point evokes 7741 and the newly visible alert. The ending has Farah's reaction, however, while only Demir and Nazari are shown. Prioritize fixing briefing timing; a dedicated Farah reaction is optional.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx:335](../../packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx#L335): For a full hour after the 03:10 alert, the patched pipeline holds a steady tensor count and takes 3.4 ms per reading. Demir then replays the eleven-day archive to check for problems over a longer run, and known events light up amber.
- [packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx:337](../../packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx#L337): At 14:31 ship-time, it flags an unlabeled reading from a quiet part of the archive: sample 7741. Farah flagged it before the network existed. Now the whole crew can see it on the bridge dashboard.
- [packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx:343](../../packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx#L343): Anomaly score: 0.518. Farah routes the reading for review. The score supplies no explanation.

### browser-runtimes/onnx-runtime-web

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/browser-runtimes/onnx-runtime-web.webp)

[Read the lesson](../../packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx)

**What the scene needs to do.** The crew compares runtime choices only after checking equivalent computation; ARIA later contributes an unsolicited comparison of her own.

**Emotional purpose.** Curious engineering comparison, then a quiet personal surprise.

**Visible evidence.** A doorway frames Demir at a two-screen workstation and Nazari leaning into the comparison with her multitool. Each large screen has a waveform and round gauges. The waveforms visibly differ. This could represent different timing traces, so it is not proof of numerically inconsistent predictions, but the unlabeled display fails to make parity the prerequisite. The faces are legible; the familiar supervisor-and-junior staging is less distinctive than the lesson's actual ending.

**What works.** Paired screens communicate comparison immediately. The doorway and bench give useful room variation. Canonical faces and work clothing remain recognizable.

**Findings and changes.**

- Medium: The comparison does not distinguish equal results from different performance. The two main traces have different shapes, with no output-versus-latency separation. The source calls for the same weights and inputs before comparing speed. Proposed change: Give both screens matching prediction rows and separate timing gauges; use real labels outside the raster.
- Medium: The reused scene cannot carry ARIA's self-initiated successor remark. The ending adds a third log entry owned by ARIA while the image only shows the earlier two-person benchmark. Proposed change: Reserve a distinct quiet epilogue for Demir discovering ARIA's added entry.

**Art direction.** Make output parity visually obvious and distinguish it from timing measurements. Keep the lived-in engineering bay, but reduce secondary dials.

**Warmth and engagement.** Replace looming correction with two colleagues enjoying a surprising result. The richer delight belongs to the epilogue: Demir reading ARIA's unexpected self-description twice.

**Use at the ending.** Poor reuse: the ending turns from runtime choice to ARIA's unprompted agency. The existing busy paired-screen scene has no ARIA presence or private surprise.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** Add a quiet epilogue after the third log is discovered: Demir alone, hand paused above the keyboard, an abstract ARIA ring beside a newly appended third row. Keep the exact successor line in text, not generated lettering.

**Source anchors.**

- [packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx:226](../../packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx#L226): Nazari keeps TF.js on the consoles for this release. Demir files the ONNX export with the measurements, then finds a third entry in the log. Timestamp 0317. Owner: ARIA.
- [packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx:231](../../packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx#L231): Those timings cover different work, so they do not isolate backend cost for this 673-parameter model. I will repeat the comparison as my successor grows.
- [packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx:234](../../packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx#L234): "My successor." Demir reads the line twice. Nobody taught her to call it that.

### browser-runtimes/transformers-js

**Recommendation: refine. Priority: P2. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/browser-runtimes/transformers-js.webp)

[Read the lesson](../../packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx)

**What the scene needs to do.** Demir learns that a pretrained sentiment pipeline can handle a report-sorting task in ten lines, then realizes the unexplained signal still needs original work.

**Emotional purpose.** Comic disbelief, relief, and renewed curiosity.

**Visible evidence.** Demir opens one palm in a wonderfully readable "that is it?" gesture while holding a laptop. Nazari stands opposite with crossed arms and a restrained knowing expression. The large pipeline panel, download box and progress indicator make packaged capability plausible. Unfortunately, the dominant wall contains many waveforms, so the actual crew-report sentiment task is visually swallowed by the signal-analysis vocabulary.

**What works.** One of the strongest character exchanges in this audit. Demir's open palm is more expressive than the recurrent chin-rest pose. Clear faces and warm light invite the learner into the joke.

**Findings and changes.**

- Medium: The screen implies another signal model rather than crew-report classification. Waveforms dominate the wall; there is no legible visual distinction for report cards, sentiment outputs or the separate Sector 7-G problem. Proposed change: Replace the central diagram with a few abstract report cards flowing through the pretrained pipeline to two score groups. Keep the unfamiliar waveform on a secondary background panel.
- Low: Nazari's crossed arms are becoming a repeated default. The gesture works here as a deadpan response but recurs too often in adjacent art. Proposed change: Preserve it here, where it earns the joke, and change it in less suitable scenes.

**Art direction.** Keep the faces, palm-up exchange and comedic timing. Change the interface content to report sentiment so the joke has the correct technical object.

**Warmth and engagement.** Protect the gently insulted developer reaction and Nazari's tiny amused confidence. This is character-specific fun already working, not a scene that needs arbitrary comic props.

**Use at the ending.** Partly good reuse: Demir's disbelief fits the ten-line payoff. The ending adds Farah and the unresolved wave task; a secondary waveform can suggest the pivot without a whole new image.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx:184](../../packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx#L184): The sentiment classifier runs in ten lines, and Demir spends a full minute being quietly insulted by that. Across the lab, Farah has the Sector 7-G feed open again: the raw time-domain plot, scrolling like weather.
- [packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx:187](../../packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx#L187): Enjoy having a ready-made model for this one. We still have the signal we came here to study. Tomorrow, bring me everything you know about waves.

### signal-processing/time-vs-frequency

**Recommendation: refine. Priority: P3. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/signal-processing/time-vs-frequency.webp)

[Read the lesson](../../packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx)

**What the scene needs to do.** Farah reopens an old suspicious capture whose time-domain shape still looks like ordinary background; the pair need another view of the same data.

**Emotional purpose.** Shared curiosity and the honest pleasure of an unsolved puzzle.

**Visible evidence.** Two large lab displays show noisy slow-swelling traces. Farah explains with stylus and open hand while Demir stands at the right, hand at his chin. Both faces are clear and warmly lit, and the comparable traces make uncertainty credible. The image is pleasant and readable, but looks like a generic tutorial unless the archive-versus-live context is supplied by surrounding prose.

**What works.** The visual similarity supports the admission that time alone is not enough. Friendly two-person scientific collaboration. Large screen forms remain legible when details disappear at small sizes.

**Findings and changes.**

- Low: The returning archival clue lacks a visual anchor. No pinned older capture or visibly different archive frame ties the displayed curves to Farah's earlier suspicion. Proposed change: Add one small worn/pinned archive capture next to the current panel, keeping the actual identifier in accessible text.
- Low: Both figures default to explanation/listening. Farah points while Demir strokes his chin, a pose pair repeated in Fourier, spectrograms and later scenes. Proposed change: Have Demir actively align the two traces while Farah admits she cannot distinguish them either.

**Art direction.** Keep the similar traces and warm laboratory. Make the old clue physically persistent and let both characters inspect it instead of staging a lecture.

**Warmth and engagement.** Use mutual puzzled amusement, particularly Farah's frank admission of uncertainty. A shared small shrug would be more inviting than adding spectacle.

**Use at the ending.** Good reuse: the ending explicitly places confirmed background and the suspect trace side by side, and both characters remain unable to tell them apart. This is a justified single image across the lesson.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx:214](../../packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx#L214): Farah queues the full Sector 7-G capture for transform overnight: 64 channels, eleven days, every window of it. Before she leaves the lab she pins two time-domain plots side by side on the main display, confirmed cosmic background on the left, the stretch the crew has been arguing about for a week on the right. Demir stares until the traces blur. Sample for sample, he cannot tell them apart.
- [packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx:217](../../packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx#L217): Neither can I. That is an uncomfortable thing for a signal analyst to admit, which is why tomorrow we stop looking at time.

### signal-processing/fourier-transform

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/signal-processing/fourier-transform.webp)

[Read the lesson](../../packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx)

**What the scene needs to do.** Farah makes a composite wave understandable as familiar components; only later does an unexplained fifth peak turn the explanation into discovery.

**Emotional purpose.** Accessible scientific delight, followed by a specific investigative surprise.

**Visible evidence.** A large board on the left splits a tangled waveform into three cleaner sinusoidal traces. Farah points with visible enthusiasm; Demir smiles from his seat. Brass laboratory objects and warm light make the explanation feel tactile. This is among the most inviting images: the topic has a visible action and the characters appear to enjoy understanding it.

**What works.** Strong conceptual decomposition with an immediately readable visual hierarchy. Farah's enthusiasm and Demir's smile provide genuine warmth. No premature specific 73.4 Hz answer is printed into the briefing.

**Findings and changes.**

- Low: Demir's passive chin-rest pose repeats. He is receiving the explanation rather than testing a component himself. Proposed change: A future refinement could put his hand on a component control while Farah follows the result.
- Medium: Reusing decomposition at the ending loses the fifth-peak discovery. The epilogue specifies Farah catching Demir's wrist before he logs the result and checking an unexplained peak; none of that action is present. Proposed change: Add a distinct epilogue with the interrupted logging gesture and a correctly rendered five-peak plot.

**Art direction.** Retain this briefing. Its warmth and clear decomposition are valuable; spend new-art effort on the different discovery beat after the work is complete.

**Warmth and engagement.** Keep the shared pleasure of recognition. The epilogue can add the playful physical interruption of a hand caught just before logging, changing into concentrated wonder.

**Use at the ending.** Weak reuse: an explanatory three-wave illustration cannot convey the discovery, wrist catch, catalog checks or longer-window refinement. This is a high-value new epilogue, not decorative duplication.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** Add a post-exercise epilogue where Farah catches Demir's wrist at the log and directs him to the fifth peak. Plot the initial grid and refined measurement accurately; keep the key reveal out of the briefing.

**Source anchors.**

- [packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx:302](../../packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx#L302): Four familiar peaks appear on the lab display: 5, 12, 23 and 47 Hz. Demir reaches for the log, but Farah catches his wrist and points to a fifth peak: 73.5 Hz on the half-hertz grid, magnitude 12.0. She checks the background catalog three times. Nothing explains it.
- [packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx:302](../../packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx#L302): Four familiar peaks appear on the lab display: 5, 12, 23 and 47 Hz. Demir reaches for the log, but Farah catches his wrist and points to a fifth peak: 73.5 Hz on the half-hertz grid, magnitude 12.0. She checks the background catalog three times. Nothing explains it.
- [packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx:304](../../packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx#L304): Overnight, she reruns the capture with a window four times longer. Its 0.125 Hz grid puts the strongest bin at 73.375 Hz, displayed as 73.4 Hz.

### signal-processing/spectrograms

**Recommendation: refine. Priority: P1. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/signal-processing/spectrograms.webp)

[Read the lesson](../../packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx)

**What the scene needs to do.** Farah abandons a steady-oscillator hypothesis and asks when the suspicious tone is present; the learner constructs a time-frequency view.

**Emotional purpose.** The thrill of discovering a temporal pattern together.

**Visible evidence.** A huge green display dominates the lab. It contains tall bright vertical streaks spanning much of its height, with darker gaps between columns. Farah points into it while Demir watches with his familiar chin-rest gesture. Faces are visible and the overall image is striking, but the luminous texture reads more like repeated broadband events than an intermittent tone confined to one frequency band.

**What works.** A large, distinctive analysis surface. Good cast recognition and clear lab continuity.

**Findings and changes.**

- High: The plotted pattern contradicts the lesson's specified axes and signal. The source puts time horizontally and frequency vertically, then describes bright dashes at a fixed tone. The artwork instead has long vertical streaks spanning frequencies. Proposed change: Replace the display with a computed spectrogram: a localized horizontal frequency band appearing in separated time segments, measured background around it, and real axis labels outside the raster.
- Low: The breakthrough is acted as another lecture. Only Farah points; Demir remains passive despite the shared discovery. Proposed change: Let Demir identify the next repeated dash while Farah measures the interval.

**Art direction.** Retain the laboratory and faces, but rebuild the screen from correct data. A beautiful false plot is more harmful here than a restrained accurate one.

**Warmth and engagement.** Give both characters something to discover. Use a moment of "there it is again" with two coordinated gestures and lightly surprised expressions.

**Use at the ending.** Currently poor reuse because the ending explicitly depends on bright dashes and measured gaps. Once corrected, reuse works if the consequence adds a native measurement overlay and a small ARIA presence; no separate full-room painting is necessary.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** Prefer a consequence display state showing the interval measurement and ARIA's stored-copy request, rather than another generic lab scene.

**Source anchors.**

- [packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx:60](../../packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx#L60): Like a DevTools waterfall, this plot puts time on the horizontal axis. The vertical axis shows frequency. A waterfall bar shows an event’s duration. A spectrogram’s color shows a measured magnitude. A dark cell shows a low magnitude. It does not mean the measurement is missing.
- [packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx:274](../../packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx#L274): The spectrogram shows bright dashes: the tone switches on and off. Farah measures gaps of roughly 73.4 seconds. She writes "~73.4 s" on the board, keeping the tilde because the timing is approximate.
- [packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx:279](../../packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx#L279): No rule of mine could have produced this image. Request: store a copy of this spectrogram in my reference partition.

### signal-processing/fft-as-features

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/signal-processing/fft-as-features.webp)

[Read the lesson](../../packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx)

**What the scene needs to do.** Demir must justify extra FFT features and write an expected accuracy before spending compute; the result earns Nazari's limited approval.

**Emotional purpose.** Playful professional accountability, then restrained earned pride.

**Visible evidence.** Demir holds a large slate at the left, Nazari stands in the middle with crossed arms, and Farah points to a feature display at the right. Two large bars imply a substantial performance gain, with a strip of bins nearby. Faces are clear, but the slate looks like a generic progress indicator rather than the signed precommitment that makes this scene personal.

**What works.** Three characters have distinct task roles. The slate is a useful physical anchor for Demir's responsibility. Readable cost-versus-gain premise.

**Findings and changes.**

- Medium: The central comparison visually overstates or obscures the actual nine-point gain. Unlabeled bars appear much farther apart proportionally than 78% and 87%; without a scale this is ambiguous rather than a proven numeric error. Proposed change: Render a labeled 78-to-87 comparison with a common baseline, and show the 85 prediction as a distinct marker.
- Medium: The signed estimate and earned respect are missing. The tablet's prominent progress bar could belong to any training scene; the source keeps Demir's signed 85 beside the measured 87. Proposed change: Give the slate a real expectation/result overlay and let Demir visibly own it; soften Nazari's brow into guarded approval.

**Art direction.** Keep the three-person discussion, but prioritize expectation, measurement and the eight added FFT features over anonymous machine graphics.

**Warmth and engagement.** The fun is Demir trying not to smile while Nazari refuses applause. Capture that precise asymmetry; a generic stern boss loses it.

**Use at the ending.** Mixed reuse: the same cast fits the ending, but the unchanged stern pose and progress bar omit the 85-versus-87 payoff. A second screen/expression state would be enough.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx:85](../../packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx#L85): Eight more measurements are not free either. Increasing from three inputs to eleven means a bigger first weight matrix, more parameters, and a longer training run on my hardware. You are nearly quadrupling the input width on a hunch, Ensign. Write down the accuracy you expect before you spend the compute.
- [packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx:214](../../packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx#L214): // Enhanced model: 11 inputs to 32 to 16 to 1 (87% accuracy)
- [packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx:312](../../packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx#L312): If the nine-point gain holds across the full archive, it would mean roughly 2,600 fewer mistakes. Nazari marks the projection as provisional. The cost also depends on which mistakes disappear. Next to Demir's signed 85 she writes the actual 87 and leaves both on the board.

### signal-processing/windowing-and-overlap

**Recommendation: refine. Priority: P1. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/signal-processing/windowing-and-overlap.webp)

[Read the lesson](../../packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx)

**What the scene needs to do.** Farah diagnoses spectral leakage after an expensive false lead; applying a taper must reduce distant sidelobes without pretending to sharpen the real peak.

**Emotional purpose.** A satisfying correction, then cautious confidence in the surviving clue.

**Visible evidence.** Three crew members gather beside a very readable before-and-after display. The left plot is a broad noisy band; the right becomes a tall needle-like isolated peak. Farah gestures warmly with a tablet, Demir rests his chin, and Nazari crosses her arms. The cast is clear, but the clean visual promise is the wrong scientific promise for the source.

**What works.** The before/after layout is instantly understandable. Visible canonical faces and a warm lab maintain approachability.

**Findings and changes.**

- High: The after plot implies dramatic peak sharpening, contrary to the taught Hann tradeoff. The source explicitly says less distant leakage, broader peaks and changed magnitudes; the epilogue says a broader peak remains. The pictured needle removes that central distinction. Proposed change: Rebuild both spectra on identical axes from the lesson signal. Show lower distant sidelobes, a broader main lobe and the changed peak height; do not draw generic denoising.
- Medium: Reused group explanation loses the lesson's singular personal payoff. The ending has Farah printing her first physical copy and pinning it beside 7741, not another group presentation. Proposed change: Add that small physical epilogue after the analysis.

**Art direction.** Preserve the scene slot and visible faces; replace the technical panel accurately. For the ending, let a paper artifact carry earned meaning.

**Warmth and engagement.** The best new delight is already written: Demir notices Farah using actual paper for the first time. A tiny amused look can coexist with her concentrated scientific caution.

**Use at the ending.** Poor reuse: it repeats the initial teaching tableau and omits the pinned-paper action. Correcting the plot is essential, but a separate paper-print epilogue offers much greater narrative payoff.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** Add Farah pinning the first physical clean spectrum beside 7741, with Demir quietly amused by the paper and both plots correct. Place only after the taper result is earned.

**Source anchors.**

- [packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx:251](../../packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx#L251): "text": "Less distant spectral leakage, but broader peaks and changed magnitudes.",
- [packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx:322](../../packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx#L322): With the Hann window applied, the distant sidelobes fall close to zero. A broader peak remains near 73.4 Hz, pulsing on its 73.4-second cycle. Farah prints the clean spectrum (actual paper, the first hard copy anyone aboard has seen her make) and pins it beside sample 7741's transform.
- [packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx:322](../../packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx#L322): With the Hann window applied, the distant sidelobes fall close to zero. A broader peak remains near 73.4 Hz, pulsing on its 73.4-second cycle. Farah prints the clean spectrum (actual paper, the first hard copy anyone aboard has seen her make) and pins it beside sample 7741's transform.

### recurrent-networks/sequences-matter

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/recurrent-networks/sequences-matter.webp)

[Read the lesson](../../packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx)

**What the scene needs to do.** The existing per-reading classifier cannot notice shuffled order; Demir must see what information the current representation throws away.

**Emotional purpose.** Curiosity about a deceptively simple blind spot.

**Visible evidence.** Farah stands at a large waveform board with overlapping rectangular windows leading to a smaller target box. Demir sits nearby with a tablet and his chin in hand. The warm light and clear faces are pleasant, and the window geometry is readable. However, the same composition could introduce the later sliding-window lesson; it does not show the peculiar unchanged scores after readings are scrambled.

**What works.** A clear visual sequence and approachable laboratory. The simple frames remain readable at small sizes.

**Findings and changes.**

- Medium: The central image emphasizes window extraction instead of the order-blindness problem. Repeated overlapping boxes explain batching, while the source opening and ending hinge on the same readings reordered without changing per-reading scores. Proposed change: Show two short rows containing the same sample cards in different orders, with matching per-card scores. Keep a next-step target separate from the input window.
- Low: The characters are again teacher and passive listener. Farah points; Demir watches in the same pose as neighboring scenes. Proposed change: Have Demir actively reorder the samples while Farah watches the surprising invariant results.

**Art direction.** Make the scene a small experiment the learner wants to try, not another abstract lecture. A handful of movable sample cards will tell the exact story more clearly than many tiny traces.

**Warmth and engagement.** Use the gentle absurdity of scrambled nonsense earning identical scores. Demir can be amused first, then realize why it matters.

**Use at the ending.** Weak reuse: the ending contains a concrete solo test and two printed runs left on Farah's desk. A revised image with the two ordered/shuffled strips can support both sections without a new full scene.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx:216](../../packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx#L216): After the shift, Demir runs one more test. He feeds the classifier an hour of archived stream in order, then again with the readings shuffled into nonsense. The scores come back identical for every reading. The model scores each reading on its own, so it cannot notice the changed order.
- [packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx:222](../../packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx#L222): He prints both runs and leaves them on Farah's desk, the scrambled one on top.

### recurrent-networks/simple-rnns

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/recurrent-networks/simple-rnns.webp)

[Read the lesson](../../packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx)

**What the scene needs to do.** Demir connects a recurrent state update to a reducer, then learns that the simple recurrent model fails to carry the needed long-range training signal.

**Emotional purpose.** Hands-on recognition followed by a credible failed experiment.

**Visible evidence.** Farah leans beside seated Demir at a recurrent diagram. Three arrows appear to feed one looped cell together; three stair-like traces rise toward plateaus on the right. The close partnership and warm engineering room work, but Farah's knitted expression reads more corrective than delighted. The diagram is not clearly a sequence of updates, and the plotted rises do not match the specific small calculation used in the lesson.

**What works.** A visible feedback loop anchors the recurrence idea. Close framing gives the interaction more immediacy than distant hologram meetings.

**Findings and changes.**

- Medium: The diagram can suggest parallel inputs and monotonic accumulating state. The source processes 0.5, 0.9, 0.5 sequentially and produces 0.4621, 0.8537, 0.8284; the last result decreases slightly. The artwork shows three feeds and rising plateaus. Proposed change: Use three ordered time tiles through the same shared cell, and plot three points with the second slightly above the third. Label exact values in native text.
- Low: The expression suppresses the reducer-analogy delight. Farah appears to reprimand Demir during what is initially an accessible recognition moment. Proposed change: Give her an encouraging look and have him test the repeated input himself.

**Art direction.** Keep the intimate two-person bench scene but make time order and the third-state dip precise. Avoid decorative state curves with no source meaning.

**Warmth and engagement.** Let the familiar JavaScript analogy create a small delighted recognition. Save disappointment for the failed overnight result.

**Use at the ending.** Poor literal reuse: the ending is a failed six-hour run and Nazari's cost objection, not Farah explaining recurrence. Do not add a redundant failure painting here: the next LSTM briefing already depicts that aftermath well. A flat-loss consequence overlay is enough.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx:98](../../packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx#L98): // 0.8284: the same 0.5 that scored 0.4621 two steps ago`}
- [packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx:262](../../packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx#L262): Demir queues the run before he leaves: the simple RNN on 80-step windows, long enough to span one full pulse interval. A reducer holds state, he figures, so catching the pattern is just a matter of epochs. At 0640 he checks the log: six hours, two hundred epochs, loss pinned at 0.693 since the first hour. The predictions sit near 0.5 on both classes.
- [packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx:268](../../packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx#L268): The gradients die out around step twenty. The pattern lives at step seventy-four.

### recurrent-networks/lstm-gates

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/recurrent-networks/lstm-gates.webp)

[Read the lesson](../../packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx)

**What the scene needs to do.** The morning after a failed overnight RNN run, Farah brings a gated-memory proposal while Nazari demands an honest cost estimate.

**Emotional purpose.** Weary developer humor, practical encouragement and a way forward.

**Visible evidence.** Demir sits with a hand against his forehead. Nazari stands behind him with crossed arms, while Farah holds a tablet showing a compact gate diagram. A nearly flat loss curve on the right supplies the cause of the fatigue. All three faces are visible and distinct. This is one of the few scenes in which the repeated stern Nazari posture is specifically earned by the current story.

**What works.** Character acting communicates an actual event rather than generic teaching. The flat curve, tired Demir and proposed replacement form a coherent visual chain. Warm light keeps the failure from becoming oppressive.

**Findings and changes.**

- Low: The gate diagram is symbolic rather than a fully legible LSTM. Tiny gate boxes on the tablet cannot convey every gate and state connection at mobile scale. Proposed change: Treat it as an emblem of Farah's proposal; retain the real interactive diagram for mechanics rather than crowding this illustration.
- Medium: Reusing the failed-run mood after successful replay reverses the emotional direction. The ending reports later-day pulse recognition and ARIA's unprompted reflection; Demir remains defeated in the repeated artwork. Proposed change: Use a small later display state and relieved posture, or an ARIA-focused consequence treatment, instead of repeating the exhausted frame unchanged.

**Art direction.** Protect this briefing composition. It has specific story acting and a recognizable, humane failed-build mood.

**Warmth and engagement.** A tiny sympathetic smile from Farah and Nazari studying the cost log can make the morning-after joke land without belittling Demir.

**Use at the ending.** Emotionally poor reuse: the successful replay and ARIA reflection need a calmer, more hopeful state. An alternate display/expression treatment is preferable to another large lecture scene; a new ARIA scene is optional after higher-value additions.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx:300](../../packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx#L300): Seventy-two hours beyond the training data, the model still catches each pulse within an 80-step window. Each window starts with fresh state and keeps the trained weights. ARIA stays silent for four seconds before speaking.
- [packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx:303](../../packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx#L303): I filed this without a directive. My rule tables log every reading since launch and can act on none of it. I store everything and retain nothing of use. The new model discards most of what it sees and recognizes pulses outside its training data, three days downstream. Nothing in my tables explains why that works.

### recurrent-networks/sliding-windows

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/recurrent-networks/sliding-windows.webp)

[Read the lesson](../../packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx)

**What the scene needs to do.** A suspiciously high score reveals overlapping train/evaluation windows; Demir must split chronologically before windowing and then use a live buffer honestly.

**Emotional purpose.** An instructive debugging surprise, followed by earned operational confidence.

**Visible evidence.** Demir is alone at a large console, smiling in a three-quarter turn toward the viewer. A long waveform is covered by repeated overlapping rectangular frames, with a smaller trace below. His wrist device is unusually bright. The solo competence and warm expression are welcome variety, but there is no visible boundary separating training from evaluation, so the core leakage problem is absent.

**What works.** A rare active, cheerful solo Demir image. Overlapping windows are immediately visible. The workstation feels like a real implementation task rather than a detached concept.

**Findings and changes.**

- Medium: The image represents generic windowing rather than the current split-leakage lesson. The opening explicitly describes windowing everything first, shuffling and holding out every fifth pair; the art has one undivided stream. Proposed change: Introduce a clear chronological cut and show overlapping windows confined to either side. Let Demir notice a formerly crossing window.
- Low: His gaze bypasses the evidence. He smiles outward rather than inspecting the waveform the source says he is watching. Proposed change: Turn the eyes toward the unexpected overlap or the live buffer while preserving the approachable expression.

**Art direction.** Keep solo Demir and the friendly mood. Rebuild the main panel around split-first window creation, with a distinct live-buffer inset for the consequence.

**Warmth and engagement.** Retain the pleasure of making the system work, but make it a rueful discovery about an inflated score rather than an unexplained grin at the audience.

**Use at the ending.** Good reuse for the live-buffer ending if the split report is added beside it. The existing artwork already suits this later confidence better than the problematic-score opening.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx:61](../../packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx#L61): The first pipeline scored in the high nineties on eleven days of archive. Demir windowed the whole stream, shuffled the pairs, and held out every fifth one for evaluation. Before trusting the score, Farah asks for a 200-reading run whose training and evaluation windows they can inspect together.
- [packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx:265](../../packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx#L265): Eighty readings fill the buffer. Demir sends the first complete window to the LSTM the crew built earlier, and the dashboard shows its classification beside the signal trace. For ten minutes, it updates as each new reading arrives. Demir keeps the split report open beside it.

### recurrent-networks/sequence-prediction

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/recurrent-networks/sequence-prediction.webp)

[Read the lesson](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx)

**What the scene needs to do.** Demir and Farah move from classifying a window to forecasting future values, while keeping baselines and units in view.

**Emotional purpose.** Inviting anticipation and shared delight in a new capability.

**Visible evidence.** Farah and Demir lean toward the same luminous trace, their faces clearly visible and quietly excited. A solid historical segment gives way to a dashed future segment beyond a divider; an amber event lies ahead. Their common gaze and forward posture create more shared agency than the standard pointing lecture. Secondary panels stay behind the central act of looking ahead.

**What works.** Past versus forecast is readable without tiny lettering. The characters visibly discover something together. Clear faces, warm expressions and the future-space composition give the scene adventure.

**Findings and changes.**

- Low: The single thin future spike can imply more certainty than the learner has established. The lesson asks for baseline comparisons and careful units; the raster depicts one clean projected event. Proposed change: If the panel is revised, add a restrained uncertainty region or comparison trace in native UI, without burying the narrative image.
- Low: Tiny side-panel detail has little mobile value. Peripheral waveforms and interface marks collapse before the faces or main trace do. Proposed change: Simplify peripheral panels during any future revision.

**Art direction.** Keep the composition and shared gaze. Use the real lesson visualization to supply numerical uncertainty and baseline detail rather than overloading the artwork.

**Warmth and engagement.** Preserve the mutual lean and pleased concentration. This is the right kind of fun for prediction: the anticipation of seeing whether the world cooperates.

**Use at the ending.** Not reused as the epilogue: a distinct sequence-prediction-epilogue asset already exists and is narratively justified. Preserve that separation.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx:338](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx#L338): At 2010, the main bridge display predicts the next episode in 47 minutes. By 2050, the whole crew is watching. Between episodes, the 73-second pulses fall below the noise floor, leaving a flat trace that will make the return easy to spot.
- [packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx:340](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx#L340): Nazari turns off the room audio as the timer reaches 46:59. At 47:00 the trace is still flat, and Demir watches it hold through 47:01 and 47:02. At 47:03, the predicted spike appears.

### recurrent-networks/sequence-prediction-epilogue

**Recommendation: replace. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/recurrent-networks/sequence-prediction-epilogue.webp)

[Read the lesson](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx)

**What the scene needs to do.** The whole crew watches the forecast return three seconds late, and Mirza first calls the possible source "theirs."

**Emotional purpose.** Collective held breath, relief, wonder and a newly personal mystery.

**Visible evidence.** All four canonical faces are present around the bridge table. Mirza speaks at the left, Farah holds a tablet, Nazari carries a multitool, and Demir rests his chin at the right. Behind them, a ghosted prediction and a slightly displaced real spike plausibly show the late arrival. The dominant social action, however, is discussion with Mirza rather than everyone watching the display in silence.

**What works.** Correct full crew with visible, distinct faces and ages. The predicted/actual offset is a useful story-specific detail. A dedicated epilogue correctly protects the payoff from the briefing.

**Findings and changes.**

- Medium: Blocking misses the scene's essential shared watch. Most attention is around the table or toward Mirza; the text has everyone watching the trace, Nazari cutting room audio and a three-second wait. Proposed change: Recompose around a common screen gaze. Put Nazari's hand on the audio control, Demir leaning forward, Farah's stylus paused, and Mirza quietly reading the late arrival.
- Low: The carried multitool is an unmotivated focal prop here. It helps identify Nazari but competes with the audio-control action actually specified. Proposed change: Leave it clipped to her belt and use her hand for the written action.

**Art direction.** Keep the dedicated ending and faces, but stage the exact 47:03 moment. Use a restrained reaction ensemble, not a formal debrief.

**Warmth and engagement.** The delight is shared suspense releasing into astonishment. Demir can almost grin while Farah checks the discrepancy; Mirza's calm keeps the mystery credible.

**Use at the ending.** Dedicated epilogue, not a fallback. Replacement should keep the scene after the exercise and retain the slight prediction/arrival discrepancy.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx:340](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx#L340): Nazari turns off the room audio as the timer reaches 46:59. At 47:00 the trace is still flat, and Demir watches it hold through 47:01 and 47:02. At 47:03, the predicted spike appears.
- [packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx:340](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx#L340): Nazari turns off the room audio as the timer reaches 46:59. At 47:00 the trace is still flat, and Demir watches it hold through 47:01 and 47:02. At 47:03, the predicted spike appears.
- [packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx:346](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx#L346): It is the first time anyone on the bridge has said "theirs."

### anomaly-detection/normal-vs-anomalous

**Recommendation: keep. Priority: P3. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/anomaly-detection/normal-vs-anomalous.webp)

[Read the lesson](../../packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx)

**What the scene needs to do.** The third alert of the shift brings Nazari's frustration to the bridge; Farah needs a defensible baseline, then the learner must decide how to treat unresolved sample 7741.

**Emotional purpose.** Dry workplace humor, honest uncertainty and responsibility for a data decision.

**Visible evidence.** Nazari leans over the holographic table with an open hand; Farah sits with her stylus; Mirza watches from the raised bridge area with a patient expression. A prominent flagged trace and dimmer alternatives give the false-alert discussion an object. The readable faces and Mirza's restrained reaction create a more lived-in social scene than a row of people facing diagrams.

**What works.** Good distribution of active irritation, analysis and patient command. The layered bridge depth supports hierarchy without hiding faces. A small amount of interpersonal comedy fits the third-alert premise.

**Findings and changes.**

- Low: A large waveform excursion can overemphasize amplitude as the meaning of anomaly. The visible spike is much simpler than the module's eventual unusual combination of ordinary individual features. Proposed change: Keep it tied to this initial amplitude-baseline discussion and do not reuse it as proof of the later frequency anomaly.
- Medium: The ending shifts to Demir's unresolved training-data decision, but he is absent. The consequence keeps the original capture and awaits a documented choice about 7741. The image still shows the earlier crew alert debate. Proposed change: Use a branch-neutral decision-card overlay or alternate screen state; do not depict one user choice as already made.

**Art direction.** Retain the bridge conversation and lightly amused Mirza. Keep the ending visually neutral about whether 7741 is included or excluded.

**Warmth and engagement.** Let Nazari look tired of interruptions rather than personally hostile. Mirza's patient, nearly amused response makes the crew enjoyable without trivializing the analysis.

**Use at the ending.** Mixed reuse: the discussion context remains relevant, but the actual ending belongs to Demir and a paused data filter. A neutral capture-review panel is more useful than another whole-crew painting.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx:231](../../packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx#L231): The filter takes four seconds to turn eleven days of readings into a training set. Then it stops at one reading and waits for someone to decide.
- [packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx:237](../../packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx#L237): He saves the baseline report with the training settings. The original capture stays unchanged, so the next crew can check the reading and see why he kept or removed it.

### anomaly-detection/autoencoders

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/anomaly-detection/autoencoders.webp)

[Read the lesson](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx)

**What the scene needs to do.** Farah proposes learning normal combinations through reconstruction; the first run later demonstrates how contaminated training data can teach the unwanted signal too.

**Emotional purpose.** Curious experimentation, then humble revision rather than a miracle detector.

**Visible evidence.** Farah stands alone beside a large symmetric hourglass-like network, smiling with tablet and stylus. Several slabs narrow to two connected central circles and expand again; waveforms flank the diagram. Her lens, tied hair and adult features are recognizable, and the solo scientist is welcome cast variation. The visual is inviting but does not distinguish the mission model from the smaller exercise.

**What works.** Warm, confident solo Farah portrait. Compression and reconstruction are immediately readable. Clean foreground hierarchy is easier to scan than multi-person console scenes.

**Findings and changes.**

- Medium: The bottleneck does not match the mission architecture. The briefing's code specifies 11 to 32 to 16 to 4 and back. The artwork emphasizes two central circles, while the exercise separately uses eight input features. Proposed change: Show one four-unit latent layer and eleven feature bundles, or explicitly label a smaller explanatory excerpt in native text. Avoid serial-looking two-cell ambiguity.
- Medium: Waveform reconstruction obscures the actual eleven-feature input. The surrounding sine-like traces suggest raw time samples, but this mission autoencoder reconstructs a feature vector. Proposed change: Use paired compact feature bars as the principal input/output representation.

**Art direction.** Keep Farah's warmth and the narrowing visual, but make the diagram correspond to the specific feature model. Exact topology should be code-rendered.

**Warmth and engagement.** Farah can demonstrate the narrow bottleneck with her hands or stylus as a little practical puzzle. Keep her interested rather than presenting reconstruction as a solved triumph.

**Use at the ending.** Poor reuse for the failed contaminated run: the smiling proposal does not show the miss, row review or 0115 restart. Prefer a branch-neutral before/after training-set display state, because the written consequence varies with the learner's earlier choice.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx:97](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx#L97): // Encoder stages: 11 -> 32 -> 16 -> 4. Decoder stages: 4 -> 16 -> 32 -> 11.
- [packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx:151](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx#L151): Before the crew's next archive fit, check the screening and training workflow on a small synthetic archive. It uses eight features per reading. The mission model uses eleven. Remove flagged rows, then train on the remaining rows.
- [packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx:200](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx#L200): Nazari logs ninety minutes of training and 412 contaminated rows out of 28,800. She orders a review of the training rows containing that frequency band. Excluding those rows changes what the model learns as normal. It does not prove what caused the pattern.
- [packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx:202](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx#L202): The second run starts at 0115.

### anomaly-detection/reconstruction-error

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/anomaly-detection/reconstruction-error.webp)

[Read the lesson](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx)

**What the scene needs to do.** Demir likes the git-diff analogy; Farah insists on measuring what failed to reconstruct before deciding what the alert means.

**Emotional purpose.** Friendly intellectual friction and the pleasure of narrowing a question.

**Visible evidence.** Demir opens a palm animatedly toward Farah, who holds her stylus near her face with a concentrated, doubtful expression. The main board pairs a smooth upper sinusoid with a jagged lower trace; an adjacent bar chart singles out one large contribution. The exchange is lively and character-specific, with clear faces. The screen is less faithful: it looks like raw-wave reconstruction and has already announced a dramatic mismatch.

**What works.** Strong expressive difference between excited Demir and cautious Farah. Readable interpersonal wit without slapstick. The scene has an actual disagreement to resolve.

**Findings and changes.**

- Medium: The technical object is wrong or at least unmarked. The mission compares eleven input features with eleven reconstructed features, while the main visual uses continuous waveforms. A conceptual waveform excerpt is not identified. Proposed change: Replace the main pair with matched eleven-feature vectors, retaining a small raw capture only as context.
- Medium: The briefing visually supplies the result before Farah's requested measurement. The large mismatch and dominant error bar look conclusive, while the opening emphasizes that they do not yet know which feature failed. Proposed change: Show the comparison awaiting calculation, then reveal the dominant feature only in the dedicated epilogue.

**Art direction.** Preserve this unusually good character acting. Correct the screen representation and respect the before-measurement timing.

**Warmth and engagement.** Keep Demir's enthusiastic analogy and Farah's amused precision. Her expression can say "which feature?" without reading as displeasure with him.

**Use at the ending.** Not reused: this lesson already has a distinct epilogue for the feature result and ARIA's request. Preserve that earned reveal and avoid pre-revealing it in the briefing.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx:77](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx#L77): // It combines all eleven features into one number.
- [packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx:123](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx#L123): // This map is Farah's actual answer, and she wants it computed
- [packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx:266](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx#L266): Demir puts the error for each feature on the shared display. Almost all of it comes from fft_5, the frequency bin centered at 72 Hz, nearest to the 73.4 Hz component. The errors for fft_6 and amplitude are much smaller. The other eight are below 0.1. He is still labeling the axes when ARIA speaks up.

### anomaly-detection/reconstruction-error-epilogue

**Recommendation: refine. Priority: P2. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/anomaly-detection/reconstruction-error-epilogue.webp)

[Read the lesson](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx)

**What the scene needs to do.** Demir displays the per-feature error and ARIA asks to replay the sensor windows from her last 400 decisions.

**Emotional purpose.** Quiet surprise at an increasingly self-directed collaborator.

**Visible evidence.** Demir faces a large shared display with an open, slightly surprised gesture. An abstract green-and-brass ARIA ring occupies the right side, with no human face. The chart has roughly eight bars, one much taller than the others. This makes the human-machine exchange clear and intimate, and the strong simple silhouette of the ring reads well at small size.

**What works.** ARIA remains abstract and canonical instead of becoming a human avatar. A distinct ending gives the request emotional room. Demir's attentive reaction adds warmth and curiosity.

**Findings and changes.**

- Medium: The feature chart is ambiguous about what it includes and how it is ordered. The source lists eleven features, with fft_5 dominant, fft_6 smaller, amplitude smaller again and eight below 0.1. The image looks like an eight-bin subset with near-equal short bars. That could be an FFT excerpt, but no excerpt is identified. Proposed change: Render all eleven labeled bars, or explicitly mark an eight-FFT-feature subset and provide amplitude separately. Preserve the 64.12, 2.89 and 0.71 hierarchy; choose original order or sorted order consistently.
- Low: The queued replay is not visible. The ring could simply be speaking about the existing chart. Proposed change: A small newly queued job card in native UI can make ARIA's initiative concrete.

**Art direction.** Keep the intimate composition, abstract ARIA and surprised Demir. Rebuild the diagnostic plot from source values rather than asking a raster model to count bars.

**Warmth and engagement.** Use the small delight of ARIA asking an unexpected, useful question and Demir immediately making room for it. No exaggerated face or robot mannerism is needed.

**Use at the ending.** Dedicated epilogue. It should stay separate from the measurement-before-judgment briefing; update the plot without erasing this valuable character moment.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx:143](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx#L143): 'amplitude', 'frequency', 'phase',
- [packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx:149](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx#L149): // fft_5: 64.12: the 72 Hz-centered bin nearest the 73.4 Hz component, 90x the amplitude row
- [packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx:269](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx#L269): Request. When the pipeline is idle, replay the sensor windows attached to my last 400 decisions through the autoencoder. My rules and the new detector disagree more often. I would like the error scores beside those decisions.
- [packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx:272](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx#L272): Demir queues the job before he can think of a reason not to. It sits there at priority three, waiting.

### anomaly-detection/threshold-tuning

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/anomaly-detection/threshold-tuning.webp)

[Read the lesson](../../packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx)

**What the scene needs to do.** Twelve false alarms out of fourteen make pager workload tangible; the crew compares cutoff choices and preserves different policies for capture and waking people.

**Emotional purpose.** Practical, mildly exasperated collaboration with a satisfying reduction in needless interruptions.

**Visible evidence.** Farah and Nazari lean toward a central curve and a visibly shifted vertical cutoff. A strip of fourteen small markers contains two bright ones and twelve subdued ones. Nazari's multitool rests at the edge rather than being waved. The two-person composition is strong, but the single distribution and bright-marker row do not clearly show what is lost when the threshold rises.

**What works.** The fourteen-marker motif is unusually specific to the scene. Both women are engaged with the same object rather than posing. The cutoff is large enough to remain visible when scaled down.

**Findings and changes.**

- Medium: The display can make the higher cutoff look like a cost-free cleanup. Only one distribution is visible, with no clear anomalous readings on the wrong side of the boundary. The lesson compares false alarms and missed events, rather than optimizing silence alone. Proposed change: Use a small labeled reviewed set or overlapping distributions showing both kinds of error, with the fourteen historical alerts visibly separate from the score axis.
- Low: The serious faces suppress some of the scene's dry workplace humor. Nazari appears intensely confrontational despite a task that can be two colleagues reducing annoying pages. Proposed change: Keep her tired skepticism but let Farah invite her to try the cutoff, with a small look of recognition when the replay improves.

**Art direction.** Keep the duet and fourteen-alert visual. Clarify tradeoffs, distinguish the retrospective replay from a future guarantee, and reduce spare decorative gauges.

**Warmth and engagement.** Make this feel like fixing the alarm that keeps interrupting real work. Nazari's relief at returning to coolant inspection can provide warmth without minimizing missed-event risk.

**Use at the ending.** Good partial reuse: the fourteen-marker replay corresponds to the ending. A subtle handoff of the log to Demir would be more specific but is not worth another full scene. The following major alert should remain in the next lesson.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** No additional standalone scene is needed for this lesson.

**Source anchors.**

- [packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx:339](../../packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx#L339): Demir sets the cutoff to 1.0 before the next crew takes over. It is above every error in the normal validation readings. Nazari checks it herself by replaying last week's fourteen alerts. The twelve cosmic-background readings no longer trigger an alert. The other two still do. Both contain the signal.
- [packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx:339](../../packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx#L339): Demir sets the cutoff to 1.0 before the next crew takes over. It is above every error in the normal validation readings. Nazari checks it herself by replaying last week's fourteen alerts. The twelve cosmic-background readings no longer trigger an alert. The other two still do. Both contain the signal.
- [packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx:342](../../packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx#L342): Two alerts worth reviewing in this replay. Take the next watch's threshold log, Ensign. I have a coolant inspection to finish. Page me if the workload changes.

### anomaly-detection/the-anomaly

**Recommendation: replace. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/anomaly-detection/the-anomaly.webp)

[Read the lesson](../../packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx)

**What the scene needs to do.** The archive clue and a new capture both trigger two detectors while amplitude stays ordinary; the crew investigates before a later calibration-pattern match deepens the mystery.

**Emotional purpose.** Earned collective discovery and adventurous uncertainty, with scientific caution intact.

**Visible evidence.** All four crew faces are present on the bridge. A very thick, jagged central waveform dominates the back wall over smaller repeating traces. Mirza looks upward, Demir turns partly outward, Farah looks toward Mirza and Nazari studies a handheld device. The cast is recognizable, but their divided attention and generic giant zigzag make the image closer to another bridge meeting than the culmination of many earlier clues.

**What works.** The full crew is correctly assembled, with visible faces. Nazari's handheld check is compatible with her independent calibration work. A clear large event communicates urgency.

**Findings and changes.**

- Medium: The main signal graphic is ambiguous in a way that obscures the decisive ordinary-amplitude detail. The dominant unlabeled shape resembles an enormous raw-amplitude spike, while the source says each individual reading stays in range and the amplitude gate is quiet. It could instead be an error plot, so the image alone does not establish a false numerical result. The three glowing table circles are also unlabeled and cannot establish which checks fired. Proposed change: Make the raw amplitude visibly ordinary and place the large excursion on a clearly labeled error plot. Show two active detector indicators and one quiet amplitude check.
- Medium: Blocking and generic waveform miss both the ensemble disagreement and shared discovery. The crew look in several directions; the specific two-of-three disagreement and 7741/live comparison are not legible. Proposed change: Stage distinct roles around one investigation: Farah compares captures, Nazari checks calibration, Demir tracks the votes, and Mirza asks what the evidence permits.

**Art direction.** Rebuild this important briefing around ordinary-looking input producing two specific failed checks. Keep expressive three-quarter faces and adventurous interest, not a wall of alarm-red spectacle.

**Warmth and engagement.** Use shared wonder and lively investigation as the fun. Let Demir visibly connect the old clue to the live capture; keep Mirza composed and Farah curious. Do not turn the unresolved origin into a joke.

**Use at the ending.** Poor reuse: the ending's defining picture is two traces sitting on top of each other, ratio for ratio, after independent-machine confirmation. A single giant zigzag cannot carry the calibration-leak versus external-pattern dilemma.

**Deletion decision.** Keep the story slot. This is a used scene with a distinct narrative purpose; replacement should supersede its current file, not erase the illustrated beat.

**Additional artwork.** Add a dedicated final epilogue showing the two matching ratio patterns, with Farah and Nazari independently aligning results and the others quietly realizing the implication. Render the trace alignment accurately and retain both hypotheses; do not depict an alien or confirm intent.

**Source anchors.**

- [packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx:104](../../packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx#L104): Now the crew has two captures to compare: sample 7741 from the archive and the new live capture. Both contain the same pattern, even though each individual sensor reading stays within its usual range.
- [packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx:119](../../packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx#L119): The reconstruction error is twelve times our highest normal error. There is a 73.4 Hz component that matches no known stellar phenomenon. The LSTM's forecast error is 0.041, four times its cutoff. Two detectors flagged it. The amplitude-only check stayed quiet because the amplitude is ordinary. The other individual sensor readings are within their usual ranges too, just like 7741. We need to explain why the other checks disagree.
- [packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx:358](../../packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx#L358): Across the bridge, Nazari compares it with the frequency patterns used to calibrate the ship's sensors. The correlation is 0.9987. The signal from Sector 7-G follows the same ratios as the Archimedes' sensor calibration.
- [packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx:364](../../packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx#L364): Nobody answers her. On the main display the two traces sit one on top of the other, ratio for ratio. The question hanging over the bridge is one no model can score. Not "what is it" anymore: is it answering us?

### advanced-time-series/beyond-lstm

**Recommendation: refine. Priority: P3. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/advanced-time-series/beyond-lstm.webp)

[Read the lesson](../../packages/content/content/deep-orbit/advanced-time-series/01-beyond-lstm.mdx)

**What the scene needs to do.** An unexpectedly early pulse sends Farah and Demir back to the beginning of a long recording. They investigate whether the recurrent model retained an early precursor; the later weighting is evidence to investigate, not a causal proof.

**Emotional purpose.** Curious detective work, a small missed detail becoming interesting, and shared determination after a forecasting surprise.

**Visible evidence.** Farah occupies the near left of the lab and points her stylus at a small circled disturbance near the beginning of a long waveform. Demir leans in from the right, with a hand on the chair and his wrist display visible. Both faces are exposed and attentive, with more worry than amusement. The later pulse is conspicuously larger and is also ringed. Brass equipment, green instruments and the rear column give the lab a consistent material identity. The drawing has readable hands and no obvious extra limb. Farah retains her lens, tied hair and lab coat; Demir retains his youthful face, earpiece and slate uniform.

**What works.** The different sizes of precursor and later event make the act of looking back visible without a paragraph of explanation. The two characters look toward the evidence together, so this is a shared investigation rather than a detached diagram. Illuminated faces and close blocking work much better than silhouette crew; mature Farah and young Demir remain distinct.

**Findings and changes.**

- Low: The clue most relevant to the scene is also the smallest visual element. The first circled ripple is tiny beside the later burst and broad screen; at a narrow card width the late event wins immediately. Proposed change: Enlarge the first ripple through a modest inset or a stronger local highlight, preserving the real difference in event amplitude.
- Low: The expressions could convey more discovery and less generalized anxiety. Both brows are tense even though the action is a patient examination rather than an immediate failure. This is an interpretive tone concern, not a facial-identity error. Proposed change: Give Farah a small recognizing smile and Demir a lifted, curious brow while keeping attention on the anomaly.

**Art direction.** Preserve the composition, cast, room and two-event relation. Improve the local clue hierarchy and mutual recognition. Avoid a literal causal arrow or a solved-source expression.

**Warmth and engagement.** Make spotting the early detail feel like finding a hidden clue together. A tiny recognition exchanged between the two is enough; do not turn the missed prediction into a gag.

**Use at the ending.** {"status": "acceptable", "judgement": "The same lab investigation still suits the epilogue in which the interval changes from 73.4 to 73.1 and Farah requests timestamp checks. It does not show that numerical discovery, but reuse does not reverse the beat. A separate raster is unnecessary."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### advanced-time-series/temporal-attention

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/advanced-time-series/temporal-attention.webp)

[Read the lesson](../../packages/content/content/deep-orbit/advanced-time-series/02-temporal-attention.mdx)

**What the scene needs to do.** Demir identifies two high-attention regions separated in the recording and shares the useful time relation. The lesson subsequently exposes the cost of an undersized capture window and lost data.

**Emotional purpose.** Pleasure in noticing a pattern, followed later by a practical reminder that a clever display does not replace careful capture.

**Visible evidence.** Demir is shown alone on the right with an open, pleased expression and a pointing hand. The large central display pairs a waveform with two warm highlighted regions on a heat strip. An arch and a horizontal interval marker connect those regions. His face is bright, the earpiece and wrist unit are present, and his posture reads as discovery rather than timid obedience. The surrounding lab stays subordinate. At reduced scale the two hotspots remain much easier to read than the fine waveform details.

**What works.** This is one of the clearest positive character moments in the assigned set: Demir is allowed to enjoy understanding something. Two hotspots and a long separation express the temporal-attention idea efficiently. A solo discovery changes the rhythm from repeated mentor-and-student conversations.

**Findings and changes.**

- Low: The arch can be read as a causal connection rather than a measured separation. The large curved connector visually binds the early and late events; the lesson explicitly treats high weights as an inspection lead. No arrowhead or literal causal label is visible, so this remains an ambiguity. Proposed change: If the display is revised, use an unmistakable timeline bracket with separate hotspot markers rather than a dramatic trajectory between events.

**Art direction.** Keep the asset. Any future screen polish should preserve the spacious two-hotspot reading and Demir's independent agency.

**Warmth and engagement.** Retain the pleased recognition and confident pointing. This is a useful benchmark for lighthearted science without making the data into a joke.

**Use at the ending.** {"status": "mixed", "judgement": "The pleased briefing image is reused beside the epilogue about clipped captures and Nazari's six hours of lost work. That weakens the consequence, although it need not justify another illustration. Prefer an in-section capture-window result or a careful text placement before commissioning another scene."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

**Additional artwork.** Optional only: a compact, code-rendered comparison of a full capture and its missing tail would explain the consequence more effectively than another crew-and-waveform painting. No additional raster is a priority.

### advanced-time-series/forecasting

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/advanced-time-series/forecasting.webp)

[Read the lesson](../../packages/content/content/deep-orbit/advanced-time-series/03-forecasting.mdx)

**What the scene needs to do.** Farah distinguishes an apparent pattern from an explanation of its origin while Mirza asks what observation could distinguish possibilities. The task compares feedback rollout with replay using observed inputs; the epilogue reports another pulse arriving early.

**Emotional purpose.** Inviting speculation disciplined by curiosity, with command interested in the next observation rather than demanding certainty.

**Visible evidence.** Farah sits at the left of the holo table, smiling slightly and speaking with an open hand while her stylus follows the start of a future-looking curve. Mirza stands beyond the rail on the right, visibly attentive and warm. The display is dominated by an oscillating centerline inside a widening green fan. Faces, the chronometer, lens and uniform differences are readable. The warm lab or bridge lighting makes this a welcoming conversation instead of a threatening war-room scene.

**What works.** Farah and Mirza have a believable exchange between scientific curiosity and practical decision-making. The visible smiles and open gesture satisfy the desired approachable tone while leaving room for uncertainty. The widening fan makes the idea of an uncertain future readable immediately.

**Findings and changes.**

- Medium: The forecast fan suggests a quantified interval that this lesson does not calculate. The visibly bounded shaded cone resembles a forecast interval. The complete MDX explicitly says the MAE comparison is not an interval and that coverage requires separate held-out calibration. This is a suggestive illustration, not fabricated numeric evidence, but the visual promise is stronger than the task. Proposed change: Use distinct observed-history, feedback-rollout and observed-input replay paths, or make the alternatives visibly exploratory without a calibrated-looking envelope.
- Low: The two forecasting strategies that motivate the learner's work are absent from the image. One dominant centerline and its fan communicate generic prediction more than the contrast between using previous predictions and receiving real next observations. Proposed change: Give the two paths a clear shared starting point and different subsequent inputs without adding tiny labels to the raster.

**Art direction.** Retain both people and their readable expressions. Replace only the main conceptual screen language with two understandable future paths. Do not add a definitive destination, alien source or guaranteed confidence band.

**Warmth and engagement.** Keep the warm, interested exchange. Let Farah invite Mirza to compare two possibilities, with a playful openness to being surprised rather than a triumphant prediction.

**Use at the ending.** {"status": "mixed", "judgement": "The shared forecasting discussion can support the later early-arrival report, but the hopeful fan does not capture the shrinking gaps and Nazari's question about zero. Prefer one stronger ensemble epilogue later in this module over new art for both adjacent forecasting endings."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### advanced-time-series/kalman-filters

**Recommendation: refine. Priority: P1. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/advanced-time-series/kalman-filters.webp)

[Read the lesson](../../packages/content/content/deep-orbit/advanced-time-series/04-kalman-filters.mdx)

**What the scene needs to do.** Farah and Demir compare noisy declining interval measurements with an estimate that smooths the fluctuations but lags the drift. The exercise returns estimates and variance so that the crew can see the tradeoff rather than simply celebrate a smooth line.

**Emotional purpose.** A satisfying practical investigation, with comfort in working together and curiosity about what a smoother line can hide.

**Visible evidence.** Demir sits on the left, hand near chin and an open conversational gesture, while Farah stands or leans on the right with her stylus. Both have small smiles. Their large green chart carries a noisy descending series with dot markers and a smooth orange curve below most of that series, converging near the right. The faces are unusually friendly for a technical discussion, the lab coat, lens, earpiece and wrist unit are visible, and the instrument-filled lab remains coherent. The line relationship reads clearly even when the minor equipment does not.

**What works.** The interaction has warmth and ease; this is science as an enjoyable shared puzzle. The two differently colored traces are easy to distinguish at card size. Character ages and accessories remain consistent with the canonical portraits, without faceless dramatic lighting.

**Findings and changes.**

- High: The apparent smoother leads the falling measurements instead of showing the lag central to this lesson. The orange curve lies below the predominantly declining measured trace. The MDX explicitly describes the one-state estimate as lagging the decline; a lagging level would generally remain above later falling measurements after following that history. The picture has no legend, so the orange identity is inferred, but its smooth shape makes that reading very likely. Proposed change: Redraw the conceptual smoother so that it trails the decline above the recent measurements. A small exact excerpt can be rendered in code if it is intended as numerical evidence; the illustration itself does not need every daily sample.
- Low: A very clean smooth line may be read as recovered ground truth. The art offers only the noisy trace and a visually privileged smooth orange alternative; the lesson says the true interval is not directly observed. Proposed change: Preserve visible residual fluctuation or an estimation cue, and avoid a target/bullseye treatment that declares the orange path correct.

**Art direction.** Keep the people, room and lighting. Correct the relationship of the two traces, and let Farah point at a place where smoothness and lag disagree. Do not require generated lettering or an exact data table.

**Warmth and engagement.** Preserve both smiles. The charming moment should be noticing what the smooth line misses, not celebrating that noise has magically disappeared.

**Use at the ending.** {"status": "mixed", "judgement": "The epilogue moves to Mirza privately marking a time and ordering contingency plans. Reusing a cheerful lab discussion misses that command decision and its privacy. A new raster is defensible, but lower priority than the quantization and architecture character beats; the existing art can remain at briefing without adding another ominous bridge meeting."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

**Additional artwork.** Lower-priority epilogue option: a close view of Mirza folding the estimate printout into her jacket while Farah watches, with the written time unreadable. This would convey a private decision, not another dramatic hologram, and must not invent the time or reveal a cause.

### advanced-time-series/time-series-ensemble-methods

**Recommendation: refine. Priority: P2. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/advanced-time-series/time-series-ensemble-methods.webp)

[Read the lesson](../../packages/content/content/deep-orbit/advanced-time-series/05-ensemble-methods.mdx)

**What the scene needs to do.** Demir wants to combine three models; Farah helps him see that they must predict the same target and that shared errors survive averaging. The ending changes the emotional register when three extrapolations reach zero on different dates.

**Emotional purpose.** An enthusiastic collaborative idea, followed by intrigued uncertainty rather than a premature countdown to a known event.

**Visible evidence.** Farah at left and Demir at right face each other around a vertical display, both smiling, with Demir pointing. Four stacked panels show a smooth undulation, a jagged trace, several bell-shaped bumps, and a lower set of overlaid curves. The people are close enough for expressions to survive mobile reduction. Farah's green lens and gray coat, and Demir's earpiece and wrist terminal, are clear. The stacked screen occupies more area than the background machinery, giving this frame a legible central action.

**What works.** The exchanged smiles give Demir's proposal real enthusiasm and make Farah feel like a collaborator. A stack of contributions leading toward a result is an efficient conceptual introduction. Readable faces and an uncomplicated silhouette structure make this more engaging than a distant meeting.

**Findings and changes.**

- Medium: The visual inputs appear to be different kinds of quantity rather than three predictions of the same target. A jagged time trace, smooth wave and separate bell-shaped bumps are stacked above an output with multiple curves. The lesson stresses matching units, times and prediction targets. These are unlabeled fictional graphics, so this is a conceptual ambiguity rather than a false measured result. Proposed change: Put the three predictions on visibly comparable axes and use one clear blended result while leaving small disagreements evident.
- Low: The joyful blend scene cannot carry the full emotional turn of the ending. The epilogue is about divergent dates, an overprecise display and Demir revising the word countdown to extrapolation. None of those hesitations are visible in the happy mixing tableau. Proposed change: Keep this as the upbeat proposal; add a distinct ending only if the module receives one new scene.

**Art direction.** Preserve the warm faces and two-person composition. Make the screen's three same-target contributions and one blend more coherent without pretending the ensemble has independent evidence or guaranteed accuracy.

**Warmth and engagement.** Keep the pleasure of a good idea being improved by a colleague. Show three imperfect opinions being compared, with room for a mildly amused correction of overconfidence.

**Use at the ending.** {"status": "poor", "judgement": "Reusing this cheerful blend briefing for the zero-extrapolation epilogue flattens a real story turn. This is the strongest additional epilogue opportunity in this module, preferable to separate images for both forecasting and Kalman endings."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

**Additional artwork.** P2 new epilogue: Demir and Farah compare three extrapolations that cross a baseline at visibly different positions, with ARIA's fixed-ring waveform nearby. Demir pauses before labeling it a countdown; Farah's small, curious smile keeps uncertainty inviting. The new frame belongs after the task, never before the learner has seen the evidence. No crash, apocalypse or definitive arrival imagery.

### llm-integration/llms-for-science

**Recommendation: refine. Priority: P3. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/llm-integration/llms-for-science.webp)

[Read the lesson](../../packages/content/content/deep-orbit/llm-integration/01-llms-for-science.mdx)

**What the scene needs to do.** An exhausted crew has a report deadline, so Farah proposes using a language model for a draft while Nazari accounts for the time required to check inventions. The ending exposes a fabricated instrument claim.

**Emotional purpose.** An appealing new tool meeting dry, practical skepticism; wit comes from the difference between quick prose and slow verification.

**Visible evidence.** Farah sits left of the table with an active stylus gesture and a lively, slightly smiling face. Nazari stands at right with folded arms and a skeptical, mature expression; the olive coverall and belt tools distinguish the engineer clearly. Floating page-like panels occupy the center beneath a broad circular display, while an empty command chair and green bridge instruments fill the background. The faces remain visible and individualized. The spacious central gap helps the document motif but also makes the encounter feel more formal than the spoken bargain.

**What works.** Farah's enthusiasm and Nazari's resistance are genuinely different reactions, which creates character comedy without caricature. The page motif makes this a writing problem rather than another signal-classification display. Nazari's gray streak, weathered face and practical outfit retain the established age and role.

**Findings and changes.**

- Low: The deadline and verification-cost bargain are not made tangible. The picture has floating documents and a general ring, but no obvious ledger or action that connects Nazari's skepticism to the cost of checking them. Proposed change: Put the engineer's open ledger or a marked draft where the stylus gesture lands, making the exchange about one questionable claim.
- Low: Static folded arms could accumulate into a one-note Nazari across the sequence. This particular skeptical pose suits the opening, but similar severe engineering poses recur. The concern is the series pattern rather than an error in this frame. Proposed change: Keep the skepticism here and vary the later quantization or WebGPU reaction toward curiosity and earned respect.

**Art direction.** Keep this personality contrast and readable faces. A small shared prop or handoff will supply the missing deadline-and-review specificity; a full regeneration is unnecessary.

**Warmth and engagement.** Use the human bargain as the joke: Farah has a promising draft and Nazari already has the checking ledger ready. No eye-rolling contempt or silly hallucinated creature is needed.

**Use at the ending.** {"status": "acceptable", "judgement": "The draft-versus-skeptic pairing remains apt when the fabricated instrument appears in the epilogue. Its reuse does not falsely show a verified outcome. A separate failure illustration would overlap the much stronger existing RAG epilogue."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### llm-integration/prompt-engineering

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/llm-integration/prompt-engineering.webp)

[Read the lesson](../../packages/content/content/deep-orbit/llm-integration/02-prompt-engineering.mdx)

**What the scene needs to do.** Farah deliberately asks Demir to review her unsuccessful prompt. The learner identifies missing task, context, role and output structure, and later sees that clearer instructions still do not establish factual truth.

**Emotional purpose.** A generous reversal of expertise: the junior crewmember gets to help the scientist, making review collaborative and pleasantly human.

**Visible evidence.** Demir sits on the left with his chin near one hand, smiling up toward Farah. Farah stands on the right with a broad explanatory gesture and stylus aimed at a large board. A sparse group of panels at left connects to four orderly panels at right. Their faces and canon accessories are clearly lit. The board's simple before-and-after structure survives reduction, but the scene reads immediately as a teacher presenting to a listening student.

**What works.** The four organized components and sparse earlier draft give a useful visual before-and-after. Both people look comfortable, so review is not portrayed as humiliation. Clean anatomy, readable faces and simple board shapes give this good basic craft.

**Findings and changes.**

- Medium: The staging reverses the intended peer-review action. Farah is standing, presenting and pointing; Demir is seated and receiving the explanation. In the complete opening Farah brings her own prompt for Demir to diagnose. Proposed change: Give Demir the active annotation or pointing gesture. Farah should be listening to the correction, perhaps with a small amused acknowledgment of the omitted context.
- Medium: The composition repeats the nearby RAG teaching pose. The seated chin-in-hand Demir and standing, pointing Farah arrangement appears again in this short module. It weakens the sense of new work even when the diagrams change. Proposed change: Use a side-by-side review at a shared draft, or place Farah seated with Demir standing briefly to demonstrate the missing piece.

**Art direction.** Keep the four-part prompt comparison but change the human blocking and agency. Faces must remain visible; do not solve the repetition by turning both characters into backs or shadows.

**Warmth and engagement.** The delightful part is Farah being willing to be corrected. Show mutual amusement at a small omission and Demir's growing confidence, not the scientist giving another perfect lecture.

**Use at the ending.** {"status": "acceptable", "judgement": "A corrected collaborative-review frame also works for the later prompt iteration and remaining reliability limit. No separate ending image is needed, provided the art does not use all-green validation stamps as proof of truth."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### llm-integration/rag-for-signals

**Recommendation: refine. Priority: P2. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/llm-integration/rag-for-signals.webp)

[Read the lesson](../../packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx)

**What the scene needs to do.** The crew adds retrieval so a report starts from the right archive records. The learner must inspect match counts, truncation and generated claims; access to evidence does not force faithful generation.

**Emotional purpose.** The pleasant practicality of finding the right drawer, with a real investigative task still ahead.

**Visible evidence.** Demir sits left of the central display, chin near a hand and a friendly expression. Farah stands right with her stylus extended toward a six-row archive-like panel. Two rows are strongly highlighted and flow toward a much larger arrow and a framed output panel. The familiar lens, tied hair, young earpiece-wearing Demir and warm green-and-brass setting are all legible. The large arrow is more visually dominant than either person's interaction with the actual records.

**What works.** Retrieval before generation is visible through selected rows, a transfer direction and a distinct output area. The faces are inviting and readable, with no return to shadow figures. The briefing does not expose the later fourteen-versus-seventeen failure.

**Findings and changes.**

- Medium: The frame repeats the passive-student lesson pose instead of showing retrieval as active checking. Demir again rests his chin while Farah supplies the action, immediately after a prompt-engineering scene with almost identical roles. Proposed change: Have Demir select or compare an archive record while Farah checks its source, so each person performs a complementary part of retrieval.
- Low: The giant arrow overstates an effortless transformation from evidence to answer. The output panel follows a broad uncomplicated arrow, although the story and exercise emphasize counts, truncation and verifying the generated claim. Proposed change: Reduce the arrow and reserve a visible small check or comparison step between selected rows and the draft. Keep it diagrammatic rather than adding unreadable tiny text.

**Art direction.** Retain the clear archive-to-draft organization but rebalance visual weight toward the people choosing evidence. Avoid depicting the output as automatically approved.

**Warmth and engagement.** Make retrieval feel like finding a useful clue together. Demir can have the satisfying small discovery while Farah notices a limitation, preserving both warmth and uncertainty.

**Use at the ending.** {"status": "separate-epilogue", "judgement": "This lesson already has a dedicated consequence image. Preserve that separation because the retrieval proposal and later count mismatch are different emotional and technical beats."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### llm-integration/rag-for-signals-epilogue

**Recommendation: refine. Priority: P3. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/llm-integration/rag-for-signals-epilogue.webp)

[Read the lesson](../../packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx)

**What the scene needs to do.** The bridge demo fails when a draft reports seventeen records after retrieving fourteen. Nazari catches the discrepancy, accounts for the lost checking time and quietly acknowledges an earlier error of her own.

**Emotional purpose.** A memorable, mildly embarrassing catch that rewards checking and allows dry humor without ridiculing Demir.

**Visible evidence.** Demir sits on the left with an open, fairly cheerful face, while Nazari stands on the right pointing toward the mismatch and keeping the other hand at her hip. The top display has fourteen green marks arranged in two rows; the lower display has seventeen marks, with the extra tail picked out in warm color. The mature engineer's severe concentration contrasts with the younger crewmember's smile. The discrepancy is concrete and unusually specific compared with the collection's many generic curves.

**What works.** The visible fourteen-versus-seventeen mismatch represents the actual failure rather than a vague red warning. The extra warm-colored items help identify the problem without relying on generated lettering. A separate image after the exercise preserves the surprise and gives the checking work a consequence.

**Findings and changes.**

- Low: Demir looks more pleased than caught out. His smile reads as a successful demo while Nazari points at a demonstrably larger output count. The narrative moment is a costly correction. Proposed change: Change the smile into a sheepish dawning recognition, with a paused hand or slightly lowered shoulders. Keep the exchange kind rather than punitive.
- Low: The mismatch takes counting to decode at narrow widths. The two arrays contain many small marks and the bottom includes three extra elements. The highlighted tail helps, but the human drama is easier to read than the exact discrepancy on a phone. Proposed change: Link the matching groups or separate the three additional marks more clearly while preserving the real counts.

**Art direction.** Preserve the count comparison and cast. Adjust only expression, the pause in the action and grouping clarity. This is a useful story-specific image and should remain.

**Warmth and engagement.** A dry raised eyebrow from Nazari and Demir's small, rueful realization would make the mistake memorable and lighthearted. Do not make Nazari cruel or turn the failed claim into slapstick.

**Use at the ending.** {"status": "dedicated-ending", "judgement": "The dedicated image earns its place. It expresses a concrete post-task discovery that the friendly archive briefing cannot show."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### llm-integration/report-generation

**Recommendation: refine. Priority: P1. Story fit: weak. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/llm-integration/report-generation.webp)

[Read the lesson](../../packages/content/content/deep-orbit/llm-integration/04-report-generation.mdx)

**What the scene needs to do.** Farah breaks a long report into six reviewable sections. The release must include only approved sections; the ending sends five and explicitly withholds Hypotheses after unsupported claims are found.

**Emotional purpose.** Cozy, careful authorship and the satisfaction of a defensible report, with room for an amused skeptical look at an unearned explanation.

**Visible evidence.** Farah fills the right foreground, smiling thoughtfully with one hand at her chin and her stylus over an open notebook. A warm brass desk lamp, small scientific apparatus and a green instrument column make this one of the collection's most lived-in workspaces. The dominant screen has six section cards, each ending in a bright checkmark. Several additional checks appear in the notebook. Her face, lab coat, green lens and tied hair are clear; the image is attractive and approachable.

**What works.** The tactile notebook, lamp and small instruments give the scene warmth and a sense of someone enjoying careful work. Farah has a clear face and an individual, relaxed expression rather than generic crisis acting. Six visually distinct report sections accurately establish the structural idea.

**Findings and changes.**

- High: All six sections are visibly approved, contradicting the release decision that defines this lesson. Every large section card ends with a green check. The MDX lines 232-242 explicitly send five approved sections and withhold Hypotheses. At briefing, validation is still the work to do; at consequence, the sixth remains withheld. Proposed change: At briefing use pending review states and one actively inspected claim. If one frame must serve both locations, make the sixth visibly unresolved rather than approved; a dedicated ending could show five sent and one held.
- Medium: The completed, satisfied pose removes the question the learner is supposed to resolve. Farah appears to admire a finished all-green checklist rather than evaluate evidence. The technical issue is not whether six headings exist but which claims can be released. Proposed change: Have the stylus hover over a dubious claim or source comparison while keeping her expression warmly curious.

**Art direction.** Preserve the environment and visible portrait. Rebuild the review states so that the art never promises six approved sections. Prefer a calm active review moment over a red-alert correction.

**Warmth and engagement.** Keep the cozy desk and Farah's enjoyment. Give the charm a specific action: she spots an overconfident claim, pauses, and treats the draft as something to inspect rather than admire.

**Use at the ending.** {"status": "poor", "judgement": "The same all-approved image is wrong for both briefing and ending. One carefully designed unresolved-review image could serve both; this is a correction priority before adding another asset."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

**Additional artwork.** Optional P3 epilogue only after correcting the briefing: five document cards leave toward the relay while one remains in Farah's review tray. That is an earned omission, not a failure explosion. A new raster is not necessary if the existing frame is made appropriately unresolved.

### llm-integration/multi-model-systems

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/llm-integration/multi-model-systems.webp)

[Read the lesson](../../packages/content/content/deep-orbit/llm-integration/05-multi-model-systems.mdx)

**What the scene needs to do.** Three specialized models contribute measured results for the same capture and a reporting component can summarize them. The exercise preserves an unsupported explanation as a draft for human review while a measured alert can be sent separately.

**Emotional purpose.** Quiet ownership and satisfaction in getting several tools to cooperate, with a little nighttime solitude rather than a triumphal claim that automation understands everything.

**Visible evidence.** Demir works alone on the right in a dim bridge, chin near one hand and a small focused smile. Four glowing panels form a serial left-to-right chain containing a waveform, a compressed or hourglass-like symbol, a loop-like model symbol and a page. The scene is calm, his face remains visible, and his familiar earpiece and wrist terminal distinguish him from a generic operator. The relative quiet and independent work suit his growing competence, although the pose repeats other contemplative frames.

**What works.** The solo watch gives the sequence breathing room and grants Demir ownership. The report-page endpoint distinguishes this from a simple signal display. Dark surroundings support the late-watch mood without hiding the person.

**Findings and changes.**

- Medium: The unbroken serial chain obscures separate model inputs and the report-review gate. The illustration routes everything through one sequence of four glowing boxes. The complete lesson requires each specialized model's own input contract and separates measured alert publication from generated draft review. Proposed change: Show three model contributions from a shared capture into a measured-result area, with the draft in a separate outlined review panel. Do not imply every model consumes the prior model's output.
- Low: Another chin-in-hand pose makes independent work feel passive. Demir has the same contemplation shorthand used in prompt engineering, RAG and pruning, despite actually constructing and inspecting a pipeline. Proposed change: Give him a small active gesture selecting a gate or comparing a result, with his other hand relaxed at the console.

**Art direction.** Preserve the solo night-watch mood and readable face. Clarify branching and the pending draft; avoid a guaranteed all-green end-to-end answer.

**Warmth and engagement.** Let Demir enjoy a modest success: the measured alert arrives while the draft patiently waits its turn. The visual wit can live in this orderly separation, not in a humanized model.

**Use at the ending.** {"status": "acceptable", "judgement": "The independent-watch image can support the overnight successful measured alert, provided the generated explanation is shown waiting for review. Mirza's coffee-and-speed request is a small character beat that does not require another raster."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### optimization-edge/model-profiling

**Recommendation: keep. Priority: none. Story fit: strong. Delight: weak.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/optimization-edge/model-profiling.webp)

[Read the lesson](../../packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx)

**What the scene needs to do.** The model and telemetry workload have exceeded the bridge computer's memory, losing a capture and the relay window. Nazari and Demir inspect the failure; ARIA later salvages a small partial record without pretending the lost capture was recovered.

**Emotional purpose.** An earned sober setback and practical solidarity, with human care visible beneath the engineering work.

**Visible evidence.** Nazari stands on the left indicating a diagnostic display with a trace that drops to zero and a visibly interrupted image. Demir leans on the right-side rail, looking concerned. A red warning light and warm work lamps distinguish the incident from ordinary lab work. An ARIA waveform inside a ring remains on a nearby instrument screen. Both human faces are legible, the engineer's age and tools remain clear, and the working bay has a plausible industrial identity.

**What works.** This image depicts a concrete failure instead of relying entirely on angry expressions. The concern is earned by an unrecoverable capture and lost time, so seriousness here supports rather than violates the desired overall tone. The visible ARIA instrument quietly keeps the third participant in the room without making her humanoid.

**Findings and changes.**

- Low: The focus stays on damage rather than the working relationship that gets the crew through it. Nazari points and Demir worries; there is little visible acknowledgment between them. This is a tonal opportunity, not a reason to erase the setback. Proposed change: If revised, let Nazari angle the tablet or body toward Demir as an invitation to help, preserving seriousness without blame.

**Art direction.** Keep the failure image, its clear faces and its specific diagnostics. Retain the distinction between a stopped capture and any later partial salvage. No flames, explosions or exaggerated danger are needed.

**Warmth and engagement.** Do not paste smiles onto the lost-capture moment. Warmth here should come from shared work and a non-accusatory posture; later images should supply the release and curiosity.

**Use at the ending.** {"status": "mixed", "judgement": "Reusing the incident scene for ARIA's small salvaged-record ending misses a quiet act of care. The text can still carry it, and another ARIA ending in system architecture is the stronger single addition if scope is limited."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

**Additional artwork.** Optional secondary epilogue: a tiny recovered packet on an otherwise empty capture display beside ARIA's familiar waveform, with Demir noticing it. The fragment must remain visibly partial. Prefer the later fallback-box scene if only one ARIA character image is commissioned.

### optimization-edge/quantization

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/optimization-edge/quantization.webp)

[Read the lesson](../../packages/content/content/deep-orbit/optimization-edge/02-quantization.mdx)

**What the scene needs to do.** Nazari proposes storing weights at lower precision and asks which predictions change after decoding. The engineering load test later passes, while bridge verification remains open; then Nazari pauses to look at the raw signal and calls it patient.

**Emotional purpose.** Practical optimism, curiosity about tradeoffs, and eventually a rare, quiet moment of wonder from the skeptical engineer.

**Visible evidence.** Demir stands left with a friendly expression while Nazari occupies the center beside a large engineering display. Four stacked blocks shrink toward one, a histogram becomes coarse levels, and a row of class-like symbols sits to the right with one less prominent. Nazari's hand and tool direct attention to the graphic; the face is still severe. The ceiling and machinery take substantial space, but both people remain recognizable, properly clothed and visibly lit.

**What works.** The four-to-one storage metaphor is immediately understandable and broadly suits float32 versus uint8. Coarse levels distinguish quantization from simply deleting material. Demir brings some warmth while Nazari retains the engineer's evaluative stance.

**Findings and changes.**

- Medium: The display can imply fewer weights or a lost class instead of reduced storage precision. Four full blocks become one, and one class-like marker is dimmer. The task preserves tensor shapes and checks prediction disagreements; disagreement is not by itself accuracy loss. These are conceptual graphics, so the risk is interpretation rather than a false measurement. Proposed change: Keep equal weight counts in two matched grids with different encoding widths, and make before/after classes a pending comparison rather than a visibly discarded class.
- Low: Nazari's pose remains entirely stern at a promising experimental moment. The centered engineer has a fixed evaluative brow and hip-level stance while Demir smiles. This fits scrutiny but misses an opportunity for curiosity after the crash. Proposed change: Use a slightly raised eyebrow and a more open gesture toward the small encoded result; save full relaxation for the epilogue.

**Art direction.** Preserve the clear storage reduction concept, room and identities. Make equal parameter count and pending comparison clearer. Do not imply integer compute speed, removed model classes or completed bridge certification.

**Warmth and engagement.** The charming point is a practical engineer finding an elegant saving, then noticing the signal itself. Keep the experiment cautious but let interest appear in the face and body.

**Use at the ending.** {"status": "poor", "judgement": "The briefing's reduction diagram cannot express Nazari staying behind to watch the raw pulse and finding it patient. This is one of the strongest missing character epilogues in the assigned set."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

**Additional artwork.** P2 new epilogue: after the engineering load test, Nazari remains at the raw-signal display with the multitool set down and the ledger temporarily closed. Show a few patient pulses reflected gently in the mature face, with an almost imperceptible softening of the brow. Keep bridge verification unsigned off-screen or clearly separate. This earned, quiet discovery adds warmth without inventing a joke or a new event.

### optimization-edge/pruning

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: weak.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/optimization-edge/pruning.webp)

[Read the lesson](../../packages/content/content/deep-orbit/optimization-edge/03-pruning.mdx)

**What the scene needs to do.** Demir must review Directive 44-C before signing it. Its assumptions that small weights do nothing, dense slots can disappear, and accuracy is unchanged all need challenge; the later over-pruning experiment costs three hours.

**Emotional purpose.** The appealing moment of catching a tempting shortcut before signing, followed by honest responsibility for an experiment that goes too far.

**Visible evidence.** Demir is alone at the right foreground, with one hand at his chin and the other holding a stylus near a tablet. A very large histogram spikes around the center, and a branching tree-like structure in the upper right loses or dims branches; related branches appear on the tablet. His face is clear and thoughtful, with the correct youthful stubble, hair, earpiece and slate uniform. The engineering bay is consistent but the body language feels like contemplation rather than an active review.

**What works.** The histogram is relevant to the magnitude-based decision and creates a clear technical focus. A solo scene suits Demir being asked to exercise judgment without a mentor supplying the answer. The face remains visible and characterful despite a dim room.

**Findings and changes.**

- Medium: A shrinking branch diagram reinforces the specific tree-shaking analogy the lesson warns against. The visible tree suggests removed branches, while MDX lines 183-215 stress unstructured zeros with unchanged tensor shapes and dense storage. It is not an exact data claim, but it selects the wrong physical metaphor for the central misconception. Proposed change: Use the same rectangular weight grid before and after, with selected entries dimmed to zero but all slots retained. Add a small output disagreement cue rather than literally removing branches.
- Medium: The directive-review story is missing from the action. No clear sign-off or disputed assertion is visible; Demir simply studies generic pruning graphics in another chin-in-hand pose. Proposed change: Put a review sheet or tablet under the poised stylus, with the signature area untouched while Demir points back to the unchanged grid.

**Art direction.** Keep the independent character and industrial room but replace the tree-removal metaphor and introduce an active review gesture. Do not present sparse zeros as a guaranteed smaller dense model or the experiment as already approved.

**Warmth and engagement.** The scene can have a small, knowing pause: Demir catches that a beautifully simple proposal is missing something. A lifted eyebrow and hovering pen are more engaging than grim concentration.

**Use at the ending.** {"status": "mixed", "judgement": "The quiet review image can remain near the ending, but it does not show the three-hour cost or Nazari's ledger. Correcting the briefing misconception is more valuable than adding another cost-accounting image."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### optimization-edge/caching-strategies

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/optimization-edge/caching-strategies.webp)

[Read the lesson](../../packages/content/content/deep-orbit/optimization-edge/04-caching-strategies.mdx)

**What the scene needs to do.** Demir spots repeated work and proposes caching, then has to correct an inflated timing claim and design keys, versions and expiry carefully. The later private ARIA log distinguishes performance evidence from model quality.

**Emotional purpose.** A relaxed, clever-seeming shortcut that invites the learner to inspect the catch; playful confidence without claiming that reuse solves every problem.

**Visible evidence.** Demir reclines at the left of a warm console alcove holding a steaming mug. His expression is lightly amused and comfortable, and his bright face, earpiece and wrist display remain recognizable. Two large monitors repeat the same waveform, with one region highlighted. Smaller gauges and bars sit below. The mug, chair and asymmetric pose give the room the feeling of a place where someone actually spends a watch, rather than a stage built solely for a lecture.

**What works.** This is the strongest lighthearted break in the assigned optimization sequence. Repeated waveforms communicate repeated work quickly without exact timing claims. A relaxed human habit gives Demir personality and contrasts well with the preceding failure and review scenes. The composition remains readable at small scale because the mug, face and duplicated screens have simple silhouettes.

**Findings and changes.**

- Low: The comfortable pose could be read as a completed performance victory before the measurements are corrected. Demir is already reclining, and the lower instrument bars imply activity without clarifying what has been measured. No literal number proves a false gain, so this is only a timing ambiguity. Proposed change: Keep the expression closer to a promising idea than a victory grin, and preserve the lesson's correction immediately beside the artwork.

**Art direction.** Retain this asset as a tonal anchor. If diagrams are touched later, show repeated captures finding the same cached entry while keeping expiry and version checks pending; do not clutter the relaxed scene.

**Warmth and engagement.** Keep the mug, warmth and small amused smile. They make a technical optimization feel like a human discovery. The narrative can gently puncture the first timing assumption without punishing the character.

**Use at the ending.** {"status": "acceptable", "judgement": "The quiet late-watch setting can also accompany ARIA's private log. It is not a literal illustration of that text, but it does not contradict it and provides welcome breathing room. No new scene is necessary."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### optimization-edge/webgpu-acceleration

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/optimization-edge/webgpu-acceleration.webp)

[Read the lesson](../../packages/content/content/deep-orbit/optimization-edge/05-webgpu-acceleration.mdx)

**What the scene needs to do.** The crew tries the actual available backend and measures completed inference rather than trusting queued work or guaranteed GPU speed. A later successful rehearsal earns Nazari's respect and a rare closure of the ledger.

**Emotional purpose.** Energetic practical experimentation, followed by earned shared satisfaction and growing trust.

**Visible evidence.** Nazari stands left and Demir right with open conversational gestures and more animated faces than in the crash scene. A large central hologram transforms triangular geometry into a square compute grid, with a falling step-like chart above it. A tool touches the table area at the lower left with small yellow spark-like marks nearby. The two visible faces and the broad shared gesture make this feel lively; the engineering room remains grounded in pipes, rails and machinery.

**What works.** The reciprocal gestures create genuine conversation instead of another one-way instruction pose. Demir's smile and Nazari's engaged expression let the relationship progress toward respect. Large grid shapes remain legible and produce an energetic composition.

**Findings and changes.**

- Medium: The descending chart implies a speed result before a benchmark establishes one. The curve visibly falls alongside the GPU-like transition. The lesson makes backend availability, completed readback and measured performance conditional. The art has no exact number, but its success coding is premature at briefing. Proposed change: Show two comparable workload paths awaiting completed timing, or keep the curve neutral until the actual rehearsal outcome.
- Low: The geometry transformation and tool sparks can suggest hardware repair rather than selecting and measuring a runtime backend. Triangles turn into squares while a tool makes yellow motion or spark marks on the console. Neither physical conversion nor a repair is the lesson's work. Proposed change: Use a clear workload-to-compute-grid comparison and set the tool down; let Nazari's gesture communicate lively skepticism instead of unexplained sparks.

**Art direction.** Preserve the warmth, faces and bilateral movement. Clarify a fair pending comparison for briefing; avoid a promised speedup, destructive spark or hardware transformation.

**Warmth and engagement.** Keep the animated exchange and let the eventual good result earn a restrained shared smile. Nazari can be pleasantly surprised without becoming exuberant or abandoning standards.

**Use at the ending.** {"status": "acceptable", "judgement": "The upbeat exchange is especially suitable for the later successful rehearsal and earned praise. If the briefing is made less conclusive, the same frame can serve both with no separate epilogue needed."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### capstone/system-architecture

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/capstone/system-architecture.webp)

[Read the lesson](../../packages/content/content/deep-orbit/capstone/01-system-architecture.mdx)

**What the scene needs to do.** Mirza asks the crew to assemble the mission system, and Demir now explains the architecture. The learner builds a linear runner while the full manifest still requires branches. After the briefing ARIA notices the small rule-based fallback box reserved for her.

**Emotional purpose.** Confident synthesis and a sense of having grown into the work, followed by affectionate, dry ambiguity around ARIA's smaller role.

**Visible evidence.** Mirza stands at the left behind the rail, open hand directed toward Demir, who stands right and actively points at the central diagram. Five tower-like boxes and repeated chevrons form a serial progression. Both faces are clear; Mirza looks attentive and authoritative without being severe, and Demir stands as an owner of the work. The central arrangement resembles a row of physical computer towers rather than software stages sharing a constrained bridge target.

**What works.** The role progression is visible: Mirza listens while Demir explains. Open gestures and a warm command expression make culmination feel encouraging. The image avoids the repeated seated-student pose and keeps both identities clear.

**Findings and changes.**

- Medium: The five physical-looking towers imply a different deployment architecture. Repeated server-like housings and chevrons read as several machines, while the lesson is constrained by one bridge console and distinguishes a simple chain from the full branching manifest. Proposed change: Draw logical software stages on one console, with the classifier/anomaly branch and report join visible, and clearly separate the linear runner excerpt.
- Low: The architecture lacks the small fallback that carries the ending's emotional point. The five large stages occupy the center; no small, legible secondary ARIA path is apparent. The epilogue specifically turns on the smaller box. Proposed change: Reserve a modest secondary path in the architecture, then emphasize it only in the epilogue rather than explaining the whole joke in the briefing.

**Art direction.** Preserve the two-person command briefing and visible faces. Replace machine-like towers with honest logical stages and a branch/join. Keep ARIA's fallback secondary so the ending still has something to notice.

**Warmth and engagement.** Keep Demir's confidence and Mirza's interested listening. The distinctive lighthearted beat is the tiny but deliberately retained ARIA box, treated with affection and restraint rather than a cartoon face.

**Use at the ending.** {"status": "poor", "judgement": "The bright Mirza-and-Demir briefing is reused after Mirza and Nazari have left and ARIA privately examines the fallback box. It misses both the changed cast and the quiet emotional focus. This is a high-value selective new epilogue."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

**Additional artwork.** P2 new epilogue: the bridge after the briefing, the large architecture still visible but composed around one small fallback box and ARIA's canonical fixed-ring waveform. The people who have left must remain absent. A warm pool of light and a small pause in the waveform can make her dry line, still a box, feel gently funny and touching without inventing eyes or a humanoid body.

### capstone/ci-cd-pipeline

**Recommendation: refine. Priority: P2. Story fit: weak. Delight: weak.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/capstone/ci-cd-pipeline.webp)

[Read the lesson](../../packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx)

**What the scene needs to do.** Nazari discovers that green checks described the old model while the deployment manifest points to a newer artifact. The release-ID join has dropped identity, so the learner must bind evaluations to the exact bytes independently of quality gates.

**Emotional purpose.** An alert detective catch and the satisfying realization that a green status needs a precise object, not generalized dread of deployment.

**Visible evidence.** Nazari is prominent near the center, leaning into the investigation with a tool or hand near her chin. Demir stands behind to the left, arms folded and mostly listening. The top-right display contains many green checked nodes arranged in rows that merge into a large storage cylinder. The engineer's mature face is clearly rendered, the gray streak and olive workwear remain consistent, and the bay is visually coherent. The dominant message at a glance is a completed, approved pipeline into storage.

**What works.** Nazari actively investigates instead of simply scolding, which suits her competence. The many green checks establish the deceptive premise that the dashboard appears healthy. Readable expressions and a close engineer foreground give this more human focus than an abstract CI chart.

**Findings and changes.**

- Medium: The image omits the artifact mismatch that makes the apparently green pipeline dangerous. Every visible branch converges cleanly into one object. No second artifact, broken identity association or mismatched fingerprint is apparent, although that is the opening problem and the purpose of the task. Proposed change: Show two distinct artifact-pattern swatches: the checked evaluation belongs to one while the manifest selects the other. Keep the checks green; the problem is their association, not failed tests.
- Medium: The human interaction is static at a moment that could reward recognition. Demir folds his arms behind the engineer while Nazari studies the screen. The picture lacks the instant of one person noticing what the other missed. Proposed change: Have Demir point to the mismatched artifact marker as Nazari pauses with an acknowledging raised eyebrow, keeping her the rigorous reviewer.

**Art direction.** Retain the green-check premise and Nazari's central competence. Add the two-artifact comparison and a clear wrong association. Do not replace the story with a generic red failure banner or imply hashes measure prediction quality.

**Warmth and engagement.** Make the mismatch a small visual detective joke: all the green checks are real, but their luggage tag belongs to the other case. Use actual artifact swatches rather than literal cartoon luggage if that would leave the established world.

**Use at the ending.** {"status": "mixed", "judgement": "The initial green pipeline can be reused after the identity gate is corrected only if the artifact binding is made visible. Once the screen communicates that distinction, another triumphant green-check epilogue would be redundant."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### capstone/monitoring

**Recommendation: replace. Priority: P2. Story fit: weak. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/capstone/monitoring.webp)

[Read the lesson](../../packages/content/content/deep-orbit/capstone/03-monitoring.mdx)

**What the scene needs to do.** Demir instruments the deployed model and distinguishes observable score, latency and input-distribution changes from accuracy, which needs labels. The later monitoring catch connects a changed frequency feature to the larger mystery without identifying its cause.

**Emotional purpose.** Hands-on curiosity and attentiveness to a living system, with the pleasure of noticing something worth investigating.

**Visible evidence.** Demir fills the left foreground physically plugging or holding several thick cables into a beige port box. His concentrated face, earpiece and wrist terminal are brightly visible. Behind him are declining and rising traces, offset distribution curves and several waveform panels. ARIA is correctly represented on the right as a waveform in a brass ring. The engineering bay is convincing and the hands are purposeful, but the literal cable work dominates every other element.

**What works.** The close active pose is a valuable compositional change from people standing around a hologram. ARIA's non-humanoid presence and the layered monitoring panels place the system in an inhabited room. Demir is readable, capable and visibly working rather than silhouetted.

**Findings and changes.**

- Medium: The main action turns software instrumentation into a hardware cabling job. Both foreground hands attend physical connectors, and the largest object is the port box. The full lesson concerns collecting and interpreting model-monitoring metrics; no rewiring event motivates the scene. Proposed change: Replace the central action with Demir attaching a software probe, aligning live monitoring panels, or comparing a changed trace through a handheld diagnostic. Keep the active close framing.
- Medium: The panels look like simultaneous broad degradation rather than a focused monitoring question. A falling curve, rising band and shifted distributions all compete behind the cable work. The ending reports a specific feature change with classifier confidence still high; monitoring does not directly reveal live accuracy. Proposed change: Choose one primary changed input feature and one stable contextual metric. Do not label a score or drift trace as accuracy without outcomes.

**Art direction.** Regenerate the focal action with the canonical Demir and ARIA reference, maintaining the industrial room and bright face. Use software observation as the visible task; no real-world cable repair. A compact curious expression is better than a crisis grimace.

**Warmth and engagement.** The fun should come from Demir catching an unexpected detail and exchanging a questioning glance with ARIA's impassive waveform. Preserve tactile activity through a diagnostic device rather than making the character immobile at a desk.

**Use at the ending.** {"status": "poor", "judgement": "The cable-plugging image cannot express the later frequency discovery and shared monitoring interpretation. A corrected primary scene that centers a changed trace could serve both; fix this before considering a separate ending."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### capstone/documentation

**Recommendation: refine. Priority: P3. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/capstone/documentation.webp)

[Read the lesson](../../packages/content/content/deep-orbit/capstone/04-documentation.mdx)

**What the scene needs to do.** Farah asks whether someone else could operate the system while Demir is off watch. The model card and runbook must preserve evidence and clear thresholds; ARIA later exposes an imprecise word with dry literalism.

**Emotional purpose.** The satisfying handover of hard-won knowledge and friendly scrutiny from colleagues who expect the work to be usable.

**Visible evidence.** Demir sits on the left writing among several open paper binders. Farah stands on the right holding her stylus, arms partly folded, smiling while he looks toward her. The visible pages contain structured diagrams and flowchart-like blocks, and a lighter board behind them displays document cards and scientific imagery. The tactile paper, clear faces and warm light make the work inviting. Demir still has the familiar young features and devices; Farah retains the lens and scientist silhouette.

**What works.** The binders and paper give the late course a grounded change from large floating green screens. Both people look comfortable, making documentation feel like shared craft rather than administrative punishment. The handover theme is plausible even without legible prose on every page.

**Findings and changes.**

- Low: The blocking still casts Farah as supervising a pupil rather than testing a colleague's handover. Farah stands over seated, writing Demir while he seeks her attention. By this point his arc is ownership, and the opening question is whether another operator can use the documentation. Proposed change: Let Farah actually follow an open runbook step herself while Demir waits beside her, relaxed enough to let the document carry the explanation.
- Low: The central action is generic writing rather than use by a new operator. Several binders communicate documentation volume but do not show a threshold or operating decision being located. Proposed change: Give one clear page or flowchart prominence and direct Farah's stylus to the decision she needs to find.

**Art direction.** Keep the paper-based composition and bright faces. Reassign the action so Farah tests and Demir supports. Do not add reams of generated pseudo-text or imply a pretty binder proves complete documentation.

**Warmth and engagement.** Preserve the warm, tactile workbench feeling. The small delight is watching someone else successfully use what Demir wrote, followed by ARIA's precise objection to a vague word.

**Use at the ending.** {"status": "acceptable", "judgement": "The collaborative document review can also support ARIA's request for a precise threshold. A dedicated ARIA proofreading image would duplicate the stronger architecture fallback opportunity, so do not add one by default."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### capstone/launch

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/capstone/launch.webp)

[Read the lesson](../../packages/content/content/deep-orbit/capstone/05-launch.mdx)

**What the scene needs to do.** Mirza authorizes the launch after the crew's accumulated checks. The recorded release uses one console as a hot canary, compares thirty verdicts with the shadow model and expands only after that check; alternative policies are simulations, not additional deployments.

**Emotional purpose.** Earned anticipation and trust at the threshold of a real result, with a spark of adventure instead of another grim command meeting.

**Visible evidence.** Nazari stands at the left rail, Mirza is central behind the command chair, and Demir is at the right console with a finger at a green deploy control. A large glowing dome of pulse rings and an arc occupies the middle of the bridge. All three faces are exposed and distinct. Demir has a slight smile, Nazari remains severe, and Mirza looks or gestures away from the immediate button action. The central chair and broad hologram consume space that could connect the three people more directly.

**What works.** The canonical cast and readable faces make the launch a crew event, not an anonymous hand pressing a button. Demir visibly owns the final console action, which pays off his growth. The pulse ring gives the scene a live window and anticipatory energy without revealing the final harmonic match.

**Findings and changes.**

- Medium: The shared decision is weakened by disconnected gaze and gesture. Mirza's hand points away from Demir's console and the three figures do not converge clearly on one final check. The empty central chair and dome compete with the actual human handover. Proposed change: Bring Mirza's attention to Demir and the small canary console; give Nazari a restrained acknowledging look or ready rollback hand rather than another fixed scowl.
- Low: The button contact looks like execution while the alternate text describes a hovering hand. Demir's fingertip appears at the control rather than distinctly paused above it. The source opens with authorization, so this is not a major plot contradiction, but the intended anticipatory moment is less clear. Proposed change: Choose one clear instant: fingertip visibly hovering during the decision, or an unmistakable one-console canary activation after authorization.
- Low: The canary scope is not visually distinguishable from a fleet-wide launch. The surrounding green bridge equipment and giant global-looking pulse dome do not isolate one test console. Proposed change: Highlight one console or one small deployment tile while the remaining stations keep a different neutral state; avoid implying that all consoles changed at once.

**Art direction.** Retain the three canonical people, pulse-window motif and bridge. Tighten blocking around the one-console canary. Preserve a visible pause and no spoilers about the source, ratios or final log.

**Warmth and engagement.** Give the crew a small shared ready moment: Demir's confident breath, Mirza's warm authorization and Nazari's minimal nod. This is earned optimism after work, not confetti or a premature celebration.

**Use at the ending.** {"status": "separate-epilogue", "judgement": "A separate finale image already exists and is necessary. The launch authorization and the unexplained matching harmonics should remain visually distinct."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

### capstone/launch-epilogue

**Recommendation: refine. Priority: P1. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/scenes/deep-orbit/capstone/launch-epilogue.webp)

[Read the lesson](../../packages/content/content/deep-orbit/capstone/05-launch.mdx)

**What the scene needs to do.** The crew sees the incoming signal match the Archimedes' own calibration harmonics. Nazari rechecks the log, Farah considers possibilities, ARIA states the timing contradiction and her own anomaly, and Mirza orders transmission. The source remains unexplained and the final operator_note:none must remain the last narrative beat.

**Emotional purpose.** Wonder shared by people the learner now knows, with warmth and a troubling unanswered question. This is an earned serious reveal, not a horror tableau or an alien-contact confirmation.

**Visible evidence.** Farah sits at left looking up with an open, curious face. Mirza stands centrally with an open palm, Nazari concentrates on a tablet in front, and Demir turns from the right console with a small smile. Several wall displays repeat smooth sine-like curves; another shows a rising correlation-like curve. At far right, ARIA's screen contains a multi-lobed green spirograph with no horizontal waveform or fixed brass ring. Large empty foreground chair backs occupy much of the lower image. The four human identities are recognizable and individually expressive, but the ensemble attention is scattered.

**What works.** All four human characters finally share a frame with readable faces and distinct reactions. Nazari checking the tablet is an excellent literal match to the repeated calibration check. Farah's curiosity and Demir's gentle smile retain humanity rather than turning the finale into grim horror.

**Findings and changes.**

- High: ARIA loses her established visual identity at the moment her own experience matters most. The far-right display is an oscillating multi-lobed loop. In the canonical design and the monitoring frame, ARIA is a waveform held inside a fixed geometric or brass ring. Proposed change: Restore the approved fixed-ring waveform instrument, with a subtly unusual waveform if the story requires her elevated reconstruction error. Do not add eyes, a mouth or a human avatar.
- Medium: Repeated generic sine waves do not communicate the specific matching-harmonics discovery. The wall repeats smooth curves, but there is no clear pair showing received sequence versus ship calibration, nor a visual reason for Nazari's incredulity. The picture should remain conceptual, yet the matching relationship is the reveal's core. Proposed change: Give one paired comparison of the same distinctive sub-pulse pattern priority, linked to a ship-calibration cue and a separate received-signal cue. Keep the origin unresolved and avoid invented numerical precision.
- Medium: The composition dilutes the shared moment with foreground furniture and disconnected eyelines. Two large empty chair backs fill the bottom, while the crew look toward different off-frame targets and the generic wall charts dominate the upper half. Proposed change: Move closer to the people and one shared comparison, keeping Nazari's tablet check as a counterpoint. Let Farah and Demir exchange a small astonished recognition while Mirza takes in the evidence.

**Art direction.** First retain the recognizable four-person cast and Nazari's excellent calibration recheck. Correct the right-side ARIA screen to the fixed-ring waveform and give one paired received-signal/ship-calibration pattern priority. A tighter crop and modest gaze adjustments can reduce the empty-chair foreground. These targeted edits solve the hard identity defect without requiring a new composition. Recompose only if the shared discovery still reads weakly after those changes. Preserve the bright green-and-brass bridge, distinct reactions and unresolved origin. Do not depict an alien, a faster-than-light reply, an identified source, a catastrophe, or anything after the final automated log line.

**Warmth and engagement.** Build around delighted, questioning awe rather than four frightened faces. Nazari can retain the serious recheck; Farah and Demir can share the thrill of an impossible-looking pattern; Mirza's calm keeps the crew together.

**Use at the ending.** {"status": "dedicated-ending", "judgement": "Keep this dedicated ending image and its useful four-person cast. The required correction is ARIA's canonical identity; stronger paired-harmonics emphasis and a tighter human focus are creative refinements. A full replacement is optional only if those targeted edits cannot establish the shared discovery. Do not add a coda after the story's last line."}

**Deletion decision.** Do not delete this shipped story slot. Its narrative function is useful; any replaced file should be retired only after its replacement is wired and verified.

**Additional artwork.** No additional post-finale artwork. Improve this existing ending slot first. A full recomposition is an optional art-direction escalation, not technically required to fix ARIA. Any subsequent celebration, empty-ship aftermath or resolved-source image would risk overriding the final operator_note:none and the intentionally unanswered story.

## Every supporting asset

### portrait/commander-mirza

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/commander-mirza.webp)

**What the scene needs to do.** Calm authority before a question or decision.

**Visible evidence.** Direct open eyes, a small relaxed mouth, silver temples, facial lines, brass piping and a blank chest chronometer stay clearly identifiable.

**What works.** The default expression is welcoming enough for a light adventure while preserving seniority.

**Art direction.** Keep the neutral. Let warmer story moments use the existing approving state instead of redrawing the character.

**Warmth and engagement.** Keep the neutral. Let warmer story moments use the existing approving state instead of redrawing the character.

**Authored dialogue usage:** 8 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/commander-mirza-resolved

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/commander-mirza-resolved.webp)

**What the scene needs to do.** A decision made with steady authority.

**Visible evidence.** The mouth is firmer and the upper lids lower slightly than neutral. Head, hair, age marks, jacket and clock remain stable.

**What works.** The restrained change avoids turning command into anger.

**Findings and changes.**

- Low: The state is very close to neutral, particularly at a 56px dialogue size. The mouth is firmer and the upper lids lower slightly than neutral. Head, hair, age marks, jacket and clock remain stable. Proposed change: If expression clarity needs another pass, strengthen the direct gaze and jaw very slightly in the existing frame. Check the change at 56px before accepting it.

**Art direction.** If expression clarity needs another pass, strengthen the direct gaze and jaw very slightly in the existing frame. Check the change at 56px before accepting it.

**Warmth and engagement.** If expression clarity needs another pass, strengthen the direct gaze and jaw very slightly in the existing frame. Check the change at 56px before accepting it.

**Authored dialogue usage:** 7 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/commander-mirza-concerned

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/commander-mirza-concerned.webp)

**What the scene needs to do.** A leader weighs an unresolved risk.

**Visible evidence.** Lowered gaze and gently knitted inner brows create quiet concern without tears or panic. The clock and silver temples match neutral.

**What works.** The concern feels adult and measured, useful beside uncertain model evidence.

**Art direction.** Keep for an earned doubtful decision. Do not force it into every warning or use alarm to make routine work entertaining.

**Warmth and engagement.** Keep for an earned doubtful decision. Do not force it into every warning or use alarm to make routine work entertaining.

**Authored dialogue usage:** 0 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/commander-mirza-approving

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/commander-mirza-approving.webp)

**What the scene needs to do.** Small, earned recognition from the commander.

**Visible evidence.** The mouth corners lift, eyes soften, and the chin stays level. No props or age markers visibly change.

**What works.** This is a useful source of warmth that remains true to Mirza.

**Art direction.** Use this existing state at an actual recognition beat. Her approval can carry the lightness without a broad celebratory grin.

**Warmth and engagement.** Use this existing state at an actual recognition beat. Her approval can carry the lightness without a broad celebratory grin.

**Authored dialogue usage:** 0 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/dr-farah

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/dr-farah.webp)

**What the scene needs to do.** Interested, trustworthy scientific guide.

**Visible evidence.** The AR lens, tied loose hair, slate lab layer and lanyard are consistent. A slight smile and open eyes make her approachable.

**What works.** The visible lens gives a clear identity cue and the face invites curiosity.

**Art direction.** Keep. In scenes, make her physically engaged with a particular odd result so the inviting face does not become a generic lecturer pose.

**Warmth and engagement.** Keep. In scenes, make her physically engaged with a particular odd result so the inviting face does not become a generic lecturer pose.

**Authored dialogue usage:** 49 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/dr-farah-absorbed

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/dr-farah-absorbed.webp)

**What the scene needs to do.** Thoughtful absorption while an explanation takes shape.

**Visible evidence.** Her eyes turn slightly aside and the lips stay calm. Face shape, lens and clothes closely match the default portrait.

**What works.** The state now conveys thought rather than sadness.

**Findings and changes.**

- Low: The gaze shift is so slight that neutral and absorbed can be hard to distinguish at dialogue size. Her eyes turn slightly aside and the lips stay calm. Face shape, lens and clothes closely match the default portrait. Proposed change: A slightly clearer sideways gaze or asymmetric thoughtful brow could improve the small-size read. Preserve adult proportions and the quiet tone.

**Art direction.** A slightly clearer sideways gaze or asymmetric thoughtful brow could improve the small-size read. Preserve adult proportions and the quiet tone.

**Warmth and engagement.** A slightly clearer sideways gaze or asymmetric thoughtful brow could improve the small-size read. Preserve adult proportions and the quiet tone.

**Authored dialogue usage:** 5 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/dr-farah-delighted

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/dr-farah-delighted.webp)

**What the scene needs to do.** The pleasure of understanding a real discovery.

**Visible evidence.** Lifted brows, bright eyes and an open smile form a distinct state while the AR lens and mature face remain recognizable.

**What works.** This is one of the most immediately readable and enjoyable expressions in the set.

**Art direction.** Keep and use selectively after a genuine click. This is a better source of fun than adding arbitrary jokes or a mascot.

**Warmth and engagement.** Keep and use selectively after a genuine click. This is a better source of fun than adding arbitrary jokes or a mascot.

**Authored dialogue usage:** 1 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/dr-farah-shaken

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/dr-farah-shaken.webp)

**What the scene needs to do.** A rare finding unsettles her trust in a method.

**Visible evidence.** Raised inner brows and a slightly parted mouth communicate surprise and concern. The head, hair and lens remain fixed.

**What works.** It preserves vulnerability without cartoon panic or tears.

**Art direction.** Keep as a reserved story state. Give it a specific unsettling discovery, with no pressure to increase its usage merely because the file exists.

**Warmth and engagement.** Keep as a reserved story state. Give it a specific unsettling discovery, with no pressure to increase its usage merely because the file exists.

**Authored dialogue usage:** 0 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/chief-nazari

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/chief-nazari.webp)

**What the scene needs to do.** Competent evaluation with guarded trust.

**Visible evidence.** Set brows, mature lines, gray-streaked hair and the olive coverall create a stable, distinct identity. The closed mouth is severe.

**What works.** The default carries her caution and experience without losing facial clarity.

**Art direction.** Keep the portrait. Reduce reliance on this severe expression during friendly exchanges by selecting the existing skeptical or grudging-respect state when the writing earns it.

**Warmth and engagement.** Keep the portrait. Reduce reliance on this severe expression during friendly exchanges by selecting the existing skeptical or grudging-respect state when the writing earns it.

**Authored dialogue usage:** 26 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/chief-nazari-skeptical

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/chief-nazari-skeptical.webp)

**What the scene needs to do.** A precise, dry reaction to an overconfident claim.

**Visible evidence.** One eyebrow rises while the mouth stays mostly level. Age lines, gray hair and coverall are preserved.

**What works.** The asymmetry is expressive enough to carry deadpan humor without making her a clown.

**Art direction.** Keep. A raised brow paired with Demir noticing his mistake can supply an enjoyable scene reaction without belittling the learner.

**Warmth and engagement.** Keep. A raised brow paired with Demir noticing his mistake can supply an enjoyable scene reaction without belittling the learner.

**Authored dialogue usage:** 15 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/chief-nazari-grudging-respect

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/chief-nazari-grudging-respect.webp)

**What the scene needs to do.** Approval earned by evidence.

**Visible evidence.** Her eyes soften and the mouth barely lifts. The same lined face and gray hair survive the expression change.

**What works.** The small change suits a character whose warmth grows slowly.

**Art direction.** Keep. Use the restrained approval as a payoff after a verified result or practical care from another crew member, not a universal success badge.

**Warmth and engagement.** Keep. Use the restrained approval as a payoff after a verified result or practical care from another crew member, not a universal success badge.

**Authored dialogue usage:** 4 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/chief-nazari-haunted

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/chief-nazari-haunted.webp)

**What the scene needs to do.** A brief memory of the Vanguard loss.

**Visible evidence.** The gaze shifts away and inner brows lift slightly. She looks distracted and vulnerable, with mature facial detail intact.

**What works.** The state leaves room for serious emotion without melodrama.

**Art direction.** Keep. This beat needs quiet rather than a joke. Place warmth around it through another character giving her space, never through a gag about the loss.

**Warmth and engagement.** Keep. This beat needs quiet rather than a joke. Place warmth around it through another character giving her space, never through a gag about the loss.

**Authored dialogue usage:** 1 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/ensign-demir

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/ensign-demir.webp)

**What the scene needs to do.** An engaged, approachable learner counterpart.

**Visible evidence.** Wide alert eyes, light stubble, tousled hair, a visible comms earpiece and slate uniform establish him quickly.

**What works.** The slight smile and imperfect hair support a friendly adventure tone.

**Art direction.** Keep. Let posture and task-specific props show his growth across scenes, since this neutral portrait intentionally sits between uncertainty and confidence.

**Warmth and engagement.** Keep. Let posture and task-specific props show his growth across scenes, since this neutral portrait intentionally sits between uncertainty and confidence.

**Authored dialogue usage:** 34 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/ensign-demir-overwhelmed

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/ensign-demir-overwhelmed.webp)

**What the scene needs to do.** A recoverable moment of confusion.

**Visible evidence.** Brows tilt upward and the mouth opens slightly. The earpiece and facial proportions stay aligned with neutral.

**What works.** The expression reads immediately while leaving him capable and human.

**Art direction.** Keep for an occasional mismatch or surprising output. Let the next action show him investigating rather than making him the permanent butt of a joke.

**Warmth and engagement.** Keep for an occasional mismatch or surprising output. Let the next action show him investigating rather than making him the permanent butt of a joke.

**Authored dialogue usage:** 0 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/ensign-demir-breakthrough

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/ensign-demir-breakthrough.webp)

**What the scene needs to do.** The moment a concept clicks.

**Visible evidence.** The open grin, raised brows and bright gaze clearly separate this from the other states. Stubble and uniform remain stable.

**What works.** It has real charm and supplies a visually legible payoff.

**Art direction.** Keep. Reserve the grin for earned understanding and pair it with the actual thing he has just noticed.

**Warmth and engagement.** Keep. Reserve the grin for earned understanding and pair it with the actual thing he has just noticed.

**Authored dialogue usage:** 4 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/ensign-demir-focused

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/ensign-demir-focused.webp)

**What the scene needs to do.** Late-course calm competence.

**Visible evidence.** Lowered lids and level brows give concentration without the old angry scowl. The mouth stays closed and the head remains level.

**What works.** This supports his growth from novice to a dependable operator.

**Art direction.** Keep. Use relaxed shoulders and a purposeful hand action in late-course scenes so focus still feels inviting. Competence can be enjoyable without a grin.

**Warmth and engagement.** Keep. Use relaxed shoulders and a purposeful hand action in late-course scenes so focus still feels inviting. Competence can be enjoyable without a grin.

**Authored dialogue usage:** 1 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/aria

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/aria.webp)

**What the scene needs to do.** ARIA at rest while providing precise guidance.

**Visible evidence.** A rounded ripple sits on a horizontal baseline. The shared shell has multiple brass rings, dense ticks, diagonal facets and a bright green lower rim.

**What works.** All four states now retain exactly one instrument identity and never suggest a human face.

**Findings and changes.**

- Low: The shell is more ornate and gold-dominant than the bible's thin, restrained voice-orb. At small size, ring texture competes with the trace. A rounded ripple sits on a horizontal baseline. The shared shell has multiple brass rings, dense ticks, diagonal facets and a bright green lower rim. Proposed change: Keep this as the default calm trace. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Art direction.** Keep this as the default calm trace. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Warmth and engagement.** Keep this as the default calm trace. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Authored dialogue usage:** 15 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/aria-emphasis

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/aria-emphasis.webp)

**What the scene needs to do.** A concise interruption or exact point.

**Visible evidence.** One sharp up-and-down spike interrupts the baseline. The shared shell has multiple brass rings, dense ticks, diagonal facets and a bright green lower rim.

**What works.** All four states now retain exactly one instrument identity and never suggest a human face.

**Findings and changes.**

- Low: The shell is more ornate and gold-dominant than the bible's thin, restrained voice-orb. At small size, ring texture competes with the trace. One sharp up-and-down spike interrupts the baseline. The shared shell has multiple brass rings, dense ticks, diagonal facets and a bright green lower rim. Proposed change: Use the spike sparingly as the visual equivalent of a dry correction. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Art direction.** Use the spike sparingly as the visual equivalent of a dry correction. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Warmth and engagement.** Use the spike sparingly as the visual equivalent of a dry correction. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Authored dialogue usage:** 1 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/aria-deadpan

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/aria-deadpan.webp)

**What the scene needs to do.** ARIA delivers a dry, certain observation.

**Visible evidence.** A flat green horizontal trace sits in the same ring. The shared shell has multiple brass rings, dense ticks, diagonal facets and a bright green lower rim.

**What works.** All four states now retain exactly one instrument identity and never suggest a human face.

**Findings and changes.**

- Low: The shell is more ornate and gold-dominant than the bible's thin, restrained voice-orb. At small size, ring texture competes with the trace. A flat green horizontal trace sits in the same ring. The shared shell has multiple brass rings, dense ticks, diagonal facets and a bright green lower rim. Proposed change: The flat trace already carries visual wit. Keep its deadpan simplicity. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Art direction.** The flat trace already carries visual wit. Keep its deadpan simplicity. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Warmth and engagement.** The flat trace already carries visual wit. Keep its deadpan simplicity. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Authored dialogue usage:** 5 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### portrait/aria-alarm

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/characters/deep-orbit/aria-alarm.webp)

**What the scene needs to do.** A rare urgent state or unstable signal.

**Visible evidence.** Many tight irregular peaks fill the central band. The shared shell has multiple brass rings, dense ticks, diagonal facets and a bright green lower rim.

**What works.** All four states now retain exactly one instrument identity and never suggest a human face.

**Findings and changes.**

- Low: The shell is more ornate and gold-dominant than the bible's thin, restrained voice-orb. At small size, ring texture competes with the trace. Many tight irregular peaks fill the central band. The shared shell has multiple brass rings, dense ticks, diagonal facets and a bright green lower rim. Proposed change: Reserve this busy state for real urgency, which makes the calmer dry moments more effective. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Art direction.** Reserve this busy state for real urgency, which makes the calmer dry moments more effective. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Warmth and engagement.** Reserve this busy state for real urgency, which makes the calmer dry moments more effective. If the shell gets another design pass, simplify it once for all four states and keep the waveform large and legible.

**Authored dialogue usage:** 0 tags. This count excludes world/cast presentation and is not a deletion rule.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### location/bridge

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/locations/deep-orbit/bridge.webp)

**What the scene needs to do.** Establish the Archimedes bridge and invite the learner into its shared work area.

**Visible evidence.** The empty raised command tier, central clock, round holo table, brass rails and broad star windows create a readable room. Screen glyphs remain incidental.

**What works.** The retro clock and round shared worktable have distinctive adventure charm.

**Art direction.** Keep as the empty room reference and world backdrop. For a more inviting marketing foreground, add a separate crew composition only where text and people can coexist cleanly. Do not populate this master and destabilize room references.

**Warmth and engagement.** Keep as the empty room reference and world backdrop. For a more inviting marketing foreground, add a separate crew composition only where text and people can coexist cleanly. Do not populate this master and destabilize room references.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### location/lab

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/locations/deep-orbit/lab.webp)

**What the scene needs to do.** A practical, curious space for observing signals.

**Visible evidence.** A bright wall board, green column, small instruments, specimen bottles, coiled leads and a coffee ring fill the bench.

**What works.** The domestic wear and small tools make it feel inhabited, warm and approachable.

**Art direction.** Keep. Borrow the coffee-ring and bench-scale intimacy when staging quieter story scenes, and keep main instructional charts out of generic background scribbles.

**Warmth and engagement.** Keep. Borrow the coffee-ring and bench-scale intimacy when staging quieter story scenes, and keep main instructional charts out of generic background scribbles.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### location/engineering

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/locations/deep-orbit/engineering.webp)

**What the scene needs to do.** A capable workshop for practical limits and repairs.

**Visible evidence.** Tool wall, overhead pipes, warm task lamps, central bench and dark racks create an orderly mechanical interior.

**What works.** The tools and lamps give Nazari a clear home territory and a tactile counterpoint to holograms.

**Art direction.** Keep the master. Show purposeful handling and shared practical work in derived scenes rather than always placing Nazari with crossed arms beside a screen.

**Warmth and engagement.** Keep the master. Show purposeful handling and shared practical work in derived scenes rather than always placing Nazari with crossed arms beside a screen.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### location/dashboard-station

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/locations/deep-orbit/dashboard-station.webp)

**What the scene needs to do.** A place to sit down and monitor the system.

**Visible evidence.** Five green monitors face an empty chair. A brass mug sits on the right of the desk, with softer bridge detail behind.

**What works.** The chair and mug invite the learner to occupy the station. The image already supplies gentle lived-in character.

**Art direction.** Keep. The accepted five-monitor layout can stay. Give future derived scenes one dominant active screen so five competing panels do not dilute the task.

**Warmth and engagement.** Keep. The accepted five-monitor layout can stay. Give future derived scenes one dominant active screen so five competing panels do not dilute the task.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### location/adrift

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/locations/deep-orbit/adrift.webp)

**What the scene needs to do.** A friendly visual metaphor for a lost route or failed page.

**Visible evidence.** A small brass-and-gray probe floats in a large dark starfield with a loose looping tether and a green running light.

**What works.** The compact, slightly awkward probe feels endearing without becoming an extra character.

**Art direction.** Keep. Its empty space is functional for error-page copy. Preserve the small scale and avoid turning this quiet recovery moment into an explosion or crisis.

**Warmth and engagement.** Keep. Its empty space is functional for error-page copy. Preserve the small scale and avoid turning this quiet recovery moment into an explosion or crisis.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/foundations

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/foundations.webp)

**What the scene needs to do.** An earned emblem for manipulating data.

**Visible evidence.** A white glove supports a stack of fine green wireframe planes inside a flat brass ring.

**What works.** The hand makes an abstract module feel tangible and collectible.

**Findings and changes.**

- Low: The many thin plane edges collapse before the hand does at 28px. Its flat border differs from the stitched, dimensional rings elsewhere. A white glove supports a stack of fine green wireframe planes inside a flat brass ring. Proposed change: Simplify to three or four distinct data planes and standardize the outer ring treatment across the collection. Preserve the hand and sense of handling data.

**Art direction.** Simplify to three or four distinct data planes and standardize the outer ring treatment across the collection. Preserve the hand and sense of handling data.

**Warmth and engagement.** Simplify to three or four distinct data planes and standardize the outer ring treatment across the collection. Preserve the hand and sense of handling data.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/neural-networks

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/neural-networks.webp)

**What the scene needs to do.** An earned emblem for building a layered model.

**Visible evidence.** A dense circular mesh surrounds a central brass star, with green nodes scattered around it.

**What works.** The star and glow feel rewarding.

**Findings and changes.**

- Low: It reads as a web around a star rather than the bible's layered lattice converging to one output. Small-size lines are crowded. A dense circular mesh surrounds a central brass star, with green nodes scattered around it. Proposed change: Use three legible node columns feeding one larger output star, with the shared badge ring. Keep it an emblem, not a full teaching diagram.

**Art direction.** Use three legible node columns feeding one larger output star, with the shared badge ring. Keep it an emblem, not a full teaching diagram.

**Warmth and engagement.** Use three legible node columns feeding one larger output star, with the shared badge ring. Keep it an emblem, not a full teaching diagram.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/training-loop

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/training-loop.webp)

**What the scene needs to do.** An earned emblem for iterative improvement.

**Visible evidence.** Green elliptical coils narrow into a bright central point, then continue into a smaller lower cone.

**What works.** The spring-like silhouette is memorable and playful.

**Findings and changes.**

- Low: The brightest point sits midway through the coils, making the destination of the descending spiral less clear. Green elliptical coils narrow into a bright central point, then continue into a smaller lower cone. Proposed change: Consider one unambiguous spiral ending at one bright minimum. Reduce closely spaced lower coils if the 28px proof loses their separation.

**Art direction.** Consider one unambiguous spiral ending at one bright minimum. Reduce closely spaced lower coils if the 28px proof loses their separation.

**Warmth and engagement.** Consider one unambiguous spiral ending at one bright minimum. Reduce closely spaced lower coils if the 28px proof loses their separation.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/browser-runtimes

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/browser-runtimes.webp)

**What the scene needs to do.** An earned emblem for running models in a browser.

**Visible evidence.** A compact shuttle launches inside a browser window with three small chrome dots. The badge has a textured black field and stitched gold rim.

**What works.** The browser-and-launch combination communicates the module quickly and feels fun.

**Art direction.** Keep. A slightly larger central shuttle could help tiny render sizes, but it already earns its place and should not be removed for literal engine-versus-shuttle wording.

**Warmth and engagement.** Keep. A slightly larger central shuttle could help tiny render sizes, but it already earns its place and should not be removed for literal engine-versus-shuttle wording.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/signal-processing

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/signal-processing.webp)

**What the scene needs to do.** An earned emblem for exploring signal content.

**Visible evidence.** A wave enters a diamond-like prism and exits as symmetric bars. Opaque white corners surround the black circular patch.

**What works.** The wave-to-bars silhouette is distinct from the other emblems.

**Findings and changes.**

- Medium: Opaque white corners break the collection on dark surfaces. The icon itself remains valid emblem shorthand. A wave enters a diamond-like prism and exits as symmetric bars. Opaque white corners surround the black circular patch. Proposed change: Remove the white outer field or use the same edge treatment as the collection. Optionally simplify the prism and bars for small-size clarity. This emblem is not a quantitative spectrum.

**Art direction.** Remove the white outer field or use the same edge treatment as the collection. Optionally simplify the prism and bars for small-size clarity. This emblem is not a quantitative spectrum.

**Warmth and engagement.** Remove the white outer field or use the same edge treatment as the collection. Optionally simplify the prism and bars for small-size clarity. This emblem is not a quantitative spectrum.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/recurrent-networks

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/recurrent-networks.webp)

**What the scene needs to do.** An earned emblem for retaining state across time.

**Visible evidence.** A green ring of repeated arrows surrounds a tiny square memory chip. The outer gold ring is flat and distressed.

**What works.** The loop around memory is a strong, recognizable metaphor.

**Findings and changes.**

- Low: The small chip becomes a dot and numerous arrowheads compete with it at sidebar size. A green ring of repeated arrows surrounds a tiny square memory chip. The outer gold ring is flat and distressed. Proposed change: Keep the loop idea but reduce it to two or three large arrows and enlarge the memory core. Match the same ring weight used by the other badges.

**Art direction.** Keep the loop idea but reduce it to two or three large arrows and enlarge the memory core. Match the same ring weight used by the other badges.

**Warmth and engagement.** Keep the loop idea but reduce it to two or three large arrows and enlarge the memory core. Match the same ring weight used by the other badges.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/anomaly-detection

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/anomaly-detection.webp)

**What the scene needs to do.** An earned emblem for spotting unusual readings.

**Visible evidence.** A green trace and a separate brass lightning bolt overlap inside a crosshair circle.

**What works.** The crosshair gives the eye one central target.

**Findings and changes.**

- Low: The lightning bolt can suggest an electrical fault rather than an unexplained signal and partially hides the trace. A green trace and a separate brass lightning bolt overlap inside a crosshair circle. Proposed change: If redrawn, let one unusual peak in the trace be the target instead of adding a separate bolt. Keep the mystery open rather than illustrating a known failure cause.

**Art direction.** If redrawn, let one unusual peak in the trace be the target instead of adding a separate bolt. Keep the mystery open rather than illustrating a known failure cause.

**Warmth and engagement.** If redrawn, let one unusual peak in the trace be the target instead of adding a separate bolt. Keep the mystery open rather than illustrating a known failure cause.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/advanced-time-series

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/advanced-time-series.webp)

**What the scene needs to do.** An earned emblem for looking ahead with uncertainty.

**Visible evidence.** A small comet launches several green and pale trajectory lines that fan outward across the badge.

**What works.** The fanning paths are legible and make forecasting feel exploratory.

**Findings and changes.**

- Low: There are more trajectories than the three named in the emblem brief, and some thin lines merge at tiny size. A small comet launches several green and pale trajectory lines that fan outward across the badge. Proposed change: Keep the motif. Three stronger paths would improve small-scale clarity if the patch system is simplified, but this is not a reason to remove a successful emblem.

**Art direction.** Keep the motif. Three stronger paths would improve small-scale clarity if the patch system is simplified, but this is not a reason to remove a successful emblem.

**Warmth and engagement.** Keep the motif. Three stronger paths would improve small-scale clarity if the patch system is simplified, but this is not a reason to remove a successful emblem.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/llm-integration

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/llm-integration.webp)

**What the scene needs to do.** An earned emblem for language linked to ship systems.

**Visible evidence.** Five speech bubbles branch through circuitry to a small antenna-like base. Its outer field is visibly gray.

**What works.** Speech bubbles make this module recognizable and more playful than a generic chip.

**Findings and changes.**

- Low: Five bubbles and many circuit stems are crowded at 28px. The gray square field differs from the mostly black collection. Five speech bubbles branch through circuitry to a small antenna-like base. Its outer field is visibly gray. Proposed change: Reduce to two or three distinct bubbles, enlarge the antenna and standardize the square background or transparent exterior with the other patches.

**Art direction.** Reduce to two or three distinct bubbles, enlarge the antenna and standardize the square background or transparent exterior with the other patches.

**Warmth and engagement.** Reduce to two or three distinct bubbles, enlarge the antenna and standardize the square background or transparent exterior with the other patches.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/optimization-edge

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/optimization-edge.webp)

**What the scene needs to do.** An earned emblem for an efficient deployable system.

**Visible evidence.** A green-rimmed satellite with two large panel wings crosses the badge diagonally.

**What works.** The diagonal orientation is lively and the silhouette reads as spacecraft hardware.

**Art direction.** Keep the identifiable satellite and lively diagonal. The emblem need not literally remove a panel to represent efficient deployment. If the collection is simplified, preserve its compact silhouette.

**Warmth and engagement.** Keep the identifiable satellite and lively diagonal. The emblem need not literally remove a panel to represent efficient deployment. If the collection is simplified, preserve its compact silhouette.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### patch/capstone

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/patches/deep-orbit/capstone.webp)

**What the scene needs to do.** An earned emblem for the finished monitoring system.

**Visible evidence.** A brass dish antenna stands above concentric orbital rings, all within a more elaborate multi-ring border.

**What works.** The upright dish feels like a completed, working piece of equipment.

**Art direction.** Keep. Its formal finish is appropriate for the final module. Preserve enough contrast around the dish when standardizing other patch borders.

**Warmth and engagement.** Keep. Its formal finish is appropriate for the final module. Preserve enough contrast around the dish when standardizing other patch borders.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### seal/deep-orbit

**Recommendation: refine. Priority: P3. Story fit: mixed. Delight: mixed.**

[Open current artwork](../../apps/web/public/seals/deep-orbit.webp)

**What the scene needs to do.** Completion of the whole world.

**Visible evidence.** A small brass star sits inside orbital rings and a balanced laurel wreath on a dark field.

**What works.** The radial symmetry, wreath and heavier structure clearly distinguish the world award.

**Findings and changes.**

- Low: The star is relatively small and dim beside the much brighter outer wreath. A small brass star sits inside orbital rings and a balanced laurel wreath on a dark field. Proposed change: Keep the formal design. A small increase in central-star contrast would help the 72px certificate rendering, without adding confetti or turning the award into a joke.

**Art direction.** Keep the formal design. A small increase in central-star contrast would help the 72px certificate rendering, without adding confetti or turning the award into a joke.

**Warmth and engagement.** Keep the formal design. A small increase in central-star contrast would help the 72px certificate rendering, without adding confetti or turning the award into a joke.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### og/bridge.jpg

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/og/deep-orbit/bridge.jpg)

**What the scene needs to do.** A readable Deep Orbit setting behind social-card content.

**Visible evidence.** The landscape crop retains the central clock and holo table while trimming floor and ceiling from the full master.

**What works.** The room remains identifiable at the wider social-card ratio.

**Art direction.** Keep as an intentional format derivative. It is not an accidental duplicate: the OG renderer needs a predictable JPEG background. Review any future foreground text on the actual social card.

**Warmth and engagement.** Keep as an intentional format derivative. It is not an accidental duplicate: the OG renderer needs a predictable JPEG background. Review any future foreground text on the actual social card.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### og/seal.jpg

**Recommendation: keep. Priority: none. Story fit: strong. Delight: mixed.**

[Open current artwork](../../apps/web/public/og/deep-orbit/seal.jpg)

**What the scene needs to do.** A compact world-completion mark for social cards.

**Visible evidence.** The 256px JPEG retains the wreath and orbital rings, with a somewhat soft central star.

**What works.** The design survives the derivative size and preserves the world award.

**Art direction.** Keep as the OG renderer's required derivative. If the source seal gets a contrast improvement, regenerate this derivative from that approved source.

**Warmth and engagement.** Keep as the OG renderer's required derivative. If the source seal gets a contrast improvement, regenerate this derivative from that approved source.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** Individual native asset viewed. Small-size comparison checked separately in the audit proofs.

### media/deep-orbit-trailer-poster.webp

**Recommendation: replace. Priority: P2. Story fit: mixed. Delight: weak.**

[Open current artwork](../../apps/web/public/media/deep-orbit-trailer-poster.webp)

**What the scene needs to do.** Invite a prospect to meet the crew and watch their adventure.

**Visible evidence.** Four human crew walk toward the viewer under a bright waveform. Nazari looks older and more severe than the new portrait; Mirza looks much younger; Demir is small behind them.

**What works.** It has visible faces, a correct four-human cast and a clear ensemble promise.

**Findings and changes.**

- Medium: The poster differs from the current portrait anchors: Mirza has reduced age detail and a smoother face, Nazari has longer hair and a harsher face, and Demir lacks the same strong earpiece cue. The stern procession offers less warmth than the current lesson scenes. Four human crew walk toward the viewer under a bright waveform. Nazari looks older and more severe than the new portrait; Mirza looks much younger; Demir is small behind them. Proposed change: Replace the poster with a frame or new composition that matches the current crew. Prefer an active shared discovery with a little warmth to another march toward camera. Preserve its relationship to the actual film.

**Art direction.** Replace the poster with a frame or new composition that matches the current crew. Prefer an active shared discovery with a little warmth to another march toward camera. Preserve its relationship to the actual film.

**Warmth and engagement.** Replace the poster with a frame or new composition that matches the current crew. Prefer an active shared discovery with a little warmth to another march toward camera. Preserve its relationship to the actual film.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

### media/deep-orbit-trailer.mp4

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: strong.**

[Open current artwork](../../apps/web/public/media/deep-orbit-trailer.mp4)

**What the scene needs to do.** Present the world as a crew-led mystery the learner can join.

**Visible evidence.** One-second samples across all 88 seconds show ship exteriors, ARIA's waveform failure, the crew walk at32-38s, a friendly Demir turn at40-46s, shared work and a final unresolved reading.

**What works.** The Demir invitation and Farah's smile at57-61s supply more warmth and person-to-person energy than many lesson stills.

**Findings and changes.**

- Medium: Several faces, especially the crew walk, use older designs. Large full-frame green flashes appear in the sampled transitions. This audit does not establish temporal flash safety or audio quality. One-second samples across all 88 seconds show ship exteriors, ARIA's waveform failure, the crew walk at32-38s, a friendly Demir turn at40-46s, shared work and a final unresolved reading. Proposed change: Keep the useful narrative cut and consider targeted character-shot replacement. Bring that friendly invitation into lesson staging. Judge transition motion in playback before making an accessibility claim. The 1fps visual audit cannot clear every intermediate frame.

**Art direction.** Keep the useful narrative cut and consider targeted character-shot replacement. Bring that friendly invitation into lesson staging. Judge transition motion in playback before making an accessibility claim. The 1fps visual audit cannot clear every intermediate frame.

**Warmth and engagement.** Keep the useful narrative cut and consider targeted character-shot replacement. Bring that friendly invitation into lesson staging. Judge transition motion in playback before making an accessibility claim. The 1fps visual audit cannot clear every intermediate frame.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** One visual frame per second across the full duration. No audio review, real-time motion assessment or exhaustive per-frame inspection.

### media/learn-trailer-poster.webp

**Recommendation: keep. Priority: none. Story fit: strong. Delight: strong.**

[Open current artwork](../../apps/web/public/media/learn-trailer-poster.webp)

**What the scene needs to do.** Create wonder before the learn-page trailer starts.

**Visible evidence.** A compact brass ship floats before a large cratered planet amid green clouds. No faces or instructional charts appear.

**What works.** The warm little ship against a vast world feels adventurous and inviting.

**Art direction.** Keep. Its quiet scale offers valuable breathing room. Preserve the hero copy's legibility over the actual crop and avoid adding a crowded crew collage.

**Warmth and engagement.** Keep. Its quiet scale offers valuable breathing room. Preserve the hero copy's legibility over the actual crop and avoid adding a crowded crew collage.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

### media/learn-trailer.mp4

**Recommendation: refine. Priority: P1. Story fit: mixed. Delight: weak.**

[Open current artwork](../../apps/web/public/media/learn-trailer.mp4)

**What the scene needs to do.** Introduce learning through the Deep Orbit mystery.

**Visible evidence.** One-second samples across72s show a mechanical code orb, illegible generated code around6-11s, ship exteriors, industrial machinery, tense faces around36-53s and a burst of green energy.

**What works.** The small spacecraft and mechanical invention have a distinctive, curious visual world.

**Findings and changes.**

- High: The floating code is visibly malformed. The commander's angular face, hair silhouette and apparent complexion change from the canonical Mirza and vary between shots. The energy eruption reads as a physical disaster; that is a tonal interpretation rather than proof of a canon event. One-second samples across72s show a mechanical code orb, illegible generated code around6-11s, ship exteriors, industrial machinery, tense faces around36-53s and a burst of green energy. Proposed change: Prioritize replacing the malformed code inserts and character shots. Use real authored code composited into frames. Recut the discovery toward curious surprise and shared problem solving, while preserving the owner-approved trailer's basic adventure premise. Do not delete the live film before a replacement is ready.

**Art direction.** Prioritize replacing the malformed code inserts and character shots. Use real authored code composited into frames. Recut the discovery toward curious surprise and shared problem solving, while preserving the owner-approved trailer's basic adventure premise. Do not delete the live film before a replacement is ready.

**Warmth and engagement.** Prioritize replacing the malformed code inserts and character shots. Use real authored code composited into frames. Recut the discovery toward curious surprise and shared problem solving, while preserving the owner-approved trailer's basic adventure premise. Do not delete the live film before a replacement is ready.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** One visual frame per second across the full duration. No audio review, real-time motion assessment or exhaustive per-frame inspection.

### media/learn-trailer-loop.webm

**Recommendation: refine. Priority: P2. Story fit: mixed. Delight: weak.**

[Open current artwork](../../apps/web/public/media/learn-trailer-loop.webm)

**What the scene needs to do.** A low-pressure moving background on the learn page.

**Visible evidence.** One-second samples across24s show the ship, stone pillars, a sparking industrial column, module-count display and tense older character shots.

**What works.** The exterior opening has scale and wonder.

**Findings and changes.**

- Medium: The loop repeats sparks, a crushing-looking column and serious faces rather than the gentler sense of discovery the user now requests. It repeats the older commander design. One-second samples across24s show the ship, stone pillars, a sparking industrial column, module-count display and tense older character shots. Proposed change: Recut the loop from calm exteriors and a warm, canonical shared-work moment, with a quiet loop seam. Keep the full trailer separately. The loop should invite interaction without repeatedly signaling an emergency.

**Art direction.** Recut the loop from calm exteriors and a warm, canonical shared-work moment, with a quiet loop seam. Keep the full trailer separately. The loop should invite interaction without repeatedly signaling an emergency.

**Warmth and engagement.** Recut the loop from calm exteriors and a warm, canonical shared-work moment, with a quiet loop seam. Keep the full trailer separately. The loop should invite interaction without repeatedly signaling an emergency.

**Deletion decision.** Retain this asset and its role. No verified unused runtime asset was found here.

**Inspection scope.** One visual frame per second across the full duration. No audio review, real-time motion assessment or exhaustive per-frame inspection.
