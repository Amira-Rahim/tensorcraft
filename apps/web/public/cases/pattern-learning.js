(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const labels = { wide: "Wide pulses", tight: "Tight pulses" };
  const colors = { wide: "#9bd6bd", tight: "#f2aa83" };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const guesses = [...document.querySelectorAll("[data-guess]")];
  const labelButtons = [...document.querySelectorAll("[data-label]")];
  const atmosphere = $("atmosphere");
  const ns = "http://www.w3.org/2000/svg";
  const percent = (value) => (value * 100).toFixed(1) + "%";
  let initial = null,
    chosenLabel = null,
    userGuess = null,
    busy = false,
    result = null;
  let view = "intro",
    motionPaused = reduced.matches,
    stage = null;
  // A double click on "Teach this model" or on a guess must not also press
  // the button that appears under the pointer in the next view.
  const SETTLE_MS = 500;
  let viewChangedAt = -Infinity;
  const settling = () => performance.now() - viewChangedAt < SETTLE_MS;

  function node(tag, attrs) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) =>
      el.setAttribute(key, value),
    );
    return el;
  }
  function drawWave(id, sample, color) {
    const svg = $(id),
      [, , width, height] = svg.getAttribute("viewBox").split(" ").map(Number);
    const max = initial.maxAbsoluteValue || 1,
      margin = id === "probe-wave" ? 9 : 4,
      values = sample.values;
    const x = (i) => margin + (i * (width - margin * 2)) / (values.length - 1);
    const y = (value) => height / 2 - (value * (height / 2 - margin)) / max;
    svg.replaceChildren();
    [height * 0.25, height * 0.5, height * 0.75].forEach((value) =>
      svg.append(
        node("line", {
          x1: 0,
          x2: width,
          y1: value,
          y2: value,
          class: "wave-grid",
        }),
      ),
    );
    svg.style.color = color || "#edf4e9";
    svg.append(
      node("polyline", {
        points: values.map((v, i) => `${x(i)},${y(v)}`).join(" "),
        class: "wave-line",
      }),
    );
  }
  function stageState(state) {
    try {
      stage?.setState({ ...state, values: initial.probe.values });
    } catch (error) {
      document.body.classList.add("no-stage");
    }
  }
  function setView(next, { focus = true } = {}) {
    view = next;
    viewChangedAt = performance.now();
    document.body.dataset.view = next;
    $("intro-view").hidden = next !== "intro";
    $("controls-view").hidden = next === "intro";
    $("predict-step").hidden = next !== "predict";
    $("first-reveal").hidden = !["teaching", "training"].includes(next);
    $("after-training").hidden = next !== "result";
    $("reset").hidden = next === "intro";
    const chapter = next === "training" ? "teaching" : next;
    document.querySelectorAll("[data-chapter]").forEach((el) => {
      const active = el.dataset.chapter === chapter;
      el.classList.toggle("active", active);
      if (active) el.setAttribute("aria-current", "step");
      else el.removeAttribute("aria-current");
    });
    $("visual-caption").textContent =
      next === "intro" || next === "predict"
        ? "A pattern your model has never trained on"
        : "The same test pattern, still outside training";
    if (focus && next !== "intro" && next !== "training") {
      const heading =
        next === "predict"
          ? $("experiment-title")
          : next === "result"
            ? $("after-title")
            : $("teaching-heading");
      heading.focus({ preventScroll: true });
    }
  }
  function updateInterpretation(prediction, context) {
    $("interpretation").hidden = false;
    $("visual-context").textContent = context;
    $("visual-label").textContent =
      prediction.labelText || labels[prediction.label];
    $("visual-label").style.color = colors[prediction.label];
    $("visual-score").textContent = "Model score " + percent(prediction.score);
    drawWave("probe-wave", initial.probe, colors[prediction.label]);
  }
  function setMotion(paused) {
    motionPaused = paused;
    document.body.classList.toggle("motion-paused", paused);
    $("motion-control").setAttribute("aria-pressed", String(paused));
    $("motion-control").textContent = paused ? "Resume motion" : "Pause motion";
    $("motion-control").hidden = reduced.matches;
    if (paused) atmosphere.pause();
    else atmosphere.play()?.catch(() => {});
    stage?.setPaused(paused);
  }
  function progress(update) {
    const current = typeof update === "number" ? update : update.epoch || 0;
    const total = typeof update === "object" ? update.totalEpochs || 160 : 160;
    $("training-progress").max = total;
    $("training-progress").value = current;
    $("status").textContent = initial
      ? `Training with your example. Pass ${current} of ${total}.`
      : "Preparing a model from four supplied examples…";
  }
  function setBusy(value) {
    busy = value;
    $("enter").disabled = value || !initial;
    $("train").disabled = value || !chosenLabel;
    labelButtons.forEach((button) => (button.disabled = value));
    $("try-label").disabled = value;
    $("reset").disabled = value;
    guesses.forEach(
      (button) => (button.disabled = value || !initial || Boolean(userGuess)),
    );
  }
  function selectLabel(label, { keepView = false } = {}) {
    if (busy) return;
    chosenLabel = label;
    labelButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.label === label),
      ),
    );
    drawWave("teaching-wave", initial.teachingExample, colors[label]);
    $("train").textContent = `Train with “${labels[label]}”`;
    $("train").disabled = false;
    if (result) {
      $("after-training").hidden = true;
      $("payoff").hidden = true;
      $("status").textContent =
        "Your label has changed. Train again to see its effect.";
      if (!keepView) setView("teaching");
    }
  }
  function guess(label) {
    if (!initial || busy || userGuess) return;
    userGuess = label;
    guesses.forEach((button) => {
      button.disabled = true;
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.guess === label),
      );
    });
    const baseline = initial.baselinePrediction;
    $("your-guess").textContent = `You chose ${labels[label]}.`;
    $("first-reveal-title").textContent =
      `The model first chose ${baseline.labelText}.`;
    $("baseline-score").textContent = "Model score " + percent(baseline.score);
    $("reveal-question").textContent =
      label === baseline.label
        ? "You agree with the model. Give it another example and see what changes."
        : "You and the model disagree. Label another example and train it again.";
    $("status").textContent =
      "The model has seen four examples. You can add a fifth.";
    updateInterpretation(baseline, "After four supplied examples");
    setView("teaching");
    stageState({
      phase: "guess",
      color: colors[baseline.label],
      label: baseline.labelText,
      score: baseline.score,
    });
    window.dispatchEvent(
      new CustomEvent("tensorcraft:pattern-guess", {
        detail: { guess: label, prediction: baseline },
      }),
    );
  }
  function comparison(prefix, prediction) {
    $(prefix + "-label").textContent =
      prediction.labelText || labels[prediction.label];
    $(prefix + "-score").textContent =
      "Model score " + percent(prediction.score);
    $(prefix + "-bar").style.background = colors[prediction.label];
    $(prefix + "-bar").style.width = percent(prediction.score);
    drawWave(prefix + "-wave", initial.probe, colors[prediction.label]);
  }
  async function train() {
    if (!chosenLabel || busy || !initial) return;
    const usedLabel = chosenLabel;
    setBusy(true);
    setView("training", { focus: false });
    $("training-progress").hidden = false;
    $("training-progress").value = 0;
    $("status").classList.remove("error");
    $("status").textContent = "Training on five examples…";
    stageState({ phase: "training", color: colors[usedLabel] });
    try {
      const output = await window.TensorcraftPatternModel.train(usedLabel, {
        onProgress: progress,
      });
      result = output;
      const before = initial.baselinePrediction,
        after = output.after;
      $("after-title").textContent =
        after.label !== before.label
          ? "Your example changed its answer."
          : "It kept the same answer.";
      comparison("before", before);
      comparison("after", after);
      $("outcome-copy").textContent =
        after.label !== before.label
          ? "The test pattern stayed the same. Your new teaching example changed the model’s prediction."
          : `You labeled the example ${labels[usedLabel]}. The model still chooses ${labels[after.label]}. Try the other label and compare.`;
      $("payoff").hidden = false;
      updateInterpretation(after, "After your teaching example");
      $("status").textContent =
        `Training finished on ${output.trainingCount} examples. The model now chooses ${after.labelText}.`;
      $("try-label").textContent =
        `Try ${labels[usedLabel === "wide" ? "tight" : "wide"]}`;
      setView("result");
      stageState({
        phase: "result",
        color: colors[after.label],
        label: after.labelText,
        score: after.score,
      });
      window.dispatchEvent(
        new CustomEvent("tensorcraft:pattern-result", {
          detail: { teachingLabel: usedLabel, ...output },
        }),
      );
    } catch (error) {
      setView("teaching");
      $("status").classList.add("error");
      $("status").textContent =
        "Training could not finish. Try again, or explore the course below.";
      const current = result?.after || initial.baselinePrediction;
      updateInterpretation(current, "Last completed training");
      stageState({
        phase: "teaching",
        color: colors[current.label],
        label: current.labelText,
        score: current.score,
      });
    } finally {
      $("training-progress").hidden = true;
      setBusy(false);
    }
  }
  async function initialize() {
    setBusy(true);
    $("status").classList.remove("error");
    try {
      if (!window.TensorcraftPatternModel) throw new Error("Model unavailable");
      initial = await window.TensorcraftPatternModel.initialize({
        onProgress: progress,
      });
      drawWave("example-wide", initial.samples.wide[0], colors.wide);
      drawWave("example-tight", initial.samples.tight[0], colors.tight);
      drawWave("probe-wave", initial.probe);
      drawWave("teaching-wave", initial.teachingExample, "#e6ede8");
      initial.trainingExamples.forEach((sample, index) => {
        const figure = document.createElement("figure");
        const svg = node("svg", {
          id: "training-" + index,
          viewBox: "0 0 220 60",
          role: "img",
          "aria-label": sample.labelText + " training example " + (index + 1),
        });
        const caption = document.createElement("figcaption");
        caption.textContent = sample.labelText;
        figure.append(svg, caption);
        $("training-gallery").append(figure);
        drawWave("training-" + index, sample, colors[sample.label]);
      });
      try {
        if (!window.TensorcraftPatternStage)
          throw new Error("Stage unavailable");
        stage = window.TensorcraftPatternStage.mount("signal-stage", {
          values: initial.probe.values,
          color: "#d7eee5",
          mode: "orbit",
        });
        stage.setPaused(motionPaused);
      } catch (error) {
        document.body.classList.add("no-stage");
      }
      $("enter").textContent = "Teach this model";
      $("status").textContent = "A real model, running here in your browser.";
      setBusy(false);
      window.dispatchEvent(
        new CustomEvent("tensorcraft:pattern-ready", {
          detail: { version: initial.version },
        }),
      );
    } catch (error) {
      $("status").classList.add("error");
      $("status").textContent =
        "The model could not load. Refresh to retry, or start the free lessons.";
      setBusy(false);
      $("enter").disabled = true;
      // The status line sits below the fold on phones, so say it here too.
      $("enter").textContent = "Model did not load";
      const note = document.querySelector(".intro-view .free-note");
      if (note)
        note.textContent =
          "The model could not load. Refresh to retry, or start the free lessons.";
      guesses.forEach((button) => (button.disabled = true));
    }
  }
  $("enter").addEventListener("click", () => {
    if (!initial || busy) return;
    setView("predict");
    stageState({ phase: "idle", color: "#d7eee5" });
    $("status").textContent = "Choose a label for the test pattern.";
  });
  guesses.forEach((button) =>
    button.addEventListener("click", () => {
      if (!settling()) guess(button.dataset.guess);
    }),
  );
  labelButtons.forEach((button) =>
    button.addEventListener("click", () => {
      if (settling()) return;
      selectLabel(button.dataset.label);
      // On short phone screens Train can sit just below the fold.
      $("train").scrollIntoView({
        block: "nearest",
        behavior: reduced.matches ? "auto" : "smooth",
      });
    }),
  );
  $("train").addEventListener("click", train);
  $("try-label").addEventListener("click", () => {
    if (busy) return;
    selectLabel(chosenLabel === "wide" ? "tight" : "wide", { keepView: true });
    train();
  });
  $("reset").addEventListener("click", () => {
    if (!busy) window.location.reload();
  });
  $("motion-control").addEventListener("click", () => setMotion(!motionPaused));
  if (reduced.addEventListener)
    reduced.addEventListener("change", () => setMotion(reduced.matches));
  setMotion(motionPaused);
  if (window.IntersectionObserver) {
    new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) atmosphere.pause();
        else if (!motionPaused) atmosphere.play()?.catch(() => {});
      },
      { threshold: 0.05 },
    ).observe($("experiment"));
  }
  const supplied = new URLSearchParams(window.location.search).get(
    "utm_source",
  );
  if (supplied && /^[a-z0-9_-]{1,60}$/i.test(supplied))
    ["top-course", "bottom-course"].forEach((id) => {
      const el = $(id),
        url = new URL(el.href);
      url.searchParams.set("utm_source", supplied);
      el.href = url.href;
    });
  initialize();
})();
