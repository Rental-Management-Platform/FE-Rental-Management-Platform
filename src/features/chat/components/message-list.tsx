"use client";

import { ArrowDownIcon } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { ChatMessage } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { chatDayLabel, formatClock, isSameChatDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OlderMessages } from "../hooks/use-older-messages";
import type { StickyBottom } from "../hooks/use-sticky-bottom";

interface MessageListProps extends Pick<
  StickyBottom,
  "scrollRef" | "onScroll" | "unseen" | "scrollToBottom"
> {
  messages: readonly ChatMessage[];
  /** The name of the other person, for the screen reader prefix of their messages. */
  otherName: string;
  /** From `useNow`, so the divider says "Hôm nay" until midnight and "Hôm qua" after it. */
  now: Date;
  /** "Xem tin cũ hơn": its state, and whether older messages are going in right now. */
  older: OlderMessages;
}

/**
 * The messages of one conversation, oldest first (spec 0012, AC-8 and AC-11 to AC-13). The text is
 * shown with `{body}` and `pre-wrap`, so line breaks stay and a `<script>` is only letters: a
 * message is never HTML and a link in it is not made clickable (AC-22).
 *
 * This is the one region allowed to read message text aloud. `role="log"` is a polite live region,
 * which is how a message from the other side reaches a screen reader. The caller mounts it only
 * after the first messages are in, so the first thirty are not read in one breath. While older
 * messages are inserted the live announcements are turned off, so those are not read either.
 *
 * It fills the height its parent gives it and scrolls inside. The scrolling is the caller's
 * (`useStickyBottom`), so what it knows about the bottom can also decide when the conversation
 * counts as read.
 */
export function MessageList({
  messages,
  otherName,
  now,
  older,
  scrollRef,
  onScroll,
  unseen,
  scrollToBottom,
}: MessageListProps) {
  const oldest = messages[0];
  // `seq` has no gaps and starts at 1, so anything above 1 means older messages exist.
  const hasOlder = oldest !== undefined && oldest.seq > 1;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-label="Tin nhắn"
        aria-live={older.quiet ? "off" : undefined}
        tabIndex={0}
        className={cn(
          FOCUS_RING,
          "h-full overflow-y-auto px-4 py-3 focus-visible:ring-offset-0 focus-visible:ring-inset",
        )}
      >
        {hasOlder && (
          <div className="flex flex-col items-center gap-2 pb-3">
            {older.isError && (
              <p className="text-sm text-destructive">
                Không tải được tin cũ hơn.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-disabled={older.isPending || undefined}
              onClick={() => {
                if (!older.isPending) older.load(oldest.seq);
              }}
            >
              {older.isPending && <Spinner size="sm" />}
              {older.isPending
                ? "Đang tải"
                : older.isError
                  ? "Thử lại"
                  : "Xem tin cũ hơn"}
            </Button>
          </div>
        )}

        {/* The list is pushed to the bottom when it is short, and scrolls when it is long. */}
        <ul className="flex min-h-full flex-col justify-end gap-3">
          {messages.map((message, index) => (
            <Fragment key={message.seq}>
              {index > 0 &&
                !isSameChatDay(
                  messages[index - 1].createdAt,
                  message.createdAt,
                ) && (
                  <li className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
                    <Separator className="flex-1" />
                    <span>{chatDayLabel(message.createdAt, now)}</span>
                    <Separator className="flex-1" />
                  </li>
                )}
              <li
                className={cn(
                  "flex flex-col gap-0.5",
                  message.isMine ? "items-end" : "items-start",
                )}
              >
                <p
                  className={cn(
                    // A long line is hard to read, so from `md` a bubble stops growing at a readable width.
                    "max-w-[85%] rounded-2xl px-4 py-2 break-words whitespace-pre-wrap md:max-w-xl",
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
                <time
                  dateTime={message.createdAt}
                  className="px-1 text-xs text-muted-foreground"
                >
                  {formatClock(message.createdAt)}
                </time>
              </li>
            </Fragment>
          ))}
        </ul>
      </div>

      {/* Outside the log region, so it is not read as a message. It counts what the person has
          not been shown, and goes away when the list is at the bottom again. */}
      {unseen > 0 && (
        <Button
          type="button"
          size="sm"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-md"
          onClick={scrollToBottom}
        >
          <ArrowDownIcon data-icon="inline-start" aria-hidden="true" />
          Tin mới ({unseen})
        </Button>
      )}
    </div>
  );
}
