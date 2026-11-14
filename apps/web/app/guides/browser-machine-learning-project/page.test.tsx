import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProjectGuide, { metadata } from "./page";
import { ThresholdExample } from "./threshold-example";
import preview from "@/public/assignments/room-project-preview.json";
import reference from "@/public/assignments/room-training-reference-v1.json";
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
    expect(
      doc.querySelector('a[href="/evidence/room-project-v1.zip"]'),
    ).not.toBeNull();
    for (const path of [
      "scripts/check-room-project.mjs",
      "scripts/fixtures/room-project/train.mjs",
      "scripts/build-room-project-preview.mjs",
      "manifest.json",
      "README.md",
    ]) {
      expect(
        doc.querySelector(`a[href="/evidence/room-project-v1/${path}"]`),
      ).not.toBeNull();
    }
    expect(
      doc.querySelector('a[href*="github.com/Amira-Rahim/tensorcraft"]'),
    ).toBeNull();
    expect(preview.reproduce).toContain("/evidence/room-project-v1.zip");
  });
  it("explains runnable training in initial HTML without inventing a completed run", () => {
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<ProjectGuide />),
      "text/html",
    );
    expect(doc.body.textContent).toContain(
      "Training and validation in your browser",
    );
    expect(doc.body.textContent).toContain("First 1,200 readings");
    expect(doc.body.textContent).toContain("Next 400 readings");
    expect(doc.body.textContent).toContain("Last 456 readings");
    expect(doc.body.textContent).toContain("maintainer-supplied example");
    expect(
      doc.querySelector('a[href="/demos/room-training.mjs"]'),
    ).not.toBeNull();
    expect(
      doc.querySelector('a[href="/assignments/room-occupancy-v1/data.json"]'),
    ).not.toBeNull();
    expect(doc.body.textContent).not.toContain("This browser run");
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

  it("exposes versioned supplied comparison evidence in initial HTML while keeping browser results separate", () => {
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<ProjectGuide />),
      "text/html",
    );
    const region = doc.querySelector(
      '[aria-label="Supplied reference validation comparison"]',
    )!;
    expect(region.textContent).toContain(
      "Supplied reference on 400 validation readings",
    );
    expect(region.textContent).toContain("94.75%");
    expect(region.textContent).toContain("91%");
    expect(region.textContent).toContain("Illustrative error cost");
    expect(
      doc.querySelector(
        'a[href="/assignments/room-training-reference-v1.json"]',
      ),
    ).not.toBeNull();
    expect(
      doc.querySelector(`time[datetime="${reference.verifiedOn}"]`),
    ).not.toBeNull();
    expect(doc.body.textContent).toContain(
      "These are supplied reference results",
    );
    expect(doc.body.textContent).toContain(
      "Your browser run appears in its own section below",
    );
    expect(doc.body.textContent).not.toContain("This browser run");
  });
});
