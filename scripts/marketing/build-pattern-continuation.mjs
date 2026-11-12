/**
 * Builds a silent crew background from original Deep Orbit animated footage.
 * Character movement always plays forward; a short dissolve closes the loop.
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
const work = path.join(root, "output/marketing/pattern-continuation");
const media = path.join(root, "apps/web/public/media/pattern-continuation");
const width = 1280;
const height = 720;
const fps = 24;
const sourceStart = 36.05;
const sourceFrames = 93;
const baseFrames = 216;
const overlapFrames = 18;
const frameCount = baseFrames - overlapFrames;
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
    {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg failed");
}

function sourceIndex(baseIndex) {
  return Math.round((baseIndex / (baseFrames - 1)) * (sourceFrames - 1));
}

function sourceFile(baseIndex) {
  return path.join(
    work,
    "source",
    `frame-${String(sourceIndex(baseIndex) + 1).padStart(3, "0")}.png`,
  );
}

await fs.mkdir(path.join(work, "source"), { recursive: true });
await fs.mkdir(path.join(work, "frames"), { recursive: true });
await fs.mkdir(media, { recursive: true });

if (!reuse) {
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

  for (let frame = 0; frame < frameCount; frame++) {
    const destination = path.join(
      work,
      "frames",
      `frame-${String(frame).padStart(3, "0")}.png`,
    );
    if (frame < baseFrames - overlapFrames * 2) {
      await fs.copyFile(sourceFile(frame + overlapFrames), destination);
      continue;
    }
    const dissolveIndex = frame - (baseFrames - overlapFrames * 2);
    const amount = (dissolveIndex + 1) / overlapFrames;
    const incomingIndex = (dissolveIndex / (overlapFrames - 1)) * overlapFrames;
    const overlay = await sharp(sourceFile(incomingIndex))
      .ensureAlpha(amount)
      .png()
      .toBuffer();
    await sharp(sourceFile(baseFrames - overlapFrames + dissolveIndex))
      .composite([{ input: overlay }])
      .png()
      .toFile(destination);
  }
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
const mp4 = path.join(media, "crew-loop.mp4");
const webm = path.join(media, "crew-loop.webm");
if (!reuse) {
  ffmpeg([
    ...common,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "24",
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
    "36",
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

await sharp(sourceFile(174))
  .webp({ quality: 86 })
  .toFile(path.join(media, "crew-poster.webp"));
for (const file of [mp4, webm]) ffmpeg(["-i", file, "-f", "null", "-"]);
ffmpeg([
  "-i",
  mp4,
  "-vf",
  "fps=1,scale=400:-1,tile=3x3",
  "-frames:v",
  "1",
  path.join(work, "contact.jpg"),
]);

const artifacts = {};
for (const name of ["crew-loop.mp4", "crew-loop.webm", "crew-poster.webp"]) {
  const bytes = await fs.readFile(path.join(media, name));
  artifacts[name] = {
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
const firstFrame = await fs.readFile(path.join(work, "frames/frame-000.png"));
const finalFrame = await fs.readFile(
  path.join(
    work,
    "frames",
    `frame-${String(frameCount - 1).padStart(3, "0")}.png`,
  ),
);
const firstPixels = await sharp(firstFrame).removeAlpha().raw().toBuffer();
const finalPixels = await sharp(finalFrame).removeAlpha().raw().toBuffer();
const report = {
  date: "2026-11-12",
  source: "Original Deep Orbit animated footage from learn-trailer.mp4",
  sourceStartSeconds: sourceStart,
  selectedSourceFrames: sourceFrames,
  sourceEndSeconds: sourceStart + (sourceFrames - 1) / fps,
  seconds: frameCount / fps,
  frameCount,
  fps,
  resolution: [width, height],
  audio: false,
  textOrBrandOverlay: false,
  loopMethod:
    "Forward-only camera and character movement slowed to nine seconds; 0.75-second crossfade from the wide frame into the close frame",
  overlapFrames,
  firstAndLastRawPixelsMatch: firstPixels.equals(finalPixels),
  artifacts,
};
await fs.writeFile(
  path.join(work, "production.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
