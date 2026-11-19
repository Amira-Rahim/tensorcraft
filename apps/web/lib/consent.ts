/** Browser analytics always requires a current, explicit local choice. */
export const CONSENT_KEY = "tc-cookie-consent";
export const CONSENT_VERSION_KEY = "tc-cookie-consent-version";
export const CONSENT_VERSION = "2";
export const CONSENT_CHOICE_ID_KEY = "tc-cookie-consent-choice-id";
export const CONSENT_CHANGED_EVENT = "tc-consent-changed";
export const CONSENT_CHOICE_EVENT = "tc-consent-choice";

let forcedOff = false;

export type ConsentChoice = "accepted" | "declined" | null;
export type ConsentChoiceEvent = CustomEvent<{
  choice: ConsentChoice;
  choiceId: string;
}>;

export function getConsentChoice(): ConsentChoice {
  if (typeof window === "undefined" || forcedOff) return null;
  try {
    const choice = localStorage.getItem(CONSENT_KEY);
    // Keep an existing refusal. Only acceptance needs the new scope.
    if (choice === "declined") return "declined";
    // Version 2 adds an account choice for server analytics. An older browser
    // acceptance cannot silently opt an account into that new scope.
    if (localStorage.getItem(CONSENT_VERSION_KEY) !== CONSENT_VERSION)
      return null;
    return choice === "accepted" ? choice : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsentChoice() === "accepted";
}

export function getConsentChoiceId(): string | null {
  try {
    return localStorage.getItem(CONSENT_CHOICE_ID_KEY);
  } catch {
    return null;
  }
}

/** Publish a local change without manufacturing a new account opt-in. */
export function notifyConsentChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
  }
}

/** Explicit user action. Withdrawal takes effect in this browser immediately. */
export function setConsentChoice(choice: ConsentChoice): void {
  const choiceId = crypto.randomUUID();
  forcedOff = true;
  try {
    // Remove acceptance first, so a partial or failed storage write stays off.
    localStorage.removeItem(CONSENT_KEY);
    localStorage.setItem(CONSENT_VERSION_KEY, CONSENT_VERSION);
    localStorage.setItem(CONSENT_CHOICE_ID_KEY, choiceId);
    if (choice) localStorage.setItem(CONSENT_KEY, choice);
    forcedOff = false;
  } catch {
    // Consumers fail closed when the version or choice cannot be read.
  }
  notifyConsentChanged();
  window.dispatchEvent(
    new CustomEvent(CONSENT_CHOICE_EVENT, {
      detail: { choice, choiceId },
    }),
  );
}

/** A server withdrawal can stop browser capture, but never opt it in. */
export function clearConsentAfterAccountChange(): void {
  forcedOff = true;
  try {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(CONSENT_CHOICE_ID_KEY);
  } catch {
    // Blocked storage is already treated as no consent.
  }
  notifyConsentChanged();
}

export function onConsentChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  handler();
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_CHOICE_ID_KEY && event.newValue)
      forcedOff = false;
    if (
      event.key === CONSENT_KEY ||
      event.key === CONSENT_VERSION_KEY ||
      event.key === CONSENT_CHOICE_ID_KEY ||
      event.key === null
    )
      handler();
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
}
