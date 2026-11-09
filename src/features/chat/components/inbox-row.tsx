"use client";

import Link from "next/link";
import type { ConversationItem } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { inboxTimeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ListingCover } from "./listing-cover";

const UNKNOWN_NAME = "Người dùng";

interface InboxRowProps {
  item: ConversationItem;
  /** The inbox of this side. The row links to `<basePath>/<id>`. */
  basePath: string;
  /** The current time from `useNow`, so "Hôm nay" and "Hôm qua" change at midnight. */
  now: Date;
}

/**
 * One conversation in the inbox (spec 0012, AC-6): the cover of the listing, the other person,
 * the listing, and the last message. The last message is plain text, shown with `{...}` and cut
 * to one line, with "Bạn:" in front when it is mine.
 */
export function InboxRow({ item, basePath, now }: InboxRowProps) {
  const name = item.otherUser.name ?? UNKNOWN_NAME;
  // Something from the other side that I have not read. Said three ways, never by color alone:
  // heavier text, a dot, and the words "chưa đọc" in the name of the link.
  const unread = item.unreadCount > 0;
  return (
    <li>
      <Link
        href={`${basePath}/${item.id}`}
        className={cn(
          FOCUS_RING,
          "flex gap-3 p-4 transition-colors hover:bg-accent focus-visible:ring-offset-0 focus-visible:ring-inset sm:px-5",
        )}
      >
        {/* Decorative: the title beside it already names the listing. */}
        <div aria-hidden="true" className="w-20 shrink-0 self-start">
          <ListingCover path={item.listing.coverImageUrl} sizes="80px" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <p
              className={cn(
                "truncate",
                unread ? "font-semibold" : "font-medium",
              )}
            >
              {name}
              {unread && <span className="sr-only">, chưa đọc</span>}
            </p>
            <span className="flex shrink-0 items-center gap-2">
              <time
                dateTime={item.lastMessageAt}
                className="text-sm text-muted-foreground"
              >
                {inboxTimeLabel(item.lastMessageAt, now)}
              </time>
              {unread && (
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full bg-primary"
                />
              )}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {item.listing.title}
          </p>
          <p
            className={cn(
              "truncate text-sm",
              unread ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {item.lastMessage.isMine && "Bạn: "}
            {item.lastMessage.body}
          </p>
        </div>
      </Link>
    </li>
  );
}
