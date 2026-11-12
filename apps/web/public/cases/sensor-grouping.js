(() => {
  "use strict";
  const recording = [
    [2, 20, 5, 8],
    [3, 18, 7, 8],
    [4, 16, 6, 9],
  ];
  const $ = (id) => document.getElementById(id);
  const ns = "http://www.w3.org/2000/svg";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const readings = recording.flatMap((row, moment) =>
    row.map((value, sensor) => ({ value, moment, sensor })),
  );
  const board = $("token-board");
  const slider = $("replay");
  const operationButtons = [...document.querySelectorAll("[data-operation]")];
  let ready = false,
    currentOperation = null,
    currentOutput = null,
    progress = 0,
    selected = null,
    hasTraced = false;
  let moveFrame = 0,
    chartFrame = 0,
    chartValues = [2, 20, 5];
  const axes = [];
  const letters = ["A", "B", "C", "D"];
  const colors = ["#9ad8be", "#c6b7ef", "#e7aaa0", "#9cc5e2"];

  function node(tag, attrs = {}, text) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) =>
      el.setAttribute(key, value),
    );
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function drawChart(svg, values, interactive = false, correct = false) {
    svg.replaceChildren();
    const x = (i) => 52 + i * 244;
    const y = (v) => 188 - (v / 22) * 150;
    if (interactive) {
      const defs = node("defs");
      const gradient = node("linearGradient", {
        id: "opening-fill",
        x1: "0",
        x2: "0",
        y1: "0",
        y2: "1",
      });
      gradient.append(
        node("stop", {
          offset: "0%",
          "stop-color": "#e8b778",
          "stop-opacity": ".18",
        }),
        node("stop", {
          offset: "100%",
          "stop-color": "#e8b778",
          "stop-opacity": "0",
        }),
      );
      defs.append(gradient);
      svg.append(defs);
    }
    [0, 10, 20].forEach((tick) => {
      svg.append(
        node("line", {
          x1: 52,
          x2: 540,
          y1: y(tick),
          y2: y(tick),
          class: "plot-grid",
        }),
        node(
          "text",
          { x: 37, y: y(tick) + 4, "text-anchor": "end", class: "plot-axis" },
          tick,
        ),
      );
    });
    svg.append(
      node("text", { x: 52, y: 17, class: "plot-axis" }, "Reading value"),
    );
    const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    if (interactive)
      svg.append(
        node("polygon", {
          points: `52,188 ${points} 540,188`,
          class: "plot-area",
        }),
      );
    const line = node("polyline", { points, class: "plot-line" });
    if (correct) line.style.stroke = colors[0];
    svg.append(line);
    values.forEach((value, index) => {
      const group = node(
        "g",
        interactive
          ? {
              class: "trace-point",
              role: "button",
              tabindex: "0",
              "aria-label": `Trace reading ${value} from chart point ${index + 1}`,
            }
          : {},
      );
      if (interactive && index === 1)
        group.append(
          node("circle", {
            cx: x(index),
            cy: y(value),
            r: 17,
            class: "plot-halo",
          }),
        );
      group.append(
        node("circle", {
          cx: x(index),
          cy: y(value),
          r: 6,
          class: "plot-point",
        }),
        node(
          "text",
          {
            x: x(index),
            y: y(value) - 17,
            "text-anchor": "middle",
            class: "plot-value",
          },
          Number.isInteger(value) ? value : value.toFixed(1),
        ),
      );
      if (correct) group.querySelector("circle").style.stroke = colors[0];
      if (interactive) {
        group.append(
          node("circle", {
            cx: x(index),
            cy: y(value),
            r: 25,
            class: "plot-hit",
          }),
        );
        group.addEventListener("click", () => tracePoint(index));
        group.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            tracePoint(index);
          }
        });
      }
      svg.append(
        group,
        node(
          "text",
          { x: x(index), y: 222, "text-anchor": "middle", class: "plot-axis" },
          `Moment ${index + 1}`,
        ),
      );
    });
  }
  function tracePoint(index) {
    hasTraced = true;
    const reading = readings[index];
    [...$("opening-chart").querySelectorAll(".trace-point")].forEach((el, i) =>
      el.classList.toggle("picked", i === index),
    );
    const receipt = $("trace-receipt");
    receipt.classList.add("found");
    receipt.querySelector(".receipt-symbol").textContent =
      letters[reading.sensor];
    const text = receipt.querySelector("p");
    text.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = `${reading.value} came from sensor ${letters[reading.sensor]}, moment ${reading.moment + 1}. `;
    text.append(
      strong,
      document.createTextNode(
        index === 0
          ? "This point belongs to A. Does the peak?"
          : "The chart put a different sensor on A’s line.",
      ),
    );
    $("trace-prompt").textContent =
      index === 1
        ? "20 is a real reading from B at moment 1."
        : "You found the source. Check another point.";
    $("trace-next").textContent = "Find out how the readings got mixed";
    selectReading(reading);
    window.dispatchEvent(
      new CustomEvent("tensorcraft:case-trace", {
        detail: {
          value: reading.value,
          sensor: letters[reading.sensor],
          moment: reading.moment + 1,
        },
      }),
    );
  }
  function selectReading(reading) {
    selected = reading;
    readings.forEach((item) => {
      item.el.classList.toggle("is-selected", item === reading);
      item.el.classList.toggle("dimmed", item.sensor !== reading.sensor);
    });
    let suffix =
      "The matching color follows this sensor through all three moments.";
    if (currentOperation && progress === 1) {
      const index = readings.indexOf(reading);
      const row =
        currentOperation === "transpose"
          ? reading.sensor
          : Math.floor(index / 3);
      const col = currentOperation === "transpose" ? reading.moment : index % 3;
      suffix = `After ${currentOperation}: row ${row + 1}, position ${col + 1}.${row === 0 ? " The chart receives this row." : ""}`;
    }
    $("reading-detail").textContent =
      `${reading.value} belongs to sensor ${letters[reading.sensor]}, moment ${reading.moment + 1}. ${suffix}`;
  }
  readings.forEach((reading) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `reading sensor-${letters[reading.sensor].toLowerCase()}`;
    el.setAttribute(
      "aria-label",
      `Reading ${reading.value}, sensor ${letters[reading.sensor]}, moment ${reading.moment + 1}`,
    );
    const value = document.createElement("span");
    value.textContent = reading.value;
    const origin = document.createElement("small");
    origin.textContent = `${letters[reading.sensor]}${reading.moment + 1}`;
    el.append(value, origin);
    el.addEventListener("click", () => selectReading(reading));
    reading.el = el;
    board.append(el);
  });
  for (let i = 0; i < 8; i++) {
    const el = document.createElement("span");
    el.className = `board-axis ${i < 4 ? "column" : "row"}`;
    el.setAttribute("aria-hidden", "true");
    axes.push(el);
    board.append(el);
  }

  function positionReadings(p) {
    progress = p;
    const width = board.getBoundingClientRect().width || 520;
    const left = 49,
      area = width - left,
      sourceWidth = area / 4,
      targetWidth = area / 3;
    readings.forEach((reading, index) => {
      const targetIndex =
        currentOperation === "transpose"
          ? reading.sensor * 3 + reading.moment
          : index;
      const sx = left + reading.sensor * sourceWidth,
        sy = 36 + reading.moment * 68;
      const tx = left + (targetIndex % 3) * targetWidth,
        ty = 34 + Math.floor(targetIndex / 3) * 58;
      reading.el.style.width = `${sourceWidth - 8 + (targetWidth - sourceWidth) * p}px`;
      reading.el.style.transform = `translate(${sx + (tx - sx) * p}px, ${sy + (ty - sy) * p}px)`;
      reading.el.classList.toggle(
        "row-input",
        Boolean(currentOperation && p > 0.95 && targetIndex < 3),
      );
    });
    const destination = p > 0.5 && Boolean(currentOperation);
    for (let i = 0; i < 4; i++) {
      const el = axes[i];
      el.hidden = destination && i === 3;
      el.textContent = destination
        ? `${currentOperation === "transpose" ? "Moment" : "Position"} ${i + 1}`
        : `Sensor ${letters[i]}`;
      el.style.top = "4px";
      el.style.left = `${left + i * (destination ? targetWidth : sourceWidth)}px`;
      el.style.width = `${(destination ? targetWidth : sourceWidth) - 8}px`;
      const row = axes[i + 4];
      row.hidden = !destination && i === 3;
      row.textContent = destination ? `Row ${i + 1}` : `Moment ${i + 1}`;
      row.style.top = `${(destination ? 34 + i * 58 : 36 + i * 68) + 16}px`;
    }
    $("board-title").textContent =
      p === 0
        ? "Original recording"
        : p === 1
          ? `After ${currentOperation}`
          : "Following the readings";
    $("board-shape").textContent =
      p === 0
        ? "3 moments × 4 sensors"
        : p === 1
          ? "4 rows × 3 readings"
          : "Same twelve values";
    $("replay-label").textContent =
      p === 0
        ? "Original recording"
        : p === 1
          ? "Operation result"
          : `${Math.round(p * 100)}% through movement`;
    slider.value = String(Math.round(p * 100));
  }
  function animateMovement() {
    window.cancelAnimationFrame(moveFrame);
    const compact = window.matchMedia("(max-width: 760px)").matches;
    if (compact) {
      board.scrollIntoView({
        block: "center",
        behavior: reducedMotion.matches ? "instant" : "smooth",
      });
    }
    if (reducedMotion.matches) {
      positionReadings(1);
      return;
    }
    positionReadings(0);
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / (compact ? 1700 : 1250));
      positionReadings(t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      if (t < 1) moveFrame = window.requestAnimationFrame(frame);
      else if (selected) selectReading(selected);
    }
    moveFrame = window.requestAnimationFrame(frame);
  }
  function updateChart(values, correct) {
    window.cancelAnimationFrame(chartFrame);
    const from = chartValues.slice();
    chartValues = values.slice();
    if (reducedMotion.matches) {
      drawChart($("result-chart"), values, false, correct);
      return;
    }
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / 600),
        ease = 1 - Math.pow(1 - t, 3);
      drawChart(
        $("result-chart"),
        values.map((v, i) => from[i] + (v - from[i]) * ease),
        false,
        correct,
      );
      if (t < 1) chartFrame = window.requestAnimationFrame(frame);
    }
    chartFrame = window.requestAnimationFrame(frame);
  }
  function runOperation(operation) {
    if (!ready || !["reshape", "transpose"].includes(operation)) return;
    currentOutput = window.tf.tidy(() => {
      const grid = window.tf.tensor2d(recording);
      return (
        operation === "transpose" ? grid.transpose() : grid.reshape([4, 3])
      ).arraySync();
    });
    currentOperation = operation;
    const values = currentOutput[0];
    const correct = values.every((value, i) => value === recording[i][0]);
    operationButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.operation === operation),
      ),
    );
    slider.disabled = false;
    $("replay-again").disabled = false;
    animateMovement();
    if (selected) selectReading(selected);
    updateChart(values, correct);
    $("chart-input").textContent = `[${values.join(", ")}]`;
    $("chart-input").style.color = correct ? colors[0] : "var(--amber)";
    $("result-chart").setAttribute(
      "aria-label",
      `Computed chart after ${operation}: ${values.join(", ")}. ${correct ? "Sensor A across three moments." : "Sensors A, B and C at moment 1."}`,
    );
    $("chart-note").textContent = correct
      ? "A1, A2, A3. The chart now follows the same sensor through time."
      : "A1, B1, C1. Three different sensors still feed the line labelled A.";
    const result = $("result");
    result.hidden = false;
    result.classList.toggle("correct", correct);
    $("result-label").textContent = correct
      ? "Correct grouping"
      : "The grouping still mixes sensors";
    $("result-heading").textContent = correct
      ? "Sensor A reads 2, 3, 4 in this excerpt."
      : "Four rows did not mean four sensors.";
    $("verdict").textContent = correct
      ? "Correct. Transpose puts A’s readings together: 2, 3, 4."
      : "Incorrect for this chart. Reshape sends 2, 20, 5 to the first row.";
    $("insight").textContent = correct
      ? "The 20 belongs to B at moment 1. Transpose moves each sensor’s column into its own row. Farah can now compare one sensor across time."
      : "Reshape keeps the flat reading order and changes where each row ends. Try transpose and follow the A readings as they move.";
    $("consequence").hidden = !correct;
    $("crew-next").hidden = !correct;
    const call =
      operation === "transpose" ? "grid.transpose()" : "grid.reshape([4, 3])";
    $("executed-code").textContent =
      `const groupedRows = tf.tidy(() => {\n  const grid = tf.tensor2d([\n    [2, 20, 5, 8],\n    [3, 18, 7, 8],\n    [4, 16, 6, 9],\n  ]);\n  return ${call}.arraySync();\n});\nconst chartInput = groupedRows[0];\n// [${values.join(", ")}]`;
    $("runtime-status").textContent =
      `Ran with TensorFlow.js ${window.tf.version.tfjs}. Choose either operation to compare.`;
    window.dispatchEvent(
      new CustomEvent("tensorcraft:case-result", {
        detail: {
          operation,
          values: values.slice(),
          output: currentOutput,
          correct,
        },
      }),
    );
  }
  $("trace-next").addEventListener("click", () => {
    if (!hasTraced) {
      tracePoint(1);
      return;
    }
    $("recording").scrollIntoView({
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  });
  slider.addEventListener("input", () => {
    window.cancelAnimationFrame(moveFrame);
    positionReadings(Number(slider.value) / 100);
    if (selected) selectReading(selected);
  });
  $("replay-again").addEventListener("click", animateMovement);
  operationButtons.forEach((button) =>
    button.addEventListener("click", () =>
      runOperation(button.dataset.operation),
    ),
  );
  new ResizeObserver(() => positionReadings(progress)).observe(board);
  drawChart($("opening-chart"), [2, 20, 5], true);
  drawChart($("result-chart"), chartValues);
  positionReadings(0);
  const params = new URLSearchParams(window.location.search);
  const supplied = params.get("utm_source");
  const source =
    supplied && /^[a-z0-9_-]{1,60}$/i.test(supplied) ? supplied : "sensor_case";
  ["activity-link", "start-link"].forEach((id) => {
    const link = $(id),
      url = new URL(link.href);
    url.searchParams.set("utm_source", source);
    link.href = url.href;
  });
  (async () => {
    try {
      if (!window.tf) throw new Error("Runtime unavailable");
      await window.tf.setBackend("cpu");
      await window.tf.ready();
      if (window.tf.version.tfjs !== "4.22.0")
        throw new Error("Unexpected runtime");
      ready = true;
      operationButtons.forEach((button) => (button.disabled = false));
      $("runtime-status").textContent =
        "Choose an operation. Your result will run here in the browser.";
      window.dispatchEvent(new CustomEvent("tensorcraft:case-ready"));
    } catch (error) {
      $("runtime-status").classList.add("error");
      $("runtime-status").textContent =
        "The operations could not load. Point tracing still works. You can also start the free course below.";
    }
  })();
})();
