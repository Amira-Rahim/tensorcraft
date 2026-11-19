(() => {
  "use strict";

  const PHASES = new Set(["idle", "guess", "teaching", "training", "result"]);
  const TAU = Math.PI * 2;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const ease = (value) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);
  const rgb = (values, alpha = 1) =>
    `rgba(${values.map((value) => Math.round(value)).join(",")},${alpha})`;

  function color(value, fallback = [155, 214, 189]) {
    if (typeof value !== "string") return fallback.slice();
    const hex = value.trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(hex))
      return hex.split("").map((channel) => parseInt(channel + channel, 16));
    if (/^[0-9a-f]{6}$/i.test(hex))
      return [0, 2, 4].map((start) =>
        parseInt(hex.slice(start, start + 2), 16),
      );
    return fallback.slice();
  }

  function readings(value) {
    if (
      !Array.isArray(value) ||
      value.length < 4 ||
      value.length > 256 ||
      !value.every(Number.isFinite)
    )
      return null;
    return value.slice();
  }

  class SignalStage {
    constructor(canvas, options) {
      this.canvas = canvas;
      try {
        this.context = canvas.getContext("2d", { alpha: true });
      } catch {
        this.context = null;
      }
      this.disposed = false;
      this.paused = false;
      this.visible = true;
      this.frame = 0;
      this.lastFrame = -Infinity;
      this.width = 1;
      this.height = 1;
      this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
      this.current = readings(options.values);
      this.from = this.current;
      this.to = this.current;
      this.tint = color(options.color);
      this.fromTint = this.tint.slice();
      this.toTint = this.tint.slice();
      this.phase = "idle";
      this.mode = options.mode === "line" ? "line" : "orbit";
      this.score = null;
      this.label = options.label || "";
      this.started = performance.now();
      this.changed = this.started;
      this.activeUntil = this.started + 3200;
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

      canvas.setAttribute("aria-hidden", "true");
      canvas.setAttribute("role", "presentation");
      canvas.dataset.phase = this.phase;
      canvas.dataset.projection = this.mode;

      this.onPointer = (event) => {
        if (this.reduced.matches || this.paused || !this.visible) return;
        const rect = canvas.getBoundingClientRect();
        this.pointer.targetX = clamp(
          ((event.clientX - rect.left) / rect.width - 0.5) * 2,
          -1,
          1,
        );
        this.pointer.targetY = clamp(
          ((event.clientY - rect.top) / rect.height - 0.5) * 2,
          -1,
          1,
        );
        this.activeUntil = performance.now() + 1100;
        this.schedule();
      };
      this.onLeave = () => {
        this.pointer.targetX = 0;
        this.pointer.targetY = 0;
        this.activeUntil = performance.now() + 1100;
        this.schedule();
      };
      this.onMotion = () => {
        this.stop();
        this.activeUntil = performance.now() + 800;
        this.draw(performance.now());
        if (!this.reduced.matches) this.schedule();
      };
      this.onVisibility = () => {
        if (document.hidden) this.stop();
        else {
          this.activeUntil = performance.now() + 700;
          this.schedule();
        }
      };

      canvas.addEventListener("pointermove", this.onPointer, { passive: true });
      canvas.addEventListener("pointerleave", this.onLeave, { passive: true });
      document.addEventListener("visibilitychange", this.onVisibility);
      if (this.reduced.addEventListener)
        this.reduced.addEventListener("change", this.onMotion);
      else this.reduced.addListener(this.onMotion);

      if (typeof ResizeObserver === "function") {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas);
      }
      if (typeof IntersectionObserver === "function") {
        this.intersectionObserver = new IntersectionObserver(
          (entries) => {
            this.visible = entries[0].isIntersecting;
            if (!this.visible) this.stop();
            else {
              this.activeUntil = performance.now() + 900;
              this.schedule();
            }
          },
          { rootMargin: "40px" },
        );
        this.intersectionObserver.observe(canvas);
      }
      this.resize();
    }

    resize() {
      if (this.disposed || !this.context) return;
      const rect = this.canvas.getBoundingClientRect();
      this.width = Math.max(1, rect.width || this.canvas.clientWidth || 800);
      this.height = Math.max(1, rect.height || this.canvas.clientHeight || 460);
      const ratio = clamp(window.devicePixelRatio || 1, 1, 2);
      this.canvas.width = Math.round(this.width * ratio);
      this.canvas.height = Math.round(this.height * ratio);
      this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.activeUntil = Math.max(this.activeUntil, performance.now() + 650);
      this.draw(performance.now());
      this.schedule();
    }

    setState(next = {}) {
      if (this.disposed) return;
      const now = performance.now();
      this.sample(now);
      const values = readings(next.values);
      if (values) {
        this.from = this.current ? this.current.slice() : values.slice();
        this.to = values;
      } else if (this.current) {
        this.from = this.current.slice();
        this.to = this.to ? this.to.slice() : this.current.slice();
      }
      this.fromTint = this.tint.slice();
      this.toTint = next.color
        ? color(next.color, this.tint)
        : this.toTint.slice();
      if (PHASES.has(next.phase)) this.phase = next.phase;
      if (next.mode === "line" || next.mode === "orbit") this.mode = next.mode;
      if (typeof next.label === "string") this.label = next.label;
      if (Object.hasOwn(next, "score"))
        this.score = Number.isFinite(next.score)
          ? clamp(next.score, 0, 1)
          : null;
      this.changed = now;
      this.activeUntil = now + (this.phase === "result" ? 2400 : 1800);
      this.canvas.dataset.phase = this.phase;
      this.canvas.dataset.projection = this.mode;
      this.draw(now);
      this.schedule();
    }

    sample(now) {
      if (!this.to) return;
      const amount =
        this.reduced.matches || this.paused
          ? 1
          : ease((now - this.changed) / 680);
      this.current = this.to.map((value, index) => {
        const previous =
          this.from && this.from.length === this.to.length
            ? this.from[index]
            : value;
        return mix(previous, value, amount);
      });
      this.tint = this.toTint.map((value, index) =>
        mix(this.fromTint[index], value, amount),
      );
    }

    schedule() {
      if (
        this.frame ||
        this.disposed ||
        !this.context ||
        !this.visible ||
        document.hidden
      )
        return;
      if (this.reduced.matches || this.paused) {
        this.draw(performance.now());
        return;
      }
      this.frame = window.requestAnimationFrame((now) => this.tick(now));
    }

    tick(now) {
      this.frame = 0;
      if (this.disposed || !this.visible || document.hidden) return;
      if (now - this.lastFrame > 31) {
        this.lastFrame = now;
        this.draw(now);
      }
      if (this.phase === "training" || now < this.activeUntil) this.schedule();
    }

    stop() {
      if (this.frame) window.cancelAnimationFrame(this.frame);
      this.frame = 0;
    }

    draw(now) {
      if (this.disposed || !this.context) return;
      this.sample(now);
      const ctx = this.context;
      const width = this.width;
      const height = this.height;
      ctx.clearRect(0, 0, width, height);
      if (!this.current) return;

      const staticView = this.reduced.matches || this.paused;
      const age = (now - this.changed) / 1000;
      const intro = staticView ? 1 : ease((now - this.started) / 1500);
      const settling = staticView ? 0 : Math.exp(-age * 1.15);
      const breath = staticView ? 0 : Math.sin(age * 1.55) * settling;
      const training = this.phase === "training";
      const result = this.phase === "result";
      const reactive = this.phase !== "idle";
      const energy = this.score === null ? 0.9 : 0.84 + this.score * 0.16;
      const values = this.current;
      const orbit = this.mode === "orbit";
      const magnitude = Math.max(1, ...values.map(Math.abs));
      const base = this.tint;
      const cool = base.map((channel, index) =>
        mix(channel, [109, 140, 255][index], 0.58),
      );
      const light = base.map((channel) => mix(channel, 255, 0.77));
      const scale = orbit
        ? Math.min(width / 4.2, height / 3.65)
        : Math.min(width / 4.55, height / 2.74);
      const cx = width * 0.5;
      const cy = height * 0.48;
      this.pointer.x = mix(this.pointer.x, this.pointer.targetX, 0.13);
      this.pointer.y = mix(this.pointer.y, this.pointer.targetY, 0.13);
      const rotateY = (orbit ? -0.22 : -0.31) + this.pointer.x * 0.085;
      const rotateX = (orbit ? -0.56 : -0.51) + this.pointer.y * 0.06;
      const rotateZ = (orbit ? -0.18 : -0.065) + breath * 0.008;
      const depth =
        0.48 +
        (1 - intro) * 0.18 +
        (reactive ? settling * 0.08 : 0) +
        (training ? 0.04 : 0);

      const project = (x, y, z) => {
        const rx = x * Math.cos(rotateY) + z * Math.sin(rotateY);
        const rz = z * Math.cos(rotateY) - x * Math.sin(rotateY);
        const ry = y * Math.cos(rotateX) - rz * Math.sin(rotateX);
        const dz = rz * Math.cos(rotateX) + y * Math.sin(rotateX);
        const px = rx * Math.cos(rotateZ) - ry * Math.sin(rotateZ);
        const py = rx * Math.sin(rotateZ) + ry * Math.cos(rotateZ);
        const perspective = 5.4 / (5.4 + dz);
        return {
          x: cx + px * scale * perspective,
          y: cy + py * scale * perspective,
          z: dz,
          perspective,
        };
      };

      const valueAt = (t) => {
        const position = clamp(t, 0, 1) * (values.length - 1);
        const index = Math.floor(position);
        return mix(
          values[index],
          values[Math.min(index + 1, values.length - 1)],
          position - index,
        );
      };
      const point = (t, lane = 0) => {
        const value = valueAt(t) / magnitude;
        if (orbit) {
          const angle = t * TAU - Math.PI / 2;
          const fold = angle * 2 + Math.sin(angle * 2) * 0.24;
          const radius =
            1.14 + value * 0.36 + lane * depth * Math.cos(fold) * 0.49;
          return project(
            Math.cos(angle) * radius * 1.13,
            Math.sin(angle) * radius,
            value * 0.22 + lane * depth * Math.sin(fold),
          );
        }
        const angle = -0.6 + t * TAU * 0.9 + Math.sin(t * TAU) * 0.24;
        return project(
          (t - 0.5) * 3.87,
          -value * 0.78 + lane * depth * Math.sin(angle),
          lane * depth * Math.cos(angle),
        );
      };
      const trace = (lane) => {
        ctx.beginPath();
        for (let index = 0; index < values.length; index++) {
          const p = point(index / (values.length - 1), lane);
          if (index === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
      };

      const aura = ctx.createRadialGradient(cx, cy, 1, cx, cy, scale * 1.8);
      aura.addColorStop(0, rgb(base, 0.09 * energy));
      aura.addColorStop(0.45, rgb(cool, 0.045));
      aura.addColorStop(1, rgb(base, 0));
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      // The surrounding traces are an illustrative depth treatment of one input.
      // The centreline always uses the supplied sample values.
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let lane = 10; lane >= 0; lane--) {
        const a = -1 + (lane / 11) * 2;
        const b = -1 + ((lane + 1) / 11) * 2;
        for (let index = 0; index < values.length - 1; index++) {
          const t0 = index / (values.length - 1);
          const t1 = (index + 1) / (values.length - 1);
          const p0 = point(t0, a),
            p1 = point(t1, a),
            p2 = point(t1, b),
            p3 = point(t0, b);
          const glancing = Math.abs(values[index + 1] - values[index]);
          const strength =
            (orbit ? 0.15 : 0.075) + glancing * 0.16 + Math.abs(a) * 0.028;
          const gloss = orbit
            ? Math.pow(Math.sin(t0 * TAU + 0.8), 2) * 0.44
            : 0;
          const tint = base.map((channel, channelIndex) => {
            const face = mix(channel, cool[channelIndex], lane / 16);
            return mix(face, [236, 164, 232][channelIndex], gloss);
          });
          ctx.fillStyle = rgb(tint, strength * intro * energy);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();
          ctx.fill();
        }
      }

      for (let index = 0; index <= 18; index++) {
        const lane = -1 + (index / 18) * 2;
        const rim = Math.pow(Math.abs(lane), 4);
        trace(lane);
        ctx.lineWidth = rim > 0.7 ? 1.25 : 0.65;
        ctx.strokeStyle = rgb(
          index < 9 ? cool : base,
          (0.12 + rim * 0.4) * intro,
        );
        ctx.stroke();
      }

      // Reading cross-sections create the physical ribbon, rather than random particles.
      for (let index = 0; index < values.length; index += 2) {
        const t = index / (values.length - 1);
        const back = point(t, -1),
          front = point(t, 1);
        ctx.beginPath();
        ctx.moveTo(back.x, back.y);
        ctx.lineTo(front.x, front.y);
        ctx.strokeStyle = rgb(base, 0.07 * intro);
        ctx.lineWidth = 0.65;
        ctx.stroke();
      }

      ctx.shadowColor = rgb(base, 0.75);
      ctx.shadowBlur = scale * 0.08;
      trace(0);
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = rgb(base, 0.72 * intro);
      ctx.stroke();
      ctx.shadowBlur = 0;
      trace(0);
      ctx.lineWidth = 1.35;
      ctx.strokeStyle = rgb(light, 0.96 * intro);
      ctx.stroke();

      for (let index = 0; index < values.length; index++) {
        const p = point(index / (values.length - 1));
        ctx.beginPath();
        ctx.arc(p.x, p.y, index % 4 === 0 ? 1.65 : 0.9, 0, TAU);
        ctx.fillStyle = rgb(light, (index % 4 === 0 ? 0.84 : 0.4) * intro);
        ctx.fill();
      }

      for (let index = 1; index < values.length - 1; index++) {
        if (
          values[index] <= values[index - 1] ||
          values[index] <= values[index + 1] ||
          values[index] < 0
        )
          continue;
        const p = point(index / (values.length - 1));
        const radius = clamp(scale * 0.05, 6, 13);
        const glow = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          radius * 2.5,
        );
        glow.addColorStop(0, rgb(base, 0.3 * intro));
        glow.addColorStop(1, rgb(base, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(
          p.x - radius * 2.5,
          p.y - radius * 2.5,
          radius * 5,
          radius * 5,
        );
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, TAU);
        ctx.strokeStyle = rgb(base, 0.23 * intro);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, TAU);
        ctx.fillStyle = rgb(light, 0.94 * intro);
        ctx.fill();
      }

      const scanActive = training || (!staticView && now - this.started < 2900);
      if (scanActive && !staticView) {
        const scan = training
          ? ((now - this.changed) / 1900) % 1
          : clamp((now - this.started - 350) / 2200, 0, 1);
        const head = point(scan);
        ctx.beginPath();
        for (let offset = 0; offset < 20; offset++) {
          const p = point(clamp(scan - 0.13 + (offset / 19) * 0.13, 0, 1));
          if (!offset) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.shadowColor = rgb(light, 0.9);
        ctx.shadowBlur = 18;
        ctx.strokeStyle = rgb(light, 0.93);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 4, 0, TAU);
        ctx.fillStyle = "rgba(255,255,244,0.96)";
        ctx.fill();
      }

      if (result && !staticView && age < 1.8) {
        const ring = ease(age / 1.8);
        const p = project(0, 0, 0);
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y,
          scale * (0.45 + ring * 1.6),
          scale * (0.09 + ring * 0.29),
          -0.06,
          0,
          TAU,
        );
        ctx.strokeStyle = rgb(base, (1 - ring) * 0.23);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    setPaused(value) {
      this.paused = Boolean(value);
      this.stop();
      this.activeUntil = performance.now() + 900;
      this.draw(performance.now());
      if (!this.paused) this.schedule();
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.stop();
      this.resizeObserver?.disconnect();
      this.intersectionObserver?.disconnect();
      this.canvas.removeEventListener("pointermove", this.onPointer);
      this.canvas.removeEventListener("pointerleave", this.onLeave);
      document.removeEventListener("visibilitychange", this.onVisibility);
      if (this.reduced.removeEventListener)
        this.reduced.removeEventListener("change", this.onMotion);
      else this.reduced.removeListener(this.onMotion);
      this.context?.clearRect(0, 0, this.width, this.height);
    }
  }

  let active = null;
  let userPaused = false;
  window.TensorcraftPatternStage = Object.freeze({
    mount(canvasOrId, options = {}) {
      active?.dispose();
      const canvas =
        typeof canvasOrId === "string"
          ? document.getElementById(canvasOrId)
          : canvasOrId;
      if (!canvas || typeof canvas.getContext !== "function") return null;
      active = new SignalStage(canvas, options);
      if (userPaused) active.setPaused(true);
      return active;
    },
    setState(next) {
      active?.setState(next);
    },
    setPaused(value) {
      userPaused = Boolean(value);
      active?.setPaused(userPaused);
    },
    dispose() {
      active?.dispose();
      active = null;
    },
  });
})();
