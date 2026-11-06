import fs from "node:fs";
import path from "node:path";

const CHARACTERS = [
  {
    name: "Commander Mirza",
    surname: "Mirza",
    slug: "commander-mirza",
    identity:
      "a Black woman aged 52, dark brown skin, visibly mature face, close-cropped natural hair silvered at the temples, charcoal command jacket with brass piping and a blank brass chest chronometer",
  },
  {
    name: "Dr. Farah",
    surname: "Farah",
    slug: "dr-farah",
    identity:
      "an adult woman aged 38, warm olive-tan skin, dark wavy hair loosely tied back with escaping strands, slate-gray lab layer, green AR lens over one eye, a stylus",
  },
  {
    name: "Chief Nazari",
    surname: "Nazari",
    slug: "chief-nazari",
    identity:
      "a woman aged 48, weathered tan skin, mature facial lines, practical short dark hair with a gray streak, scuffed gunmetal and olive engineering coverall, a multitool",
  },
  {
    name: "Ensign Demir",
    surname: "Demir",
    slug: "ensign-demir",
    identity:
      "a young man aged 25, light-medium warm skin, tousled dark hair, light uneven stubble, slate-blue junior uniform, comms earpiece and glowing wrist terminal",
  },
];

/** Historical staging language must never undo the user's visible-face direction. */
export function visibleStaging(text) {
  return text
    .replace(
      /\b(?:small\s+)?(?:dark\s+)?(?:rim-lit\s+)?(?:crew\s+)?silhouettes?\b/gi,
      "recognizable crew",
    )
    .replace(
      /\b(?:both |all )?faces? averted\b/gi,
      "faces clearly visible in three-quarter view",
    )
    .replace(
      /\bbacks? to camera\b|\bback-to-camera\b|\bfrom behind\b/gi,
      "in three-quarter view with visible faces",
    );
}

export function parseSceneBible(root) {
  const source = fs.readFileSync(
    path.join(root, "docs/scene-bible.md"),
    "utf8",
  );
  return source
    .split(/^#### /m)
    .slice(1)
    .flatMap((block) => {
      const id = block.split("\n")[0].trim();
      if (id.startsWith("<")) return [];
      const line = (label) =>
        block.match(new RegExp(`^- ${label}:\\s*(.+)$`, "m"))?.[1]?.trim();
      const prompt = line("Prompt");
      const cast = line("Characters present");
      const location = prompt?.match(/^\[ref:\s*masters\/([a-z-]+)\]/)?.[1];
      if (!prompt || !cast || !location)
        throw new Error(`${id}: incomplete scene specification`);
      const characters = CHARACTERS.filter((character) =>
        cast.includes(character.surname),
      );
      const body = visibleStaging(
        prompt
          .replace(/^\[ref:\s*masters\/[a-z-]+\]\s*/, "")
          .replace(/\.?\s*\+ scene style token\.?$/, ""),
      );
      const assetId =
        id === "advanced-time-series/ensemble-methods"
          ? "advanced-time-series/time-series-ensemble-methods"
          : id;
      return [
        {
          id,
          assetId,
          location,
          cast,
          characters,
          hasAria: /\bARIA\b/.test(cast),
          moment: line("Moment"),
          alt: line("Alt"),
          body,
          refs: characters.map(
            (character) => `docs/art-refs/deep-orbit/${character.slug}.png`,
          ),
        },
      ];
    });
}

export function faceVisiblePrompt(
  scene,
  { referenceType = "scene edit target" } = {},
) {
  const identities = scene.characters.map(
    (character, index) =>
      `Image ${index + 2} is the identity reference for ${character.name}: ${character.identity}. Preserve that exact face, hair, skin tone, age and wardrobe.`,
  );
  return [
    "Use case: identity-preserve. Asset: Deep Orbit narrative lesson illustration, landscape 3:2.",
    `Image 1 is the ${referenceType}. Preserve the recognizable room, instruments, furniture, green #6BAA8A interfaces and warm brass #A89060 trim.`,
    ...identities,
    `Show EXACTLY ${scene.characters.length} human character${scene.characters.length === 1 ? "" : "s"}: ${scene.characters.map((character) => character.name).join(", ")}. No additional people, duplicates, bystanders or background crew.`,
    scene.hasAria
      ? "ARIA is present only as an abstract green waveform inside a fixed brass ring on a screen, with no human or robot face."
      : "Do not add an AI person, robot or extra figure.",
    `Story moment: ${scene.moment}`,
    `Scene action and equipment: ${scene.body}`,
    "Replace every black shadow figure with the actual reference character. Use medium narrative framing, naturally posed three-quarter views, readable facial lighting and clearly visible eyes and expressions. The characters look at each other or their work while their faces remain visible to the viewer. Reframe closer or adjust the camera within the same room as needed. Keep the relevant story display visible. No faceless silhouettes, black cutouts, hidden faces or back-only figures. Preserve the mature women's age markers.",
    "Match the portraits' clean cel-shaded cartoon style, bold consistent linework, restrained texture and one soft key light. Screens show only wordless waveforms, charts, dials, grids and abstract shapes. Replace any existing writing or glyph-like squiggles in image 1 with clean wordless chart shapes. No letters, words, abbreviations, numerals, labels, captions, logos, watermarks or marks resembling writing anywhere. Never draw human faces on a screen.",
  ].join("\n");
}
