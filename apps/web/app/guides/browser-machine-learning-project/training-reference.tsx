import reference from "@/public/assignments/room-training-reference-v1.json";

const cell = "border-b border-border px-4 py-3 text-left tabular-nums";
const link = "text-primary underline underline-offset-4";

export function TrainingReference() {
  const baseline = reference.baselineMetrics;
  const model = reference.modelMetrics;
  const rows = [
    ["Correct occupied", baseline.tp, model.tp],
    ["Correct empty", baseline.tn, model.tn],
    ["False alarms", baseline.fp, model.fp],
    ["Missed occupancy", baseline.fn, model.fn],
    [
      "Correct predictions",
      `${Number((baseline.accuracy * 100).toFixed(2))}%`,
      `${Number((model.accuracy * 100).toFixed(2))}%`,
    ],
    ["Illustrative error cost", baseline.totalErrorCost, model.totalErrorCost],
  ];
  return (
    <section
      aria-labelledby="supplied-training-reference"
      className="mt-12 max-w-3xl space-y-5 leading-relaxed"
    >
      <h2
        id="supplied-training-reference"
        className="font-mono text-2xl font-bold tracking-tight sm:text-3xl"
      >
        Supplied five-epoch reference
      </h2>
      <p>
        We recorded this maintainer run with TensorFlow.js{" "}
        {reference.runtimeVersion} on the {reference.backend.toUpperCase()}{" "}
        backend. It used the same supplied training code and recorded data as
        the browser demo. We last verified it on{" "}
        <time dateTime={reference.verifiedOn}>{reference.verifiedOn}</time>.
      </p>
      <p>
        The first {reference.counts.train.toLocaleString("en-US")} readings fit
        the scaler and model. Both policies were then checked on the next{" "}
        {reference.counts.validation} validation readings. The last{" "}
        {reference.counts.reserved} readings remain unused. These are supplied
        reference results. Your browser run appears in its own section below.
      </p>
      <div
        role="region"
        aria-label="Supplied reference validation comparison"
        tabIndex={0}
        className="max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary"
      >
        <table className="w-full text-sm">
          <caption className="sr-only">
            Supplied reference on 400 validation readings
          </caption>
          <thead>
            <tr>
              <th scope="col" className={cell}>
                Outcome
              </th>
              <th scope="col" className={cell}>
                Light rule
              </th>
              <th scope="col" className={cell}>
                Model, five epochs
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, ruleValue, modelValue]) => (
              <tr key={label}>
                <th scope="row" className={cell}>
                  {label}
                </th>
                <td className={cell}>{ruleValue}</td>
                <td className={cell}>{modelValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The illustrative cost is {reference.costs.falsePositive} per false alarm
        and {reference.costs.falseNegative} per missed occupied reading. Those
        costs are choices for this example. This result describes validation
        data from one room. It does not establish performance in another room or
        show what a learner can build independently.
      </p>
      <p>
        The{" "}
        <a className={link} href="/assignments/room-training-reference-v1.json">
          versioned reference record
        </a>{" "}
        includes the source and data hashes. The{" "}
        <a className={link} href="/demos/room-training.mjs">
          training source
        </a>{" "}
        records the model, preprocessing and evaluation choices.
      </p>
    </section>
  );
}
