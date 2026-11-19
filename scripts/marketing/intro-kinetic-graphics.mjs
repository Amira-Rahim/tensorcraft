/**
 * Short title sequences for the faster Tensorcraft introduction.
 * The subject graphics identify upcoming courses, without implying that
 * these drawings are outputs from available models.
 */
import fs from "node:fs/promises";
import path from "node:path";

const C = {
  bg: "#101411",
  ink: "#f2f5ee",
  muted: "#b9cabd",
  mint: "#9cdbb7",
  green: "#6baa8a",
  brass: "#c6ac75",
  line: "#3e5848",
};

const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const ease = (t) => 1 - (1 - Math.max(0, Math.min(1, t))) ** 3;
const rect = (x, y, width, height, fill, extra = "") =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
const text = (x, y, value, size, fill = C.ink, weight = 500, mono = false) =>
  `<text x="${x}" y="${y}" font-family="${mono ? "Menlo,monospace" : "Helvetica Neue,Arial,sans-serif"}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escape(value)}</text>`;
const line = (x1, y1, x2, y2, fill = C.line, width = 2, extra = "") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="${width}" ${extra}/>`;

function canvas(content, width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1920 1080">${content}</svg>`;
}

function networkGraphic(t) {
  const nodes = [
    [1315, 340],
    [1315, 500],
    [1315, 660],
    [1515, 280],
    [1515, 440],
    [1515, 600],
    [1515, 760],
    [1720, 390],
    [1720, 650],
  ];
  let result = "";
  for (let i = 0; i < 3; i++) {
    for (let j = 3; j < 7; j++) {
      result += line(...nodes[i], ...nodes[j], C.line, 2);
    }
  }
  for (let i = 3; i < 7; i++) {
    for (let j = 7; j < 9; j++) {
      result += line(...nodes[i], ...nodes[j], C.line, 2);
    }
  }
  for (let i = 0; i < 3; i++) {
    const a = nodes[i];
    const b = nodes[3 + i];
    const p = (t * 0.62 + i * 0.29) % 1;
    result += `<circle cx="${a[0] + (b[0] - a[0]) * p}" cy="${a[1] + (b[1] - a[1]) * p}" r="5" fill="${C.mint}"/>`;
  }
  result += nodes
    .map(
      ([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="${i < 3 ? 13 : 17}" fill="${C.bg}" stroke="${i > 6 ? C.brass : C.green}" stroke-width="3"/>`,
    )
    .join("");
  return `<g opacity=".65">${result}</g>`;
}

function brandFrame(t) {
  const settle = ease(t / 0.36);
  const offset = (1 - settle) * 46;
  let content = rect(0, 0, 1920, 1080, C.bg);
  content += `<defs><radialGradient id="brandGlow"><stop stop-color="#2a4131" stop-opacity=".55"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></radialGradient></defs>`;
  content += rect(990, 100, 930, 880, "url(#brandGlow)");
  content += networkGraphic(t);
  content += rect(110, 100, 74, 74, C.mint);
  content += text(119, 153, "T_", 39, C.bg, 700, true);
  content += text(110 + offset, 430, "Tensorcraft", 126, C.ink, 700, true);
  content += text(
    110,
    573 + offset * 0.38,
    "Machine learning for",
    70,
    C.ink,
    500,
  );
  content += text(
    110,
    668 + offset * 0.38,
    "JavaScript engineers.",
    70,
    C.mint,
    500,
  );
  content += text(110, 949, "tensorcraft.app", 29, C.muted, 400, true);
  return content;
}

function visionGraphic(x, y, t) {
  let result = "";
  const scan = (t * 1.3) % 1;
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const inSubject =
        (col > 2 && col < 7 && row > 1 && row < 8) ||
        (row === 2 && col > 1 && col < 8);
      const scanBoost = Math.abs(row / 9 - scan) < 0.12 ? 0.18 : 0;
      result += rect(
        x + col * 29,
        y + row * 29,
        24,
        24,
        C.mint,
        `opacity="${(inSubject ? 0.8 : 0.12) + scanBoost}"`,
      );
    }
  }
  result += `<path d="M${x - 11},${y + 54} V${y - 11} H${x + 54} M${x + 235},${y - 11} H${x + 300} V${y + 54} M${x - 11},${y + 235} V${y + 300} H${x + 54} M${x + 235},${y + 300} H${x + 300} V${y + 235}" fill="none" stroke="${C.brass}" stroke-width="3"/>`;
  return result;
}

function textGraphic(x, y, t) {
  const words = ["incoming", "report", "received"];
  return words
    .map((word, i) => {
      const settled = ease((t - i * 0.055) / 0.4);
      const shift = (1 - settled) * (i % 2 ? -28 : 28);
      return (
        rect(x + shift, y + i * 94, [282, 230, 282][i], 68, "#23372b") +
        text(x + 19 + shift, y + 46 + i * 94, word, 31, C.mint, 400, true)
      );
    })
    .join("");
}

function generativeGraphic(x, y, t) {
  let result = "";
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const wave = 0.5 + 0.5 * Math.sin(row * 0.7 + col * 0.45 - t * 1.8);
      const fill = row + col < 10 ? C.green : C.brass;
      result += rect(
        x + col * 29,
        y + row * 29,
        27,
        27,
        fill,
        `opacity="${0.22 + wave * 0.72}"`,
      );
    }
  }
  return result;
}

function deploymentGraphic(x, y, t) {
  const nodes = [
    [32, 150],
    [150, 42],
    [150, 150],
    [150, 258],
    [285, 150],
  ];
  let result = "";
  for (const [a, b] of [
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
  ]) {
    result += line(
      x + nodes[a][0],
      y + nodes[a][1],
      x + nodes[b][0],
      y + nodes[b][1],
      C.line,
      3,
    );
  }
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.78 + i / 3) % 1;
    result += `<circle cx="${x + 32 + p * 253}" cy="${y + 150}" r="5" fill="${C.mint}"/>`;
  }
  result += nodes
    .map(([a, b], i) =>
      rect(
        x + a - 20,
        y + b - 20,
        40,
        40,
        i === 2 ? C.mint : C.bg,
        `stroke="${i === 2 ? C.mint : C.brass}" stroke-width="3"`,
      ),
    )
    .join("");
  return result;
}

function worldsFrame(t) {
  let content = rect(0, 0, 1920, 1080, C.bg);
  content += text(110, 162, "Tensorcraft worlds", 32, C.mint, 600, true);
  content += text(110, 308, "Four more worlds coming soon.", 70, C.ink, 600);
  const labels = ["Vision", "Text", "Generative", "Deployment"];
  const drawers = [
    visionGraphic,
    textGraphic,
    generativeGraphic,
    deploymentGraphic,
  ];
  for (let i = 0; i < 4; i++) {
    const x = 110 + i * 435;
    const rise = (1 - ease(Math.max(0, t - i * 0.045) / 0.35)) * 22;
    content += text(x, 450 + rise, labels[i], i < 2 ? 64 : 52, C.ink, 600);
    content += drawers[i](x + 5, 540 + rise, t);
  }
  return content;
}

/**
 * `work` is the v2 output directory. Frame sequences start at zero.
 */
export async function renderKineticGraphics({
  work,
  sharp,
  width = 1920,
  height = 1080,
  fps = 24,
}) {
  if (!work || !sharp)
    throw new Error("The work directory and sharp renderer are required.");
  await fs.mkdir(work, { recursive: true });
  const brandCount = Math.round(fps * 2.25);
  const worldsCount = Math.round(fps * 3.5);
  for (const [prefix, count, draw] of [
    ["frameBrand", brandCount, brandFrame],
    ["frameWorlds", worldsCount, worldsFrame],
  ]) {
    for (let index = 0; index < count; index++) {
      const filename = path.join(
        work,
        `${prefix}-${String(index).padStart(3, "0")}.png`,
      );
      await sharp(Buffer.from(canvas(draw(index / fps), width, height)))
        .png()
        .toFile(filename);
    }
  }
  return {
    brandPattern: path.join(work, "frameBrand-%03d.png"),
    worldsPattern: path.join(work, "frameWorlds-%03d.png"),
    brandFirstFrame: path.join(work, "frameBrand-000.png"),
    worldsRepresentative: path.join(
      work,
      `frameWorlds-${String(Math.round(fps)).padStart(3, "0")}.png`,
    ),
  };
}
