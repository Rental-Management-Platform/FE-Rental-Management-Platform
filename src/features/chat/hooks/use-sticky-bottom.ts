"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type UIEvent,
} from "react";
import type { ChatMessage } from "@/lib/api/types";

/** How far from the bottom still counts as at the bottom, in pixels (spec 0012, AC-12). */
export const STICKY_BOTTOM_PX = 80;

const distanceFromBottom = (element: HTMLElement) =>
  element.scrollHeight - element.scrollTop - element.clientHeight;

export interface StickyBottom {
  /** Goes on the scrolling element. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Goes on the same element. */
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  /** True while the list is within 80 px of its bottom. Marking as read depends on it. */
  atBottom: boolean;
}

/**
 * Keeps a list that grows at the bottom stuck to it (spec 0012, AC-12). A new message scrolls the
 * list down when it was at the bottom, or when it is mine (a message I just sent always shows).
 * A person reading older messages is left where they are.
 *
 * It is a first cut for marking as read: the "Tin mới" button, the place kept while older
 * messages load and the on screen keyboard come with M3.
 */
export function useStickyBottom(
  messages: readonly ChatMessage[],
): StickyBottom {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const lastSeq = messages.at(-1)?.seq;
  const lastIsMine = messages.at(-1)?.isMine ?? false;
  // What the list was doing when the last message arrived. It is a ref so that the effect below
  // runs for a new message only, and not each time the person scrolls.
  const wasAtBottom = useRef(true);

  useEffect(() => {
    wasAtBottom.current = atBottom;
  }, [atBottom]);

  // The newest message: scroll when the list was at the bottom or the message is mine. A list
  // that has just opened counts as at the bottom.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || lastSeq === undefined) return;
    if (wasAtBottom.current || lastIsMine) {
      element.scrollTop = element.scrollHeight;
      setAtBottom(true);
    }
  }, [lastSeq, lastIsMine]);

  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setAtBottom(distanceFromBottom(event.currentTarget) <= STICKY_BOTTOM_PX);
  }, []);

  return { scrollRef, onScroll, atBottom };
}
