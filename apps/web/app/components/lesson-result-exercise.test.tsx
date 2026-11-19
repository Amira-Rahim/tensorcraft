import { useEffect, useState, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ExerciseAttemptState,
  ExerciseProps,
  ExerciseResultContext,
  ExerciseRunSnapshot,
} from "@tensorcraft/ui";
import { LessonResultExercise } from "./lesson-result-exercise";
import {
  sensorArtifacts,
  gradientArtifacts,
} from "./__fixtures__/lesson-results";

const harness = vi.hoisted(() => ({
  context: null as ExerciseResultContext | null,
  returned: undefined as ReactNode,
  mounted: [] as number[],
  unmounted: [] as number[],
  nextInstance: 0,
}));

vi.mock("@tensorcraft/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tensorcraft/ui")>();
  return {
    ...actual,
    Exercise: (props: ExerciseProps) => {
      const [instance] = useState(() => ++harness.nextInstance);
      useEffect(() => {
        harness.mounted.push(instance);
        return () => {
          harness.unmounted.push(instance);
        };
      }, [instance]);
      if (!harness.context) throw Error("Missing mocked Exercise context");
      const result = props.renderResult?.(harness.context);
      harness.returned = result;
      return (
        <section
          data-testid="exercise-host"
          data-instance={instance}
          data-owner={props.draftOwner ?? "guest"}
        >
          {result === undefined ? <p>Ordinary result output</p> : result}
        </section>
      );
    },
  };
});

function snapshot(
  overrides: Partial<ExerciseRunSnapshot> = {},
): ExerciseRunSnapshot {
  return {
    exerciseSlug: "reshape-tensor",
    submittedCode: "submitted code",
    starterCode: "starter",
    testCode: "checks",
    capturedAt: "2026-11-10T10:00:00.000Z",
    artifacts: sensorArtifacts(),
    checks: [{ name: "layout", passed: true }],
    errored: false,
    runtimeVersion: "4.22.0",
    backend: "cpu",
    assistance: {
      hintsRevealed: [],
      hintHistory: "session-only",
      solutionViewed: false,
    },
    ...overrides,
  };
}

function context(
  attempt: ExerciseAttemptState,
  currentCode = "submitted code",
) {
  harness.context = {
    attempt,
    currentCode,
    editorId: "editor",
    resultId: "result",
  };
}

function settled(
  overrides: Partial<ExerciseRunSnapshot> = {},
  token = "run-1",
  currentCode?: string,
) {
  context(
    { status: "settled", runToken: token, snapshot: snapshot(overrides) },
    currentCode,
  );
}

beforeEach(() => {
  harness.context = null;
  harness.returned = undefined;
  harness.mounted = [];
  harness.unmounted = [];
  harness.nextInstance = 0;
});

describe("lesson result Exercise integration", () => {
  it.each<ExerciseAttemptState>([
    { status: "idle" },
    { status: "running", runToken: "running-1" },
  ])(
    "returns undefined for $status so ordinary output stays available",
    (attempt) => {
      context(attempt);
      render(<LessonResultExercise slug="reshape-tensor" />);
      expect(harness.returned).toBeUndefined();
      expect(screen.getByText("Ordinary result output")).toBeVisible();
      expect(
        screen.queryByRole("region", {
          name: "Explanation of your captured result",
        }),
      ).not.toBeInTheDocument();
    },
  );

  it("uses ordinary output for unsupported, unknown, and differently scoped captures", () => {
    settled({
      artifacts: [
        {
          kind: "text",
          title: "Other format",
          text: "Keep this ordinary output",
        },
      ],
    });
    const { rerender } = render(<LessonResultExercise slug="reshape-tensor" />);
    expect(harness.returned).toBeUndefined();
    settled({
      exerciseSlug: "create-a-tensor",
      artifacts: sensorArtifacts("create-a-tensor"),
    });
    rerender(<LessonResultExercise slug="reshape-tensor" />);
    expect(harness.returned).toBeUndefined();
    settled();
    rerender(<LessonResultExercise slug="unsupported" />);
    expect(harness.returned).toBeUndefined();
    expect(screen.getByText("Ordinary result output")).toBeVisible();
  });

  it("explains each exact supported slug without replacing captured values", () => {
    const artifacts = sensorArtifacts("create-a-tensor");
    const chart = artifacts[0]!;
    if (chart.kind !== "series") throw Error("Expected chart");
    chart.series[0]!.values[0] = 902;
    settled({ exerciseSlug: "create-a-tensor", artifacts });
    const { rerender } = render(
      <LessonResultExercise slug="create-a-tensor" />,
    );
    expect(
      screen.getByText(/The supplied chart code groups the readings/),
    ).toBeVisible();
    expect(
      screen.getByText("Value in supplied recording").nextElementSibling,
    ).toHaveTextContent("2");
    expect(
      screen.getByText("Value in captured chart").nextElementSibling,
    ).toHaveTextContent("902");
    expect(
      screen.getByText(/It differs from the supplied reading/),
    ).toBeVisible();
    settled();
    rerender(<LessonResultExercise slug="reshape-tensor" />);
    expect(screen.getByText(/one row of your bySensor result/)).toBeVisible();
    settled({ exerciseSlug: "backprop-chain", artifacts: gradientArtifacts() });
    rerender(<LessonResultExercise slug="backprop-chain" />);
    expect(
      screen.getByRole("heading", {
        name: "Two methods on the same supplied loss",
      }),
    ).toBeVisible();
  });

  it.each([
    { checks: [], errored: false },
    {
      checks: [{ name: "layout", passed: false, error: "Wrong layout" }],
      errored: false,
    },
    { checks: [{ name: "layout", passed: true }], errored: true },
  ])("keeps stale partial output visibly incomplete: %j", (overrides) => {
    settled(overrides, "partial-1");
    const { rerender } = render(<LessonResultExercise slug="reshape-tensor" />);
    expect(screen.getByText(/Some checks still need attention/)).toBeVisible();
    expect(
      screen.getByText("Value in captured chart").nextElementSibling,
    ).toHaveTextContent("2");
    settled(overrides, "partial-1", "edited code");
    rerender(<LessonResultExercise slug="reshape-tensor" />);
    expect(
      screen.getByText(/This explanation belongs to the submitted code/),
    ).toBeVisible();
    settled({}, "complete-2");
    rerender(<LessonResultExercise slug="reshape-tensor" />);
    expect(
      screen.queryByText(/This explanation belongs to the submitted code/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Some checks still need attention/),
    ).not.toBeInTheDocument();
  });

  it("retains inspection on edits, resets it for a new run, and removes it on reset", () => {
    settled();
    const { rerender } = render(<LessonResultExercise slug="reshape-tensor" />);
    const instance = screen.getByTestId("exercise-host").dataset.instance;
    fireEvent.change(screen.getByLabelText("Sensor"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Selected moment"), {
      target: { value: "1" },
    });
    settled({}, "run-1", "edited code");
    rerender(<LessonResultExercise slug="reshape-tensor" />);
    expect(screen.getByLabelText("Sensor")).toHaveValue("3");
    expect(screen.getByLabelText("Selected moment")).toHaveValue("1");
    expect(
      screen.getByText(/This explanation belongs to the submitted code/),
    ).toBeVisible();
    settled({}, "run-2");
    rerender(<LessonResultExercise slug="reshape-tensor" />);
    expect(screen.getByTestId("exercise-host")).toHaveAttribute(
      "data-instance",
      instance,
    );
    expect(screen.getByLabelText("Sensor")).toHaveValue("0");
    expect(screen.getByLabelText("Selected moment")).toHaveValue("0");
    context({ status: "running", runToken: "run-3" });
    rerender(<LessonResultExercise slug="reshape-tensor" />);
    expect(harness.returned).toBeUndefined();
    expect(screen.queryByLabelText("Sensor")).not.toBeInTheDocument();
    settled({}, "run-3");
    rerender(<LessonResultExercise slug="reshape-tensor" />);
    expect(screen.getByLabelText("Sensor")).toHaveValue("0");
    context({ status: "idle" });
    rerender(<LessonResultExercise slug="reshape-tensor" />);
    expect(harness.returned).toBeUndefined();
    expect(screen.queryByLabelText("Sensor")).not.toBeInTheDocument();
    expect(harness.mounted).toHaveLength(1);
  });

  it("remounts the Exercise boundary for owner or slug changes, retaining it otherwise", () => {
    settled();
    const { rerender } = render(
      <LessonResultExercise slug="reshape-tensor" draftOwner="account-a" />,
    );
    const first = screen.getByTestId("exercise-host").dataset.instance;
    fireEvent.change(screen.getByLabelText("Sensor"), {
      target: { value: "3" },
    });
    rerender(
      <LessonResultExercise slug="reshape-tensor" draftOwner="account-a" />,
    );
    expect(screen.getByTestId("exercise-host")).toHaveAttribute(
      "data-instance",
      first,
    );
    expect(screen.getByLabelText("Sensor")).toHaveValue("3");
    // The real Exercise supplies an idle scope when the draft owner changes.
    // This mock verifies the adapter also creates a new mounted boundary.
    context({ status: "idle" });
    rerender(
      <LessonResultExercise slug="reshape-tensor" draftOwner="account-b" />,
    );
    expect(screen.getByTestId("exercise-host")).not.toHaveAttribute(
      "data-instance",
      first,
    );
    expect(screen.queryByLabelText("Sensor")).not.toBeInTheDocument();
    settled();
    rerender(
      <LessonResultExercise slug="reshape-tensor" draftOwner="account-b" />,
    );
    expect(screen.getByLabelText("Sensor")).toHaveValue("0");
    settled({ exerciseSlug: "backprop-chain", artifacts: gradientArtifacts() });
    rerender(
      <LessonResultExercise slug="backprop-chain" draftOwner="account-b" />,
    );
    expect(harness.mounted).toHaveLength(3);
    expect(harness.unmounted).toHaveLength(2);
  });
});
