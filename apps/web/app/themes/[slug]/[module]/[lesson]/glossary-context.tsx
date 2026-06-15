"use client";
import { createContext, useContext, useState, useCallback } from "react";

interface GlossaryCtx {
  activeTerm: string | null;
  setActiveTerm: (t: string | null) => void;
}
const Ctx = createContext<GlossaryCtx>({
  activeTerm: null,
  setActiveTerm: () => {},
});

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  const [activeTerm, setActive] = useState<string | null>(null);
  const setActiveTerm = useCallback((t: string | null) => setActive(t), []);
  return (
    <Ctx.Provider value={{ activeTerm, setActiveTerm }}>
      {children}
    </Ctx.Provider>
  );
}

export const useGlossary = () => useContext(Ctx);
