"use client";

import {
  createContext,
  useContext,
  useCallback,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CharacterAvatar } from "@tensorcraft/ui/character-avatar";
import { ProseTextProvider } from "@tensorcraft/ui/prose-text";
import {
  lessonCharacterMatcher,
  type LessonCharacter,
} from "@/lib/lesson-characters";
import "./lesson-characters.css";

const TooltipScope = createContext<{
  active: string | null;
  setActive: Dispatch<SetStateAction<string | null>>;
} | null>(null);

function CharacterTooltipScope({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const value = useMemo(() => ({ active, setActive }), [active]);
  return (
    <TooltipScope.Provider value={value}>{children}</TooltipScope.Provider>
  );
}

export function LessonCharacters({
  worldSlug,
  children,
}: {
  worldSlug: string;
  children: ReactNode;
}) {
  const scope = useContext(TooltipScope);
  const annotate = useMemo(() => {
    const match = lessonCharacterMatcher(worldSlug);
    return (text: string) =>
      match(text).map((part, index) =>
        part.character ? (
          <CharacterMention key={index} character={part.character}>
            {part.text}
          </CharacterMention>
        ) : (
          part.text
        ),
      );
  }, [worldSlug]);
  const content = (
    <ProseTextProvider value={annotate}>{children}</ProseTextProvider>
  );
  return scope ? (
    content
  ) : (
    <CharacterTooltipScope>{content}</CharacterTooltipScope>
  );
}

function CharacterMention({
  character,
  children,
}: {
  character: LessonCharacter;
  children: string;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const hovering = useRef(false);
  const focused = useRef(false);
  const pointerType = useRef<string | null>(null);
  const { active, setActive } = useContext(TooltipScope)!;
  const open = active === id;
  const close = useCallback(() => {
    setActive((current) => (current === id ? null : current));
  }, [id, setActive]);
  const [position, setPosition] = useState<{ left: number; top: number }>();

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimer.current);
  }, []);
  function show() {
    cancelClose();
    setActive(id);
  }
  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (!hovering.current && !focused.current) close();
    }, 140);
  }
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(undefined);
      return;
    }
    function place() {
      if (!trigger.current || !card.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const box = card.current.getBoundingClientRect();
      const consent =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--tc-consent-h",
          ),
        ) || 0;
      const bottom = window.innerHeight - consent - 12;
      if (anchor.bottom < 0 || anchor.top > bottom) {
        close();
        return;
      }
      const left = Math.max(
        12,
        Math.min(anchor.left, window.innerWidth - box.width - 12),
      );
      const preferredTop = anchor.bottom + 10;
      const top = Math.max(
        12,
        Math.min(
          preferredTop + box.height <= bottom
            ? preferredTop
            : anchor.top - box.height - 10,
          bottom - box.height,
        ),
      );
      setPosition({ left, top });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    const observer = new ResizeObserver(place);
    if (card.current) observer.observe(card.current);
    function outside(event: PointerEvent) {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !card.current?.contains(event.target as Node)
      ) {
        close();
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancelClose();
        close();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, close, cancelClose]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="character-mention"
        data-character-mention={character.name}
        data-no-swipe
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          hovering.current = true;
          show();
        }}
        onPointerLeave={() => {
          hovering.current = false;
          scheduleClose();
        }}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onFocus={() => {
          focused.current = true;
          if (!pointerType.current) show();
        }}
        onBlur={() => {
          focused.current = false;
          scheduleClose();
        }}
        onClick={() => {
          if (pointerType.current !== "mouse")
            setActive((current) => (current === id ? null : id));
          else show();
          pointerType.current = null;
        }}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <div
            ref={card}
            id={id}
            role="tooltip"
            className="character-tooltip"
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              visibility: position ? "visible" : "hidden",
            }}
            onPointerEnter={() => {
              hovering.current = true;
              cancelClose();
            }}
            onPointerLeave={() => {
              hovering.current = false;
              scheduleClose();
            }}
          >
            <CharacterAvatar
              name={character.name}
              src={character.src}
              isAI={character.isAI}
              size={64}
            />
            <div className="character-tooltip-copy">
              <strong>{character.name}</strong>
              <p>{character.description}</p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
