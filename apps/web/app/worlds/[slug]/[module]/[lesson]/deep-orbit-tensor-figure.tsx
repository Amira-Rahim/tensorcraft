/** The same three readings connect the recap to the glossary examples. */
function Values({
  table = false,
  className = "orbit-study-values",
}: {
  table?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {(table ? [0.2, 0.4, 0.6, 0.1, 0.3, 0.5] : [0.2, 0.4, 0.6]).map(
        (value, i) => (
          <span key={i}>{value}</span>
        ),
      )}
    </div>
  );
}

export function TensorConversionFigure() {
  return (
    <figure
      className="orbit-tensor-figure"
      aria-label="A JavaScript array becomes a tensor with the same three values in the same order. Its shape is [3]."
    >
      <div className="orbit-transform-grid">
        <span className="orbit-row-label">JavaScript array</span>
        <Values className="orbit-transform-values orbit-array-values" />
        <code className="orbit-transform-function">tf.tensor()</code>
        <div className="orbit-value-links" aria-hidden="true">
          <span className="orbit-value-link" />
          <span className="orbit-value-link" />
          <span className="orbit-value-link" />
        </div>
        <span className="orbit-row-label">Tensor</span>
        <Values className="orbit-transform-values orbit-tensor-values" />
        <div className="orbit-axis-bracket" aria-hidden="true" />
        <div className="orbit-shape-reading">
          <code>
            <span>shape</span>[3]
          </code>
          <p>One axis with three values</p>
        </div>
      </div>
      <figcaption>The values and their order stay the same.</figcaption>
    </figure>
  );
}

export type TensorTerm = "tensor" | "shape" | "dimensions";

export function TensorTermFigure({ term }: { term: TensorTerm }) {
  const dimensions = term === "dimensions";
  return (
    <figure
      className="orbit-glossary-stage"
      data-term={term}
      aria-label={
        dimensions
          ? "A list has one axis. A table has two axes: rows and columns."
          : "A tensor containing the three readings 0.2, 0.4, and 0.6."
      }
    >
      <div className="orbit-study-comparison">
        <div className="orbit-study-object">
          <p className="orbit-study-title">
            {dimensions ? "A list" : "A tensor with three readings"}
          </p>
          <Values />
          {term === "shape" && (
            <>
              <div className="orbit-study-underbrace" aria-hidden="true" />
              <p className="orbit-study-shape">
                shape <code>[3]</code>
              </p>
            </>
          )}
          {dimensions && (
            <>
              <div className="orbit-study-axis">One direction</div>
              <p className="orbit-study-axis-count">1 dimension</p>
            </>
          )}
        </div>
        {dimensions && (
          <div className="orbit-study-object">
            <p className="orbit-study-title">A table</p>
            <div className="orbit-study-matrix">
              <div className="orbit-study-vertical" aria-hidden="true">
                <span className="orbit-study-vertical-label">Rows</span>
              </div>
              <Values table />
              <div className="orbit-study-axis">Columns</div>
            </div>
            <p className="orbit-study-axis-count">2 dimensions</p>
          </div>
        )}
      </div>
      <figcaption>
        {term === "tensor"
          ? "The tensor is the whole container, including all three values."
          : term === "shape"
            ? "The single entry in [3] gives the length of this tensor’s only axis."
            : "Dimensions count the axes. Shape records the size along each one."}
      </figcaption>
    </figure>
  );
}
