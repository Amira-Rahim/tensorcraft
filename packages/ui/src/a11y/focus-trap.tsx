"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
  type KeyboardEvent,
} from "react";

/**
 * Focusable-element selector (APG recommended set). Excludes
 * elements with an explicit negative tabindex.
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface FocusTrapProps {
  /**
   * When true, focus is trapped inside the container.
   * When toggled from false to true, focus moves to `initialFocus`
   * (if provided and contained) or the first focusable descendant.
   * When toggled from true to false, focus is restored to the
   * previously focused element iff `restoreFocusOnDeactivate` is true.
   */
  active: boolean;
  /**
   * Content whose focusable descendants are trapped.
   */
  children: ReactNode;
  /**
   * Restore focus to the element that had focus before activation.
   * @default true
   */
  restoreFocusOnDeactivate?: boolean;
  /**
   * Optional element to focus when the trap activates. If omitted
   * or not contained in the trap, the first focusable descendant is
   * focused instead.
   */
  initialFocus?: RefObject<HTMLElement | null>;
  /**
   * Called when Escape is pressed inside the trap. Caller is
   * responsible for calling setActive(false) / closing the dialog.
   */
  onEscape?: () => void;
}

/**
 * FocusTrap - traps Tab / Shift+Tab focus cycling within a container
 * while `active` is true. Used for dialogs, popovers, and bottom
 * sheets to satisfy WCAG 2.4.3 (Focus Order) and APG dialog guidance.
 */
export function FocusTrap({
  active,
  children,
  restoreFocusOnDeactivate = true,
  initialFocus,
  onEscape,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // On activate: record previous focus and move focus into the trap.
  // On deactivate: restore focus if requested.
  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Defer to next tick so any portal/DOM mount work has settled.
    const frame = requestAnimationFrame(() => {
      const initial = initialFocus?.current;
      if (initial && container.contains(initial)) {
        initial.focus();
        return;
      }
      const firstFocusable =
        container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        // Fallback: focus the container itself so SR keeps context.
        container.setAttribute("tabindex", "-1");
        container.focus();
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      if (restoreFocusOnDeactivate) {
        const prev = previouslyFocusedRef.current;
        if (prev && document.contains(prev)) {
          prev.focus();
        }
      }
    };
  }, [active, initialFocus, restoreFocusOnDeactivate]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!active) return;

    if (event.key === "Escape") {
      if (onEscape) {
        event.stopPropagation();
        onEscape();
      }
      return;
    }

    if (event.key !== "Tab") return;

    const container = containerRef.current;
    if (!container) return;

    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => !el.hasAttribute("data-focus-trap-ignore"));

    if (focusables.length === 0) {
      // Nothing focusable, prevent tab from leaving the trap.
      event.preventDefault();
      return;
    }

    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const activeEl = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      // Shift+Tab on the first focusable wraps to last.
      if (activeEl === first || !container.contains(activeEl)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab on the last focusable wraps to first.
      if (activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      data-focus-trap={active ? "active" : "inactive"}
    >
      {children}
    </div>
  );
}
