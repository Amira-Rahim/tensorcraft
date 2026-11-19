/**
 * A separate 15-second acquisition cut from the approved introduction's scenes.
 * Run build-fast-intro-video.mjs first if the generated v2 sources are absent.
 * Leaves the approved 27-second introduction untouched.
 *
 * node scripts/marketing/build-intro-teaser.mjs
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
const WORK = path.join(ROOT, "output/tensorcraft-intro-video/teaser");
const MEDIA = path.join(ROOT, "apps/web/public/media");
const FPS = 24;
const DURATION = 15;
const FRAMES = DURATION * FPS;
const OVERLAP = 6;
const SCENES = [
  {
    source: 1,
    sourceFrames: 66,
    frames: 78,
    caption: "Can your JavaScript find the pattern?",
  },
  {
    source: 2,
    sourceFrames: 36,
    frames: 42,
    caption: "Deep Orbit. A Tensorcraft world.",
  },
  {
    source: 5,
    sourceFrames: 54,
    frames: 60,
    caption: "Tensorcraft. Machine learning for JavaScript engineers.",
  },
  {
    source: 6,
    sourceFrames: 84,
    frames: 84,
    caption:
      "Four more worlds are coming soon: computer vision, text,\ngenerative models, and deployment.",
  },
  {
    source: 8,
    sourceFrames: 102,
    frames: 120,
    caption:
      "Start Deep Orbit free at tensorcraft.app.\nFive foundations lessons. No account needed.",
  },
];
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
  return `00:${String(Math.floor(millis / 60000)).padStart(2, "0")}:${String(Math.floor(millis / 1000) % 60).padStart(2, "0")}.${String(millis % 1000).padStart(3, "0")}`;
}

await fs.mkdir(WORK, { recursive: true });
const inputs = [];
const filters = [];
for (let index = 0; index < SCENES.length; index++) {
  const scene = SCENES[index];
  const file = path.join(SOURCE, `scene-${scene.source}.mp4`);
  try {
    await fs.access(file);
  } catch {
    throw new Error(
      "Build the introduction's source scenes with scripts/marketing/build-fast-intro-video.mjs first.",
    );
  }
  inputs.push("-i", file);
  filters.push(
    `[${index}:v]setpts=${(scene.frames / scene.sourceFrames).toFixed(10)}*(PTS-STARTPTS),fps=${FPS},tpad=stop_mode=clone:stop_duration=0.25,trim=end_frame=${scene.frames},settb=1/${FPS},setpts=N,format=yuv420p[v${index}]`,
  );
}
const starts = [0];
let accumulated = SCENES[0].frames;
let previous = "v0";
for (let index = 1; index < SCENES.length; index++) {
  const start = (accumulated - OVERLAP) / FPS;
  starts.push(start);
  const transition = index === 2 || index === 3 ? "fadeblack" : "fade";
  filters.push(
    `[${previous}][v${index}]xfade=transition=${transition}:duration=${OVERLAP / FPS}:offset=${start}[join${index}]`,
  );
  previous = `join${index}`;
  accumulated += SCENES[index].frames - OVERLAP;
}
if (accumulated !== FRAMES)
  throw new Error("The teaser timeline must be exactly 15 seconds.");
filters.push(`[${previous}]fps=${FPS},setsar=1,format=yuv420p[out]`);
const picture = path.join(WORK, "picture.mp4");
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
  String(FRAMES),
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

// Keep the original opening and closing chord, joined under the final CTA.
const video = path.join(MEDIA, "tensorcraft-teaser.mp4");
ffmpeg([
  "-i",
  picture,
  "-i",
  path.join(MEDIA, "tensorcraft-intro.mp4"),
  "-filter_complex",
  "[1:a]asplit=2[a][b];[a]atrim=start=0:end=10.75,asetpts=PTS-STARTPTS[a0];[b]atrim=start=22:end=27,asetpts=PTS-STARTPTS[a1];[a0][a1]acrossfade=d=0.75:c1=tri:c2=tri,atrim=duration=15[audio]",
  "-map",
  "0:v:0",
  "-map",
  "[audio]",
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
ffmpeg(["-ss", "0.9", "-i", video, "-frames:v", "1", poster]);
await sharp(poster)
  .webp({ quality: 88 })
  .toFile(path.join(MEDIA, "tensorcraft-teaser-poster.webp"));
const boundaries = starts.map(
  (start, index) => start + (index ? OVERLAP / FPS / 2 : 0),
);
boundaries.push(DURATION);
await fs.writeFile(
  path.join(MEDIA, "tensorcraft-teaser.vtt"),
  "WEBVTT\n\n" +
    SCENES.map(
      (scene, index) =>
        `${vttTime(boundaries[index])} --> ${vttTime(boundaries[index + 1])}\n${scene.caption}`,
    ).join("\n\n") +
    "\n",
);

// A small contact sheet makes titles, crops and transition points reviewable.
const contactTimes = [0.9, 3.5, 5.5, 8.2, 12.5, 14.5];
const thumbs = [];
for (let index = 0; index < contactTimes.length; index++) {
  const file = path.join(WORK, `check-${index}.png`);
  ffmpeg([
    "-ss",
    String(contactTimes[index]),
    "-i",
    video,
    "-frames:v",
    "1",
    "-vf",
    "scale=640:360",
    file,
  ]);
  thumbs.push({
    input: file,
    left: (index % 2) * 640,
    top: Math.floor(index / 2) * 360,
  });
}
await sharp({
  create: { width: 1280, height: 1080, channels: 3, background: "#101411" },
})
  .composite(thumbs)
  .jpeg({ quality: 90 })
  .toFile(path.join(WORK, "contact.jpg"));
ffmpeg(["-i", video, "-f", "null", "-"]);
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
  Number(stream.nb_frames) !== FRAMES ||
  stream.width !== 1920 ||
  stream.height !== 1080
)
  throw new Error("Unexpected teaser duration, frame count or resolution.");
await fs.writeFile(
  path.join(WORK, "production.json"),
  JSON.stringify(
    {
      durationSeconds: DURATION,
      fps: FPS,
      frames: FRAMES,
      source: "v2 scenes used in the approved 27-second film",
      scenes: SCENES,
      starts,
      captionBoundaries: boundaries,
      audio:
        "Original approved music, opening and closing chord, 0.75s crossfade",
      output: path.relative(ROOT, video),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    durationSeconds: DURATION,
    frames: FRAMES,
    resolution: [stream.width, stream.height],
    bytes: (await fs.stat(video)).size,
    output: path.relative(ROOT, video),
  }),
);
