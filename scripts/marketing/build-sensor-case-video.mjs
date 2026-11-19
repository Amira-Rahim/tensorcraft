/**
 * Builds the sensor-grouping campaign from an executed TensorFlow.js example.
 * The supplied fictional recording is the same excerpt used in the free lesson.
 * node scripts/marketing/build-sensor-case-video.mjs [--stills-only]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { createHash } from "node:crypto";
import * as tf from "@tensorflow/tfjs";
import { renderRhythmicScore } from "./intro-rhythmic-score.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const WORK = path.join(ROOT, "output/marketing/sensor-grouping-launch");
const MEDIA = path.join(ROOT, "apps/web/public/media/sensor-grouping-case");
const FIXTURE = path.join(
  ROOT,
  "apps/web/app/components/mdx/channel-layout-data.ts",
);
const FPS = 24;
const DURATION = 30;
const FRAME_COUNT = FPS * DURATION;
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", {
    paths: [path.join(ROOT, "apps/web")],
  }),
);
const sharp = nextRequire("sharp");
const C = {
  bg: "#101411",
  surface: "#19231d",
  ink: "#f0f4ee",
  muted: "#c0cfc3",
  green: "#89c8a5",
  brass: "#bfaa75",
  line: "#495c4e",
};
const FONT = "Helvetica Neue,Arial,sans-serif";
const MONO = "Menlo,monospace";
const xml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};
const mix = (a, b, p) => a + (b - a) * p;
const text = (
  x,
  y,
  value,
  size = 44,
  fill = C.ink,
  weight = 400,
  family = FONT,
  attrs = "",
) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" ${attrs}>${xml(value)}</text>`;
const rect = (x, y, w, h, fill, attrs = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${attrs}/>`;
const line = (x1, y1, x2, y2, color = C.line, width = 2, attrs = "") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${attrs}/>`;
const circle = (cx, cy, r, fill, attrs = "") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${attrs}/>`;
const poly = (points, color, width, attrs = "") =>
  `<polyline points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" ${attrs}/>`;
function lines(
  x,
  y,
  values,
  size,
  fill = C.ink,
  weight = 400,
  family = FONT,
  leading = 1.2,
) {
  return values
    .map((value, i) =>
      text(x, y + i * size * leading, value, size, fill, weight, family),
    )
    .join("");
}
function run(program, args) {
  const result = spawnSync(program, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0)
    throw new Error(result.stderr || `${program} failed`);
  return result.stdout;
}
const ffmpeg = (args) =>
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);

await fs.mkdir(WORK, { recursive: true });
await fs.mkdir(MEDIA, { recursive: true });
const fixtureSource = await fs.readFile(FIXTURE, "utf8");
const packetMatch = fixtureSource.match(
  /export const WORKED_PACKET = (\[[\s\S]*?\n\]);/,
);
if (!packetMatch) throw new Error("The authored worked packet is unavailable.");
const packet = JSON.parse(packetMatch[1].replace(/,\s*\]/g, "]"));
const packetIdentity = packet.flatMap((row, moment) =>
  row.map((value, sensor) => ({
    value,
    moment,
    sensor,
    name: String.fromCharCode(65 + sensor),
  })),
);
await tf.setBackend("cpu");
await tf.ready();
const observed = tf.tidy(() => {
  const grid = tf.tensor2d(packet);
  const reshaped = grid.reshape([4, 3]);
  const transposed = grid.transpose();
  return {
    input: grid.arraySync(),
    inputShape: grid.shape,
    reshape: reshaped.arraySync(),
    reshapeShape: reshaped.shape,
    transpose: transposed.arraySync(),
    transposeShape: transposed.shape,
  };
});
if (
  JSON.stringify(observed.reshape[0]) !== "[2,20,5]" ||
  JSON.stringify(observed.transpose[0]) !== "[2,3,4]"
)
  throw new Error("The campaign no longer matches the authored fixture.");

const SCENES = [
  {
    start: 0,
    end: 3.5,
    kind: "hook",
    caption: "Did sensor A really spike?\nThe chart shows 2, 20, 5.",
  },
  {
    start: 3.5,
    end: 7.5,
    kind: "recording",
    caption:
      "The supplied fictional recording lists sensors A, B, C, D at each moment.\nSensor A actually reads 2, 3, 4.",
  },
  {
    start: 7.5,
    end: 11.5,
    kind: "predict",
    caption:
      "Which operation keeps each sensor together?\nreshape([4, 3]) or transpose()?",
  },
  {
    start: 11.5,
    end: 16.5,
    kind: "reshape",
    caption:
      "reshape([4, 3]) gives the first row [2, 20, 5].\n20 belongs to B. 5 belongs to C.",
  },
  {
    start: 16.5,
    end: 22,
    kind: "transpose",
    caption:
      "transpose() groups sensor A's readings in time order: [2, 3, 4].\nBoth outputs have shape [4, 3].",
  },
  {
    start: 22,
    end: 26,
    kind: "meaning",
    caption:
      "Shape tells you the dimensions.\nThe recording header tells you what they mean. This is data preparation for ML.",
  },
  {
    start: 26,
    end: 30,
    kind: "cta",
    caption:
      "Try this case in Deep Orbit, Tensorcraft's first available world.\nFirst 5 lessons free. No account needed. tensorcraft.app",
  },
];

function brand(w, h, portrait) {
  const x = portrait ? 80 : 100;
  const y = portrait ? 100 : 65;
  const unit = portrait ? 54 : 46;
  return (
    rect(x, y - unit * 0.72, unit, unit, C.green) +
    text(x + 7, y + unit * 0.04, "T_", unit * 0.53, C.bg, 700, MONO) +
    text(
      x + unit + 22,
      y + unit * 0.04,
      "Tensorcraft",
      portrait ? 34 : 29,
      C.ink,
      600,
      MONO,
    ) +
    text(
      x,
      h - (portrait ? 135 : 55),
      "Deep Orbit. A Tensorcraft world.",
      portrait ? 30 : 24,
      C.muted,
      400,
    )
  );
}
function chart(
  x,
  y,
  w,
  h,
  values,
  {
    portrait,
    label = "Chart says Sensor A",
    color = C.brass,
    ghost = null,
    draw = 1,
    labelValues = values,
  } = {},
) {
  const left = x + 70,
    right = x + w - 40,
    top = y + 80,
    bottom = y + h - 80;
  const size = portrait ? 34 : 28;
  let out = text(x, y + 25, label, portrait ? 39 : 33, C.muted);
  [0, 10, 20].forEach((n) => {
    const py = bottom - (n / 22) * (bottom - top);
    out += line(left, py, right, py, C.line, 1.5, 'opacity=".6"');
    out += text(
      left - 22,
      py + 9,
      n,
      size - 4,
      C.muted,
      400,
      FONT,
      'text-anchor="end"',
    );
  });
  const points = (data) =>
    data.map((value, i) => [
      left + (i * (right - left)) / 2,
      bottom - (value / 22) * (bottom - top),
    ]);
  if (ghost) out += poly(points(ghost), C.line, 5, 'stroke-dasharray="10 12"');
  const ps = points(values);
  const length =
    Math.sqrt((ps[1][0] - ps[0][0]) ** 2 + (ps[1][1] - ps[0][1]) ** 2) +
    Math.sqrt((ps[2][0] - ps[1][0]) ** 2 + (ps[2][1] - ps[1][1]) ** 2);
  out += poly(
    ps,
    color,
    portrait ? 8 : 7,
    `stroke-dasharray="${length}" stroke-dashoffset="${length * (1 - clamp(draw))}"`,
  );
  ps.forEach(([px, py], i) => {
    out += circle(px, py, portrait ? 12 : 10, color);
    if (labelValues)
      out += text(
        px,
        py - 28,
        labelValues[i],
        portrait ? 57 : 48,
        C.ink,
        600,
        MONO,
        'text-anchor="middle"',
      );
    out += text(
      px,
      bottom + 55,
      "Moment " + (i + 1),
      size,
      C.muted,
      400,
      FONT,
      'text-anchor="middle"',
    );
  });
  return out;
}
function recording(x, y, w, { portrait, p = 1 } = {}) {
  const head = portrait ? 38 : 30;
  const row = portrait ? 80 : 68;
  const label = portrait ? 140 : 120;
  const cell = (w - label) / 4;
  let out = text(
    x,
    y,
    "Recording header: A, B, C, D",
    portrait ? 38 : 32,
    C.muted,
  );
  out += text(
    x,
    y + 56,
    "Supplied fictional excerpt",
    portrait ? 30 : 25,
    C.muted,
  );
  for (let s = 0; s < 4; s++)
    out += text(
      x + label + cell * s + cell / 2,
      y + 125,
      String.fromCharCode(65 + s),
      head,
      s === 0 ? C.green : C.muted,
      600,
      MONO,
      'text-anchor="middle"',
    );
  packet.forEach((values, moment) => {
    const cy = y + 172 + row * moment;
    out += text(
      x,
      cy + 12,
      "Moment " + (moment + 1),
      portrait ? 31 : 25,
      C.muted,
    );
    out += rect(
      x + label,
      cy - 40,
      cell - 8,
      row - 13,
      C.green,
      'opacity=".12"',
    );
    values.forEach(
      (value, s) =>
        (out += text(
          x + label + cell * s + cell / 2,
          cy + 12,
          value,
          portrait ? 50 : 40,
          s === 0 ? C.green : C.ink,
          s === 0 ? 600 : 400,
          MONO,
          'text-anchor="middle"',
        )),
    );
  });
  return `<g opacity="${p}">${out}</g>`;
}
function valueChips(x, y, w, values, identities, portrait) {
  const gap = portrait ? 20 : 18;
  const cw = (w - gap * 2) / 3;
  const ch = portrait ? 135 : 116;
  return values
    .map(
      (value, i) =>
        rect(x + i * (cw + gap), y, cw, ch, C.surface) +
        text(
          x + i * (cw + gap) + cw / 2,
          y + 43,
          "Sensor " + identities[i],
          portrait ? 31 : 26,
          identities[i] === "A" ? C.green : C.brass,
          400,
          FONT,
          'text-anchor="middle"',
        ) +
        text(
          x + i * (cw + gap) + cw / 2,
          y + ch - 25,
          value,
          portrait ? 61 : 54,
          C.ink,
          600,
          MONO,
          'text-anchor="middle"',
        ),
    )
    .join("");
}
function movingGrid(x, y, w, progress, portrait) {
  const margin = portrait ? 110 : 110;
  const gap = portrait ? 12 : 12;
  const cellW = (w - margin - gap * 3) / 4;
  const cellH = portrait ? 76 : 64;
  const targetW = (w - margin - gap * 2) / 3;
  const out = packetIdentity
    .map((item, index) => {
      const dx = x + margin + item.sensor * (cellW + gap);
      const dy = y + item.moment * (cellH + gap);
      const tx = x + margin + item.moment * (targetW + gap);
      const ty = y + item.sensor * (cellH + gap);
      const px = mix(dx, tx, progress),
        py = mix(dy, ty, progress);
      const cw = mix(cellW, targetW, progress);
      const fill = item.sensor === 0 ? C.green : C.surface;
      const ink = item.sensor === 0 ? C.bg : C.ink;
      return (
        rect(px, py, cw, cellH, fill) +
        text(
          px + cw / 2,
          py + cellH / 2 + (portrait ? 12 : 10),
          item.name + ": " + item.value,
          portrait ? 38 : 30,
          ink,
          item.sensor === 0 ? 600 : 400,
          MONO,
          'text-anchor="middle"',
        )
      );
    })
    .join("");
  let labels = "";
  if (progress < 0.15)
    for (let r = 0; r < 3; r++)
      labels += text(
        x,
        y + r * (cellH + gap) + cellH / 2 + 9,
        "Moment " + (r + 1),
        portrait ? 27 : 24,
        C.muted,
      );
  if (progress > 0.85)
    for (let r = 0; r < 4; r++)
      labels += text(
        x,
        y + r * (cellH + gap) + cellH / 2 + 9,
        "Sensor " + String.fromCharCode(65 + r),
        portrait ? 27 : 24,
        r === 0 ? C.green : C.muted,
      );
  return out + labels;
}
function drawScene(kind, local, spec) {
  const { width: W, height: H, portrait } = spec;
  const m = portrait ? 80 : 100;
  const cw = W - m * 2;
  const titleY = portrait ? 285 : 215;
  const titleSize = portrait ? 78 : 83;
  let content = "";
  if (kind === "hook") {
    content += lines(
      m,
      titleY,
      portrait
        ? ["Did sensor A", "really spike?"]
        : ["Did sensor A really spike?"],
      titleSize,
      C.ink,
      700,
      MONO,
    );
    content += chart(
      m,
      portrait ? 570 : 340,
      portrait ? cw : 1120,
      portrait ? 850 : 575,
      observed.reshape[0],
      { portrait },
    );
    if (portrait)
      content += text(m, 1605, "Check it against the recording.", 40, C.muted);
    else
      content += lines(
        1320,
        500,
        ["The chart shows", "2, 20, 5.", "", "Check the recording."],
        40,
        C.muted,
        400,
        FONT,
        1.3,
      );
  } else if (kind === "recording") {
    content += lines(
      m,
      titleY,
      portrait
        ? ["Follow sensor A", "through the recording."]
        : ["Follow sensor A through the recording."],
      portrait ? 67 : 65,
      C.ink,
      600,
    );
    content += recording(m, portrait ? 580 : 355, portrait ? cw : 940, {
      portrait,
    });
    content += chart(
      portrait ? m : 1160,
      portrait ? 1040 : 355,
      portrait ? cw : 660,
      portrait ? 510 : 490,
      observed.transpose[0],
      { portrait, label: "Sensor A: 2, 3, 4", color: C.green },
    );
    if (portrait)
      content += text(m, 1630, "Each column follows one sensor.", 38, C.muted);
    else
      content += text(m, 900, "Each column follows one sensor.", 38, C.muted);
  } else if (kind === "predict") {
    content += lines(
      m,
      titleY,
      portrait
        ? ["Which operation keeps", "each sensor together?"]
        : ["Which operation keeps each sensor together?"],
      portrait ? 65 : 65,
      C.ink,
      600,
    );
    content += text(
      m,
      portrait ? 555 : 350,
      "We need one row per sensor.",
      portrait ? 40 : 39,
      C.muted,
    );
    const optionY = portrait ? 705 : 455;
    const optionW = portrait ? cw : 820;
    content += rect(m, optionY, optionW, portrait ? 170 : 155, C.surface);
    content += text(
      m + 36,
      optionY + (portrait ? 102 : 94),
      "grid.reshape([4, 3])",
      portrait ? 48 : 50,
      C.ink,
      500,
      MONO,
    );
    const secondY = portrait ? optionY + 225 : optionY;
    const secondX = portrait ? m : m + optionW + 60;
    content += rect(secondX, secondY, optionW, portrait ? 170 : 155, C.surface);
    content += text(
      secondX + 36,
      secondY + (portrait ? 102 : 94),
      "grid.transpose()",
      portrait ? 48 : 50,
      C.ink,
      500,
      MONO,
    );
    content += text(
      m,
      portrait ? 1290 : 745,
      "Both return shape [4, 3].",
      portrait ? 43 : 40,
      C.muted,
    );
    content += text(
      m,
      portrait ? 1370 : 812,
      "Have a prediction before we run them.",
      portrait ? 37 : 36,
      C.muted,
    );
    const p = clamp(local / 4);
    content +=
      rect(m, portrait ? 1550 : 900, cw, 6, C.surface) +
      rect(m, portrait ? 1550 : 900, cw * p, 6, C.green);
  } else if (kind === "reshape") {
    content += lines(
      m,
      titleY,
      portrait
        ? ["The first row mixes", "three sensors."]
        : ["The first row mixes three sensors."],
      portrait ? 70 : 75,
      C.ink,
      600,
    );
    content += text(
      m,
      portrait ? 540 : 350,
      "grid.reshape([4, 3])",
      portrait ? 49 : 49,
      C.brass,
      500,
      MONO,
    );
    content += valueChips(
      m,
      portrait ? 660 : 435,
      portrait ? cw : 1040,
      observed.reshape[0],
      ["A", "B", "C"],
      portrait,
    );
    content += chart(
      portrait ? m : 1210,
      portrait ? 960 : 330,
      portrait ? cw : 610,
      portrait ? 560 : 480,
      observed.reshape[0],
      { portrait, label: "Row 1 used as sensor A" },
    );
    content += lines(
      m,
      portrait ? 1590 : 725,
      [
        "20 belongs to B. 5 belongs to C.",
        "Reshape keeps the flat-list order.",
      ],
      portrait ? 38 : 37,
      C.muted,
      400,
      FONT,
      1.5,
    );
  } else if (kind === "transpose") {
    content += lines(
      m,
      titleY,
      portrait
        ? ["Transpose groups", "the sensor readings."]
        : ["Transpose groups the sensor readings."],
      portrait ? 68 : 70,
      C.ink,
      600,
    );
    content += text(
      m,
      portrait ? 535 : 350,
      "grid.transpose()",
      portrait ? 49 : 49,
      C.green,
      500,
      MONO,
    );
    const p = ease((local - 0.3) / 1.4);
    content += movingGrid(
      m,
      portrait ? 670 : 435,
      portrait ? cw : 1000,
      p,
      portrait,
    );
    const vals = observed.reshape[0].map((v, i) =>
      mix(v, observed.transpose[0][i], p),
    );
    content += chart(
      portrait ? m : 1220,
      portrait ? 1120 : 370,
      portrait ? cw : 600,
      portrait ? 435 : 430,
      vals,
      {
        portrait,
        label: p > 0.8 ? "Sensor A in time order" : "Following sensor A",
        color: C.green,
        ghost: observed.reshape[0],
        labelValues: p >= 1 ? observed.transpose[0] : null,
      },
    );
    content += text(
      m,
      portrait ? 1640 : 865,
      "Sensor A: [2, 3, 4]",
      portrait ? 48 : 45,
      C.green,
      600,
      MONO,
    );
  } else if (kind === "meaning") {
    content += lines(
      m,
      titleY,
      portrait
        ? ["The dimensions match.", "The groupings differ."]
        : ["The dimensions match. The groupings differ."],
      portrait ? 65 : 67,
      C.ink,
      600,
    );
    const y = portrait ? 650 : 440;
    content += rect(m, y, cw, portrait ? 380 : 245, C.surface);
    content += text(
      m + 42,
      y + (portrait ? 95 : 80),
      "reshape([4, 3])",
      portrait ? 42 : 43,
      C.brass,
      500,
      MONO,
    );
    content += text(
      m + 42,
      y + (portrait ? 170 : 150),
      "[2, 20, 5]",
      portrait ? 53 : 49,
      C.ink,
      600,
      MONO,
    );
    content += text(
      portrait ? m + 42 : m + 900,
      y + (portrait ? 265 : 80),
      "transpose()",
      portrait ? 42 : 43,
      C.green,
      500,
      MONO,
    );
    content += text(
      portrait ? m + 42 : m + 900,
      y + (portrait ? 340 : 150),
      "[2, 3, 4]",
      portrait ? 53 : 49,
      C.ink,
      600,
      MONO,
    );
    content += lines(
      m,
      portrait ? 1195 : 800,
      portrait
        ? [
            "Shape tells you the dimensions.",
            "The header tells you their meaning.",
            "",
            "This is data preparation for ML.",
          ]
        : [
            "Shape tells you the dimensions. The header tells you their meaning.",
            "This is data preparation for ML.",
          ],
      portrait ? 39 : 37,
      C.muted,
      400,
      FONT,
      1.5,
    );
  } else if (kind === "cta") {
    content += lines(
      m,
      portrait ? 390 : 310,
      portrait
        ? ["Try the case", "in Deep Orbit."]
        : ["Try the case in Deep Orbit."],
      portrait ? 87 : 95,
      C.ink,
      700,
      MONO,
    );
    content += lines(
      m,
      portrait ? 690 : 485,
      portrait
        ? [
            "Tensorcraft’s first available world.",
            "Machine learning through",
            "stories and JavaScript.",
          ]
        : [
            "Tensorcraft’s first available world.",
            "Machine learning through stories and JavaScript.",
          ],
      portrait ? 42 : 43,
      C.muted,
      400,
      FONT,
      1.4,
    );
    content += valueChips(
      m,
      portrait ? 1040 : 695,
      portrait ? cw : 800,
      observed.transpose[0],
      ["A", "A", "A"],
      portrait,
    );
    content += lines(
      m,
      portrait ? 1370 : 940,
      portrait
        ? ["First 5 lessons free.", "No account needed."]
        : ["First 5 lessons free. No account needed."],
      portrait ? 45 : 37,
      C.muted,
      400,
      FONT,
      1.4,
    );
    content += text(
      portrait ? m : 1180,
      portrait ? 1585 : 780,
      "tensorcraft.app",
      portrait ? 72 : 68,
      C.green,
      600,
      MONO,
    );
  }
  return content;
}
function frameAt(t, spec) {
  const { width: W, height: H, portrait } = spec;
  const i = SCENES.findIndex((s) => t >= s.start && t < s.end);
  const index = i < 0 ? SCENES.length - 1 : i;
  const scene = SCENES[index];
  const transition = 0.24;
  let body;
  if (index > 0 && t - scene.start < transition) {
    const elapsed = t - scene.start;
    const half = transition / 2;
    if (elapsed < half) {
      body = `<g opacity="${1 - ease(elapsed / half)}">${drawScene(SCENES[index - 1].kind, SCENES[index - 1].end - SCENES[index - 1].start, spec)}</g>`;
    } else {
      body = `<g opacity="${ease((elapsed - half) / half)}">${drawScene(scene.kind, elapsed, spec)}</g>`;
    }
  } else body = drawScene(scene.kind, t - scene.start, spec);
  const provenance =
    scene.kind === "recording"
      ? ""
      : text(
          portrait ? 80 : 100,
          H - (portrait ? 82 : 20),
          "Supplied fictional excerpt. Sensors A to D, moments 1 to 3.",
          portrait ? 24 : 20,
          C.muted,
        );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${rect(0, 0, W, H, C.bg)}${brand(W, H, portrait)}${body}${provenance}</svg>`;
}
const SPECS = [
  { name: "vertical", width: 1080, height: 1920, portrait: true },
  { name: "landscape", width: 1920, height: 1080, portrait: false },
];
const checkTimes = [1.5, 5.6, 9.3, 14.2, 19.7, 24, 28];
for (const spec of SPECS) {
  const plates = [];
  const thumbWidth = spec.portrait ? 360 : 640;
  const thumbHeight = spec.portrait ? 640 : 360;
  for (let i = 0; i < checkTimes.length; i++) {
    const frame = await sharp(Buffer.from(frameAt(checkTimes[i], spec)))
      .png()
      .toBuffer();
    await fs.writeFile(path.join(WORK, `${spec.name}-check-${i}.png`), frame);
    plates.push({
      input: await sharp(frame)
        .resize(thumbWidth, thumbHeight)
        .png()
        .toBuffer(),
      left: (i % 4) * thumbWidth,
      top: Math.floor(i / 4) * thumbHeight,
    });
  }
  await sharp({
    create: {
      width: thumbWidth * 4,
      height: thumbHeight * 2,
      channels: 3,
      background: C.bg,
    },
  })
    .composite(plates)
    .jpeg({ quality: 92 })
    .toFile(path.join(WORK, `${spec.name}-contact.jpg`));
}
if (process.argv.includes("--stills-only")) {
  console.log("Campaign stills rendered for review.");
  process.exit(0);
}

await renderRhythmicScore({ work: WORK, duration: DURATION });
for (const spec of SPECS) {
  const picture = path.join(WORK, `${spec.name}-picture.mp4`);
  const encoder = spawn(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(FPS),
      "-i",
      "pipe:0",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-threads",
      "4",
      "-pix_fmt",
      "yuv420p",
      "-color_range",
      "tv",
      "-colorspace",
      "bt709",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-r",
      String(FPS),
      "-frames:v",
      String(FRAME_COUNT),
      "-movflags",
      "+faststart",
      picture,
    ],
    { cwd: ROOT, stdio: ["pipe", "ignore", "pipe"] },
  );
  let error = "";
  encoder.stderr.on("data", (chunk) => {
    error += chunk.toString();
  });
  const completion = once(encoder, "close");
  for (let frame = 0; frame < FRAME_COUNT; frame++) {
    const png = await sharp(Buffer.from(frameAt(frame / FPS, spec)))
      .png()
      .toBuffer();
    if (!encoder.stdin.write(png)) await once(encoder.stdin, "drain");
    if (frame % 120 === 0)
      console.log(`${spec.name}: frame ${frame}/${FRAME_COUNT}`);
  }
  encoder.stdin.end();
  const [code] = await completion;
  if (code !== 0) throw new Error(error || "Video encoder failed");
  const output = path.join(MEDIA, `sensor-grouping-${spec.name}.mp4`);
  ffmpeg([
    "-i",
    picture,
    "-i",
    path.join(WORK, "rhythmic-score.wav"),
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-af",
    "volume=0.38,afade=t=out:st=28.6:d=1.4",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-t",
    String(DURATION),
    "-movflags",
    "+faststart",
    output,
  ]);
  ffmpeg(["-i", output, "-f", "null", "-"]);
  const probe = JSON.parse(
    run("ffprobe", [
      "-v",
      "quiet",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      output,
    ]),
  );
  const stream = probe.streams.find((s) => s.codec_type === "video");
  if (
    stream.width !== spec.width ||
    stream.height !== spec.height ||
    Number(stream.nb_frames) !== FRAME_COUNT ||
    Math.abs(Number(probe.format.duration) - DURATION) > 0.05
  )
    throw new Error("Unexpected encoded dimensions or timing");
  console.log(
    JSON.stringify({
      format: spec.name,
      seconds: probe.format.duration,
      frames: stream.nb_frames,
      width: stream.width,
      height: stream.height,
      bytes: (await fs.stat(output)).size,
    }),
  );
}
await sharp(Buffer.from(frameAt(1.5, SPECS[0])))
  .resize(1080, 1920)
  .webp({ quality: 90 })
  .toFile(path.join(MEDIA, "poster.webp"));
function vttTime(seconds) {
  const millis = Math.round(seconds * 1000);
  return `00:${String(Math.floor(millis / 60000)).padStart(2, "0")}:${String(Math.floor(millis / 1000) % 60).padStart(2, "0")}.${String(millis % 1000).padStart(3, "0")}`;
}
await fs.writeFile(
  path.join(MEDIA, "captions.vtt"),
  "WEBVTT\n\n" +
    SCENES.map(
      (scene) =>
        `${vttTime(scene.start)} --> ${vttTime(scene.end)}\n${scene.caption}`,
    ).join("\n\n") +
    "\n",
);
await fs.writeFile(
  path.join(WORK, "production.json"),
  JSON.stringify(
    {
      durationSeconds: DURATION,
      fps: FPS,
      frameCount: FRAME_COUNT,
      tfVersion: tf.version.tfjs,
      tfBackend: tf.getBackend(),
      fixture: path.relative(ROOT, FIXTURE),
      fixtureSha256: createHash("sha256").update(fixtureSource).digest("hex"),
      provenance:
        "Supplied authored fictional recording excerpt. No physical anomaly, trained model, or learner outcome is claimed.",
      observed,
      timeline: SCENES,
      audio:
        "Original synthesized Tensorcraft rhythmic score, volume 0.38, ending fade",
      formats: SPECS,
      tensorsAfterRun: tf.memory().numTensors,
    },
    null,
    2,
  ) + "\n",
);
console.log("Sensor campaign assets and provenance are ready.");
