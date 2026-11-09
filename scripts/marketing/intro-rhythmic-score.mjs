/**
 * Original synth and percussion score for the faster Tensorcraft introduction.
 * All sound is synthesized here. No speech, samples, or external audio.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TWO_PI = Math.PI * 2;
const BPM = 108;
const BEAT = 60 / BPM;
const CUTS = [0, 2.75, 4.25, 6.25, 11.25, 13.5, 17, 19.75];

function wavHeader(sampleRate, dataLength) {
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(dataLength + 36, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

export async function renderRhythmicScore({
  work,
  duration = 24,
  sampleRate = 44100,
}) {
  if (!work) throw new Error("A task-owned output directory is required.");
  const count = Math.round(duration * sampleRate);
  const left = new Float64Array(count);
  const right = new Float64Array(count);
  let noiseState = 0x27a6e341;
  const random = () => {
    noiseState ^= noiseState << 13;
    noiseState ^= noiseState >>> 17;
    noiseState ^= noiseState << 5;
    return ((noiseState >>> 0) / 0xffffffff) * 2 - 1;
  };

  // A modest level difference supplies width without phase cancellation.
  function add(start, seconds, sound, pan = 0) {
    const first = Math.max(0, Math.round(start * sampleRate));
    const last = Math.min(count, Math.round((start + seconds) * sampleRate));
    const l = 1 - Math.max(0, pan) * 0.22;
    const r = 1 + Math.min(0, pan) * 0.22;
    for (let index = first; index < last; index++) {
      const t = (index - first) / sampleRate;
      const value = sound(t, index - first);
      left[index] += value * l;
      right[index] += value * r;
    }
  }

  function kick(start, strength = 1) {
    add(start, 0.37, (t) => {
      const attack = Math.min(1, t / 0.004);
      const phase = TWO_PI * (52 * t + (91 / 28) * (1 - Math.exp(-28 * t)));
      return (
        strength *
        attack *
        (0.29 * Math.exp(-t * 12) * Math.sin(phase) +
          0.045 * Math.exp(-t * 27) * Math.sin(TWO_PI * 104 * t))
      );
    });
  }

  function snare(start, strength = 1) {
    let low = 0;
    let softened = 0;
    add(start, 0.2, (t) => {
      const white = random();
      low += 0.12 * (white - low);
      softened += 0.48 * (white - low - softened);
      const attack = Math.min(1, t / 0.002);
      return (
        strength *
        attack *
        Math.exp(-t * 25) *
        (0.135 * softened + 0.06 * Math.sin(TWO_PI * 183 * t))
      );
    });
  }

  function hat(start, strength = 1, pan = 0) {
    let low = 0;
    let softened = 0;
    add(
      start,
      0.095,
      (t) => {
        const white = random();
        low += 0.15 * (white - low);
        softened += 0.42 * (white - low - softened);
        return (
          0.073 *
          strength *
          Math.min(1, t / 0.002) *
          Math.exp(-t * 63) *
          softened
        );
      },
      pan,
    );
  }

  function pluck(start, hz, strength = 1, pan = 0, decay = 4.5) {
    add(
      start,
      1.5,
      (t) =>
        strength *
        0.047 *
        Math.min(1, t / 0.006) *
        Math.exp(-t * decay) *
        (Math.sin(TWO_PI * hz * t) +
          0.28 * Math.sin(TWO_PI * hz * 2 * t) +
          0.1 * Math.sin(TWO_PI * hz * 3 * t)),
      pan,
    );
  }

  function bass(start, hz, strength = 1, length = BEAT * 0.78) {
    add(start, length, (t) => {
      const attack = Math.min(1, t / 0.018);
      const release = Math.min(1, (length - t) / 0.08);
      const decay = Math.exp(-t * 2.5);
      return (
        0.12 *
        strength *
        attack *
        release *
        decay *
        (Math.sin(TWO_PI * hz * t) +
          0.35 * Math.sin(TWO_PI * hz * 2 * t) +
          0.09 * Math.sin(TWO_PI * hz * 3 * t))
      );
    });
  }

  // The opening answers the visual signal immediately, then establishes time.
  kick(0, 0.95);
  pluck(0.012, 440, 1.1, -0.25, 6.2);
  pluck(0.07, 659.255, 0.48, 0.25, 7.2);
  [0.83, 1.67, 2.22].forEach((t, i) => {
    kick(t, 0.5 + i * 0.1);
    pluck(t + 0.018, [329.628, 391.995, 440][i], 0.42, i % 2 ? 0.3 : -0.3);
  });

  const musicStart = 2.75;
  for (let beat = 0; ; beat++) {
    const t = musicStart + beat * BEAT;
    if (t >= duration - 1.3) break;
    const inLift = t >= 11.25 && t < 17;
    const inSpace = t >= 17 && t < 19.75;
    const inEnding = t >= 19.75;
    const kickLevel = inSpace ? 0.34 : inLift ? 0.85 : inEnding ? 0.62 : 0.72;
    if (!inSpace || beat % 2 === 0) kick(t, kickLevel);
    if (beat % 4 === 1 || beat % 4 === 3) snare(t, inSpace ? 0.25 : 0.78);
    hat(t + BEAT / 2, inSpace ? 0.26 : 0.78, beat % 2 ? 0.55 : -0.55);
    if (inLift) hat(t + BEAT * 0.75, 0.3, 0.35);

    const bar = Math.floor(beat / 4);
    const root = [110, 87.3071, 130.8128, 97.9989][bar % 4];
    const note = beat % 4 === 3 ? root * 1.5 : root;
    if (!inSpace || beat % 2 === 0) bass(t + 0.015, note, inLift ? 1.05 : 0.78);

    if (t >= 6.25 && !inEnding && !inSpace) {
      const melody = [
        220, 261.6256, 329.6276, 391.9954, 329.6276, 261.6256, 293.6648,
        329.6276,
      ];
      pluck(
        t + BEAT / 2,
        melody[beat % melody.length] * (inLift ? 2 : 1),
        inLift ? 0.75 : 0.52,
        beat % 2 ? 0.35 : -0.35,
      );
    }
  }

  // Cut accents are short pitched tones, with no sweeping alarm gesture.
  CUTS.slice(1).forEach((cut, index) => {
    pluck(
      cut + 0.004,
      [329.6276, 391.9954, 440, 523.2511, 659.2551, 391.9954, 440][index],
      0.75,
      0,
      5.8,
    );
  });
  [440, 523.2511, 659.2551, 783.9909].forEach((hz, index) => {
    pluck(13.5 + index * 0.64, hz, 0.72, index % 2 ? 0.3 : -0.3, 5.2);
  });

  // A very quiet harmonic floor fills the rhythm without obscuring the cuts.
  const padRoots = [110, 87.3071, 130.8128, 110];
  for (let index = 0; index < count; index++) {
    const t = index / sampleRate;
    const section = Math.min(3, Math.floor(t / 6));
    const lift = t >= 11.25 ? 1.2 : 0.8;
    const tone = (root) =>
      Math.sin(TWO_PI * root * t) +
      0.44 * Math.sin(TWO_PI * root * 1.5 * t) +
      0.22 * Math.sin(TWO_PI * root * 2 * t);
    const blend = section ? Math.min(1, (t % 6) / 0.35) : 1;
    const floor =
      0.032 *
      lift *
      (tone(padRoots[section]) * blend +
        tone(padRoots[Math.max(0, section - 1)]) * (1 - blend));
    const entrance = Math.min(1, t / 0.55);
    left[index] += floor * entrance;
    right[index] += floor * entrance * 0.97;
  }

  // The closing chord gives the CTA an arrival, then leaves space to read it.
  [220, 329.6276, 440].forEach((hz, index) => {
    add(
      19.75,
      4.25,
      (t) =>
        0.036 *
        Math.min(1, t / 0.028) *
        Math.exp(-t * 0.45) *
        Math.sin(TWO_PI * hz * t),
      index === 1 ? 0.2 : -0.2,
    );
  });

  let rawSquares = 0;
  for (let i = 0; i < count; i++) rawSquares += left[i] ** 2 + right[i] ** 2;
  const gain = 0.133 / Math.sqrt(rawSquares / (count * 2));
  const pcm = Buffer.alloc(count * 4);
  let peak = 0;
  let squares = 0;
  for (let i = 0; i < count; i++) {
    const t = i / sampleRate;
    const closingFade =
      t > duration - 1
        ? Math.cos((Math.PI / 2) * (t - (duration - 1))) ** 2
        : 1;
    const openingFade = Math.min(1, t / 0.003);
    for (let channel = 0; channel < 2; channel++) {
      const value = (channel ? right[i] : left[i]) * gain;
      const limited =
        0.68 * Math.tanh(value / 0.68) * closingFade * openingFade;
      const integer = Math.round(limited * 32767);
      const actual = integer / 32767;
      peak = Math.max(peak, Math.abs(actual));
      squares += actual ** 2;
      pcm.writeInt16LE(integer, i * 4 + channel * 2);
    }
  }
  const rms = Math.sqrt(squares / (count * 2));
  if (peak >= 0.7 || rms < 0.1 || rms > 0.16) {
    throw new Error(`Audio levels need review: peak ${peak}, RMS ${rms}.`);
  }
  await fs.mkdir(work, { recursive: true });
  const file = path.join(work, "rhythmic-score.wav");
  await fs.writeFile(
    file,
    Buffer.concat([wavHeader(sampleRate, pcm.length), pcm]),
  );
  return { file, peak, rms };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const result = await renderRhythmicScore({
    work:
      process.argv[2] ?? path.join(root, "output/tensorcraft-intro-video/v2"),
  });
  console.log(JSON.stringify(result));
}
