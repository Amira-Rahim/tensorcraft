/**
 * Builds the 40-second Tensorcraft and Deep Orbit introduction.
 * Uses existing approved footage, authored title graphics, and a recorded
 * course-solution training run. No generated prediction or accuracy claims.
 *
 * node scripts/marketing/build-intro-video.mjs [--stills-only]
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
const WORK = path.join(ROOT, "output/tensorcraft-intro-video");
const MEDIA = path.join(ROOT, "apps/web/public/media");
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", {
    paths: [path.join(ROOT, "apps/web")],
  }),
);
const sharp = nextRequire("sharp");
const W = 1920;
const H = 1080;
const FPS = 24;
const C = {
  bg: "#101411",
  surface: "#19201b",
  ink: "#f0f4ee",
  muted: "#b8c7bb",
  green: "#6baa8a",
  brass: "#a89060",
  line: "#3d4e42",
};

const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const text = (
  x,
  y,
  s,
  size = 40,
  fill = C.ink,
  weight = 400,
  family = "Helvetica Neue,Arial,sans-serif",
) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${fill}" font-weight="${weight}">${escape(s)}</text>`;
const mono = (x, y, s, size = 40, fill = C.ink, weight = 600) =>
  text(x, y, s, size, fill, weight, "Menlo,monospace");
const svg = (content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${content}</svg>`;
const rect = (x, y, width, height, fill, extra = "") =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
const brand = (light = false) =>
  rect(110, 80, 66, 66, C.green) +
  mono(118, 125, "T_", 33, C.bg, 700) +
  mono(198, 127, "Tensorcraft", 32, light ? C.muted : C.ink, 600);
const gradient = (id, stop = 0.94) =>
  `<defs><linearGradient id="${id}"><stop stop-color="${C.bg}" stop-opacity="${stop}"/><stop offset=".65" stop-color="${C.bg}" stop-opacity=".78"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".22"/></linearGradient></defs>${rect(0, 0, W, H, `url(#${id})`)}`;

async function png(name, content) {
  const target = path.join(WORK, name + ".png");
  await sharp(Buffer.from(svg(content)))
    .png()
    .toFile(target);
  return target;
}

function run(args) {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg failed");
}

function outputArgs(file, duration) {
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
    "-movflags",
    "+faststart",
    file,
  ];
}

function filmSegment(
  index,
  start,
  duration,
  overlay,
  source = path.join(MEDIA, "learn-trailer.mp4"),
  playbackScale = 1,
) {
  const destination = path.join(WORK, `scene-${index}.mp4`);
  run([
    "-ss",
    String(start),
    "-t",
    String(duration / playbackScale),
    "-i",
    source,
    "-loop",
    "1",
    "-framerate",
    String(FPS),
    "-i",
    overlay,
    "-filter_complex_threads",
    "2",
    "-filter_complex",
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,setpts=${playbackScale}*(PTS-STARTPTS),fps=${FPS}[base];[1:v]format=rgba,fade=t=in:st=0:d=0.25:alpha=1[titles];[base][titles]overlay=0:0:shortest=1,format=yuv420p[v]`,
    "-map",
    "[v]",
    ...outputArgs(destination, duration),
  ]);
  console.log(`Rendered scene ${index}: ${duration}s`);
  return destination;
}

function stillSegment(index, duration, overlay, location) {
  const destination = path.join(WORK, `scene-${index}.mp4`);
  run([
    "-loop",
    "1",
    "-framerate",
    String(FPS),
    "-i",
    path.join(ROOT, "apps/web/public/locations/deep-orbit", location + ".webp"),
    "-loop",
    "1",
    "-framerate",
    String(FPS),
    "-i",
    overlay,
    "-filter_complex_threads",
    "2",
    "-filter_complex",
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},zoompan=z='1.02+0.00015*on':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=${W}x${H}:fps=${FPS},setsar=1[base];[1:v]format=rgba,fade=t=in:st=0:d=0.25:alpha=1[titles];[base][titles]overlay=0:0:shortest=1,format=yuv420p[v]`,
    "-map",
    "[v]",
    ...outputArgs(destination, duration),
  ]);
  console.log(`Rendered scene ${index}: ${duration}s`);
  return destination;
}

function worldDrawing(index, x, y) {
  if (index === 0)
    return `<polyline points="${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${x + n * 28},${y + [44, 35, 43, 29, 45, 4, 64, 32, 44][n]}`).join(" ")}" fill="none" stroke="${C.green}" stroke-width="4"/>`;
  if (index === 1)
    return Array.from({ length: 36 }, (_, n) =>
      rect(
        x + (n % 6) * 25,
        y + Math.floor(n / 6) * 16,
        20,
        12,
        C.green,
        `opacity="${0.15 + ((n * 7) % 9) / 10}"`,
      ),
    ).join("");
  if (index === 2)
    return ["words", "become", "tokens"]
      .map(
        (s, n) =>
          rect(x, y + n * 32, [126, 157, 142][n], 25, C.line) +
          mono(x + 8, y + 19 + n * 32, s, 17, C.muted),
      )
      .join("");
  if (index === 3)
    return Array.from({ length: 36 }, (_, n) =>
      rect(
        x + (n % 6) * 25,
        y + Math.floor(n / 6) * 16,
        24,
        15,
        n % 3 ? C.green : C.brass,
        `opacity="${0.24 + ((n * 11) % 11) / 15}"`,
      ),
    ).join("");
  return (
    `<path d="M${x + 20},${y + 45} H${x + 190} M${x + 105},${y + 45} V${y} M${x + 105},${y + 45} V${y + 90}" fill="none" stroke="${C.line}" stroke-width="3"/>` +
    [
      [20, 45],
      [105, 0],
      [105, 90],
      [190, 45],
    ]
      .map(([a, b]) => rect(x + a - 11, y + b - 11, 22, 22, C.green))
      .join("")
  );
}

function trainingFrame(report, count) {
  let content =
    rect(0, 0, W, H, C.bg) +
    brand() +
    mono(110, 245, "Train models in JavaScript.", 66, C.ink, 700) +
    text(
      110,
      307,
      "Run code and inspect the results in your browser.",
      35,
      C.muted,
    );
  content += text(110, 407, "Course code excerpt", 27, C.muted);
  const lines = [
    "const model = buildClassifier();",
    "",
    "await model.fit(readings, labels, {",
    "  epochs: 50,",
    "  batchSize: 16",
    "});",
    "",
    "const scores = model.predict(readings);",
  ];
  lines.forEach((line, n) => {
    content += mono(
      110,
      469 + n * 47,
      line,
      30,
      line.startsWith("await") ? C.green : C.ink,
      400,
    );
  });
  const left = 1190,
    right = 1780,
    top = 455,
    bottom = 790;
  const ceiling = Math.ceil(Math.max(...report.losses) * 10) / 10;
  content += text(1130, 407, "Recorded training loss", 27, C.muted);
  [0, 0.5, 1].forEach((f) => {
    const y = bottom - f * (bottom - top);
    content +=
      `<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="${C.line}" stroke-width="1"/>` +
      mono(left - 62, y + 8, (ceiling * f).toFixed(2), 22, C.muted, 400);
  });
  const points = report.losses
    .slice(0, count)
    .map((loss, n) => [
      left + (n / 49) * (right - left),
      bottom - (loss / ceiling) * (bottom - top),
    ]);
  content += `<polyline points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${C.green}" stroke-width="5" stroke-linejoin="round"/>`;
  const end = points.at(-1);
  content += `<circle cx="${end[0]}" cy="${end[1]}" r="7" fill="${C.green}"/>`;
  [1, 25, 50].forEach((epoch) => {
    content += mono(
      left + ((epoch - 1) / 49) * (right - left) - 8,
      bottom + 42,
      epoch,
      22,
      C.muted,
      400,
    );
  });
  content += text(1420, bottom + 84, "Epoch", 24, C.muted);
  content += text(
    110,
    956,
    "Supplied solution on generated practice data. This example shows training loss.",
    25,
    C.muted,
  );
  content += text(
    110,
    999,
    "Training loss does not measure performance on new readings.",
    25,
    C.muted,
  );
  return content;
}

async function originalAudio() {
  const sampleRate = 44100,
    seconds = 40,
    length = sampleRate * seconds;
  const data = Buffer.alloc(length * 4);
  const cuts = [5, 13, 18, 24, 32, 35];
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, t / 2) * Math.min(1, (seconds - t) / 2.6);
    let value =
      0.032 * Math.sin(2 * Math.PI * 55 * t) +
      0.016 * Math.sin(2 * Math.PI * 82.4069 * t + 0.4 * Math.sin(t * 0.2)) +
      0.009 * Math.sin(2 * Math.PI * 130.8128 * t);
    value *= 0.72 + 0.28 * Math.sin((Math.PI * t) / 7) ** 2;
    for (const cut of cuts) {
      const d = t - cut;
      if (d > 0 && d < 1.8)
        value +=
          0.026 *
          Math.exp(-d * 3.4) *
          Math.sin(2 * Math.PI * (cut === 35 ? 523.25 : 261.625) * d);
    }
    const left = Math.max(-1, Math.min(1, value * envelope));
    const right = Math.max(
      -1,
      Math.min(1, value * envelope * (0.97 + 0.03 * Math.sin(t * 0.4))),
    );
    data.writeInt16LE(Math.round(left * 32767), i * 4);
    data.writeInt16LE(Math.round(right * 32767), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(data.length + 36, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  const target = path.join(WORK, "ambient-score.wav");
  await fs.writeFile(target, Buffer.concat([header, data]));
  return target;
}

async function main() {
  await fs.mkdir(WORK, { recursive: true });
  await fs.mkdir(MEDIA, { recursive: true });
  let report;
  try {
    report = JSON.parse(
      await fs.readFile(path.join(WORK, "training-run.json"), "utf8"),
    );
  } catch {
    report = (await recordIntroModelRun()).report;
  }
  const intro = await png(
    "intro",
    gradient("intro") +
      brand() +
      mono(110, 430, "Tensorcraft", 118, C.ink, 700) +
      text(110, 550, "Machine learning for", 70) +
      text(110, 643, "JavaScript engineers.", 70, C.green) +
      mono(110, 938, "tensorcraft.app", 30, C.muted, 400),
  );
  const worldsBase = await png(
    "worlds-base",
    rect(0, 0, W, H, C.bg) +
      brand() +
      mono(110, 264, "The Tensorcraft worlds", 70, C.ink, 700) +
      text(
        110,
        332,
        "Each course has its own story and ML subject.",
        35,
        C.muted,
      ),
  );
  const worldData = [
    ["Deep Orbit", "Signals", "Available now"],
    ["Neon", "Computer vision", "Coming soon", "Protocol"],
    ["Signal Ward", "Text and language", "Coming soon"],
    ["Nova Canvas", "Generative models", "Coming soon"],
    ["Terra Grid", "Edge deployment", "Coming soon"],
  ];
  const worldCards = [];
  for (let i = 0; i < 5; i++) {
    const x = 110 + i * 344;
    const [title, topic, status, title2] = worldData[i];
    const card =
      rect(
        x,
        422,
        324,
        465,
        i === 0 ? "#203028" : C.surface,
        `stroke="${i === 0 ? C.green : C.line}" stroke-width="1"`,
      ) +
      mono(x + 24, 483, title, 29) +
      (title2 ? mono(x + 24, 525, title2, 29) : "") +
      worldDrawing(i, x + 28, 582) +
      text(x + 24, 750, topic, 25, C.muted) +
      text(
        x + 24,
        831,
        status,
        25,
        i === 0 ? C.green : C.muted,
        i === 0 ? 600 : 400,
      );
    worldCards.push(await png(`world-${i}`, card));
  }
  const deepOrbit = await png(
    "deep-orbit",
    gradient("orbit", 0.85) +
      brand() +
      mono(110, 452, "Deep Orbit", 114, C.ink, 700) +
      text(110, 535, "The first available Tensorcraft world.", 43, C.green) +
      text(110, 915, "Aboard the research ship Archimedes", 35, C.muted),
  );
  const crew = await png(
    "crew",
    `<defs><linearGradient id="crew" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".95"/></linearGradient></defs>${rect(0, 0, W, H, "url(#crew)")}` +
      mono(110, 869, "Help the crew investigate", 59) +
      mono(110, 951, "an unexplained signal.", 59, C.green),
  );
  const outcome = await png(
    "outcome",
    gradient("outcome", 0.78) +
      brand() +
      mono(110, 455, "You’ll build", 78) +
      mono(110, 558, "an anomaly detector.", 78, C.green) +
      text(
        110,
        660,
        "The story continues as your models take shape.",
        37,
        C.muted,
      ),
  );
  const closing = await png(
    "closing",
    gradient("closing", 0.95) +
      brand() +
      mono(110, 452, "Start Deep Orbit free.", 83, C.ink, 700) +
      text(
        110,
        556,
        "Five foundations lessons. No account needed.",
        39,
        C.muted,
      ) +
      mono(110, 729, "tensorcraft.app", 53, C.green),
  );
  const trainingFiles = [];
  for (let i = 1; i <= 50; i++)
    trainingFiles.push(
      await png(
        `training-${String(i).padStart(3, "0")}`,
        trainingFrame(report, i),
      ),
    );
  await sharp(intro)
    .webp({ quality: 90 })
    .toFile(path.join(WORK, "title-graphic.webp"));
  console.log("Title graphics and recorded training animation ready.");
  if (process.argv.includes("--stills-only")) return;

  const segments = [];
  segments.push(filmSegment(1, 12, 5, intro));
  const worldsSegment = path.join(WORK, "scene-2.mp4");
  const inputs = [worldsBase, ...worldCards].flatMap((file) => [
    "-loop",
    "1",
    "-framerate",
    String(FPS),
    "-i",
    file,
  ]);
  const filters = [];
  let previous = "0:v";
  for (let i = 0; i < 5; i++) {
    filters.push(
      `[${i + 1}:v]format=rgba,fade=t=in:st=${0.15 + i * 0.15}:d=0.25:alpha=1[card${i}]`,
    );
    filters.push(`[${previous}][card${i}]overlay=0:0:shortest=1[world${i}]`);
    previous = `world${i}`;
  }
  run([
    ...inputs,
    "-filter_complex_threads",
    "2",
    "-filter_complex",
    filters.join(";"),
    "-map",
    `[${previous}]`,
    ...outputArgs(worldsSegment, 8),
  ]);
  segments.push(worldsSegment);
  console.log("Rendered scene 2: 8s");
  segments.push(filmSegment(3, 18, 5, deepOrbit));
  segments.push(
    filmSegment(4, 36, 6, crew, path.join(MEDIA, "learn-trailer.mp4"), 2),
  );
  const trainingSegment = path.join(WORK, "scene-5.mp4");
  run([
    "-framerate",
    "6.25",
    "-start_number",
    "1",
    "-i",
    path.join(WORK, "training-%03d.png"),
    "-vf",
    `fps=${FPS},format=yuv420p`,
    ...outputArgs(trainingSegment, 8),
  ]);
  segments.push(trainingSegment);
  console.log("Rendered scene 5: 8s");
  segments.push(stillSegment(6, 3, outcome, "engineering"));
  segments.push(stillSegment(7, 5, closing, "bridge"));
  const list = path.join(WORK, "segments.txt");
  await fs.writeFile(
    list,
    segments
      .map((file) => `file '${file.replaceAll("'", "'\\''")}'`)
      .join("\n") + "\n",
  );
  const silent = path.join(WORK, "picture.mp4");
  run(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silent]);
  const score = await originalAudio();
  const video = path.join(MEDIA, "tensorcraft-intro.mp4");
  run([
    "-i",
    silent,
    "-i",
    score,
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
    "-af",
    "afade=t=out:st=38:d=2",
    "-t",
    "40",
    "-movflags",
    "+faststart",
    video,
  ]);
  const posterFrame = path.join(WORK, "poster.png");
  run(["-ss", "2", "-i", video, "-frames:v", "1", posterFrame]);
  await sharp(posterFrame)
    .webp({ quality: 88 })
    .toFile(path.join(MEDIA, "tensorcraft-intro-poster.webp"));
  const transcript = `WEBVTT

00:00.000 --> 00:05.000
Tensorcraft. Machine learning for JavaScript engineers.

00:05.000 --> 00:13.000
Each Tensorcraft world is a course with its own story and ML subject.
Deep Orbit is available now. Four other worlds are coming soon.

00:13.000 --> 00:18.000
Deep Orbit is the first available Tensorcraft world.
The story takes place aboard the research ship Archimedes.

00:18.000 --> 00:24.000
Help the crew investigate an unexplained signal.

00:24.000 --> 00:32.000
Train models in JavaScript and inspect results in your browser.
The chart shows a supplied course solution run on generated practice data.
Training loss does not measure performance on new readings.

00:32.000 --> 00:35.000
You will build an anomaly detector as the story continues.

00:35.000 --> 00:40.000
Start Deep Orbit free at tensorcraft.app.
Five foundations lessons. No account needed.
`;
  await fs.writeFile(path.join(MEDIA, "tensorcraft-intro.vtt"), transcript);
  await fs.writeFile(
    path.join(WORK, "production.json"),
    JSON.stringify(
      {
        durationSeconds: 40,
        resolution: [W, H],
        fps: FPS,
        existingFootage: "/media/learn-trailer.mp4",
        trainingRun: "training-run.json",
        sourceAudio: "Original synthesized ambient score, no speech",
        segments: [5, 8, 5, 6, 8, 3, 5],
        output: path.relative(ROOT, video),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      video: path.relative(ROOT, video),
      seconds: 40,
      MB: Math.round((await fs.stat(video)).size / 1e5) / 10,
    }),
  );
}

await main();
