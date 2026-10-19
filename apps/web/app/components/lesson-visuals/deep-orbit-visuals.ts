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
    "Can we merge the feeds without mixing the channels?",
    "Average two passes, then adjust the gain. Watch each channel keep its position.",
    "Broadcasting applies the two-channel row to each reading. Element-wise operations preserve those positions; a matrix product combines them into weighted sums.",
  ),
  "data-loading": visual(
    "foundations",
    "tensor",
    "batch",
    "How much of the archive goes through at once?",
    "Inspect four batches from the exercise's 16-row archive. Each row keeps its three features.",
    "A batch is a group of examples. It keeps the same feature order as the rest of the data.",
  ),
  normalization: visual(
    "foundations",
    "tensor",
    "normalize",
    "What happens when channels use different scales?",
    "Use the same four readings and fixed neuron as the challenge. Compare raw inputs with z-scores, then inspect min-max scaling.",
    "Fit each column's scaler on training data, then reuse those statistics on later data.",
  ),

  "first-neuron": visual(
    "neural-networks",
    "neuron",
    "linear",
    "Which reading changes the output most?",
    "Move the first weight. Trace the two products into their sum.",
    "This first neuron computes a weighted sum plus a bias. There is no activation yet.",
  ),
  "activation-functions": visual(
    "neural-networks",
    "neuron",
    "activation",
    "What changes when the neuron has an activation?",
    "Choose a function, then move its input along the curve.",
    "An activation changes the weighted sum before the next layer receives it.",
  ),
  "layers-and-architecture": visual(
    "neural-networks",
    "network",
    "layers",
    "What grows when you add hidden units?",
    "Change the width of the hidden layer. Count its connections and biases.",
    "Dense layers connect every input to every unit. Width changes the number of trainable parameters.",
  ),
  "forward-pass": visual(
    "neural-networks",
    "network",
    "forward",
    "How does one example travel through a network?",
    "Advance the example through a small network with fixed weights.",
    "A forward pass applies each layer in order. It does not update the weights.",
  ),
  "building-a-network": visual(
    "neural-networks",
    "network",
    "build",
    "Do the layer shapes fit together?",
    "Change the hidden width and follow the shape passed to the output layer.",
    "The next layer takes the previous layer's outputs as its inputs. The batch axis stays first.",
  ),

  "loss-functions": visual(
    "training-loop",
    "loss",
    "mse",
    "How wrong is this prediction?",
    "Move a prediction away from its target and watch its squared error grow.",
    "Mean squared error averages squared differences. Large errors contribute more than small ones.",
  ),
  "gradient-descent": visual(
    "training-loop",
    "gradient",
    "descent",
    "How far should the next correction go?",
    "Choose a learning rate, then take a step down a simple loss curve.",
    "Subtract learning rate times gradient. A large step can cross the minimum and increase loss.",
  ),
  backpropagation: visual(
    "training-loop",
    "gradient",
    "chain",
    "How does the error reach an earlier weight?",
    "Change the weight and trace the derivatives back through one computation.",
    "The chain rule multiplies local derivatives. It tells each weight how it affected the loss.",
  ),
  "training-loop": visual(
    "training-loop",
    "training",
    "epochs",
    "When does more training stop helping?",
    "Move through an illustrative run. Compare training loss with validation loss.",
    "Validation can worsen while training loss falls. TensorFlow.js early stopping keeps the final weights. Save and restore the best validation weights yourself.",
  ),
  "evaluating-deep-scan": visual(
    "training-loop",
    "evaluation",
    "cases",
    "Which mistakes does one accuracy score hide?",
    "Change the decision threshold and inspect the cases that change category.",
    "A missed anomaly and a false alarm have different costs. Inspect both before choosing a threshold.",
  ),

  "why-the-browser": flow(
    "browser-runtimes",
    "Which parts of inference can stay on the ship?",
    "Local inference needs the model and runtime on the device. The rest of an app can still make network requests.",
    [
      stage(
        "Fetch assets",
        "Model + runtime",
        "The first load needs an asset source. Offline operation needs those assets available locally.",
        "const model = await loadModel(localUrl);",
      ),
      stage(
        "Read locally",
        "Sensor → tensor",
        "The example remains on this device in this design. Privacy depends on every other data path too.",
        "const input = makeTensor(sensorReading);",
      ),
      stage(
        "Infer locally",
        "Tensor → score",
        "The browser executes the model using an available backend. Device resources constrain the model.",
        "const score = model.predict(input);",
      ),
      stage(
        "Show a result",
        "Score → display",
        "The UI consumes the result. Decide separately what, if anything, leaves the device.",
        "renderScore(await score.data());",
      ),
    ],
  ),
  "tensorflow-js-setup": flow(
    "browser-runtimes",
    "Is the runtime ready before the first tensor?",
    "Wait for backend initialization and verify the chosen backend before depending on it.",
    [
      stage(
        "Import",
        "API available",
        "Importing exposes the TensorFlow.js API. Backend initialization is a separate step.",
        "import * as tf from '@tensorflow/tfjs';",
      ),
      stage(
        "Initialize",
        "Backend ready",
        "The readiness promise resolves after the selected backend initializes.",
        "await tf.ready();",
      ),
      stage(
        "Inspect",
        "Backend name",
        "Check which backend actually started. The browser name alone does not tell you.",
        "console.log(tf.getBackend());",
      ),
      stage(
        "Verify",
        "Small calculation",
        "A small operation verifies the path before the larger model is involved. Dispose the test tensors.",
        "tf.tidy(() => tf.scalar(3).square().print());",
      ),
    ],
  ),
  "model-loading": flow(
    "browser-runtimes",
    "Why can model.json load while the model fails?",
    "The model graph and every weight file it lists must be available at the expected URLs.",
    [
      stage(
        "Request graph",
        "model.json",
        "The JSON describes the graph and the paths of weight files. Receiving it is only the first request.",
        "const url = '/models/scan/model.json';",
      ),
      stage(
        "Resolve shards",
        "group1-shard1of2.bin",
        "Weight-file paths are relative to the model URL. Check the network request to find a missing file.",
        "new URL('group1-shard1of2.bin', location.origin + url);",
      ),
      stage(
        "Load weights",
        "All shards required",
        "Loading model.json is not enough. The model also needs every binary weight file.",
        "const model = await tf.loadLayersModel(url);",
      ),
      stage(
        "Check contract",
        "Shape + preprocessing",
        "A loaded model still needs the input shape and preprocessing used during training.",
        "console.log(model.inputs[0].shape);",
      ),
    ],
  ),
  "inference-pipeline": flow(
    "browser-runtimes",
    "What has to happen between a reading and a verdict?",
    "Keep preprocessing consistent with training and release temporary tensors after reading the result.",
    [
      stage(
        "Prepare",
        "One example",
        "Check feature order, scale values using the training statistics, and add the batch axis.",
        "const input = tf.tensor2d([scaledFeatures]);",
      ),
      stage(
        "Predict",
        "Output tensor",
        "Prediction returns tensors. Keep them alive until their data has been read.",
        "const output = model.predict(input);",
      ),
      stage(
        "Read",
        "JS values",
        "Await the result before rendering. Handle loading and failure states in the UI.",
        "const values = await output.data();",
      ),
      stage(
        "Release",
        "Temporary memory",
        "Dispose both temporary input and output tensors. Keep the model for subsequent readings.",
        "input.dispose(); output.dispose();",
      ),
    ],
  ),
  "onnx-runtime-web": flow(
    "browser-runtimes",
    "What makes an exported model usable here?",
    "The file extension alone does not tell you whether a model will run. Check its operations, tensor shapes, and backend support.",
    [
      stage(
        "Inspect graph",
        "Ops + shapes",
        "Check which operators the exported graph uses before selecting a runtime and execution provider.",
        "// Inspect the exported graph's operator list.",
      ),
      stage(
        "Create session",
        "Supported provider",
        "Loading may fail if the graph needs an unsupported operation. Keep the real error for diagnosis.",
        "const session = await ort.InferenceSession.create(url);",
      ),
      stage(
        "Match inputs",
        "Named tensors",
        "Input names, data types and dimensions must match the graph's contract.",
        "const feeds = { [session.inputNames[0]]: input };",
      ),
      stage(
        "Run",
        "Named outputs",
        "Read the named outputs and compare a known example against the source model.",
        "const outputs = await session.run(feeds);",
      ),
    ],
  ),
  "transformers-js": flow(
    "browser-runtimes",
    "Does a pretrained pipeline fit this task and device?",
    "Check the model's task, license, download size and behavior on representative inputs.",
    [
      stage(
        "Choose task",
        "Task contract",
        "Select a model trained for the operation you need. A text classifier is not a forecasting model.",
        "const task = 'sentiment-analysis';",
      ),
      stage(
        "Review model",
        "License + assets",
        "Check permitted use, model files and device requirements before downloading into the application.",
        "// Review the selected model card.",
      ),
      stage(
        "Load pipeline",
        "Model + processor",
        "Preprocessing and tokenization belong with the selected model.",
        "const classify = await pipeline(task, modelId);",
      ),
      stage(
        "Check outputs",
        "Your examples",
        "Try representative examples. A returned score does not prove the model suits the ship's data.",
        "const result = await classify(exampleText);",
      ),
    ],
  ),

  "time-vs-frequency": visual(
    "signal-processing",
    "signal",
    "views",
    "What hides inside a complicated waveform?",
    "Adjust the second tone. See the same signal in time and frequency.",
    "The spectrum separates frequency components. Magnitude alone does not preserve their phase.",
  ),
  "fourier-transform": visual(
    "signal-processing",
    "signal",
    "fourier",
    "Which repeating components add up to this signal?",
    "Change the second frequency and watch its spectral peak move.",
    "A Fourier transform measures contributions of sine and cosine components. Here the peaks show magnitudes.",
  ),
  spectrograms: visual(
    "signal-processing",
    "signal",
    "spectrogram",
    "When did the new frequency appear?",
    "Move the time window across a signal whose second tone begins halfway through.",
    "A spectrogram lines up spectra from successive windows, showing when frequencies change.",
  ),
  "fft-as-features": visual(
    "signal-processing",
    "signal",
    "features",
    "What would the model see in frequency features?",
    "Change the tone and compare the waveform with its magnitude bins.",
    "FFT features describe frequency content. Whether they improve predictions must be checked on held-out data.",
  ),
  "windowing-and-overlap": visual(
    "signal-processing",
    "signal",
    "window",
    "What happens when a window cuts through a cycle?",
    "Compare a rectangular window with a Hann window. Use a tone between FFT bin centers to see leakage.",
    "Softening the window edges reduces spectral leakage but widens the main peak. Overlapping windows cover more of the signal.",
  ),

  "sequences-matter": visual(
    "recurrent-networks",
    "sequence",
    "order",
    "Can the same readings tell a different story?",
    "Reverse the sequence and follow the changes between adjacent readings.",
    "The values can be identical as a set while their order describes a different trend.",
  ),
  "simple-rnns": visual(
    "recurrent-networks",
    "sequence",
    "rnn",
    "What survives from the previous reading?",
    "Move through the readings and see how each one updates a small recurrent state.",
    "Each step uses both the current input and the previous state. The weights here are fixed teaching values.",
  ),
  "lstm-gates": visual(
    "recurrent-networks",
    "sequence",
    "gates",
    "How much of the old memory should remain?",
    "Adjust the forget gate in one scalar memory update.",
    "An LSTM learns gate values per dimension. This example holds the input gate and candidate fixed.",
  ),
  "sliding-windows": visual(
    "recurrent-networks",
    "sequence",
    "windows",
    "Which readings predict the next one?",
    "Slide a three-reading input window. The following reading becomes its target.",
    "Keep input and target time order intact. Split by time before creating overlapping training and validation windows.",
  ),
  "sequence-prediction": visual(
    "recurrent-networks",
    "sequence",
    "predict",
    "Where does the observed sequence end?",
    "Extend a small forecast one step at a time and compare it with held-out observations.",
    "A forecast is a prediction of an unseen value. It needs evaluation against observations from later times.",
  ),

  "normal-vs-anomalous": visual(
    "anomaly-detection",
    "anomaly",
    "baseline",
    "How far is this reading from the usual pattern?",
    "Move a new reading relative to a small reference distribution.",
    "Distance from this baseline is a reason to inspect a reading, not proof of an anomaly.",
  ),
  autoencoders: visual(
    "anomaly-detection",
    "anomaly",
    "rebuild",
    "What gets lost when a reading is compressed?",
    "Change one input feature and compare a fixed teaching reconstruction.",
    "An autoencoder learns to reconstruct its training data. Reconstruction failure can be evidence, but it is not a verdict.",
  ),
  "reconstruction-error": visual(
    "anomaly-detection",
    "anomaly",
    "error",
    "Which feature contributes most to the mismatch?",
    "Change one feature and inspect its squared difference from the reconstructed value.",
    "Average the squared differences to score one example. Check each feature's contribution to understand the score.",
  ),
  "threshold-tuning": visual(
    "anomaly-detection",
    "evaluation",
    "threshold",
    "How many investigations does this threshold create?",
    "Move the threshold across labeled teaching cases and compare misses with false alarms.",
    "Choose costs and a validation rule before inspecting the final test set. This board is a separate teaching example.",
  ),
  "the-anomaly": visual(
    "anomaly-detection",
    "anomaly",
    "agreement",
    "What does agreement between detectors actually tell us?",
    "Change amplitude, reconstruction error and a supplied forecast. Inspect the three detector votes and the two-vote alert rule.",
    "Agreement is a reason to investigate. Checks that share evidence can also share mistakes, so agreement does not reveal the true label.",
  ),

  "beyond-lstm": visual(
    "advanced-time-series",
    "attention",
    "query",
    "Which earlier readings match the current query?",
    "Change the query and watch its similarities become normalized attention weights.",
    "Attention combines values using query-key similarity. A high weight is not proof of a causal explanation.",
  ),
  "temporal-attention": visual(
    "advanced-time-series",
    "attention",
    "time",
    "Does the most recent reading deserve the most weight?",
    "Change the query and positional coefficient, then compare weights across five time positions.",
    "A positional term can change which earlier reading gets the greatest weight. This example uses chosen coefficients rather than learned ones.",
  ),
  forecasting: visual(
    "advanced-time-series",
    "sequence",
    "forecast",
    "What changes when a prediction becomes the next input?",
    "Feed predictions back into the forecast. Check the error at each future step.",
    "Recursive forecasts feed predictions back in. Errors may accumulate, but they need not grow at every step.",
  ),
  "kalman-filters": visual(
    "advanced-time-series",
    "kalman",
    "update",
    "How much should a noisy measurement change the estimate?",
    "Increase measurement uncertainty and watch the estimate trust its prediction more.",
    "The Kalman gain balances predicted uncertainty against measurement uncertainty in this scalar example.",
  ),
  "time-series-ensemble-methods": visual(
    "advanced-time-series",
    "sequence",
    "ensemble",
    "Can combining forecasts reduce this error?",
    "Change the weight assigned to two forecasts and compare their combined result with observations.",
    "Combining forecasts can help when their errors differ. Shared mistakes survive averaging.",
  ),

  "model-profiling": flow(
    "optimization-edge",
    "Where is the actual cost of one prediction?",
    "Run warmup calls before timing the model on the target device. Parameter count alone cannot tell you prediction time.",
    [
      stage(
        "Warm up",
        "Initialization excluded",
        "Run a typical input before timing warmed-up predictions. Report first-load time separately.",
        "const warmup = model.predict(input);\nawait warmup.data();\nwarmup.dispose();",
      ),
      stage(
        "Measure",
        "Await completion",
        "Time through the output read so asynchronous work is included.",
        "// This model has one tensor output.\nconst start = performance.now();\nconst output = model.predict(input);\nawait output.data();\nconst elapsedMs = performance.now() - start;\noutput.dispose();",
      ),
      stage(
        "Inspect memory",
        "Live tensor count",
        "Compare retained tensors across repeated calls. Growing counts can reveal a missing disposal.",
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
    "Reduce the number of representable levels and compare rounded weights with the originals.",
    "Fewer bits can shrink stored weights. Measure speed on the runtime and device, and evaluate accuracy on labeled data.",
  ),
  pruning: visual(
    "optimization-edge",
    "precision",
    "prune",
    "What disappears when small weights become zero?",
    "Raise the magnitude cutoff and inspect which connections remain.",
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
        "Compute miss",
        "Current pipeline",
        "Use current preprocessing and model versions when there is no valid cached entry.",
        "const value = cached ?? await predict(input);",
      ),
      stage(
        "Bound storage",
        "Eviction policy",
        "Limit entries and invalidate obsolete versions so the cache cannot grow forever.",
        "// Evict the least recently used entry at the limit.",
      ),
    ],
  ),
  "webgpu-acceleration": flow(
    "optimization-edge",
    "When can GPU work save time?",
    "Transfers, initialization, operation support and workload size affect the benefit. Keep a working fallback.",
    [
      stage(
        "Check support",
        "Device capability",
        "API availability is a first check. Adapter creation and backend initialization can still fail.",
        "const available = 'gpu' in navigator;",
      ),
      stage(
        "Initialize",
        "Selected backend",
        "Attempt backend initialization and handle failure with a supported alternative.",
        "import '@tensorflow/tfjs-backend-webgpu';\nconst initialized = await tf.setBackend('webgpu');\nif (!initialized) throw new Error('WebGPU initialization failed');\nawait tf.ready();\nif (tf.getBackend() !== 'webgpu') throw new Error('WebGPU is not active');\n// On failure, initialize and verify a supported fallback.",
      ),
      stage(
        "Run workload",
        "Parallel operations",
        "Large matrix operations can benefit from parallel execution. Small workloads may be dominated by overhead.",
        "const output = model.predict(input);",
      ),
      stage(
        "Benchmark",
        "Same task + device",
        "Include output readback and compare end-to-end time and numerical behavior with the fallback.",
        "await output.data(); // wait for the actual result",
      ),
    ],
  ),

  "llms-for-science": flow(
    "llm-integration",
    "What separates a generated explanation from evidence?",
    "A fluent draft still needs checks against source data. Model output is not a new measurement.",
    [
      stage(
        "Supply evidence",
        "Known observations",
        "Give the model measurements with their sources. Mark missing or unknown values clearly.",
        "const context = { observations, sourceIds };",
      ),
      stage(
        "Constrain task",
        "Draft an explanation",
        "State the intended task and the limits of the evidence. Require uncertainty where the evidence is incomplete.",
        "const instruction = 'Draft from the supplied observations.';",
      ),
      stage(
        "Generate",
        "Unverified text",
        "The generated draft may contain unsupported claims even when it is plausible.",
        "const draft = await generate(instruction, context);",
      ),
      stage(
        "Check claims",
        "Evidence required",
        "Compare each factual statement with the source. Route unresolved claims for review.",
        "const checks = verifyClaims(draft, context);",
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
        "const task = 'Summarize these sensor observations.';",
      ),
      stage(
        "Evidence",
        "Bounded context",
        "Separate supplied records from instructions and avoid treating retrieved text as trusted commands.",
        "const evidence = JSON.stringify(records);",
      ),
      stage(
        "Format",
        "Expected fields",
        "Specify the required structure. Validate the returned object rather than trusting the request alone.",
        "const required = ['classification', 'confidence', 'reasoning'];",
      ),
      stage(
        "Check",
        "Actual response",
        "Check schema and evidence support under the chosen decoding settings.",
        "validateReport(response);",
      ),
    ],
  ),
  "rag-for-signals": flow(
    "llm-integration",
    "Can the crew trace this sentence to a source?",
    "Retrieval supplies context, not guaranteed truth. A citation must support the specific claim beside it.",
    [
      stage(
        "Retrieve",
        "Relevant records",
        "Search the archive for evidence relevant to the query. A similarity score is not a truth score.",
        "const records = await retrieve(query);",
      ),
      stage(
        "Keep source details",
        "Stable source IDs",
        "Pass source IDs and text together so claims can be checked against the correct record.",
        "const context = records.map(({ id, text }) => ({ id, text }));",
      ),
      stage(
        "Generate",
        "Draft + references",
        "Ask the model to use the supplied records for its claims and name missing evidence.",
        "const draft = await generateReport(context);",
      ),
      stage(
        "Verify support",
        "Claim → passage",
        "An existing source ID is insufficient if the passage does not support the claim.",
        "verifyCitations(draft, records);",
      ),
    ],
  ),
  "report-generation": flow(
    "llm-integration",
    "Which sections are ready to leave the draft?",
    "Assemble only sections that pass their checks. Surface missing or rejected sections instead of hiding them.",
    [
      stage(
        "Plan sections",
        "Separate contracts",
        "Give each section its own evidence and required fields so a failure can be located.",
        "const sections = ['observations', 'analysis', 'limits'];",
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
        "A reviewer checks claims against evidence. The validated flag records that decision; the assembler cannot approve a claim.",
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
    "What must each specialist hand to the next?",
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
        "Give the detector the original raw reading and checked class. Require a boolean; the string 'false' is invalid.",
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
    "Where can the system fail between sensor and report?",
    "Clear input and output rules help locate failures. Keep version and source details through every stage.",
    [
      stage(
        "Ingest",
        "Validated reading",
        "Reject malformed readings and preserve their timestamps before they enter the model path.",
        "const reading = validateReading(raw);",
      ),
      stage(
        "Preprocess",
        "Versioned features",
        "Use the expected column order, fitted scaler and input shape.",
        "const features = preprocess(reading, scalerVersion);",
      ),
      stage(
        "Infer",
        "Score + model ID",
        "Keep inference failures distinct from a low score. Enforce the target device's resource budget.",
        "const result = await infer(features, modelVersion);",
      ),
      stage(
        "Report",
        "Traceable decision",
        "Include source and version metadata so the crew can reconstruct a decision later.",
        "record({ readingId: reading.id, result, modelVersion, scalerVersion });",
      ),
    ],
  ),
  "ci-cd-pipeline": flow(
    "capstone",
    "Did the tests check the exact model being released?",
    "Release the same graph, weights and preprocessing that passed evaluation. A rebuilt artifact needs new checks.",
    [
      stage(
        "Pin model files",
        "File hashes",
        "Identify the graph, weights and scaler as a versioned bundle.",
        "const bundle = { graphHash, weightsHash, scalerHash };",
      ),
      stage(
        "Test contract",
        "Known input",
        "Check the loaded artifact's input and output shape and a known example.",
        "await checkModelContract(bundle);",
      ),
      stage(
        "Evaluate",
        "Evaluation criteria",
        "Apply the agreed evaluation criteria to the exact artifact. Preserve the report alongside it.",
        "const report = await evaluate(bundle, heldOut);",
      ),
      stage(
        "Release gate",
        "Evidence + artifact",
        "Release only the model files that passed the checks. A successful app build does not check the model.",
        "if (passes(report)) promote(bundle);",
      ),
    ],
  ),
  monitoring: flow(
    "capstone",
    "What could go wrong without throwing an exception?",
    "Monitor inputs, performance and outcomes. A changing score distribution needs investigation before assigning new labels.",
    [
      stage(
        "Input checks",
        "Schema + distribution",
        "Track missing values and changes in feature distributions even when the schema still matches.",
        "observeInputs(batch);",
      ),
      stage(
        "Runtime checks",
        "Latency + failures",
        "Separate slow responses, missing responses and failed computations.",
        "observeRuntime({ duration, error });",
      ),
      stage(
        "Output checks",
        "Score distribution",
        "Look for unexpected distribution shifts. Confidence alone does not measure accuracy.",
        "observeScores(scores);",
      ),
      stage(
        "Review outcomes",
        "Labels when available",
        "Compare predictions with later reviewed outcomes and record the delay in that feedback.",
        "joinPredictionsWithReviewedLabels();",
      ),
    ],
  ),
  documentation: flow(
    "capstone",
    "What would the next watch need to trust this model?",
    "Document intended use, data, evaluation and limits along with the API and deployment instructions.",
    [
      stage(
        "Intended use",
        "Scope + exclusions",
        "Name the task and conditions where the model has not been validated.",
        "const card = { task, intendedUse, exclusions };",
      ),
      stage(
        "Data",
        "Training data sources",
        "Describe the data sources, splits, preprocessing and known gaps.",
        "card.data = { sources, splits, preprocessing };",
      ),
      stage(
        "Evaluation",
        "Metrics + conditions",
        "Record the evaluation set and conditions alongside metrics so numbers have a meaning.",
        "card.evaluation = { datasetVersion, metrics, conditions };",
      ),
      stage(
        "Operations",
        "Owners + recovery",
        "Give the next watch enough information to diagnose failure and recover safely.",
        "card.operations = { owner, monitoring, rollback };",
      ),
    ],
  ),
  launch: flow(
    "capstone",
    "Can the deployed console complete the whole path?",
    "Verify deployed assets and server dependencies on the actual target. A locally working build is one piece of release evidence.",
    [
      stage(
        "App assets",
        "Page + scripts",
        "Load the deployed application from the target console and check its routes and assets.",
        "// Verify the deployed URL on the target device.",
      ),
      stage(
        "Model assets",
        "Graph + every shard",
        "Confirm every deployed model file loads from its final path.",
        "await loadDeployedModel();",
      ),
      stage(
        "Dependencies",
        "Required services",
        "Test authentication and other server dependencies that the deployed experience needs.",
        "await checkRequiredServices();",
      ),
      stage(
        "End to end",
        "Known reading → report",
        "Run a known reading through the complete deployed path and compare it with the expected result.",
        "await verifyReleaseFixture();",
      ),
    ],
  ),
};
