import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProjectGuide, { metadata } from "./page";
import { ThresholdExample } from "./threshold-example";
import preview from "@/public/assignments/room-project-preview.json";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const routeDir = path.dirname(fileURLToPath(import.meta.url));

describe("public project evidence", () => {
  it("uses the actual downloadable row and identified maintainer source", () => {
    const data = JSON.parse(
      readFileSync(
        path.resolve(
          routeDir,
          "../../../public/assignments/room-occupancy-v1/data.json",
        ),
        "utf8",
      ),
    );
    expect(data.rows).toHaveLength(2056);
    expect(
      data.rows.find((row: { id: string }) => row.id === preview.row.id),
    ).toEqual(preview.row);
    const fixture = readFileSync(
      path.resolve(
        routeDir,
        "../../../../../scripts/fixtures/room-project/train.mjs",
      ),
    );
    expect(createHash("sha256").update(fixture).digest("hex")).toBe(
      preview.fixtureSourceSha256,
    );
    expect(Number(preview.prediction.score >= preview.threshold)).toBe(
      preview.prediction.model,
    );
    expect(Number(preview.row.light >= preview.baseline.threshold)).toBe(
      preview.prediction.baseline,
    );
    expect(preview.prediction.model).not.toBe(preview.row.occupied);
    expect(preview.prediction.baseline).not.toBe(preview.row.occupied);
  });
  it("serves the recorded failure, source, starter and limits in initial HTML", () => {
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<ProjectGuide />),
      "text/html",
    );
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.body.textContent).toContain("maintainer integration fixture");
    expect(doc.body.textContent).toContain(preview.prediction.score.toFixed(3));
    expect(
      doc.querySelector('a[href="/assignments/room-project-preview.json"]'),
    ).not.toBeNull();
    expect(
      doc.querySelector(
        'a[href="/assignments/room-occupancy-v1/DATA-LICENSE.md"]',
      ),
    ).not.toBeNull();
    const schema = JSON.parse(
      doc.querySelector('script[type="application/ld+json"]')!.textContent!,
    )[0];
    expect(schema.mainEntityOfPage).toBe(metadata.alternates?.canonical);
    expect(schema.dateModified).toBe(doc.querySelector("time")!.dateTime);
  });
  it("applies a threshold to the supplied score without inventing a new model result", () => {
    render(<ThresholdExample />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "disagrees with the recorded label",
    );
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0.70" } });
    expect(screen.getByRole("status")).toHaveTextContent(
      "matches the recorded label on this one row",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      `score stays ${preview.prediction.score.toFixed(3)}`,
    );
    expect(
      screen.getByText(/does not establish a useful threshold/),
    ).toBeInTheDocument();
  });
});
