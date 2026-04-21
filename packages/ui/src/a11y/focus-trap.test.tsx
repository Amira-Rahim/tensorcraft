import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { useRef, useState } from "react";
import { FocusTrap } from "./focus-trap";

function flushRaf() {
  // requestAnimationFrame runs on next tick in jsdom; flush micro + raf.
  return act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  });
}

describe("FocusTrap", () => {
  it("focuses the first focusable descendant on activate", async () => {
    const { getByTestId } = render(
      <FocusTrap active={true}>
        <button data-testid="first">First</button>
        <button data-testid="second">Second</button>
      </FocusTrap>,
    );
    await flushRaf();
    expect(document.activeElement).toBe(getByTestId("first"));
  });

  it("focuses initialFocus ref when provided", async () => {
    function Wrapper() {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <FocusTrap active={true} initialFocus={ref}>
          <button data-testid="first">First</button>
          <button ref={ref} data-testid="target">
            Target
          </button>
        </FocusTrap>
      );
    }
    const { getByTestId } = render(<Wrapper />);
    await flushRaf();
    expect(document.activeElement).toBe(getByTestId("target"));
  });

  it("wraps Tab from last focusable back to first", async () => {
    const { getByTestId } = render(
      <FocusTrap active={true}>
        <button data-testid="first">First</button>
        <button data-testid="last">Last</button>
      </FocusTrap>,
    );
    await flushRaf();
    const last = getByTestId("last");
    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(getByTestId("first"));
  });

  it("wraps Shift+Tab from first focusable to last", async () => {
    const { getByTestId } = render(
      <FocusTrap active={true}>
        <button data-testid="first">First</button>
        <button data-testid="last">Last</button>
      </FocusTrap>,
    );
    await flushRaf();
    const first = getByTestId("first");
    first.focus();
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(getByTestId("last"));
  });

  it("calls onEscape when Escape is pressed", async () => {
    const onEscape = vi.fn();
    const { getByTestId } = render(
      <FocusTrap active={true} onEscape={onEscape}>
        <button data-testid="first">First</button>
      </FocusTrap>,
    );
    await flushRaf();
    fireEvent.keyDown(getByTestId("first"), { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("restores focus to previously-focused element on deactivate", async () => {
    function Wrapper() {
      const [active, setActive] = useState(false);
      return (
        <>
          <button data-testid="opener" onClick={() => setActive(true)}>
            Open
          </button>
          {active && (
            <FocusTrap active={true} onEscape={() => setActive(false)}>
              <button data-testid="close" onClick={() => setActive(false)}>
                Close
              </button>
            </FocusTrap>
          )}
        </>
      );
    }
    const { getByTestId } = render(<Wrapper />);
    const opener = getByTestId("opener");
    opener.focus();
    expect(document.activeElement).toBe(opener);

    fireEvent.click(opener);
    await flushRaf();
    expect(document.activeElement).toBe(getByTestId("close"));

    fireEvent.click(getByTestId("close"));
    await flushRaf();
    expect(document.activeElement).toBe(opener);
  });

  it("does NOT restore focus when restoreFocusOnDeactivate is false", async () => {
    function Wrapper() {
      const [active, setActive] = useState(true);
      return (
        <>
          <button data-testid="outside">Outside</button>
          {active && (
            <FocusTrap
              active={true}
              restoreFocusOnDeactivate={false}
              onEscape={() => setActive(false)}
            >
              <button data-testid="close" onClick={() => setActive(false)}>
                Close
              </button>
            </FocusTrap>
          )}
        </>
      );
    }
    const { getByTestId } = render(<Wrapper />);
    const outside = getByTestId("outside");
    outside.focus();
    await flushRaf();
    // Trap will pull focus to "close"
    expect(document.activeElement).toBe(getByTestId("close"));

    fireEvent.click(getByTestId("close"));
    await flushRaf();
    // Should NOT restore to outside (still focused on body after unmount)
    expect(document.activeElement).not.toBe(outside);
  });

  it("ignores tab handling when inactive", () => {
    const { getByTestId } = render(
      <FocusTrap active={false}>
        <button data-testid="first">First</button>
        <button data-testid="last">Last</button>
      </FocusTrap>,
    );
    const last = getByTestId("last");
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    // No wrap; activeElement should be unchanged (still last, jsdom
    // won't move focus without real Tab cycle).
    expect(document.activeElement).toBe(last);
  });
});
