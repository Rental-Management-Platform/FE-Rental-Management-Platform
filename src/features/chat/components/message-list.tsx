"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: readonly ChatMessage[];
  /** The name of the other person, for the screen reader prefix of their messages. */
  otherName: string;
}

/**
 * The messages of one conversation, oldest first (spec 0012, AC-8). The text is shown with `{body}`
 * and `pre-wrap`, so line breaks stay and a `<script>` is only letters: a message is never HTML
 * and a link in it is not made clickable (AC-22).
 *
 * This is the one region allowed to read message text aloud. `role="log"` is a polite live
 * region, which is how a message from the other side reaches a screen reader. The caller mounts
 * it only after the first messages are in, so the first thirty are not read in one breath.
 */
export function MessageList({ messages, otherName }: MessageListProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const lastSeq = messages.at(-1)?.seq;

  // The first cut: show the newest message when one arrives. The sticky bottom, the "Tin mới"
  // button and keeping the place when older messages load come with M3.
  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [lastSeq]);

  return (
    <div
      ref={scroller}
      role="log"
      aria-label="Tin nhắn"
      tabIndex={0}
      className={cn(
        FOCUS_RING,
        "max-h-[60dvh] min-h-40 overflow-y-auto rounded-lg",
      )}
    >
      <ul className="flex flex-col gap-3">
        {messages.map((message) => (
          <li
            key={message.seq}
            className={cn(
              "flex flex-col",
              message.isMine ? "items-end" : "items-start",
            )}
          >
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 break-words whitespace-pre-wrap",
                message.isMine
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <span className="sr-only">
                {message.isMine ? "Bạn" : otherName}:{" "}
              </span>
              {message.body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
