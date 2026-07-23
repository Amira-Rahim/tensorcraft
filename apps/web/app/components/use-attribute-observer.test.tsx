import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { useAttributeObserver } from "./use-attribute-observer";

function Probe({ attrs, onChange }: { attrs: string[]; onChange: () => void }) {
  useAttributeObserver(attrs, onChange);
  return null;
}

afterEach(() => {
  delete document.documentElement.dataset.scheme;
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
});

describe("useAttributeObserver", () => {
  it("calls onChange when a watched attribute mutates", async () => {
    const onChange = vi.fn();
    render(<Probe attrs={["data-scheme"]} onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();

    // MutationObserver callbacks fire as a microtask — plain mutation +
    // waitFor (not a fixed-tick act() wrap), same rationale as
    // packages/ui/src/use-scheme.test.tsx and scene-canvas.test.tsx.
    document.documentElement.dataset.scheme = "light";

    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it("ignores mutations to attributes outside its own filter", async () => {
    const onChange = vi.fn();
    render(<Probe attrs={["data-scheme"]} onChange={onChange} />);

    document.documentElement.dataset.theme = "neon-protocol";
    // Flush past the observer's microtask window without asserting on a
    // fixed tick count: give it a macrotask, which always runs after any
    // pending microtasks, then assert the unrelated mutation never fired.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onChange).not.toHaveBeenCalled();

    // Prove the subscription is still alive (not merely never wired up) by
    // mutating the attribute it DOES watch.
    document.documentElement.dataset.scheme = "light";
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  });

  it("notifies each consumer only for the attributes it asked for", async () => {
    const themeChange = vi.fn();
    const schemeChange = vi.fn();
    render(
      <>
        <Probe attrs={["data-theme"]} onChange={themeChange} />
        <Probe attrs={["data-scheme"]} onChange={schemeChange} />
      </>,
    );

    document.documentElement.dataset.scheme = "light";
    await waitFor(() => expect(schemeChange).toHaveBeenCalledTimes(1));
    expect(themeChange).not.toHaveBeenCalled();

    document.documentElement.dataset.theme = "neon-protocol";
    await waitFor(() => expect(themeChange).toHaveBeenCalledTimes(1));
    expect(schemeChange).toHaveBeenCalledTimes(1);
  });

  it("shares a single MutationObserver across multiple simultaneous consumers", () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
    const a = render(
      <Probe attrs={["data-theme", "data-scheme"]} onChange={vi.fn()} />,
    );
    const b = render(<Probe attrs={["data-scheme"]} onChange={vi.fn()} />);

    expect(observeSpy).toHaveBeenCalledTimes(1);

    a.unmount();
    b.unmount();
  });

  it("does not disconnect the shared observer while other consumers remain mounted", () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
    const a = render(<Probe attrs={["data-scheme"]} onChange={vi.fn()} />);
    const b = render(<Probe attrs={["data-theme"]} onChange={vi.fn()} />);

    a.unmount();
    expect(disconnectSpy).not.toHaveBeenCalled();

    b.unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it("disconnects the shared observer once the last consumer unmounts", () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
    const { unmount } = render(
      <Probe attrs={["data-scheme"]} onChange={vi.fn()} />,
    );
    expect(disconnectSpy).not.toHaveBeenCalled();
    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
