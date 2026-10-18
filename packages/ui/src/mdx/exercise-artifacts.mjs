// One validator for authored exercise output in the worker, host, and CLI.
// Copy only bounded, displayable data. Never transport tensors or HTML.
export function createArtifactCollector() {
  const artifacts = [];
  function fail(message) {
    throw new Error("Exercise output: " + message);
  }
  function text(value, name, max = 600) {
    if (typeof value !== "string" || value.length > max)
      fail(name + " must be text of at most " + max + " characters");
    return value;
  }
  function list(value, name, max) {
    if (!Array.isArray(value) || !value.length || value.length > max)
      fail(name + " must have 1 to " + max + " entries");
    return Array.from(value);
  }
  function number(value) {
    if (typeof value !== "number" || !Number.isFinite(value))
      fail("chart values must be finite numbers");
    return value;
  }
  function cell(value) {
    if (value === null || typeof value === "boolean") return value;
    if (typeof value === "number") return number(value);
    return text(value, "table cell", 1200);
  }
  function record(value) {
    if (artifacts.length >= 4) fail("a run can show at most 4 outputs");
    if (!value || typeof value !== "object") fail("output must be an object");
    const item = { kind: value.kind, title: text(value.title, "title", 180) };
    if (value.summary !== undefined)
      item.summary = text(value.summary, "summary", 1200);
    if (value.kind === "table") {
      item.columns = list(value.columns, "columns", 12).map((v) =>
        text(v, "column", 180),
      );
      item.rows = list(value.rows, "rows", 40).map((row) => {
        if (!Array.isArray(row) || row.length !== item.columns.length)
          fail("each row must match the columns");
        return Array.from(row, cell);
      });
    } else if (value.kind === "series") {
      item.xLabel = text(value.xLabel, "x axis", 180);
      item.yLabel = text(value.yLabel, "y axis", 180);
      item.labels = list(value.labels, "point labels", 64).map((v) =>
        text(v, "point label", 180),
      );
      item.series = list(value.series, "series", 8).map((series) => {
        if (
          !series ||
          !Array.isArray(series.values) ||
          series.values.length !== item.labels.length
        )
          fail("every series must match the point labels");
        return {
          name: text(series.name, "series name", 180),
          values: Array.from(series.values, number),
        };
      });
    } else if (value.kind === "text") {
      item.text = text(value.text, "output", 6000);
    } else fail("unknown output kind");
    artifacts.push(item);
  }
  return { record, read: () => JSON.parse(JSON.stringify(artifacts)) };
}

export const ARTIFACT_COLLECTOR_SOURCE =
  "(" + createArtifactCollector.toString() + ")";

export function validateArtifacts(values) {
  if (!Array.isArray(values)) throw new Error("Exercise output must be a list");
  const collector = createArtifactCollector();
  for (const value of values) collector.record(value);
  return collector.read();
}
