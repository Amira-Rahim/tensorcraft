/**
 * Eases the existing intro cut to 27 seconds with short, selected dissolves.
 * Reuses the v2 scenes so the message, source footage and observed data stay
 * consistent. Run build-fast-intro-video.mjs first if those scenes are absent.
 *
 * node scripts/marketing/refine-intro-pacing.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const SOURCE = path.join(ROOT, "output/tensorcraft-intro-video/v2");
const WORK = path.join(ROOT, "output/tensorcraft-intro-video/v3");
const MEDIA = path.join(ROOT, "apps/web/public/media");
const FPS = 24;
const OLD_FRAMES = [66, 36, 48, 120, 54, 84, 66, 102];
const NEW_FRAMES = [78, 44, 58, 141, 66, 100, 80, 122];
const OVERLAPS = [6, 6, 6, 3, 6, 6, 8];
const TOTAL_FRAMES =
  NEW_FRAMES.reduce((a, b) => a + b, 0) - OVERLAPS.reduce((a, b) => a + b, 0);
const DURATION = TOTAL_FRAMES / FPS;
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", {
    paths: [path.join(ROOT, "apps/web")],
  }),
);
const sharp = nextRequire("sharp");

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
function vttTime(seconds) {
  const millis = Math.round(seconds * 1000);
  const hours = Math.floor(millis / 3600000);
  const minutes = Math.floor(millis / 60000) % 60;
  const secs = Math.floor(millis / 1000) % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis % 1000).padStart(3, "0")}`;
}

await fs.mkdir(WORK, { recursive: true });
const video = path.join(MEDIA, "tensorcraft-intro.mp4");
const prior = path.join(
  ROOT,
  "output/tensorcraft-intro-video/tensorcraft-intro-v2.mp4",
);
try {
  await fs.access(prior);
} catch {
  await fs.copyFile(video, prior);
}
const inputs = [];
const filters = [];
for (let index = 0; index < 8; index++) {
  const scene = path.join(SOURCE, `scene-${index + 1}.mp4`);
  await fs.access(scene);
  inputs.push("-i", scene);
  const scale = NEW_FRAMES[index] / OLD_FRAMES[index];
  filters.push(
    `[${index}:v]setpts=${scale.toFixed(10)}*(PTS-STARTPTS),fps=${FPS},tpad=stop_mode=clone:stop_duration=0.25,trim=end_frame=${NEW_FRAMES[index]},settb=1/${FPS},setpts=N,format=yuv420p[v${index}]`,
  );
}
let accumulated = NEW_FRAMES[0];
let previous = "v0";
const starts = [0];
const transitions = [];
for (let index = 1; index < 8; index++) {
  const overlap = OVERLAPS[index - 1];
  const start = (accumulated - overlap) / FPS;
  const transition = index === 3 || index === 5 ? "fadeblack" : "fade";
  starts.push(start);
  transitions.push({
    from: index,
    to: index + 1,
    type: transition,
    seconds: overlap / FPS,
    at: start,
  });
  filters.push(
    `[${previous}][v${index}]xfade=transition=${transition}:duration=${(overlap / FPS).toFixed(9)}:offset=${start.toFixed(9)}[join${index}]`,
  );
  previous = `join${index}`;
  accumulated += NEW_FRAMES[index] - overlap;
}
filters.push(`[${previous}]fps=${FPS},setsar=1,format=yuv420p[out]`);
const picture = path.join(WORK, "picture.mp4");
console.log("Rendering the gentler scene transitions.");
ffmpeg([
  ...inputs,
  "-filter_complex_threads",
  "2",
  "-filter_complex",
  filters.join(";"),
  "-map",
  "[out]",
  "-an",
  "-frames:v",
  String(TOTAL_FRAMES),
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
  picture,
]);
const audio = path.join(SOURCE, "rhythmic-score.wav");
await fs.access(audio);
ffmpeg([
  "-i",
  picture,
  "-i",
  audio,
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
  `atempo=${(24 / DURATION).toFixed(10)},volume=0.9,apad,atrim=duration=${DURATION},afade=t=out:st=${DURATION - 1.2}:d=1.2`,
  "-t",
  String(DURATION),
  "-movflags",
  "+faststart",
  video,
]);
const poster = path.join(WORK, "poster.png");
ffmpeg(["-ss", "0.9", "-i", video, "-frames:v", "1", poster]);
await sharp(poster)
  .webp({ quality: 88 })
  .toFile(path.join(MEDIA, "tensorcraft-intro-poster.webp"));

const boundaries = starts.map(
  (start, index) => start + (index ? OVERLAPS[index - 1] / FPS / 2 : 0),
);
boundaries.push(DURATION);
const captions = [
  "Can your JavaScript find the pattern?",
  "Deep Orbit. A Tensorcraft world.",
  "Help the Archimedes crew investigate the signal.",
  "Your JavaScript trains a model.\nRecorded course example on generated practice data, training batch only.\nTraining loss does not measure performance on new readings.",
  "Tensorcraft. Machine learning for JavaScript engineers.",
  "Four more worlds are coming soon: computer vision, text,\ngenerative models, and deployment.",
  "Deep Orbit is available now.\nBuild and run models in your browser.",
  "Start Deep Orbit free at tensorcraft.app.\nFive foundations lessons. No account needed.",
];
await fs.writeFile(
  path.join(MEDIA, "tensorcraft-intro.vtt"),
  "WEBVTT\n\n" +
    captions
      .map(
        (caption, index) =>
          `${vttTime(boundaries[index])} --> ${vttTime(boundaries[index + 1])}\n${caption}`,
      )
      .join("\n\n") +
    "\n",
);
const info = JSON.parse(
  run("ffprobe", [
    "-v",
    "quiet",
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    video,
  ]),
);
const stream = info.streams.find((item) => item.codec_type === "video");
if (
  Math.abs(Number(info.format.duration) - DURATION) > 0.05 ||
  Number(stream.nb_frames) !== TOTAL_FRAMES
)
  throw new Error("The final edit has an unexpected length.");
const production = {
  version: 3,
  durationSeconds: DURATION,
  fps: FPS,
  frames: TOTAL_FRAMES,
  sourceFrames: OLD_FRAMES,
  retimedFrames: NEW_FRAMES,
  transitions,
  sceneStarts: starts,
  captionBoundaries: boundaries,
  audioTempo: 24 / DURATION,
  audioPitchPreserved: true,
  output: path.relative(ROOT, video),
};
await fs.writeFile(
  path.join(WORK, "production.json"),
  JSON.stringify(production, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    seconds: DURATION,
    frames: TOTAL_FRAMES,
    MB: Math.round((await fs.stat(video)).size / 1e5) / 10,
    transitions: transitions.map((item) => item.seconds),
  }),
);
