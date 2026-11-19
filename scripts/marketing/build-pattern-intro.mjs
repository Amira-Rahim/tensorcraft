/**
 * Builds a short silent-ready film for the Tensorcraft pattern experience.
 * Character footage is original Deep Orbit footage. The training chart comes
 * from an executed supplied course solution on generated practice data.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { recordIntroModelRun } from "./intro-model-run.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const WORK = path.join(ROOT, "output/marketing/pattern-intro");
const MEDIA = path.join(ROOT, "apps/web/public/media/pattern-intro");
const SOURCE = path.join(ROOT, "apps/web/public/media/learn-trailer.mp4");
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", {
    paths: [path.join(ROOT, "apps/web")],
  }),
);
const sharp = nextRequire("sharp");
const W = 1280,
  H = 720,
  FPS = 24;
const C = {
  bg: "#101a24",
  panel: "#172831",
  ink: "#f4efdf",
  muted: "#c0cfc8",
  mint: "#9ad8be",
  amber: "#e8b778",
};
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const text = (
  x,
  y,
  value,
  size = 36,
  fill = C.ink,
  weight = 400,
  font = "Helvetica Neue,Arial,sans-serif",
) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="${font}" font-size="${size}" font-weight="${weight}">${escape(value)}</text>`;
const rect = (x, y, w, h, fill, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
function run(args) {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg failed");
}
function encode(file, duration) {
  return [
    "-t",
    String(duration),
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
    "-map_metadata",
    "-1",
    "-movflags",
    "+faststart",
    file,
  ];
}
async function png(name, body) {
  const file = path.join(WORK, name + ".png");
  await sharp(Buffer.from(svg(body)))
    .png()
    .toFile(file);
  return file;
}
function brand() {
  return (
    rect(54, 44, 41, 41, C.mint, "rx='2'") +
    text(61, 73, "T_", 24, C.bg, 700, "Menlo,monospace") +
    text(110, 74, "Tensorcraft", 24, C.ink, 700)
  );
}
function scrim() {
  return (
    `<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}" stop-opacity=".2"/><stop offset=".45" stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".94"/></linearGradient></defs>` +
    rect(0, 0, W, H, "url(#shade)")
  );
}
function film(index, start, duration, overlay) {
  const output = path.join(WORK, `segment-${index}.mp4`);
  const fadeOut =
    index === 4 ? "" : `,fade=t=out:st=${duration - 0.27}:d=0.15:alpha=1`;
  run([
    "-ss",
    String(start),
    "-t",
    String(duration),
    "-i",
    SOURCE,
    "-loop",
    "1",
    "-framerate",
    String(FPS),
    "-i",
    overlay,
    "-filter_complex_threads",
    "2",
    "-filter_complex",
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,setpts=PTS-STARTPTS,fps=${FPS}[base];[1:v]format=rgba,fade=t=in:st=0:d=0.16:alpha=1${fadeOut}[words];[base][words]overlay=0:0:shortest=1,format=yuv420p[v]`,
    "-map",
    "[v]",
    ...encode(output, duration),
  ]);
  return output;
}
function codeFrame(report, p) {
  const mono = "Menlo,monospace";
  const code = [
    "await model.fit(readings, labels, {",
    "  epochs: 50, batchSize: 16",
    "});",
  ];
  let body =
    rect(0, 0, W, H, C.bg) +
    brand() +
    text(60, 178, "You write the JavaScript.", 53, C.ink, 700);
  body += rect(60, 222, 1160, 260, C.panel, "rx='10'");
  const typed = Math.min(1, p / 0.22);
  code.forEach((line, i) => {
    body += text(
      88,
      294 + i * 66,
      i === 0 ? line.slice(0, Math.round(line.length * typed)) : line,
      35,
      i === 0 ? C.mint : C.ink,
      400,
      mono,
    );
  });
  const count = Math.min(50, Math.max(1, Math.ceil(p * 50)));
  const left = 490,
    right = 1200,
    top = 520,
    bottom = 642;
  const maximum = Math.max(...report.losses) * 1.1;
  body +=
    text(60, 544, "Training loss", 23, C.muted) +
    text(60, 580, `Recorded epoch ${count} of 50`, 23, C.mint);
  body += `<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#43545c" stroke-width="1"/>`;
  const points = report.losses
    .slice(0, count)
    .map((loss, i) => [
      left + (i / 49) * (right - left),
      bottom - (loss / maximum) * (bottom - top),
    ]);
  body += `<polyline points="${points.map((point) => point.join(",")).join(" ")}" fill="none" stroke="${C.mint}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  body += text(
    60,
    689,
    "Recorded course run. Generated practice data. Training batch only.",
    21,
    C.muted,
  );
  return body;
}
async function makeStills(output) {
  const posterFile = path.join(WORK, "poster.png");
  // 3.6 s: Mirza on screen with her line and her eyes open (3.3 s caught a
  // blink once the second shot starts at 36.05).
  run(["-ss", "3.6", "-i", output, "-frames:v", "1", posterFile]);
  await sharp(posterFile)
    .webp({ quality: 88 })
    .toFile(path.join(MEDIA, "poster.webp"));
  const source = path.join(WORK, "share-background.png");
  run(["-ss", "36", "-i", SOURCE, "-frames:v", "1", source]);
  const data = (await fs.readFile(source)).toString("base64");
  const share = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="fade"><stop stop-color="${C.bg}" stop-opacity=".96"/><stop offset=".6" stop-color="${C.bg}" stop-opacity=".74"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".15"/></linearGradient></defs>
  <image href="data:image/png;base64,${data}" x="0" y="-22" width="1200" height="675"/>
  ${rect(0, 0, 1200, 630, "url(#fade)")}${brand()}
  ${text(56, 278, "Machine learning", 72, C.ink, 700)}
  ${text(56, 366, "with JavaScript.", 72, C.ink, 700)}
  ${text(56, 435, "Interactive stories from Tensorcraft.", 27, C.muted)}
  ${text(56, 563, "Deep Orbit is the first world.", 24, C.mint)}
  </svg>`;
  await sharp(Buffer.from(share))
    .webp({ quality: 90 })
    .toFile(path.join(MEDIA, "share.webp"));
}
async function main() {
  await fs.mkdir(WORK, { recursive: true });
  await fs.mkdir(MEDIA, { recursive: true });
  const reuseScenes = process.argv.includes("--closing-only");
  // --footage-only re-cuts the film segments but keeps the recorded training
  // run and its code frames, so the numbers on screen do not change.
  const reuseRun = reuseScenes || process.argv.includes("--footage-only");
  const { report } = reuseRun
    ? {
        report: JSON.parse(
          await fs.readFile(path.join(WORK, "training-run.json"), "utf8"),
        ),
      }
    : await recordIntroModelRun(
        "output/marketing/pattern-intro/training-run.json",
      );
  const first = await png(
    "opening",
    scrim() +
      brand() +
      text(58, 594, "A signal the ship’s rules", 47, C.ink, 700) +
      text(58, 654, "cannot explain.", 47, C.ink, 700),
  );
  const second = await png(
    "request",
    scrim() +
      brand() +
      text(58, 529, "Commander Mirza", 23, C.mint, 500) +
      text(58, 589, "“Then we need a system that can", 40, C.ink, 600) +
      text(58, 645, "learn from examples.”", 40, C.ink, 600),
  );
  const closing = await png(
    "closing",
    `<defs><linearGradient id="close"><stop stop-color="${C.bg}" stop-opacity=".92"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".3"/></linearGradient></defs>` +
      rect(0, 0, W, H, "url(#close)") +
      brand() +
      text(60, 315, "Deep Orbit", 76, C.ink, 700) +
      text(60, 379, "Tensorcraft’s first story world.", 33, C.muted) +
      text(60, 475, "First 5 lessons free.", 38, C.mint, 600) +
      text(60, 520, "No account needed.", 30, C.ink),
  );
  const frames = 78;
  for (let frame = 0; !reuseRun && frame < frames; frame++)
    await png(
      `code-${String(frame).padStart(3, "0")}`,
      codeFrame(report, frame / (frames - 1)),
    );
  const segments = reuseScenes
    ? [1, 2].map((index) => path.join(WORK, `segment-${index}.mp4`))
    : // 36.05, not 35.7: earlier frames still show the "11 MODULES / 56
      // LESSONS" sign under Mirza's line (audit 2026-11-12).
      [film(1, 21, 3.25, first), film(2, 36.05, 4.25, second)];
  const codeFile = path.join(WORK, "segment-3.mp4");
  if (!reuseRun)
    run([
      "-framerate",
      String(FPS),
      "-start_number",
      "0",
      "-i",
      path.join(WORK, "code-%03d.png"),
      "-vf",
      `fps=${FPS},setsar=1,format=yuv420p`,
      ...encode(codeFile, 3.25),
    ]);
  segments.push(codeFile);
  segments.push(film(4, 44.7, 4, closing));
  const output = path.join(MEDIA, "intro.mp4");
  run([
    ...segments.flatMap((file) => ["-i", file]),
    "-filter_complex_threads",
    "2",
    "-filter_complex",
    "[0:v][1:v]xfade=transition=fade:duration=0.25:offset=3[v1];[v1][2:v]xfade=transition=fade:duration=0.25:offset=7[v2];[v2][3:v]xfade=transition=fade:duration=0.25:offset=10,format=yuv420p[v]",
    "-map",
    "[v]",
    ...encode(output, 14),
  ]);
  await makeStills(output);
  await fs.writeFile(
    path.join(MEDIA, "captions.vtt"),
    `WEBVTT

00:00.000 --> 00:03.000
A signal the ship’s rules cannot explain.

00:03.000 --> 00:07.000
Commander Mirza: “Then we need a system that can learn from examples.”

00:07.000 --> 00:10.000
You write the JavaScript.
Recorded course run. Generated practice data. Training batch only.

00:10.000 --> 00:14.000
Deep Orbit, Tensorcraft’s first story world.
First five lessons free. No account needed.
`,
  );
  run(["-i", output, "-f", "null", "-"]);
  run([
    "-i",
    output,
    "-vf",
    "fps=1/2,scale=384:-1,tile=4x2",
    "-frames:v",
    "1",
    path.join(WORK, "contact.jpg"),
  ]);
  const production = {
    date: "2026-11-11",
    durationSeconds: 14,
    resolution: [W, H],
    fps: FPS,
    audio: false,
    sourceFootage: "apps/web/public/media/learn-trailer.mp4",
    footageSegments: [
      { start: 21, duration: 3.25 },
      { start: 36.05, duration: 4.25 },
      { source: "executed course run", duration: 3.25 },
      { start: 44.7, duration: 4 },
    ],
    transitions: { kind: "short dissolve", duration: 0.25 },
    closingSafeArea: {
      offerBaselineY: 475,
      accountNoteBaselineY: 520,
      canvasHeight: 720,
      finalOfferHeld: true,
    },
    provenance:
      "Original animated Deep Orbit footage, canonical Mirza line, actual supplied course training run. No new scientific discovery.",
    trainingReport: "training-run.json",
    publicVideo: path.relative(ROOT, output),
  };
  await fs.writeFile(
    path.join(WORK, "production.json"),
    JSON.stringify(production, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      video: path.relative(ROOT, output),
      seconds: 14,
      bytes: (await fs.stat(output)).size,
      poster: path.relative(ROOT, path.join(MEDIA, "poster.webp")),
      captions: path.relative(ROOT, path.join(MEDIA, "captions.vtt")),
    }),
  );
}
if (process.argv.includes("--stills-only")) {
  await makeStills(path.join(MEDIA, "intro.mp4"));
} else {
  await main();
}
