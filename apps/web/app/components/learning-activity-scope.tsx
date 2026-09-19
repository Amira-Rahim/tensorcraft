"use client";

import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const ActivityUser = createContext<string | null>(null);
export const useActivityUser = () => useContext(ActivityUser);

export function LearningActivityScope({
  userId,
  children,
  requireServerIdentity = false,
}: {
  userId: string | null;
  children: ReactNode;
  requireServerIdentity?: boolean;
}) {
  return (
    <Scope
      key={userId ?? "guest"}
      userId={userId}
      requireServerIdentity={requireServerIdentity}
    >
      {children}
    </Scope>
  );
}
function Scope({
  userId,
  children,
  requireServerIdentity = false,
}: {
  userId: string | null;
  children: ReactNode;
  requireServerIdentity?: boolean;
}) {
  const [current, setCurrent] = useState(userId);
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) =>
      setCurrent(session?.user.id ?? null),
    );
    return () => subscription.unsubscribe();
  }, []);
  if (requireServerIdentity && current !== userId)
    return (
      <p role="status" className="p-6">
        Loading this account’s lesson.{" "}
        <button
          type="button"
          className="min-h-11 underline"
          onClick={() => window.location.reload()}
        >
          Reload if this takes too long
        </button>
      </p>
    );
  // Account changes discard rendered drafts immediately. Their scoped saved copy
  // remains available to its owner; a delayed request carries the expected UID.
  return (
    <ActivityUser.Provider value={current}>
      <Fragment key={current ?? "guest"}>{children}</Fragment>
    </ActivityUser.Provider>
  );
}
