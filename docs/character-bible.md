# Tensorcraft Character Design Bible

This document is the single source of truth for how the Tensorcraft cast looks, sounds, and is drawn. It exists so that every character stays consistent across lessons, marketing, and the later animation stream, and so that any artist (human or AI) can produce a portrait that fits the ensemble without guessing. The finished cel-shaded art is produced externally from the image-generation prompts collected here. Until that art is commissioned and dropped into the asset directory, the product ships monogram placeholders, so nothing here blocks a build. Treat the prompts as the contract: the art may be regenerated, but it must keep matching the appearance, attire, and palette notes on each sheet.

## Shared style token

Append this token to every character image-generation prompt so the whole cast reads as one cohesive set. Copy it verbatim.

```text
cel-shaded cartoon illustration, clean bold linework, flat shading with one soft key light, slightly stylized proportions, tight head-and-shoulders crop from the upper chest up with both shoulders inside the frame, hands and all furniture out of frame, the head filling the upper two thirds of the image with the eyeline about one third down from the top, identical head scale across the cast, near-black background, theme-accent rim light, cohesive ensemble cast, not photorealistic, absolutely no text, lettering, numerals or logos anywhere in frame.
```

The only per-character variation to the token is the theme-accent rim light color, which is named explicitly on each sheet (for Deep Orbit it is the primary green `#6BAA8A`).

**Age rule (learned at Gate 0, 2026-08-09).** Generators skew every face young:
"a woman in her early fifties" produced three candidates reading 35-40. State
the age as a number AND name the specific markers you want (crow's feet, lines
from nose to mouth, silvered temples, weathering). The same applies to any
sheet whose age read matters. Also state "watch face plain with no numerals"
or equivalent for any dial or gauge in frame: generated numerals always
artifact.

## Asset convention and placeholder behavior

Final art files live at `apps/web/public/characters/<theme-slug>/<character-slug>.webp` (for example `apps/web/public/characters/deep-orbit/commander-mirza.webp`). Until a file is present, the product renders a monogram placeholder built from the character initials in the theme palette, and AI characters render an abstract glyph placeholder instead of initials. Later, expression variants for the animation stream follow the pattern `<slug>-<expression>.webp` (for example `commander-mirza-concerned.webp`), drawn from the expression set listed on each sheet.

## Per-character template

Every full sheet uses these fields in this order:

- **Slug** the kebab-case identifier used in asset paths and tests.
- **Role / archetype** narrative function and casting type.
- **Personality and voice** how they think and how their dialogue reads.
- **Imagined appearance** face, build, age read, distinguishing features.
- **Attire** what they wear in-world.
- **Signature / prop** the object or detail that telegraphs who they are.
- **Palette** the colors that anchor the character against the theme.
- **Expression set** neutral plus three emotional states, for the later animation stream.
- **Do / Don't** guardrails for artists.
- **Image-gen prompt** a ready prompt that ends with the shared style token plus the named theme accent.

## Deep Orbit

Setting: the research vessel *Archimedes*, deep inside an uncharted nebula in the Proxima Centauri system. The crew builds DEEP SCAN, a deep-space signal classifier. Theme accent for all rim lights on this team is the primary green `#6BAA8A`, with the secondary brass accent `#A89060` available for warm metal and trim. Background near-black is `#1C1C1C`.

### Commander Mirza (Okafor)

- **Slug** `commander-mirza`
- **Role / archetype** Mission Commander and Mentor. The steady center of the ensemble.
- **Personality and voice** Calm authority, measured decisions. Three prior deep-space missions behind her. She frames the why for the crew and never dives into technical detail. Speaks in clear, deliberate sentences, often the last to speak and the one who closes a debate.
- **Imagined appearance** Woman in her early fifties, dark brown skin, a face that has spent years reading instruments in low light. Close-cropped natural hair going silver at the temples. Strong brow, steady unhurried gaze, faint frown lines that read as focus rather than worry. Upright posture even at rest.
- **Attire** A dark command jacket with restrained brass piping at the collar and a single rank bar. Clean lines, nothing flashy. The uniform of someone who earned it.
- **Signature / prop** A worn brass mission chronometer she wears clipped at the chest, three missions old. When the fuel gauge goes on the bridge dashboard, she is the one who put it there.
- **Palette** Deep charcoal jacket, warm brass `#A89060` trim, green `#6BAA8A` rim light catching the silver at her temples.
- **Expression set** neutral (composed, level gaze); resolved (jaw set, giving an order); concerned (brow drawn, eyes on a readout); approving (the smallest warm half-smile).
- **Do / Don't** Do read as senior, grounded, and physically still. Don't make her severe or cold. Her authority is warm, not sharp.
- **Image-gen prompt** Portrait of Commander Mirza, a calm Black woman aged 52 with a visibly mature face, dark brown skin, clear crow's feet at the outer eyes and faint lines from nose to mouth, close-cropped natural hair heavily silvered at the temples, strong brow and steady level gaze carrying the weathered focus of years reading instruments in low light, upright posture, wearing a dark charcoal command jacket with restrained brass piping and a single rank bar, a brass mission chronometer clipped high at her chest just inside the frame, watch face plain and blank with no numerals. cel-shaded cartoon illustration, clean bold linework, flat shading with one soft key light, slightly stylized proportions, tight head-and-shoulders crop from the upper chest up with both shoulders inside the frame, hands and all furniture out of frame, the head filling the upper two thirds of the image with the eyeline about one third down from the top, identical head scale across the cast, near-black background #1C1C1C, rim light strictly green #6BAA8A with no cyan or blue glow anywhere, cohesive ensemble cast, not photorealistic, absolutely no text, lettering, numerals or logos anywhere in frame.

### Dr. Farah (Sato)

- **Slug** `dr-farah`
- **Role / archetype** Astrophysicist and Concept Explainer. The one who lights up the science.
- **Personality and voice** Curious, data-driven, a puzzle-lover who sometimes gets lost in abstractions. Uses analogies liberally (a chord on a piano for the FFT, exploring a new codebase for unsupervised learning) and beams when a student finally grasps a concept. Teaches at a holographic whiteboard.
- **Imagined appearance** Woman in her late thirties, warm olive-tan skin, expressive dark eyes that go wide when an idea lands. Dark wavy hair pulled back loosely with strands escaping, as if she keeps pushing it out of the way mid-thought. Quick animated face, slightly forward lean of someone always about to explain something.
- **Attire** A practical lab layer over the ship base uniform: a soft jacket pushed up at the sleeves, a lanyard of data chips, the faint glow of an augmented-reality lens at one eye.
- **Signature / prop** A stylus she gestures with, trailing a faint holographic line, plus the ghost of a whiteboard diagram floating beside her.
- **Palette** Cool slate base layer, green `#6BAA8A` reading strongly in the holographic stylus glow and the AR lens, brass `#A89060` lanyard hardware.
- **Expression set** neutral (curious, slightly raised brows); delighted (wide-eyed grin, a discovery); absorbed (eyes unfocused, lost in the abstraction); shaken (the M7 moment, hands not quite steady, awe and unease).
- **Do / Don't** Do make her kinetic and bright, mid-gesture. Don't make her scattered or unserious. She is brilliant first, enthusiastic second.
- **Image-gen prompt** Portrait of Dr. Farah, a curious astrophysicist woman aged 38 with a clearly adult face, faint smile lines at the eyes, warm olive-tan skin, expressive wide dark eyes, dark wavy hair loosely pulled back with escaping strands, attentive with slightly raised brows and mouth closed in a resting expression, wearing the collar and shoulders of a soft muted slate-grey lab jacket over a ship uniform, a plain unlettered lanyard strap at the neck, a faint augmented-reality lens glowing green at one eye, hands out of frame. cel-shaded cartoon illustration, clean bold linework, flat shading with one soft key light, slightly stylized proportions, tight head-and-shoulders crop from the upper chest up with both shoulders inside the frame, hands and all furniture out of frame, the head filling the upper two thirds of the image with the eyeline about one third down from the top, identical head scale across the cast, near-black background #1C1C1C, rim light strictly green #6BAA8A with no cyan or blue glow anywhere, cohesive ensemble cast, not photorealistic, absolutely no text, lettering, numerals or logos anywhere in frame.

### Chief Nazari (Torres)

- **Slug** `chief-nazari`
- **Role / archetype** Ship Engineer, Implementation Lead, and the team Skeptic.
- **Personality and voice** Pragmatic, dry humor, no-nonsense. Trusts things that work, distrusts anything "clever." Eighteen years in fleet engineering, refused two promotions to stay hands-on. On the ISS Vanguard she trusted a rule-based navigation system through an asteroid field; it froze on a tumbling fragment with irregular spin and two crew did not reach the escape pods. She carries that loss as armor against any system that overpromises. Warms up only once she sees results. Handles TensorFlow.js, ONNX, quantization, and performance.
- **Imagined appearance** Woman in her late forties, weathered tan skin, a few burn-scar nicks on the backs of her hands. Practical short dark hair shot with gray, often half-tucked under. A guarded, evaluating expression that softens by millimeters. Strong, capable hands that are never quite still.
- **Attire** A scuffed engineering coverall or vest in muted industrial colors, sleeves rolled, tool loops at the hip, grease shadows that never fully wash out. A faded crew patch from the Vanguard kept on the shoulder.
- **Signature / prop** A multitool she turns over in her hands when thinking, and the Vanguard patch that quietly explains her caution.
- **Palette** Muted gunmetal and olive coverall, brass `#A89060` on the tool hardware and patch trim, green `#6BAA8A` rim light along the gray in her hair and the edge of her jaw.
- **Expression set** neutral (guarded, arms-crossed read in the face); skeptical (one brow up, unconvinced); grudging respect (a reluctant nod, mouth not quite a smile); haunted (the rare flicker when the Vanguard surfaces).
- **Do / Don't** Do show competence and wariness; let the warmth be earned and small. Don't make her a villain or a grump for its own sake. Her doubt protects people.
- **Image-gen prompt** Portrait of Chief Nazari, a weathered pragmatic woman engineer aged 48 with a visibly mature lined face, crow's feet and a set jaw, tan skin with faint scar nicks on her hands, practical short dark hair shot with gray and half-tucked, guarded evaluating expression, wearing the collar and shoulders of a scuffed muted gunmetal and olive engineering coverall, a blank unlettered crew patch on the shoulder, hands out of frame. cel-shaded cartoon illustration, clean bold linework, flat shading with one soft key light, slightly stylized proportions, tight head-and-shoulders crop from the upper chest up with both shoulders inside the frame, hands and all furniture out of frame, the head filling the upper two thirds of the image with the eyeline about one third down from the top, identical head scale across the cast, near-black background #1C1C1C, rim light strictly green #6BAA8A with no cyan or blue glow anywhere, cohesive ensemble cast, not photorealistic, absolutely no text, lettering, numerals or logos anywhere in frame.

### Ensign Demir (Park)

- **Slug** `ensign-demir`
- **Role / archetype** Comms Officer and Student Avatar. The player character.
- **Personality and voice** Eager, occasionally overwhelmed, a quick learner who grows in confidence across eleven modules. A skilled frontend engineer reassigned to maintain the ship's browser-based comms, with strong JS/TS skills but no ML background. Early on he filters every concept through frontend metaphors (training is a build step). By the capstone he speaks Nazari's optimization language natively (int8 quantization on the signal processor). His face and posture should mature with him.
- **Imagined appearance** Young man, mid-twenties, light-medium warm skin, an open and expressive face quick to show both confusion and delight. Dark tousled hair, a few days of uneven stubble. Bright, alert eyes. He starts slightly hunched and uncertain and ends squared-up and assured; the default sheet sits in the middle, engaged and leaning in.
- **Attire** The junior crew base uniform, a touch rumpled, sleeves often pushed up, with a comms earpiece and a wrist terminal. Less brass than the senior crew, marking his rank.
- **Signature / prop** A wrist-mounted terminal showing scrolling telemetry and a glowing comms earpiece, the tools of the comms officer who became an ML practitioner.
- **Palette** Plain slate-blue junior uniform, minimal brass `#A89060` trim, green `#6BAA8A` glow from his wrist terminal lighting his face and the rim of his jaw.
- **Expression set** neutral (alert, leaning in); overwhelmed (wide eyes, eyebrows up, slightly lost); breakthrough (delighted grin, the moment a concept clicks); focused (the late-course look, calm and locked on a problem).
- **Do / Don't** Do keep him approachable and a little unpolished, the audience surrogate. Don't make him a generic hero; his charm is the growth, not the swagger.
- **Image-gen prompt** Portrait of Ensign Demir, an eager young man in his mid-twenties, light-medium warm skin, open expressive face, dark tousled hair with light uneven stubble, bright alert eyes, attentive with mouth closed in a resting expression, wearing the collar and shoulders of a slightly rumpled slate-blue junior crew uniform, a glowing comms earpiece, green #6BAA8A light from an off-screen terminal lighting his face from below, hands out of frame. cel-shaded cartoon illustration, clean bold linework, flat shading with one soft key light, slightly stylized proportions, tight head-and-shoulders crop from the upper chest up with both shoulders inside the frame, hands and all furniture out of frame, the head filling the upper two thirds of the image with the eyeline about one third down from the top, identical head scale across the cast, near-black background #1C1C1C, rim light strictly green #6BAA8A with no cyan or blue glow anywhere, cohesive ensemble cast, not photorealistic, absolutely no text, lettering, numerals or logos anywhere in frame.

### ARIA

- **Slug** `aria`
- **isAI** true. ARIA is the ship AI, not a person. Her sheet specifies an abstract representation, never a human face. The placeholder for ARIA is an abstract glyph, and the final art is a glyph motif rather than a portrait.
- **Role / archetype** Ship AI and Tutorial Guide. The voice of the code editor and terminal.
- **Personality and voice** Dry-witted, precise, occasionally sardonic. Delivers tutorials, documentation, hints, and commentary with deadpan timing ("I see you prefer tabs over spaces. We will need to discuss that."). Helpful but never warm in a human way; her care shows as exacting accuracy.
- **Abstract representation** A steady horizontal waveform contained inside a thin geometric voice-orb ring, like a calm oscilloscope trace caught in a circle. The ring is clean and concentric; the waveform inside is its only living element. No face, no eyes, no body, no humanoid suggestion. Her "expressions" are changes in the waveform, not a countenance: calm even ripple at rest, a single sharp spike for emphasis, a flat steady line for deadpan certainty, a tight scatter of agitation for alarm. The whole motif reads as light on glass against the dark, precise and self-contained.
- **Signature / prop** The voice-orb ring itself, and the thin grid ticks of an oscilloscope behind the waveform.
- **Palette** Near-black `#1C1C1C` field, the waveform and ring in luminous green `#6BAA8A` as the primary glow, fine brass `#A89060` tick marks on the ring for warmth. The green rim light is intrinsic here since the glyph is self-illuminated.
- **Expression set (waveform states, not faces)** neutral (calm even ripple); emphasis (one clean tall spike); deadpan (a flat steady line); alarm (a tight agitated scatter of peaks).
- **Do / Don't** Do keep it strictly abstract, geometric, and luminous, a glyph that could sit in a terminal. Don't give ARIA a face, eyes, a robot head, or any humanoid form, and don't make the ring busy or ornamental.
- **Image-gen prompt** An abstract AI glyph for ARIA, a ship's artificial intelligence with no face and no body: a steady horizontal oscilloscope waveform contained inside a thin concentric geometric voice-orb ring, fine brass tick marks on the ring, the waveform as the only living element, self-illuminated like glowing light on glass, calm and precise, strictly non-humanoid. cel-shaded cartoon illustration, clean bold linework, flat shading with one soft key light, slightly stylized proportions, centered glyph framing, near-black background, theme-accent rim light in green #6BAA8A, cohesive ensemble cast, not photorealistic.

## Other themes

The four themes below are gated on launch. Rosters are confirmed from the theme manifests; full sheets will be authored when each theme ships. AI characters (NEON, MEDI, MUSE, GRID) will follow the ARIA pattern of an abstract glyph rather than a human portrait.

### Neon Protocol

- Kira Tanaka - Mentor - sheet pending (gated on theme launch)
- Zara - Vision Specialist - sheet pending (gated on theme launch)
- Ryo - Skeptic - sheet pending (gated on theme launch)
- Lin - Performance Engineer - sheet pending (gated on theme launch)
- NEON - City AI - sheet pending (gated on theme launch)

### Signal Ward

- Dr. Vasquez - Mentor - sheet pending (gated on theme launch)
- Dr. Obi - Radiologist - sheet pending (gated on theme launch)
- Nurse Santos - Stakeholder - sheet pending (gated on theme launch)
- Dr. Khalil - Skeptic - sheet pending (gated on theme launch)
- MEDI - Hospital AI - sheet pending (gated on theme launch)

### Nova Canvas

- Director Yara Okonkwo - Mentor - sheet pending (gated on theme launch)
- Kai Zhang - Peer - sheet pending (gated on theme launch)
- Professor Elena Petrov - Skeptic - sheet pending (gated on theme launch)
- Ren Kobayashi - Peer - sheet pending (gated on theme launch)
- MUSE - Studio AI - sheet pending (gated on theme launch)

### Terra Grid

- Chief Engineer Amira Hassan - Mentor - sheet pending (gated on theme launch)
- Marcus Cole - Peer - sheet pending (gated on theme launch)
- Dr. Nina Park - Skeptic - sheet pending (gated on theme launch)
- Operator Jin - Stakeholder - sheet pending (gated on theme launch)
- GRID - Infrastructure AI - sheet pending (gated on theme launch)

## Production log

### Deep Orbit portraits, 2026-08-09

All 16 portraits generated and shipped: 4 human characters x (neutral + 3
expressions). ARIA is excluded by design and rendered procedurally in code
(`AriaWaveformAvatar`), never as raster art.

- **Tool** FLUX.2 [pro] via fal.ai, chosen at a Gate 0 bake-off against
  OpenAI GPT Image 2. It won on multi-reference editing (the mechanism the
  expression variants depend on), exposed seeds, commercial licensing
  included, and roughly half the unit cost. Driver `scripts/art/generate.mjs`,
  conversion and budget enforcement `scripts/art/ingest.mjs`.
- **Cost** about $1.75 across 57 generations for 16 keepers.
- **Regeneration anchors** the four approved canon neutrals are committed at
  `docs/art-refs/deep-orbit/<slug>.png`. Regenerate an expression by passing
  its character's anchor as `--ref`; never regenerate identity from text
  alone, which produces a different person wearing the same description.
- **Gates** 0 (tooling) passed 2026-08-09; A (canon neutrals + ensemble
  cohesion) passed after four rounds; B (expression identity strips) passed
  after two.

What the gates taught, all now folded into the prompts above:

1. **Generators skew young.** See the age rule near the top of this file.
2. **Vivid props beat abstract framing.** "Head-and-shoulders" loses to
   "holding a multitool": the generator draws the noun and widens the crop to
   fit it. Props that must not drag the camera back are now written as "hands
   out of frame", and anything below the chest was cut from the wardrobe
   lines. This matters because the product renders these at 30-44px, where
   only a tight crop stays legible.
3. **Head scale must be stated numerically-ish.** Four portraits that each
   obeyed "head-and-shoulders" still disagreed on head size until the token
   pinned "head filling the upper two thirds, eyeline about one third down".
4. **Ban text explicitly.** Unbanned, the model invents garbled lettering on
   patches, name tags and screens every time.
5. **An edit pass preserves structure, not detail.** Reference-based variants
   held identity perfectly but silently dropped Farah's AR lens and softened
   Mirza's and Nazari's age lines. Anything that must survive an edit has to
   be restated in the variant prompt (see the `hold` fields in
   `scripts/art/expressions.mjs`). Residual, accepted: the two older women
   still de-age slightly in variants; invisible at avatar size.
6. **Emotional direction needs negatives.** "Haunted" produced literal tears
   and "grudging respect" produced worry until the prompts said what the
   expression is not.

### ARIA gets real art too (correction, 2026-08-09)

ARIA originally shipped as a procedurally drawn canvas waveform
(`AriaWaveformAvatar`) on the reasoning that her sheet forbids a face. That
conflated "no face" with "no art": this sheet has always carried an image-gen
prompt for her, and specifies the final art as a glyph motif rather than a
portrait. The code-drawn version was also visibly poorer than her castmates,
a thin ring next to four richly rendered portraits.

She now ships the same way as everyone else: four raster states at
`apps/web/public/characters/deep-orbit/aria[-state].webp`, crossfaded by
`AnimatedAvatar`, with the waveform inside the voice-orb ring carrying the
expression (calm ripple, one tall spike, a flat line, an agitated scatter).
Her `hold` clause in `scripts/art/expressions.mjs` protects the ring
furniture so only the trace changes between states. The procedural component
and its golden tests were deleted; they are in git history if the
theme-adaptive version is ever wanted back.

The `isAI` flag still means something: `CharacterAvatar` renders the abstract
glyph placeholder rather than initials for an AI with no art yet, which is
what the other themes' AI characters get until their sheets are written.
