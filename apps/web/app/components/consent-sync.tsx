"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import {
  CONSENT_CHOICE_EVENT,
  type ConsentChoiceEvent,
} from "../../lib/consent";
import {
  CONSENT_SYNC_KEY,
  CONSENT_WITHDRAWAL_PREFIX,
  CONSENT_SYNC_RETRY_EVENT,
  createConsentSynchronizer,
} from "../../lib/consent-sync";

/** Sync consent independently of analytics initialization and identity capture. */
export function ConsentSync() {
  useEffect(() => {
    const sync = createConsentSynchronizer();
    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Do not await auth work from inside Supabase's auth callback.
      void sync.setSession(
        session
          ? {
              userId: session.user.id,
              accessToken: session.access_token,
            }
          : null,
      );
    });
    const choice = (event: Event) => {
      const { choice, choiceId } = (event as ConsentChoiceEvent).detail;
      void sync.choose(choice, choiceId);
    };
    const reconcile = () => {
      void sync.reconcile();
    };
    const storage = (event: StorageEvent) => {
      if (
        event.key === CONSENT_SYNC_KEY ||
        event.key?.startsWith(CONSENT_WITHDRAWAL_PREFIX) ||
        event.key === null
      )
        reconcile();
    };
    const visible = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    window.addEventListener(CONSENT_CHOICE_EVENT, choice);
    window.addEventListener(CONSENT_SYNC_RETRY_EVENT, reconcile);
    window.addEventListener("online", reconcile);
    window.addEventListener("focus", reconcile);
    window.addEventListener("storage", storage);
    document.addEventListener("visibilitychange", visible);
    return () => {
      sync.dispose();
      subscription.unsubscribe();
      window.removeEventListener(CONSENT_CHOICE_EVENT, choice);
      window.removeEventListener(CONSENT_SYNC_RETRY_EVENT, reconcile);
      window.removeEventListener("online", reconcile);
      window.removeEventListener("focus", reconcile);
      window.removeEventListener("storage", storage);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return null;
}
