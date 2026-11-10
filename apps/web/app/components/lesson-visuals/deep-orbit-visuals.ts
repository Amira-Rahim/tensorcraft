/** Authored teaching instruments. Values are small examples, never mission telemetry. */
export type InstrumentKind =
  | "tensor"
  | "neuron"
  | "network"
  | "loss"
  | "gradient"
  | "training"
  | "evaluation"
  | "signal"
  | "sequence"
  | "attention"
  | "kalman"
  | "anomaly"
  | "precision"
  | "flow";
export interface FlowStage {
  name: string;
  value: string;
  detail: string;
  code: string;
}
export interface LessonVisualSpec {
  module: string;
  kind: InstrumentKind;
  mode: string;
  question: string;
  introduction?: string;
  action: string;
  takeaway: string;
  stages?: FlowStage[];
}
const visual = (
  module: string,
  kind: InstrumentKind,
  mode: string,
  question: string,
  action: string,
  takeaway: string,
): LessonVisualSpec => ({ module, kind, mode, question, action, takeaway });
const stage = (
  name: string,
  value: string,
  detail: string,
  code: string,
): FlowStage => ({ name, value, detail, code });
const flow = (
  module: string,
  question: string,
  takeaway: string,
  stages: FlowStage[],
): LessonVisualSpec => ({
  module,
  kind: "flow",
  mode: "pipeline",
  question,
  action: "Select a stage to see its input, output, and role in the task.",
  takeaway,
  stages,
});

export const DEEP_ORBIT_VISUALS: Record<string, LessonVisualSpec> = {
  "introduction-to-tensors": {
    ...visual(
      "foundations",
      "tensor",
      "create",
      "Put Demir’s readings on the chart",
      "I’ve got the chart code ready. Help me pass these readings to it so we can see how they change over time.",
      "The chart code takes a tensor and draws one line for each sensor. You’ll create that tensor from Demir’s readings. Its shape lets you check how many values you included.",
    ),
    introduction:
      "Demir wants to see how each sensor’s readings change over time. You’ll help him put the selected readings on a chart, with one line per sensor.",
  },
  "tensor-shapes": visual(
    "foundations",
    "tensor",
    "reshape",
    "How can Farah follow one sensor over time?",
    "Arrange the readings by moment, then compare two ways to give the chart one row per sensor.",
    "Reshape keeps the existing value order. For a two-axis grid, transpose turns each column into a row. Check the values as well as the shape.",
  ),
  "tensor-operations": visual(
    "foundations",
    "tensor",
    "operations",
    "Which readings contribute to one repaired output?",
    "Keep sensors A and B aligned while averaging Demir's selected moments. Apply gain, then inspect one bank's weighted sum.",
    "Element-wise operations keep matching sensor positions. Broadcasting reuses one row. Matrix multiplication adds the channel contributions for each bank.",
  ),
  "data-loading": visual(
    "foundations",
    "tensor",
    "batch",
    "Does the loader keep each row intact?",
    "Trace the challenge's 16 generated practice rows through lazy reads, batching, and a fixed time split.",
    "A fresh generator reads on request. Shuffle whole rows before batching so their features and labels stay paired. This demonstration batches all 16 rows. Training would read only IDs 0-11 and reserve 12-15 for validation.",
  ),
  normalization: visual(
    "foundations",
    "tensor",
    "normalize",
    "What happens when channels use different scales?",
    "Use the challenge's four-row practice batch and fixed neuron. Trace one reading through the saved statistics, scaled inputs, and score.",
    "Fit each column's scaler on training data, then reuse those statistics on later data. The supplied weights stay fixed.",
  ),

  "first-neuron": visual(
    "neural-networks",
    "neuron",
    "linear",
    "How does each input contribute to the score?",
    "Inspect one of the three inputs, then follow its product into the sum and bias. Change the second weight from -0.2 to 0.2.",
    "Each contribution is input times weight. Add all contributions and the bias to get the scalar score. A large weight can still have a small contribution.",
  ),
  "activation-functions": visual(
    "neural-networks",
    "neuron",
    "activation",
    "Which values change when ReLU receives the scores?",
    "Inspect negative, zero, positive, and large-positive diagnostic scores before and after activation.",
    "ReLU keeps the tensor's shape, replaces negatives with zero, and leaves all positive values unchanged. An alert threshold is a separate choice.",
  ),
  "layers-and-architecture": visual(
    "neural-networks",
    "network",
    "layers",
    "Which layer owns each weight and bias?",
    "Compare the bridge's 673-parameter architecture with the separate 225-parameter practice stack, then vary the input width.",
    "Each dense layer owns inputs times units weights and one bias per unit. Later layers read the previous layer's width. More batch rows reuse the same parameters.",
  ),
  "forward-pass": visual(
    "neural-networks",
    "network",
    "forward",
    "Which products make one output?",
    "Trace the challenge's two-feature diagnostic rows through an identified fixed reference of its single linear layer.",
    "For this linear diagnostic layer, each output is an input row times one kernel column, plus that unit's bias. The batch axis counts rows. These weighted sums have no probability meaning.",
  ),
  "building-a-network": flow(
    "neural-networks",
    "Which steps change the model’s weights?",
    "Compilation configures training. Prediction reads the current weights. The first model's fit applies updates while the second stays untrained.",
    [
      stage(
        "Construction",
        "Two independent 529-parameter models",
        "Each buildClassifier call creates a new eight-feature rehearsal model with 24, 12, and 1 units. Both start with default random kernels and zero biases.",
        "const model = buildClassifier();\nconst second = buildClassifier();",
      ),
      stage(
        "Compilation",
        "Training configured, no updates",
        "Compile inside the factory so both models receive Adam, binary crossentropy, and accuracy. Compilation leaves the starting weights unchanged.",
        "network.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });",
      ),
      stage(
        "Initial snapshots",
        "Six weight arrays and two untrained sweeps",
        "Copy the first model's initial values into plain arrays before fitting. Read one score per generated row from each untrained model.",
        "const initialWeights = model.getWeights().map(weight => Array.from(weight.dataSync()));\nconst sweepOne = scoresOf(model);\nconst sweepTwo = scoresOf(second);",
      ),
      stage(
        "First model fitting",
        "One fit, 50 epochs, batch size 16",
        "The requested fit uses all 120 rehearsal rows. A complete run applies 400 updates to the first model's optimizer. The second model receives no fit.",
        "await model.fit(readings, labels, { epochs: 50, batchSize: 16 });",
      ),
      stage(
        "Comparison",
        "Measured scores and loss in your run",
        "Read the first model again and compare with both saved untrained sweeps. The second stays at its starting weights. Inspect the captured settings and loss in the Challenge result view. These are training rows, so this does not measure performance on new data.",
        "const trainedSweep = scoresOf(model);\nconst secondAgain = scoresOf(second);",
      ),
    ],
  ),

  "loss-functions": visual(
    "training-loop",
    "loss",
    "mse",
    "Which row contributes to the loss?",
    "Trace a supplied label and prediction through difference, square, and batch mean. Then inspect matching BCE contracts for logits and probabilities.",
    "MSE squares each error before averaging. Binary cross-entropy needs the declared output format so sigmoid runs in the correct place.",
  ),
  "gradient-descent": visual(
    "training-loop",
    "gradient",
    "descent",
    "What changes during one weight update?",
    "Follow weight 5 on the supplied squared loss. Inspect its gradient, the learning-rate-sized step, and the loss after each update.",
    "Calculate the gradient at the old weight, subtract rate times gradient, then evaluate the loss at the new weight. A larger step can increase the loss.",
  ),
  backpropagation: visual(
    "training-loop",
    "gradient",
    "chain",
    "Can Demir find the slope without another run for every weight?",
    "Check both gradient methods on his supplied scalar test loss before comparing several variables in code.",
    "Backpropagation reuses a recorded forward calculation to find several gradients. Computing them leaves the weights unchanged.",
  ),
  "training-loop": visual(
    "training-loop",
    "training",
    "epochs",
    "What do two recent loss windows show?",
    "Choose how many original epochs to observe. Trace their two ten-epoch means into a diagnosis.",
    "The diagnostic fixtures are separate from actual training. The validation callback counts five consecutive non-improvements. Diagnosis compares two recent windows. Neither restores weights or establishes a cause.",
  ),
  "evaluating-deep-scan": visual(
    "training-loop",
    "evaluation",
    "cases",
    "How does a supplied score become a missed anomaly?",
    "Inspect these twelve teaching cases at different cutoffs, then compare their errors.",
    "These supplied scores are separate from the coding task's 43 evaluation rows. A score equal to the cutoff predicts label 0. Count misses and false alarms before comparing accuracy.",
  ),

  "why-the-browser": flow(
    "browser-runtimes",
    "Which requirement decides the deployment recommendation?",
    "Local requirements come before the size and latency preferences. The authored policy supplies no device benchmark.",
    [
      stage(
        "Local requirement",
        "Privacy or offline use",
        "Either requirement calls for local predictions. Keep it when checking the model budget.",
        "const mustStayLocal = dataSensitive || needsOffline;",
      ),
      stage(
        "Download budget",
        "50 MB inclusive",
        "Above 50 MB, return reconsider if local predictions are required. Otherwise the size rule chooses server.",
        "const overBudget = modelSizeMB > 50;",
      ),
      stage(
        "Latency preference",
        "Below 50 ms",
        "Inside the size budget, a local requirement chooses client. Without one, only a preference below 50 ms chooses client.",
        "const belowPreference = latencyBudgetMs < 50;",
      ),
      stage(
        "Device check",
        "Measure the chosen design",
        "Cache all required assets for offline use. Measure startup, completed predictions, and memory on supported devices.",
        "// A policy recommendation is not a latency measurement.",
      ),
    ],
  ),
  "tensorflow-js-setup": flow(
    "browser-runtimes",
    "What ran after the preferred backend request?",
    "Request a preference, await readiness, then report the backend and version supplied by that ready runtime.",
    [
      stage(
        "Import",
        "API available",
        "Import the package. The controlled Challenge supplies its own cold runtime to check the sequence.",
        "import * as tf from '@tensorflow/tfjs';",
      ),
      stage(
        "Preference",
        "Accepted, refused, or unknown",
        "Request a supplied preference first. A registered failure returns false. An unknown name rejects the request.",
        "const accepted = await tf.setBackend(preferred);",
      ),
      stage(
        "Readiness",
        "Available backend or error",
        "After a refused preference, ready() can select an available backend. If none starts, let the initialization error reach the caller.",
        "await tf.ready();",
      ),
      stage(
        "Backend",
        "Actual selected name",
        "Read the active name after readiness. A requested name alone does not establish which backend runs.",
        "const backend = tf.getBackend();",
      ),
      stage(
        "Version",
        "Runtime metadata",
        "Read the version from the same runtime. The Challenge's generated probe version differs from the real package version.",
        "const version = tf.version.tfjs;",
      ),
    ],
  ),
  "model-loading": flow(
    "browser-runtimes",
    "What turns the files into an inspectable model?",
    "Trace the deployed manifest, its weight shard, the awaited model, copied shapes, and ownership.",
    [
      stage(
        "Manifest",
        "model.json",
        "The deployed example lists weights.bin beside this JSON file.",
        "const url = '/models/deep-scan/model.json';",
      ),
      stage(
        "Weight paths",
        "weights.bin",
        "Resolve every declared shard relative to the manifest URL. A successful JSON response alone is insufficient.",
        "new URL('weights.bin', new URL(url, location.origin));",
      ),
      stage(
        "Await model",
        "LayersModel",
        "Wait for topology and weights to become a model before reading its properties.",
        "const inspected = await tf.loadLayersModel(url);",
      ),
      stage(
        "Copy contract",
        "Plain arrays and count",
        "Read input and output shapes and layer count from the same returned model. Preserve null batch entries.",
        "const shape = [...inspected.inputs[0].shape];",
      ),
      stage(
        "Release owner",
        "Inspection complete",
        "The inspection helper disposes its model in finally. The copied metadata survives. A prediction handler retains its own model until teardown.",
        "inspected.dispose();",
      ),
    ],
  ),
  "inference-pipeline": flow(
    "browser-runtimes",
    "How does one raw reading become a verdict?",
    "Follow the exercise's feature-reading probe. Its outputs test preprocessing and do not measure classifier accuracy.",
    [
      stage(
        "Raw fields",
        "512, 21, pi/2",
        "The legacy fields contain amplitude counts, a zero-crossing count, and a sample-pair angle in radians.",
        "const raw = { amplitude: 512, frequency: 21, phase: Math.PI / 2 };",
      ),
      stage(
        "Saved ranges",
        "0.25, 1/3, 0.75",
        "Use bounds 0..2048, 0..63, and -pi..pi in the original feature order.",
        "const scaled = preprocess(raw);",
      ),
      stage(
        "One-row batch",
        "[1, 3]",
        "One reading supplies one row. The diagnostic amplitude probe returns 0.25 for this row.",
        "const input = tf.tensor2d([scaled]);",
      ),
      stage(
        "Read and classify",
        "noise, score 0.75",
        "Only p > 0.5 means anomaly. The selected class score is p or 1-p, without a calibration guarantee.",
        "const selectedScore = p > 0.5 ? p : 1 - p;",
      ),
      stage(
        "Temporary cleanup",
        "Model remains owned",
        "Read synchronous values inside tidy. It releases temporary input/output tensors. The model owner disposes its existing weights at teardown.",
        "return tf.tidy(() => { /* prepare, predict, read, return plain values */ });",
      ),
    ],
  ),
  "onnx-runtime-web": flow(
    "browser-runtimes",
    "What did both runtimes receive and return?",
    "A compatible graph is the starting point. Match float32 inputs, await completed outputs, and compare those values before interpreting timing.",
    [
      stage(
        "Check graph",
        "Supported operations",
        "Inspect the graph's opset, input/output names, and provider support. A file extension does not establish compatibility.",
        "// Inspect this export's graph and tensor contract.",
      ),
      stage(
        "Match input",
        "One float32 batch",
        "Both paths receive the same three values in the same order, with shape [1, 3].",
        "const feed = new ort.Tensor('float32', new Float32Array(signal), [1, 3]);",
      ),
      stage(
        "Complete TFJS",
        "Await readback",
        "The caller's TFJS model is already loaded. Stop its inference timer after reading the prediction.",
        "const score = (await prediction.data())[0];",
      ),
      stage(
        "Complete ONNX",
        "Await named output",
        "Create the WASM session outside the timer. Await run and read this export's named output.",
        "const outputs = await session.run({ input: feed });",
      ),
      stage(
        "Compare and release",
        "Agreement and ownership",
        "Compare actual returned scores within absolute tolerance 0.0001. Release owned temporaries and the session, including on errors. Keep the caller's model alive. Simulated intervals cannot rank real runtimes.",
        "const agrees = Math.abs(tfjsScore - onnxScore) <= 0.0001;",
      ),
    ],
  ),
  "transformers-js": flow(
    "browser-runtimes",
    "Which prediction belongs to this report?",
    "Choose sentiment-analysis, load once, classify the report batch, and preserve each original pairing before sorting.",
    [
      stage(
        "Handle empty input",
        "No model work",
        "An empty report array returns an empty queue without a factory call.",
        "if (reports.length === 0) return [];",
      ),
      stage(
        "Choose task and load",
        "One classifier",
        "The supplied factory simulates loading. sentiment-analysis and its text-classification alias return the label/score contract this queue needs.",
        "const classifier = await pipelineFactory('sentiment-analysis');",
      ),
      stage(
        "Classify batch",
        "Positional results",
        "Pass all reports in one call. Prediction at index i belongs to the report at index i.",
        "const predictions = await classifier(reports);",
      ),
      stage(
        "Pair then sort",
        "Text, label, score",
        "Keep each report beside its returned label and score before sorting complete rows by descending score. Scores do not establish urgency or accuracy.",
        "const paired = reports.map((text, i) => ({ text, ...predictions[i] }));",
      ),
      stage(
        "Review real suitability",
        "Separate measurements",
        "For a real model, check its license, labels, representative errors, asset sizes, and device timings. The controlled queue exercise measures none of those.",
        "// Evaluate the pinned model on representative labeled reports.",
      ),
    ],
  ),

  "time-vs-frequency": visual(
    "signal-processing",
    "signal",
    "views",
    "Which matching bin first exceeds the difference cutoff?",
    "Inspect the supplied two-second capture pair, its raw magnitudes, and the separate sample tolerance.",
    "The active comparison includes DC and uses absolute differences in bin order. The optional diagram uses separate illustrative tones.",
  ),
  "fourier-transform": visual(
    "signal-processing",
    "signal",
    "fourier",
    "Which eligible computed bin supplies the returned hertz?",
    "Inspect sample count, rate, raw spectrum, the non-DC winner, and its center frequency.",
    "The active task uses supplied diagnostic captures and raw magnitudes. Its separate reference illustration uses other tones. Silence is a convention, not a discovery.",
  ),
  spectrograms: visual(
    "signal-processing",
    "signal",
    "spectrogram",
    "Which original samples produced this magnitude row?",
    "Follow one complete rectangular frame, its start time, raw spectrum, and selected bin across frames.",
    "The active one-second burst cannot establish the mission pulse interval. The reference below is a separate time-frequency illustration.",
  ),
  "fft-as-features": visual(
    "signal-processing",
    "signal",
    "features",
    "Which measurement belongs in this returned feature position?",
    "Inspect peak amplitude, strict sign changes, or a fixed raw FFT bin from the supplied capture.",
    "The exercise row has two raw measurements and the requested bins. The mission research model also retains phase. Keep the separate reference values identified.",
  ),
  "windowing-and-overlap": visual(
    "signal-processing",
    "signal",
    "window",
    "What does one sample become under the symmetric Hann?",
    "Follow an original sample through its weight and product, then compare raw spectral shapes and far-bin sums.",
    "The active task uses symmetric Hann and a summed-magnitude metric. The optional reference illustrates separate window placements.",
  ),
  "sequences-matter": visual(
    "recurrent-networks",
    "sequence",
    "order",
    "Which reading follows this input window?",
    "Inspect original row positions, stride, next-reading targets, and the returned tensor axes.",
    "The supplied pair-building exercise trains no model. Reversing is an order comparison. The optional reference shows separate illustrative values.",
  ),
  "simple-rnns": visual(
    "recurrent-networks",
    "sequence",
    "rnn",
    "Which terms produce the next hidden state and derivative?",
    "Trace the supplied recurrent update and the running product through its actual inputs and weights.",
    "The active recurrence uses inputWeight directly, with no extra division by ten. The reference is a separate scalar illustration.",
  ),
  "lstm-gates": visual(
    "recurrent-networks",
    "sequence",
    "gates",
    "What stays in the cell, and what leaves it?",
    "Predict either stored cell state or hidden output while following retained state and the gated candidate.",
    "The active calculation uses the supplied challenge check and a candidate variation. The reference below is a separate scalar illustration.",
  ),
  "sliding-windows": visual(
    "recurrent-networks",
    "sequence",
    "windows",
    "Which classification windows stay on each side of the split?",
    "Inspect a candidate, its last-reading external label, and whether the split keeps or drops it.",
    "The active task labels the last input reading. The next-reading forecasting pattern is a separate comparison, with a different target rule.",
  ),
  "sequence-prediction": visual(
    "recurrent-networks",
    "sequence",
    "predict",
    "Which clamped prediction becomes the next input row?",
    "Follow the supplied stand-in through its input, raw output, converted physical limits, and feedback window.",
    "The activity illustrates the exercise stand-in and supplied scalers. Actual trained forecasts have no future observations in their capture, and establish no error curve.",
  ),

  "normal-vs-anomalous": flow(
    "anomaly-detection",
    "Which supplied reading crosses the baseline rule?",
    "A flag requests review. It establishes no physical cause or true anomaly label.",
    [
      stage(
        "Supply baseline",
        "Mean 50, spread 10",
        "The exercise supplies unitless diagnostic values. The fictional archive baseline is a separate source.",
        "const value = 100, mean = 50, std = 10;",
      ),
      stage(
        "Measure distance",
        "50 / 10 = 5",
        "Divide absolute distance by a positive standard deviation.",
        "const z = Math.abs(value - mean) / std;",
      ),
      stage(
        "Apply strict cutoff",
        "5 > 3",
        "Exactly three spreads stays unflagged. The zero-spread convention compares exact values.",
        "const flagged = std === 0 ? value !== mean : z > 3;",
      ),
    ],
  ),
  autoencoders: flow(
    "anomaly-detection",
    "Which rows train the reconstruction model?",
    "Read actual held-out reconstruction errors after fitting. No fixed separation ratio is promised.",
    [
      stage(
        "Screen rows",
        "Keep indices 0 and 2",
        "The three eight-feature diagnostic rows have exclusion flags false,true,false.",
        "const selected = rows.filter((_, i) => !flags[i]);",
      ),
      stage(
        "Construct fit input",
        "[2, 8] against itself",
        "The 72-row synthetic training fixture and the eleven-feature mission model are distinct sources.",
        "const xs = tf.tensor2d(selected);",
      ),
      stage(
        "Fit and transfer ownership",
        "8/4/2/4/8, 400 epochs",
        "Dispose temporary tensors. A successful returned model belongs to the caller. A supplied model remains caller-owned.",
        "await model.fit(xs, xs, { epochs: 400, batchSize: 16 });",
      ),
    ],
  ),
  "reconstruction-error": flow(
    "anomaly-detection",
    "How does one feature contribute to the row score?",
    "The exercise averages eight squared gaps. The separate incident ranks absolute-gap ratios.",
    [
      stage(
        "Read diagnostic mapping",
        "Input plus 0.1",
        "The model probe adds the same offset to all eight input features.",
        "const rebuilt = input.map(value => value + 0.1);",
      ),
      stage(
        "Square each gap",
        "About 0.01 each",
        "A feature contributes one eighth of its squared gap to the row MSE.",
        "const squared = input.map((value, i) => (value - rebuilt[i]) ** 2);",
      ),
      stage(
        "Average the row",
        "About 0.01 MSE",
        "Float32 arithmetic can change the final digits. A low score does not prove normality.",
        "const mse = squared.reduce((sum, value) => sum + value, 0) / 8;",
      ),
    ],
  ),
  "threshold-tuning": flow(
    "anomaly-detection",
    "Which supplied validation candidate maximizes F1?",
    "Use supplied validation labels. Keep deployment costs, final testing, and the ordered alert-storm runbook distinct.",
    [
      stage(
        "Flag six cases",
        "Cutoff 0.3, strict >",
        "The score exactly at 0.3 stays negative.",
        "const flags = errors.map(error => error > 0.3);",
      ),
      stage(
        "Count the confusion cells",
        "TP 3, FP 1, FN 0, TN 2",
        "These labels belong to the diagnostic fixture. They supply no label for 7741.",
        "const f1 = 2 * tp / (2 * tp + fp + fn);",
      ),
      stage(
        "Compare supplied candidates",
        "6/7 versus 0.8",
        "Return any tied maximizer. If all F1 scores are zero, any supplied candidate is valid.",
        "return { threshold: bestCandidate, f1: bestF1 };",
      ),
    ],
  ),
  "the-anomaly": flow(
    "anomaly-detection",
    "Which supplied checks vote for investigation?",
    "Three checks can share a capture or model problem. Their votes establish no cause or probability.",
    [
      stage(
        "Compute window baseline",
        "Eight amplitudes, mean near 0.52",
        "The statistical gate uses this supplied window, not the eleven-day archive baseline.",
        "const moments = tf.moments(windowTensor);",
      ),
      stage(
        "Compare separate cutoffs",
        "Statistical false, reconstruction true, forecast true",
        "Reconstruction receives error 6.2. The supplied amplitude forecast misses by 0.3. These use different units.",
        "const forecastFlag = Math.abs(forecast - actual) > forecastCutoff;",
      ),
      stage(
        "Count votes",
        "Two votes raises an alert",
        "A constant window has an explicit equality convention and no finite z-score.",
        "const alert = flags.filter(Boolean).length >= 2;",
      ),
    ],
  ),

  "beyond-lstm": flow(
    "advanced-time-series",
    "Which values does the query blend?",
    "Keys determine similarity. Separate value rows supply the output. A high weight establishes no causal explanation.",
    [
      stage(
        "Dot query with keys",
        "Scores 1 and 0",
        "The graded query is rank 1. Key and value widths may differ. Scores are unscaled.",
        "const scores = q.reshape([1, d]).matMul(keys, false, true);",
      ),
      stage(
        "Normalize across time",
        "Shares about 0.731 and 0.269",
        "Each time step receives one weight. Moving matched key/value rows preserves the blend for a fixed query.",
        "const weights = tf.softmax(scores);",
      ),
      stage(
        "Blend values",
        "About [1.462, 0.538]",
        "Values are twice the identity in this diagnostic probe. Remove only the batch axis.",
        "return weights.matMul(values).squeeze([0]);",
      ),
    ],
  ),
  "temporal-attention": flow(
    "advanced-time-series",
    "Where does position enter the pooled summary?",
    "A normalized attention plot describes the available window. It cannot prove missing readings were captured.",
    [
      stage(
        "Attach normalized position",
        "0, 0.5, 1",
        "Three two-feature rows receive a scoring-only position column. One row uses position zero.",
        "const extended = tf.concat([sequence, positions], 1);",
      ),
      stage(
        "Score and normalize",
        "Scores 0, 0.5, 1",
        "The supplied scorer is [1, 0, 0.5]. Softmax runs across time.",
        "const weights = tf.softmax(extended.matMul(scorer).reshape([T]));",
      ),
      stage(
        "Pool original features",
        "Summary stays [2]",
        "Position affects scores but never becomes an output feature. Keep a one-feature summary as [1].",
        "const summary = weights.reshape([1, T]).matMul(sequence).squeeze([0]);",
      ),
    ],
  ),
  forecasting: flow(
    "advanced-time-series",
    "Which window enters the next forecast?",
    "The controlled supplied-model probe explains feedback. Read the separate actual trained LSTM curves without assuming a winning method.",
    [
      stage(
        "Use the same past",
        "[1, 2]",
        "The diagnostic model returns its latest input plus one. This is not a trained forecast.",
        "const firstPrediction = 3;",
      ),
      stage(
        "Advance each history",
        "Rollout [2, 3], replay [2, 10]",
        "At horizon two, rollout reads its previous prediction. Replay reads only the earlier arrived observation.",
        "const nextRollout = 4, nextReplay = 11;",
      ),
      stage(
        "Compare matching horizons",
        "Observed second target 20",
        "Reference windows can be reconstructed from returned values. They are not captured internal predict inputs.",
        "const errors = [Math.abs(4 - 20), Math.abs(11 - 20)];",
      ),
    ],
  ),
  "kalman-filters": flow(
    "advanced-time-series",
    "How does Day 2 change the interval estimate?",
    "Carry both estimate and variance forward. Smoothing can lag a decreasing interval and establishes no accuracy gain.",
    [
      stage(
        "Read prior state",
        "73.1 s, variance 1 s²",
        "Day 1 initializes the existing fictional log. It receives no fabricated correction.",
        "const predictedVariance = 1 + 0.1;",
      ),
      stage(
        "Compute gain",
        "1.1 / 2.1",
        "Process and measurement noise are variances in squared seconds. Gain has no units.",
        "const gain = predictedVariance / (predictedVariance + 1);",
      ),
      stage(
        "Correct and carry state",
        "Estimate about 72.9952 s",
        "Day 2 measures 72.9 s. The corrected variance is about 0.5238 s².",
        "estimate += gain * (measurement - estimate);\nvariance = (1 - gain) * predictedVariance;",
      ),
    ],
  ),
  "time-series-ensemble-methods": flow(
    "advanced-time-series",
    "What do both blends predict at one aligned target?",
    "Earlier-period errors set weights. Current targets evaluate performance. Shared mistakes can survive every blend.",
    [
      stage(
        "Read aligned member forecasts",
        "12, 8, 10 against target 10",
        "The four-target diagnostic fixture uses arbitrary units. Prior normalized errors are a separate period and scale.",
        "const equal = (12 + 8 + 10) / 3;",
      ),
      stage(
        "Normalize stable prior weights",
        "Prior errors 0.045, 0.038, 0.058",
        "Scale by the smallest positive error before squaring to avoid overflow.",
        "const parts = errors.map(error => (Math.min(...errors) / error) ** 2);",
      ),
      stage(
        "Score the current window",
        "Equal MAE 0.5, weighted MAE about 0.4345",
        "beatsBest compares the equal blend with every member. A tie is not a win. These are not the story result 0.036.",
        "const beatsBest = equalMae < Math.min(...memberMaes);",
      ),
    ],
  ),

  "model-profiling": flow(
    "optimization-edge",
    "Which work belongs inside the timer?",
    "Trace a completed prediction, then separate the timing procedure from weight storage and peak application memory.",
    [
      stage(
        "Warm up",
        "Initialization excluded",
        "Complete and read a warmup prediction before starting the measured calls. Release its input and output too.",
        "const warmup = model.predict(input);\nawait warmup.data();\nwarmup.dispose();",
      ),
      stage(
        "Measure",
        "Await completion",
        "Keep the timer running until you finish reading the output, so it includes asynchronous work.",
        "// This model has one tensor output.\nconst start = performance.now();\nconst output = model.predict(input);\nawait output.data();\nconst elapsedMs = performance.now() - start;\noutput.dispose();",
      ),
      stage(
        "Inspect memory",
        "Live tensor count",
        "Compare retained tensors across repeated calls. A growing count may mean your code has kept a tensor it no longer needs.",
        "const memory = tf.memory();",
      ),
      stage(
        "Compare",
        "Same device + inputs",
        "Measure several calls and evaluate accuracy before and after a change. This diagram does not run a benchmark.",
        "// Record latency distribution and evaluation results.",
      ),
    ],
  ),
  quantization: visual(
    "optimization-edge",
    "precision",
    "quantize",
    "What changes when a weight uses fewer bits?",
    "Select one supplied kernel position and follow its bounds, uint8 code, decoded value, and checked class comparison.",
    "Fewer bits can shrink stored weights. Measure speed on the runtime and device, and evaluate accuracy on labeled data.",
  ),
  pruning: visual(
    "optimization-edge",
    "precision",
    "prune",
    "What disappears when small weights become zero?",
    "Select pooled sparsity, inspect a kernel position, and compare all five classes on the supplied labeled fixture.",
    "A small weight can still matter. Setting it to zero only saves calculation time if the runtime can skip zero connections.",
  ),
  "caching-strategies": flow(
    "optimization-edge",
    "When is an old prediction still valid?",
    "A cache key must include the input and every version that changes its interpretation.",
    [
      stage(
        "Build key",
        "Input + versions",
        "Different normalization statistics can change a prediction even when raw input and model weights match.",
        "const key = JSON.stringify([input, modelVersion, scalerVersion]);",
      ),
      stage(
        "Look up",
        "Exact key match",
        "A hit is valid only under the cache policy. Similar-looking readings are not exact matches.",
        "const cached = results.get(key);",
      ),
      stage(
        "Run on a cache miss",
        "Current pipeline",
        "Use current preprocessing and model versions when there is no valid cached entry.",
        "const value = cached ?? await predict(input);",
      ),
      stage(
        "Limit saved entries",
        "Eviction policy",
        "Limit entries and invalidate obsolete versions so the cache cannot grow forever.",
        "// Evict the least recently used entry at the limit.",
      ),
    ],
  ),
  "webgpu-acceleration": flow(
    "optimization-edge",
    "Which startup attempt reaches readiness?",
    "Inspect controlled initialization outcomes before any separate device timing.",
    [
      stage(
        "Try preferences",
        "Supplied order",
        "A false result or thrown initialization error permits the next name. Stop at the first true result.",
        "// Follow preference order until an attempt succeeds.",
      ),
      stage(
        "Await readiness",
        "Exactly one call",
        "After selection, await ready once. A readiness rejection must reach the caller.",
        "await runtime.ready();",
      ),
      stage(
        "Return backend",
        "Selected or existing fallback",
        "Return the successful name. If every attempt failed, read the existing backend after readiness.",
        "return selected ?? runtime.getBackend();",
      ),
      stage(
        "Measure separately",
        "Same task and device",
        "The controlled selector proves no hardware support or speed ranking. A device benchmark must await completed prediction readback.",
        "await output.data(); // Complete the timed prediction.",
      ),
    ],
  ),
  "llms-for-science": flow(
    "llm-integration",
    "Which reply fields can the client return?",
    "Trace supplied text through JSON parsing and field checks. Accepted structure still needs an evidence review.",
    [
      stage(
        "Callback reply",
        "One supplied response",
        "The exercise calls its supplied callback once. It sends no real model request.",
        "const response = await apiCall(prompt);",
      ),
      stage(
        "Locate and parse",
        "One JSON object",
        "The narrow reply contract permits surrounding text with no other braces. Malformed JSON must reject.",
        "const parsed = JSON.parse(objectText);",
      ),
      stage(
        "Validate fields",
        "Class, score, reasoning",
        "Require an allowed class, a finite numeric score from zero to one, and nonblank reasoning. Zero is valid. Numeric strings fail.",
        "// Reject an invalid required field before returning the parsed object.",
      ),
      stage(
        "Review claims",
        "Evidence still required",
        "A valid object can contain unsupported reasoning. Farah checks its claims against the source before release.",
        "// Structure alone cannot approve a scientific claim.",
      ),
    ],
  ),
  "prompt-engineering": flow(
    "llm-integration",
    "What needs to be explicit before the model writes?",
    "Prompts define a task and constraints. They do not guarantee correctness or replace output checks.",
    [
      stage(
        "Task",
        "One clear request",
        "Describe the operation and audience so the model knows what to produce.",
        "const task = 'Classify this signal as noise, anomaly or unknown.';",
      ),
      stage(
        "Evidence",
        "Catalogue and current reading",
        "Keep known reference frequencies separate from the current argument values and units. Neither supplies the correct label.",
        "const catalogue = [5, 12, 23, 47];\nconst current = { amplitude, frequency, phase };",
      ),
      stage(
        "Format",
        "Expected fields",
        "Specify the required structure. Validate the returned object to check whether it meets that structure.",
        "const required = ['classification', 'confidence', 'reasoning'];",
      ),
      stage(
        "Check",
        "Actual response",
        "Check that the reply has the required fields and that its claims match the evidence.",
        "validateReport(response);",
      ),
    ],
  ),
  "rag-for-signals": flow(
    "llm-integration",
    "Which records reach the report?",
    "Apply the requested field filters, count every match, then keep at most twenty in database order. The claim checker still needs each source, field, and unit.",
    [
      stage(
        "Retrieve",
        "Relevant records",
        "Apply the named band, age, and classification filters together. This retriever keeps database order.",
        "const { rows, matched, truncated } = retrieveSignals(query, db, now);",
      ),
      stage(
        "Keep source details",
        "Stable source IDs",
        "Keep record IDs and field meanings together so the checker can inspect the cited value and unit.",
        "const context = evidenceRows(rows);",
      ),
      stage(
        "Generate",
        "Structured claims",
        "Request claims about the supplied fields. A model can still ignore that request or omit evidence.",
        "const raw = await llm.complete(buildRAGPrompt(query, rows));",
      ),
      stage(
        "Verify support",
        "Claim to cited field",
        "Check each claim's source, field, unit, and allowed calculation. Unsupported interpretations still need review.",
        "verifyClaims(claims, context);",
      ),
    ],
  ),
  "report-generation": flow(
    "llm-integration",
    "Which sections are ready to leave the draft?",
    "The exercise formats supplied reviewed text. The separate drafting flow still requires explicit review before assembly.",
    [
      stage(
        "Plan sections",
        "Section requirements",
        "Give each section its own evidence and required fields so the reviewer can locate a failure.",
        "const sections = ['Executive Summary', 'Hypotheses', 'Results'];",
      ),
      stage(
        "Draft",
        "Section outputs",
        "Generate sections from their assigned evidence. Preserve their source links.",
        "const drafts = await draftSections(evidence);",
      ),
      stage(
        "Validate",
        "Reviewed sections",
        "A reviewer checks claims against evidence. The validated flag records that decision. The assembler cannot approve a claim.",
        "const checked = [{ heading, content, validated }];",
      ),
      stage(
        "Assemble",
        "Approved text + omissions",
        "Keep approved sections in order and list withheld headings. Review the assembled report for consistency before sending it.",
        "const report = assembleReport(title, checked);",
      ),
    ],
  ),
  "multi-model-systems": flow(
    "llm-integration",
    "What should each model pass to the next stage?",
    "Pass the original reading to each stage. Check the classifier and detector replies before calling the alert writer.",
    [
      stage(
        "Classifier",
        "Class + chosen-class score",
        "The classifier scales the three features for its model. Keep noise or anomaly, map another label to unknown, and reject an invalid score before continuing.",
        "const verdict = await classify(signal);\n// Check confidence in [0, 1]; allow only noise/anomaly, otherwise unknown.",
      ),
      stage(
        "Detector",
        "Boolean decision",
        "Give the detector the original raw reading and checked class. Require a boolean. The string 'false' is invalid.",
        "const isAnomaly = await detectAnomaly(signal, classification);\nif (typeof isAnomaly !== 'boolean') throw new Error('Invalid detector reply');",
      ),
      stage(
        "Alert writer",
        "Text or no call",
        "Call the writer only when the detector returns true. Require nonblank text, or return null without calling it. Valid fields still do not prove a prediction is right.",
        "const alert = isAnomaly ? await generateAlert(signal, classification) : null;\n// Reject blank alert text before returning the result.",
      ),
    ],
  ),

  "system-architecture": flow(
    "capstone",
    "What value reaches the next stage?",
    "Validate each input before processing, await completed outputs and name the failing stage. The eight-sample probe checks a linear composition.",
    [
      stage(
        "Normalize",
        "8 samples",
        "The supplied window has mean 1 and variance 0.08. This per-window diagnostic scaler differs from production preprocessing.",
        "const normalized = await normalize.process(raw);",
      ),
      stage(
        "FFT",
        "5 magnitudes",
        "The real FFT returns bins 0 through 4. No sample rate is supplied for these diagnostic bins.",
        "const magnitudes = await fft.process(normalized);",
      ),
      stage(
        "Tensor",
        "[1, 5]",
        "Await the final stage. The caller owns the returned tensor and releases it after inspection.",
        "const input = await tensor.process(magnitudes);",
      ),
    ],
  ),
  "ci-cd-pipeline": flow(
    "capstone",
    "Which evidence belongs to which artifact?",
    "Keep the five-row behavior gate, separate export round trip and hosted release identity distinct.",
    [
      stage(
        "Behavior",
        "4 of 5",
        "Missing labels stay in the denominator. Exact equality with a nonempty gate floor passes.",
        "const score = correct / total;",
      ),
      stage(
        "Export",
        "209 parameters",
        "The separate untrained 3/16/8/1 model has six tensors and 836 float32 weight bytes. Inspect the actual serialized buffer.",
        "const bytes = artifacts.weightData.byteLength;",
      ),
      stage(
        "Reload",
        "Probe parity",
        "Compare predictions before and after loading the saved bytes. This checks serialization on those probes.",
        "compare(original, reloaded);",
      ),
      stage(
        "Release identity",
        "Exact files",
        "Attach behavior reports to the graph, weights, preprocessing and labels actually evaluated before publication.",
        "verifyReleaseRecord(bundle, report);",
      ),
    ],
  ),
  monitoring: flow(
    "capstone",
    "Which observations produced this summary?",
    "Inspect score means, nearest-rank latency and feature-mean distance separately. Reviewed outcomes establish accuracy.",
    [
      stage(
        "Scores",
        "Mean 0.8",
        "The supplied three scores are 0.9, 0.8 and 0.7. Their mean measures scores, with no correctness verdict.",
        "const mean = sum(scores) / scores.length;",
      ),
      stage(
        "Durations",
        "P95 134 ms",
        "The supplied log has 95 values from 40 to 134 ms and five 400 ms calls. P99 reaches 400 ms.",
        "sorted[Math.max(0, Math.ceil(n * p / 100) - 1)];",
      ),
      stage(
        "Feature means",
        "Distance sqrt(5)",
        "Recent means [1, 2] differ from baseline [0, 0]. Equal means can still hide changed spread.",
        "Math.hypot(...differences);",
      ),
      stage(
        "Review",
        "Labels pending",
        "Inspect source data, preprocessing and label coverage before evaluating a replacement. Empty logs display No data.",
        "if (!entries.length) return null;",
      ),
    ],
  ),
  documentation: flow(
    "capstone",
    "Can the next watch trace each card line to its source?",
    "Render the supplied metadata, preserve evaluation scope and find the lowest recall across every class. A complete card still needs evidence.",
    [
      stage(
        "Accuracy",
        "91.8%",
        "The supplied fraction is 0.918, measured at the pruning review. Keep that context beside the formatted percentage.",
        "(meta.accuracy * 100).toFixed(1);",
      ),
      stage(
        "Recall",
        "Anomaly 84.0%",
        "Find the smallest supplied value. Another class or key order can change the answer.",
        "Object.entries(meta.recallByClass).reduce(minRecall);",
      ),
      stage(
        "Scope",
        "3988 bytes, 0.035 ms",
        "Weight-file bytes differ from all downloads. Classifier timing differs from a whole-pipeline measurement.",
        "render(meta.weightBytes, meta.inferenceMs);",
      ),
      stage(
        "Handover",
        "Actual generated string",
        "Inspect the Challenge output. Runbook judgment and evaluation of a new sensor require separate work.",
        "return lines.join('\n');",
      ),
    ],
  ),
  launch: flow(
    "capstone",
    "What does each launch task establish?",
    "Keep ordered verification, actual rehearsal training and supplied detector voting as distinct records. Hosted checks remain separate.",
    [
      stage(
        "Deployment verification",
        "Ordered check record",
        "Await each check. Any failure blocks release. A timeout requests cancellation and skips dependents.",
        "const result = await check(signal);",
      ),
      stage(
        "Launch rehearsal and candidate evaluation",
        "Fit and canary evidence",
        "Train the local synthetic model, inspect its actual losses and scores, then apply the configured gate.",
        "const history = await model.fit(xs, ys, config);",
      ),
      stage(
        "The anomaly classification at launch",
        "Votes and ratios",
        "Combine supplied fictional detector votes and interval-template evidence. Their score difference proves no accuracy gain or origin.",
        "const ratio = intervals[i + 1] / intervals[i];",
      ),
    ],
  ),
};
