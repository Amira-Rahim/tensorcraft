import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen } from "@testing-library/react";
import * as tf from "@tensorflow/tfjs";
import ReshapeTransposeGuide, { metadata } from "./page";
import { ReadingComparison } from "./reading-comparison";
import { GUIDE_EXAMPLE } from "./example";
import { capture } from "@/lib/posthog";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";
import {
  WORKED_PACKET,
  transformPacket,
} from "../../components/mdx/channel-layout-data";

vi.mock("@/lib/posthog", () => ({ capture: vi.fn() }));

beforeEach(() => {
  vi.mocked(capture).mockClear();
});

function clickWithoutNavigation(element: HTMLElement) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  event.preventDefault();
  fireEvent(element, event);
}

describe("public reshape and transpose guide", () => {
  it("ships the answer, exact outputs, provenance and lesson link in initial HTML", () => {
    const html = renderToStaticMarkup(<ReshapeTransposeGuide />);
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.body.textContent).toContain("flattened values in order");
    expect(document.body.textContent).toContain("fictional");
    const tables = [...document.querySelectorAll("table")];
    expect(tables).toHaveLength(3);
    const values = (table: HTMLTableElement) =>
      [...table.querySelectorAll("tbody tr")].map((row) =>
        [...row.querySelectorAll("td")].map((cell) => Number(cell.textContent)),
      );
    expect(values(tables[0])).toEqual(WORKED_PACKET);
    expect(values(tables[1])).toEqual(
      transformPacket(WORKED_PACKET, "reshape"),
    );
    expect(values(tables[2])).toEqual(
      transformPacket(WORKED_PACKET, "transpose"),
    );
    expect(
      document.querySelector(
        'a[href="/worlds/deep-orbit/foundations/tensor-shapes?start=experiment"]',
      ),
    ).not.toBeNull();
    const json = JSON.parse(
      document.querySelector('script[type="application/ld+json"]')!
        .textContent!,
    );
    expect(document.querySelector("time")?.getAttribute("datetime")).toBe(
      json[0].dateModified,
    );
    expect(json[0].mainEntityOfPage).toBe(metadata.alternates?.canonical);
    expect(json[0].author).toEqual({
      "@id": "https://tensorcraft.app/#organization",
    });
    expect(json[0].publisher).toEqual(json[0].author);
    expect(document.querySelector('a[rel="author"]')?.textContent).toBe(
      "Tensorcraft",
    );
    expect(
      document.querySelector('a[rel="author"]')?.getAttribute("href"),
    ).toBe("/about");
  });

  it("tracks a reading's original position instead of matching duplicate numeric values", () => {
    const { container } = render(<ReadingComparison />);
    fireEvent.click(
      screen.getByRole("button", { name: "Sensor D, local moment 1: 8" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Reshape puts it at row 2, column 1",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "sensor row D, moment column 1",
    );
    const tables = [...container.querySelectorAll("table")];
    for (const table of tables.slice(1)) {
      expect(table.querySelectorAll(".bg-primary")).toHaveLength(1);
    }
  });

  it("tracks both guide lesson links with their canonical destination and placement", () => {
    render(<ReshapeTransposeGuide />);
    for (const [label, placement] of [
      ["interactive lesson", "activity"],
      ["tensor-shapes lesson", "source"],
    ]) {
      clickWithoutNavigation(screen.getByRole("link", { name: label }));
      expect(capture).toHaveBeenLastCalledWith("free_lesson_cta_clicked", {
        source: "guide",
        guideSlug: "tensorflow-js-reshape-vs-transpose",
        targetLesson:
          "https://tensorcraft.app/worlds/deep-orbit/foundations/tensor-shapes",
        placement,
      });
    }
    expect(capture).toHaveBeenCalledTimes(2);
  });

  it("does not count course and pricing links as free lesson handoffs", () => {
    render(<ReshapeTransposeGuide />);
    clickWithoutNavigation(
      screen.getByRole("link", { name: "Deep Orbit course overview" }),
    );
    clickWithoutNavigation(
      screen.getByRole("link", { name: "course pricing" }),
    );
    expect(capture).not.toHaveBeenCalled();
  });

  it("preserves the original event shape for existing CTA callers", () => {
    render(
      <FreeLessonCtaTracker source="landing_intro">
        <a href="/worlds/deep-orbit/foundations/introduction-to-tensors">
          Start lesson
        </a>
      </FreeLessonCtaTracker>,
    );
    clickWithoutNavigation(screen.getByRole("link", { name: "Start lesson" }));
    expect(capture).toHaveBeenCalledWith("free_lesson_cta_clicked", {
      source: "landing_intro",
    });
  });

  it("runs the published snippet against TFJS 4.22.0 without retaining tensors", async () => {
    await tf.setBackend("cpu");
    await tf.ready();
    expect(tf.version.tfjs).toBe("4.22.0");
    const before = tf.memory().numTensors;
    const body = GUIDE_EXAMPLE.replace(
      'import * as tf from "@tensorflow/tfjs";',
      "",
    ).replace("console.log(comparison);", "return comparison;");
    const AsyncFunction = Object.getPrototypeOf(
      async function () {},
    ).constructor;
    const result = await new AsyncFunction("tf", body)(tf);
    expect(result.reshaped).toEqual([
      [2, 20, 5],
      [8, 3, 18],
      [7, 8, 4],
      [16, 6, 9],
    ]);
    expect(result.transposed).toEqual([
      [2, 3, 4],
      [20, 18, 16],
      [5, 7, 6],
      [8, 8, 9],
    ]);
    expect(tf.memory().numTensors).toBe(before);
  });
});
