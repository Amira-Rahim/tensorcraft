"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Shared, refcounted `MutationObserver` for `document.documentElement`
// attribute changes (`data-world`, `data-scheme`, ...). Mirrors the pattern
// in packages/ui/src/use-scheme.ts, generalized: instead of one hook hard-
// wired to a single attribute, any number of consumers can each watch their
// own subset of attributes, but they all share ONE observer instance.
//
// Added during the light-mode rollout (docs/superpowers/plans/2026-07-22-
// light-mode.md, Task 11) after Task 8's quality review flagged that the
// codebase was accumulating a 4th/5th bespoke `MutationObserver` doing this
// exact thing (use-scheme.ts, SceneCanvas, ticker.tsx, ambient-background.tsx)
// - one shared observer + per-consumer attribute filters replaces all the
// app-level (apps/web) copies going forward. `use-scheme.ts` stays as-is: it
// lives in packages/ui, which can't import an apps/web hook.
// ---------------------------------------------------------------------------

interface Consumer {
  attrs: Set<string>;
  onChange: () => void;
}

let consumers: Consumer[] = [];
let observer: MutationObserver | null = null;

function handleMutations(mutations: MutationRecord[]) {
  const changed = new Set(
    mutations
      .map((m) => m.attributeName)
      .filter((name): name is string => name !== null),
  );
  for (const consumer of consumers) {
    for (const name of changed) {
      if (consumer.attrs.has(name)) {
        consumer.onChange();
        break;
      }
    }
  }
}

// The attributeFilter currently observed, as a sorted key. Used to detect
// when a new consumer widens the union and the observer must re-attach.
let observedAttrsKey = "";

function syncObserver() {
  // Guarded for SSR/module-eval safety, same as use-scheme.ts - this only
  // ever runs from subscribe/unsubscribe (client-side, post-mount), but
  // costs nothing to guard.
  if (typeof document === "undefined") return;

  const union = new Set<string>();
  for (const c of consumers) for (const a of c.attrs) union.add(a);

  if (union.size === 0) {
    observer?.disconnect();
    observer = null;
    observedAttrsKey = "";
    return;
  }

  // The filter is DERIVED from the live consumers, never hardcoded: the old
  // version pinned ["data-world", "data-scheme"] while the hook accepted
  // arbitrary attribute names, so a consumer watching anything else silently
  // never fired (R3-7). When the union widens, re-observe IN PLACE -
  // calling observe() again on the same node replaces the options per spec,
  // so the shared observer is never disconnected while consumers remain.
  // On shrink we keep the wider filter (handleMutations dispatches
  // per-consumer, so over-observing is harmless).
  const observed = new Set(observedAttrsKey.split(",").filter(Boolean));
  const covered = observer && [...union].every((a) => observed.has(a));
  if (covered) return;

  for (const a of observed) union.add(a);
  if (!observer) observer = new MutationObserver(handleMutations);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [...union],
  });
  observedAttrsKey = [...union].sort().join(",");
}

/**
 * Calls `onChange` whenever any of the given `attributes` change on
 * `document.documentElement` (e.g. `["data-scheme"]` or
 * `["data-world", "data-scheme"]`). Backed by a single shared MutationObserver
 * module-wide, refcounted across every consumer - N components watching
 * attributes cost one observer, not N.
 *
 * `onChange` does not need to be stable across renders (it's always read
 * from a ref); `attributes` should be referentially stable (e.g. a module-
 * level constant array) since its contents key the subscription effect.
 */
export function useAttributeObserver(
  attributes: string[],
  onChange: () => void,
): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Keyed on the attributes' *contents*, not array identity, so callers can
  // pass an inline array literal without re-subscribing every render.
  const attrsKey = attributes.join(",");

  useEffect(() => {
    const consumer: Consumer = {
      attrs: new Set(attrsKey.split(",").filter(Boolean)),
      onChange: () => onChangeRef.current(),
    };
    consumers = [...consumers, consumer];
    syncObserver();
    return () => {
      consumers = consumers.filter((c) => c !== consumer);
      syncObserver();
    };
    // `attrsKey` is the stable, content-derived stand-in for `attributes`;
    // `onChange` is read via `onChangeRef`, not a dependency - the deps
    // array below is deliberately just `[attrsKey]`.
  }, [attrsKey]);
}
