(() => {
  "use strict";

  const VERSION = "4.22.0";
  const EPOCHS = 160;
  const LEARNING_RATE = 0.5;
  const LABELS = { wide: "Wide pulses", tight: "Tight pulses" };
  let activeModel = null;
  let activeOptimizer = null;
  let initialization = null;
  let baselinePrediction = null;
  let baselineLoss = null;
  let currentLabel = null;
  let busy = false;

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function measuredFeatures(values) {
    if (
      !Array.isArray(values) ||
      values.length < 4 ||
      values.length > 256 ||
      !values.every(Number.isFinite)
    ) {
      throw new Error("Supply between 4 and 256 finite waveform readings.");
    }
    const crossings = values.slice(1).reduce((count, value, index) => {
      return count + (value * values[index] < 0 ? 1 : 0);
    }, 0);
    const amplitude = (Math.max(...values) - Math.min(...values)) / 2;
    return [crossings / 10, amplitude];
  }

  function makeSample(id, cycles, amplitude, label) {
    const values = Array.from({ length: 64 }, (_, index) => {
      return amplitude * Math.sin((index / 63) * Math.PI * 2 * cycles + 0.2);
    });
    return {
      id,
      ...(label ? { label, labelText: LABELS[label] } : {}),
      values,
      features: measuredFeatures(values),
    };
  }

  // These generated examples are separate from Deep Orbit's story recordings.
  const trainingExamples = [
    makeSample("wide-1", 1, 0.9, "wide"),
    makeSample("wide-2", 1.5, 0.85, "wide"),
    makeSample("tight-1", 4, 0.25, "tight"),
    makeSample("tight-2", 4.5, 0.2, "tight"),
  ];
  const teachingExample = makeSample("visitor-example", 3.5, 0.88);
  const probe = makeSample("held-out-probe", 4, 0.92);

  function runtime() {
    if (!window.tf || window.tf.version.tfjs !== VERSION) {
      throw new Error("This experiment needs TensorFlow.js 4.22.0.");
    }
    return window.tf;
  }

  function modelPrediction(model, sample = probe) {
    const tf = runtime();
    const values = Array.isArray(sample) ? sample : sample.values;
    const scores = tf.tidy(() => {
      const input = tf.tensor2d([measuredFeatures(values)]);
      return Array.from(model.predict(input).dataSync());
    });
    const label = scores[1] > scores[0] ? "tight" : "wide";
    return {
      label,
      labelText: LABELS[label],
      score: label === "wide" ? scores[0] : scores[1],
      scores: { wide: scores[0], tight: scores[1] },
    };
  }

  async function fit(examples, phase, onProgress) {
    const tf = runtime();
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [2],
          units: 2,
          activation: "softmax",
          kernelInitializer: "zeros",
          biasInitializer: "zeros",
        }),
      ],
    });
    const optimizer = tf.train.sgd(LEARNING_RATE);
    model.compile({ optimizer, loss: "categoricalCrossentropy" });
    const xs = tf.tensor2d(
      examples.map((sample) => measuredFeatures(sample.values)),
    );
    const ys = tf.tensor2d(
      examples.map((sample) => (sample.label === "tight" ? [0, 1] : [1, 0])),
    );
    const progress = async (epoch, loss) => {
      if (typeof onProgress === "function") {
        onProgress({
          phase,
          epoch,
          totalEpochs: EPOCHS,
          progress: epoch / EPOCHS,
          loss,
        });
      }
      await tf.nextFrame();
    };

    try {
      await progress(0, null);
      const history = await model.fit(xs, ys, {
        epochs: EPOCHS,
        batchSize: examples.length,
        shuffle: false,
        yieldEvery: "never",
        verbose: 0,
        callbacks: {
          onEpochEnd: async (index, logs) => {
            const epoch = index + 1;
            if (epoch % 20 === 0 || epoch === EPOCHS) {
              await progress(epoch, Number(logs.loss));
            }
          },
        },
      });
      return {
        model,
        optimizer,
        loss: Number(history.history.loss[history.history.loss.length - 1]),
      };
    } catch (error) {
      model.dispose();
      optimizer.dispose();
      throw error;
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }

  function replaceActive(next) {
    if (activeModel) activeModel.dispose();
    if (activeOptimizer) activeOptimizer.dispose();
    activeModel = next.model;
    activeOptimizer = next.optimizer;
  }

  function metadata() {
    return copy({
      version: VERSION,
      modelType: "Two-input softmax classifier",
      featureNames: [
        "Zero crossings divided by 10",
        "Peak-to-peak amplitude divided by 2",
      ],
      epochs: EPOCHS,
      learningRate: LEARNING_RATE,
      displayRange: [-1, 1],
      maxAbsoluteValue: 1,
      baselinePrediction,
      baselineLoss,
      trainingExamples,
      teachingExample,
      probe,
      samples: {
        wide: trainingExamples.filter((sample) => sample.label === "wide"),
        tight: trainingExamples.filter((sample) => sample.label === "tight"),
        teaching: teachingExample,
        probe,
      },
      provenance:
        "Generated illustrative patterns, separate from the crew’s recordings.",
      scoreMeaning:
        "The model’s softmax output. It does not measure real-world reliability.",
    });
  }

  function initialize({ onProgress } = {}) {
    if (initialization) return initialization.then(() => metadata());
    initialization = (async () => {
      const tf = runtime();
      busy = true;
      try {
        await tf.setBackend("cpu");
        await tf.ready();
        const next = await fit(trainingExamples, "initializing", onProgress);
        replaceActive(next);
        baselinePrediction = modelPrediction(activeModel);
        baselineLoss = next.loss;
        currentLabel = null;
      } finally {
        busy = false;
      }
    })();
    initialization = initialization.catch((error) => {
      initialization = null;
      throw error;
    });
    return initialization.then(() => metadata());
  }

  async function train(label, { onProgress } = {}) {
    if (!Object.hasOwn(LABELS, label)) {
      throw new Error("Choose wide or tight as the training label.");
    }
    await initialize();
    if (busy) throw new Error("Training is already running.");
    busy = true;
    try {
      const examples = [...trainingExamples, { ...teachingExample, label }];
      const next = await fit(examples, "training", onProgress);
      replaceActive(next);
      currentLabel = label;
      return copy({
        before: baselinePrediction,
        after: modelPrediction(activeModel),
        teachingPrediction: modelPrediction(activeModel, teachingExample),
        labelUsed: label,
        trainingCount: examples.length,
        addedCount: 1,
        epochs: EPOCHS,
        loss: next.loss,
        probeId: probe.id,
        trainedSampleIds: examples.map((sample) => sample.id),
      });
    } finally {
      busy = false;
    }
  }

  function predict(sample = probe) {
    if (!activeModel)
      throw new Error("Initialize the model before testing it.");
    if (busy) throw new Error("Wait for training to finish before testing.");
    return modelPrediction(activeModel, sample);
  }

  async function reset({ onProgress } = {}) {
    await initialize();
    if (busy) throw new Error("Wait for training to finish before resetting.");
    busy = true;
    try {
      const next = await fit(trainingExamples, "resetting", onProgress);
      replaceActive(next);
      currentLabel = null;
      return copy({
        prediction: modelPrediction(activeModel),
        trainingCount: trainingExamples.length,
        epochs: EPOCHS,
        loss: next.loss,
      });
    } finally {
      busy = false;
    }
  }

  function dispose() {
    if (busy)
      throw new Error("Wait for training to finish before closing the model.");
    if (activeModel) activeModel.dispose();
    if (activeOptimizer) activeOptimizer.dispose();
    activeModel = null;
    activeOptimizer = null;
    initialization = null;
    baselinePrediction = null;
    baselineLoss = null;
    currentLabel = null;
  }

  window.TensorcraftPatternModel = Object.freeze({
    initialize,
    train,
    predict,
    reset,
    dispose,
    features: (values) => measuredFeatures(values),
    get busy() {
      return busy;
    },
    get currentLabel() {
      return currentLabel;
    },
  });
})();
