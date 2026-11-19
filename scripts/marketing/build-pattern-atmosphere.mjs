/**
 * Makes a text-free background loop from original Deep Orbit ship footage.
 * The cosine camera replay eases to rest at both ends of its seamless cycle.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const source = path.join(root, "apps/web/public/media/learn-trailer.mp4");
const work = path.join(root, "output/marketing/pattern-atmosphere");
const media = path.join(root, "apps/web/public/media/pattern-atmosphere");
const width = 1280;
const height = 720;
const fps = 24;
const seconds = 8;
const frameCount = fps * seconds;
const sourceStart = 21;
const sourceFrames = 68;
const reuse = process.argv.includes("--verify-only");
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", {
    paths: [path.join(root, "apps/web")],
  }),
);
const sharp = nextRequire("sharp");

function ffmpeg(args) {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg failed");
}

await fs.mkdir(path.join(work, "source"), { recursive: true });
await fs.mkdir(path.join(work, "frames"), { recursive: true });
await fs.mkdir(media, { recursive: true });

if (!reuse)
  ffmpeg([
    "-ss",
    String(sourceStart),
    "-i",
    source,
    "-vf",
    `fps=${fps},scale=${width}:${height},setsar=1`,
    "-frames:v",
    String(sourceFrames),
    "-map_metadata",
    "-1",
    path.join(work, "source/frame-%03d.png"),
  ]);

const sourceIndices = [];
for (let index = 0; index < frameCount; index++) {
  const phase = index / frameCount;
  const sourceIndex = Math.round(
    ((1 - Math.cos(phase * Math.PI * 2)) / 2) * (sourceFrames - 1),
  );
  sourceIndices.push(sourceIndex);
  const frame = path.join(
    work,
    "frames",
    `frame-${String(index).padStart(3, "0")}.png`,
  );
  if (!reuse)
    await fs.copyFile(
      path.join(
        work,
        "source",
        `frame-${String(sourceIndex + 1).padStart(3, "0")}.png`,
      ),
      frame,
    );
}

const common = [
  "-framerate",
  String(fps),
  "-start_number",
  "0",
  "-i",
  path.join(work, "frames/frame-%03d.png"),
  "-frames:v",
  String(frameCount),
  "-an",
  "-map_metadata",
  "-1",
];
const mp4 = path.join(media, "loop.mp4");
const webm = path.join(media, "loop.webm");
if (!reuse) {
  ffmpeg([
    ...common,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "25",
    "-threads",
    "4",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4,
  ]);
  ffmpeg([
    ...common,
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "38",
    "-row-mt",
    "1",
    "-cpu-used",
    "3",
    "-threads",
    "4",
    "-pix_fmt",
    "yuv420p",
    webm,
  ]);
}
await sharp(path.join(work, "source/frame-001.png"))
  .webp({ quality: 84 })
  .toFile(path.join(media, "poster.webp"));
for (const file of [mp4, webm]) ffmpeg(["-i", file, "-f", "null", "-"]);
ffmpeg([
  "-i",
  mp4,
  "-vf",
  "fps=1,scale=400:-1,tile=4x2",
  "-frames:v",
  "1",
  path.join(work, "contact.jpg"),
]);

const artifacts = {};
for (const name of ["loop.mp4", "loop.webm", "poster.webp"]) {
  const bytes = await fs.readFile(path.join(media, name));
  artifacts[name] = {
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
const report = {
  date: "2026-11-11",
  source: "Original Deep Orbit moving footage from learn-trailer.mp4",
  sourceStartSeconds: sourceStart,
  selectedSourceFrames: sourceFrames,
  seconds,
  fps,
  resolution: [width, height],
  audio: false,
  textOrBrandOverlay: false,
  seamlessCycle:
    "Cosine forward-and-reverse replay with zero speed at each end",
  firstSourceIndex: sourceIndices[0],
  lastSourceIndex: sourceIndices[sourceIndices.length - 1],
  lastAndFirstFramesMatch:
    sourceIndices[0] === sourceIndices[sourceIndices.length - 1],
  artifacts,
};
await fs.writeFile(
  path.join(work, "production.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
