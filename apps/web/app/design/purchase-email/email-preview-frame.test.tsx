import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmailPreviewFrame } from "./email-preview-frame";

describe("EmailPreviewFrame", () => {
  let emailDocument: Document;
  let bodyHeight: number;
  let resize: ResizeObserverCallback | undefined;
  const disconnect = vi.fn();

  beforeEach(() => {
    emailDocument = document.implementation.createHTMLDocument("Receipt");
    bodyHeight = 1043;
    resize = undefined;
    disconnect.mockClear();
    vi.spyOn(
      HTMLIFrameElement.prototype,
      "contentDocument",
      "get",
    ).mockReturnValue(emailDocument);
    vi.spyOn(emailDocument.body, "getBoundingClientRect").mockImplementation(
      () => ({ height: bodyHeight }) as DOMRect,
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fits an email that loaded before hydration and shrinks after a content resize", () => {
    emailDocument.body.innerHTML = "<table><tr><td>Receipt</td></tr></table>";
    render(<EmailPreviewFrame html="<p>Receipt</p>" width={640} />);
    const frame = screen.getByTitle("Purchase receipt email at 640px");
    expect(frame).toHaveStyle({ height: "1043px" });

    bodyHeight = 750;
    act(() => resize?.([], {} as ResizeObserver));
    expect(frame).toHaveStyle({ height: "750px" });

    cleanup();
    expect(disconnect).toHaveBeenCalled();
  });

  it("fits an email that finishes loading after the component mounts", () => {
    render(<EmailPreviewFrame html="<p>Receipt</p>" width={320} />);
    const frame = screen.getByTitle("Purchase receipt email at 320px");

    emailDocument.body.innerHTML = "<p>Receipt</p>";
    bodyHeight = 1091;
    fireEvent.load(frame);
    expect(frame).toHaveStyle({ height: "1091px" });
  });
});
