/**
 * Builds the source scenes, then applies the final 27-second pacing.
 * node scripts/marketing/build-fast-intro-video.mjs [--stills-only]
 * Training graphics describe a recorded course example, not the unknown signal.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { recordIntroModelRun } from "./intro-model-run.mjs";
import { renderKineticGraphics } from "./intro-kinetic-graphics.mjs";
import { renderRhythmicScore } from "./intro-rhythmic-score.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const WORK = path.join(ROOT, "output/tensorcraft-intro-video/v2");
const MEDIA = path.join(ROOT, "apps/web/public/media");
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", {
    paths: [path.join(ROOT, "apps/web")],
  }),
);
const sharp = nextRequire("sharp");
const W = 1920,
  H = 1080,
  FPS = 24,
  DURATION = 24;
const C = {
  bg: "#101411",
  surface: "#19231d",
  ink: "#f0f4ee",
  muted: "#c0cfc3",
  green: "#89c8a5",
  brass: "#bfaa75",
  line: "#495c4e",
};
const e = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const text = (
  x,
  y,
  value,
  size = 40,
  fill = C.ink,
  weight = 400,
  family = "Helvetica Neue,Arial,sans-serif",
) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${fill}" font-weight="${weight}" xml:space="preserve">${e(value)}</text>`;
const mono = (x, y, value, size = 40, fill = C.ink, weight = 600) =>
  text(x, y, value, size, fill, weight, "Menlo,monospace");
const rect = (x, y, w, h, fill, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const svg = (content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${content}</svg>`;
const brand = () =>
  rect(100, 72, 60, 60, C.green) +
  mono(108, 114, "T_", 31, C.bg, 700) +
  mono(183, 114, "Tensorcraft", 29, C.ink, 600);
const clamp = (value) => Math.max(0, Math.min(1, value));
function scrim(id, opacity = 0.65) {
  return (
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".25" stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg}" stop-opacity="${opacity}"/></linearGradient></defs>` +
    rect(0, 0, W, H, `url(#${id})`)
  );
}
async function png(name, content) {
  const file = path.join(WORK, name + ".png");
  await sharp(Buffer.from(svg(content)))
    .png()
    .toFile(file);
  return file;
}
function run(args) {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg failed");
}
function output(file, duration) {
  return [
    "-t",
    String(duration),
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "19",
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
    "-movflags",
    "+faststart",
    file,
  ];
}
function film(
  index,
  start,
  duration,
  titles,
  { source = "learn-trailer.mp4", contrast = 1.02, saturation = 1.04 } = {},
) {
  const file = path.join(WORK, `scene-${index}.mp4`);
  run([
    "-ss",
    String(start),
    "-t",
    String(duration),
    "-i",
    path.join(MEDIA, source),
    "-loop",
    "1",
    "-framerate",
    String(FPS),
    "-i",
    titles,
    "-filter_complex_threads",
    "2",
    "-filter_complex",
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,setpts=PTS-STARTPTS,fps=${FPS},eq=contrast=${contrast}:saturation=${saturation}[base];[1:v]format=rgba,fade=t=in:st=0:d=0.08:alpha=1[titles];[base][titles]overlay=0:0:shortest=1,format=yuv420p[v]`,
    "-map",
    "[v]",
    ...output(file, duration),
  ]);
  console.log(`Scene ${index}: ${duration}s`);
  return file;
}
function frames(index, pattern, duration) {
  const file = path.join(WORK, `scene-${index}.mp4`);
  run([
    "-framerate",
    String(FPS),
    "-start_number",
    "0",
    "-i",
    pattern,
    "-vf",
    `fps=${FPS},setsar=1,format=yuv420p`,
    ...output(file, duration),
  ]);
  console.log(`Scene ${index}: ${duration}s`);
  return file;
}

function codeFrame(progress) {
  const entered = clamp(progress / 0.3);
  const codeLines = [
    "const model = buildClassifier();",
    "",
    "await model.fit(readings, labels, {",
    "  epochs: 50, batchSize: 16",
    "});",
  ];
  let content =
    rect(0, 0, W, H, C.bg) +
    brand() +
    mono(100, 248, "Your JavaScript trains a model.", 75, C.ink, 700);
  content += text(100, 328, "Course code excerpt", 29, C.muted);
  content += rect(80, 386, 1760, 440, C.surface);
  content += rect(
    80,
    540,
    1760,
    73,
    C.green,
    `opacity="${progress > 0.55 ? 0.16 : 0.07}"`,
  );
  codeLines.forEach((line, index) => {
    const visible =
      index === 2 ? line.slice(0, Math.round(line.length * entered)) : line;
    content += mono(
      120,
      466 + index * 70,
      visible,
      49,
      index === 2 ? C.green : C.ink,
      400,
    );
  });
  const pressed = progress > 0.68;
  content +=
    rect(1480, 883, 340, 86, pressed ? C.green : C.ink) +
    mono(1512, 938, pressed ? "Running…" : "Run code", 39, C.bg, 600);
  content += text(
    100,
    990,
    "Recorded course example. Generated practice data.",
    27,
    C.muted,
  );
  return content;
}

function resultFrame(report, progress) {
  const count = Math.min(50, Math.floor(clamp(progress / 0.8) * 49) + 1);
  let content =
    rect(0, 0, W, H, C.bg) +
    brand() +
    mono(100, 245, "Your JavaScript trains a model.", 75, C.ink, 700);
  content += mono(
    100,
    332,
    "await model.fit(readings, labels, { epochs: 50, batchSize: 16 });",
    35,
    C.green,
    400,
  );
  const left = 200,
    right = 1720,
    top = 470,
    bottom = 850;
  const ceiling = Math.ceil(Math.max(...report.losses) * 10) / 10;
  content +=
    text(100, 422, "Training loss", 31, C.muted) +
    mono(1430, 422, `Epoch ${count} / 50`, 31, C.muted, 400);
  [0, 0.5, 1].forEach((f) => {
    const y = bottom - f * (bottom - top);
    content +=
      `<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="${C.line}" stroke-width="1"/>` +
      mono(105, y + 10, (ceiling * f).toFixed(2), 27, C.muted, 400);
  });
  const points = report.losses
    .slice(0, count)
    .map((loss, index) => [
      left + (index / 49) * (right - left),
      bottom - (loss / ceiling) * (bottom - top),
    ]);
  const endpoint = points.at(-1);
  content += `<polyline points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${C.green}" stroke-width="7" stroke-linejoin="round"/><circle cx="${endpoint[0]}" cy="${endpoint[1]}" r="10" fill="${C.green}"/>`;
  [1, 25, 50].forEach((epoch) => {
    content += mono(
      left + ((epoch - 1) / 49) * (right - left) - 12,
      899,
      epoch,
      27,
      C.muted,
      400,
    );
  });
  content += text(900, 940, "Epoch", 27, C.muted);
  content += text(
    100,
    1025,
    "Recorded course example. Generated practice data. Training batch only.",
    27,
    C.muted,
  );
  return content;
}

async function main() {
  await fs.mkdir(WORK, { recursive: true });
  const reuseScenes = process.argv.includes("--reuse-scenes");
  let report;
  try {
    report = JSON.parse(
      await fs.readFile(path.join(WORK, "../training-run.json"), "utf8"),
    );
  } catch {
    report = (await recordIntroModelRun()).report;
  }
  const hook = await png(
    "hook",
    scrim("hook", 0.5) +
      rect(0, 760, W, 320, C.bg) +
      mono(100, 864, "Can your JavaScript", 80, C.ink, 700) +
      mono(100, 970, "find the pattern?", 80, C.green, 700),
  );
  const world = await png(
    "deep-orbit",
    scrim("world", 0.74) +
      mono(100, 830, "Deep Orbit", 118, C.ink, 700) +
      text(100, 930, "A Tensorcraft world", 42, C.green),
  );
  const crew = await png(
    "crew",
    scrim("crew", 0.9) +
      mono(100, 920, "Help the crew investigate.", 66, C.ink, 700),
  );
  const available = await png(
    "available",
    scrim("available", 0.9) +
      mono(100, 840, "Deep Orbit is available now.", 70, C.ink, 700) +
      text(100, 928, "Build and run models in your browser.", 39, C.green),
  );
  const closing = await png(
    "closing",
    `<defs><linearGradient id="close"><stop stop-color="${C.bg}" stop-opacity=".86"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".25"/></linearGradient></defs>` +
      rect(0, 0, W, H, "url(#close)") +
      brand() +
      mono(100, 458, "Start Deep Orbit free.", 88, C.ink, 700) +
      text(
        100,
        563,
        "Five foundations lessons. No account needed.",
        40,
        C.muted,
      ) +
      mono(100, 810, "tensorcraft.app", 58, C.green, 700),
  );
  const kinetics = reuseScenes
    ? {}
    : await renderKineticGraphics({
        root: ROOT,
        work: WORK,
        sharp,
        width: W,
        height: H,
        fps: FPS,
      });
  if (!reuseScenes)
    for (let frame = 0; frame < 120; frame++) {
      const content =
        frame < 36
          ? codeFrame(frame / 35)
          : resultFrame(report, (frame - 36) / 83);
      await png(`code-${String(frame).padStart(3, "0")}`, content);
    }
  console.log("New hook, kinetic graphics and course animation ready.");
  if (process.argv.includes("--stills-only")) return;
  const segments = reuseScenes
    ? Array.from({ length: 8 }, (_, i) => path.join(WORK, `scene-${i + 1}.mp4`))
    : [
        film(1, 15.75, 2.75, hook, { source: "deep-orbit-trailer.mp4" }),
        film(2, 21, 1.5, world),
        film(3, 36, 2, crew),
        frames(4, path.join(WORK, "code-%03d.png"), 5),
        frames(5, kinetics.brandPattern, 2.25),
        frames(6, kinetics.worldsPattern, 3.5),
        film(7, 46, 2.75, available),
        film(8, 18, 4.25, closing),
      ];
  const concat = path.join(WORK, "segments.txt");
  await fs.writeFile(
    concat,
    segments
      .map((file) => `file '${file.replaceAll("'", "'\\''")}'`)
      .join("\n") + "\n",
  );
  const silent = path.join(WORK, "picture.mp4");
  run(["-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", silent]);
  const score = await renderRhythmicScore({
    work: WORK,
    duration: DURATION,
    sampleRate: 44100,
  });
  const video = path.join(MEDIA, "tensorcraft-intro.mp4");
  run([
    "-i",
    silent,
    "-i",
    score.file,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-t",
    String(DURATION),
    "-movflags",
    "+faststart",
    video,
  ]);
  const poster = path.join(WORK, "poster.png");
  run(["-ss", "0.8", "-i", video, "-frames:v", "1", poster]);
  await sharp(poster)
    .webp({ quality: 88 })
    .toFile(path.join(MEDIA, "tensorcraft-intro-poster.webp"));
  await fs.writeFile(
    path.join(MEDIA, "tensorcraft-intro.vtt"),
    `WEBVTT

00:00.000 --> 00:02.750
Can your JavaScript find the pattern?

00:02.750 --> 00:04.250
Deep Orbit. A Tensorcraft world.

00:04.250 --> 00:06.250
Help the Archimedes crew investigate the signal.

00:06.250 --> 00:11.250
Your JavaScript trains a model.
Recorded course example on generated practice data, training batch only.
Training loss does not measure performance on new readings.

00:11.250 --> 00:13.500
Tensorcraft. Machine learning for JavaScript engineers.

00:13.500 --> 00:17.000
Four more worlds are coming soon: computer vision, text,
generative models, and deployment.

00:17.000 --> 00:19.750
Deep Orbit is available now.
Build and run models in your browser.

00:19.750 --> 00:24.000
Start Deep Orbit free at tensorcraft.app.
Five foundations lessons. No account needed.
`,
  );
  await fs.writeFile(
    path.join(WORK, "production.json"),
    JSON.stringify(
      {
        version: 2,
        durationSeconds: DURATION,
        resolution: [W, H],
        fps: FPS,
        segments: [2.75, 1.5, 2, 5, 2.25, 3.5, 2.75, 4.25],
        trainingRun: "../training-run.json",
        nativeSpeedFootage: true,
        score,
        output: path.relative(ROOT, video),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      video: path.relative(ROOT, video),
      seconds: DURATION,
      MB: Math.round((await fs.stat(video)).size / 1e5) / 10,
    }),
  );
}
await main();
if (!process.argv.includes("--stills-only")) {
  await import("./refine-intro-pacing.mjs");
}
