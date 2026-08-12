import { highlight } from "./orbit-canvas";

/* ── World scenes: signature animations for the four unlaunched worlds ──
   Siblings of drawOrbit (Deep Orbit), one per world, drawn on the shared
   SceneCanvas chrome. Each follows the same contract:

   - Pure time parameterization: every position is a function of t only.
     `hot` (the eased 0..1 hover amount) may touch alpha, lineWidth and
     gradient stops — never geometry — so hover flips can't teleport the
     scene (enforced by world-scenes.test.ts, same as drawOrbit's test).
   - Deterministic hash() randomness, stable across frames, so the
     reduced-motion static frame matches the animated one.
   - Each scene's clock is phase-shifted so the t=0 static frame lands on
     its signature moment (detections locked, shape formed, pings alive)
     rather than an empty warm-up frame.
   - Two rendering languages, one geometry (scheme independence locked by
     world-scenes.test.ts, same shared recorder as drawOrbit's):
     dark — additive blending over the dark card, world hue lifted toward
     white for highlights; the light-on-darkness language of Deep Orbit.
     light ("ink") — marks laid on paper: multiply compositing pools
     overlaps darker like wet ink, highlight() deepens the hue toward
     near-black instead of lifting it, and literal alphas scale up ~1.8×
     (clamped ≤0.9) because tinted marks on paper need more body than
     glows on black. Large soft fields (the nebula washes, Neon's scan
     beam, Nova's bloom) do NOT multiply the raw hue — they use
     paper-lifted wash tints drawn source-over, per the empirical
     grey-storm-cloud lesson recorded in orbit-canvas.tsx.

   At rest each scene idles faint; hover multiplies alpha on the signature
   layer (detection boxes, attention arcs, formed figure, node pings) so
   the card visibly "comes alive" under the cursor. */

// GLSL-style fract(sin·k) hash — see orbit-canvas.tsx for why not
// Math.random(): the static reduced-motion frame must match frame N.
const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const fract = (x: number): number => x - Math.floor(x);

/** Base hue lerped `k` toward white — the "thinned ink" wash tint ink mode
    uses for large soft fields. Multiplying a raw mid-value hue over a big
    area squares it toward a desaturated grey cloud (found empirically via
    pixel probes in Task 9 — see orbit-canvas.tsx's wash-tint notes), so
    soft fields start near paper value and glaze source-over instead. */
const wash = (
  [r, g, b]: [number, number, number],
  k: number,
): [number, number, number] => [
  Math.round(r + (255 - r) * k),
  Math.round(g + (255 - g) * k),
  Math.round(b + (255 - b) * k),
];

/* ── Neon Protocol — Real-Time Computer Vision ──────────────────────
   "See the city through the eyes of AI." A night skyline watched by a
   vision HUD: a scan beam sweeps the card and corner-bracket detection
   boxes lock onto drifting objects in its wake, fading until the next
   pass. Hover turns the ghost-faint HUD fully on.

   Ink mode: a blueprint city survey — skyline strips print as silhouette
   blocks, window twinkles become dark specks, the beam becomes a
   deepening band glazed across the paper, and the brackets/confidence
   bars read as surveyor's annotations (crisper on paper than on night). */

export function drawNeonProtocol(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rgb: [number, number, number],
  hot: number,
  t: number,
  scheme: "dark" | "light",
) {
  const [r, g, b] = rgb;
  const [hr, hg, hb] = highlight(rgb, scheme);
  const ink = scheme === "light";
  // Ink marks on paper need more body than glows on black; dark alphas
  // pass through untouched (see orbit-canvas.tsx's scaleA note — a
  // universal clamp regressed dark hover once already).
  const A = ink ? 1.8 : 1;
  const scaleA = (x: number): number => (ink ? Math.min(0.9, x * A) : x);
  // Printed silhouette wants more body than the generic ink scale gives the
  // skyline's faint dark-mode alphas (screenshot-tuned: at ×A the blocks
  // read as washed-out ghosts, not print). Same clamp.
  const scaleSky = (x: number): number =>
    ink ? Math.min(0.9, x * A * 1.5) : x;
  const [wr, wg, wb] = wash(rgb, 0.55);
  const [dr, dg, db] = wash(rgb, 0.3);
  const boost = 1 + 0.7 * hot;

  // Nebula wash anchored low, where the city sits. Ink: pale paper tint.
  const neb = ctx.createRadialGradient(
    w * 0.5,
    h * 0.95,
    0,
    w * 0.5,
    h * 0.95,
    Math.max(w, h) * 0.8,
  );
  const nebInk = ink ? `${wr},${wg},${wb}` : `${r},${g},${b}`;
  neb.addColorStop(0, `rgba(${nebInk},${scaleA(0.07 * boost)})`);
  neb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = ink ? "multiply" : "lighter";

  // ── Skyline ── deterministic building strips rising from the bottom
  // edge, each with a few window lights twinkling on hashed phases.
  // Ink: the strips multiply into printed silhouette blocks; the window
  // "lights" are already highlight()-coloured, so they flip to dark
  // specks punched into the blocks with no extra branch.
  const N = 16;
  const bw = w / N;
  for (let i = 0; i < N; i++) {
    const bh = h * (0.16 + 0.34 * hash(i * 7 + 1));
    const bx = i * bw;
    ctx.fillStyle = `rgba(${r},${g},${b},${scaleSky((0.05 + 0.04 * hash(i * 3 + 2)) * boost)})`;
    ctx.fillRect(bx + bw * 0.12, h - bh, bw * 0.76, bh);
    const windows = 2 + Math.floor(hash(i * 11 + 4) * 3);
    for (let k = 0; k < windows; k++) {
      const wx = bx + bw * (0.25 + 0.5 * hash(i * 31 + k * 17));
      const wy = h - bh * (0.15 + 0.7 * hash(i * 13 + k * 23));
      const tw =
        0.5 + 0.5 * Math.sin(t * (0.8 + hash(i * 5 + k) * 1.6) + k * 4 + i);
      ctx.beginPath();
      ctx.arc(wx, wy, 0.9, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hr},${hg},${hb},${scaleA((0.15 + 0.4 * tw) * boost)})`;
      ctx.fill();
    }
  }

  // ── Scan beam ── one sweep every 6s across an extended cycle so it
  // fully exits before re-entering. Phase-shifted (+0.7) so the t=0
  // static frame catches the beam mid-card with locks in its wake.
  // Ink: the beam is a LARGE SOFT FIELD — multiplying it (raw or washed)
  // over the nebula + skyline pools to grey mush, so it flips to a
  // source-over glaze: a translucent deepening band (mid wash body, deep
  // ink leading edge) sweeping the paper like a scanner shadow.
  const CYCLE = 1.3; // in card widths
  const beamU = fract(t / 6 + 0.7) * CYCLE - 0.15;
  const bx = beamU * w;
  const beamW = w * 0.07;
  const beam = ctx.createLinearGradient(bx - beamW, 0, bx + beamW * 0.4, 0);
  beam.addColorStop(0, "rgba(0,0,0,0)");
  if (ink) {
    ctx.globalCompositeOperation = "source-over";
    beam.addColorStop(
      0.85,
      `rgba(${dr},${dg},${db},${scaleA(0.07 + 0.13 * hot)})`,
    );
    beam.addColorStop(
      1,
      `rgba(${hr},${hg},${hb},${scaleA(0.14 + 0.25 * hot)})`,
    );
  } else {
    beam.addColorStop(0.85, `rgba(${r},${g},${b},${0.05 + 0.13 * hot})`);
    beam.addColorStop(1, `rgba(${hr},${hg},${hb},${0.1 + 0.25 * hot})`);
  }
  ctx.fillStyle = beam;
  ctx.fillRect(bx - beamW, 0, beamW * 1.4, h);
  // Back to wet-ink pooling for the HUD marks (no-op in dark scheme).
  if (ink) ctx.globalCompositeOperation = "multiply";

  // ── Detections ── four objects drifting on slow Lissajous paths. Lock
  // strength decays with distance behind the beam (wrapped), so brackets
  // flare as the beam passes and fade until the next sweep. Lock shapes
  // geometry-free styling only: bracket positions depend on t alone.
  for (let i = 0; i < 4; i++) {
    const cxu = 0.14 + 0.72 * hash(i * 13 + 5);
    const tx = (cxu + Math.sin(t * 0.27 + i * 2.1) * 0.04) * w;
    const ty =
      h *
      (0.3 + 0.38 * hash(i * 17 + 3) + Math.cos(t * 0.21 + i * 1.7) * 0.045);
    const s = Math.min(w, h) * (0.13 + 0.09 * hash(i * 29 + 8));

    let u = beamU - tx / w;
    if (u < 0) u += CYCLE;
    // Decay window spans most of the sweep cycle so 2–3 of the 4 boxes
    // stay lit at once; the tiny strip cards need that density to read.
    const lock = Math.pow(Math.max(0, 1 - u / 0.95), 0.7);
    if (lock <= 0.01) continue;
    const flicker = 0.82 + 0.18 * Math.sin(t * 16 + i * 5);
    // Ink lifts the rest floor: a blueprint annotation should be legible on
    // the page before hover, where the dark HUD deliberately idles
    // ghost-faint. Both reach 1.0 at full hover.
    const a = lock * flicker * (ink ? 0.3 + 0.7 * hot : 0.2 + 0.8 * hot);

    // Corner brackets. Ink: deep-ink strokes — HUD → blueprint annotation.
    const arm = s * 0.32;
    ctx.strokeStyle = `rgba(${hr},${hg},${hb},${scaleA(a)})`;
    ctx.lineWidth = 1 + hot;
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(tx + sx * s - sx * arm, ty + sy * s);
      ctx.lineTo(tx + sx * s, ty + sy * s);
      ctx.lineTo(tx + sx * s, ty + sy * s - sy * arm);
      ctx.stroke();
    }

    // Centroid dot + soft glow (glow damped in ink — a soft gradient at
    // dark strength multiplies into a smudge, same as orbit's particle
    // glows; a whisper of ink bleed is all the mark needs).
    ctx.beginPath();
    ctx.arc(tx, ty, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hr},${hg},${hb},${scaleA(a)})`;
    ctx.fill();
    const glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, s * 1.1);
    // Bypasses scaleA deliberately: `a` is already bounded to ~[0,1] by
    // construction (lock ≤1 × flicker ≤1 × a hover term ≤1), and the
    // 0.08/0.22 factor here is a per-scene damping ratio on that bounded
    // value (glow vs. dark), not a base alpha that needs the ink ×A scale
    // to gain body — so scaleA(a) * (ink ? 0.08 : 0.22) would double-count
    // the ink boost this mark was screenshot-tuned without.
    glow.addColorStop(0, `rgba(${r},${g},${b},${a * (ink ? 0.08 : 0.22)})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(tx, ty, s * 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Confidence bar above the box; fill level is hashed per object.
    const bwd = s * 1.3;
    const by = ty - s - 5;
    ctx.strokeStyle = `rgba(${r},${g},${b},${scaleA(a * 0.7)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx - bwd / 2, by);
    ctx.lineTo(tx + bwd / 2, by);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${hr},${hg},${hb},${scaleA(a)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx - bwd / 2, by);
    ctx.lineTo(tx - bwd / 2 + bwd * (0.62 + 0.34 * hash(i * 41 + 9)), by);
    ctx.stroke();
  }

  ctx.restore();
}

/* ── Signal Ward — NLP & Text Intelligence ──────────────────────────
   "Decode language. Save lives." Redacted-looking token rows stream
   past while attention arcs link a query token to its keys across rows,
   transformer-style; a faint EKG baseline keeps the ward on life
   support underneath. Hover lights the attention pattern up.

   Ink mode: the redaction metaphor turns literal — a censored dossier.
   Token rows become visible redaction bars on paper (extra alpha body
   beyond the generic ink scale), attention arcs and the EKG trace are
   ink annotations threaded between the bars. */

export function drawSignalWard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rgb: [number, number, number],
  hot: number,
  t: number,
  scheme: "dark" | "light",
) {
  const [r, g, b] = rgb;
  const [hr, hg, hb] = highlight(rgb, scheme);
  const ink = scheme === "light";
  const A = ink ? 1.8 : 1;
  const scaleA = (x: number): number => (ink ? Math.min(0.9, x * A) : x);
  // Redaction bars want more body than ×A gives their faint dark-mode
  // alphas — a censor's marker, not a watermark. Same clamp.
  const scaleBar = (x: number): number =>
    ink ? Math.min(0.9, x * A * 1.4) : x;
  const [wr, wg, wb] = wash(rgb, 0.55);
  const boost = 1 + 0.7 * hot;

  const neb = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    0,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.7,
  );
  const nebInk = ink ? `${wr},${wg},${wb}` : `${r},${g},${b}`;
  neb.addColorStop(0, `rgba(${nebInk},${scaleA(0.06 * boost)})`);
  neb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = ink ? "multiply" : "lighter";

  // ── Token rows ── three streams of hash-width blocks, middle row
  // counter-scrolling. Token x is periodic in t, so a token's position
  // at any instant is pure; arcs below reuse this exact function to
  // stay anchored to their tokens. Ink: the redaction bars themselves.
  const ROWS = 3;
  const pitch = w * 0.13;
  const count = Math.ceil(w / pitch) + 2;
  const cycle = count * pitch;
  const rowY = (j: number) => h * (0.24 + 0.2 * j);
  const speed = [9, -13, 7]; // px/s, hand-tuned drift
  const tokenX = (j: number, k: number) => {
    const off = t * speed[j];
    return ((((k * pitch - off) % cycle) + cycle) % cycle) - pitch;
  };
  const tokenW = (j: number, k: number) =>
    pitch * (0.42 + 0.4 * hash(j * 131 + k * 17 + 6));

  const th = Math.max(3, h * 0.045);
  for (let j = 0; j < ROWS; j++) {
    for (let k = 0; k < count; k++) {
      const x = tokenX(j, k);
      const a = (0.06 + 0.09 * hash(j * 51 + k * 7 + 2)) * boost;
      ctx.fillStyle = `rgba(${r},${g},${b},${scaleBar(a)})`;
      ctx.fillRect(x, rowY(j) - th / 2, tokenW(j, k), th);
    }
  }

  // ── Attention arcs ── each arc wakes on its own hashed schedule,
  // linking a middle-row query token to key tokens on the outer rows.
  // Faint ambient hint at rest; hover reveals the full pattern.
  for (let a = 0; a < 6; a++) {
    const ph = fract(t * 0.12 + hash(a * 7 + 3));
    if (ph > 0.42) continue;
    const win = Math.sin((Math.PI * ph) / 0.42);

    const qk = Math.floor(hash(a * 3 + 1) * count);
    const qx = tokenX(1, qk) + tokenW(1, qk) / 2;
    const qy = rowY(1);
    const keyRow = a % 2 === 0 ? 0 : 2;
    const kk = Math.floor(hash(a * 5 + 2) * count);
    const kx = tokenX(keyRow, kk) + tokenW(keyRow, kk) / 2;
    const ky = rowY(keyRow);

    const alpha = win * (0.1 + 0.45 * hot);
    ctx.strokeStyle = `rgba(${hr},${hg},${hb},${scaleA(alpha)})`;
    ctx.lineWidth = 0.8 + hot * 0.4;
    ctx.beginPath();
    ctx.moveTo(qx, qy);
    // Bow the arc gently away from the key row; the strip cards are short,
    // so a large bow would swing the curve across the card copy.
    ctx.quadraticCurveTo((qx + kx) / 2, qy + (qy - ky) * 0.45, kx, ky);
    ctx.stroke();

    // Endpoint glows: query bright, key dimmer (its attention weight).
    for (const [ex, ey, ea] of [
      [qx, qy, alpha * 1.4],
      [kx, ky, alpha * (0.5 + 0.5 * hash(a * 11 + 4))],
    ] as const) {
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hr},${hg},${hb},${scaleA(ea)})`;
      ctx.fill();
    }
  }

  // ── EKG baseline ── the ward's pulse. Amplitude is constant (geometry
  // must ignore hot); hover only brightens the trace.
  const yb = h * 0.85;
  const amp = h * 0.05;
  ctx.strokeStyle = `rgba(${r},${g},${b},${scaleA(0.12 + 0.2 * hot)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 3) {
    const d = ((x + t * 70) % 170) - 85;
    const blip = Math.sin((x * 0.05 + t * 2) * 4) * Math.exp((-d * d) / 190);
    const y = yb + blip * amp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.restore();
}

/* ── Nova Canvas — Multimodal & Generative AI ───────────────────────
   "Where AI learns to imagine." A diffusion loop: scattered noise
   particles converge into a five-petal nova bloom, hold it, then
   dissolve back to noise, forever. Per-particle stagger makes the
   convergence read as denoising rather than a rigid tween. The cycle
   is phase-shifted so t=0 (the reduced-motion frame) is fully formed.

   Ink mode: an engraving — the noise is a stipple field that condenses
   into an inked rose (the e-lerp toward highlight() runs hue → deep ink
   with no extra branch), under a soft terracotta glaze where the bloom
   swells. */

export function drawNovaCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rgb: [number, number, number],
  hot: number,
  t: number,
  scheme: "dark" | "light",
) {
  const [r, g, b] = rgb;
  const [hr, hg, hb] = highlight(rgb, scheme);
  const ink = scheme === "light";
  const A = ink ? 1.8 : 1;
  const scaleA = (x: number): number => (ink ? Math.min(0.9, x * A) : x);
  const [wr, wg, wb] = wash(rgb, 0.55);
  const [dr, dg, db] = wash(rgb, 0.3);
  const boost = 1 + 0.7 * hot;
  const cx = w * 0.5;
  const cy = h * 0.52;
  const R = Math.min(w, h) * 0.36;

  const P = 9; // seconds per noise→form→noise cycle
  const p = fract((t + P / 2) / P); // +P/2 → formed at t=0
  const m = 0.5 - 0.5 * Math.cos(2 * Math.PI * p); // 0 noise … 1 formed

  // Bloom swells with formation. Ink: a LARGE SOFT FIELD — glazed with
  // wash tints (deeper centre, pale mid) source-over, never raw multiply.
  const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (1.1 + 0.5 * m));
  if (ink) {
    neb.addColorStop(
      0,
      `rgba(${dr},${dg},${db},${scaleA((0.1 + 0.14 * m) * boost)})`,
    );
    neb.addColorStop(
      0.45,
      `rgba(${wr},${wg},${wb},${scaleA((0.05 + 0.06 * m) * boost)})`,
    );
  } else {
    neb.addColorStop(0, `rgba(${hr},${hg},${hb},${(0.1 + 0.14 * m) * boost})`);
    neb.addColorStop(0.45, `rgba(${r},${g},${b},${(0.05 + 0.06 * m) * boost})`);
  }
  neb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = ink ? "multiply" : "lighter";

  // Five-petal rose the particles condense onto; slow rotation keeps the
  // held figure alive between cycles.
  const rot = t * 0.1;
  const petal = (theta: number) =>
    R * (0.42 + 0.5 * Math.pow(Math.abs(Math.sin(2.5 * (theta + rot))), 1.4));

  const COUNT = 84;
  for (let i = 0; i < COUNT; i++) {
    // Noise home: scattered across the card. Form home: on the rose.
    const nx = hash(i * 3 + 1) * w;
    const ny = hash(i * 3 + 2) * h;
    const theta = (i / COUNT) * Math.PI * 2 + hash(i * 7 + 5) * 0.22;
    const fr = petal(theta) * (1 + 0.05 * Math.sin(t * 1.3 + i));
    const fx = cx + Math.cos(theta) * fr;
    const fy = cy + Math.sin(theta) * fr;

    // Staggered denoise: each particle snaps in on its own offset, so the
    // figure assembles from many directions instead of tweening rigidly.
    const mi = Math.min(1, Math.max(0, m * 1.45 - 0.45 * hash(i * 11 + 6)));
    const e = mi * mi * (3 - 2 * mi); // smoothstep
    const x = nx + (fx - nx) * e;
    const y = ny + (fy - ny) * e;

    const size = 0.7 + 1.5 * hash(i * 13 + 7);
    const a =
      (0.12 + 0.3 * hash(i * 17 + 8)) * (0.55 + 0.45 * e) * (1 + 1.1 * hot);
    // Colour rides formation: noise in world hue, figure toward the scheme
    // highlight — hot-white in dark, deep ink in light (highlight()
    // already flipped the lerp target, no branch needed).
    const pr = Math.round(r + (hr - r) * e);
    const pg = Math.round(g + (hg - g) * e);
    const pb = Math.round(b + (hb - b) * e);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${pr},${pg},${pb},${scaleA(a)})`;
    ctx.fill();
    if (size > 1.6) {
      // Halo disc: damped ×0.08 in ink (harder than orbit's ×0.16 gradient
      // lesson — this halo is a FLAT disc, so on paper anything stronger
      // prints a visible hard-edged ring instead of a soft ink bleed;
      // screenshot-tuned).
      ctx.beginPath();
      ctx.arc(x, y, size * 3.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pr},${pg},${pb},${ink ? scaleA(a) * 0.08 : a * 0.12})`;
      ctx.fill();
    }
  }

  // Once mostly formed, trace the rose outline so the figure reads even
  // between particles — the "finished render" emerging from the noise.
  if (m > 0.65) {
    const oa = ((m - 0.65) / 0.35) * (0.1 + 0.4 * hot);
    ctx.strokeStyle = `rgba(${hr},${hg},${hb},${scaleA(oa)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const SEG = 120;
    for (let s = 0; s <= SEG; s++) {
      const theta = (s / SEG) * Math.PI * 2;
      const rr = petal(theta);
      const x = cx + Math.cos(theta) * rr;
      const y = cy + Math.sin(theta) * rr;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Breathing core.
  const pulse = 1 + 0.15 * Math.sin(t * 1.7);
  ctx.beginPath();
  ctx.arc(cx, cy, 2.4 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${hr},${hg},${hb},${scaleA((0.5 + 0.4 * m) * boost)})`;
  ctx.fill();

  ctx.restore();
}

/* ── Terra Grid — Edge AI & Production ML ───────────────────────────
   "Where models meet the real world." A perspective ground grid rolls
   toward the viewer under a ridgeline horizon while edge nodes ping
   expanding rings and packets shuttle between them — a deployment mesh
   breathing in the field. Hover powers the whole grid up.

   Ink mode: the natural blueprint — a drafting table. Grid and ridgeline
   become drafting lines, node pings surveyor's marks with ranging rings,
   packets ink dots walking the survey lines; a pale ochre wash grounds
   the sheet. */

export function drawTerraGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rgb: [number, number, number],
  hot: number,
  t: number,
  scheme: "dark" | "light",
) {
  const [r, g, b] = rgb;
  const [hr, hg, hb] = highlight(rgb, scheme);
  const ink = scheme === "light";
  const A = ink ? 1.8 : 1;
  const scaleA = (x: number): number => (ink ? Math.min(0.9, x * A) : x);
  // Drafting lines want more body than the generic ink scale gives the
  // grid's faint dark-mode alphas — a blueprint's linework is its whole
  // voice (screenshot-tuned: at ×A the sheet read washed-out). Same clamp.
  const scaleLine = (x: number): number =>
    ink ? Math.min(0.9, x * A * 1.4) : x;
  const [wr, wg, wb] = wash(rgb, 0.55);
  const boost = 1 + 0.7 * hot;
  const yH = h * 0.36; // horizon
  const cx = w * 0.5;

  // Ground-hugging wash below the horizon. Ink: pale paper tint.
  const neb = ctx.createRadialGradient(cx, h, 0, cx, h, Math.max(w, h));
  const nebInk = ink ? `${wr},${wg},${wb}` : `${r},${g},${b}`;
  neb.addColorStop(0, `rgba(${nebInk},${scaleA(0.07 * boost)})`);
  neb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb;
  ctx.fillRect(0, yH, w, h - yH);

  ctx.save();
  ctx.globalCompositeOperation = ink ? "multiply" : "lighter";

  // ── Ridgeline ── layered sines, slow parallax drift; the "real world"
  // the grid is deployed into. Ink: the sheet's horizon drafting line.
  ctx.strokeStyle = `rgba(${r},${g},${b},${scaleLine(0.14 + 0.1 * hot)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) {
    const u = x / w;
    const y =
      yH -
      h *
        (0.05 * Math.sin(u * 7 + t * 0.05 + 1.3) +
          0.03 * Math.sin(u * 17 - t * 0.03 + 4.1) +
          0.045 * Math.sin(u * 3 + 0.7));
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // ── Perspective grid ── verticals converge on the vanishing point;
  // depth rungs roll toward the viewer on a wrapped clock (z pure in t).
  const VERT = 11;
  for (let m = 0; m <= VERT; m++) {
    const xb = (m / VERT) * w * 1.7 - w * 0.35;
    ctx.strokeStyle = `rgba(${r},${g},${b},${scaleLine(0.06 + 0.08 * hot)})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + (xb - cx) * 0.06, yH);
    ctx.lineTo(xb, h);
    ctx.stroke();
  }
  const RUNGS = 9;
  for (let k = 0; k < RUNGS; k++) {
    const z = fract(t * 0.1 + k / RUNGS);
    const y = yH + (h - yH) * z * z; // ease: rungs accelerate as they near
    ctx.strokeStyle = `rgba(${r},${g},${b},${scaleLine(z * (0.1 + 0.2 * hot))})`;
    ctx.lineWidth = 0.5 + z;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // ── Edge nodes ── fixed field positions; each pings an expanding ring
  // on its own hashed schedule. The mesh's heartbeat. Ink: surveyor's
  // marks — deep-ink dots with ranging rings scribed around them.
  const NODES = 5;
  const nodeX = (i: number) => w * (0.12 + 0.76 * hash(i * 19 + 2));
  const nodeY = (i: number) => yH + (h - yH) * (0.2 + 0.62 * hash(i * 23 + 4));
  const maxRing = Math.min(w, h) * 0.17;
  for (let i = 0; i < NODES; i++) {
    const nx = nodeX(i);
    const ny = nodeY(i);
    ctx.beginPath();
    ctx.arc(nx, ny, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hr},${hg},${hb},${scaleA(0.35 + 0.55 * hot)})`;
    ctx.fill();

    const ph = fract(t * 0.28 + hash(i * 5 + 1));
    ctx.beginPath();
    // Grounded ellipse ping: flattened to sit on the terrain plane.
    ctx.ellipse(nx, ny, ph * maxRing, ph * maxRing * 0.38, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hr},${hg},${hb},${scaleA((1 - ph) * (0.12 + 0.5 * hot))})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Packets ── inference traffic shuttling node-to-node, each on its
  // own loop with a short fading trail. Ink: ink dots on the survey lines.
  for (let i = 0; i < 6; i++) {
    const a = i % NODES;
    const bIdx = (i + 1 + (i % 2)) % NODES;
    const u = fract(t * (0.16 + 0.1 * hash(i * 37 + 3)) + hash(i * 29 + 6));
    for (let k = 0; k < 3; k++) {
      const uu = Math.max(0, u - k * 0.025);
      const px = nodeX(a) + (nodeX(bIdx) - nodeX(a)) * uu;
      const py = nodeY(a) + (nodeY(bIdx) - nodeY(a)) * uu;
      ctx.beginPath();
      ctx.arc(px, py, 1.3 - k * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hr},${hg},${hb},${scaleA((0.2 + 0.55 * hot) * (1 - k * 0.3))})`;
      ctx.fill();
    }
  }

  ctx.restore();
}
