import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CurriculumScene } from "../curriculum-scene";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  disconnect() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  intersect(isIntersecting: boolean) {
    act(() => {
      this.callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    });
  }
}

/** The wrapper's own observer watches the section div; SceneCanvas's
    watches its canvas. Filter by element type to address the wrapper's. */
const wrapperIo = () =>
  MockIntersectionObserver.instances.find((i) =>
    i.observed.some((el) => el instanceof HTMLDivElement),
  )!;

const mockMatchMedia = (reducedMatches: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion")
        ? reducedMatches
        : false,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
};

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  mockMatchMedia(false);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderScene = () =>
  render(
    <CurriculumScene primary="#6BAA8A" primaryLight="#4A8064">
      <p data-testid="rows">rows</p>
    </CurriculumScene>,
  );

const bootAttr = () =>
  screen.getByTestId("curriculum-scene").getAttribute("data-boot");

const modeAttr = () =>
  screen.getByTestId("curriculum-scene").getAttribute("data-mode");

describe("CurriculumScene", () => {
  it("does not arm the boot or write the flag before first intersection", () => {
    renderScene();
    expect(bootAttr()).toBeNull();
    // Flag unset and motion allowed: mode resolves to boot at mount even
    // though data-boot stays absent until the section is entered.
    expect(modeAttr()).toBe("boot");
    expect(window.localStorage.getItem("tc_curriculum_boot_seen")).toBeNull();
  });

  it("arms [data-boot] and writes the once-ever flag at first intersection", () => {
    renderScene();
    wrapperIo().intersect(true);
    expect(bootAttr()).toBe("");
    expect(modeAttr()).toBe("boot");
    expect(window.localStorage.getItem("tc_curriculum_boot_seen")).toBe("1");
  });

  it("ignores a non-intersecting entry", () => {
    renderScene();
    wrapperIo().intersect(false);
    expect(bootAttr()).toBeNull();
    expect(window.localStorage.getItem("tc_curriculum_boot_seen")).toBeNull();
  });

  it("mounts settled when the flag is already set", () => {
    window.localStorage.setItem("tc_curriculum_boot_seen", "1");
    renderScene();
    MockIntersectionObserver.instances.forEach((i) => i.intersect(true));
    expect(bootAttr()).toBeNull();
    expect(modeAttr()).toBe("settled");
  });

  it("mounts settled under reduced motion", () => {
    mockMatchMedia(true);
    renderScene();
    MockIntersectionObserver.instances.forEach((i) => i.intersect(true));
    expect(bootAttr()).toBeNull();
    expect(modeAttr()).toBe("settled");
  });

  it("treats unreadable storage as seen", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    renderScene();
    MockIntersectionObserver.instances.forEach((i) => i.intersect(true));
    expect(bootAttr()).toBeNull();
    expect(modeAttr()).toBe("settled");
    spy.mockRestore();
  });

  it("arms immediately when IntersectionObserver is unavailable", () => {
    // SceneCanvas guards typeof IntersectionObserver !== "undefined" too
    // (scene-canvas.tsx), so rendering without one is safe.
    vi.stubGlobal("IntersectionObserver", undefined);
    renderScene();
    expect(bootAttr()).toBe("");
    expect(window.localStorage.getItem("tc_curriculum_boot_seen")).toBe("1");
  });

  it("renders children in every mode", () => {
    renderScene();
    expect(screen.getByTestId("rows")).toBeTruthy();
  });
});
