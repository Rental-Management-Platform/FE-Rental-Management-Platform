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
  /**
   * Messages of the other side that came in while the person was reading older ones: those with a
   * `seq` above the last message that was on screen when the list was last at the bottom. It is
   * 0 whenever the list is at the bottom, and so it is reset by scrolling there by hand too.
   */
  unseen: number;
  /** Scrolls to the newest message. Behind the "Tin mới" button. */
  scrollToBottom: () => void;
}

/**
 * Keeps a list that grows at the bottom stuck to it (spec 0012, AC-12). A new message scrolls the
 * list down when it was at the bottom, or when it is mine (a message I just sent always shows).
 * A person reading older messages is left where they are, and `unseen` counts what they have not
 * been shown, for the "Tin mới" button.
 */
export function useStickyBottom(
  messages: readonly ChatMessage[],
): StickyBottom {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const lastSeq = messages.at(-1)?.seq;
  const lastIsMine = messages.at(-1)?.isMine ?? false;
  // The newest `seq` that was on screen while the list was at the bottom.
  const [seenSeq, setSeenSeq] = useState(lastSeq ?? 0);
  // What the list was doing when the last message arrived. It is a ref so that the effect below
  // runs for a new message only, and not each time the person scrolls.
  const wasAtBottom = useRef(true);

  // While the list is at the bottom, whatever is newest is on screen. Adjusting the state while
  // rendering, only when it differs, is the way React documents for a value that follows others.
  if (atBottom && lastSeq !== undefined && seenSeq !== lastSeq) {
    setSeenSeq(lastSeq);
  }

  useEffect(() => {
    wasAtBottom.current = atBottom;
  }, [atBottom]);

  // The newest message: scroll when the list was at the bottom or the message is mine. A list
  // that has just opened counts as at the bottom.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || lastSeq === undefined) return;
    // The scroll event this causes is what moves `atBottom` back to true.
    if (wasAtBottom.current || lastIsMine) {
      element.scrollTop = element.scrollHeight;
    }
  }, [lastSeq, lastIsMine]);

  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setAtBottom(distanceFromBottom(event.currentTarget) <= STICKY_BOTTOM_PX);
  }, []);

  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, []);

  const unseen = atBottom
    ? 0
    : messages.filter((message) => !message.isMine && message.seq > seenSeq)
        .length;

  return { scrollRef, onScroll, atBottom, unseen, scrollToBottom };
}
