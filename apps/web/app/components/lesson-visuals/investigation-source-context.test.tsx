import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { LessonInvestigation } from "./lesson-investigation";
import { LESSON_INVESTIGATIONS } from "./lesson-investigations";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import {
  INVESTIGATION_SOURCE_CONTEXTS,
  selectedInvestigationSource,
  withInvestigationSourceContexts,
} from "./investigation-source-context";
import {
  FEATURE_TASK_CASES,
  FFT_TASK_CASES,
} from "./signal-task-investigations";
import { PRUNING_KERNELS, PRUNING_RECALL } from "./optimization-examples";

const raw = { ...NUMERIC_INVESTIGATIONS, ...FLOW_INVESTIGATIONS };
const customOpenings = ["introduction-to-tensors", "tensor-shapes"];
afterEach(cleanup);

describe("reviewed investigation source context", () => {
  it("covers all 54 active shared paths without replacing the two custom opening contracts", () => {
    expect(Object.keys(INVESTIGATION_SOURCE_CONTEXTS).sort()).toEqual(
      Object.keys(raw)
        .filter((slug) => !customOpenings.includes(slug))
        .sort(),
    );
    const ids = new Set<string>();
    for (const [slug, spec] of Object.entries(LESSON_INVESTIGATIONS)) {
      if (customOpenings.includes(slug)) {
        expect(spec).toBe(raw[slug]);
        expect(spec.source).toBeUndefined();
        continue;
      }
      const context = spec.source!;
      expect(context, slug).toBeDefined();
      expect(ids.has(context.id), slug).toBe(false);
      ids.add(context.id);
      for (const field of [
        context.id,
        context.label,
        context.scope,
        context.ordering,
        context.units,
      ])
        expect(field.trim().length, slug).toBeGreaterThan(0);
      expect(context.caseScopes).toEqual(
        Object.fromEntries(
          spec.cases.map((selected) => [selected.id, selected.description]),
        ),
      );
      // Enrichment must preserve authored values, callbacks and control limits.
      expect(spec.cases).toBe(raw[slug]!.cases);
      expect(spec.controls).toBe(raw[slug]!.controls);
      expect(spec.evaluate).toBe(raw[slug]!.evaluate);
      expect(raw[slug]!.source).toBeUndefined();
    }
    expect(ids.size).toBe(54);
  });

  it("preserves an explicitly authored source and leaves unknown legacy entries usable", () => {
    const supplied = LESSON_INVESTIGATIONS["tensor-operations"]!;
    const legacy = NUMERIC_INVESTIGATIONS["first-neuron"]!;
    const enriched = withInvestigationSourceContexts({
      "tensor-operations": supplied,
      unregistered: legacy,
    });
    expect(enriched["tensor-operations"]).toBe(supplied);
    expect(enriched.unregistered).toBe(legacy);
    expect(
      selectedInvestigationSource(supplied.source!, "unregistered").scope,
    ).toBe(supplied.source!.scope);
  });

  it("keeps declared rates, feature meaning and labeled support tied to the actual reviewed inputs", () => {
    expect(FEATURE_TASK_CASES.standard.rate).toBe(256);
    expect(FEATURE_TASK_CASES.changed.rate).toBe(128);
    const features = LESSON_INVESTIGATIONS["fft-as-features"]!;
    expect(
      selectedInvestigationSource(features.source!, "changed").scope,
    ).toContain(`${FEATURE_TASK_CASES.changed.rate} Hz`);
    expect(features.source!.ordering).toContain(
      "Peak absolute amplitude, strict zero-crossing count",
    );
    const fft = LESSON_INVESTIGATIONS["fourier-transform"]!;
    expect(selectedInvestigationSource(fft.source!, "longer").scope).toContain(
      `${FFT_TASK_CASES.longer.samples.length} supplied samples at ${FFT_TASK_CASES.longer.rate} Hz`,
    );
    const pruning = LESSON_INVESTIGATIONS.pruning!;
    expect(PRUNING_KERNELS.flat()).toHaveLength(192);
    expect(pruning.source!.scope).toContain("192 kernel values");
    expect(pruning.source!.scope).toContain(
      "40 generated evaluation rows per class",
    );
    expect(PRUNING_RECALL[0]![4]! * 40).toBe(39);
    expect(pruning.source!.ordering).toContain(
      "pulsar, quasar, noise, interference, anomaly",
    );
  });
});

describe("source context beside current data", () => {
  it("keeps a legacy activity usable without inventing provenance", () => {
    render(
      <LessonInvestigation
        spec={NUMERIC_INVESTIGATIONS["first-neuron"]!}
        lessonSlug="legacy"
      />,
    );
    expect(screen.queryByRole("region", { name: "Source context" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Run 1 complete");
  });

  it("changes the fictional selection with the case while retaining the earlier run's own inputs", () => {
    const spec = LESSON_INVESTIGATIONS["tensor-operations"]!;
    render(<LessonInvestigation spec={spec} lessonSlug="tensor-operations" />);
    const context = screen.getByRole("region", { name: "Source context" });
    expect(context).toHaveAttribute(
      "data-source-id",
      "opening-recording/paired-moments",
    );
    expect(context).toHaveAttribute("data-source-kind", "fictional-recording");
    expect(context).toHaveTextContent("sensor A before sensor B");
    expect(context).toHaveTextContent("no physical unit");
    expect(context).toHaveTextContent(spec.cases[0]!.description);
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    fireEvent.change(screen.getByLabelText("Choose an example"), {
      target: { value: "changed" },
    });
    expect(context).toHaveTextContent(spec.cases[1]!.description);
    expect(context).not.toHaveTextContent(spec.cases[0]!.description);
    const earlier = screen.getByRole("region", {
      name: "Last run (inputs changed)",
    });
    expect(earlier).toHaveTextContent(spec.cases[0]!.label);
    expect(earlier).not.toHaveTextContent(spec.cases[1]!.label);
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("keeps its original inputs");
  });

  it("identifies a controlled reply while keeping its source, parsing checks and field selection distinct", () => {
    render(
      <LessonInvestigation
        spec={LESSON_INVESTIGATIONS["llms-for-science"]!}
        lessonSlug="llms-for-science"
      />,
    );
    const context = screen.getByRole("region", { name: "Source context" });
    expect(context).toHaveAttribute(
      "data-source-kind",
      "controlled-simulation",
    );
    expect(context).toHaveTextContent("Supplied report-client replies");
    expect(context).toHaveTextContent("not calibrated probabilities");
    expect(context).toHaveTextContent("Call once, locate JSON, parse");
    fireEvent.change(screen.getByLabelText("Supplied reply"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Rejected reply");
    const selected = screen.getByRole("list", {
      name: "Selected required field",
    });
    expect(within(selected).getByText("Type: string")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Choose an example"), {
      target: { value: "wrapped" },
    });
    expect(context).toHaveTextContent("text with no other braces");
  });
});
